const pool = require('../config/database');

/**
 * Predictive Analytics Service
 * Calculates earnings projections, network growth forecasting, churn predictions
 */
class PredictiveAnalyticsService {
  /**
   * Calculate and cache analytics for a specific user
   * @param {number} userId - User ID to calculate analytics for
   */
  async calculateUserAnalytics(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get user's transaction history
      const transactionsQuery = `
        SELECT
          amount,
          type,
          created_at,
          DATE(created_at) as transaction_date
        FROM transactions
        WHERE user_id = $1 AND type IN ('referral_bonus', 'level_commission')
        ORDER BY created_at ASC
      `;
      const { rows: transactions } = await client.query(transactionsQuery, [userId]);

      // Get user's network recruitment history
      const recruitsQuery = `
        SELECT
          id,
          created_at,
          DATE(created_at) as signup_date,
          EXTRACT(DOW FROM created_at) as day_of_week,
          EXTRACT(HOUR FROM created_at) as hour_of_day
        FROM users
        WHERE referred_by_id = $1
        ORDER BY created_at ASC
      `;
      const { rows: recruits } = await client.query(recruitsQuery, [userId]);

      // Get user's account creation date
      const userQuery = `SELECT created_at FROM users WHERE id = $1`;
      const { rows: [user] } = await client.query(userQuery, [userId]);

      const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const daysActive = Math.max(accountAge, 1);

      // Calculate earnings metrics
      const totalEarnings = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const avgDailyEarnings = daysActive > 0 ? totalEarnings / daysActive : 0;
      const avgWeeklyEarnings = avgDailyEarnings * 7;
      const avgMonthlyEarnings = avgDailyEarnings * 30;

      // Calculate earnings growth rate (last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const last30DaysEarnings = transactions
        .filter(t => new Date(t.created_at) >= thirtyDaysAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const previous30DaysEarnings = transactions
        .filter(t => new Date(t.created_at) >= sixtyDaysAgo && new Date(t.created_at) < thirtyDaysAgo)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const earningsGrowthRate = previous30DaysEarnings > 0
        ? ((last30DaysEarnings - previous30DaysEarnings) / previous30DaysEarnings) * 100
        : last30DaysEarnings > 0 ? 100 : 0;

      // Calculate recruitment metrics
      const totalRecruits = recruits.length;
      const avgDailyRecruits = daysActive > 0 ? totalRecruits / daysActive : 0;
      const avgWeeklyRecruits = avgDailyRecruits * 7;

      const last30DaysRecruits = recruits.filter(r => new Date(r.created_at) >= thirtyDaysAgo).length;
      const previous30DaysRecruits = recruits.filter(
        r => new Date(r.created_at) >= sixtyDaysAgo && new Date(r.created_at) < thirtyDaysAgo
      ).length;

      const networkGrowthRate = previous30DaysRecruits > 0
        ? ((last30DaysRecruits - previous30DaysRecruits) / previous30DaysRecruits) * 100
        : last30DaysRecruits > 0 ? 100 : 0;

      // Calculate activity metrics
      const lastTransaction = transactions.length > 0 ? transactions[transactions.length - 1] : null;
      const lastActivityDate = lastTransaction ? lastTransaction.created_at : user.created_at;
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysInactive = daysSinceLastActivity;

      // Activity score (0-1, based on recent activity)
      let activityScore = 1.0;
      if (daysSinceLastActivity > 30) activityScore = 0.1;
      else if (daysSinceLastActivity > 14) activityScore = 0.3;
      else if (daysSinceLastActivity > 7) activityScore = 0.6;
      else if (daysSinceLastActivity > 3) activityScore = 0.8;

      // Predict future earnings (simple linear projection with growth factor)
      const growthFactor = 1 + (earningsGrowthRate / 100);
      const predicted30dEarnings = avgDailyEarnings * 30 * growthFactor;
      const predicted90dEarnings = avgDailyEarnings * 90 * Math.pow(growthFactor, 3);

      // Predict future recruits
      const recruitGrowthFactor = 1 + (networkGrowthRate / 100);
      const predicted30dRecruits = Math.round(avgDailyRecruits * 30 * recruitGrowthFactor);

      // Calculate churn risk score (0-1, higher = more likely to churn)
      let churnRiskScore = 0;

      // Factor 1: Inactivity (40% weight)
      if (daysSinceLastActivity > 30) churnRiskScore += 0.40;
      else if (daysSinceLastActivity > 14) churnRiskScore += 0.25;
      else if (daysSinceLastActivity > 7) churnRiskScore += 0.10;

      // Factor 2: Declining earnings (30% weight)
      if (earningsGrowthRate < -50) churnRiskScore += 0.30;
      else if (earningsGrowthRate < -20) churnRiskScore += 0.20;
      else if (earningsGrowthRate < 0) churnRiskScore += 0.10;

      // Factor 3: Zero recent recruits (20% weight)
      if (last30DaysRecruits === 0 && totalRecruits > 0) churnRiskScore += 0.20;
      else if (last30DaysRecruits < previous30DaysRecruits * 0.5) churnRiskScore += 0.10;

      // Factor 4: Low total engagement (10% weight)
      if (totalRecruits === 0 && totalEarnings === 0 && daysActive > 7) churnRiskScore += 0.10;

      // Determine churn risk level
      let churnRiskLevel = 'low';
      if (churnRiskScore >= 0.75) churnRiskLevel = 'critical';
      else if (churnRiskScore >= 0.50) churnRiskLevel = 'high';
      else if (churnRiskScore >= 0.25) churnRiskLevel = 'medium';

      // Find best recruitment times
      const dayOfWeekCounts = {};
      const hourOfDayCounts = {};

      recruits.forEach(r => {
        const dow = r.day_of_week;
        const hour = r.hour_of_day;
        dayOfWeekCounts[dow] = (dayOfWeekCounts[dow] || 0) + 1;
        hourOfDayCounts[hour] = (hourOfDayCounts[hour] || 0) + 1;
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const bestDay = recruits.length > 0
        ? dayNames[Object.keys(dayOfWeekCounts).reduce((a, b) =>
            dayOfWeekCounts[a] > dayOfWeekCounts[b] ? a : b
          )]
        : null;

      const bestHour = recruits.length > 0
        ? parseInt(Object.keys(hourOfDayCounts).reduce((a, b) =>
            hourOfDayCounts[a] > hourOfDayCounts[b] ? a : b
          ))
        : null;

      // Insert or update analytics cache
      const upsertQuery = `
        INSERT INTO user_analytics_cache (
          user_id,
          avg_daily_earnings,
          avg_weekly_earnings,
          avg_monthly_earnings,
          earnings_growth_rate,
          avg_daily_recruits,
          avg_weekly_recruits,
          network_growth_rate,
          days_active,
          days_inactive,
          last_activity_date,
          activity_score,
          predicted_30d_earnings,
          predicted_90d_earnings,
          predicted_30d_recruits,
          churn_risk_score,
          churn_risk_level,
          best_recruitment_day,
          best_recruitment_hour,
          computed_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) DO UPDATE SET
          avg_daily_earnings = EXCLUDED.avg_daily_earnings,
          avg_weekly_earnings = EXCLUDED.avg_weekly_earnings,
          avg_monthly_earnings = EXCLUDED.avg_monthly_earnings,
          earnings_growth_rate = EXCLUDED.earnings_growth_rate,
          avg_daily_recruits = EXCLUDED.avg_daily_recruits,
          avg_weekly_recruits = EXCLUDED.avg_weekly_recruits,
          network_growth_rate = EXCLUDED.network_growth_rate,
          days_active = EXCLUDED.days_active,
          days_inactive = EXCLUDED.days_inactive,
          last_activity_date = EXCLUDED.last_activity_date,
          activity_score = EXCLUDED.activity_score,
          predicted_30d_earnings = EXCLUDED.predicted_30d_earnings,
          predicted_90d_earnings = EXCLUDED.predicted_90d_earnings,
          predicted_30d_recruits = EXCLUDED.predicted_30d_recruits,
          churn_risk_score = EXCLUDED.churn_risk_score,
          churn_risk_level = EXCLUDED.churn_risk_level,
          best_recruitment_day = EXCLUDED.best_recruitment_day,
          best_recruitment_hour = EXCLUDED.best_recruitment_hour,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const { rows: [analytics] } = await client.query(upsertQuery, [
        userId,
        avgDailyEarnings,
        avgWeeklyEarnings,
        avgMonthlyEarnings,
        earningsGrowthRate,
        avgDailyRecruits,
        avgWeeklyRecruits,
        networkGrowthRate,
        daysActive,
        daysInactive,
        lastActivityDate,
        activityScore,
        predicted30dEarnings,
        predicted90dEarnings,
        predicted30dRecruits,
        churnRiskScore,
        churnRiskLevel,
        bestDay,
        bestHour
      ]);

      await client.query('COMMIT');
      return analytics;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get cached analytics for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Cached analytics
   */
  async getUserAnalytics(userId) {
    const query = `SELECT * FROM user_analytics_cache WHERE user_id = $1`;
    const { rows } = await pool.query(query, [userId]);

    if (rows.length === 0) {
      // Calculate if not cached
      return await this.calculateUserAnalytics(userId);
    }

    const analytics = rows[0];

    // Recalculate if data is older than 24 hours
    const lastUpdate = new Date(analytics.updated_at);
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      return await this.calculateUserAnalytics(userId);
    }

    return analytics;
  }

  /**
   * Get users at risk of churning
   * @param {string} riskLevel - 'medium', 'high', 'critical', or 'all'
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} List of at-risk users
   */
  async getChurnRiskUsers(riskLevel = 'all', limit = 50) {
    let query = `
      SELECT
        uac.*,
        u.email,
        u.username,
        u.balance
      FROM user_analytics_cache uac
      JOIN users u ON uac.user_id = u.id
      WHERE u.role = 'student'
    `;

    const params = [];
    if (riskLevel !== 'all') {
      query += ` AND uac.churn_risk_level = $1`;
      params.push(riskLevel);
    } else {
      query += ` AND uac.churn_risk_level IN ('medium', 'high', 'critical')`;
    }

    query += ` ORDER BY uac.churn_risk_score DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Calculate network-wide forecasts
   * @param {string} forecastType - 'daily', 'weekly', or 'monthly'
   * @param {number} daysAhead - How many days ahead to forecast
   */
  async calculateNetworkForecast(forecastType = 'daily', daysAhead = 30) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get historical data for the network
      const userGrowthQuery = `
        SELECT
          DATE(created_at) as signup_date,
          COUNT(*) as new_users
        FROM users
        WHERE role = 'student' AND created_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE(created_at)
        ORDER BY signup_date ASC
      `;
      const { rows: userGrowth } = await client.query(userGrowthQuery);

      const earningsQuery = `
        SELECT
          DATE(created_at) as earning_date,
          SUM(amount) as total_earnings
        FROM transactions
        WHERE type IN ('referral_bonus', 'level_commission')
        AND created_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE(created_at)
        ORDER BY earning_date ASC
      `;
      const { rows: earnings } = await client.query(earningsQuery);

      // Calculate average daily growth
      const avgNewUsers = userGrowth.length > 0
        ? userGrowth.reduce((sum, day) => sum + parseInt(day.new_users), 0) / userGrowth.length
        : 0;

      const avgDailyEarnings = earnings.length > 0
        ? earnings.reduce((sum, day) => sum + parseFloat(day.total_earnings), 0) / earnings.length
        : 0;

      // Get current total users
      const { rows: [{ count: currentUsers }] } = await client.query(
        `SELECT COUNT(*) FROM users WHERE role = 'student'`
      );

      // Get currently active users (activity in last 7 days)
      const { rows: [{ count: activeUsers }] } = await client.query(
        `SELECT COUNT(DISTINCT user_id) FROM transactions
         WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
      );

      // Generate forecasts for each day ahead
      const forecasts = [];
      for (let day = 1; day <= daysAhead; day++) {
        const forecastDate = new Date();
        forecastDate.setDate(forecastDate.getDate() + day);

        const predictedNewUsers = Math.round(avgNewUsers);
        const predictedTotalUsers = parseInt(currentUsers) + (predictedNewUsers * day);
        const predictedTotalEarnings = avgDailyEarnings * day;
        const predictedActiveUsers = Math.round(parseInt(activeUsers) * 1.05); // 5% growth assumption

        // Simple confidence interval (±20% for demonstration)
        const lowerBound = predictedTotalEarnings * 0.8;
        const upperBound = predictedTotalEarnings * 1.2;

        forecasts.push({
          forecastType,
          forecastDate: forecastDate.toISOString().split('T')[0],
          predictedNewUsers,
          predictedTotalUsers,
          predictedTotalEarnings,
          predictedActiveUsers,
          confidenceLevel: 0.80,
          lowerBound,
          upperBound
        });
      }

      // Insert forecasts (only keep future forecasts)
      for (const forecast of forecasts) {
        const insertQuery = `
          INSERT INTO network_forecasts (
            forecast_type,
            forecast_date,
            predicted_new_users,
            predicted_total_users,
            predicted_total_earnings,
            predicted_active_users,
            confidence_level,
            lower_bound,
            upper_bound
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (forecast_type, forecast_date) DO UPDATE SET
            predicted_new_users = EXCLUDED.predicted_new_users,
            predicted_total_users = EXCLUDED.predicted_total_users,
            predicted_total_earnings = EXCLUDED.predicted_total_earnings,
            predicted_active_users = EXCLUDED.predicted_active_users,
            confidence_level = EXCLUDED.confidence_level,
            lower_bound = EXCLUDED.lower_bound,
            upper_bound = EXCLUDED.upper_bound,
            created_at = CURRENT_TIMESTAMP
        `;

        await client.query(insertQuery, [
          forecast.forecastType,
          forecast.forecastDate,
          forecast.predictedNewUsers,
          forecast.predictedTotalUsers,
          forecast.predictedTotalEarnings,
          forecast.predictedActiveUsers,
          forecast.confidenceLevel,
          forecast.lowerBound,
          forecast.upperBound
        ]);
      }

      await client.query('COMMIT');
      return forecasts;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get network forecasts
   * @param {string} forecastType - 'daily', 'weekly', or 'monthly'
   * @param {number} limit - Number of forecast records to return
   */
  async getNetworkForecasts(forecastType = 'daily', limit = 30) {
    const query = `
      SELECT * FROM network_forecasts
      WHERE forecast_type = $1 AND forecast_date >= CURRENT_DATE
      ORDER BY forecast_date ASC
      LIMIT $2
    `;
    const { rows } = await pool.query(query, [forecastType, limit]);
    return rows;
  }

  /**
   * Get top performers by various metrics
   * @param {string} metric - 'earnings', 'growth', 'recruits'
   * @param {number} limit - Number of users to return
   */
  async getTopPerformers(metric = 'earnings', limit = 10) {
    let orderBy;
    switch (metric) {
      case 'growth':
        orderBy = 'earnings_growth_rate DESC';
        break;
      case 'recruits':
        orderBy = 'avg_weekly_recruits DESC';
        break;
      case 'earnings':
      default:
        orderBy = 'avg_monthly_earnings DESC';
    }

    const query = `
      SELECT
        uac.*,
        u.username,
        u.email,
        u.balance
      FROM user_analytics_cache uac
      JOIN users u ON uac.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY ${orderBy}
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit]);
    return rows;
  }

  /**
   * Get actionable insights for a user
   * @param {number} userId - User ID
   */
  async getUserInsights(userId) {
    const analytics = await this.getUserAnalytics(userId);
    const insights = [];

    // Churn risk insights
    if (analytics.churn_risk_level === 'critical') {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Critical: High Churn Risk',
        message: `You haven't been active in ${analytics.days_inactive} days. Consider reaching out to your network!`,
        action: 'View Network',
        priority: 'high'
      });
    } else if (analytics.churn_risk_level === 'high') {
      insights.push({
        type: 'warning',
        category: 'engagement',
        title: 'Stay Active',
        message: 'Your activity has decreased recently. Stay engaged to grow your earnings!',
        action: 'View Dashboard',
        priority: 'medium'
      });
    }

    // Earnings growth insights
    if (analytics.earnings_growth_rate > 20) {
      insights.push({
        type: 'success',
        category: 'earnings',
        title: 'Excellent Growth!',
        message: `Your earnings are up ${analytics.earnings_growth_rate.toFixed(1)}% this month!`,
        action: null,
        priority: 'low'
      });
    } else if (analytics.earnings_growth_rate < -20) {
      insights.push({
        type: 'info',
        category: 'earnings',
        title: 'Earnings Declining',
        message: 'Your earnings have decreased. Focus on recruiting and supporting your network.',
        action: 'View Strategies',
        priority: 'medium'
      });
    }

    // Best time insights
    if (analytics.best_recruitment_day && analytics.best_recruitment_hour !== null) {
      insights.push({
        type: 'info',
        category: 'optimization',
        title: 'Optimal Recruitment Time',
        message: `Your best results are on ${analytics.best_recruitment_day}s around ${analytics.best_recruitment_hour}:00.`,
        action: null,
        priority: 'low'
      });
    }

    // Predictions
    if (analytics.predicted_30d_earnings > 0) {
      insights.push({
        type: 'info',
        category: 'prediction',
        title: '30-Day Earnings Forecast',
        message: `Based on your current performance, you're projected to earn $${parseFloat(analytics.predicted_30d_earnings).toFixed(2)} in the next 30 days.`,
        action: null,
        priority: 'low'
      });
    }

    return insights;
  }
}

module.exports = new PredictiveAnalyticsService();
