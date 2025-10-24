const { pool } = require('../config/database');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');

class CommissionService {
  /**
   * Distribute commissions when a new user registers
   * NEW ALGORITHM: Dynamic weighted distribution with unlimited levels
   * - Direct inviter: 10 AC fixed
   * - Level 1 (top): Weighted calculation capped at 4 AC max
   * - Other levels: Weighted with dynamic decrement, each less than level above
   * - Leftover goes to developer pool
   */
  static async distributeCommissions(newUserId, newUsername, referredById) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get configuration
      const config = await SystemConfig.getMultiple([
        'recruitment_fee',
        'commission_direct_fixed',
        'commission_level_1_cap',
        'commission_pool_total',
        'commission_decrement_start',
        'commission_minimum_payout'
      ]);

      const recruitmentFee = parseFloat(config.recruitment_fee);
      const directFixed = parseFloat(config.commission_direct_fixed);
      const level1Cap = parseFloat(config.commission_level_1_cap);
      const poolTotal = parseFloat(config.commission_pool_total);
      const decrementStart = parseFloat(config.commission_decrement_start);
      const minimumPayout = parseFloat(config.commission_minimum_payout);

      // Get complete upline chain (unlimited depth)
      const uplineChain = await this.getUplineChain(referredById, null);

      if (uplineChain.length === 0) {
        // No upline, all goes to developer pool
        await this.addToDeveloperPool(poolTotal + directFixed, client);
        await client.query('COMMIT');
        return {
          success: true,
          totalDistributed: 0,
          toDeveloperPool: poolTotal + directFixed,
          levelsProcessed: 0
        };
      }

      // Reverse the chain so Level 1 is at index 0
      // uplineChain comes with level property already set correctly
      // Sort by level ascending (Level 1 first)
      uplineChain.sort((a, b) => a.level - b.level);

      const chainLength = uplineChain.length;
      let totalDistributed = 0;
      let toDeveloperPool = 0;

      // STEP 1: Pay direct inviter (last in chain, highest level number)
      const directInviter = uplineChain[chainLength - 1];
      
      await this.payCommission(
        directInviter.id,
        directFixed,
        directInviter.level,
        newUserId,
        newUsername,
        'Direct recruitment commission (fixed 10 AC)',
        client
      );
      
      totalDistributed += directFixed;

      // STEP 2: Calculate distribution for rest of chain
      if (chainLength > 1) {
        // Calculate weighted distribution
        const distributions = this.calculateDynamicDistribution(
          chainLength - 1, // Exclude direct inviter
          poolTotal,
          level1Cap,
          decrementStart,
          minimumPayout
        );

        // Pay each level in the chain (excluding direct inviter)
        for (let i = 0; i < chainLength - 1; i++) {
          const upline = uplineChain[i];
          const amount = distributions[i];

          if (amount >= minimumPayout) {
            await this.payCommission(
              upline.id,
              amount,
              upline.level,
              newUserId,
              newUsername,
              `Level ${upline.level} commission from chain`,
              client
            );
            
            totalDistributed += amount;
          }
        }

        // Calculate leftover for developer pool
        const usedFromPool = distributions.reduce((sum, amt) => sum + amt, 0);
        toDeveloperPool = poolTotal - usedFromPool;
      } else {
        // Only direct inviter exists, all pool goes to developer
        toDeveloperPool = poolTotal;
      }

      // STEP 3: Add leftover to developer pool
      if (toDeveloperPool > 0.01) {
        await this.addToDeveloperPool(toDeveloperPool, client);
      }

      // STEP 4: Update direct recruits for direct referrer
      await User.incrementDirectRecruits(directInviter.id, client);

      // STEP 5: Update network size for all upline
      for (const upline of uplineChain) {
        await User.incrementNetworkSize(upline.id, client);
      }

      // STEP 6: Create referral records for all upline relationships
      for (const upline of uplineChain) {
        await Referral.create(newUserId, upline.id, upline.level, client);
      }

      // STEP 7: Update system totals
      await client.query(
        `UPDATE system_config
         SET config_value = (CAST(config_value AS DECIMAL(10,2)) + $1)::text
         WHERE config_key = 'total_coins_distributed'`,
        [totalDistributed]
      );

      await client.query(
        `UPDATE system_config
         SET config_value = (CAST(config_value AS DECIMAL(10,2)) + $1)::text
         WHERE config_key = 'total_recruitment_fees'`,
        [recruitmentFee]
      );

      await client.query('COMMIT');

      return {
        success: true,
        totalDistributed,
        toDeveloperPool,
        levelsProcessed: uplineChain.length,
        chainLength: uplineChain.length
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Commission distribution failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate dynamic distribution with weighted algorithm
   * @param {number} chainLength - Number of levels to distribute to (excluding direct)
   * @param {number} poolTotal - Total pool to distribute (30 AC)
   * @param {number} level1Cap - Maximum for Level 1 (4 AC)
   * @param {number} decrementStart - Starting decrement (0.1 AC)
   * @param {number} minimumPayout - Minimum payout per level (0.5 AC)
   * @returns {Array} - Array of amounts for each level
   */
  static calculateDynamicDistribution(chainLength, poolTotal, level1Cap, decrementStart, minimumPayout) {
    if (chainLength === 0) return [];

    const distributions = [];

    // STEP 1: Calculate Level 1 amount with weights
    const totalWeights = this.sumOfIntegers(chainLength);
    const level1Weight = chainLength;
    let level1Amount = (poolTotal * level1Weight) / totalWeights;

    // Cap Level 1 at maximum
    level1Amount = Math.min(level1Amount, level1Cap);
    distributions.push(level1Amount);

    if (chainLength === 1) {
      return distributions;
    }

    // STEP 2: Calculate remaining pool
    const remainingPool = poolTotal - level1Amount;
    const remainingLevels = chainLength - 1;

    // STEP 3: Set Level 2 to be 0.1 AC less than Level 1
    let level2Amount = level1Amount - decrementStart;
    
    if (level2Amount < minimumPayout) {
      level2Amount = minimumPayout;
    }

    distributions.push(level2Amount);

    if (chainLength === 2) {
      return distributions;
    }

    // STEP 4: Calculate dynamic decrement for remaining levels
    // We have: level2Amount + (level2Amount - d) + (level2Amount - 2d) + ... = remainingPool
    // Sum = remainingLevels * level2Amount - d * [0 + 1 + 2 + ... + (remainingLevels-1)]
    // Sum = remainingLevels * level2Amount - d * (remainingLevels-1) * remainingLevels / 2

    const arithmeticSum = ((remainingLevels - 1) * remainingLevels) / 2;
    let decrement = ((remainingLevels * level2Amount) - remainingPool) / arithmeticSum;

    // If decrement is negative or too small, use equal distribution
    if (decrement <= 0 || isNaN(decrement)) {
      const equalAmount = remainingPool / remainingLevels;
      
      for (let i = 1; i < remainingLevels; i++) {
        const amt = Math.max(equalAmount, minimumPayout);
        distributions.push(amt);
      }
      
      return distributions;
    }

    // STEP 5: Calculate amounts for Level 3 onwards
    for (let i = 1; i < remainingLevels; i++) {
      let amount = level2Amount - (i * decrement);
      
      // Ensure minimum payout
      if (amount < minimumPayout) {
        amount = minimumPayout;
      }
      
      // Ensure descending order
      if (amount >= distributions[distributions.length - 1]) {
        amount = distributions[distributions.length - 1] - 0.01;
        if (amount < minimumPayout) {
          amount = minimumPayout;
        }
      }
      
      distributions.push(amount);
    }

    return distributions;
  }

  /**
   * Helper: Sum of integers from 1 to n (for weights calculation)
   */
  static sumOfIntegers(n) {
    return (n * (n + 1)) / 2;
  }

  /**
   * Pay commission to a user and create transaction record
   */
  static async payCommission(userId, amount, level, triggeredByUserId, triggeredByUsername, description, client) {
    // Update user balance and total earned
    await User.updateBalance(userId, amount, client);

    // Get updated balance
    const balanceResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    const balanceAfter = balanceResult.rows[0].balance;

    // Create transaction record
    await Transaction.create({
      user_id: userId,
      amount: amount,
      type: 'commission',
      level: level,
      triggered_by_user_id: triggeredByUserId,
      description: description,
      balance_after: balanceAfter
    }, client);
  }

  /**
   * Add amount to developer pool
   */
  static async addToDeveloperPool(amount, client) {
    // Update developer pool balance
    await client.query(
      `UPDATE system_config
       SET config_value = (CAST(config_value AS DECIMAL(10,2)) + $1)::text
       WHERE config_key = 'developer_pool_balance'`,
      [amount]
    );

    // Update total sent to developer pool
    await client.query(
      `UPDATE system_config
       SET config_value = (CAST(config_value AS DECIMAL(10,2)) + $1)::text
       WHERE config_key = 'total_to_developer_pool'`,
      [amount]
    );
  }

  /**
   * Get upline chain up to specified depth (or unlimited if maxDepth is null)
   * Returns array of {id, level, username}
   */
  static async getUplineChain(userId, maxDepth = null) {
    const upline = [];
    let currentUserId = userId;
    let currentLevel = 1;

    while (currentUserId) {
      if (maxDepth && currentLevel > maxDepth) {
        break;
      }

      // Get user's referrer
      const result = await pool.query(
        'SELECT referred_by_id, username FROM users WHERE id = $1',
        [currentUserId]
      );

      if (result.rows.length === 0 || !result.rows[0].referred_by_id) {
        break; // No more upline
      }

      const referrerId = result.rows[0].referred_by_id;

      // Get referrer info
      const referrerResult = await pool.query(
        'SELECT id, username FROM users WHERE id = $1',
        [referrerId]
      );

      if (referrerResult.rows.length === 0) {
        break;
      }

      upline.push({
        id: referrerId,
        username: referrerResult.rows[0].username,
        level: currentLevel
      });

      currentUserId = referrerId;
      currentLevel++;
    }

    return upline;
  }
}

module.exports = CommissionService;
