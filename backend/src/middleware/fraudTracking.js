const FraudDetection = require('../utils/fraudDetection');
const { pool } = require('../config/database');

/**
 * Middleware to track login attempts and device/IP information
 * Should be called after successful authentication
 */
const trackLogin = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Extract device info
    const deviceInfo = FraudDetection.parseUserAgent(userAgent);
    const fingerprint = FraudDetection.generateFingerprint(userAgent);

    // Record in login_history (if table exists) - non-blocking
    Promise.resolve().then(async () => {
      try {
        await pool.query(
          `INSERT INTO login_history
           (user_id, ip_address, user_agent, device_info, login_method, success)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, ipAddress, userAgent, JSON.stringify(deviceInfo), 'password', true]
        );
      } catch (err) {
        // Table might not exist yet, silently continue
      }
    });

    // Record device and IP (background task - don't block response)
    Promise.all([
      FraudDetection.recordDevice(userId, userAgent, ipAddress),
      FraudDetection.recordIP(userId, ipAddress)
    ]).catch(err => {
      // Silently fail - fraud detection is not critical
    });

    // Calculate risk score (background task)
    FraudDetection.calculateRiskScore(userId).catch(err => {
      // Silently fail - fraud detection is not critical
    });

    next();
  } catch (error) {
    console.error('Error in fraud tracking middleware:', error);
    // Don't block the request on fraud tracking errors
    next();
  }
};

/**
 * Middleware to track failed login attempts
 */
const trackFailedLogin = async (email, ipAddress, userAgent, reason) => {
  try {
    // Find user by email
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return; // User doesn't exist
    }

    const userId = userResult.rows[0].id;
    const deviceInfo = FraudDetection.parseUserAgent(userAgent);

    // Record failed login (non-blocking, handle missing table)
    try {
      await pool.query(
        `INSERT INTO login_history
         (user_id, ip_address, user_agent, device_info, login_method, success, failure_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, ipAddress, userAgent, JSON.stringify(deviceInfo), 'password', false, reason]
      );
    } catch (err) {
      // Table might not exist, silently fail
    }

    // Recalculate risk score after failed attempt
    FraudDetection.calculateRiskScore(userId).catch(err => {
      // Silently fail - fraud detection is not critical
    });
  } catch (error) {
    // Silently fail - fraud detection is not critical
  }
};

/**
 * Middleware to check if user is flagged
 * Blocks access for flagged accounts
 */
const checkFlagged = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const result = await pool.query(
      'SELECT is_flagged, flagged_reason FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows[0]?.is_flagged) {
      return res.status(403).json({
        error: 'Account Flagged',
        message: 'Your account has been flagged for security review. Please contact support.',
        reason: result.rows[0].flagged_reason
      });
    }

    next();
  } catch (error) {
    console.error('Error checking flagged status:', error);
    next();
  }
};

module.exports = {
  trackLogin,
  trackFailedLogin,
  checkFlagged
};
