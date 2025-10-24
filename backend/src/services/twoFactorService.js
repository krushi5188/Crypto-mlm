const { pool } = require('../config/database');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { comparePassword } = require('../utils/passwordHash');

class TwoFactorService {
  /**
   * Generate a new 2FA secret for user
   */
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `Crypto MLM (${userEmail})`,
      issuer: 'Crypto MLM',
      length: 32
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  }

  /**
   * Generate QR code from otpauth URL
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw error;
    }
  }

  /**
   * Verify a TOTP token
   */
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before and after for clock drift
    });
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup codes with bcrypt
   */
  static async hashBackupCodes(codes) {
    const hashedCodes = [];
    for (const code of codes) {
      const hash = await bcrypt.hash(code, 10);
      hashedCodes.push(hash);
    }
    return hashedCodes;
  }

  /**
   * Verify a backup code against hashed codes
   */
  static async verifyBackupCode(plainCode, hashedCodes) {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(plainCode, hashedCodes[i]);
      if (isMatch) {
        return i; // Return index of matched code
      }
    }
    return -1; // No match
  }

  /**
   * Setup 2FA for user (not enabled yet)
   */
  static async setup2FA(userId, secret, backupCodes) {
    try {
      // Hash backup codes
      const hashedCodes = await this.hashBackupCodes(backupCodes);

      // Check if 2FA record already exists
      const existing = await pool.query(
        'SELECT id FROM user_2fa WHERE user_id = $1',
        [userId]
      );

      if (existing.rows.length > 0) {
        // Update existing record
        await pool.query(
          `UPDATE user_2fa
           SET secret = $1, backup_codes = $2, is_enabled = FALSE,
               enabled_at = NULL, last_used_at = NULL
           WHERE user_id = $3`,
          [secret, hashedCodes, userId]
        );
      } else {
        // Create new record
        await pool.query(
          `INSERT INTO user_2fa (user_id, secret, backup_codes, is_enabled)
           VALUES ($1, $2, $3, FALSE)`,
          [userId, secret, hashedCodes]
        );
      }

      return true;
    } catch (error) {
      console.error('Setup 2FA error:', error);
      throw error;
    }
  }

  /**
   * Enable 2FA after user verifies token
   */
  static async enable2FA(userId, token) {
    try {
      // Get 2FA record
      const result = await pool.query(
        'SELECT secret, is_enabled FROM user_2fa WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('2FA not set up. Please run setup first.');
      }

      const { secret, is_enabled } = result.rows[0];

      if (is_enabled) {
        throw new Error('2FA is already enabled');
      }

      // Verify token
      const isValid = this.verifyToken(secret, token);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable 2FA
      await pool.query(
        `UPDATE user_2fa
         SET is_enabled = TRUE, enabled_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );

      // Log security event
      const SecurityService = require('./securityService');
      await SecurityService.logSecurityEvent(
        userId,
        '2fa_enabled',
        'low',
        'Two-factor authentication enabled',
        null
      );

      return true;
    } catch (error) {
      console.error('Enable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA (requires password confirmation)
   */
  static async disable2FA(userId, password) {
    try {
      // Verify password
      const user = await User.findById(userId);
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Disable 2FA
      await pool.query(
        'DELETE FROM user_2fa WHERE user_id = $1',
        [userId]
      );

      // Log security event
      const SecurityService = require('./securityService');
      await SecurityService.logSecurityEvent(
        userId,
        '2fa_disabled',
        'medium',
        'Two-factor authentication disabled',
        null
      );

      return true;
    } catch (error) {
      console.error('Disable 2FA error:', error);
      throw error;
    }
  }

  /**
   * Check if 2FA is enabled for user
   */
  static async is2FAEnabled(userId) {
    try {
      const result = await pool.query(
        'SELECT is_enabled FROM user_2fa WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      return result.rows[0].is_enabled;
    } catch (error) {
      console.error('Check 2FA enabled error:', error);
      return false;
    }
  }

  /**
   * Verify 2FA token or backup code during login
   */
  static async verifyLogin2FA(userId, token) {
    try {
      // Get 2FA record
      const result = await pool.query(
        'SELECT secret, backup_codes FROM user_2fa WHERE user_id = $1 AND is_enabled = TRUE',
        [userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: '2FA not enabled' };
      }

      const { secret, backup_codes } = result.rows[0];

      // Try to verify as TOTP token first
      const isValidToken = this.verifyToken(secret, token);

      if (isValidToken) {
        // Update last used
        await pool.query(
          'UPDATE user_2fa SET last_used_at = CURRENT_TIMESTAMP WHERE user_id = $1',
          [userId]
        );

        return { success: true, method: 'token' };
      }

      // Try backup codes
      const backupCodeIndex = await this.verifyBackupCode(token, backup_codes);

      if (backupCodeIndex !== -1) {
        // Remove used backup code
        const updatedCodes = backup_codes.filter((_, index) => index !== backupCodeIndex);

        await pool.query(
          'UPDATE user_2fa SET backup_codes = $1, last_used_at = CURRENT_TIMESTAMP WHERE user_id = $2',
          [updatedCodes, userId]
        );

        return {
          success: true,
          method: 'backup_code',
          remainingCodes: updatedCodes.length
        };
      }

      return { success: false, error: 'Invalid code' };
    } catch (error) {
      console.error('Verify login 2FA error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get 2FA status for user
   */
  static async get2FAStatus(userId) {
    try {
      const result = await pool.query(
        `SELECT is_enabled, enabled_at, last_used_at,
                array_length(backup_codes, 1) as backup_codes_count
         FROM user_2fa
         WHERE user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          enabled: false,
          setupCompleted: false
        };
      }

      const row = result.rows[0];

      return {
        enabled: row.is_enabled,
        setupCompleted: true,
        enabledAt: row.enabled_at,
        lastUsedAt: row.last_used_at,
        backupCodesRemaining: row.backup_codes_count || 0
      };
    } catch (error) {
      console.error('Get 2FA status error:', error);
      throw error;
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(userId, password) {
    try {
      // Verify password
      const user = await User.findById(userId);
      const isValidPassword = await comparePassword(password, user.password_hash);

      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Generate new backup codes
      const newCodes = this.generateBackupCodes(8);
      const hashedCodes = await this.hashBackupCodes(newCodes);

      // Update database
      await pool.query(
        'UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2',
        [hashedCodes, userId]
      );

      return newCodes;
    } catch (error) {
      console.error('Regenerate backup codes error:', error);
      throw error;
    }
  }
}

module.exports = TwoFactorService;
