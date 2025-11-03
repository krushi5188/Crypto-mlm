const { db } = require('../config/database');

class AdminAction {
  // Log admin action
  static async log(actionData) {
    return db('admin_actions').insert(actionData);
  }

  // Get recent admin actions
  static async getRecent(limit = 50) {
    return db('admin_actions as a')
      .select('a.*', 'u.username as admin_username')
      .join('users as u', 'a.admin_id', 'u.id')
      .orderBy('a.created_at', 'desc')
      .limit(limit);
  }

  // Get actions for specific admin
  static async getByAdmin(adminId, limit = 50) {
    return db('admin_actions')
      .where({ admin_id: adminId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

module.exports = AdminAction;
