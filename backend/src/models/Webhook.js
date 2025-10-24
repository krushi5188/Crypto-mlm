const { pool } = require('../config/database');
const crypto = require('crypto');
const axios = require('axios');

class Webhook {
  // Create webhook
  static async create(webhookData) {
    const {
      user_id,
      url,
      events,
      retry_count = 3
    } = webhookData;

    // Generate secret for signature verification
    const secret = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO webhooks (user_id, url, events, secret, retry_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, url, events, secret, retry_count]
    );

    return result.rows[0];
  }

  // Get user's webhooks
  static async getUserWebhooks(userId) {
    const result = await pool.query(
      'SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows;
  }

  // Get webhook by ID
  static async getById(webhookId, userId = null) {
    let query = 'SELECT * FROM webhooks WHERE id = $1';
    const params = [webhookId];

    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Update webhook
  static async update(webhookId, updates, userId) {
    const allowedFields = ['url', 'events', 'is_active', 'retry_count'];
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

    params.push(webhookId, userId);

    const result = await pool.query(
      `UPDATE webhooks
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  // Delete webhook
  static async delete(webhookId, userId) {
    const result = await pool.query(
      'DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING *',
      [webhookId, userId]
    );

    return result.rows[0];
  }

  // Trigger webhook
  static async trigger(eventType, payload) {
    // Find all active webhooks subscribed to this event
    const result = await pool.query(
      'SELECT * FROM webhooks WHERE is_active = true AND $1 = ANY(events)',
      [eventType]
    );

    const webhooks = result.rows;

    // Trigger each webhook
    for (const webhook of webhooks) {
      await this.sendWebhook(webhook, eventType, payload);
    }
  }

  // Send webhook with retry logic
  static async sendWebhook(webhook, eventType, payload, retryCount = 0) {
    const deliveryData = {
      webhook_id: webhook.id,
      event_type: eventType,
      payload: payload,
      retry_count: retryCount
    };

    try {
      // Create signature for verification
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // Send webhook
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType
        },
        timeout: 30000 // 30 seconds
      });

      // Log successful delivery
      await pool.query(
        `INSERT INTO webhook_deliveries
         (webhook_id, event_type, payload, response_status, response_body, delivered_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [webhook.id, eventType, payload, response.status, JSON.stringify(response.data).substring(0, 1000)]
      );

      // Update webhook last triggered
      await pool.query(
        `UPDATE webhooks
         SET last_triggered_at = CURRENT_TIMESTAMP, last_status = 'success'
         WHERE id = $1`,
        [webhook.id]
      );

      return { success: true };
    } catch (error) {
      // Log failed delivery
      await pool.query(
        `INSERT INTO webhook_deliveries
         (webhook_id, event_type, payload, response_status, response_body, retry_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [webhook.id, eventType, payload, error.response?.status || 0,
         error.message.substring(0, 1000), retryCount]
      );

      // Retry if attempts remaining
      if (retryCount < webhook.retry_count) {
        setTimeout(() => {
          this.sendWebhook(webhook, eventType, payload, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      } else {
        // Max retries reached, update webhook status
        await pool.query(
          `UPDATE webhooks
           SET last_triggered_at = CURRENT_TIMESTAMP, last_status = 'failed'
           WHERE id = $1`,
          [webhook.id]
        );
      }

      return { success: false, error: error.message };
    }
  }

  // Get webhook delivery history
  static async getDeliveryHistory(webhookId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM webhook_deliveries
       WHERE webhook_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [webhookId, limit]
    );

    return result.rows;
  }

  // Get webhook statistics
  static async getStats(webhookId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as successful_deliveries,
        COUNT(CASE WHEN delivered_at IS NULL THEN 1 END) as failed_deliveries,
        AVG(CASE WHEN delivered_at IS NOT NULL THEN 1 ELSE 0 END) * 100 as success_rate
       FROM webhook_deliveries
       WHERE webhook_id = $1`,
      [webhookId]
    );

    return result.rows[0];
  }
}

module.exports = Webhook;
