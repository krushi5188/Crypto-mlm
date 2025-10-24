const { pool } = require('../config/database');

class UserPreferences {
  // Get user preferences
  static async getByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  // Create default preferences for new user
  static async create(userId) {
    const result = await pool.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  // Update preferences
  static async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.theme !== undefined) {
      fields.push(`theme = $${paramIndex++}`);
      values.push(updates.theme);
    }
    if (updates.dashboard_layout !== undefined) {
      fields.push(`dashboard_layout = $${paramIndex++}`);
      values.push(JSON.stringify(updates.dashboard_layout));
    }
    if (updates.hidden_widgets !== undefined) {
      fields.push(`hidden_widgets = $${paramIndex++}`);
      values.push(updates.hidden_widgets);
    }
    if (updates.notifications_enabled !== undefined) {
      fields.push(`notifications_enabled = $${paramIndex++}`);
      values.push(updates.notifications_enabled);
    }
    if (updates.email_notifications !== undefined) {
      fields.push(`email_notifications = $${paramIndex++}`);
      values.push(updates.email_notifications);
    }
    if (updates.show_onboarding !== undefined) {
      fields.push(`show_onboarding = $${paramIndex++}`);
      values.push(updates.show_onboarding);
    }
    if (updates.onboarding_step !== undefined) {
      fields.push(`onboarding_step = $${paramIndex++}`);
      values.push(updates.onboarding_step);
    }

    if (fields.length === 0) return null;

    values.push(userId);

    const result = await pool.query(
      `UPDATE user_preferences
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Complete onboarding
  static async completeOnboarding(userId) {
    const result = await pool.query(
      `UPDATE user_preferences
       SET show_onboarding = false, onboarding_step = 999
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = UserPreferences;
