const { pool } = require('../config/database');
const crypto = require('crypto');

class ApiKey {
  // Generate API key and secret
  static generateKeys() {
    const apiKey = 'ak_' + crypto.randomBytes(24).toString('hex');
    const apiSecret = 'sk_' + crypto.randomBytes(24).toString('hex');
    return { apiKey, apiSecret };
  }

  // Create API key
  static async create(keyData) {
    const {
      user_id,
      key_name,
      permissions = [],
      rate_limit_per_hour = 1000,
      expires_at = null
    } = keyData;

    const { apiKey, apiSecret } = this.generateKeys();

    const result = await pool.query(
      `INSERT INTO api_keys
       (user_id, key_name, api_key, api_secret, permissions, rate_limit_per_hour, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, key_name, apiKey, apiSecret, JSON.stringify(permissions), rate_limit_per_hour, expires_at]
    );

    return result.rows[0];
  }

  // Get user's API keys
  static async getUserKeys(userId) {
    const result = await pool.query(
      `SELECT id, user_id, key_name, api_key, permissions, rate_limit_per_hour,
              is_active, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Get API key by key (for authentication)
  static async getByKey(apiKey) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );

    const key = result.rows[0];

    // Check if expired
    if (key && key.expires_at && new Date(key.expires_at) < new Date()) {
      return null;
    }

    return key;
  }

  // Verify API key and secret
  static async verify(apiKey, apiSecret) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE api_key = $1 AND api_secret = $2 AND is_active = true',
      [apiKey, apiSecret]
    );

    const key = result.rows[0];

    // Check if expired
    if (key && key.expires_at && new Date(key.expires_at) < new Date()) {
      return null;
    }

    // Update last used
    if (key) {
      await pool.query(
        'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
        [key.id]
      );
    }

    return key;
  }

  // Check rate limit
  static async checkRateLimit(apiKeyId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT COUNT(*) as request_count
       FROM api_request_log
       WHERE api_key_id = $1 AND created_at >= $2`,
      [apiKeyId, oneHourAgo]
    );

    const requestCount = parseInt(result.rows[0].request_count);

    // Get rate limit
    const keyResult = await pool.query(
      'SELECT rate_limit_per_hour FROM api_keys WHERE id = $1',
      [apiKeyId]
    );

    const rateLimit = keyResult.rows[0]?.rate_limit_per_hour || 1000;

    return {
      count: requestCount,
      limit: rateLimit,
      remaining: Math.max(0, rateLimit - requestCount),
      exceeded: requestCount >= rateLimit
    };
  }

  // Log API request
  static async logRequest(apiKeyId, endpoint, method, ipAddress, responseStatus, responseTimeMs) {
    await pool.query(
      `INSERT INTO api_request_log
       (api_key_id, endpoint, method, ip_address, response_status, response_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [apiKeyId, endpoint, method, ipAddress, responseStatus, responseTimeMs]
    );
  }

  // Revoke API key
  static async revoke(apiKeyId, userId) {
    const result = await pool.query(
      'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING *',
      [apiKeyId, userId]
    );

    return result.rows[0];
  }

  // Delete API key
  static async delete(apiKeyId, userId) {
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2 RETURNING *',
      [apiKeyId, userId]
    );

    return result.rows[0];
  }

  // Get API key statistics
  static async getStats(apiKeyId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_requests,
        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as failed_requests,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time
       FROM api_request_log
       WHERE api_key_id = $1`,
      [apiKeyId]
    );

    return result.rows[0];
  }

  // Get request history
  static async getRequestHistory(apiKeyId, limit = 100) {
    const result = await pool.query(
      `SELECT endpoint, method, response_status, response_time_ms, created_at
       FROM api_request_log
       WHERE api_key_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [apiKeyId, limit]
    );

    return result.rows;
  }
}

module.exports = ApiKey;
