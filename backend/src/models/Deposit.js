const { db } = require('../config/database');
const Notification = require('./Notification');

class Deposit {
  // Create new deposit request
  static async create(depositData) {
    const [result] = await db('deposits').insert(depositData).returning('*');
    return result;
  }

  // Get deposit by ID
  static async getById(depositId) {
    return db('deposits').where({ id: depositId }).first();
  }

  // Get user's deposits
  static async getUserDeposits(userId, page = 1, limit = 20) {
    const query = db('deposits').where({ user_id: userId });

    const total = await query.clone().count({ count: '*' }).first();
    const deposits = await query.orderBy('created_at', 'desc').limit(limit).offset((page - 1) * limit);

    return {
      deposits,
      total: parseInt(total.count)
    };
  }

  // Get all pending deposits (for admin/instructor)
  static async getPendingDeposits(limit = 50) {
    return db('deposits as d')
      .select('d.*', 'u.username', 'u.email')
      .join('users as u', 'd.user_id', 'u.id')
      .where('d.status', 'pending')
      .orderBy('d.created_at', 'asc')
      .limit(limit);
  }

  // Get all deposits (for admin/instructor)
  static async getAll(filters = {}, page = 1, limit = 50) {
    const query = db('deposits as d').join('users as u', 'd.user_id', 'u.id');

    if (filters.status) {
      query.where('d.status', filters.status);
    }
    if (filters.userId) {
      query.where('d.user_id', filters.userId);
    }
    if (filters.network) {
      query.where('d.network', filters.network);
    }

    const total = await query.clone().count({ count: '*' }).first();
    const deposits = await query.select('d.*', 'u.username', 'u.email').orderBy('d.created_at', 'desc').limit(limit).offset((page - 1) * limit);

    return {
      deposits,
      total: parseInt(total.count)
    };
  }

  // Confirm deposit and credit user balance
  static async confirm(depositId, confirmedBy) {
    const deposit = await this.getById(depositId);

    if (!deposit) {
      throw new Error('Deposit not found');
    }
    if (deposit.status !== 'pending') {
      throw new Error('Deposit is not pending');
    }

    return db.transaction(async (trx) => {
      await trx('deposits')
        .where({ id: depositId })
        .update({
          status: 'confirmed',
          confirmed_at: db.fn.now(),
          confirmations: 1
        });

      await trx('users')
        .where({ id: deposit.user_id })
        .increment('balance', deposit.amount);

      const { balance } = await trx('users').select('balance').where({ id: deposit.user_id }).first();

      await trx('transactions').insert({
        user_id: deposit.user_id,
        type: 'deposit',
        amount: deposit.amount,
        description: `Deposit confirmed: ${deposit.transaction_hash.substring(0, 10)}...`,
        balance_after: balance
      });

      await Notification.create({
        user_id: deposit.user_id,
        type: 'system_message',
        title: 'Deposit Confirmed',
        message: `Your deposit of ${deposit.amount} AC has been confirmed and credited to your account.`
      }, trx);

      return this.getById(depositId);
    });
  }

  // Reject deposit
  static async reject(depositId, reason) {
    const [deposit] = await db('deposits')
      .where({ id: depositId, status: 'pending' })
      .update({ status: 'failed' })
      .returning('*');

    if (!deposit) {
      return null;
    }

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
    return db('deposits')
      .where({ user_id: userId })
      .select(
        db.raw('COUNT(*) as total_deposits'),
        db.raw(`COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_deposited`),
        db.raw(`COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount`),
        db.raw(`COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count`),
        db.raw(`COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count`),
        db.raw(`COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count`)
      )
      .first();
  }

  // Get deposit statistics (admin/instructor)
  static async getStats() {
    return db('deposits')
      .select(
        db.raw('COUNT(*) as total_deposits'),
        db.raw(`COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_confirmed`),
        db.raw(`COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending`),
        db.raw(`COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count`),
        db.raw(`COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count`),
        db.raw(`COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count`),
        db.raw('COUNT(DISTINCT user_id) as unique_depositors')
      )
      .first();
  }

  // Check if transaction hash already exists
  static async existsByTxHash(transactionHash) {
    const result = await db('deposits').where({ transaction_hash: transactionHash }).first();
    return !!result;
  }
}

module.exports = Deposit;
