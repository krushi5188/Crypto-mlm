const { pool } = require('../config/database');

class AdminAction {
  // Log admin action
  static async log(actionData) {
    const { admin_id, action_type, target_user_id, details, ip_address } = actionData;

    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        admin_id,
        action_type,
        target_user_id || null,
        details ? JSON.stringify(details) : null,
        ip_address || null
      ]
    );
  }

  // Get recent admin actions
  static async getRecent(limit = 50) {
    const [rows] = await pool.query(
      `SELECT a.*, u.username as admin_username
       FROM admin_actions a
       JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    // Parse JSON details
    rows.forEach(row => {
      if (row.details) {
        row.details = JSON.parse(row.details);
      }
    });

    return rows;
  }

  // Get actions for specific admin
  static async getByAdmin(adminId, limit = 50) {
    const [rows] = await pool.query(
      `SELECT * FROM admin_actions
       WHERE admin_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [adminId, limit]
    );

    rows.forEach(row => {
      if (row.details) {
        row.details = JSON.parse(row.details);
      }
    });

    return rows;
  }
}

module.exports = AdminAction;
