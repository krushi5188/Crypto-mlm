const { pool } = require('../config/database');

class Referral {
  // Create referral record
  static async create(userId, uplineId, level, connection = pool) {
    await connection.query(
      'INSERT INTO referrals (user_id, upline_id, level) VALUES (?, ?, ?)',
      [userId, uplineId, level]
    );
  }

  // Get all upline for a user (up to 5 levels)
  static async getUpline(userId) {
    const [rows] = await pool.query(
      `SELECT r.upline_id, r.level, u.username, u.balance
       FROM referrals r
       JOIN users u ON r.upline_id = u.id
       WHERE r.user_id = ?
       ORDER BY r.level ASC`,
      [userId]
    );
    return rows;
  }

  // Get downline by level for a user
  static async getDownlineByLevel(uplineId, level = null) {
    let query = `
      SELECT r.user_id, r.level, u.username, u.created_at, u.direct_recruits, u.is_active
      FROM referrals r
      JOIN users u ON r.user_id = u.id
      WHERE r.upline_id = ?
    `;
    const params = [uplineId];

    if (level) {
      query += ' AND r.level = ?';
      params.push(level);
    }

    query += ' ORDER BY r.level ASC, u.created_at ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  // Get downline grouped by level
  static async getDownlineGrouped(uplineId) {
    const [rows] = await pool.query(
      `SELECT r.level, COUNT(*) as count
       FROM referrals r
       WHERE r.upline_id = ?
       GROUP BY r.level
       ORDER BY r.level ASC`,
      [uplineId]
    );

    // Convert to object with levels 1-5
    const result = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rows.forEach(row => {
      result[row.level] = row.count;
    });

    return result;
  }

  // Get complete network tree for visualization
  static async getCompleteNetwork() {
    const [edges] = await pool.query(
      `SELECT user_id as from_id, upline_id as to_id, level
       FROM referrals
       WHERE level = 1`  // Only direct relationships for tree structure
    );

    const [nodes] = await pool.query(
      `SELECT id, username, balance, direct_recruits, total_earned
       FROM users
       WHERE role = 'student'`
    );

    return { nodes, edges };
  }
}

module.exports = Referral;
