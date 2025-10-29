const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const CommissionService = require('../services/commissionService');
const TwoFactorService = require('../services/twoFactorService');
const SecurityService = require('../services/securityService');
const { hashPassword, comparePassword } = require('../utils/passwordHash');
const { generateToken } = require('../utils/jwtToken');
const { generateReferralCode } = require('../utils/generateReferralCode');
const { validate } = require('../utils/validation');
const { registerLimiter, loginLimiter } = require('../middleware/rateLimiter');
const { checkSimulationActive } = require('../middleware/simulationStatus');
const { trackLogin, trackFailedLogin } = require('../middleware/fraudTracking');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/v1/auth/register
 * Register new member account
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

      // Participant limit check removed - platform now supports unlimited members

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
      if (referrer.role === 'member' && referrer.approval_status !== 'approved') {
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
        role: 'member',
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
 * Login for members and instructor
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
        // Track failed login
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        await trackFailedLogin(email, ipAddress, userAgent, 'Invalid credentials');

        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Compare password
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        // Track failed login
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        await trackFailedLogin(email, ipAddress, userAgent, 'Invalid password');

        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if 2FA is enabled (OPTIONAL - only required if user enabled it)
      // If user hasn't enabled 2FA, this entire block is skipped
      const has2FA = await TwoFactorAuth.isEnabled(user.id);
      
      if (has2FA) {
        const { twoFactorToken } = req.body;
        
        if (!twoFactorToken) {
          // 2FA required but not provided
          return res.status(200).json({
            success: false,
            requires2FA: true,
            userId: user.id,
            message: 'Two-factor authentication required'
          });
        }
        
        // Verify 2FA token
        const verifyResult = await TwoFactorAuth.verify(user.id, twoFactorToken);
        
        if (!verifyResult.success) {
          return res.status(401).json({
            error: verifyResult.error || 'Invalid 2FA code',
            code: 'INVALID_2FA_CODE'
          });
        }
      }

      // Check approval status (members only)
      if (user.role === 'member') {
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

      // Update last login
      await User.updateLastLogin(user.id);

      // Track successful login for fraud detection (Temporarily disabled to fix login issue)
      // req.user = { id: user.id };
      // await trackLogin(req, res, () => {});

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
            approvalStatus: user.approval_status || 'approved'
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
