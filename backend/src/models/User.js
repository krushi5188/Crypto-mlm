const { db } = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const { email, username, walletAddress, role, referral_code, referred_by_id, approval_status } = userData;

    const [newId] = await db('users').insert({
      email,
      username,
      wallet_address: walletAddress,
      role,
      referral_code,
      referred_by_id: referred_by_id || null,
      approval_status: approval_status || 'approved'
    }).returning('id');

    return newId.id;
  }

  // Find user by email
  static async findByEmail(email) {
    return db('users').where({ email }).first();
  }

  // Find user by wallet address
  static async findByWalletAddress(walletAddress) {
    return db('users').whereRaw('lower(wallet_address) = ?', [walletAddress.toLowerCase()]).first();
  }

  // Find user by ID
  static async findById(id) {
    return db('users').where({ id }).first();
  }

  // Find user by referral code
  static async findByReferralCode(referralCode) {
    return db('users').where({ referral_code: referralCode }).first();
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
    const { email, username, password_hash } = updates;
    const userUpdate = {};
    if (email) userUpdate.email = email;
    if (username) userUpdate.username = username;
    if (password_hash) userUpdate.password_hash = password_hash;

    if (Object.keys(userUpdate).length === 0) return 0;

    return db('users').where({ id: userId }).update(userUpdate);
  }

  // Count total members (renamed from countStudents)
  static async countMembers() {
    const result = await db('users').where({ role: 'member' }).count('id as count').first();
    return parseInt(result.count);
  }

  // Alias for backward compatibility
  static async countStudents() {
    return this.countMembers();
  }

  // Get all members with pagination
  static async getAllMembers(page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC', search = '') {
    const offset = (page - 1) * limit;

    const query = db('users as u')
      .select(
        'u.id', 'u.email', 'u.username', 'u.balance', 'u.total_earned', 'u.direct_recruits',
        'u.network_size', 'u.referred_by_id', 'u.created_at', 'u.last_login', 'u.approval_status',
        'r.username as referred_by_username'
      )
      .leftJoin('users as r', 'u.referred_by_id', 'r.id')
      .where('u.role', 'member');

    if (search) {
      query.where(function() {
        this.where('u.username', 'like', `%${search}%`)
            .orWhere('u.email', 'like', `%${search}%`);
      });
    }

    const countQuery = query.clone().clearSelect().count('u.id as total').first();
    const dataQuery = query.orderBy(sortBy, sortOrder).limit(limit).offset(offset);

    const [countResult, participants] = await Promise.all([countQuery, dataQuery]);

    return {
      participants,
      total: parseInt(countResult.total)
    };
  }

  // Alias for getAllMembers
  static async getAllStudents(page, limit, sortBy, sortOrder, search) {
    return this.getAllMembers(page, limit, sortBy, sortOrder, search);
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
    // Using knex.raw for complex aggregations
    const result = await db.raw(`
      SELECT
        COUNT(*) as total_members,
        SUM(CASE WHEN balance = 0 THEN 1 ELSE 0 END) as zero_balance,
        SUM(CASE WHEN total_earned >= 100 AND total_earned <= 100 THEN 1 ELSE 0 END) as broke_even,
        SUM(CASE WHEN total_earned > 100 THEN 1 ELSE 0 END) as profited,
        SUM(balance) as total_balance,
        AVG(network_size) as avg_network_size
       FROM users
       WHERE role = 'member'
    `);
    // sqlite3 returns the result directly, pg returns it in rows
    return result.rows ? result.rows[0] : result[0];
  }
}

module.exports = User;
