const { verifyToken } = require('../utils/jwtToken');

// Authentication middleware - verify JWT token
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No token provided',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'UNAUTHORIZED'
      });
    }

    // Attach user data to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'UNAUTHORIZED'
    });
  }
};

module.exports = { authenticate };
