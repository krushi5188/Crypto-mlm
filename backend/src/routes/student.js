const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
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
    Object.keys(networkData.levels).forEach(levelNum => {
      const levelData = networkData.levels[levelNum];
      levelData.members.forEach(member => {
        downline.push({
          id: member.id,
          displayName: member.displayName,
          level: parseInt(levelNum),
          balance: 0, // Not exposed for privacy
          networkSize: member.recruits,
          joinedAt: member.joinedAt,
          isActive: member.isActive
        });
      });
    });

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
          createdAt: t.created_at
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
 * GET /api/v1/student/profile
 * Get student's own profile information
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Get referrer info if exists
    let referredBy = null;
    if (user.referred_by_id) {
      const referrer = await User.findById(user.referred_by_id);
      if (referrer) {
        referredBy = {
          id: referrer.id,
          username: referrer.username
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

module.exports = router;
