const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const CommissionService = require('../services/commissionService');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/jwtToken');
const { generateReferralCode } = require('../utils/generateReferralCode');
const { validate } = require('../utils/validation');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { checkSimulationActive } = require('../middleware/simulationStatus');

/**
 * POST /api/v1/auth/register
 * Register new student account
 */
router.post('/register',
  registerLimiter,
  checkSimulationActive,
  validate('register'),
  async (req, res) => {
    try {
      const { email, username, password, referralCode } = req.validatedBody;

      // REQUIRED: Referral code is mandatory
      if (!referralCode) {
        return res.status(400).json({
          error: 'Referral code is required to register',
          code: 'REFERRAL_CODE_REQUIRED'
        });
      }

      // Check if participant limit reached
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

      // Check if username already exists (FIXED: PostgreSQL syntax)
      const usernameCheck = await require('../config/database').pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (usernameCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Username already taken',
          code: 'USERNAME_TAKEN'
        });
      }

      // Validate referral code (REQUIRED)
      const referrer = await User.findByReferralCode(referralCode);
      if (!referrer) {
        return res.status(400).json({
          error: 'Invalid referral code',
          code: 'INVALID_REFERRAL_CODE'
        });
      }

      // Ensure referrer is approved (can't refer if not approved)
      if (referrer.role === 'student' && referrer.approval_status !== 'approved') {
        return res.status(400).json({
          error: 'This referral link is not active',
          code: 'REFERRER_NOT_APPROVED'
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Generate unique referral code
      const newReferralCode = await generateReferralCode();

      // Create user with PENDING status (awaiting instructor approval)
      const userId = await User.create({
        email,
        username,
        password_hash,
        role: 'student',
        referral_code: newReferralCode,
        referred_by_id: referrer.id,
        approval_status: 'pending'  // NEW: Pending approval
      });

      // NOTE: Commissions will be distributed AFTER instructor approves
      // Do NOT distribute commissions here

      // Get created user
      const user = await User.findById(userId);

      // Return success - user is pending approval
      res.status(201).json({
        success: true,
        message: 'Registration submitted. Awaiting instructor approval.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            referralCode: user.referral_code,
            approvalStatus: 'pending'
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        code: 'DATABASE_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Login for students and instructor
 */
router.post('/login',
  loginLimiter,
  validate('login'),
  async (req, res) => {
    try {
      const { email, password } = req.validatedBody;

      // Find user by email
      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Compare password
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const token = generateToken(user);

      // Return user data and token
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            balance: parseFloat(user.balance),
            referralCode: user.referral_code
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        code: 'DATABASE_ERROR'
      });
    }
  }
);

module.exports = router;
