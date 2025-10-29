const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Goal = require('../models/Goal');
const Wallet = require('../models/Wallet');
const Analytics = require('../models/Analytics');
const TeamResource = require('../models/TeamResource');
const Event = require('../models/Event');
const MessageTemplate = require('../models/MessageTemplate');
const Webhook = require('../models/Webhook');
const ApiKey = require('../models/ApiKey');
const UserPreferences = require('../models/UserPreferences');
const Notification = require('../models/Notification');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const Achievement = require('../models/Achievement');
const Rank = require('../models/Rank');
const Deposit = require('../models/Deposit');
const ReferralService = require('../services/referralService');
const cacheService = require('../services/cacheService');
const predictiveAnalyticsService = require('../services/predictiveAnalyticsService');
const campaignService = require('../services/campaignService');
const { authenticate } = require('../middleware/auth');
const { requireMember } = require('../middleware/roleAuth');
const { validate } = require('../utils/validation');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const upload = require('../config/multer');
const path = require('path');

// Apply authentication to all member routes
router.use(authenticate);
router.use(requireMember);

/**
 * GET /api/v1/member/dashboard
 * Get dashboard data for logged-in member
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId);

    // Get recent activity
    const recentActivity = await Transaction.getRecentTransactions(userId, 10);

    // Generate referral link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${user.referral_code}`;

    res.json({
      success: true,
      data: {
        balance: parseFloat(user.balance),
        totalEarned: parseFloat(user.total_earned),
        directRecruits: user.direct_recruits,
        networkSize: user.network_size,
        referralCode: user.referral_code,
        referralLink,
        recentActivity: recentActivity.map(t => ({
          id: t.id,
          description: t.description,
          amount: parseFloat(t.amount),
          timestamp: t.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/member/network
 * Get downline network visualization data
 */
router.get('/network', async (req, res) => {
  try {
    const userId = req.user.id;
    const level = req.query.level ? parseInt(req.query.level) : null;

    const networkData = await ReferralService.getDownlineTree(userId, level);

    // Flatten levels into a single array for frontend
    const downline = [];
    for (const levelNum of Object.keys(networkData.levels)) {
      const levelData = networkData.levels[levelNum];
      for (const member of levelData.members) {
        // Get total earned from this member
        const earningsResult = await require('../config/database').pool.query(
          'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = $1 AND triggered_by_user_id = $2',
          [userId, member.id]
        );
        const totalEarned = parseFloat(earningsResult.rows[0].total);

        downline.push({
          id: member.id,
          displayName: member.displayName,
          level: parseInt(levelNum),
          balance: 0, // Not exposed for privacy
          networkSize: member.recruits,
          joinedAt: member.joinedAt,
          isActive: member.isActive,
          totalEarned: totalEarned
        });
      }
    }

    res.json({
      success: true,
      data: {
        downline,
        totalNetwork: networkData.totalNetwork
      }
    });
  } catch (error) {
    console.error('Network error:', error);
    res.status(500).json({
      error: 'Failed to load network',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/member/earnings
 * Get earnings history with filtering and sorting
 */
router.get('/earnings', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'desc';

    // Get transactions
    const { transactions, total } = await Transaction.getUserTransactions(
      userId,
      page,
      limit,
      sortBy,
      sortOrder.toUpperCase()
    );

    // Get summary
    const summary = await Transaction.getEarningsSummary(userId);

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount),
          type: t.type,
          level: t.level,
          description: t.description,
          balanceAfter: parseFloat(t.balance_after),
          createdAt: t.created_at,
          triggeredByUserId: t.triggered_by_user_id,
          triggeredByEmail: t.triggered_by_email
        })),
        summary: {
          todayEarnings: parseFloat(summary.today_earnings),
          weekEarnings: parseFloat(summary.week_earnings),
          allTimeEarnings: parseFloat(summary.all_time_earnings)
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({
      error: 'Failed to load earnings',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/member/direct-invites
 * Get list of direct invites with earnings summary
 */
router.get('/direct-invites', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const invites = await Transaction.getDirectInvitesEarnings(userId);
    
    res.json({
      success: true,
      data: {
        invites: invites.map(inv => ({
          userId: inv.user_id,
          email: inv.email,
          totalEarned: parseFloat(inv.total_earned),
          transactionCount: parseInt(inv.transaction_count)
        }))
      }
    });
  } catch (error) {
    console.error('Direct invites error:', error);
    res.status(500).json({
      error: 'Failed to load invites',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/member/invite-transactions/:inviteUserId
 * Get all transactions triggered by a specific invite
 */
router.get('/invite-transactions/:inviteUserId', async (req, res) => {
  try {
    const userId = req.user.id;
    const inviteUserId = parseInt(req.params.inviteUserId);
    
    // Security check: verify the invite belongs to current user
    const verifyResult = await require('../config/database').pool.query(
      'SELECT id FROM users WHERE id = $1 AND referred_by_id = $2',
      [inviteUserId, userId]
    );
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Unauthorized access',
        code: 'FORBIDDEN'
      });
    }
    
    const transactions = await Transaction.getTransactionsByTriggeredUser(userId, inviteUserId);
    
    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount),
          type: t.type,
          level: t.level,
          description: t.description,
          balanceAfter: parseFloat(t.balance_after),
          createdAt: t.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Invite transactions error:', error);
    res.status(500).json({
      error: 'Failed to load transactions',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/member/profile
 * Get member's own profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Get referrer info if exists (anonymized for privacy)
    let referredBy = null;
    if (user.referred_by_id) {
      const referrer = await User.findById(user.referred_by_id);
      if (referrer) {
        referredBy = {
          id: referrer.id,
          displayName: 'Your Upline' // Anonymized for privacy
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name || user.username, // Fallback to username
        referralCode: user.referral_code,
        balance: parseFloat(user.balance),
        totalEarned: parseFloat(user.total_earned),
        directRecruits: user.direct_recruits,
        networkSize: user.network_size,
        referredBy,
        joinedDate: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Failed to load profile',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * PUT /api/v1/member/profile
 * Update member profile
 */
router.put('/profile', validate('profileUpdate'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, username, currentPassword, newPassword } = req.validatedBody;

    const updates = {};

    // Check email uniqueness if changing
    if (email && email !== req.user.email) {
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(400).json({
          error: 'Email already in use',
          code: 'EMAIL_TAKEN'
        });
      }
      updates.email = email;
    }

    // Check username uniqueness if changing
    if (username && username !== req.user.username) {
      const [existing] = await require('../config/database').pool.query(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );
      if (existing.length > 0) {
        return res.status(400).json({
          error: 'Username already taken',
          code: 'USERNAME_TAKEN'
        });
      }
      updates.username = username;
    }

    // Handle password change
    if (newPassword && currentPassword) {
      const user = await User.findById(userId);
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CREDENTIALS'
        });
      }

      updates.password_hash = await hashPassword(newPassword);
    }

    // Update profile
    if (Object.keys(updates).length > 0) {
      await User.updateProfile(userId, updates);
    }

    // Get updated user
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username
        }
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * POST /api/v1/member/profile/avatar
 * Upload profile avatar
 */
router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    // Generate avatar URL (relative path for serving)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar_url in database
    await require('../config/database').pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({
      success: true,
      data: {
        message: 'Avatar uploaded successfully',
        avatarUrl
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      error: 'Failed to upload avatar',
      code: 'UPLOAD_ERROR'
    });
  }
});

/**
 * WITHDRAWAL ENDPOINTS
 */

// GET /api/v1/member/withdrawals - Get user's withdrawal history
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { withdrawals, total } = await Withdrawal.getUserWithdrawals(userId, page, limit);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Withdrawals error:', error);
    res.status(500).json({
      error: 'Failed to load withdrawals',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/withdrawals - Create withdrawal request
router.post('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, wallet_address, network = 'TRC20', notes } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    // Get user balance
    const user = await User.findById(userId);
    const balance = parseFloat(user.balance);

    // Check minimum withdrawal amount
    const minWithdrawal = 10; // TODO: Get from system_config
    if (amount < minWithdrawal) {
      return res.status(400).json({
        error: `Minimum withdrawal amount is ${minWithdrawal} USDT`,
        code: 'BELOW_MINIMUM'
      });
    }

    // Calculate fee
    const { fee, netAmount } = Withdrawal.calculateFee(amount);

    // Check if user has enough balance
    if (amount > balance) {
      return res.status(400).json({
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE'
      });
    }

    // Validate wallet address
    if (!Wallet.validateAddress(wallet_address, network)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET'
      });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      user_id: userId,
      amount,
      wallet_address,
      network,
      transaction_fee: fee,
      net_amount: netAmount,
      notes
    });

    // Deduct from user balance (locked until processed)
    await require('../config/database').pool.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [amount, userId]
    );

    res.json({
      success: true,
      data: { withdrawal }
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      error: 'Failed to create withdrawal request',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/member/withdrawals/:id - Cancel pending withdrawal
router.delete('/withdrawals/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = parseInt(req.params.id);

    const withdrawal = await Withdrawal.cancel(withdrawalId, userId);

    if (!withdrawal) {
      return res.status(404).json({
        error: 'Withdrawal not found or cannot be cancelled',
        code: 'NOT_FOUND'
      });
    }

    // Refund to user balance
    await require('../config/database').pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [withdrawal.amount, userId]
    );

    res.json({
      success: true,
      data: { message: 'Withdrawal cancelled successfully' }
    });
  } catch (error) {
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({
      error: 'Failed to cancel withdrawal',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/withdrawal-stats - Get withdrawal statistics
router.get('/withdrawal-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await Withdrawal.getUserStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Withdrawal stats error:', error);
    res.status(500).json({
      error: 'Failed to load withdrawal statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GOALS ENDPOINTS
 */

// GET /api/v1/member/goals - Get user's goals
router.get('/goals', async (req, res) => {
  try {
    const userId = req.user.id;
    const includeCompleted = req.query.includeCompleted !== 'false';

    const goals = await Goal.getUserGoals(userId, includeCompleted);

    // Sync goals with current user data
    await Goal.syncGoalsWithUserData(userId);

    res.json({
      success: true,
      data: { goals }
    });
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({
      error: 'Failed to load goals',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/goals - Create new goal
router.post('/goals', async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal_type, target_value, target_date } = req.body;

    if (!goal_type || !target_value) {
      return res.status(400).json({
        error: 'goal_type and target_value are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Get current value based on goal type
    const user = await User.findById(userId);
    let current_value = 0;

    switch (goal_type) {
      case 'earnings':
        current_value = parseFloat(user.total_earned);
        break;
      case 'recruits':
        current_value = user.direct_recruits;
        break;
      case 'network_size':
        current_value = user.network_size;
        break;
    }

    const goal = await Goal.create({
      user_id: userId,
      goal_type,
      target_value,
      current_value,
      target_date
    });

    res.json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      error: 'Failed to create goal',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/member/goals/:id - Update goal
router.put('/goals/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);
    const updates = req.body;

    const goal = await Goal.update(goalId, updates, userId);

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { goal }
    });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({
      error: 'Failed to update goal',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/member/goals/:id - Delete goal
router.delete('/goals/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    const goal = await Goal.delete(goalId, userId);

    if (!goal) {
      return res.status(404).json({
        error: 'Goal not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { message: 'Goal deleted successfully' }
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      error: 'Failed to delete goal',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/goal-recommendations - Get recommended goals
router.get('/goal-recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await Goal.getRecommendedGoals(userId);

    res.json({
      success: true,
      data: { recommendations }
    });
  } catch (error) {
    console.error('Goal recommendations error:', error);
    res.status(500).json({
      error: 'Failed to load goal recommendations',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * WALLET ENDPOINTS
 */

// GET /api/v1/member/wallets - Get user's wallets
router.get('/wallets', async (req, res) => {
  try {
    const userId = req.user.id;
    const wallets = await Wallet.getUserWallets(userId);

    res.json({
      success: true,
      data: { wallets }
    });
  } catch (error) {
    console.error('Wallets error:', error);
    res.status(500).json({
      error: 'Failed to load wallets',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/wallets - Add new wallet
router.post('/wallets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { wallet_address, wallet_type, network = 'TRC20', label, is_primary = false } = req.body;

    if (!wallet_address || !wallet_type) {
      return res.status(400).json({
        error: 'wallet_address and wallet_type are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate wallet address format
    if (!Wallet.validateAddress(wallet_address, network)) {
      return res.status(400).json({
        error: 'Invalid wallet address format',
        code: 'INVALID_WALLET'
      });
    }

    const wallet = await Wallet.create({
      user_id: userId,
      wallet_address,
      wallet_type,
      network,
      label,
      is_primary
    });

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    console.error('Add wallet error:', error);
    res.status(500).json({
      error: 'Failed to add wallet',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/member/wallets/:id/primary - Set wallet as primary
router.put('/wallets/:id/primary', async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = parseInt(req.params.id);

    const wallet = await Wallet.setPrimary(walletId, userId);

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    console.error('Set primary wallet error:', error);
    res.status(500).json({
      error: 'Failed to set primary wallet',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/member/wallets/:id - Delete wallet
router.delete('/wallets/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = parseInt(req.params.id);

    const wallet = await Wallet.delete(walletId, userId);

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { message: 'Wallet deleted successfully' }
    });
  } catch (error) {
    console.error('Delete wallet error:', error);
    res.status(500).json({
      error: 'Failed to delete wallet',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * ANALYTICS ENDPOINTS
 */

// GET /api/v1/member/analytics/earnings-chart - Get earnings over time
router.get('/analytics/earnings-chart', async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '30days';

    const data = await Analytics.getEarningsOverTime(userId, period);

    res.json({
      success: true,
      data: { chartData: data }
    });
  } catch (error) {
    console.error('Earnings chart error:', error);
    res.status(500).json({
      error: 'Failed to load earnings chart',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/analytics/network-growth - Get network growth over time
router.get('/analytics/network-growth', async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '30days';

    const data = await Analytics.getNetworkGrowthOverTime(userId, period);

    res.json({
      success: true,
      data: { chartData: data }
    });
  } catch (error) {
    console.error('Network growth error:', error);
    res.status(500).json({
      error: 'Failed to load network growth',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/analytics/top-performers - Get top performers
router.get('/analytics/top-performers', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const performers = await Analytics.getTopPerformers(userId, limit);

    res.json({
      success: true,
      data: { performers }
    });
  } catch (error) {
    console.error('Top performers error:', error);
    res.status(500).json({
      error: 'Failed to load top performers',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/analytics/dashboard-stats - Get comprehensive dashboard stats
router.get('/analytics/dashboard-stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await Analytics.getDashboardStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * PREDICTIVE ANALYTICS ENDPOINTS
 */

// GET /api/v1/member/analytics/predictions - Get user's predictive analytics
router.get('/analytics/predictions', async (req, res) => {
  try {
    const userId = req.user.id;
    const analytics = await predictiveAnalyticsService.getUserAnalytics(userId);

    res.json({
      success: true,
      data: {
        analytics: {
          avgDailyEarnings: parseFloat(analytics.avg_daily_earnings),
          avgWeeklyEarnings: parseFloat(analytics.avg_weekly_earnings),
          avgMonthlyEarnings: parseFloat(analytics.avg_monthly_earnings),
          earningsGrowthRate: parseFloat(analytics.earnings_growth_rate),
          predicted30dEarnings: parseFloat(analytics.predicted_30d_earnings),
          predicted90dEarnings: parseFloat(analytics.predicted_90d_earnings),
          predicted30dRecruits: parseInt(analytics.predicted_30d_recruits),
          networkGrowthRate: parseFloat(analytics.network_growth_rate),
          churnRiskScore: parseFloat(analytics.churn_risk_score),
          churnRiskLevel: analytics.churn_risk_level,
          activityScore: parseFloat(analytics.activity_score),
          daysActive: parseInt(analytics.days_active),
          daysInactive: parseInt(analytics.days_inactive),
          bestRecruitmentDay: analytics.best_recruitment_day,
          bestRecruitmentHour: analytics.best_recruitment_hour,
          lastUpdated: analytics.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Predictions error:', error);
    res.status(500).json({
      error: 'Failed to load predictions',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/analytics/insights - Get actionable insights
router.get('/analytics/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = await predictiveAnalyticsService.getUserInsights(userId);

    res.json({
      success: true,
      data: { insights }
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      error: 'Failed to load insights',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/analytics/recalculate - Force recalculate analytics
router.post('/analytics/recalculate', async (req, res) => {
  try {
    const userId = req.user.id;
    const analytics = await predictiveAnalyticsService.calculateUserAnalytics(userId);

    res.json({
      success: true,
      data: {
        message: 'Analytics recalculated successfully',
        analytics: {
          predicted30dEarnings: parseFloat(analytics.predicted_30d_earnings),
          predicted90dEarnings: parseFloat(analytics.predicted_90d_earnings),
          churnRiskLevel: analytics.churn_risk_level,
          lastUpdated: analytics.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Recalculate error:', error);
    res.status(500).json({
      error: 'Failed to recalculate analytics',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * TRAINING RESOURCES ENDPOINTS
 */

// GET /api/v1/member/resources - Get all training resources
router.get('/resources', async (req, res) => {
  try {
    const { type, category, search, page = 1, limit = 20 } = req.query;
    
    const filters = {
      type,
      category,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const { resources, total } = await TeamResource.getAll(filters);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          currentPage: filters.page,
          totalPages: Math.ceil(total / filters.limit),
          totalRecords: total
        }
      }
    });
  } catch (error) {
    console.error('Resources error:', error);
    res.status(500).json({
      error: 'Failed to load training resources',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/resources/:id - Get single resource
router.get('/resources/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const resource = await TeamResource.getById(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        code: 'NOT_FOUND'
      });
    }

    // Log access
    await TeamResource.logAccess(resourceId, req.user.id, 'view');

    res.json({
      success: true,
      data: { resource }
    });
  } catch (error) {
    console.error('Resource error:', error);
    res.status(500).json({
      error: 'Failed to load resource',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/resources/:id/download - Log download
router.post('/resources/:id/download', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    await TeamResource.logAccess(resourceId, req.user.id, 'download');

    res.json({
      success: true,
      data: { message: 'Download logged' }
    });
  } catch (error) {
    console.error('Download log error:', error);
    res.status(500).json({
      error: 'Failed to log download',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/resources/categories - Get resource categories
router.get('/resources-categories', async (req, res) => {
  try {
    const categories = await TeamResource.getCategories();

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      error: 'Failed to load categories',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/resources/popular - Get popular resources
router.get('/resources-popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const resources = await TeamResource.getPopular(limit);

    res.json({
      success: true,
      data: { resources }
    });
  } catch (error) {
    console.error('Popular resources error:', error);
    res.status(500).json({
      error: 'Failed to load popular resources',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * TEAM EVENTS ENDPOINTS
 */

// GET /api/v1/member/events - Get all events
router.get('/events', async (req, res) => {
  try {
    const { type, upcoming = 'true', page = 1, limit = 20 } = req.query;

    const filters = {
      type,
      upcoming: upcoming === 'true',
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const events = await Event.getAll(filters);

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({
      error: 'Failed to load events',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/events/:id - Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await Event.getById(eventId, req.user.id);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { event }
    });
  } catch (error) {
    console.error('Event error:', error);
    res.status(500).json({
      error: 'Failed to load event',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/events/:id/rsvp - RSVP to event
router.post('/events/:id/rsvp', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { status = 'accepted' } = req.body;

    // Check if event exists and is not full
    const event = await Event.getById(eventId);
    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        code: 'NOT_FOUND'
      });
    }

    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      return res.status(400).json({
        error: 'Event is full',
        code: 'EVENT_FULL'
      });
    }

    const rsvp = await Event.rsvp(eventId, req.user.id, status);

    res.json({
      success: true,
      data: { rsvp }
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({
      error: 'Failed to RSVP',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/member/events/:id/rsvp - Cancel RSVP
router.delete('/events/:id/rsvp', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const cancelled = await Event.cancelRsvp(eventId, req.user.id);

    if (!cancelled) {
      return res.status(404).json({
        error: 'RSVP not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { message: 'RSVP cancelled successfully' }
    });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({
      error: 'Failed to cancel RSVP',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/my-events - Get user's registered events
router.get('/my-events', async (req, res) => {
  try {
    const { upcoming = 'true' } = req.query;
    const events = await Event.getUserEvents(req.user.id, upcoming === 'true');

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('My events error:', error);
    res.status(500).json({
      error: 'Failed to load your events',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * MESSAGE TEMPLATES ENDPOINTS
 */

// GET /api/v1/member/templates - Get message templates
router.get('/templates', async (req, res) => {
  try {
    const { type } = req.query;
    const templates = await MessageTemplate.getAll(type);

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({
      error: 'Failed to load templates',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/templates/:id - Get single template
router.get('/templates/:id', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const template = await MessageTemplate.getById(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { template }
    });
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({
      error: 'Failed to load template',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/templates/:id/render - Render template with user data
router.post('/templates/:id/render', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const template = await MessageTemplate.getById(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'NOT_FOUND'
      });
    }

    // Get user data for template variables
    const user = await User.findById(req.user.id);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/register?ref=${user.referral_code}`;

    const variables = {
      name: user.username || user.email.split('@')[0],
      email: user.email,
      referral_code: user.referral_code,
      referral_link: referralLink,
      ...req.body.variables // Allow custom variables
    };

    const rendered = MessageTemplate.renderTemplate(template, variables);

    res.json({
      success: true,
      data: { rendered }
    });
  } catch (error) {
    console.error('Render template error:', error);
    res.status(500).json({
      error: 'Failed to render template',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/templates/share - Log template share
router.post('/templates/share', async (req, res) => {
  try {
    const { platform, template_id } = req.body;

    if (!platform) {
      return res.status(400).json({
        error: 'platform is required',
        code: 'MISSING_FIELDS'
      });
    }

    await MessageTemplate.logShare(req.user.id, platform, template_id || null);

    res.json({
      success: true,
      data: { message: 'Share logged successfully' }
    });
  } catch (error) {
    console.error('Log share error:', error);
    res.status(500).json({
      error: 'Failed to log share',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/share-stats - Get user's sharing statistics
router.get('/share-stats', async (req, res) => {
  try {
    const stats = await MessageTemplate.getShareStats(req.user.id);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Share stats error:', error);
    res.status(500).json({
      error: 'Failed to load share statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/templates/trending - Get trending templates
router.get('/templates-trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const templates = await MessageTemplate.getTrending(limit);

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    console.error('Trending templates error:', error);
    res.status(500).json({
      error: 'Failed to load trending templates',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * WEBHOOKS ENDPOINTS
 */

// GET /api/v1/member/webhooks - Get user's webhooks
router.get('/webhooks', async (req, res) => {
  try {
    const webhooks = await Webhook.getUserWebhooks(req.user.id);

    res.json({
      success: true,
      data: { webhooks }
    });
  } catch (error) {
    console.error('Webhooks error:', error);
    res.status(500).json({
      error: 'Failed to load webhooks',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/webhooks - Create webhook
router.post('/webhooks', async (req, res) => {
  try {
    const { url, events, retry_count = 3 } = req.body;

    if (!url || !events || events.length === 0) {
      return res.status(400).json({
        error: 'url and events are required',
        code: 'MISSING_FIELDS'
      });
    }

    const webhook = await Webhook.create({
      user_id: req.user.id,
      url,
      events,
      retry_count
    });

    res.json({
      success: true,
      data: { webhook }
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({
      error: 'Failed to create webhook',
      code: 'DATABASE_ERROR'
    });
  }
});

// PUT /api/v1/member/webhooks/:id - Update webhook
router.put('/webhooks/:id', async (req, res) => {
  try {
    const webhookId = parseInt(req.params.id);
    const updates = req.body;

    const webhook = await Webhook.update(webhookId, updates, req.user.id);

    if (!webhook) {
      return res.status(404).json({
        error: 'Webhook not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { webhook }
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({
      error: 'Failed to update webhook',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/member/webhooks/:id - Delete webhook
router.delete('/webhooks/:id', async (req, res) => {
  try {
    const webhookId = parseInt(req.params.id);
    const webhook = await Webhook.delete(webhookId, req.user.id);

    if (!webhook) {
      return res.status(404).json({
        error: 'Webhook not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { message: 'Webhook deleted successfully' }
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      error: 'Failed to delete webhook',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/webhooks/:id/deliveries - Get webhook delivery history
router.get('/webhooks/:id/deliveries', async (req, res) => {
  try {
    const webhookId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 50;

    // Verify ownership
    const webhook = await Webhook.getById(webhookId, req.user.id);
    if (!webhook) {
      return res.status(404).json({
        error: 'Webhook not found',
        code: 'NOT_FOUND'
      });
    }

    const deliveries = await Webhook.getDeliveryHistory(webhookId, limit);

    res.json({
      success: true,
      data: { deliveries }
    });
  } catch (error) {
    console.error('Webhook deliveries error:', error);
    res.status(500).json({
      error: 'Failed to load webhook deliveries',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/webhooks/:id/stats - Get webhook statistics
router.get('/webhooks/:id/stats', async (req, res) => {
  try {
    const webhookId = parseInt(req.params.id);

    // Verify ownership
    const webhook = await Webhook.getById(webhookId, req.user.id);
    if (!webhook) {
      return res.status(404).json({
        error: 'Webhook not found',
        code: 'NOT_FOUND'
      });
    }

    const stats = await Webhook.getStats(webhookId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Webhook stats error:', error);
    res.status(500).json({
      error: 'Failed to load webhook statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * API KEYS ENDPOINTS
 */

// GET /api/v1/member/api-keys - Get user's API keys
router.get('/api-keys', async (req, res) => {
  try {
    const keys = await ApiKey.getUserKeys(req.user.id);

    res.json({
      success: true,
      data: { keys }
    });
  } catch (error) {
    console.error('API keys error:', error);
    res.status(500).json({
      error: 'Failed to load API keys',
      code: 'DATABASE_ERROR'
    });
  }
});

// POST /api/v1/member/api-keys - Create API key
router.post('/api-keys', async (req, res) => {
  try {
    const { key_name, permissions = [], rate_limit_per_hour = 1000, expires_at } = req.body;

    if (!key_name) {
      return res.status(400).json({
        error: 'key_name is required',
        code: 'MISSING_FIELDS'
      });
    }

    const apiKey = await ApiKey.create({
      user_id: req.user.id,
      key_name,
      permissions,
      rate_limit_per_hour,
      expires_at
    });

    res.json({
      success: true,
      data: {
        message: 'API key created successfully. Save the secret now - it will not be shown again.',
        apiKey
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({
      error: 'Failed to create API key',
      code: 'DATABASE_ERROR'
    });
  }
});

// DELETE /api/v1/member/api-keys/:id - Revoke/delete API key
router.delete('/api-keys/:id', async (req, res) => {
  try {
    const keyId = parseInt(req.params.id);
    const deleted = await ApiKey.delete(keyId, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { message: 'API key deleted successfully' }
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      error: 'Failed to delete API key',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/api-keys/:id/stats - Get API key statistics
router.get('/api-keys/:id/stats', async (req, res) => {
  try {
    const keyId = parseInt(req.params.id);

    // Verify ownership
    const keys = await ApiKey.getUserKeys(req.user.id);
    const keyExists = keys.find(k => k.id === keyId);

    if (!keyExists) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'NOT_FOUND'
      });
    }

    const stats = await ApiKey.getStats(keyId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('API key stats error:', error);
    res.status(500).json({
      error: 'Failed to load API key statistics',
      code: 'DATABASE_ERROR'
    });
  }
});

// GET /api/v1/member/api-keys/:id/history - Get API key request history
router.get('/api-keys/:id/history', async (req, res) => {
  try {
    const keyId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 100;

    // Verify ownership
    const keys = await ApiKey.getUserKeys(req.user.id);
    const keyExists = keys.find(k => k.id === keyId);

    if (!keyExists) {
      return res.status(404).json({
        error: 'API key not found',
        code: 'NOT_FOUND'
      });
    }

    const history = await ApiKey.getRequestHistory(keyId, limit);

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('API key history error:', error);
    res.status(500).json({
      error: 'Failed to load API key history',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * MARKETING CAMPAIGN TRACKING ENDPOINTS
 */

// GET /api/v1/member/campaigns/track/open/:recipientId - Track email open
router.get('/campaigns/track/open/:recipientId', async (req, res) => {
  try {
    const recipientId = parseInt(req.params.recipientId);
    
    await campaignService.trackOpen(recipientId);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Track open error:', error);
    // Return pixel even on error to avoid broken images
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length
    });
    res.end(pixel);
  }
});

// GET /api/v1/member/campaigns/track/click/:recipientId - Track email click
router.get('/campaigns/track/click/:recipientId', async (req, res) => {
  try {
    const recipientId = parseInt(req.params.recipientId);
    const redirectUrl = req.query.url;
    
    await campaignService.trackClick(recipientId);
    
    // Redirect to the intended URL
    if (redirectUrl) {
      res.redirect(redirectUrl);
    } else {
      res.json({
        success: true,
        data: { message: 'Click tracked' }
      });
    }
  } catch (error) {
    console.error('Track click error:', error);
    // Redirect even on error
    const redirectUrl = req.query.url;
    if (redirectUrl) {
      res.redirect(redirectUrl);
    } else {
      res.status(500).json({
        error: 'Failed to track click',
        code: 'TRACKING_ERROR'
      });
    }
  }
});

module.exports = router;
