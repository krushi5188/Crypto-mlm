const { pool } = require('../config/database');

class Wallet {
  // Add new wallet
  static async create(walletData) {
    const {
      user_id,
      wallet_address,
      wallet_type,
      network = 'TRC20',
      label = null,
      is_primary = false
    } = walletData;

    // If this is being set as primary, unset other primary wallets
    if (is_primary) {
      await pool.query(
        'UPDATE user_wallets SET is_primary = false WHERE user_id = $1',
        [user_id]
      );
    }

    const result = await pool.query(
      `INSERT INTO user_wallets
       (user_id, wallet_address, wallet_type, network, label, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, wallet_address, network)
       DO UPDATE SET
         wallet_type = EXCLUDED.wallet_type,
         label = EXCLUDED.label,
         is_primary = EXCLUDED.is_primary,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, wallet_address, wallet_type, network, label, is_primary]
    );

    return result.rows[0];
  }

  // Get user's wallets
  static async getUserWallets(userId) {
    const result = await pool.query(
      `SELECT * FROM user_wallets
       WHERE user_id = $1
       ORDER BY is_primary DESC, created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Get primary wallet
  static async getPrimaryWallet(userId) {
    const result = await pool.query(
      `SELECT * FROM user_wallets
       WHERE user_id = $1 AND is_primary = true
       LIMIT 1`,
      [userId]
    );

    return result.rows[0];
  }

  // Get wallet by ID
  static async getById(walletId, userId = null) {
    let query = 'SELECT * FROM user_wallets WHERE id = $1';
    const params = [walletId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Set primary wallet
  static async setPrimary(walletId, userId) {
    // First, unset all primary wallets for user
    await pool.query(
      'UPDATE user_wallets SET is_primary = false WHERE user_id = $1',
      [userId]
    );

    // Then set the specified wallet as primary
    const result = await pool.query(
      `UPDATE user_wallets
       SET is_primary = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [walletId, userId]
    );

    return result.rows[0];
  }

  // Update wallet
  static async update(walletId, updates, userId) {
    const allowedFields = ['label', 'wallet_type'];
    const setClauses = [];
    const params = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramCount}`);
        params.push(updates[key]);
        paramCount++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(walletId, userId);

    const result = await pool.query(
      `UPDATE user_wallets
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  // Delete wallet
  static async delete(walletId, userId) {
    const result = await pool.query(
      'DELETE FROM user_wallets WHERE id = $1 AND user_id = $2 RETURNING *',
      [walletId, userId]
    );

    return result.rows[0];
  }

  // Update last used timestamp
  static async updateLastUsed(walletId) {
    await pool.query(
      'UPDATE user_wallets SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [walletId]
    );
  }

  // Verify wallet ownership (basic validation)
  static async verify(walletId, userId) {
    const result = await pool.query(
      `UPDATE user_wallets
       SET is_verified = true, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [walletId, userId]
    );

    return result.rows[0];
  }

  // Check if wallet address exists for user
  static async exists(userId, walletAddress, network) {
    const result = await pool.query(
      `SELECT id FROM user_wallets
       WHERE user_id = $1 AND wallet_address = $2 AND network = $3`,
      [userId, walletAddress, network]
    );

    return result.rows.length > 0;
  }

  // Validate wallet address format (basic validation)
  static validateAddress(address, network) {
    // Remove whitespace
    address = address.trim();

    switch (network) {
      case 'TRC20': // TRON
        return /^T[A-Za-z1-9]{33}$/.test(address);

      case 'ERC20': // Ethereum
        return /^0x[a-fA-F0-9]{40}$/.test(address);

      case 'BEP20': // Binance Smart Chain
        return /^0x[a-fA-F0-9]{40}$/.test(address);

      case 'BTC': // Bitcoin
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
               /^bc1[a-z0-9]{39,59}$/.test(address);

      default:
        return address.length >= 26 && address.length <= 62;
    }
  }

  // Get wallet statistics
  static async getStats(userId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_wallets,
        COUNT(CASE WHEN is_verified THEN 1 END) as verified_wallets,
        COUNT(CASE WHEN is_primary THEN 1 END) as primary_wallet_count,
        array_agg(DISTINCT network) as networks
       FROM user_wallets
       WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  // Get withdrawal history for wallet
  static async getWithdrawalHistory(walletId, userId) {
    const result = await pool.query(
      `SELECT w.*
       FROM withdrawals w
       JOIN user_wallets uw ON w.wallet_address = uw.wallet_address
       WHERE uw.id = $1 AND uw.user_id = $2
       ORDER BY w.created_at DESC
       LIMIT 20`,
      [walletId, userId]
    );

    return result.rows;
  }
}

module.exports = Wallet;
