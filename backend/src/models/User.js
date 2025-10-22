const { pool } = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const { email, username, password_hash, role, referral_code, referred_by_id } = userData;

    const [result] = await pool.query(
      `INSERT INTO users (email, username, password_hash, role, referral_code, referred_by_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, username, password_hash, role, referral_code, referred_by_id || null]
    );

    return result.insertId;
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Find user by referral code
  static async findByReferralCode(referralCode) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE referral_code = ?',
      [referralCode]
    );
    return rows[0] || null;
  }

  // Update user balance and earnings
  static async updateBalance(userId, amount, connection = pool) {
    const [result] = await connection.query(
      `UPDATE users
       SET balance = balance + ?,
           total_earned = total_earned + ?
       WHERE id = ?`,
      [amount, amount, userId]
    );
    return result.affectedRows > 0;
  }

  // Increment direct recruits
  static async incrementDirectRecruits(userId, connection = pool) {
    await connection.query(
      'UPDATE users SET direct_recruits = direct_recruits + 1 WHERE id = ?',
      [userId]
    );
  }

  // Increment network size
  static async incrementNetworkSize(userId, connection = pool) {
    await connection.query(
      'UPDATE users SET network_size = network_size + 1 WHERE id = ?',
      [userId]
    );
  }

  // Update last login
  static async updateLastLogin(userId) {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    );
  }

  // Update profile
  static async updateProfile(userId, updates) {
    const fields = [];
    const values = [];

    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.username) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.password_hash) {
      fields.push('password_hash = ?');
      values.push(updates.password_hash);
    }

    if (fields.length === 0) return false;

    values.push(userId);

    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Count total students
  static async countStudents() {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );
    return rows[0].count;
  }

  // Get all students with pagination
  static async getAllStudents(page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC', search = '') {
    const offset = (page - 1) * limit;
    let query = `SELECT id, email, username, balance, total_earned, direct_recruits,
                        network_size, referred_by_id, created_at, last_login
                 FROM users
                 WHERE role = 'student'`;
    const params = [];

    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE role = 'student'";
    const countParams = [];

    if (search) {
      countQuery += ` AND (username LIKE ? OR email LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(countQuery, countParams);

    return {
      participants: rows,
      total: countResult[0].total
    };
  }

  // Get top earners
  static async getTopEarners(limit = 10) {
    const [rows] = await pool.query(
      `SELECT id, username, balance, direct_recruits, network_size, created_at
       FROM users
       WHERE role = 'student'
       ORDER BY balance DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  // Get recent joins
  static async getRecentJoins(limit = 10) {
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.created_at, r.username as referred_by
       FROM users u
       LEFT JOIN users r ON u.referred_by_id = r.id
       WHERE u.role = 'student'
       ORDER BY u.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  }

  // Get distribution stats
  static async getDistributionStats() {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) as total_students,
        SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) as zero_balance,
        SUM(CASE WHEN total_earned >= 100 AND total_earned <= 100 THEN 1 ELSE 0 END) as broke_even,
        SUM(CASE WHEN total_earned > 100 THEN 1 ELSE 0 END) as profited,
        SUM(balance) as total_balance
       FROM users
       WHERE role = 'student'`
    );
    return rows[0];
  }
}

module.exports = User;
