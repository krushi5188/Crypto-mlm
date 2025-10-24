const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');
const AdminAction = require('../models/AdminAction');
const AnalyticsService = require('../services/analyticsService');
const ReferralService = require('../services/referralService');
const ExportService = require('../services/exportService');
const predictiveAnalyticsService = require('../services/predictiveAnalyticsService');
const campaignService = require('../services/campaignService');
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
 * PREDICTIVE ANALYTICS ENDPOINTS (INSTRUCTOR)
 */

// GET /api/v1/instructor/analytics/churn-risks - Get users at risk
router.get('/analytics/churn-risks', async (req, res) => {
  try {
    const riskLevel = req.query.riskLevel || 'all';
    const limit = parseInt(req.query.limit) || 50;
    
    const users = await predictiveAnalyticsService.getChurnRiskUsers(riskLevel, limit);
    
    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          userId: u.user_id,
          email: u.email,
          username: u.username,
          balance: parseFloat(u.balance),
          churnRiskScore: parseFloat(u.churn_risk_score),
          churnRiskLevel: u.churn_risk_level,
          daysInactive: parseInt(u.days_inactive),
          lastActivityDate: u.last_activity_date,
          avgMonthlyEarnings: parseFloat(u.avg_monthly_earnings),
          earningsGrowthRate: parseFloat(u.earnings_growth_rate)
        }))
      }
    });
  } catch (error) {
    console.error('Churn risks error:', error);
    res.status(500).json({
      error: 'Failed to load churn risk data',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/instructor/analytics/network-forecast - Get network growth forecast
router.get('/analytics/network-forecast', async (req, res) => {
  try {
    const forecastType = req.query.forecastType || 'daily';
    const limit = parseInt(req.query.limit) || 30;
    
    const forecasts = await predictiveAnalyticsService.getNetworkForecasts(forecastType, limit);
    
    res.json({
      success: true,
      data: {
        forecasts: forecasts.map(f => ({
          forecastDate: f.forecast_date,
          predictedNewUsers: parseInt(f.predicted_new_users),
          predictedTotalUsers: parseInt(f.predicted_total_users),
          predictedTotalEarnings: parseFloat(f.predicted_total_earnings),
          predictedActiveUsers: parseInt(f.predicted_active_users),
          confidenceLevel: parseFloat(f.confidence_level),
          lowerBound: parseFloat(f.lower_bound),
          upperBound: parseFloat(f.upper_bound),
          createdAt: f.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Network forecast error:', error);
    res.status(500).json({
      error: 'Failed to load network forecast',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/instructor/analytics/calculate-forecast - Generate new forecast
router.post('/analytics/calculate-forecast', async (req, res) => {
  try {
    const forecastType = req.body.forecastType || 'daily';
    const daysAhead = parseInt(req.body.daysAhead) || 30;
    
    const forecasts = await predictiveAnalyticsService.calculateNetworkForecast(forecastType, daysAhead);
    
    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'calculate_forecast',
      details: { forecast_type: forecastType, days_ahead: daysAhead },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      data: {
        message: 'Network forecast calculated successfully',
        forecastsGenerated: forecasts.length
      }
    });
  } catch (error) {
    console.error('Calculate forecast error:', error);
    res.status(500).json({
      error: 'Failed to calculate forecast',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/instructor/analytics/top-performers - Get top performing users
router.get('/analytics/top-performers', async (req, res) => {
  try {
    const metric = req.query.metric || 'earnings';
    const limit = parseInt(req.query.limit) || 10;
    
    const performers = await predictiveAnalyticsService.getTopPerformers(metric, limit);
    
    res.json({
      success: true,
      data: {
        performers: performers.map(p => ({
          userId: p.user_id,
          username: p.username,
          email: p.email,
          balance: parseFloat(p.balance),
          avgDailyEarnings: parseFloat(p.avg_daily_earnings),
          avgWeeklyEarnings: parseFloat(p.avg_weekly_earnings),
          avgMonthlyEarnings: parseFloat(p.avg_monthly_earnings),
          earningsGrowthRate: parseFloat(p.earnings_growth_rate),
          avgWeeklyRecruits: parseFloat(p.avg_weekly_recruits),
          networkGrowthRate: parseFloat(p.network_growth_rate)
        }))
      }
    });
  } catch (error) {
    console.error('Top performers error:', error);
    res.status(500).json({
      error: 'Failed to load top performers',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/instructor/analytics/bulk-calculate - Calculate analytics for all users
router.post('/analytics/bulk-calculate', async (req, res) => {
  try {
    const userIdsQuery = await pool.query(
      'SELECT id FROM users WHERE role = $1 ORDER BY id ASC',
      ['student']
    );
    
    const userIds = userIdsQuery.rows.map(row => row.id);
    let calculated = 0;
    let errors = 0;
    
    for (const userId of userIds) {
      try {
        await predictiveAnalyticsService.calculateUserAnalytics(userId);
        calculated++;
      } catch (error) {
        console.error(`Failed to calculate analytics for user ${userId}:`, error);
        errors++;
      }
    }
    
    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'bulk_calculate_analytics',
      details: { total_users: userIds.length, calculated, errors },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      data: {
        message: 'Bulk analytics calculation completed',
        totalUsers: userIds.length,
        calculated,
        errors
      }
    });
  } catch (error) {
    console.error('Bulk calculate error:', error);
    res.status(500).json({
      error: 'Failed to bulk calculate analytics',
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

/**
 * POST /api/v1/instructor/bulk-approve
 * Approve multiple participants at once
 */
router.post('/bulk-approve', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid user IDs array',
        code: 'VALIDATION_ERROR'
      });
    }

    let approvedCount = 0;
    const errors = [];

    for (const userId of userIds) {
      try {
        const participant = await User.findById(userId);

        if (participant && participant.role === 'student' && participant.approval_status !== 'approved') {
          await pool.query(
            'UPDATE users SET approval_status = $1 WHERE id = $2',
            ['approved', userId]
          );

          // Distribute commissions if has referrer
          if (participant.referred_by_id) {
            const CommissionService = require('../services/commissionService');
            await CommissionService.distributeCommissions(
              userId,
              participant.username,
              participant.referred_by_id
            );
          }

          approvedCount++;
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    // Log bulk action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'bulk_approve',
      details: { user_ids: userIds, approved_count: approvedCount, errors },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${approvedCount} participants approved`,
        approvedCount,
        totalRequested: userIds.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({
      error: 'Failed to approve participants',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/bulk-reject
 * Reject multiple participants at once
 */
router.post('/bulk-reject', async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid user IDs array',
        code: 'VALIDATION_ERROR'
      });
    }

    let rejectedCount = 0;
    const errors = [];

    for (const userId of userIds) {
      try {
        const participant = await User.findById(userId);

        if (participant && participant.role === 'student' && participant.approval_status !== 'approved') {
          await pool.query(
            'UPDATE users SET approval_status = $1 WHERE id = $2',
            ['rejected', userId]
          );
          rejectedCount++;
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    // Log bulk action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'bulk_reject',
      details: { user_ids: userIds, rejected_count: rejectedCount, reason, errors },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${rejectedCount} participants rejected`,
        rejectedCount,
        totalRequested: userIds.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({
      error: 'Failed to reject participants',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/participants/:id/freeze
 * Freeze a user account
 */
router.post('/participants/:id/freeze', async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);
    const { reason } = req.body;

    const participant = await User.findById(participantId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    // Update account status to frozen
    await pool.query(
      'UPDATE users SET account_status = $1 WHERE id = $2',
      ['frozen', participantId]
    );

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'freeze_account',
      target_user_id: participantId,
      details: { username: participant.username, reason },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${participant.username}'s account has been frozen`,
        userId: participantId,
        status: 'frozen'
      }
    });
  } catch (error) {
    console.error('Freeze account error:', error);
    res.status(500).json({
      error: 'Failed to freeze account',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/participants/:id/unfreeze
 * Unfreeze a user account
 */
router.post('/participants/:id/unfreeze', async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);

    const participant = await User.findById(participantId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    // Update account status to active
    await pool.query(
      'UPDATE users SET account_status = $1 WHERE id = $2',
      ['active', participantId]
    );

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'unfreeze_account',
      target_user_id: participantId,
      details: { username: participant.username },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${participant.username}'s account has been unfrozen`,
        userId: participantId,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Unfreeze account error:', error);
    res.status(500).json({
      error: 'Failed to unfreeze account',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/bulk-freeze
 * Freeze multiple accounts at once
 */
router.post('/bulk-freeze', async (req, res) => {
  try {
    const { userIds, reason } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid user IDs array',
        code: 'VALIDATION_ERROR'
      });
    }

    let frozenCount = 0;
    const errors = [];

    for (const userId of userIds) {
      try {
        const participant = await User.findById(userId);

        if (participant && participant.role === 'student') {
          await pool.query(
            'UPDATE users SET account_status = $1 WHERE id = $2',
            ['frozen', userId]
          );
          frozenCount++;
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    // Log bulk action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'bulk_freeze',
      details: { user_ids: userIds, frozen_count: frozenCount, reason, errors },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${frozenCount} accounts frozen`,
        frozenCount,
        totalRequested: userIds.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk freeze error:', error);
    res.status(500).json({
      error: 'Failed to freeze accounts',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/bulk-unfreeze
 * Unfreeze multiple accounts at once
 */
router.post('/bulk-unfreeze', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'Invalid user IDs array',
        code: 'VALIDATION_ERROR'
      });
    }

    let unfrozenCount = 0;
    const errors = [];

    for (const userId of userIds) {
      try {
        const participant = await User.findById(userId);

        if (participant && participant.role === 'student') {
          await pool.query(
            'UPDATE users SET account_status = $1 WHERE id = $2',
            ['active', userId]
          );
          unfrozenCount++;
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    // Log bulk action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'bulk_unfreeze',
      details: { user_ids: userIds, unfrozen_count: unfrozenCount, errors },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `${unfrozenCount} accounts unfrozen`,
        unfrozenCount,
        totalRequested: userIds.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Bulk unfreeze error:', error);
    res.status(500).json({
      error: 'Failed to unfreeze accounts',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * PUT /api/v1/instructor/participants/:id/commission-rate
 * Adjust custom commission rate for a user
 */
router.put('/participants/:id/commission-rate', async (req, res) => {
  try {
    const participantId = parseInt(req.params.id);
    const { commissionRate, useDefault } = req.body;

    const participant = await User.findById(participantId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    if (useDefault) {
      // Remove custom commission rate (use default)
      await pool.query(
        'UPDATE users SET custom_commission_rate = NULL WHERE id = $1',
        [participantId]
      );
    } else {
      // Validate commission rate
      if (commissionRate < 0 || commissionRate > 100) {
        return res.status(400).json({
          error: 'Commission rate must be between 0 and 100',
          code: 'VALIDATION_ERROR'
        });
      }

      // Set custom commission rate
      await pool.query(
        'UPDATE users SET custom_commission_rate = $1 WHERE id = $2',
        [commissionRate, participantId]
      );
    }

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'adjust_commission_rate',
      target_user_id: participantId,
      details: {
        username: participant.username,
        commission_rate: useDefault ? 'default' : commissionRate
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: useDefault
          ? `${participant.username} now uses default commission rates`
          : `${participant.username}'s commission rate set to ${commissionRate}%`,
        userId: participantId,
        commissionRate: useDefault ? null : commissionRate
      }
    });
  } catch (error) {
    console.error('Adjust commission rate error:', error);
    res.status(500).json({
      error: 'Failed to adjust commission rate',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/transactions/create
 * Manually create a transaction (credit or debit)
 */
router.post('/transactions/create', async (req, res) => {
  try {
    const { userId, amount, type, description } = req.body;

    // Validate inputs
    if (!userId || !amount || !type || !description) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        error: 'Type must be credit or debit',
        code: 'VALIDATION_ERROR'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        error: 'Amount must be positive',
        code: 'VALIDATION_ERROR'
      });
    }

    const participant = await User.findById(userId);

    if (!participant || participant.role !== 'student') {
      return res.status(404).json({
        error: 'Participant not found',
        code: 'NOT_FOUND'
      });
    }

    // Calculate new balance
    const currentBalance = parseFloat(participant.balance);
    const transactionAmount = type === 'credit' ? amount : -amount;
    const newBalance = currentBalance + transactionAmount;

    if (newBalance < 0) {
      return res.status(400).json({
        error: 'Insufficient balance for debit transaction',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Update balance
    await pool.query(
      'UPDATE users SET balance = $1 WHERE id = $2',
      [newBalance, userId]
    );

    // Create transaction record
    const transactionResult = await pool.query(
      `INSERT INTO transactions (user_id, amount, type, description, balance_after, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, created_at`,
      [userId, transactionAmount, 'manual_' + type, description, newBalance]
    );

    const transactionId = transactionResult.rows[0].id;

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'create_transaction',
      target_user_id: userId,
      details: {
        username: participant.username,
        type,
        amount,
        transaction_id: transactionId,
        description
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `Transaction created for ${participant.username}`,
        transaction: {
          id: transactionId,
          userId,
          amount: transactionAmount,
          type: 'manual_' + type,
          description,
          balanceAfter: newBalance,
          createdAt: transactionResult.rows[0].created_at
        }
      }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      error: 'Failed to create transaction',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/instructor/transactions/:id/reverse
 * Reverse a transaction
 */
router.post('/transactions/:id/reverse', async (req, res) => {
  try {
    const transactionId = parseInt(req.params.id);
    const { reason } = req.body;

    // Get original transaction
    const transactionResult = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Transaction not found',
        code: 'NOT_FOUND'
      });
    }

    const originalTransaction = transactionResult.rows[0];
    const userId = originalTransaction.user_id;

    // Check if already reversed
    const reversalCheck = await pool.query(
      'SELECT id FROM transactions WHERE type = $1 AND description LIKE $2',
      ['reversal', `%Reversal of transaction #${transactionId}%`]
    );

    if (reversalCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Transaction already reversed',
        code: 'ALREADY_REVERSED'
      });
    }

    const participant = await User.findById(userId);

    if (!participant) {
      return res.status(404).json({
        error: 'User not found',
        code: 'NOT_FOUND'
      });
    }

    // Calculate reversal amount (opposite of original)
    const reversalAmount = -parseFloat(originalTransaction.amount);
    const currentBalance = parseFloat(participant.balance);
    const newBalance = currentBalance + reversalAmount;

    if (newBalance < 0) {
      return res.status(400).json({
        error: 'Insufficient balance for reversal',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Update balance
    await pool.query(
      'UPDATE users SET balance = $1 WHERE id = $2',
      [newBalance, userId]
    );

    // Create reversal transaction
    const reversalDescription = `Reversal of transaction #${transactionId}${reason ? ` - ${reason}` : ''}`;
    const reversalResult = await pool.query(
      `INSERT INTO transactions (user_id, amount, type, description, balance_after, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, created_at`,
      [userId, reversalAmount, 'reversal', reversalDescription, newBalance]
    );

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'reverse_transaction',
      target_user_id: userId,
      details: {
        username: participant.username,
        original_transaction_id: transactionId,
        reversal_transaction_id: reversalResult.rows[0].id,
        amount: reversalAmount,
        reason
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `Transaction #${transactionId} reversed`,
        reversal: {
          id: reversalResult.rows[0].id,
          originalTransactionId: transactionId,
          userId,
          amount: reversalAmount,
          balanceAfter: newBalance,
          createdAt: reversalResult.rows[0].created_at
        }
      }
    });
  } catch (error) {
    console.error('Reverse transaction error:', error);
    res.status(500).json({
      error: 'Failed to reverse transaction',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * MARKETING CAMPAIGN ENDPOINTS
 */

// POST /api/v1/instructor/campaigns - Create new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      created_by: req.user.id
    };

    const campaign = await campaignService.createCampaign(campaignData);

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'create_campaign',
      details: {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        campaign_type: campaign.campaign_type
      },
      ip_address: req.ip
    });

    res.status(201).json({
      success: true,
      data: { campaign }
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      error: 'Failed to create campaign',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/instructor/campaigns - List all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      campaign_type: req.query.campaign_type,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const campaigns = await campaignService.getAllCampaigns(filters);

    res.json({
      success: true,
      data: { campaigns }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      error: 'Failed to load campaigns',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/instructor/campaigns/:id - Get campaign details
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const campaign = await campaignService.getCampaignById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { campaign }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      error: 'Failed to load campaign',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/instructor/campaigns/:id - Update campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        code: 'NOT_FOUND'
      });
    }

    const updates = req.body;
    const updateQuery = [];
    const params = [];
    let paramCount = 1;

    // Build dynamic update query
    const allowedFields = ['name', 'description', 'subject_line', 'email_template', 
                          'target_audience', 'schedule_type', 'schedule_time', 'schedule_days'];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateQuery.push(`${field} = $${paramCount}`);
        params.push(updates[field]);
        paramCount++;
      }
    }

    if (updateQuery.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        code: 'VALIDATION_ERROR'
      });
    }

    updateQuery.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(campaignId);

    const query = `UPDATE marketing_campaigns SET ${updateQuery.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const { rows } = await pool.query(query, params);

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'update_campaign',
      details: {
        campaign_id: campaignId,
        updates: Object.keys(updates)
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: { campaign: rows[0] }
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      error: 'Failed to update campaign',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/instructor/campaigns/:id - Delete campaign
router.delete('/campaigns/:id', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        code: 'NOT_FOUND'
      });
    }

    await campaignService.deleteCampaign(campaignId);

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'delete_campaign',
      details: {
        campaign_id: campaignId,
        campaign_name: campaign.name
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: { message: 'Campaign deleted successfully' }
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      error: 'Failed to delete campaign',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/instructor/campaigns/:id/status - Update campaign status
router.put('/campaigns/:id/status', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['draft', 'active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be draft, active, paused, or completed',
        code: 'VALIDATION_ERROR'
      });
    }

    const campaign = await campaignService.updateCampaignStatus(campaignId, status);

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        code: 'NOT_FOUND'
      });
    }

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'update_campaign_status',
      details: {
        campaign_id: campaignId,
        new_status: status
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: `Campaign status updated to ${status}`,
        campaign
      }
    });
  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({
      error: 'Failed to update campaign status',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/instructor/campaigns/:id/execute - Execute campaign
router.post('/campaigns/:id/execute', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);

    const result = await campaignService.executeCampaign(campaignId);

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'execute_campaign',
      details: {
        campaign_id: campaignId,
        success_count: result.successCount,
        fail_count: result.failCount,
        total_processed: result.totalProcessed
      },
      ip_address: req.ip
    });

    res.json({
      success: true,
      data: {
        message: 'Campaign execution completed',
        ...result
      }
    });
  } catch (error) {
    console.error('Execute campaign error:', error);
    res.status(500).json({
      error: error.message || 'Failed to execute campaign',
      code: 'EXECUTION_ERROR'
    });
  }
});

// GET /api/v1/instructor/campaigns/:id/stats - Get campaign statistics
router.get('/campaigns/:id/stats', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);

    const stats = await campaignService.getCampaignStats(campaignId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({
      error: error.message || 'Failed to load campaign statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/instructor/campaigns/:id/drip-step - Add drip sequence step
router.post('/campaigns/:id/drip-step', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    
    const campaign = await campaignService.getCampaignById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        code: 'NOT_FOUND'
      });
    }

    if (campaign.campaign_type !== 'drip') {
      return res.status(400).json({
        error: 'Can only add drip steps to drip campaigns',
        code: 'INVALID_CAMPAIGN_TYPE'
      });
    }

    const stepData = req.body;
    const step = await campaignService.addDripStep(campaignId, stepData);

    // Log action
    await AdminAction.log({
      admin_id: req.user.id,
      action_type: 'add_drip_step',
      details: {
        campaign_id: campaignId,
        step_id: step.id,
        sequence_order: step.sequence_order
      },
      ip_address: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        message: 'Drip step added successfully',
        step
      }
    });
  } catch (error) {
    console.error('Add drip step error:', error);
    res.status(500).json({
      error: 'Failed to add drip step',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/instructor/campaigns/:id/recipients - Get campaign recipients
router.get('/campaigns/:id/recipients', async (req, res) => {
  try {
    const campaignId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 100;
    const status = req.query.status;

    let query = `
      SELECT cr.*, u.email, u.username
      FROM campaign_recipients cr
      JOIN users u ON cr.user_id = u.id
      WHERE cr.campaign_id = $1
    `;
    const params = [campaignId];

    if (status) {
      params.push(status);
      query += ` AND cr.status = $${params.length}`;
    }

    query += ` ORDER BY cr.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows: recipients } = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        recipients: recipients.map(r => ({
          id: r.id,
          userId: r.user_id,
          email: r.email,
          username: r.username,
          status: r.status,
          sequenceStep: r.sequence_step,
          sentAt: r.sent_at,
          openedAt: r.opened_at,
          clickedAt: r.clicked_at,
          openCount: r.open_count,
          clickCount: r.click_count,
          errorMessage: r.error_message
        }))
      }
    });
  } catch (error) {
    console.error('Get campaign recipients error:', error);
    res.status(500).json({
      error: 'Failed to load campaign recipients',
      code: 'DATABASE_ERROR'
    });
  }
});

module.exports = router;
