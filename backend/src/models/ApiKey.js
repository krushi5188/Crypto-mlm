const { db } = require('../config/database');
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
    const { apiKey, apiSecret } = this.generateKeys();
    const [result] = await db('api_keys').insert({ ...keyData, api_key: apiKey, api_secret: apiSecret }).returning('*');
    return result;
  }

  // Get user's API keys
  static async getUserKeys(userId) {
    return db('api_keys')
      .select('id', 'user_id', 'key_name', 'api_key', 'permissions', 'rate_limit_per_hour', 'is_active', 'last_used_at', 'expires_at', 'created_at')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
  }

  // Get API key by key (for authentication)
  static async getByKey(apiKey) {
    const key = await db('api_keys').where({ api_key: apiKey, is_active: true }).first();

    // Check if expired
    if (key && key.expires_at && new Date(key.expires_at) < new Date()) {
      return null;
    }

    return key;
  }

  // Verify API key and secret
  static async verify(apiKey, apiSecret) {
    const key = await db('api_keys').where({ api_key: apiKey, api_secret: apiSecret, is_active: true }).first();

    if (!key || (key.expires_at && new Date(key.expires_at) < new Date())) {
      return null;
    }

    await db('api_keys').where({ id: key.id }).update({ last_used_at: db.fn.now() });

    return key;
  }

  // Check rate limit
  static async checkRateLimit(apiKeyId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { request_count } = await db('api_request_log')
      .where({ api_key_id: apiKeyId })
      .andWhere('created_at', '>=', oneHourAgo)
      .count({ request_count: '*' })
      .first();

    const { rate_limit_per_hour } = await db('api_keys').select('rate_limit_per_hour').where({ id: apiKeyId }).first();

    const rateLimit = rate_limit_per_hour || 1000;
    const requestCount = parseInt(request_count);

    return {
      count: requestCount,
      limit: rateLimit,
      remaining: Math.max(0, rateLimit - requestCount),
      exceeded: requestCount >= rateLimit
    };
  }

  // Log API request
  static async logRequest(apiKeyId, endpoint, method, ipAddress, responseStatus, responseTimeMs) {
    return db('api_request_log').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      ip_address: ipAddress,
      response_status: responseStatus,
      response_time_ms: responseTimeMs
    });
  }

  // Revoke API key
  static async revoke(apiKeyId, userId) {
    const [result] = await db('api_keys')
      .where({ id: apiKeyId, user_id: userId })
      .update({ is_active: false })
      .returning('*');
    return result;
  }

  // Delete API key
  static async delete(apiKeyId, userId) {
    const [result] = await db('api_keys')
      .where({ id: apiKeyId, user_id: userId })
      .del()
      .returning('*');
    return result;
  }

  // Get API key statistics
  static async getStats(apiKeyId) {
    return db('api_request_log')
      .where({ api_key_id: apiKeyId })
      .select(
        db.raw('COUNT(*) as total_requests'),
        db.raw('COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_requests'),
        db.raw('COUNT(CASE WHEN response_status >= 400 THEN 1 END) as failed_requests'),
        db.raw('AVG(response_time_ms) as avg_response_time'),
        db.raw('MAX(response_time_ms) as max_response_time')
      )
      .first();
  }

  // Get request history
  static async getRequestHistory(apiKeyId, limit = 100) {
    return db('api_request_log')
      .select('endpoint', 'method', 'response_status', 'response_time_ms', 'created_at')
      .where({ api_key_id: apiKeyId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = ApiKey;
