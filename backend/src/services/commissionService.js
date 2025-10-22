const { pool } = require('../config/database');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');

class CommissionService {
  /**
   * Distribute commissions when a new user registers
   * This is the core MLM logic - must be atomic (transaction)
   */
  static async distributeCommissions(newUserId, newUsername, referredById) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get commission percentages and recruitment fee from config
      const config = await SystemConfig.getMultiple([
        'commission_level_1',
        'commission_level_2',
        'commission_level_3',
        'commission_level_4',
        'commission_level_5',
        'recruitment_fee'
      ]);

      const recruitmentFee = config.recruitment_fee;

      // Get upline chain (up to 5 levels)
      const uplineChain = await this.getUplineChain(referredById, 5);

      let totalDistributed = 0;

      // Distribute commissions to each upline level
      for (const upline of uplineChain) {
        const level = upline.level;
        const commissionPercentage = config[`commission_level_${level}`];
        const commissionAmount = recruitmentFee * (commissionPercentage / 100);

        // Update upline balance
        await User.updateBalance(upline.id, commissionAmount, connection);

        // Get updated balance for transaction record
        const [balanceResult] = await connection.query(
          'SELECT balance FROM users WHERE id = ?',
          [upline.id]
        );
        const balanceAfter = balanceResult[0].balance;

        // Create transaction record
        await Transaction.create({
          user_id: upline.id,
          amount: commissionAmount,
          type: 'commission',
          level: level,
          triggered_by_user_id: newUserId,
          description: `Level ${level} commission from ${newUsername}'s recruitment`,
          balance_after: balanceAfter
        }, connection);

        totalDistributed += commissionAmount;

        // Update network size for this upline
        await User.incrementNetworkSize(upline.id, connection);
      }

      // Update direct recruits for Level 1 upline (direct referrer)
      if (uplineChain.length > 0 && uplineChain[0].level === 1) {
        await User.incrementDirectRecruits(uplineChain[0].id, connection);
      }

      // Create referral records for all upline relationships
      for (const upline of uplineChain) {
        await Referral.create(newUserId, upline.id, upline.level, connection);
      }

      // Update system totals
      await connection.query(
        `UPDATE system_config
         SET config_value = CAST(config_value AS DECIMAL(10,2)) + ?
         WHERE config_key = 'total_coins_distributed'`,
        [totalDistributed]
      );

      await connection.query(
        `UPDATE system_config
         SET config_value = CAST(config_value AS DECIMAL(10,2)) + ?
         WHERE config_key = 'total_recruitment_fees'`,
        [recruitmentFee]
      );

      await connection.commit();

      return {
        success: true,
        totalDistributed,
        levelsProcessed: uplineChain.length
      };
    } catch (error) {
      await connection.rollback();
      console.error('Commission distribution failed:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get upline chain up to specified depth
   * Returns array of {id, level, username}
   */
  static async getUplineChain(userId, maxDepth = 5) {
    const upline = [];
    let currentUserId = userId;
    let currentLevel = 1;

    while (currentUserId && currentLevel <= maxDepth) {
      // Get user's referrer
      const [rows] = await pool.query(
        'SELECT referred_by_id, username FROM users WHERE id = ?',
        [currentUserId]
      );

      if (rows.length === 0 || !rows[0].referred_by_id) {
        break; // No more upline
      }

      const referrerId = rows[0].referred_by_id;

      // Get referrer info
      const [referrerRows] = await pool.query(
        'SELECT id, username FROM users WHERE id = ?',
        [referrerId]
      );

      if (referrerRows.length === 0) {
        break;
      }

      upline.push({
        id: referrerId,
        username: referrerRows[0].username,
        level: currentLevel
      });

      currentUserId = referrerId;
      currentLevel++;
    }

    return upline;
  }
}

module.exports = CommissionService;
