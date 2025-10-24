const { pool } = require('../config/database');

class Analytics {
  // Get earnings over time (for charts)
  static async getEarningsOverTime(userId, period = '30days') {
    let interval, dateFormat;

    switch (period) {
      case '7days':
        interval = '7 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '30days':
        interval = '30 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '90days':
        interval = '90 days';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '12months':
        interval = '365 days';
        dateFormat = 'YYYY-MM';
        break;
      default:
        interval = '30 days';
        dateFormat = 'YYYY-MM-DD';
    }

    const result = await pool.query(
      `SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), $1) as date,
        COALESCE(SUM(amount), 0) as earnings,
        COUNT(*) as transaction_count
       FROM transactions
       WHERE user_id = $2
         AND created_at >= NOW() - INTERVAL '${interval}'
         AND amount > 0
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date ASC`,
      [dateFormat, userId]
    );

    return result.rows;
  }

  // Get network growth over time
  static async getNetworkGrowthOverTime(userId, period = '30days') {
    let interval;

    switch (period) {
      case '7days':
        interval = '7 days';
        break;
      case '30days':
        interval = '30 days';
        break;
      case '90days':
        interval = '90 days';
        break;
      case '12months':
        interval = '365 days';
        break;
      default:
        interval = '30 days';
    }

    // Get all users in downline with their join dates
    const result = await pool.query(
      `WITH RECURSIVE downline AS (
        -- Start with direct recruits
        SELECT id, created_at, 1 as depth
        FROM users
        WHERE referred_by_id = $1

        UNION ALL

        -- Recursively get their recruits
        SELECT u.id, u.created_at, d.depth + 1
        FROM users u
        INNER JOIN downline d ON u.referred_by_id = d.id
        WHERE d.depth < 5
      )
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
        COUNT(*) as new_members,
        SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', created_at)) as cumulative_members
      FROM downline
      WHERE created_at >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC`,
      [userId]
    );

    return result.rows;
  }

  // Get top performers in downline
  static async getTopPerformers(userId, limit = 5) {
    // Get direct recruits and their earnings
    const result = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.email,
        u.total_earned,
        u.direct_recruits,
        u.network_size,
        u.created_at,
        COALESCE(SUM(t.amount), 0) as generated_for_you
       FROM users u
       LEFT JOIN transactions t ON t.triggered_by_user_id = u.id AND t.user_id = $1
       WHERE u.referred_by_id = $1
       GROUP BY u.id
       ORDER BY generated_for_you DESC, u.total_earned DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // Get earnings breakdown by level
  static async getEarningsByLevel(userId) {
    const result = await pool.query(
      `SELECT
        level,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_earnings
       FROM transactions
       WHERE user_id = $1 AND amount > 0 AND level IS NOT NULL
       GROUP BY level
       ORDER BY level ASC`,
      [userId]
    );

    return result.rows;
  }

  // Get earnings comparison (this period vs last period)
  static async getEarningsComparison(userId, period = '30days') {
    let interval;

    switch (period) {
      case '7days':
        interval = '7 days';
        break;
      case '30days':
        interval = '30 days';
        break;
      case '90days':
        interval = '90 days';
        break;
      default:
        interval = '30 days';
    }

    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE
          WHEN created_at >= NOW() - INTERVAL '${interval}'
          THEN amount ELSE 0 END), 0) as current_period,
        COALESCE(SUM(CASE
          WHEN created_at >= NOW() - INTERVAL '${interval}' * 2
            AND created_at < NOW() - INTERVAL '${interval}'
          THEN amount ELSE 0 END), 0) as previous_period
       FROM transactions
       WHERE user_id = $1 AND amount > 0`,
      [userId]
    );

    const current = parseFloat(result.rows[0].current_period);
    const previous = parseFloat(result.rows[0].previous_period);

    let percentageChange = 0;
    if (previous > 0) {
      percentageChange = ((current - previous) / previous) * 100;
    } else if (current > 0) {
      percentageChange = 100;
    }

    return {
      current,
      previous,
      percentageChange: parseFloat(percentageChange.toFixed(2)),
      trend: current >= previous ? 'up' : 'down'
    };
  }

  // Get network comparison (this period vs last period)
  static async getNetworkComparison(userId, period = '30days') {
    let interval;

    switch (period) {
      case '7days':
        interval = '7 days';
        break;
      case '30days':
        interval = '30 days';
        break;
      case '90days':
        interval = '90 days';
        break;
      default:
        interval = '30 days';
    }

    const result = await pool.query(
      `WITH RECURSIVE downline AS (
        SELECT id, created_at, 1 as depth
        FROM users
        WHERE referred_by_id = $1

        UNION ALL

        SELECT u.id, u.created_at, d.depth + 1
        FROM users u
        INNER JOIN downline d ON u.referred_by_id = d.id
        WHERE d.depth < 5
      )
      SELECT
        COUNT(CASE
          WHEN created_at >= NOW() - INTERVAL '${interval}'
          THEN 1 END) as current_period,
        COUNT(CASE
          WHEN created_at >= NOW() - INTERVAL '${interval}' * 2
            AND created_at < NOW() - INTERVAL '${interval}'
          THEN 1 END) as previous_period
       FROM downline`,
      [userId]
    );

    const current = parseInt(result.rows[0].current_period);
    const previous = parseInt(result.rows[0].previous_period);

    let percentageChange = 0;
    if (previous > 0) {
      percentageChange = ((current - previous) / previous) * 100;
    } else if (current > 0) {
      percentageChange = 100;
    }

    return {
      current,
      previous,
      percentageChange: parseFloat(percentageChange.toFixed(2)),
      trend: current >= previous ? 'up' : 'down'
    };
  }

  // Get comprehensive dashboard stats with comparisons
  static async getDashboardStats(userId) {
    // Get current user stats
    const userResult = await pool.query(
      'SELECT balance, total_earned, direct_recruits, network_size FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Get earnings and network comparisons
    const [earningsComp, networkComp] = await Promise.all([
      this.getEarningsComparison(userId),
      this.getNetworkComparison(userId)
    ]);

    return {
      balance: parseFloat(user.balance),
      totalEarned: parseFloat(user.total_earned),
      directRecruits: parseInt(user.direct_recruits),
      networkSize: parseInt(user.network_size),
      earningsComparison: earningsComp,
      networkComparison: networkComp
    };
  }

  // Get activity heatmap (what days/times user earns most)
  static async getActivityHeatmap(userId) {
    const result = await pool.query(
      `SELECT
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
       FROM transactions
       WHERE user_id = $1 AND amount > 0
       GROUP BY day_of_week, hour_of_day
       ORDER BY day_of_week, hour_of_day`,
      [userId]
    );

    return result.rows;
  }

  // Get projected earnings for next month based on trend
  static async getProjectedEarnings(userId) {
    // Get earnings for last 3 months to calculate trend
    const result = await pool.query(
      `SELECT
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as earnings
       FROM transactions
       WHERE user_id = $1 AND amount > 0
         AND created_at >= NOW() - INTERVAL '90 days'
       GROUP BY month
       ORDER BY month ASC`,
      [userId]
    );

    const earnings = result.rows.map(r => parseFloat(r.earnings));

    if (earnings.length < 2) {
      return null; // Not enough data
    }

    // Simple linear projection
    const avgGrowth = earnings.length > 1
      ? (earnings[earnings.length - 1] - earnings[0]) / (earnings.length - 1)
      : 0;

    const lastMonth = earnings[earnings.length - 1];
    const projected = lastMonth + avgGrowth;

    return {
      lastMonthEarnings: lastMonth,
      projectedNextMonth: Math.max(0, projected),
      trend: avgGrowth >= 0 ? 'growing' : 'declining',
      confidence: earnings.length >= 3 ? 'high' : 'low'
    };
  }
}

module.exports = Analytics;
