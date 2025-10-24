const { pool } = require('../config/database');

class MessageTemplate {
  // Get all templates
  static async getAll(type = null) {
    let query = `SELECT * FROM message_templates`;
    const params = [];

    if (type) {
      query += ` WHERE template_type = $1`;
      params.push(type);
    }

    query += ` ORDER BY is_default DESC, usage_count DESC, name ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get template by ID
  static async getById(templateId) {
    const result = await pool.query(
      'SELECT * FROM message_templates WHERE id = $1',
      [templateId]
    );

    return result.rows[0];
  }

  // Create template
  static async create(templateData) {
    const {
      name,
      template_type,
      subject,
      content,
      variables,
      is_default = false,
      created_by
    } = templateData;

    const result = await pool.query(
      `INSERT INTO message_templates
       (name, template_type, subject, content, variables, is_default, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, template_type, subject, content, variables, is_default, created_by]
    );

    return result.rows[0];
  }

  // Update template
  static async update(templateId, updates) {
    const allowedFields = ['name', 'subject', 'content', 'variables'];
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

    params.push(templateId);

    const result = await pool.query(
      `UPDATE message_templates
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  // Delete template (only if not default)
  static async delete(templateId) {
    const result = await pool.query(
      'DELETE FROM message_templates WHERE id = $1 AND is_default = false RETURNING *',
      [templateId]
    );

    return result.rows[0];
  }

  // Render template with variables
  static renderTemplate(template, variables) {
    let rendered = {
      subject: template.subject,
      content: template.content
    };

    // Replace variables in format {{variable_name}}
    Object.keys(variables).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      if (rendered.subject) {
        rendered.subject = rendered.subject.replace(placeholder, variables[key]);
      }
      rendered.content = rendered.content.replace(placeholder, variables[key]);
    });

    return rendered;
  }

  // Increment usage count
  static async incrementUsage(templateId) {
    await pool.query(
      'UPDATE message_templates SET usage_count = usage_count + 1 WHERE id = $1',
      [templateId]
    );
  }

  // Get default templates
  static async getDefaults() {
    const result = await pool.query(
      'SELECT * FROM message_templates WHERE is_default = true ORDER BY template_type, name'
    );

    return result.rows;
  }

  // Log share activity
  static async logShare(userId, platform, templateId = null) {
    await pool.query(
      'INSERT INTO referral_shares (user_id, platform, template_id) VALUES ($1, $2, $3)',
      [userId, platform, templateId]
    );

    if (templateId) {
      await this.incrementUsage(templateId);
    }
  }

  // Get share statistics for user
  static async getShareStats(userId) {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_shares,
        COUNT(DISTINCT platform) as platforms_used,
        platform,
        COUNT(*) as share_count
       FROM referral_shares
       WHERE user_id = $1
       GROUP BY platform
       ORDER BY share_count DESC`,
      [userId]
    );

    const stats = {
      total_shares: 0,
      platforms_used: 0,
      by_platform: {}
    };

    result.rows.forEach(row => {
      stats.total_shares += parseInt(row.share_count);
      stats.by_platform[row.platform] = parseInt(row.share_count);
    });

    stats.platforms_used = Object.keys(stats.by_platform).length;

    return stats;
  }

  // Get trending templates
  static async getTrending(limit = 5) {
    const result = await pool.query(
      `SELECT * FROM message_templates
       ORDER BY usage_count DESC, created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }
}

module.exports = MessageTemplate;
