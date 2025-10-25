const { pool } = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const { email, username, password_hash, role, referral_code, referred_by_id } = userData;

    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash, role, referral_code, referred_by_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [email, username, password_hash, role, referral_code, referred_by_id || null]
    );

    return result.rows[0].id;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Find user by referral code
  static async findByReferralCode(referralCode) {
    const result = await pool.query(
      'SELECT * FROM users WHERE referral_code = $1',
      [referralCode]
    );
    return result.rows[0] || null;
  }

  // Update user balance and earnings
  static async updateBalance(userId, amount, connection = pool) {
    const result = await connection.query(
      `UPDATE users
       SET balance = balance + $1,
           total_earned = total_earned + $2
       WHERE id = $3`,
      [amount, amount, userId]
    );
    return result.rowCount > 0;
  }

  // Increment direct recruits
  static async incrementDirectRecruits(userId, connection = pool) {
    await connection.query(
      'UPDATE users SET direct_recruits = direct_recruits + 1 WHERE id = $1',
      [userId]
    );
  }

  // Increment network size
  static async incrementNetworkSize(userId, connection = pool) {
    await connection.query(
      'UPDATE users SET network_size = network_size + 1 WHERE id = $1',
      [userId]
    );
  }

  // Update last login
  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  }

  // Update profile
  static async updateProfile(userId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.username) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.password_hash) {
      fields.push(`password_hash = $${paramIndex++}`);
      values.push(updates.password_hash);
    }

    if (fields.length === 0) return false;

    values.push(userId);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );

    return result.rowCount > 0;
  }

  // Count total members
  static async countStudents() {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'member'"
    );
    return parseInt(result.rows[0].count);
  }

  // Get all members with pagination
  static async getAllStudents(page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC', search = '') {
    const offset = (page - 1) * limit;
    let query = `SELECT id, email, username, balance, total_earned, direct_recruits,
                        network_size, referred_by_id, created_at, last_login
                 FROM users
                 WHERE role = 'member'`;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (username LIKE $${paramIndex} OR email LIKE $${paramIndex + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE role = 'member'";
    const countParams = [];

    if (search) {
      countQuery += ` AND (username LIKE $1 OR email LIKE $2)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    return {
      participants: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  // Alias for getAllStudents - used by instructor routes
  static async getAllMembers(page, limit, sortBy, sortOrder, search) {
    return this.getAllStudents(page, limit, sortBy, sortOrder, search);
  }

  // Get top earners
  static async getTopEarners(limit = 10) {
    const result = await pool.query(
      `SELECT id, username, balance, direct_recruits, network_size, created_at
       FROM users
       WHERE role = 'member'
       ORDER BY balance DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get recent joins
  static async getRecentJoins(limit = 10) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.created_at, r.username as referred_by
       FROM users u
       LEFT JOIN users r ON u.referred_by_id = r.id
       WHERE u.role = 'member'
       ORDER BY u.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get distribution stats
  static async getDistributionStats() {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_members,
        SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) as zero_balance,
        SUM(CASE WHEN total_earned >= 100 AND total_earned <= 100 THEN 1 ELSE 0 END) as broke_even,
        SUM(CASE WHEN total_earned > 100 THEN 1 ELSE 0 END) as profited,
        SUM(balance) as total_balance
       FROM users
       WHERE role = 'member'`
    );
    return result.rows[0];
  }
}

module.exports = User;
