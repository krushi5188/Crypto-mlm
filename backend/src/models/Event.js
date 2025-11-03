const { db } = require('../config/database');

class Event {
  // Create new event
  static async create(eventData) {
    const [result] = await db('team_events').insert(eventData).returning('*');
    return result;
  }

  // Get all events with filters
  static async getAll(filters = {}) {
    const { type, upcoming = true, userId, page = 1, limit = 20 } = filters;

    const query = db('team_events as e')
      .select('e.*', 'u.username as creator_name', db.raw('(SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as registered_count'))
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .where('e.is_public', true)
      .orderBy('e.start_time', 'asc')
      .limit(limit)
      .offset((page - 1) * limit);

    if (type) {
      query.andWhere('e.event_type', type);
    }
    if (upcoming) {
      query.andWhere('e.start_time', '>=', db.fn.now());
    }

    const events = await query;

    if (userId) {
      for (const event of events) {
        const rsvp = await db('event_attendees').select('rsvp_status').where({ event_id: event.id, user_id: userId }).first();
        event.user_rsvp_status = rsvp?.rsvp_status || null;
      }
    }

    return events;
  }

  // Get event by ID
  static async getById(eventId, userId = null) {
    const event = await db('team_events as e')
      .select('e.*', 'u.username as creator_name', db.raw('(SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as registered_count'))
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .where('e.id', eventId)
      .first();

    if (!event) {
      return null;
    }

    event.attendees = await db('event_attendees as ea')
      .select('ea.*', 'u.username', 'u.email')
      .join('users as u', 'ea.user_id', 'u.id')
      .where('ea.event_id', eventId)
      .orderBy('ea.registered_at', 'desc');

    if (userId) {
      const rsvp = await db('event_attendees').select('rsvp_status').where({ event_id: eventId, user_id: userId }).first();
      event.user_rsvp_status = rsvp?.rsvp_status || null;
    }

    return event;
  }

  // Update event
  static async update(eventId, updates) {
    const allowedFields = ['title', 'description', 'start_time', 'end_time', 'meeting_link', 'max_attendees', 'is_public'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const [result] = await db('team_events')
      .where({ id: eventId })
      .update({ ...filteredUpdates, updated_at: db.fn.now() })
      .returning('*');
    return result;
  }

  // Delete event
  static async delete(eventId) {
    const [result] = await db('team_events').where({ id: eventId }).del().returning('*');
    return result;
  }

  // RSVP to event
  static async rsvp(eventId, userId, status = 'accepted') {
    const existing = await db('event_attendees').where({ event_id: eventId, user_id: userId }).first();

    if (existing) {
      const [result] = await db('event_attendees')
        .where({ event_id: eventId, user_id: userId })
        .update({ rsvp_status: status })
        .returning('*');
      return result;
    } else {
      const [result] = await db('event_attendees')
        .insert({ event_id: eventId, user_id: userId, rsvp_status: status })
        .returning('*');

      if (status === 'accepted') {
        await db('team_events').where({ id: eventId }).increment('current_attendees', 1);
      }

      return result;
    }
  }

  // Cancel RSVP
  static async cancelRsvp(eventId, userId) {
    const [result] = await db('event_attendees')
      .where({ event_id: eventId, user_id: userId })
      .del()
      .returning('*');

    if (result && result.rsvp_status === 'accepted') {
      await db('team_events').where({ id: eventId }).decrement('current_attendees', 1);
    }

    return result;
  }

  // Mark attendance
  static async markAttended(eventId, userId) {
    const [result] = await db('event_attendees')
      .where({ event_id: eventId, user_id: userId })
      .update({ rsvp_status: 'attended', attended_at: db.fn.now() })
      .returning('*');
    return result;
  }

  // Get user's events
  static async getUserEvents(userId, upcoming = true) {
    const query = db('team_events as e')
      .select('e.*', 'u.username as creator_name', 'ea.rsvp_status', 'ea.registered_at')
      .leftJoin('users as u', 'e.created_by', 'u.id')
      .join('event_attendees as ea', 'e.id', 'ea.event_id')
      .where('ea.user_id', userId);

    if (upcoming) {
      query.andWhere('e.start_time', '>=', db.fn.now()).orderBy('e.start_time', 'asc');
    } else {
      query.andWhere('e.start_time', '<', db.fn.now()).orderBy('e.start_time', 'desc');
    }

    return query;
  }

  // Get event statistics
  static async getStats(eventId) {
    return db('event_attendees')
      .where({ event_id: eventId })
      .select(
        db.raw('COUNT(*) as total_registered'),
        db.raw(`COUNT(CASE WHEN rsvp_status = 'accepted' THEN 1 END) as accepted_count`),
        db.raw(`COUNT(CASE WHEN rsvp_status = 'declined' THEN 1 END) as declined_count`),
        db.raw(`COUNT(CASE WHEN rsvp_status = 'attended' THEN 1 END) as attended_count`)
      )
      .first();
  }

  // Get upcoming events count
  static async getUpcomingCount() {
    const { count } = await db('team_events')
      .where('start_time', '>=', db.fn.now())
      .andWhere('is_public', true)
      .count({ count: '*' })
      .first();
    return parseInt(count);
  }
}

module.exports = Event;
