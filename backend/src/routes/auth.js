const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const CommissionService = require('../services/commissionService');
const TwoFactorService = require('../services/twoFactorService');
const SecurityService = require('../services/securityService');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/jwtToken');
const { generateReferralCode } = require('../utils/generateReferralCode');
const { validate } = require('../utils/validation');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { checkSimulationActive } = require('../middleware/simulationStatus');
const { authenticate } = require('../middleware/auth');

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
      const { email, password, twoFactorToken } = req.validatedBody;

      // Find user by email
      const user = await User.findByEmail(email);

      if (!user) {
        // Log failed login attempt
        await SecurityService.logLogin(null, req.ip, req.headers['user-agent'], false, 'invalid_credentials');
        
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Compare password
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        // Log failed login attempt
        await SecurityService.logLogin(user.id, req.ip, req.headers['user-agent'], false, 'invalid_password');
        
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check approval status (students only)
      if (user.role === 'student') {
        if (user.approval_status === 'pending') {
          return res.status(403).json({
            error: 'Your account is pending instructor approval. Please wait for approval to login.',
            code: 'PENDING_APPROVAL'
          });
        }
        if (user.approval_status === 'rejected') {
          return res.status(403).json({
            error: 'Your account registration was not approved. Please contact your instructor.',
            code: 'ACCOUNT_REJECTED'
          });
        }
      }

      // Check if 2FA is enabled
      const is2FAEnabled = await TwoFactorService.is2FAEnabled(user.id);

      if (is2FAEnabled) {
        // Require 2FA token
        if (!twoFactorToken) {
          return res.status(200).json({
            success: false,
            requires2FA: true,
            message: 'Two-factor authentication required'
          });
        }

        // Verify 2FA token
        const verification = await TwoFactorService.verifyLogin2FA(user.id, twoFactorToken);

        if (!verification.success) {
          // Log failed 2FA attempt
          await SecurityService.logLogin(user.id, req.ip, req.headers['user-agent'], false, '2fa_failed');
          
          return res.status(401).json({
            error: 'Invalid two-factor authentication code',
            code: 'INVALID_2FA_TOKEN'
          });
        }
      }

      // Log successful login
      await SecurityService.logLogin(user.id, req.ip, req.headers['user-agent'], true);

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
            referralCode: user.referral_code,
            approvalStatus: user.approval_status || 'approved',
            has2FA: is2FAEnabled
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        name: error.name
      });
      res.status(500).json({
        error: 'Login failed',
        code: 'DATABASE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/v1/auth/2fa/setup
 * Setup 2FA for user (generates QR code)
 */
router.post('/2fa/setup',
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      // Generate secret and QR code
      const { secret, otpauthUrl } = TwoFactorService.generateSecret(user.email);
      const qrCode = await TwoFactorService.generateQRCode(otpauthUrl);

      // Generate backup codes
      const backupCodes = TwoFactorService.generateBackupCodes(8);

      // Save to database (not enabled yet)
      await TwoFactorService.setup2FA(userId, secret, backupCodes);

      res.json({
        success: true,
        data: {
          secret,
          qrCode,
          backupCodes,
          message: 'Scan QR code with your authenticator app, then verify to enable 2FA'
        }
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({
        error: 'Failed to setup 2FA',
        code: 'DATABASE_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/auth/2fa/enable
 * Enable 2FA after user verifies token
 */
router.post('/2fa/enable',
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Token is required',
          code: 'MISSING_TOKEN'
        });
      }

      await TwoFactorService.enable2FA(userId, token);

      res.json({
        success: true,
        data: {
          message: 'Two-factor authentication enabled successfully'
        }
      });
    } catch (error) {
      console.error('2FA enable error:', error);
      res.status(400).json({
        error: error.message || 'Failed to enable 2FA',
        code: 'ENABLE_2FA_FAILED'
      });
    }
  }
);

/**
 * POST /api/v1/auth/2fa/disable
 * Disable 2FA (requires password confirmation)
 */
router.post('/2fa/disable',
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: 'Password is required to disable 2FA',
          code: 'MISSING_PASSWORD'
        });
      }

      await TwoFactorService.disable2FA(userId, password);

      res.json({
        success: true,
        data: {
          message: 'Two-factor authentication disabled successfully'
        }
      });
    } catch (error) {
      console.error('2FA disable error:', error);
      res.status(400).json({
        error: error.message || 'Failed to disable 2FA',
        code: 'DISABLE_2FA_FAILED'
      });
    }
  }
);

/**
 * GET /api/v1/auth/2fa/status
 * Get 2FA status for current user
 */
router.get('/2fa/status',
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const status = await TwoFactorService.get2FAStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('2FA status error:', error);
      res.status(500).json({
        error: 'Failed to get 2FA status',
        code: 'DATABASE_ERROR'
      });
    }
  }
);

module.exports = router;
