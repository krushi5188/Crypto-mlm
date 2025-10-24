const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const AdminAction = require('../models/AdminAction');
const FraudAlert = require('../models/FraudAlert');
const AnalyticsService = require('../services/analyticsService');
const ReferralService = require('../services/referralService');
const ExportService = require('../services/exportService');
const FraudDetection = require('../utils/fraudDetection');
const { authenticate } = require('../middleware/auth');
const { requireInstructor } = require('../middleware/roleAuth');
const { validate } = require('../utils/validation');
const { pool } = require('../config/database');

// Apply authentication and instructor role to all routes
router.use(authenticate);
router.use(requireInstructor);

/**
 * GET /api/v1/instructor/analytics
 * Get comprehensive analytics dashboard data
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getComprehensiveAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to load analytics',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/participants
 * Get searchable, sortable participant list
 */
router.get('/participants', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'desc';
    const search = req.query.search || '';

    const { participants, total } = await User.getAllStudents(
      page,
      limit,
      sortBy,
      sortOrder.toUpperCase(),
      search
    );

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        participants: participants.map(p => ({
          id: p.id,
          email: p.email,
          username: p.username,
          balance: parseFloat(p.balance),
          totalEarned: parseFloat(p.total_earned),
          directRecruits: p.direct_recruits,
          networkSize: p.network_size,
          referredBy: p.referred_by_id,
          approvalStatus: p.approval_status || 'approved',
          joinedAt: p.created_at,
          lastLogin: p.last_login
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Participants error:', error);
    res.status(500).json({
      error: 'Failed to load participants',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/participants/:id
 * Get detailed information for specific participant
 */
router.get('/participants/:id', async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);

    const participant = await User.findById(participantId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    // Get upline chain
    const uplineChain = await ReferralService.getUplineChain(participantId);

    // Get downline grouped by level
    const downlineByLevel = await require('../models/Referral').getDownlineGrouped(participantId);

    // Get recent transactions
    const { transactions } = await Transaction.getUserTransactions(participantId, 1, 20);

    // Get referrer info
    let referredBy = null;
    if (participant.referred_by_id) {
      const referrer = await User.findById(participant.referred_by_id);
      if (referrer) {
        referredBy = {
          id: referrer.id,
          username: referrer.username
        };
      }
    }

    // Log view action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'view_participant',
      target_user_id: participantId,
      details: { username: participant.username },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        participant: {
          id: participant.id,
          email: participant.email,
          username: participant.username,
          balance: parseFloat(participant.balance),
          totalEarned: parseFloat(participant.total_earned),
          directRecruits: participant.direct_recruits,
          networkSize: participant.network_size,
          referredBy,
          joinedAt: participant.created_at,
          lastLogin: participant.last_login
        },
        uplineChain,
        downlineByLevel,
        recentTransactions: transactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount),
          type: t.type,
          description: t.description,
          createdAt: t.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Participant detail error:', error);
    res.status(500).json({
      error: 'Failed to load participant details',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/participants/:id/approve
 * Approve a pending student registration
 */
router.post('/participants/:id/approve', async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);

    // Get participant
    const participant = await User.findById(participantId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    if (participant.approval_status === 'approved') {
      return res.status(400).json({
        error: 'Participant is already approved',
        code: 'ALREADY_APPROVED'
      });
    }

    // Update approval status
    await pool.query(
      'UPDATE users SET approval_status = $1 WHERE id = $2',
      ['approved', participantId]
    );

    // NOW distribute commissions to referrer (was skipped during registration)
    if (participant.referred_by_id) {
      const CommissionService = require('../services/commissionService');
      await CommissionService.distributeCommissions(
        participantId,
        participant.username,
        participant.referred_by_id
      );
    }

    // Log admin action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'view_participant',
      target_user_id: participantId,
      details: { action: 'approved', username: participant.username },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${participant.username} has been approved`,
        participantId,
        status: 'approved'
      }
    });
  } catch (error) {
    console.error('Approve participant error:', error);
    res.status(500).json({
      error: 'Failed to approve participant',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/participants/:id/reject
 * Reject a pending student registration
 */
router.post('/participants/:id/reject', async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);
    const { reason } = req.body;

    // Get participant
    const participant = await User.findById(participantId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    if (participant.approval_status === 'approved') {
      return res.status(400).json({
        error: 'Cannot reject an already approved participant',
        code: 'ALREADY_APPROVED'
      });
    }

    // Update approval status
    await pool.query(
      'UPDATE users SET approval_status = $1 WHERE id = $2',
      ['rejected', participantId]
    );

    // Log admin action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'view_participant',
      target_user_id: participantId,
      details: { action: 'rejected', username: participant.username, reason },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${participant.username} has been rejected`,
        participantId,
        status: 'rejected'
      }
    });
  } catch (error) {
    console.error('Reject participant error:', error);
    res.status(500).json({
      error: 'Failed to reject participant',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/add-student
 * Instructor directly adds a new student (auto-approved, no approval needed)
 */
router.post('/add-student', validate('instructorAddMember'), async (req, res) => {
  try {
    const { email, username, password } = req.validatedBody;

    // Check participant limit
    const participantCount = await User.countStudents();
    const maxParticipants = await SystemConfig.get('max_participants');

    if (participantCount >= maxParticipants) {
      return res.status(403).json({
        error: 'Participant limit reached',
        code: 'PARTICIPANT_LIMIT_REACHED'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        error: 'Email already registered',
        code: 'EMAIL_TAKEN'
      });
    }

    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Username already taken',
        code: 'USERNAME_TAKEN'
      });
    }

    // Use instructor as referrer (all participants created by instructor are under them)
    const referrerId = req.user.id;

    // Hash password
    const { hashPassword } = require('../utils/passwordHash');
    const password_hash = await hashPassword(password);

    // Generate unique referral code
    const { generateReferralCode } = require('../utils/generateReferralCode');
    const newReferralCode = await generateReferralCode();

    // Create user with APPROVED status (no approval needed for instructor-added users)
    const userId = await User.create({
      email,
      username,
      password_hash,
      role: 'student',
      referral_code: newReferralCode,
      referred_by_id: referrerId
    });

    // Distribute commissions immediately to instructor
    const CommissionService = require('../services/commissionService');
    await CommissionService.distributeCommissions(
      userId,
      username,
      referrerId
    );

    // Get created user
    const user = await User.findById(userId);

    // Log admin action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'add_student',
      target_user_id: userId,
      details: { username, email, referrer_id: referrerId },
      ip_address: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Member account created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          referralCode: user.referral_code,
          approvalStatus: 'approved',
          balance: parseFloat(user.balance)
        }
      }
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      error: 'Failed to create member account',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/network-graph
 * Get complete network visualization data
 */
router.get('/network-graph', async (req, res) => {
  try {
    const networkGraph = await ReferralService.getCompleteNetworkGraph();

    res.json({
      success: true,
      data: networkGraph
    });
  } catch (error) {
    console.error('Network graph error:', error);
    res.status(500).json({
      error: 'Failed to load network graph',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/inject-coins
 * Manually add coins to participant account
 */
router.post('/inject-coins', validate('injectCoins'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { userId, amount, note } = req.validatedBody;

    await connection.beginTransaction();

    // Verify user exists and is a student
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      await connection.rollback();
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    // Update balance
    await User.updateBalance(userId, amount, connection);

    // Get new balance
    const [balanceResult] = await connection.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    const balanceAfter = balanceResult[0].balance;

    // Create transaction record
    const transactionId = await Transaction.create({
      user_id: userId,
      amount,
      type: 'injection',
      description: note || `Manual coin injection by instructor`,
      balance_after: balanceAfter
    }, connection);

    // Log admin action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'inject_coins',
      target_user_id: userId,
      details: { amount, note, transaction_id: transactionId },
      ip_address: req.ip
    });

    await connection.commit();

    res.json({
      success: true,
      data: {
        message: `${amount} USDT injected to ${user.username}`,
        transaction: {
          id: transactionId,
          userId,
          amount,
          type: 'injection',
          balanceAfter: parseFloat(balanceAfter),
          createdAt: new Date()
        }
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Inject coins error:', error);
    res.status(500).json({
      error: 'Failed to inject coins',
      code: 'DATABASE_ERROR'
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/v1/instructor/pause
 * Pause the system
 */
router.post('/pause', async (req, res) => {
  try {
    await SystemConfig.set('simulation_status', 'paused', req.user.username);

    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'pause',
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: 'System paused',
        status: 'paused'
      }
    });
  } catch (error) {
    console.error('Pause error:', error);
    res.status(500).json({
      error: 'Failed to pause system',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/resume
 * Resume the system
 */
router.post('/resume', async (req, res) => {
  try {
    await SystemConfig.set('simulation_status', 'active', req.user.username);

    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'resume',
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: 'System resumed',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Resume error:', error);
    res.status(500).json({
      error: 'Failed to resume system',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/reset
 * Reset system (full or soft)
 */
router.post('/reset', validate('reset'), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { type, confirm } = req.validatedBody;

    if (!confirm) {
      return res.status(400).json({
        error: 'Reset must be confirmed',
        code: 'VALIDATION_ERROR'
      });
    }

    await connection.beginTransaction();

    let participantsAffected = 0;

    if (type === 'full') {
      // Full reset: Delete all students
      const [countResult] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
      );
      participantsAffected = countResult[0].count;

      // Delete students (CASCADE will delete referrals, transactions, admin_actions)
      await connection.query("DELETE FROM users WHERE role = 'student'");

      // Reset system totals
      await connection.query(
        `UPDATE system_config SET config_value = '0'
         WHERE config_key IN ('total_coins_distributed', 'total_recruitment_fees')`
      );
    } else if (type === 'soft') {
      // Soft reset: Reset balances but keep accounts
      const [countResult] = await connection.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
      );
      participantsAffected = countResult[0].count;

      // Reset user balances and stats
      await connection.query(
        `UPDATE users SET
         balance = 0,
         total_earned = 0,
         direct_recruits = 0,
         network_size = 0
         WHERE role = 'student'`
      );

      // Delete transactions and referrals
      await connection.query("DELETE FROM transactions");
      await connection.query("DELETE FROM referrals");

      // Reset system totals
      await connection.query(
        `UPDATE system_config SET config_value = '0'
         WHERE config_key IN ('total_coins_distributed', 'total_recruitment_fees')`
      );
    }

    // Log admin action
    await connection.query(
      `INSERT INTO admin_actions (admin_id, action_type, details, ip_address)
       VALUES (?, 'reset', ?, ?)`,
      [req.user.id, JSON.stringify({ type, participants_affected: participantsAffected }), req.ip]
    );

    await connection.commit();

    res.json({
      success: true,
      data: {
        message: `${type === 'full' ? 'Full' : 'Soft'} reset completed`,
        participantsAffected
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Reset error:', error);
    res.status(500).json({
      error: 'Failed to reset system',
      code: 'DATABASE_ERROR'
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/v1/instructor/export
 * Export data to CSV/JSON
 */
router.post('/export', validate('export'), async (req, res) => {
  try {
    const { exportType, format } = req.validatedBody;

    const { filepath, filename, contentType } = await ExportService.exportData(exportType, format);

    // Log admin action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'export_data',
      details: { export_type: exportType, format },
      ip_address: req.ip
    });

    // Send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filepath, (err) => {
      if (err) {
        console.error('File send error:', err);
      }
      // Clean up file after sending
      require('fs').unlink(filepath, () => {});
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export data',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * PUT /api/v1/instructor/config
 * Update system configuration
 */
router.put('/config', validate('updateConfig'), async (req, res) => {
  try {
    const updates = req.validatedBody;
    const updatedKeys = [];

    for (const [key, value] of Object.entries(updates)) {
      const success = await SystemConfig.set(key, value, req.user.username);
      if (success) {
        updatedKeys.push(key);

        // Log each config change
        await AdminAction.log({
          admin_id: req.user.id,
          action_type: 'config_change',
          details: { key, new_value: value },
          ip_address: req.ip
        });
      }
    }

    res.json({
      success: true,
      data: {
        message: 'Configuration updated',
        updatedKeys
      }
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      code: 'DATABASE_ERROR'
    });
  }
});

// ============================================
// FRAUD DETECTION ENDPOINTS
// ============================================

/**
 * GET /api/v1/instructor/fraud-detection/dashboard
 * Get fraud detection dashboard statistics
 */
router.get('/fraud-detection/dashboard', async (req, res) => {
  try {
    const stats = await FraudDetection.getDashboardStats();

    // Get recent high-risk users
    const highRiskUsers = await pool.query(
      `SELECT id, username, email, risk_score, is_flagged, created_at
       FROM users
       WHERE role = 'student' AND risk_score >= 51
       ORDER BY risk_score DESC
       LIMIT 10`
    );

    // Get recent security events
    const recentEvents = await pool.query(
      `SELECT * FROM security_events
       WHERE created_at > NOW() - INTERVAL '24 hours'
       ORDER BY created_at DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      data: {
        stats,
        highRiskUsers: highRiskUsers.rows,
        recentEvents: recentEvents.rows
      }
    });
  } catch (error) {
    console.error('Fraud dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load fraud detection dashboard',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/fraud-detection/flagged-users
 * Get list of flagged users
 */
router.get('/fraud-detection/flagged-users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        u.id, u.username, u.email, u.risk_score,
        u.is_flagged, u.flagged_at, u.flagged_reason,
        u.created_at, u.last_login,
        reviewer.username as reviewed_by_name
       FROM users u
       LEFT JOIN users reviewer ON u.reviewed_by = reviewer.id
       WHERE u.is_flagged = true
       ORDER BY u.flagged_at DESC`
    );

    res.json({
      success: true,
      data: {
        flaggedUsers: result.rows
      }
    });
  } catch (error) {
    console.error('Flagged users error:', error);
    res.status(500).json({
      error: 'Failed to load flagged users',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/fraud-detection/user/:id
 * Get detailed fraud analysis for specific user
 */
router.get('/fraud-detection/user/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Recalculate risk score
    const riskAnalysis = await FraudDetection.calculateRiskScore(userId);

    // Get all IPs used by this user
    const ips = await pool.query(
      `SELECT ip_address, first_seen_at, last_seen_at, login_count, is_suspicious
       FROM ip_addresses
       WHERE user_id = $1
       ORDER BY last_seen_at DESC`,
      [userId]
    );

    // Get all devices used
    const devices = await pool.query(
      `SELECT fingerprint_hash, browser, os, device_type, first_seen_at, last_seen_at, login_count
       FROM device_fingerprints
       WHERE user_id = $1
       ORDER BY last_seen_at DESC`,
      [userId]
    );

    // Find related accounts
    const relatedAccounts = await FraudDetection.findRelatedAccounts(userId);

    // Get fraud alerts for this user
    const alerts = await FraudAlert.getByUserId(userId);

    // Get login history
    const loginHistory = await pool.query(
      `SELECT ip_address, user_agent, success, failure_reason, created_at
       FROM login_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          risk_score: user.risk_score,
          is_flagged: user.is_flagged,
          flagged_reason: user.flagged_reason,
          created_at: user.created_at
        },
        riskAnalysis,
        ipAddresses: ips.rows,
        devices: devices.rows,
        relatedAccounts,
        alerts,
        loginHistory: loginHistory.rows
      }
    });
  } catch (error) {
    console.error('User fraud detail error:', error);
    res.status(500).json({
      error: 'Failed to load user fraud details',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/fraud-detection/flag/:id
 * Manually flag a user for review
 */
router.post('/fraud-detection/flag/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Reason is required',
        code: 'VALIDATION_ERROR'
      });
    }

    await FraudDetection.flagUser(userId, reason, req.user.id);

    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'view_participant',
      target_user_id: userId,
      details: { action: 'flagged', reason },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: 'User flagged successfully'
      }
    });
  } catch (error) {
    console.error('Flag user error:', error);
    res.status(500).json({
      error: 'Failed to flag user',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/fraud-detection/unflag/:id
 * Unflag a user after review
 */
router.post('/fraud-detection/unflag/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { notes } = req.body;

    await FraudDetection.unflagUser(userId, req.user.id, notes);

    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'view_participant',
      target_user_id: userId,
      details: { action: 'unflagged', notes },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: 'User unflagged successfully'
      }
    });
  } catch (error) {
    console.error('Unflag user error:', error);
    res.status(500).json({
      error: 'Failed to unflag user',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/fraud-detection/multi-accounts
 * Find potential multi-account users
 */
router.get('/fraud-detection/multi-accounts', async (req, res) => {
  try {
    // Find accounts sharing IPs
    const sharedIPs = await pool.query(
      `SELECT
        ip_address,
        array_agg(DISTINCT user_id) as user_ids,
        array_agg(DISTINCT u.username) as usernames,
        COUNT(DISTINCT user_id) as account_count
       FROM ip_addresses ip
       JOIN users u ON ip.user_id = u.id
       GROUP BY ip_address
       HAVING COUNT(DISTINCT user_id) > 1
       ORDER BY account_count DESC`
    );

    // Find accounts sharing devices
    const sharedDevices = await pool.query(
      `SELECT
        fingerprint_hash,
        array_agg(DISTINCT user_id) as user_ids,
        array_agg(DISTINCT u.username) as usernames,
        COUNT(DISTINCT user_id) as account_count
       FROM device_fingerprints df
       JOIN users u ON df.user_id = u.id
       GROUP BY fingerprint_hash
       HAVING COUNT(DISTINCT user_id) > 1
       ORDER BY account_count DESC`
    );

    res.json({
      success: true,
      data: {
        sharedIPs: sharedIPs.rows,
        sharedDevices: sharedDevices.rows
      }
    });
  } catch (error) {
    console.error('Multi-accounts error:', error);
    res.status(500).json({
      error: 'Failed to detect multi-accounts',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/instructor/fraud-detection/alerts
 * Get fraud alerts with filters
 */
router.get('/fraud-detection/alerts', async (req, res) => {
  try {
    const { status, severity, limit, offset } = req.query;

    const alerts = await FraudAlert.getAll({
      status,
      severity,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    res.json({
      success: true,
      data: {
        alerts
      }
    });
  } catch (error) {
    console.error('Fraud alerts error:', error);
    res.status(500).json({
      error: 'Failed to load fraud alerts',
      code: 'DATABASE_ERROR'
    });
  }
});

module.exports = router;
