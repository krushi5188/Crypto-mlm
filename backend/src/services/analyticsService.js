const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');
const { pool } = require('../config/database');

class AnalyticsService {
  /**
   * Get comprehensive analytics for instructor dashboard
   */
  static async getComprehensiveAnalytics() {
    // Get overview data
    const totalParticipants = await User.countStudents();
    const config = await SystemConfig.getMultiple([
      'simulation_status',
      'max_participants',
      'total_coins_distributed',
      'total_recruitment_fees'
    ]);

    // Calculate days active (from first user registration)
    const firstUserResult = await pool.query(
      `SELECT MIN(created_at) as first_date FROM users WHERE role = 'member'`
    );
    
    let daysRemaining = 0;
    if (firstUserResult.rows[0]?.first_date) {
      const startDate = new Date(firstUserResult.rows[0].first_date);
      const now = new Date();
      daysRemaining = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    }

    // Get distribution stats
    const distStats = await User.getDistributionStats();
    const totalMembers = distStats.total_members || 1; // Avoid division by zero

    const distribution = {
      zeroBalance: distStats.zero_balance || 0,
      brokeEven: distStats.broke_even || 0,
      profited: distStats.profited || 0,
      percentZero: ((distStats.zero_balance || 0) / totalMembers * 100).toFixed(2),
      percentBrokeEven: ((distStats.broke_even || 0) / totalMembers * 100).toFixed(2),
      percentProfited: ((distStats.profited || 0) / totalMembers * 100).toFixed(2)
    };

    // Get wealth concentration
    const wealthStats = await this.calculateWealthConcentration();

    // Get top earners
    const topEarners = await User.getTopEarners(10);
    const formattedTopEarners = topEarners.map(user => ({
      id: user.id,
      username: user.username,
      balance: parseFloat(user.balance),
      directRecruits: user.direct_recruits,
      networkSize: user.network_size,
      joinedAt: user.created_at
    }));

    // Get recent joins
    const recentJoins = await User.getRecentJoins(10);
    const formattedRecentJoins = recentJoins.map(user => ({
      id: user.id,
      username: user.username,
      referredBy: user.referred_by || 'None',
      joinedAt: user.created_at
    }));

    // --- New, more accurate calculations ---

    // Total volume is the sum of all balances
    const totalVolumeResult = await pool.query(`SELECT SUM(balance) as total FROM users WHERE role = 'member'`);
    const totalVolume = parseFloat(totalVolumeResult.rows[0].total) || 0;

    // Active members (logged in within last 30 days)
    const activeMembersResult = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'member' AND last_login >= NOW() - INTERVAL '30 days'`);
    const activeMembers = parseInt(activeMembersResult.rows[0].count);

    // New signups (registered in last 7 days)
    const newSignupsResult = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'member' AND created_at >= NOW() - INTERVAL '7 days'`);
    const newSignups = parseInt(newSignupsResult.rows[0].count);

    // Daily active users (logged in within last 24 hours)
    const dailyActiveResult = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'member' AND last_login >= NOW() - INTERVAL '24 hours'`);
    const dailyActive = parseInt(dailyActiveResult.rows[0].count);

    // Average network size
    const avgNetworkSizeResult = await pool.query(`SELECT AVG(network_size) as avg FROM users WHERE role = 'member'`);
    const avgNetworkSize = parseFloat(avgNetworkSizeResult.rows[0].avg) || 0;

    // Total deposits (sum of all commission and injection transactions)
    const totalDepositsResult = await pool.query(`SELECT SUM(amount) as total FROM transactions WHERE type IN ('commission', 'injection')`);
    const totalDeposits = parseFloat(totalDepositsResult.rows[0].total) || 0;

    // Platform balance (recruitment fees - commissions)
    const platformBalance = (parseFloat(config.total_recruitment_fees) || 0) - (parseFloat(config.total_coins_distributed) || 0);

    return {
      totalMembers: totalParticipants,
      totalVolume: totalVolume,
      activeMembers: activeMembers,
      pendingWithdrawals: 0, // Assuming no withdrawal feature yet
      newSignups: newSignups,
      dailyActive: dailyActive,
      avgNetworkSize: avgNetworkSize.toFixed(2),
      totalDeposits: totalDeposits,
      totalWithdrawn: 0, // Assuming no withdrawal feature yet
      platformBalance: platformBalance,
      recentActivity: formattedRecentJoins.map(j => ({
        type: 'signup',
        description: `${j.username} joined the network`,
        details: `Referred by ${j.referredBy}`,
        time: j.joinedAt
      })),
      retention: totalParticipants > 0 ? (activeMembers / totalParticipants * 100).toFixed(2) : 0,
      pendingIssues: 0, // Placeholder
      overview: {
        totalParticipants,
        simulationStatus: config.simulation_status,
        daysRemaining
      },
      distribution,
      wealth: wealthStats,
      topEarners: formattedTopEarners,
      recentJoins: formattedRecentJoins,
      systemTotals: {
        totalCoinsDistributed: config.total_coins_distributed,
        totalRecruitmentFees: config.total_recruitment_fees,
        coinsInCirculation: config.total_coins_distributed
      }
    };
  }

  /**
   * Calculate wealth concentration metrics including Gini coefficient
   */
  static async calculateWealthConcentration() {
    // Get all member balances sorted
    const result = await pool.query(
      `SELECT balance FROM users
       WHERE role = 'member'
       ORDER BY balance ASC`
    );

    if (result.rows.length === 0) {
      return {
        top10Percent: 0,
        middle20Percent: 0,
        bottom70Percent: 0,
        giniCoefficient: 0
      };
    }

    const balances = result.rows.map(r => parseFloat(r.balance));
    const totalWealth = balances.reduce((sum, b) => sum + b, 0);

    if (totalWealth === 0) {
      return {
        top10Percent: 0,
        middle20Percent: 0,
        bottom70Percent: 0,
        giniCoefficient: 0
      };
    }

    const n = balances.length;

    // Calculate percentile groups
    const top10Count = Math.ceil(n * 0.1);
    const middle20Count = Math.ceil(n * 0.2);
    const bottom70Count = n - top10Count - middle20Count;

    // Balances are sorted ascending, so reverse for top
    const top10Balances = balances.slice(-top10Count);
    const middle20Balances = balances.slice(bottom70Count, bottom70Count + middle20Count);
    const bottom70Balances = balances.slice(0, bottom70Count);

    const top10Sum = top10Balances.reduce((sum, b) => sum + b, 0);
    const middle20Sum = middle20Balances.reduce((sum, b) => sum + b, 0);
    const bottom70Sum = bottom70Balances.reduce((sum, b) => sum + b, 0);

    // Calculate Gini coefficient
    const gini = this.calculateGini(balances);

    return {
      top10Percent: ((top10Sum / totalWealth) * 100).toFixed(1),
      middle20Percent: ((middle20Sum / totalWealth) * 100).toFixed(1),
      bottom70Percent: ((bottom70Sum / totalWealth) * 100).toFixed(1),
      giniCoefficient: gini.toFixed(2)
    };
  }

  /**
   * Calculate Gini coefficient
   * Returns value between 0 (perfect equality) and 1 (perfect inequality)
   */
  static calculateGini(values) {
    if (values.length === 0) return 0;

    // Sort values in ascending order
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const total = sorted.reduce((sum, val) => sum + val, 0);

    if (total === 0) return 0;

    // Calculate Gini using the formula:
    // G = (2 * Σ(i * y_i)) / (n * Σy_i) - (n + 1) / n
    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i + 1) * sorted[i];
    }

    const gini = (2 * numerator) / (n * total) - (n + 1) / n;

    return Math.max(0, Math.min(1, gini)); // Clamp between 0 and 1
  }
}

module.exports = AnalyticsService;
