const { db } = require('../config/database');

class Analytics {
  // Get earnings over time (for charts)
  static async getEarningsOverTime(userId, period = '30days') {
    let interval;
    let dateFormat;

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

    return db('transactions')
      .select(
        db.raw(`TO_CHAR(DATE_TRUNC('day', created_at), '${dateFormat}') as date`),
        db.raw('COALESCE(SUM(amount), 0) as earnings'),
        db.raw('COUNT(*) as transaction_count')
      )
      .where('user_id', userId)
      .andWhere('created_at', '>=', db.raw(`NOW() - INTERVAL '${interval}'`))
      .andWhere('amount', '>', 0)
      .groupBy(db.raw(`DATE_TRUNC('day', created_at)`))
      .orderBy('date', 'asc');
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

    return db.with('downline', (qb) => {
      qb.select('id', 'created_at').from('users').where('referred_by_id', userId)
        .union((qb) => {
          qb.select('u.id', 'u.created_at').from('users as u')
            .join('downline as d', 'u.referred_by_id', 'd.id');
        });
    })
      .select(
        db.raw(`TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date`),
        db.raw('COUNT(*) as new_members'),
        db.raw('SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC(\'day\', created_at)) as cumulative_members')
      )
      .from('downline')
      .where('created_at', '>=', db.raw(`NOW() - INTERVAL '${interval}'`))
      .groupBy(db.raw(`DATE_TRUNC('day', created_at)`))
      .orderBy('date', 'asc');
  }

  // Get top performers in downline
  static async getTopPerformers(userId, limit = 5) {
    return db('users as u')
      .select(
        'u.id',
        'u.username',
        'u.email',
        'u.total_earned',
        'u.direct_recruits',
        'u.network_size',
        'u.created_at',
        db.raw('COALESCE(SUM(t.amount), 0) as generated_for_you')
      )
      .leftJoin('transactions as t', function () {
        this.on('t.triggered_by_user_id', '=', 'u.id').andOn('t.user_id', '=', userId);
      })
      .where('u.referred_by_id', userId)
      .groupBy('u.id')
      .orderBy('generated_for_you', 'desc')
      .orderBy('u.total_earned', 'desc')
      .limit(limit);
  }

  // Get earnings breakdown by level
  static async getEarningsByLevel(userId) {
    return db('transactions')
      .select('level')
      .count('* as transaction_count')
      .sum('amount as total_earnings')
      .where('user_id', userId)
      .andWhere('amount', '>', 0)
      .whereNotNull('level')
      .groupBy('level')
      .orderBy('level', 'asc');
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

    const result = await db('transactions')
      .where('user_id', userId)
      .andWhere('amount', '>', 0)
      .select(
        db.raw(`COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '${interval}' THEN amount ELSE 0 END), 0) as current_period`),
        db.raw(`COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '${interval}' * 2 AND created_at < NOW() - INTERVAL '${interval}' THEN amount ELSE 0 END), 0) as previous_period`)
      )
      .first();

    const current = parseFloat(result.current_period);
    const previous = parseFloat(result.previous_period);

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

    const result = await db.with('downline', (qb) => {
      qb.select('id', 'created_at').from('users').where('referred_by_id', userId)
        .union((qb) => {
          qb.select('u.id', 'u.created_at').from('users as u')
            .join('downline as d', 'u.referred_by_id', 'd.id');
        });
    })
      .select(
        db.raw(`COUNT(CASE WHEN created_at >= NOW() - INTERVAL '${interval}' THEN 1 END) as current_period`),
        db.raw(`COUNT(CASE WHEN created_at >= NOW() - INTERVAL '${interval}' * 2 AND created_at < NOW() - INTERVAL '${interval}' THEN 1 END) as previous_period`)
      )
      .from('downline')
      .first();

    const current = parseInt(result.current_period);
    const previous = parseInt(result.previous_period);

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
    const user = await db('users').select('balance', 'total_earned', 'direct_recruits', 'network_size').where({ id: userId }).first();

    if (!user) {
      throw new Error('User not found');
    }

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
    return db('transactions')
      .select(
        db.raw('EXTRACT(DOW FROM created_at) as day_of_week'),
        db.raw('EXTRACT(HOUR FROM created_at) as hour_of_day'),
        db.raw('COUNT(*) as transaction_count'),
        db.raw('SUM(amount) as total_amount')
      )
      .where('user_id', userId)
      .andWhere('amount', '>', 0)
      .groupBy('day_of_week', 'hour_of_day')
      .orderBy('day_of_week', 'asc')
      .orderBy('hour_of_day', 'asc');
  }

  // Get projected earnings for next month based on trend
  static async getProjectedEarnings(userId) {
    // Get earnings for last 3 months to calculate trend
    const result = await db('transactions')
      .select(db.raw(`DATE_TRUNC('month', created_at) as month`))
      .sum('amount as earnings')
      .where('user_id', userId)
      .andWhere('amount', '>', 0)
      .andWhere('created_at', '>=', db.raw(`NOW() - INTERVAL '90 days'`))
      .groupBy('month')
      .orderBy('month', 'asc');

    const earnings = result.map(r => parseFloat(r.earnings));

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
