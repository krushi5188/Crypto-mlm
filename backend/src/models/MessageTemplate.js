const { db } = require('../config/database');

class MessageTemplate {
  // Get all templates
  static async getAll(type = null) {
    const query = db('message_templates');

    if (type) {
      query.where({ template_type: type });
    }

    return query.orderBy(['is_default', 'usage_count', 'name'], ['desc', 'desc', 'asc']);
  }

  // Get template by ID
  static async getById(templateId) {
    return db('message_templates').where({ id: templateId }).first();
  }

  // Create template
  static async create(templateData) {
    const [result] = await db('message_templates').insert(templateData).returning('*');
    return result;
  }

  // Update template
  static async update(templateId, updates) {
    const allowedFields = ['name', 'subject', 'content', 'variables'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const [result] = await db('message_templates')
      .where({ id: templateId })
      .update({ ...filteredUpdates, updated_at: db.fn.now() })
      .returning('*');
    return result;
  }

  // Delete template (only if not default)
  static async delete(templateId) {
    const [result] = await db('message_templates')
      .where({ id: templateId, is_default: false })
      .del()
      .returning('*');
    return result;
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
    return db('message_templates').where({ id: templateId }).increment('usage_count', 1);
  }

  // Get default templates
  static async getDefaults() {
    return db('message_templates').where({ is_default: true }).orderBy(['template_type', 'name']);
  }

  // Log share activity
  static async logShare(userId, platform, templateId = null) {
    await db('referral_shares').insert({ user_id: userId, platform, template_id: templateId });

    if (templateId) {
      await this.incrementUsage(templateId);
    }
  }

  // Get share statistics for user
  static async getShareStats(userId) {
    const rows = await db('referral_shares')
      .select('platform')
      .count('* as share_count')
      .where({ user_id: userId })
      .groupBy('platform')
      .orderBy('share_count', 'desc');

    const stats = {
      total_shares: 0,
      platforms_used: 0,
      by_platform: {}
    };

    rows.forEach(row => {
      stats.total_shares += parseInt(row.share_count);
      stats.by_platform[row.platform] = parseInt(row.share_count);
    });

    stats.platforms_used = Object.keys(stats.by_platform).length;

    return stats;
  }

  // Get trending templates
  static async getTrending(limit = 5) {
    return db('message_templates')
      .orderBy(['usage_count', 'created_at'], ['desc', 'desc'])
      .limit(limit);
  }
}

module.exports = MessageTemplate;
