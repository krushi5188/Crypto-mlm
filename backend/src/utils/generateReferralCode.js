const { pool } = require('../config/database');

// Generate unique referral code
const generateReferralCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 6;
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random code
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const referralCode = `ATN-${code}`;

    // Check if code already exists
    const result = await pool.query(
      'SELECT id FROM users WHERE referral_code = $1',
      [referralCode]
    );

    if (result.rows.length === 0) {
      return referralCode;
    }
  }

  throw new Error('Failed to generate unique referral code after multiple attempts');
};

module.exports = { generateReferralCode };
