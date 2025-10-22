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
      'semester_start_date',
      'semester_duration_days',
      'total_coins_distributed',
      'total_recruitment_fees'
    ]);

    // Calculate semester dates
    const semesterStartDate = new Date(config.semester_start_date);
    const semesterEndDate = new Date(semesterStartDate);
    semesterEndDate.setDate(semesterEndDate.getDate() + config.semester_duration_days);

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((semesterEndDate - now) / (1000 * 60 * 60 * 24)));

    // Get distribution stats
    const distStats = await User.getDistributionStats();
    const totalStudents = distStats.total_students || 1; // Avoid division by zero

    const distribution = {
      zeroBalance: distStats.zero_balance || 0,
      brokeEven: distStats.broke_even || 0,
      profited: distStats.profited || 0,
      percentZero: ((distStats.zero_balance || 0) / totalStudents * 100).toFixed(2),
      percentBrokeEven: ((distStats.broke_even || 0) / totalStudents * 100).toFixed(2),
      percentProfited: ((distStats.profited || 0) / totalStudents * 100).toFixed(2)
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

    return {
      overview: {
        totalParticipants,
        simulationStatus: config.simulation_status,
        semesterStartDate: semesterStartDate.toISOString().split('T')[0],
        semesterEndDate: semesterEndDate.toISOString().split('T')[0],
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
    // Get all student balances sorted
    const [rows] = await pool.query(
      `SELECT balance FROM users
       WHERE role = 'student'
       ORDER BY balance ASC`
    );

    if (rows.length === 0) {
      return {
        top10Percent: 0,
        middle20Percent: 0,
        bottom70Percent: 0,
        giniCoefficient: 0
      };
    }

    const balances = rows.map(r => parseFloat(r.balance));
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
