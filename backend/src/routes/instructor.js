const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const AdminAction = require('../models/AdminAction');
const AnalyticsService = require('../services/analyticsService');
const ReferralService = require('../services/referralService');
const ExportService = require('../services/exportService');
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
router.post('/add-student', validate('register'), async (req, res) => {
  try {
    const { email, username, password, referralCode } = req.validatedBody;

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

    // Validate referral code if provided (optional for instructor)
    let referrerId = null;
    if (referralCode) {
      const referrer = await User.findByReferralCode(referralCode);
      if (!referrer) {
        return res.status(400).json({
          error: 'Invalid referral code',
          code: 'INVALID_REFERRAL_CODE'
        });
      }

      // Ensure referrer is approved
      if (referrer.role === 'student' && referrer.approval_status !== 'approved') {
        return res.status(400).json({
          error: 'This referral link is not active',
          code: 'REFERRER_NOT_APPROVED'
        });
      }

      referrerId = referrer.id;
    }

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
      referred_by_id: referrerId,
      approval_status: 'approved'  // Auto-approved
    });

    // Distribute commissions immediately if referrer exists
    if (referrerId) {
      const CommissionService = require('../services/commissionService');
      await CommissionService.distributeCommissions(
        userId,
        username,
        referrerId
      );
    }

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
      message: 'Student account created successfully',
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
    console.error('Add student error:', error);
    res.status(500).json({
      error: 'Failed to create student account',
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
        message: `${amount} NexusCoins injected to ${user.username}`,
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
 * Pause the simulation
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
        message: 'Simulation paused',
        status: 'paused'
      }
    });
  } catch (error) {
    console.error('Pause error:', error);
    res.status(500).json({
      error: 'Failed to pause simulation',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/resume
 * Resume the simulation
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
        message: 'Simulation resumed',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Resume error:', error);
    res.status(500).json({
      error: 'Failed to resume simulation',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/reset
 * Reset simulation (full or soft)
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
      error: 'Failed to reset simulation',
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

module.exports = router;
