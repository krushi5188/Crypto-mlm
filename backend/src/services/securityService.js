const { pool } = require('../config/database');
const UAParser = require('ua-parser-js');

class SecurityService {
  /**
   * Log a login attempt (success or failure)
   */
  static async logLogin(userId, ipAddress, userAgent, success, failureReason = null, loginMethod = 'password') {
    try {
      // Parse user agent
      const parser = new UAParser(userAgent);
      const deviceInfo = {
        browser: parser.getBrowser(),
        os: parser.getOS(),
        device: parser.getDevice()
      };

      // Insert login record
      await pool.query(
        `INSERT INTO login_history
         (user_id, ip_address, user_agent, device_info, login_method, success, failure_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, ipAddress, userAgent, JSON.stringify(deviceInfo), loginMethod, success, failureReason]
      );

      // If successful, check for suspicious activity
      if (success && userId) {
        await this.checkSuspiciousActivity(userId, ipAddress, deviceInfo);
      }

      // If failed, check for brute force attempts
      if (!success && userId) {
        await this.checkFailedAttempts(userId, ipAddress);
      }

      return true;
    } catch (error) {
      console.error('Log login error:', error);
      throw error;
    }
  }

  /**
   * Check for suspicious login activity
   */
  static async checkSuspiciousActivity(userId, ipAddress, deviceInfo) {
    try {
      // Get recent successful logins (last 30 days)
      const recentLogins = await pool.query(
        `SELECT ip_address, device_info, created_at
         FROM login_history
         WHERE user_id = $1 AND success = TRUE
         ORDER BY created_at DESC
         LIMIT 20`,
        [userId]
      );

      if (recentLogins.rows.length < 2) {
        // Not enough history to determine suspicious activity
        return;
      }

      const currentLogin = {
        ip: ipAddress,
        device: deviceInfo,
        time: new Date()
      };

      const previousLogins = recentLogins.rows.slice(1); // Skip current login

      // Check for new IP address
      const knownIPs = previousLogins.map(login => login.ip_address);
      const isNewIP = !knownIPs.includes(ipAddress);

      // Check for new device type
      const knownDevices = previousLogins.map(login => {
        const info = typeof login.device_info === 'string'
          ? JSON.parse(login.device_info)
          : login.device_info;
        return `${info.os?.name}-${info.browser?.name}`;
      });
      const currentDeviceKey = `${deviceInfo.os?.name}-${deviceInfo.browser?.name}`;
      const isNewDevice = !knownDevices.includes(currentDeviceKey);

      // Check for rapid location change (login from different IP within 5 minutes)
      const lastLogin = recentLogins.rows[1]; // Most recent login before this one
      if (lastLogin) {
        const timeDiff = Date.now() - new Date(lastLogin.created_at).getTime();
        const minutesSinceLastLogin = timeDiff / 1000 / 60;

        if (minutesSinceLastLogin < 5 && lastLogin.ip_address !== ipAddress) {
          // Suspicious: Login from different location within 5 minutes
          await this.logSecurityEvent(
            userId,
            'suspicious_login',
            'medium',
            `Login from new location within 5 minutes (Previous: ${lastLogin.ip_address}, Current: ${ipAddress})`,
            {
              previousIP: lastLogin.ip_address,
              currentIP: ipAddress,
              minutesBetween: Math.round(minutesSinceLastLogin * 10) / 10
            }
          );
        }
      }

      // Log if new IP or device
      if (isNewIP && previousLogins.length > 5) {
        await this.logSecurityEvent(
          userId,
          'suspicious_login',
          'low',
          `Login from new IP address: ${ipAddress}`,
          { ipAddress, deviceInfo }
        );
      }

      if (isNewDevice && previousLogins.length > 5) {
        await this.logSecurityEvent(
          userId,
          'unusual_activity',
          'low',
          `Login from new device: ${currentDeviceKey}`,
          { deviceInfo }
        );
      }
    } catch (error) {
      console.error('Check suspicious activity error:', error);
      // Don't throw - this is a background check
    }
  }

  /**
   * Check for brute force attempts (multiple failed logins)
   */
  static async checkFailedAttempts(userId, ipAddress) {
    try {
      // Count failed attempts in last 15 minutes
      const result = await pool.query(
        `SELECT COUNT(*) as count
         FROM login_history
         WHERE user_id = $1
           AND success = FALSE
           AND created_at > NOW() - INTERVAL '15 minutes'`,
        [userId]
      );

      const failedCount = parseInt(result.rows[0].count);

      if (failedCount >= 5) {
        await this.logSecurityEvent(
          userId,
          'failed_login_attempts',
          'high',
          `${failedCount} failed login attempts in 15 minutes`,
          { failedCount, ipAddress }
        );
      }

      // Lock account after 10 failed attempts
      if (failedCount >= 10) {
        await this.lockAccount(userId, ipAddress);
      }
    } catch (error) {
      console.error('Check failed attempts error:', error);
    }
  }

  /**
   * Log a security event
   */
  static async logSecurityEvent(userId, eventType, severity, description, metadata = null) {
    try {
      await pool.query(
        `INSERT INTO security_events
         (user_id, event_type, severity, description, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, eventType, severity, description, metadata ? JSON.stringify(metadata) : null]
      );

      // Create notification for high severity events
      if (severity === 'high' || severity === 'critical') {
        const NotificationService = require('./notificationService');
        await NotificationService.createNotification(
          userId,
          'security_alert',
          'Security Alert',
          description,
          { eventType, severity }
        );
      }

      return true;
    } catch (error) {
      console.error('Log security event error:', error);
      throw error;
    }
  }

  /**
   * Lock user account due to suspicious activity
   */
  static async lockAccount(userId, ipAddress) {
    try {
      // Log the account lock event
      await this.logSecurityEvent(
        userId,
        'account_locked',
        'critical',
        `Account locked due to multiple failed login attempts from ${ipAddress}`,
        { ipAddress, reason: 'brute_force_detection' }
      );

      // Note: Actual account locking would require an 'is_locked' column in users table
      // For now, just log the event. Implement account locking in User model if needed.

      return true;
    } catch (error) {
      console.error('Lock account error:', error);
      throw error;
    }
  }

  /**
   * Get login history for user
   */
  static async getLoginHistory(userId, limit = 50, offset = 0) {
    try {
      const result = await pool.query(
        `SELECT id, ip_address, user_agent, device_info, login_method,
                success, failure_reason, created_at
         FROM login_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map(row => ({
        id: row.id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        deviceInfo: typeof row.device_info === 'string'
          ? JSON.parse(row.device_info)
          : row.device_info,
        loginMethod: row.login_method,
        success: row.success,
        failureReason: row.failure_reason,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Get login history error:', error);
      throw error;
    }
  }

  /**
   * Get security events for user
   */
  static async getSecurityEvents(userId, limit = 50, offset = 0, includeResolved = false) {
    try {
      let query = `
        SELECT id, event_type, severity, description, metadata,
               is_resolved, resolved_at, resolved_by, created_at
        FROM security_events
        WHERE user_id = $1
      `;

      if (!includeResolved) {
        query += ' AND is_resolved = FALSE';
      }

      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';

      const result = await pool.query(query, [userId, limit, offset]);

      return result.rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        severity: row.severity,
        description: row.description,
        metadata: typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
        isResolved: row.is_resolved,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Get security events error:', error);
      throw error;
    }
  }

  /**
   * Resolve a security event
   */
  static async resolveSecurityEvent(eventId, resolvedByUserId) {
    try {
      const result = await pool.query(
        `UPDATE security_events
         SET is_resolved = TRUE,
             resolved_at = CURRENT_TIMESTAMP,
             resolved_by = $1
         WHERE id = $2 AND user_id = $1
         RETURNING id`,
        [resolvedByUserId, eventId]
      );

      if (result.rows.length === 0) {
        throw new Error('Security event not found or does not belong to user');
      }

      return true;
    } catch (error) {
      console.error('Resolve security event error:', error);
      throw error;
    }
  }

  /**
   * Get security summary for user
   */
  static async getSecuritySummary(userId) {
    try {
      // Get login statistics
      const loginStats = await pool.query(
        `SELECT
           COUNT(*) as total_logins,
           COUNT(*) FILTER (WHERE success = TRUE) as successful_logins,
           COUNT(*) FILTER (WHERE success = FALSE) as failed_logins,
           COUNT(DISTINCT ip_address) as unique_ips,
           MAX(created_at) FILTER (WHERE success = TRUE) as last_successful_login
         FROM login_history
         WHERE user_id = $1
           AND created_at > NOW() - INTERVAL '30 days'`,
        [userId]
      );

      // Get security event statistics
      const eventStats = await pool.query(
        `SELECT
           COUNT(*) as total_events,
           COUNT(*) FILTER (WHERE is_resolved = FALSE) as unresolved_events,
           COUNT(*) FILTER (WHERE severity = 'high' OR severity = 'critical') as high_severity_events
         FROM security_events
         WHERE user_id = $1
           AND created_at > NOW() - INTERVAL '30 days'`,
        [userId]
      );

      return {
        logins: {
          total: parseInt(loginStats.rows[0].total_logins),
          successful: parseInt(loginStats.rows[0].successful_logins),
          failed: parseInt(loginStats.rows[0].failed_logins),
          uniqueIPs: parseInt(loginStats.rows[0].unique_ips),
          lastSuccessful: loginStats.rows[0].last_successful_login
        },
        securityEvents: {
          total: parseInt(eventStats.rows[0].total_events),
          unresolved: parseInt(eventStats.rows[0].unresolved_events),
          highSeverity: parseInt(eventStats.rows[0].high_severity_events)
        },
        period: 'last_30_days'
      };
    } catch (error) {
      console.error('Get security summary error:', error);
      throw error;
    }
  }

  /**
   * Log password change
   */
  static async logPasswordChange(userId, ipAddress, userAgent) {
    try {
      const parser = new UAParser(userAgent);
      const deviceInfo = {
        browser: parser.getBrowser(),
        os: parser.getOS(),
        device: parser.getDevice()
      };

      await this.logSecurityEvent(
        userId,
        'password_change',
        'medium',
        'Password changed',
        { ipAddress, deviceInfo }
      );

      // Send notification
      const NotificationService = require('./notificationService');
      await NotificationService.createNotification(
        userId,
        'security_alert',
        'Password Changed',
        'Your password was successfully changed',
        { ipAddress }
      );

      return true;
    } catch (error) {
      console.error('Log password change error:', error);
      throw error;
    }
  }
}

module.exports = SecurityService;
