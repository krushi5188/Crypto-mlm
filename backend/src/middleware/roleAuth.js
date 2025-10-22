// Role-based authorization middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        error: 'Access forbidden - insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// Require instructor role
const requireInstructor = requireRole('instructor');

// Require student role
const requireStudent = requireRole('student');

module.exports = { requireRole, requireInstructor, requireStudent };
