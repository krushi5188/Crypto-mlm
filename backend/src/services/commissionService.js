const { pool } = require('../config/database');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const SystemConfig = require('../models/SystemConfig');

class CommissionService {
  /**
   * Calculate dynamic commission distribution for upline chain
   * Uses weighted distribution with Level 1 cap
   */
  static calculateDynamicDistribution(chainLength, poolTotal, level1Cap, decrementStart, minimumPayout) {
    if (chainLength === 0) return [];
    if (chainLength === 1) return [Math.min(poolTotal, level1Cap)];

    const distributions = [];

    // Calculate Level 1 (top person) amount with weight-based formula
    const totalWeights = this.sumOfIntegers(chainLength);
    const level1Weight = chainLength;
    const level1Calculated = (poolTotal * level1Weight) / totalWeights;
    const level1Amount = Math.min(level1Calculated, level1Cap);

    distributions.push(level1Amount);

    // Remaining pool for other levels
    const remainingPool = poolTotal - level1Amount;
    const remainingLevels = chainLength - 1;

    if (remainingLevels === 0) {
      return distributions;
    }

    // Level 2 starts slightly less than Level 1
    const level2Amount = level1Amount - decrementStart;

    if (remainingLevels === 1) {
      distributions.push(Math.max(level2Amount, minimumPayout));
      return distributions;
    }

    // Calculate dynamic decrement using arithmetic sequence
    // Sum = n×L2 - d×(0+1+2+...+(n-1))
    // Sum = n×L2 - d×(n-1)×n/2
    const sumNeeded = remainingPool;
    const n = remainingLevels;

    // Solve for d: d = [2 × ((n × L2) - Sum)] / [(n-1) × n]
    const numerator = 2 * ((n * level2Amount) - sumNeeded);
    const denominator = (n - 1) * n;
    let decrement = numerator / denominator;

    // Ensure decrement is positive and reasonable
    if (decrement < 0) {
      decrement = decrementStart;
    }

    // Calculate amounts for remaining levels
    let currentAmount = level2Amount;
    for (let i = 0; i < remainingLevels; i++) {
      const amount = Math.max(currentAmount, minimumPayout);
      distributions.push(amount);
      currentAmount -= decrement;
    }

    return distributions;
  }

  /**
   * Sum of integers 1+2+3+...+n = n×(n+1)/2
   */
  static sumOfIntegers(n) {
    return (n * (n + 1)) / 2;
  }

  /**
   * Pay commission to a user (extracted for reusability)
   */
  static async payCommission(userId, amount, level, triggeredByUserId, triggeredByUsername, description, client) {
    // Update user balance
    await User.updateBalance(userId, amount, client);

    // Get updated balance
    const balanceResult = await client.query(
      'SELECT balance, total_earned FROM users WHERE id = $1',
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

    return balanceAfter;
  }

  /**
   * Add leftover funds to developer pool
   */
  static async addToDeveloperPool(amount, client) {
    // Update developer_pool_balance
    await client.query(
      `UPDATE system_config
       SET config_value = (CAST(config_value AS DECIMAL(10,2)) + $1)::text
       WHERE config_key = 'developer_pool_balance'`,
      [amount]
    );

    // Update total_to_developer_pool
    await client.query(
      `UPDATE system_config
       SET config_value = (CAST(config_value AS DECIMAL(10,2)) + $1)::text
       WHERE config_key = 'total_to_developer_pool'`,
      [amount]
    );
  }

  /**
   * Distribute commissions when a new user registers
   * NEW DYNAMIC SYSTEM - Unlimited depth with weighted distribution
   */
  static async distributeCommissions(newUserId, newUsername, referredById) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get commission config and recruitment fee
      const config = await SystemConfig.getMultiple([
        'commission_direct_fixed',
        'commission_level_1_cap',
        'commission_pool_total',
        'commission_decrement_start',
        'commission_minimum_payout',
        'recruitment_fee'
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
        // No upline - all goes to system/developer pool
        await this.addToDeveloperPool(poolTotal + directFixed, client);
        await client.query('COMMIT');
        return {
          success: true,
          totalDistributed: 0,
          levelsProcessed: 0,
          developerPoolContribution: poolTotal + directFixed
        };
      }

      let totalDistributed = 0;

      // Step 1: Pay direct inviter (last in chain, highest level number)
      const directInviter = uplineChain[uplineChain.length - 1];
      await this.payCommission(
        directInviter.id,
        directFixed,
        directInviter.level,
        newUserId,
        newUsername,
        `Direct recruitment commission from ${newUsername}`,
        client
      );
      totalDistributed += directFixed;

      // Update direct recruits for direct inviter
      await User.incrementDirectRecruits(directInviter.id, client);

      // Step 2: Calculate distribution for rest of chain
      const chainWithoutDirect = uplineChain.slice(0, -1); // Remove direct inviter

      if (chainWithoutDirect.length > 0) {
        const distributions = this.calculateDynamicDistribution(
          chainWithoutDirect.length,
          poolTotal,
          level1Cap,
          decrementStart,
          minimumPayout
        );

        // Step 3: Pay each level in chain
        for (let i = 0; i < chainWithoutDirect.length; i++) {
          const upline = chainWithoutDirect[i];
          const amount = distributions[i];

          await this.payCommission(
            upline.id,
            amount,
            upline.level,
            newUserId,
            newUsername,
            `Level ${upline.level} commission from ${newUsername}'s recruitment`,
            client
          );

          totalDistributed += amount;
        }

        // Step 4: Calculate developer pool contribution
        const usedFromPool = distributions.reduce((sum, amt) => sum + amt, 0);
        const leftover = poolTotal - usedFromPool;

        if (leftover > 0) {
          await this.addToDeveloperPool(leftover, client);
        }
      } else {
        // Only direct inviter, rest goes to developer pool
        await this.addToDeveloperPool(poolTotal, client);
      }

      // Step 5: Update network size for all upline
      for (const upline of uplineChain) {
        await User.incrementNetworkSize(upline.id, client);
      }

      // Step 6: Create referral records
      for (const upline of uplineChain) {
        await Referral.create(newUserId, upline.id, upline.level, client);
      }

      // Step 7: Update system totals
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

      const usedFromPool = chainWithoutDirect.length > 0
        ? this.calculateDynamicDistribution(chainWithoutDirect.length, poolTotal, level1Cap, decrementStart, minimumPayout)
            .reduce((sum, amt) => sum + amt, 0)
        : 0;

      return {
        success: true,
        totalDistributed,
        levelsProcessed: uplineChain.length,
        developerPoolContribution: poolTotal - usedFromPool
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
   * Get upline chain up to specified depth (null = unlimited)
   * Returns array of {id, level, username} ordered from top (Level 1) to direct inviter
   */
  static async getUplineChain(userId, maxDepth = null) {
    const upline = [];
    let currentUserId = userId;
    let currentLevel = 1;

    while (currentUserId) {
      if (maxDepth !== null && currentLevel > maxDepth) {
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
