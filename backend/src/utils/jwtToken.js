const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: 'HS256'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
