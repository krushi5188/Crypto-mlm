const { db } = require('../config/database');

class Goal {
  // Create a new goal
  static async create(goalData) {
    const [result] = await db('user_goals').insert(goalData).returning('*');
    return result;
  }

  // Get user's goals
  static async getUserGoals(userId, includeCompleted = true) {
    const query = db('user_goals').where({ user_id: userId });

    if (!includeCompleted) {
      query.andWhere('is_completed', false);
    }

    return query.orderBy('created_at', 'desc');
  }

  // Get goal by ID
  static async getById(goalId, userId = null) {
    const query = db('user_goals').where({ id: goalId });

    if (userId) {
      query.andWhere({ user_id: userId });
    }

    return query.first();
  }

  // Update goal progress
  static async updateProgress(goalId, currentValue, userId = null) {
    const goal = await this.getById(goalId, userId);

    if (!goal) {
      throw new Error('Goal not found');
    }

    const isCompleted = currentValue >= goal.target_value;

    const updates = {
      current_value: currentValue,
      is_completed: isCompleted
    };

    if (isCompleted && !goal.is_completed) {
      updates.completed_at = db.fn.now();
    }

    const query = db('user_goals').where({ id: goalId });

    if (userId) {
      query.andWhere({ user_id: userId });
    }

    const [result] = await query.update(updates).returning('*');
    return result;
  }

  // Update goal
  static async update(goalId, updates, userId = null) {
    const allowedFields = ['target_value', 'target_date', 'goal_type'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = db('user_goals').where({ id: goalId });

    if (userId) {
      query.andWhere({ user_id: userId });
    }

    const [result] = await query.update(filteredUpdates).returning('*');
    return result;
  }

  // Delete goal
  static async delete(goalId, userId) {
    const [result] = await db('user_goals').where({ id: goalId, user_id: userId }).del().returning('*');
    return result;
  }

  // Auto-update goals based on user data
  static async syncGoalsWithUserData(userId) {
    const user = await db('users').select('total_earned', 'direct_recruits', 'network_size').where({ id: userId }).first();

    if (!user) {
      return;
    }

    await db('user_goals')
      .where({ user_id: userId, goal_type: 'earnings', is_completed: false })
      .update({ current_value: user.total_earned });

    await db('user_goals')
      .where({ user_id: userId, goal_type: 'recruits', is_completed: false })
      .update({ current_value: user.direct_recruits });

    await db('user_goals')
      .where({ user_id: userId, goal_type: 'network_size', is_completed: false })
      .update({ current_value: user.network_size });

    await db('user_goals')
      .where({ user_id: userId, is_completed: false })
      .andWhere('current_value', '>=', db.raw('target_value'))
      .update({ is_completed: true, completed_at: db.fn.now() });
  }

  // Get goal completion statistics
  static async getStats(userId) {
    return db('user_goals')
      .where({ user_id: userId })
      .select(
        'goal_type',
        db.raw('COUNT(*) as total_goals'),
        db.raw('COUNT(CASE WHEN is_completed THEN 1 END) as completed_goals'),
        db.raw('COUNT(CASE WHEN NOT is_completed THEN 1 END) as active_goals'),
        db.raw('AVG(CASE WHEN is_completed THEN (current_value / NULLIF(target_value, 0)) * 100 END) as avg_completion_rate')
      )
      .groupBy('goal_type');
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
    const user = await db('users').select('total_earned', 'direct_recruits', 'network_size').where({ id: userId }).first();

    if (!user) {
      return [];
    }
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
