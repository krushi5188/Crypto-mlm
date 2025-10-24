const { pool } = require('../config/database');

class Withdrawal {
  // Create withdrawal request
  static async create(withdrawalData) {
    const {
      user_id,
      amount,
      wallet_address,
      network = 'TRC20',
      transaction_fee = 0,
      net_amount,
      notes = null
    } = withdrawalData;

    const result = await pool.query(
      `INSERT INTO withdrawals
       (user_id, amount, wallet_address, network, transaction_fee, net_amount, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [user_id, amount, wallet_address, network, transaction_fee, net_amount, notes]
    );

    return result.rows[0];
  }

  // Get user's withdrawal history
  static async getUserWithdrawals(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, amount, wallet_address, network, status, transaction_hash,
              transaction_fee, net_amount, notes, rejected_reason,
              created_at, updated_at, approved_at, completed_at
       FROM withdrawals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM withdrawals WHERE user_id = $1',
      [userId]
    );

    return {
      withdrawals: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  // Get withdrawal by ID
  static async getById(withdrawalId, userId = null) {
    let query = 'SELECT * FROM withdrawals WHERE id = $1';
    const params = [withdrawalId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Get all pending withdrawals (for instructor)
  static async getPendingWithdrawals() {
    const result = await pool.query(
      `SELECT w.*, u.email, u.username
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'pending'
       ORDER BY w.created_at ASC`
    );

    return result.rows;
  }

  // Get all withdrawals with filters (for instructor)
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

  // Update withdrawal status
  static async updateStatus(withdrawalId, status, details = {}) {
    const {
      approved_by = null,
      rejected_reason = null,
      transaction_hash = null
    } = details;

    let query = `UPDATE withdrawals SET status = $1`;
    let params = [status, withdrawalId];
    let paramCount = 2;

    if (status === 'approved') {
      query += `, approved_by = $${++paramCount}, approved_at = CURRENT_TIMESTAMP`;
      params.splice(2, 0, approved_by);
    }

    if (status === 'rejected' && rejected_reason) {
      query += `, rejected_reason = $${++paramCount}`;
      params.splice(2, 0, rejected_reason);
    }

    if (status === 'completed') {
      query += `, completed_at = CURRENT_TIMESTAMP`;
      if (transaction_hash) {
        query += `, transaction_hash = $${++paramCount}`;
        params.splice(2, 0, transaction_hash);
      }
    }

    query += ` WHERE id = $2 RETURNING *`;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Cancel withdrawal (user can cancel if still pending)
  static async cancel(withdrawalId, userId) {
    const result = await pool.query(
      `UPDATE withdrawals
       SET status = 'rejected', rejected_reason = 'Cancelled by user'
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
      [withdrawalId, userId]
    );

    return result.rows[0];
  }

  // Get withdrawal statistics for user
  static async getUserStats(userId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_withdrawals,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN net_amount ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN transaction_fee ELSE 0 END), 0) as total_fees
       FROM withdrawals
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Get system-wide withdrawal statistics (for instructor)
  static async getSystemStats() {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_withdrawals,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN net_amount ELSE 0 END), 0) as total_withdrawn,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN transaction_fee ELSE 0 END), 0) as total_fees
       FROM withdrawals`
    );

    return result.rows[0];
  }

  // Calculate withdrawal fee
  static calculateFee(amount, feePercentage = 2, fixedFee = 1) {
    const percentageFee = (amount * feePercentage) / 100;
    const totalFee = percentageFee + fixedFee;
    return {
      fee: parseFloat(totalFee.toFixed(2)),
      netAmount: parseFloat((amount - totalFee).toFixed(2))
    };
  }
}

module.exports = Withdrawal;
