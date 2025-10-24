const { pool } = require('../config/database');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorAuth {
  // Generate 2FA secret for user
  static async generateSecret(userId, userEmail) {
    const secret = speakeasy.generateSecret({
      name: `Atlas Network (${userEmail})`,
      length: 32
    });

    // Store in database
    await pool.query(
      `INSERT INTO user_2fa (user_id, secret, is_enabled)
       VALUES ($1, $2, false)
       ON CONFLICT (user_id)
       DO UPDATE SET secret = $2, updated_at = CURRENT_TIMESTAMP`,
      [userId, secret.base32]
    );

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url
    };
  }

  // Enable 2FA after verification
  static async enable(userId, token, secret) {
    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after
    });

    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push(code);
    }

    // Enable 2FA
    await pool.query(
      `UPDATE user_2fa
       SET is_enabled = true, backup_codes = $1, enabled_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [JSON.stringify(backupCodes), userId]
    );

    return { success: true, backupCodes };
  }

  // Disable 2FA
  static async disable(userId) {
    await pool.query(
      'UPDATE user_2fa SET is_enabled = false WHERE user_id = $1',
      [userId]
    );
  }

  // Get user's 2FA settings
  static async getSettings(userId) {
    const result = await pool.query(
      'SELECT is_enabled, enabled_at FROM user_2fa WHERE user_id = $1',
      [userId]
    );

    return result.rows[0] || { is_enabled: false, enabled_at: null };
  }

  // Verify 2FA token
  static async verify(userId, token) {
    const result = await pool.query(
      'SELECT secret, backup_codes, is_enabled FROM user_2fa WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_enabled) {
      return { success: false, error: '2FA not enabled' };
    }

    const { secret, backup_codes } = result.rows[0];

    // Try TOTP verification
    const isTotpValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (isTotpValid) {
      return { success: true, method: 'totp' };
    }

    // Try backup code
    if (backup_codes) {
      const codes = JSON.parse(backup_codes);
      const codeIndex = codes.indexOf(token.toUpperCase());

      if (codeIndex !== -1) {
        // Remove used backup code
        codes.splice(codeIndex, 1);
        await pool.query(
          'UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2',
          [JSON.stringify(codes), userId]
        );

        return { success: true, method: 'backup', remainingCodes: codes.length };
      }
    }

    return { success: false, error: 'Invalid code' };
  }

  // Check if user has 2FA enabled
  static async isEnabled(userId) {
    const result = await pool.query(
      'SELECT is_enabled FROM user_2fa WHERE user_id = $1',
      [userId]
    );

    return result.rows.length > 0 && result.rows[0].is_enabled;
  }

  // Regenerate backup codes
  static async regenerateBackupCodes(userId) {
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push(code);
    }

    await pool.query(
      'UPDATE user_2fa SET backup_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [JSON.stringify(backupCodes), userId]
    );

    return backupCodes;
  }
}

module.exports = TwoFactorAuth;
