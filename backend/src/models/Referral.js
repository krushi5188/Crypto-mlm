const { db } = require('../config/database');

class Referral {
  // Create referral record
  static async create(userId, uplineId, level, connection = db) {
    return connection('referrals').insert({ user_id: userId, upline_id: uplineId, level });
  }

  // Get all upline for a user (up to 5 levels)
  static async getUpline(userId) {
    return db('referrals as r')
      .select('r.upline_id', 'r.level', 'u.username', 'u.balance')
      .join('users as u', 'r.upline_id', 'u.id')
      .where('r.user_id', userId)
      .orderBy('r.level', 'asc');
  }

  // Get downline by level for a user
  static async getDownlineByLevel(uplineId, level = null) {
    const query = db('referrals as r')
      .select('r.user_id', 'r.level', 'u.username', 'u.created_at', 'u.direct_recruits', 'u.is_active')
      .join('users as u', 'r.user_id', 'u.id')
      .where('r.upline_id', uplineId);

    if (level) {
      query.andWhere('r.level', level);
    }

    return query.orderBy(['r.level', 'u.created_at'], ['asc', 'asc']);
  }

  // Get downline grouped by level
  static async getDownlineGrouped(uplineId) {
    const rows = await db('referrals as r')
      .select('r.level')
      .count('* as count')
      .where('r.upline_id', uplineId)
      .groupBy('r.level')
      .orderBy('r.level', 'asc');

    const resultObj = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rows.forEach(row => {
      resultObj[row.level] = parseInt(row.count);
    });

    return resultObj;
  }

  // Get complete network tree for visualization
  static async getCompleteNetwork() {
    const edges = await db('referrals')
      .select('user_id as from_id', 'upline_id as to_id', 'level')
      .where('level', 1);

    const nodes = await db('users')
      .select('id', 'username', 'balance', 'direct_recruits', 'total_earned')
      .where('role', 'member');

    return { nodes, edges };
  }
}

module.exports = Referral;
