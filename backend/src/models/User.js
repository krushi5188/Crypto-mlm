const { db } = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const [id] = await db('users').insert(userData).returning('id');
    return id;
  }

  // Find user by email
  static async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  // Find user by wallet address
  static async findByWalletAddress(walletAddress) {
    return db('users').whereRaw('lower(wallet_address) = lower(?)', [walletAddress]).first();
  }

  // Find user by ID
  static async findById(id) {
    return db('users').where({ id }).first();
  }

  // Find user by referral code
  static async findByReferralCode(referralCode) {
    return db('users').where({ referral_code: referralCode }).first();
  }

  static async generateReferralCode() {
    const { customAlphabet } = await import('nanoid');
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(alphabet, 8);
    let referralCode;
    let isUnique = false;

    while (!isUnique) {
      referralCode = nanoid();
      const existingUser = await this.findByReferralCode(referralCode);
      if (!existingUser) {
        isUnique = true;
      }
    }

    return referralCode;
  }

  // Update user balance and earnings
  static async updateBalance(userId, amount, connection = db) {
    return connection('users')
      .where({ id: userId })
      .increment('balance', amount)
      .increment('total_earned', amount);
  }

  // Increment direct recruits
  static async incrementDirectRecruits(userId, connection = db) {
    return connection('users').where({ id: userId }).increment('direct_recruits', 1);
  }

  // Increment network size
  static async incrementNetworkSize(userId, connection = db) {
    return connection('users').where({ id: userId }).increment('network_size', 1);
  }

  // Update last login
  static async updateLastLogin(userId) {
    return db('users').where({ id: userId }).update({ last_login: db.fn.now() });
  }

  // Update profile
  static async updateProfile(userId, updates) {
    return db('users').where({ id: userId }).update(updates);
  }

  // Count total members
  static async countStudents() {
    const { count } = await db('users').where({ role: 'member' }).count({ count: '*' }).first();
    return parseInt(count);
  }

  // Get all members with pagination
  static async getAllStudents(page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC', search = '') {
    const query = db('users as u')
      .select('u.id', 'u.email', 'u.username', 'u.balance', 'u.total_earned', 'u.direct_recruits', 'u.network_size', 'u.referred_by_id', 'u.created_at', 'u.last_login', 'r.username as referred_by_username')
      .leftJoin('users as r', 'u.referred_by_id', 'r.id')
      .where('u.role', 'member');

    if (search) {
      query.where(function () {
        this.where('u.username', 'like', `%${search}%`).orWhere('u.email', 'like', `%${search}%`);
      });
    }

    const total = await query.clone().count({ count: '*' }).first();
    const participants = await query.orderBy(sortBy, sortOrder).limit(limit).offset((page - 1) * limit);

    return {
      participants,
      total: parseInt(total.count)
    };
  }

  // Alias for getAllStudents - used by instructor routes
  static async getAllMembers(page, limit, sortBy, sortOrder, search) {
    return this.getAllStudents(page, limit, sortBy, sortOrder, search);
  }

  // Get top earners
  static async getTopEarners(limit = 10) {
    return db('users')
      .select('id', 'username', 'balance', 'direct_recruits', 'network_size', 'created_at')
      .where({ role: 'member' })
      .orderBy('balance', 'desc')
      .limit(limit);
  }

  // Get recent joins
  static async getRecentJoins(limit = 10) {
    return db('users as u')
      .select('u.id', 'u.username', 'u.created_at', 'r.username as referred_by')
      .leftJoin('users as r', 'u.referred_by_id', 'r.id')
      .where('u.role', 'member')
      .orderBy('u.created_at', 'desc')
      .limit(limit);
  }

  // Get distribution stats
  static async getDistributionStats() {
    return db('users')
      .where({ role: 'member' })
      .select(
        db.raw('COUNT(*) as total_members'),
        db.raw('SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) as zero_balance'),
        db.raw('SUM(CASE WHEN total_earned >= 100 AND total_earned <= 100 THEN 1 ELSE 0 END) as broke_even'),
        db.raw('SUM(CASE WHEN total_earned > 100 THEN 1 ELSE 0 END) as profited'),
        db.raw('SUM(balance) as total_balance')
      )
      .first();
  }
}

module.exports = User;
