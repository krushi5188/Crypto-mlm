const { db } = require('../config/database');

class FraudAlert {
  // Get all fraud alerts with filters
  static async getAll(filters = {}) {
    const { status, severity, limit = 50, offset = 0 } = filters;

    const query = db('fraud_alerts as fa')
      .select('fa.*', 'u.username', 'u.email', 'u.risk_score', 'assigned.username as assigned_to_name')
      .join('users as u', 'fa.user_id', 'u.id')
      .leftJoin('users as assigned', 'fa.assigned_to', 'assigned.id')
      .orderBy('fa.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query.andWhere('fa.status', status);
    }
    if (severity) {
      query.andWhere('fa.severity', severity);
    }

    return query;
  }

  // Get alerts for specific user
  static async getByUserId(userId) {
    return db('fraud_alerts').where({ user_id: userId }).orderBy('created_at', 'desc');
  }

  // Update alert status
  static async updateStatus(alertId, status, resolutionNotes = null, resolvedBy = null) {
    const [result] = await db('fraud_alerts')
      .where({ id: alertId })
      .update({
        status,
        resolved_at: db.fn.now(),
        resolution_notes: resolutionNotes,
        assigned_to: resolvedBy
      })
      .returning('*');
    return result;
  }

  // Assign alert to investigator
  static async assign(alertId, assignedTo) {
    const [result] = await db('fraud_alerts')
      .where({ id: alertId })
      .update({
        assigned_to: assignedTo,
        status: 'investigating'
      })
      .returning('*');
    return result;
  }

  // Get count by status
  static async getCountByStatus() {
    return db('fraud_alerts').select('status').count('* as count').groupBy('status');
  }
}

module.exports = FraudAlert;
