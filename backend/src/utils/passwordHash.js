const bcrypt = require('bcryptjs');

// Hash password with bcrypt (10 rounds)
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password with hash (timing-safe)
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };
