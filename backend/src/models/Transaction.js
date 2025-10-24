const { pool } = require('../config/database');

class Transaction {
  // Create transaction record
  static async create(transactionData, connection = pool) {
    const { user_id, amount, type, level, triggered_by_user_id, description, balance_after } = transactionData;

    const result = await connection.query(
      `INSERT INTO transactions
       (user_id, amount, type, level, triggered_by_user_id, description, balance_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [user_id, amount, type, level || null, triggered_by_user_id || null, description || null, balance_after]
    );

    return result.rows[0].id;
  }

  // Get user's transaction history
  static async getUserTransactions(userId, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC') {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT t.id, t.amount, t.type, t.level, t.description, t.balance_after, t.created_at,
              t.triggered_by_user_id, u.email as triggered_by_email
       FROM transactions t
       LEFT JOIN users u ON t.triggered_by_user_id = u.id
       WHERE t.user_id = $1
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1',
      [userId]
    );

    return {
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  // Get direct invites with earnings summary
  static async getDirectInvitesEarnings(userId) {
    const result = await pool.query(
      `SELECT 
        u.id as user_id,
        u.email,
        COALESCE(SUM(t.amount), 0) as total_earned,
        COUNT(t.id) as transaction_count
      FROM users u
      LEFT JOIN transactions t ON t.triggered_by_user_id = u.id AND t.user_id = $1
      WHERE u.referred_by_id = $1
      GROUP BY u.id, u.email
      ORDER BY total_earned DESC`,
      [userId]
    );
    return result.rows;
  }

  // Get transactions triggered by a specific user
  static async getTransactionsByTriggeredUser(userId, triggeredByUserId) {
    const result = await pool.query(
      `SELECT id, amount, type, level, description, balance_after, created_at
       FROM transactions
       WHERE user_id = $1 AND triggered_by_user_id = $2
       ORDER BY created_at DESC`,
      [userId, triggeredByUserId]
    );
    return result.rows;
  }

  // Get recent transactions for user (for dashboard)
  static async getRecentTransactions(userId, limit = 10) {
    const result = await pool.query(
      `SELECT id, amount, type, level, description, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  // Get earnings summary
  static async getEarningsSummary(userId) {
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END), 0) as today_earnings,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN amount ELSE 0 END), 0) as week_earnings,
        COALESCE(SUM(amount), 0) as all_time_earnings
       FROM transactions
       WHERE user_id = $1 AND type = 'commission'`,
      [userId]
    );
    return result.rows[0];
  }

  // Get all transactions (for instructor export)
  static async getAllTransactions() {
    const result = await pool.query(
      `SELECT t.*, u.username
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    return result.rows;
  }
}

module.exports = Transaction;
