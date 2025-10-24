const { pool } = require('../config/database');

class CacheService {
  constructor() {
    this.enabled = process.env.CACHE_ENABLED !== 'false';
    this.defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS) || 300; // 5 minutes
  }

  // Generate cache key
  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${paramString}`;
  }

  // Get from cache
  async get(key) {
    if (!this.enabled) return null;

    try {
      const result = await pool.query(
        'SELECT cache_value FROM cache_entries WHERE cache_key = $1 AND expires_at > CURRENT_TIMESTAMP',
        [key]
      );

      if (result.rows.length > 0) {
        return result.rows[0].cache_value;
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cache
  async set(key, value, ttlSeconds = null) {
    if (!this.enabled) return false;

    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttl * 1000);

      await pool.query(
        `INSERT INTO cache_entries (cache_key, cache_value, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (cache_key)
         DO UPDATE SET cache_value = EXCLUDED.cache_value, expires_at = EXCLUDED.expires_at, created_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(value), expiresAt]
      );

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete from cache
  async delete(key) {
    if (!this.enabled) return false;

    try {
      await pool.query('DELETE FROM cache_entries WHERE cache_key = $1', [key]);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete by pattern
  async deletePattern(pattern) {
    if (!this.enabled) return false;

    try {
      await pool.query('DELETE FROM cache_entries WHERE cache_key LIKE $1', [pattern + '%']);
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Clear all cache
  async clear() {
    if (!this.enabled) return false;

    try {
      await pool.query('DELETE FROM cache_entries');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Clean expired entries
  async cleanExpired() {
    try {
      await pool.query('DELETE FROM cache_entries WHERE expires_at < CURRENT_TIMESTAMP');
      return true;
    } catch (error) {
      console.error('Cache clean error:', error);
      return false;
    }
  }

  // Wrap function with cache
  async wrap(key, fn, ttlSeconds = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn();

    // Store in cache
    await this.set(key, result, ttlSeconds);

    return result;
  }

  // Get cache statistics
  async getStats() {
    try {
      const result = await pool.query(
        `SELECT
          COUNT(*) as total_entries,
          COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_entries,
          COUNT(CASE WHEN expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired_entries
         FROM cache_entries`
      );

      return result.rows[0];
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Clean expired entries every hour
setInterval(() => {
  cacheService.cleanExpired();
}, 60 * 60 * 1000);

module.exports = cacheService;
