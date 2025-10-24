const { pool } = require('../config/database');

class FraudAlert {
  // Get all fraud alerts with filters
  static async getAll(filters = {}) {
    const { status, severity, limit = 50, offset = 0 } = filters;

    let query = `
      SELECT
        fa.*,
        u.username, u.email, u.risk_score,
        assigned.username as assigned_to_name
      FROM fraud_alerts fa
      JOIN users u ON fa.user_id = u.id
      LEFT JOIN users assigned ON fa.assigned_to = assigned.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND fa.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (severity) {
      query += ` AND fa.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    query += ` ORDER BY fa.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get alerts for specific user
  static async getByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM fraud_alerts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Update alert status
  static async updateStatus(alertId, status, resolutionNotes = null, resolvedBy = null) {
    const result = await pool.query(
      `UPDATE fraud_alerts
       SET status = $1, resolved_at = NOW(), resolution_notes = $2, assigned_to = $3
       WHERE id = $4
       RETURNING *`,
      [status, resolutionNotes, resolvedBy, alertId]
    );
    return result.rows[0];
  }

  // Assign alert to investigator
  static async assign(alertId, assignedTo) {
    const result = await pool.query(
      `UPDATE fraud_alerts
       SET assigned_to = $1, status = 'investigating'
       WHERE id = $2
       RETURNING *`,
      [assignedTo, alertId]
    );
    return result.rows[0];
  }

  // Get count by status
  static async getCountByStatus() {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM fraud_alerts
       GROUP BY status`
    );
    return result.rows;
  }
}

module.exports = FraudAlert;
