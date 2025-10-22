const { pool } = require('../config/database');

class Transaction {
  // Create transaction record
  static async create(transactionData, connection = pool) {
    const { user_id, amount, type, level, triggered_by_user_id, description, balance_after } = transactionData;

    const [result] = await connection.query(
      `INSERT INTO transactions
       (user_id, amount, type, level, triggered_by_user_id, description, balance_after)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, amount, type, level || null, triggered_by_user_id || null, description || null, balance_after]
    );

    return result.insertId;
  }

  // Get user's transaction history
  static async getUserTransactions(userId, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC') {
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT id, amount, type, level, description, balance_after, created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    // Get total count
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [userId]
    );

    return {
      transactions: rows,
      total: countResult[0].total
    };
  }

  // Get recent transactions for user (for dashboard)
  static async getRecentTransactions(userId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT id, amount, type, level, description, created_at
       FROM transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  // Get earnings summary
  static async getEarningsSummary(userId) {
    const [rows] = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 END), 0) as today_earnings,
        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN amount ELSE 0 END), 0) as week_earnings,
        COALESCE(SUM(amount), 0) as all_time_earnings
       FROM transactions
       WHERE user_id = ? AND type = 'commission'`,
      [userId]
    );
    return rows[0];
  }

  // Get all transactions (for instructor export)
  static async getAllTransactions() {
    const [rows] = await pool.query(
      `SELECT t.*, u.username
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    return rows;
  }
}

module.exports = Transaction;
