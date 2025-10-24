const { pool } = require('../config/database');

class Event {
  // Create new event
  static async create(eventData) {
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      timezone = 'UTC',
      meeting_link,
      is_recurring = false,
      recurrence_pattern,
      max_attendees,
      is_public = true,
      created_by
    } = eventData;

    const result = await pool.query(
      `INSERT INTO team_events
       (title, description, event_type, start_time, end_time, timezone, meeting_link,
        is_recurring, recurrence_pattern, max_attendees, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [title, description, event_type, start_time, end_time, timezone, meeting_link,
       is_recurring, recurrence_pattern, max_attendees, is_public, created_by]
    );

    return result.rows[0];
  }

  // Get all events with filters
  static async getAll(filters = {}) {
    const { type, upcoming = true, userId, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = ['is_public = true'];
    let params = [];
    let paramCount = 1;

    if (type) {
      whereConditions.push(`event_type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }

    if (upcoming) {
      whereConditions.push(`start_time >= CURRENT_TIMESTAMP`);
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT e.*, u.username as creator_name,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as registered_count
       FROM team_events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY start_time ASC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    // Get user's RSVP status if userId provided
    if (userId) {
      for (let event of result.rows) {
        const rsvpResult = await pool.query(
          'SELECT rsvp_status FROM event_attendees WHERE event_id = $1 AND user_id = $2',
          [event.id, userId]
        );
        event.user_rsvp_status = rsvpResult.rows[0]?.rsvp_status || null;
      }
    }

    return result.rows;
  }

  // Get event by ID
  static async getById(eventId, userId = null) {
    const result = await pool.query(
      `SELECT e.*, u.username as creator_name,
              (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as registered_count
       FROM team_events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [eventId]
    );

    if (result.rows.length === 0) return null;

    const event = result.rows[0];

    // Get attendee list
    const attendeesResult = await pool.query(
      `SELECT ea.*, u.username, u.email
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = $1
       ORDER BY ea.registered_at DESC`,
      [eventId]
    );

    event.attendees = attendeesResult.rows;

    // Get user's RSVP if userId provided
    if (userId) {
      const rsvpResult = await pool.query(
        'SELECT rsvp_status FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [eventId, userId]
      );
      event.user_rsvp_status = rsvpResult.rows[0]?.rsvp_status || null;
    }

    return event;
  }

  // Update event
  static async update(eventId, updates) {
    const allowedFields = ['title', 'description', 'start_time', 'end_time', 'meeting_link', 'max_attendees', 'is_public'];
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

    params.push(eventId);

    const result = await pool.query(
      `UPDATE team_events
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  // Delete event
  static async delete(eventId) {
    const result = await pool.query(
      'DELETE FROM team_events WHERE id = $1 RETURNING *',
      [eventId]
    );

    return result.rows[0];
  }

  // RSVP to event
  static async rsvp(eventId, userId, status = 'accepted') {
    // Check if already registered
    const existing = await pool.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existing.rows.length > 0) {
      // Update existing RSVP
      const result = await pool.query(
        `UPDATE event_attendees
         SET rsvp_status = $1
         WHERE event_id = $2 AND user_id = $3
         RETURNING *`,
        [status, eventId, userId]
      );
      return result.rows[0];
    } else {
      // Create new RSVP
      const result = await pool.query(
        `INSERT INTO event_attendees (event_id, user_id, rsvp_status)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [eventId, userId, status]
      );

      // Increment attendee count if accepted
      if (status === 'accepted') {
        await pool.query(
          'UPDATE team_events SET current_attendees = current_attendees + 1 WHERE id = $1',
          [eventId]
        );
      }

      return result.rows[0];
    }
  }

  // Cancel RSVP
  static async cancelRsvp(eventId, userId) {
    const result = await pool.query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2 RETURNING *',
      [eventId, userId]
    );

    if (result.rows.length > 0 && result.rows[0].rsvp_status === 'accepted') {
      await pool.query(
        'UPDATE team_events SET current_attendees = current_attendees - 1 WHERE id = $1',
        [eventId]
      );
    }

    return result.rows[0];
  }

  // Mark attendance
  static async markAttended(eventId, userId) {
    const result = await pool.query(
      `UPDATE event_attendees
       SET rsvp_status = 'attended', attended_at = CURRENT_TIMESTAMP
       WHERE event_id = $1 AND user_id = $2
       RETURNING *`,
      [eventId, userId]
    );

    return result.rows[0];
  }

  // Get user's events
  static async getUserEvents(userId, upcoming = true) {
    const timeCondition = upcoming
      ? 'AND e.start_time >= CURRENT_TIMESTAMP'
      : 'AND e.start_time < CURRENT_TIMESTAMP';

    const result = await pool.query(
      `SELECT e.*, u.username as creator_name, ea.rsvp_status, ea.registered_at
       FROM team_events e
       LEFT JOIN users u ON e.created_by = u.id
       JOIN event_attendees ea ON e.id = ea.event_id
       WHERE ea.user_id = $1 ${timeCondition}
       ORDER BY e.start_time ${upcoming ? 'ASC' : 'DESC'}`,
      [userId]
    );

    return result.rows;
  }

  // Get event statistics
  static async getStats(eventId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_registered,
        COUNT(CASE WHEN rsvp_status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN rsvp_status = 'declined' THEN 1 END) as declined_count,
        COUNT(CASE WHEN rsvp_status = 'attended' THEN 1 END) as attended_count
       FROM event_attendees
       WHERE event_id = $1`,
      [eventId]
    );

    return result.rows[0];
  }

  // Get upcoming events count
  static async getUpcomingCount() {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM team_events WHERE start_time >= CURRENT_TIMESTAMP AND is_public = true'
    );

    return parseInt(result.rows[0].count);
  }
}

module.exports = Event;
