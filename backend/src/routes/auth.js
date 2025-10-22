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

      // Check if username already exists
      const [existingUsername] = await require('../config/database').pool.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existingUsername.length > 0) {
        return res.status(400).json({
          error: 'Username already taken',
          code: 'USERNAME_TAKEN'
        });
      }

      // Validate referral code if provided
      let referrer = null;
      if (referralCode) {
        referrer = await User.findByReferralCode(referralCode);
        if (!referrer) {
          return res.status(400).json({
            error: 'Invalid referral code',
            code: 'INVALID_REFERRAL_CODE'
          });
        }
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Generate unique referral code
      const newReferralCode = await generateReferralCode();

      // Create user
      const userId = await User.create({
        email,
        username,
        password_hash,
        role: 'student',
        referral_code: newReferralCode,
        referred_by_id: referrer ? referrer.id : null
      });

      // Distribute commissions if user was referred
      if (referrer) {
        await CommissionService.distributeCommissions(userId, username, referrer.id);
      }

      // Get created user
      const user = await User.findById(userId);

      // Generate JWT token
      const token = generateToken(user);

      // Return user data and token
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            referralCode: user.referral_code,
            balance: parseFloat(user.balance),
            role: user.role
          },
          token
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
