const { pool } = require('../config/database');
const Notification = require('./Notification');

class Deposit {
  // Create new deposit request
  static async create(depositData) {
    const {
      user_id,
      amount,
      wallet_address,
      network,
      transaction_hash
    } = depositData;

    const result = await pool.query(
      `INSERT INTO deposits (user_id, amount, wallet_address, network, transaction_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, amount, wallet_address, network, transaction_hash]
    );

    return result.rows[0];
  }

  // Get deposit by ID
  static async getById(depositId) {
    const result = await pool.query(
      'SELECT * FROM deposits WHERE id = $1',
      [depositId]
    );
    return result.rows[0];
  }

  // Get user's deposits
  static async getUserDeposits(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM deposits
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM deposits WHERE user_id = $1',
      [userId]
    );

    return {
      deposits: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  // Get all pending deposits (for admin/instructor)
  static async getPendingDeposits(limit = 50) {
    const result = await pool.query(
      `SELECT d.*, u.username, u.email
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       WHERE d.status = 'pending'
       ORDER BY d.created_at ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get all deposits (for admin/instructor)
  static async getAll(filters = {}, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let valueIndex = 1;

    if (filters.status) {
      conditions.push(`d.status = $${valueIndex}`);
      values.push(filters.status);
      valueIndex++;
    }

    if (filters.userId) {
      conditions.push(`d.user_id = $${valueIndex}`);
      values.push(filters.userId);
      valueIndex++;
    }

    if (filters.network) {
      conditions.push(`d.network = $${valueIndex}`);
      values.push(filters.network);
      valueIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(limit, offset);

    const result = await pool.query(
      `SELECT d.*, u.username, u.email
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`,
      values
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM deposits d
       ${whereClause}`,
      values.slice(0, -2)
    );

    return {
      deposits: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  // Confirm deposit and credit user balance
  static async confirm(depositId, confirmedBy) {
    // Get deposit details
    const deposit = await this.getById(depositId);

    if (!deposit) {
      throw new Error('Deposit not found');
    }

    if (deposit.status !== 'pending') {
      throw new Error('Deposit is not pending');
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update deposit status
      await client.query(
        `UPDATE deposits
         SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, confirmations = 1
         WHERE id = $1`,
        [depositId]
      );

      // Credit user balance
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [deposit.amount, deposit.user_id]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description, balance_after)
         SELECT $1, 'deposit', $2, $3, balance
         FROM users WHERE id = $1`,
        [
          deposit.user_id,
          deposit.amount,
          `Deposit confirmed: ${deposit.transaction_hash.substring(0, 10)}...`
        ]
      );

      await client.query('COMMIT');

      // Send notification
      await Notification.create({
        user_id: deposit.user_id,
        type: 'system_message',
        title: 'Deposit Confirmed',
        message: `Your deposit of ${deposit.amount} AC has been confirmed and credited to your account.`
      });

      return await this.getById(depositId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Reject deposit
  static async reject(depositId, reason) {
    const result = await pool.query(
      `UPDATE deposits
       SET status = 'failed'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [depositId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const deposit = result.rows[0];

    // Send notification
    await Notification.create({
      user_id: deposit.user_id,
      type: 'system_message',
      title: 'Deposit Rejected',
      message: `Your deposit request has been rejected. ${reason ? `Reason: ${reason}` : ''}`
    });

    return deposit;
  }

  // Get deposit statistics for user
  static async getUserStats(userId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_deposits,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_deposited,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
       FROM deposits
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Get deposit statistics (admin/instructor)
  static async getStats() {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_deposits,
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_confirmed,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(DISTINCT user_id) as unique_depositors
       FROM deposits`
    );

    return result.rows[0];
  }

  // Check if transaction hash already exists
  static async existsByTxHash(transactionHash) {
    const result = await pool.query(
      'SELECT id FROM deposits WHERE transaction_hash = $1',
      [transactionHash]
    );
    return result.rows.length > 0;
  }
}

module.exports = Deposit;
