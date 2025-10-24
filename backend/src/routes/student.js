const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Goal = require('../models/Goal');
const Wallet = require('../models/Wallet');
const Analytics = require('../models/Analytics');
const ReferralService = require('../services/referralService');
const { authenticate } = require('../middleware/auth');
const { requireStudent } = require('../middleware/roleAuth');
const { validate } = require('../utils/validation');
const { hashPassword, comparePassword } = require('../utils/passwordHash');

// Apply authentication to all student routes
router.use(authenticate);
router.use(requireStudent);

/**
 * GET /api/v1/student/dashboard
 * Get dashboard data for logged-in student
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
 * GET /api/v1/student/network
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
 * GET /api/v1/student/earnings
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
 * GET /api/v1/student/direct-invites
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
 * GET /api/v1/student/invite-transactions/:inviteUserId
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
 * GET /api/v1/student/profile
 * Get student's own profile information
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
        referralCode: user.referral_code,
        balance: parseFloat(user.balance),
        totalEarned: parseFloat(user.total_earned),
        directRecruits: user.direct_recruits,
        networkSize: user.network_size,
        referredBy,
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
 * PUT /api/v1/student/profile
 * Update student profile
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
 * WITHDRAWAL ENDPOINTS
 */

// GET /api/v1/student/withdrawals - Get user's withdrawal history
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

// POST /api/v1/student/withdrawals - Create withdrawal request
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

// DELETE /api/v1/student/withdrawals/:id - Cancel pending withdrawal
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

// GET /api/v1/student/withdrawal-stats - Get withdrawal statistics
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

// GET /api/v1/student/goals - Get user's goals
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

// POST /api/v1/student/goals - Create new goal
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

// PUT /api/v1/student/goals/:id - Update goal
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

// DELETE /api/v1/student/goals/:id - Delete goal
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

// GET /api/v1/student/goal-recommendations - Get recommended goals
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

// GET /api/v1/student/wallets - Get user's wallets
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

// POST /api/v1/student/wallets - Add new wallet
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

// PUT /api/v1/student/wallets/:id/primary - Set wallet as primary
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

// DELETE /api/v1/student/wallets/:id - Delete wallet
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

// GET /api/v1/student/analytics/earnings-chart - Get earnings over time
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

// GET /api/v1/student/analytics/network-growth - Get network growth over time
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

// GET /api/v1/student/analytics/top-performers - Get top performers
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

// GET /api/v1/student/analytics/dashboard-stats - Get comprehensive dashboard stats
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

module.exports = router;
