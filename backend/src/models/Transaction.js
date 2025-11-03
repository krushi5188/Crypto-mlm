const { db } = require('../config/database');

class Transaction {
  // Create transaction record
  static async create(transactionData, connection = db) {
    const [result] = await connection('transactions').insert(transactionData).returning('id');
    return result.id;
  }

  // Get user's transaction history
  static async getUserTransactions(userId, page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC') {
    const query = db('transactions as t')
      .select('t.id', 't.amount', 't.type', 't.level', 't.description', 't.balance_after', 't.created_at', 't.triggered_by_user_id', 'u.email as triggered_by_email')
      .leftJoin('users as u', 't.triggered_by_user_id', 'u.id')
      .where('t.user_id', userId);

    const total = await query.clone().count({ count: '*' }).first();
    const transactions = await query.orderBy(sortBy, sortOrder).limit(limit).offset((page - 1) * limit);

    return {
      transactions,
      total: parseInt(total.count)
    };
  }

  // Get direct invites with earnings summary
  static async getDirectInvitesEarnings(userId) {
    return db('users as u')
      .select('u.id as user_id', 'u.email', db.raw('COALESCE(SUM(t.amount), 0) as total_earned'), db.raw('COUNT(t.id) as transaction_count'))
      .leftJoin('transactions as t', function () {
        this.on('t.triggered_by_user_id', '=', 'u.id').andOn('t.user_id', '=', userId);
      })
      .where('u.referred_by_id', userId)
      .groupBy('u.id', 'u.email')
      .orderBy('total_earned', 'desc');
  }

  // Get transactions triggered by a specific user
  static async getTransactionsByTriggeredUser(userId, triggeredByUserId) {
    return db('transactions')
      .select('id', 'amount', 'type', 'level', 'description', 'balance_after', 'created_at')
      .where({ user_id: userId, triggered_by_user_id: triggeredByUserId })
      .orderBy('created_at', 'desc');
  }

  // Get recent transactions for user (for dashboard)
  static async getRecentTransactions(userId, limit = 10) {
    return db('transactions')
      .select('id', 'amount', 'type', 'level', 'description', 'created_at')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  // Get earnings summary
  static async getEarningsSummary(userId) {
    return db('transactions')
      .where({ user_id: userId, type: 'commission' })
      .select(
        db.raw(`COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END), 0) as today_earnings`),
        db.raw(`COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN amount ELSE 0 END), 0) as week_earnings`),
        db.raw('COALESCE(SUM(amount), 0) as all_time_earnings')
      )
      .first();
  }

  // Get all transactions (for instructor export)
  static async getAllTransactions() {
    return db('transactions as t')
      .select('t.*', 'u.username')
      .join('users as u', 't.user_id', 'u.id')
      .orderBy('t.created_at', 'desc');
  }
}

module.exports = Transaction;
