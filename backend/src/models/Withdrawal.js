const { pool } = require('../config/database');

class Withdrawal {
  static async create(withdrawalData) {
    const { user_id, amount, wallet_address, chain } = withdrawalData;
    const result = await pool.query(
      'INSERT INTO withdrawals (user_id, amount, wallet_address, chain) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, amount, wallet_address, chain]
    );
    return result.rows[0];
  }

  static async getUserWithdrawals(userId) {
    const result = await pool.query('SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  }

  static async getAllWithdrawals(filters = {}) {
    const { status, userId, page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (status) {
      whereConditions.push(`w.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (userId) {
      whereConditions.push(`w.user_id = $${paramCount}`);
      params.push(userId);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT w.*, u.email, u.username
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       ${whereClause}
       ORDER BY w.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    // Get total count
    const countParams = params.slice(0, paramCount - 1);
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM withdrawals w ${whereClause}`,
      countParams
    );

    return {
      withdrawals: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status, details = {}) {
    const { transaction_hash, rejected_reason, approved_by } = details;
    const result = await pool.query(
      'UPDATE withdrawals SET status = $1, transaction_hash = $2, rejected_reason = $3, approved_by = $4 WHERE id = $5 RETURNING *',
      [status, transaction_hash, rejected_reason, approved_by, id]
    );
    return result.rows[0];
  }
}

module.exports = Withdrawal;
