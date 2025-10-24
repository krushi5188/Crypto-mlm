const { pool } = require('../config/database');

class Referral {
  // Create referral record
  static async create(userId, uplineId, level, connection = pool) {
    await connection.query(
      'INSERT INTO referrals (user_id, upline_id, level) VALUES ($1, $2, $3)',
      [userId, uplineId, level]
    );
  }

  // Get all upline for a user (up to 5 levels)
  static async getUpline(userId) {
    const result = await pool.query(
      `SELECT r.upline_id, r.level, u.username, u.balance
       FROM referrals r
       JOIN users u ON r.upline_id = u.id
       WHERE r.user_id = $1
       ORDER BY r.level ASC`,
      [userId]
    );
    return result.rows;
  }

  // Get downline by level for a user
  static async getDownlineByLevel(uplineId, level = null) {
    let query = `
      SELECT r.user_id, r.level, u.username, u.created_at, u.direct_recruits, u.is_active
      FROM referrals r
      JOIN users u ON r.user_id = u.id
      WHERE r.upline_id = $1
    `;
    const params = [uplineId];

    if (level) {
      query += ' AND r.level = $2';
      params.push(level);
    }

    query += ' ORDER BY r.level ASC, u.created_at ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get downline grouped by level
  static async getDownlineGrouped(uplineId) {
    const result = await pool.query(
      `SELECT r.level, COUNT(*) as count
       FROM referrals r
       WHERE r.upline_id = $1
       GROUP BY r.level
       ORDER BY r.level ASC`,
      [uplineId]
    );

    // Convert to object with levels 1-5
    const resultObj = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.rows.forEach(row => {
      resultObj[row.level] = parseInt(row.count);
    });

    return resultObj;
  }

  // Get complete network tree for visualization
  static async getCompleteNetwork() {
    const edgesResult = await pool.query(
      `SELECT user_id as from_id, upline_id as to_id, level
       FROM referrals
       WHERE level = 1`  // Only direct relationships for tree structure
    );

    const nodesResult = await pool.query(
      `SELECT id, username, balance, direct_recruits, total_earned
       FROM users
       WHERE role = 'member'`
    );

    return { nodes: nodesResult.rows, edges: edgesResult.rows };
  }
}

module.exports = Referral;
