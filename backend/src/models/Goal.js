const { pool } = require('../config/database');

class Goal {
  // Create a new goal
  static async create(goalData) {
    const {
      user_id,
      goal_type,
      target_value,
      current_value = 0,
      target_date = null
    } = goalData;

    const result = await pool.query(
      `INSERT INTO user_goals
       (user_id, goal_type, target_value, current_value, target_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, goal_type, target_value, current_value, target_date]
    );

    return result.rows[0];
  }

  // Get user's goals
  static async getUserGoals(userId, includeCompleted = true) {
    let query = 'SELECT * FROM user_goals WHERE user_id = $1';

    if (!includeCompleted) {
      query += ' AND is_completed = false';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get goal by ID
  static async getById(goalId, userId = null) {
    let query = 'SELECT * FROM user_goals WHERE id = $1';
    const params = [goalId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Update goal progress
  static async updateProgress(goalId, currentValue, userId = null) {
    const goal = await this.getById(goalId, userId);

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Check if goal is completed
    const isCompleted = currentValue >= goal.target_value;

    let query = `UPDATE user_goals
                 SET current_value = $1, is_completed = $2`;
    const params = [currentValue, isCompleted, goalId];

    if (isCompleted && !goal.is_completed) {
      query += `, completed_at = CURRENT_TIMESTAMP`;
    }

    query += ` WHERE id = $3`;

    if (userId) {
      query += ` AND user_id = $4`;
      params.push(userId);
    }

    query += ` RETURNING *`;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Update goal
  static async update(goalId, updates, userId = null) {
    const allowedFields = ['target_value', 'target_date', 'goal_type'];
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

    params.push(goalId);
    let query = `UPDATE user_goals SET ${setClauses.join(', ')} WHERE id = $${paramCount}`;

    if (userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(userId);
    }

    query += ` RETURNING *`;

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Delete goal
  static async delete(goalId, userId) {
    const result = await pool.query(
      'DELETE FROM user_goals WHERE id = $1 AND user_id = $2 RETURNING *',
      [goalId, userId]
    );

    return result.rows[0];
  }

  // Auto-update goals based on user data
  static async syncGoalsWithUserData(userId) {
    // Get user's current stats
    const userResult = await pool.query(
      'SELECT total_earned, direct_recruits, network_size FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return;
    }

    const user = userResult.rows[0];

    // Update earnings goals
    await pool.query(
      `UPDATE user_goals
       SET current_value = $1
       WHERE user_id = $2 AND goal_type = 'earnings' AND is_completed = false`,
      [user.total_earned, userId]
    );

    // Update recruits goals
    await pool.query(
      `UPDATE user_goals
       SET current_value = $1
       WHERE user_id = $2 AND goal_type = 'recruits' AND is_completed = false`,
      [user.direct_recruits, userId]
    );

    // Update network size goals
    await pool.query(
      `UPDATE user_goals
       SET current_value = $1
       WHERE user_id = $2 AND goal_type = 'network_size' AND is_completed = false`,
      [user.network_size, userId]
    );

    // Mark completed goals
    await pool.query(
      `UPDATE user_goals
       SET is_completed = true, completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_completed = false AND current_value >= target_value`,
      [userId]
    );
  }

  // Get goal completion statistics
  static async getStats(userId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_goals,
        COUNT(CASE WHEN is_completed THEN 1 END) as completed_goals,
        COUNT(CASE WHEN NOT is_completed THEN 1 END) as active_goals,
        goal_type,
        AVG(CASE WHEN is_completed THEN (current_value / NULLIF(target_value, 0)) * 100 END) as avg_completion_rate
       FROM user_goals
       WHERE user_id = $1
       GROUP BY goal_type`,
      [userId]
    );

    return result.rows;
  }

  // Calculate projected completion date based on current progress
  static calculateProjectedCompletion(goal, recentGrowthRate) {
    if (goal.current_value >= goal.target_value) {
      return new Date(); // Already completed
    }

    const remaining = goal.target_value - goal.current_value;

    if (recentGrowthRate <= 0) {
      return null; // No progress, can't project
    }

    const daysNeeded = Math.ceil(remaining / recentGrowthRate);
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysNeeded);

    return projectedDate;
  }

  // Get recommended goals based on user's current performance
  static async getRecommendedGoals(userId) {
    const userResult = await pool.query(
      'SELECT total_earned, direct_recruits, network_size FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return [];
    }

    const user = userResult.rows[0];
    const recommendations = [];

    // Recommend earnings milestone
    const currentEarnings = parseFloat(user.total_earned);
    if (currentEarnings < 100) {
      recommendations.push({
        goal_type: 'earnings',
        target_value: 100,
        reason: 'Reach your first $100'
      });
    } else if (currentEarnings < 1000) {
      recommendations.push({
        goal_type: 'earnings',
        target_value: 1000,
        reason: 'Break the $1,000 milestone'
      });
    } else {
      const nextMilestone = Math.ceil(currentEarnings / 1000) * 1000;
      recommendations.push({
        goal_type: 'earnings',
        target_value: nextMilestone,
        reason: `Reach $${nextMilestone}`
      });
    }

    // Recommend recruit goal
    const currentRecruits = user.direct_recruits;
    if (currentRecruits < 5) {
      recommendations.push({
        goal_type: 'recruits',
        target_value: 5,
        reason: 'Build a foundation with 5 direct recruits'
      });
    } else if (currentRecruits < 10) {
      recommendations.push({
        goal_type: 'recruits',
        target_value: 10,
        reason: 'Grow to 10 direct recruits'
      });
    }

    // Recommend network size goal
    const currentNetwork = user.network_size;
    if (currentNetwork < 20) {
      recommendations.push({
        goal_type: 'network_size',
        target_value: 20,
        reason: 'Expand your network to 20 members'
      });
    } else if (currentNetwork < 50) {
      recommendations.push({
        goal_type: 'network_size',
        target_value: 50,
        reason: 'Build a network of 50 members'
      });
    }

    return recommendations;
  }
}

module.exports = Goal;
