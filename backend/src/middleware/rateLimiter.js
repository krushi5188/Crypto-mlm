const rateLimit = require('express-rate-limit');
const { pool } = require('../config/database');

// In-memory store as fallback for database-backed rate limiting
const memoryStore = new Map();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Login rate limiter - 5 requests per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiter - 3 requests per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    error: 'Too many registration attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter - 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Database-backed rate limiter with in-memory fallback
const dbRateLimiter = (maxRequests = 100, windowMs = 60 * 60 * 1000) => {
  return async (req, res, next) => {
    try {
      // Determine identifier (userId or IP)
      const identifier = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
      const now = Date.now();
      const windowStart = new Date(now - windowMs);

      let requestCount = 0;
      let useMemoryFallback = false;

      try {
        // Try database first
        const result = await pool.query(
          `SELECT COUNT(*) as count
           FROM api_request_log
           WHERE (user_id = $1 OR ip_address = $2)
             AND created_at >= $3`,
          [req.user?.id || null, req.ip, windowStart]
        );
        requestCount = parseInt(result.rows[0].count);
      } catch (dbError) {
        console.error('Rate limiter DB error, falling back to memory:', dbError);
        useMemoryFallback = true;

        // Use in-memory store
        const stored = memoryStore.get(identifier);
        if (stored && now < stored.resetTime) {
          requestCount = stored.count;
        } else {
          memoryStore.set(identifier, {
            count: 0,
            resetTime: now + windowMs
          });
          requestCount = 0;
        }
      }

      // Check if limit exceeded
      if (requestCount >= maxRequests) {
        const resetTime = useMemoryFallback
          ? memoryStore.get(identifier).resetTime
          : now + windowMs;

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
          retryAfter: Math.ceil((resetTime - now) / 1000)
        });
      }

      // Increment counter in memory if using fallback
      if (useMemoryFallback) {
        const stored = memoryStore.get(identifier);
        stored.count++;
        memoryStore.set(identifier, stored);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount - 1));
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block request on rate limiter errors
      next();
    }
  };
};

// API key specific rate limiter
const apiKeyRateLimiter = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Verify API key
    const ApiKey = require('../models/ApiKey');
    const keyData = await ApiKey.getByKey(apiKey);

    if (!keyData) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check rate limit
    const rateLimit = await ApiKey.checkRateLimit(keyData.id);

    if (rateLimit.exceeded) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `API key rate limit of ${rateLimit.limit} requests per hour exceeded.`,
        limit: rateLimit.limit,
        remaining: 0,
        resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimit.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 3600);

    // Attach API key data to request
    req.apiKey = keyData;

    // Log request after response
    const startTime = Date.now();
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      ApiKey.logRequest(
        keyData.id,
        req.path,
        req.method,
        req.ip,
        res.statusCode,
        responseTime
      ).catch(err => console.error('Failed to log API request:', err));
    });

    next();
  } catch (error) {
    console.error('API key rate limiter error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Check permissions for API key
const checkApiPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'API key authentication required' });
    }

    const permissions = req.apiKey.permissions;

    if (!permissions.includes('*') && !permissions.includes(requiredPermission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredPermission,
        granted: permissions
      });
    }

    next();
  };
};

module.exports = { 
  loginLimiter, 
  registerLimiter, 
  apiLimiter,
  dbRateLimiter,
  apiKeyRateLimiter,
  checkApiPermission
};
