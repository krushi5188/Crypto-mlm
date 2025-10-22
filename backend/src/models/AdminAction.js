const { pool } = require('../config/database');

class AdminAction {
  // Log admin action
  static async log(actionData) {
    const { admin_id, action_type, target_user_id, details, ip_address } = actionData;

    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        admin_id,
        action_type,
        target_user_id || null,
        details || null,  // PostgreSQL JSONB handles objects directly
        ip_address || null
      ]
    );
  }

  // Get recent admin actions
  static async getRecent(limit = 50) {
    const result = await pool.query(
      `SELECT a.*, u.username as admin_username
       FROM admin_actions a
       JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    // PostgreSQL JSONB returns objects directly, no parsing needed
    return result.rows;
  }

  // Get actions for specific admin
  static async getByAdmin(adminId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM admin_actions
       WHERE admin_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [adminId, limit]
    );

    // PostgreSQL JSONB returns objects directly, no parsing needed
    return result.rows;
  }
}

module.exports = AdminAction;
