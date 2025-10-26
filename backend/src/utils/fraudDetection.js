const crypto = require('crypto');
const { pool } = require('../config/database');

/**
 * Fraud Detection Utility
 * Calculates risk scores and detects suspicious activity
 */

class FraudDetection {
  // Cache for table existence check
  static tablesExist = null;

  /**
   * Check if fraud detection tables exist in database
   */
  static async checkTablesExist() {
    // Return cached result if available
    if (this.tablesExist !== null) {
      return this.tablesExist;
    }

    try {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('device_fingerprints', 'ip_addresses', 'fraud_rules', 'fraud_alerts')
      `);
      
      // Check if all required tables exist
      const tableNames = result.rows.map(r => r.table_name);
      this.tablesExist = tableNames.length === 4;
      
      return this.tablesExist;
    } catch (error) {
      // On error, assume tables don't exist
      this.tablesExist = false;
      return false;
    }
  }

  /**
   * Generate device fingerprint hash from user agent and other device info
   */
  static generateFingerprint(userAgent, additionalData = {}) {
    const data = {
      userAgent,
      ...additionalData
    };
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Extract device information from user agent
   */
  static parseUserAgent(userAgent) {
    const info = {
      browser: null,
      os: null,
      device_type: 'desktop'
    };

    // Browser detection
    if (/Chrome/i.test(userAgent)) info.browser = 'Chrome';
    else if (/Firefox/i.test(userAgent)) info.browser = 'Firefox';
    else if (/Safari/i.test(userAgent)) info.browser = 'Safari';
    else if (/Edge/i.test(userAgent)) info.browser = 'Edge';
    else if (/Opera/i.test(userAgent)) info.browser = 'Opera';

    // OS detection
    if (/Windows/i.test(userAgent)) info.os = 'Windows';
    else if (/Mac/i.test(userAgent)) info.os = 'macOS';
    else if (/Linux/i.test(userAgent)) info.os = 'Linux';
    else if (/Android/i.test(userAgent)) info.os = 'Android';
    else if (/iOS/i.test(userAgent)) info.os = 'iOS';

    // Device type detection
    if (/Mobile|Android|iPhone/i.test(userAgent)) info.device_type = 'mobile';
    else if (/Tablet|iPad/i.test(userAgent)) info.device_type = 'tablet';

    return info;
  }

  /**
   * Record device fingerprint for user
   */
  static async recordDevice(userId, userAgent, ipAddress) {
    try {
      const fingerprint = this.generateFingerprint(userAgent);
      const deviceInfo = this.parseUserAgent(userAgent);

      // Check if device already exists
      const existing = await pool.query(
        `SELECT id, login_count FROM device_fingerprints
         WHERE user_id = $1 AND fingerprint_hash = $2`,
        [userId, fingerprint]
      );

      if (existing.rows.length > 0) {
        // Update existing device
        await pool.query(
          `UPDATE device_fingerprints
           SET last_seen_at = NOW(), login_count = login_count + 1
           WHERE id = $1`,
          [existing.rows[0].id]
        );
      } else {
        // Insert new device
        await pool.query(
          `INSERT INTO device_fingerprints
           (user_id, fingerprint_hash, device_info, user_agent, browser, os, device_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            fingerprint,
            JSON.stringify(deviceInfo),
            userAgent,
            deviceInfo.browser,
            deviceInfo.os,
            deviceInfo.device_type
          ]
        );
      }

      return fingerprint;
    } catch (error) {
      console.error('Error recording device:', error);
      throw error;
    }
  }

  /**
   * Record IP address for user
   */
  static async recordIP(userId, ipAddress) {
    try {
      // Check if IP already exists for user
      const existing = await pool.query(
        `SELECT id, login_count FROM ip_addresses
         WHERE user_id = $1 AND ip_address = $2`,
        [userId, ipAddress]
      );

      if (existing.rows.length > 0) {
        // Update existing IP
        await pool.query(
          `UPDATE ip_addresses
           SET last_seen_at = NOW(), login_count = login_count + 1
           WHERE id = $1`,
          [existing.rows[0].id]
        );
      } else {
        // Insert new IP
        await pool.query(
          `INSERT INTO ip_addresses (user_id, ip_address)
           VALUES ($1, $2)`,
          [userId, ipAddress]
        );
      }
    } catch (error) {
      console.error('Error recording IP:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive risk score for a user
   * Returns score from 0-100
   */
  static async calculateRiskScore(userId) {
    try {
      let riskScore = 0;
      const evidence = [];

      // Get fraud rules
      const rulesResult = await pool.query(
        'SELECT * FROM fraud_rules WHERE is_active = true'
      );
      const rules = rulesResult.rows;

      // Factor 1: Multiple accounts from same IP (weight: 30)
      const ipCheckResult = await pool.query(
        `SELECT ip_address, COUNT(DISTINCT user_id) as user_count
         FROM ip_addresses
         WHERE ip_address IN (SELECT ip_address FROM ip_addresses WHERE user_id = $1)
         GROUP BY ip_address
         HAVING COUNT(DISTINCT user_id) > 1`,
        [userId]
      );

      if (ipCheckResult.rows.length > 0) {
        const maxAccounts = ipCheckResult.rows[0].user_count;
        const ipRule = rules.find(r => r.rule_type === 'multi_account_ip');
        const threshold = ipRule ? ipRule.threshold.max_accounts : 3;

        if (maxAccounts > threshold) {
          const weight = ipRule ? ipRule.weight : 30;
          riskScore += weight;
          evidence.push({
            type: 'multi_account_ip',
            severity: 'high',
            detail: `${maxAccounts} accounts from same IP`
          });

          // Create fraud alert
          await this.createFraudAlert(userId, 'multi_account_ip', 'high',
            `${maxAccounts} accounts detected from same IP address`,
            { accounts: maxAccounts, ips: ipCheckResult.rows }, weight);
        }
      }

      // Factor 2: Same device fingerprint (weight: 25)
      const deviceCheckResult = await pool.query(
        `SELECT fingerprint_hash, COUNT(DISTINCT user_id) as user_count
         FROM device_fingerprints
         WHERE fingerprint_hash IN (SELECT fingerprint_hash FROM device_fingerprints WHERE user_id = $1)
         GROUP BY fingerprint_hash
         HAVING COUNT(DISTINCT user_id) > 1`,
        [userId]
      );

      if (deviceCheckResult.rows.length > 0) {
        const maxAccounts = deviceCheckResult.rows[0].user_count;
        const deviceRule = rules.find(r => r.rule_type === 'multi_account_device');
        const threshold = deviceRule ? deviceRule.threshold.max_accounts : 2;

        if (maxAccounts > threshold) {
          const weight = deviceRule ? deviceRule.weight : 25;
          riskScore += weight;
          evidence.push({
            type: 'multi_account_device',
            severity: 'high',
            detail: `${maxAccounts} accounts from same device`
          });

          await this.createFraudAlert(userId, 'multi_account_device', 'high',
            `${maxAccounts} accounts detected from same device`,
            { accounts: maxAccounts, devices: deviceCheckResult.rows }, weight);
        }
      }

      // Factor 3: Failed login attempts (weight: 10)
      const failedLoginsResult = await pool.query(
        `SELECT COUNT(*) as failed_count
         FROM login_history
         WHERE user_id = $1 AND success = false AND created_at > NOW() - INTERVAL '30 minutes'`,
        [userId]
      );

      const failedLogins = parseInt(failedLoginsResult.rows[0].failed_count);
      if (failedLogins >= 5) {
        riskScore += 10;
        evidence.push({
          type: 'failed_login_threshold',
          severity: 'medium',
          detail: `${failedLogins} failed logins in 30 minutes`
        });

        await this.createFraudAlert(userId, 'failed_login_threshold', 'medium',
          `${failedLogins} failed login attempts in 30 minutes`,
          { failed_count: failedLogins }, 10);
      }

      // Factor 4: Rapid account creation from same source (weight: 20)
      const rapidCreationResult = await pool.query(
        `SELECT COUNT(*) as account_count
         FROM users u1
         WHERE EXISTS (
           SELECT 1 FROM ip_addresses ip1
           WHERE ip1.user_id = u1.id
           AND ip1.ip_address IN (SELECT ip_address FROM ip_addresses WHERE user_id = $1)
         )
         AND u1.created_at > NOW() - INTERVAL '24 hours'`,
        [userId]
      );

      const recentAccounts = parseInt(rapidCreationResult.rows[0].account_count);
      if (recentAccounts >= 3) {
        riskScore += 20;
        evidence.push({
          type: 'rapid_registration',
          severity: 'high',
          detail: `${recentAccounts} accounts created in 24 hours from same source`
        });

        await this.createFraudAlert(userId, 'rapid_registration', 'high',
          `${recentAccounts} accounts created in 24 hours from same IP`,
          { account_count: recentAccounts }, 20);
      }

      // Factor 5: Suspicious transaction patterns (weight: 15)
      const transactionResult = await pool.query(
        `SELECT COUNT(*) as tx_count, SUM(amount) as total_amount
         FROM transactions
         WHERE user_id = $1 AND type = 'commission' AND created_at > NOW() - INTERVAL '1 hour'`,
        [userId]
      );

      const recentTxCount = parseInt(transactionResult.rows[0].tx_count);
      if (recentTxCount > 10) {
        riskScore += 15;
        evidence.push({
          type: 'suspicious_transaction',
          severity: 'medium',
          detail: `${recentTxCount} transactions in 1 hour`
        });

        await this.createFraudAlert(userId, 'suspicious_transaction', 'medium',
          `Unusual transaction volume: ${recentTxCount} in 1 hour`,
          { transaction_count: recentTxCount }, 15);
      }

      // Cap risk score at 100
      riskScore = Math.min(riskScore, 100);

      // Update user's risk score
      await pool.query(
        'UPDATE users SET risk_score = $1 WHERE id = $2',
        [riskScore, userId]
      );

      // Auto-flag if score >= 75
      if (riskScore >= 75) {
        await this.flagUser(userId, 'Automatic flag: High risk score detected', 'system');
      }

      return {
        riskScore,
        level: this.getRiskLevel(riskScore),
        evidence
      };
    } catch (error) {
      console.error('Error calculating risk score:', error);
      throw error;
    }
  }

  /**
   * Get risk level from score
   */
  static getRiskLevel(score) {
    if (score >= 76) return 'critical';
    if (score >= 51) return 'high';
    if (score >= 21) return 'medium';
    return 'low';
  }

  /**
   * Create fraud alert
   */
  static async createFraudAlert(userId, ruleType, severity, description, evidence, riskContribution) {
    try {
      await pool.query(
        `INSERT INTO fraud_alerts
         (user_id, rule_type, severity, description, evidence, risk_score_contribution)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, ruleType, severity, description, JSON.stringify(evidence), riskContribution]
      );
    } catch (error) {
      console.error('Error creating fraud alert:', error);
      // Don't throw - alerts are not critical
    }
  }

  /**
   * Flag user for review
   */
  static async flagUser(userId, reason, reviewedBy = null) {
    try {
      await pool.query(
        `UPDATE users
         SET is_flagged = true, flagged_at = NOW(), flagged_reason = $1, reviewed_by = $2
         WHERE id = $3`,
        [reason, reviewedBy, userId]
      );

      // Create security event
      await pool.query(
        `INSERT INTO security_events
         (user_id, event_type, severity, description, metadata)
         VALUES ($1, 'account_locked', 'high', $2, $3)`,
        [userId, 'Account flagged for fraud review', JSON.stringify({ reason, reviewed_by: reviewedBy })]
      );

      return true;
    } catch (error) {
      console.error('Error flagging user:', error);
      throw error;
    }
  }

  /**
   * Unflag user after review
   */
  static async unflagUser(userId, reviewerId, notes = null) {
    try {
      await pool.query(
        `UPDATE users
         SET is_flagged = false, reviewed_by = $1, reviewed_at = NOW()
         WHERE id = $2`,
        [reviewerId, userId]
      );

      // Update pending alerts
      await pool.query(
        `UPDATE fraud_alerts
         SET status = 'resolved', resolved_at = NOW(), resolution_notes = $1
         WHERE user_id = $2 AND status = 'pending'`,
        [notes, userId]
      );

      return true;
    } catch (error) {
      console.error('Error unflagging user:', error);
      throw error;
    }
  }

  /**
   * Find related accounts
   */
  static async findRelatedAccounts(userId) {
    try {
      const related = [];

      // Find by shared IPs
      const ipResult = await pool.query(
        `SELECT DISTINCT u.id, u.username, u.email, u.created_at, ip.ip_address
         FROM users u
         JOIN ip_addresses ip ON u.id = ip.user_id
         WHERE ip.ip_address IN (SELECT ip_address FROM ip_addresses WHERE user_id = $1)
         AND u.id != $1
         ORDER BY u.created_at DESC`,
        [userId]
      );

      related.push(...ipResult.rows.map(row => ({
        ...row,
        relationship: 'shared_ip',
        confidence: 70
      })));

      // Find by shared devices
      const deviceResult = await pool.query(
        `SELECT DISTINCT u.id, u.username, u.email, u.created_at, df.fingerprint_hash
         FROM users u
         JOIN device_fingerprints df ON u.id = df.user_id
         WHERE df.fingerprint_hash IN (SELECT fingerprint_hash FROM device_fingerprints WHERE user_id = $1)
         AND u.id != $1
         ORDER BY u.created_at DESC`,
        [userId]
      );

      related.push(...deviceResult.rows.map(row => ({
        ...row,
        relationship: 'shared_device',
        confidence: 85
      })));

      return related;
    } catch (error) {
      console.error('Error finding related accounts:', error);
      throw error;
    }
  }

  /**
   * Get fraud detection dashboard stats
   */
  static async getDashboardStats() {
    try {
      const flaggedCount = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE is_flagged = true'
      );

      const highRiskCount = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE risk_score >= 51'
      );

      const recentAlerts = await pool.query(
        `SELECT COUNT(*) as count FROM fraud_alerts
         WHERE created_at > NOW() - INTERVAL '24 hours'`
      );

      const pendingAlerts = await pool.query(
        'SELECT COUNT(*) as count FROM fraud_alerts WHERE status = \'pending\''
      );

      return {
        flaggedUsers: parseInt(flaggedCount.rows[0].count),
        highRiskUsers: parseInt(highRiskCount.rows[0].count),
        recentAlerts: parseInt(recentAlerts.rows[0].count),
        pendingAlerts: parseInt(pendingAlerts.rows[0].count)
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }
}

module.exports = FraudDetection;
