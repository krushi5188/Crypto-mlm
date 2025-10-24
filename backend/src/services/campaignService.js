const pool = require('../config/database');
const emailService = require('./emailService');

/**
 * Marketing Campaign Service
 * Handles automated email campaigns, drip sequences, and marketing automation
 */
class CampaignService {
  /**
   * Create a new marketing campaign
   * @param {Object} campaignData - Campaign configuration
   */
  async createCampaign(campaignData) {
    const {
      name,
      description,
      campaign_type,
      target_audience = 'all',
      target_conditions,
      trigger_event,
      trigger_delay_hours = 0,
      subject_line,
      email_template,
      email_variables,
      schedule_type,
      schedule_time,
      schedule_days,
      created_by
    } = campaignData;

    const query = `
      INSERT INTO marketing_campaigns (
        name, description, campaign_type, target_audience, target_conditions,
        trigger_event, trigger_delay_hours, subject_line, email_template,
        email_variables, schedule_type, schedule_time, schedule_days,
        status, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      name, description, campaign_type, target_audience,
      target_conditions ? JSON.stringify(target_conditions) : null,
      trigger_event, trigger_delay_hours, subject_line, email_template,
      email_variables ? JSON.stringify(email_variables) : null,
      schedule_type, schedule_time, schedule_days, created_by
    ]);

    return rows[0];
  }

  /**
   * Add a step to a drip sequence
   * @param {number} campaignId - Campaign ID
   * @param {Object} stepData - Step configuration
   */
  async addDripStep(campaignId, stepData) {
    const { sequence_order, delay_days, subject_line, email_template, email_variables } = stepData;

    const query = `
      INSERT INTO drip_sequences (
        campaign_id, sequence_order, delay_days, subject_line,
        email_template, email_variables, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      campaignId, sequence_order, delay_days, subject_line,
      email_template, email_variables ? JSON.stringify(email_variables) : null
    ]);

    return rows[0];
  }

  /**
   * Update campaign status
   * @param {number} campaignId - Campaign ID
   * @param {string} status - New status (draft, active, paused, completed)
   */
  async updateCampaignStatus(campaignId, status) {
    const query = `
      UPDATE marketing_campaigns
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [status, campaignId]);
    return rows[0];
  }

  /**
   * Get target audience for a campaign
   * @param {number} campaignId - Campaign ID
   * @returns {Promise<Array>} List of user IDs
   */
  async getTargetAudience(campaignId) {
    // Get campaign details
    const campaignQuery = `SELECT * FROM marketing_campaigns WHERE id = $1`;
    const { rows: [campaign] } = await pool.query(campaignQuery, [campaignId]);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    let userQuery = 'SELECT id, email, username FROM users WHERE role = $1';
    const params = ['student'];

    // Apply audience targeting
    switch (campaign.target_audience) {
      case 'new_users':
        userQuery += ' AND created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
        break;
      case 'active':
        userQuery += ` AND id IN (
          SELECT DISTINCT user_id FROM transactions
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        )`;
        break;
      case 'inactive':
        userQuery += ` AND id NOT IN (
          SELECT DISTINCT user_id FROM transactions
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        )`;
        break;
      case 'high_earners':
        userQuery += ' AND total_earned > 1000';
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    const { rows: users } = await pool.query(userQuery, params);
    return users;
  }

  /**
   * Send campaign to all recipients
   * @param {number} campaignId - Campaign ID
   */
  async executeCampaign(campaignId) {
    const campaign = await this.getCampaignById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error('Campaign must be active to execute');
    }

    // Get target audience
    const users = await this.getTargetAudience(campaignId);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        // Check if already sent
        const alreadySentQuery = `
          SELECT id FROM campaign_recipients
          WHERE campaign_id = $1 AND user_id = $2 AND status != 'failed'
        `;
        const { rows: existing } = await pool.query(alreadySentQuery, [campaignId, user.id]);

        if (existing.length > 0) {
          continue; // Skip if already sent
        }

        // Render template with user variables
        const renderedEmail = this.renderTemplate(campaign.email_template, {
          username: user.username,
          email: user.email,
          ...campaign.email_variables
        });

        // Send email
        const result = await emailService.sendEmail({
          to: user.email,
          subject: campaign.subject_line,
          html: renderedEmail
        });

        // Record recipient
        if (result.success) {
          await this.recordRecipient(campaignId, user.id, 'sent');
          successCount++;
        } else {
          await this.recordRecipient(campaignId, user.id, 'failed', result.error);
          failCount++;
        }
      } catch (error) {
        console.error(`Failed to send to user ${user.id}:`, error);
        await this.recordRecipient(campaignId, user.id, 'failed', error.message);
        failCount++;
      }
    }

    // Update campaign stats
    await pool.query(
      `UPDATE marketing_campaigns
       SET total_sent = total_sent + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [successCount, campaignId]
    );

    // Update daily stats
    await this.updateDailyStats(campaignId, successCount, 0, 0, 0);

    return { successCount, failCount, totalProcessed: users.length };
  }

  /**
   * Execute drip campaign for a user
   * @param {number} campaignId - Campaign ID
   * @param {number} userId - User ID
   */
  async executeDripCampaign(campaignId, userId) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get drip sequence steps
    const stepsQuery = `
      SELECT * FROM drip_sequences
      WHERE campaign_id = $1
      ORDER BY sequence_order ASC
    `;
    const { rows: steps } = await pool.query(stepsQuery, [campaignId]);

    // Get user signup date or campaign start date
    const startDate = new Date(user.created_at);

    for (const step of steps) {
      // Calculate send date
      const sendDate = new Date(startDate);
      sendDate.setDate(sendDate.getDate() + step.delay_days);

      // Check if it's time to send this step
      if (sendDate <= new Date()) {
        // Check if already sent
        const alreadySentQuery = `
          SELECT id FROM campaign_recipients
          WHERE campaign_id = $1 AND user_id = $2 AND sequence_step = $3
        `;
        const { rows: existing } = await pool.query(alreadySentQuery, [campaignId, userId, step.sequence_order]);

        if (existing.length === 0) {
          // Send email
          const renderedEmail = this.renderTemplate(step.email_template, {
            username: user.username,
            email: user.email,
            ...step.email_variables
          });

          const result = await emailService.sendEmail({
            to: user.email,
            subject: step.subject_line,
            html: renderedEmail
          });

          // Record recipient
          await this.recordRecipient(campaignId, userId, result.success ? 'sent' : 'failed', result.error || null, step.sequence_order);

          // Update drip step stats
          if (result.success) {
            await pool.query(
              `UPDATE drip_sequences SET sent_count = sent_count + 1 WHERE id = $1`,
              [step.id]
            );
          }
        }
      }
    }
  }

  /**
   * Process behavioral triggers
   * @param {string} eventType - Trigger event type
   * @param {number} userId - User ID
   * @param {Object} eventData - Additional event data
   */
  async processTrigger(eventType, userId, eventData = {}) {
    // Find campaigns with this trigger
    const query = `
      SELECT * FROM marketing_campaigns
      WHERE trigger_event = $1 AND status = 'active'
    `;
    const { rows: campaigns } = await pool.query(query, [eventType]);

    for (const campaign of campaigns) {
      // Check if user hasn't received this campaign yet
      const alreadySentQuery = `
        SELECT id FROM campaign_recipients
        WHERE campaign_id = $1 AND user_id = $2
      `;
      const { rows: existing } = await pool.query(alreadySentQuery, [campaign.id, userId]);

      if (existing.length === 0) {
        // Schedule email with delay
        if (campaign.trigger_delay_hours > 0) {
          // In production, use a job queue like Bull or Agenda
          // For now, we'll send immediately or use setTimeout for short delays
          setTimeout(async () => {
            await this.sendCampaignToUser(campaign.id, userId, eventData);
          }, campaign.trigger_delay_hours * 60 * 60 * 1000);
        } else {
          // Send immediately
          await this.sendCampaignToUser(campaign.id, userId, eventData);
        }
      }
    }
  }

  /**
   * Send campaign to a single user
   * @param {number} campaignId - Campaign ID
   * @param {number} userId - User ID
   * @param {Object} additionalVars - Additional template variables
   */
  async sendCampaignToUser(campaignId, userId, additionalVars = {}) {
    const campaign = await this.getCampaignById(campaignId);
    const user = await this.getUserById(userId);

    if (!campaign || !user) {
      return;
    }

    // Render template
    const renderedEmail = this.renderTemplate(campaign.email_template, {
      username: user.username,
      email: user.email,
      ...campaign.email_variables,
      ...additionalVars
    });

    // Send email
    const result = await emailService.sendEmail({
      to: user.email,
      subject: campaign.subject_line,
      html: renderedEmail
    });

    // Record recipient
    await this.recordRecipient(campaignId, userId, result.success ? 'sent' : 'failed', result.error || null);

    if (result.success) {
      await pool.query(
        `UPDATE marketing_campaigns SET total_sent = total_sent + 1 WHERE id = $1`,
        [campaignId]
      );
    }
  }

  /**
   * Record campaign recipient
   * @param {number} campaignId - Campaign ID
   * @param {number} userId - User ID
   * @param {string} status - Delivery status
   * @param {string} errorMessage - Error message if failed
   * @param {number} sequenceStep - Drip sequence step number
   */
  async recordRecipient(campaignId, userId, status, errorMessage = null, sequenceStep = null) {
    const query = `
      INSERT INTO campaign_recipients (
        campaign_id, user_id, sequence_step, status, sent_at,
        error_message, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      campaignId,
      userId,
      sequenceStep,
      status,
      status === 'sent' ? new Date() : null,
      errorMessage
    ]);

    return rows[0];
  }

  /**
   * Track email open
   * @param {number} recipientId - Recipient ID
   */
  async trackOpen(recipientId) {
    const query = `
      UPDATE campaign_recipients
      SET status = 'opened', opened_at = CURRENT_TIMESTAMP, open_count = open_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING campaign_id
    `;

    const { rows } = await pool.query(query, [recipientId]);

    if (rows.length > 0) {
      // Update campaign stats
      await pool.query(
        `UPDATE marketing_campaigns SET total_opened = total_opened + 1 WHERE id = $1`,
        [rows[0].campaign_id]
      );
    }
  }

  /**
   * Track email click
   * @param {number} recipientId - Recipient ID
   */
  async trackClick(recipientId) {
    const query = `
      UPDATE campaign_recipients
      SET status = 'clicked', clicked_at = CURRENT_TIMESTAMP, click_count = click_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING campaign_id
    `;

    const { rows } = await pool.query(query, [recipientId]);

    if (rows.length > 0) {
      // Update campaign stats
      await pool.query(
        `UPDATE marketing_campaigns SET total_clicked = total_clicked + 1 WHERE id = $1`,
        [rows[0].campaign_id]
      );
    }
  }

  /**
   * Update daily stats for a campaign
   * @param {number} campaignId - Campaign ID
   * @param {number} sent - Emails sent
   * @param {number} opened - Emails opened
   * @param {number} clicked - Emails clicked
   * @param {number} conversions - Conversions
   */
  async updateDailyStats(campaignId, sent = 0, opened = 0, clicked = 0, conversions = 0) {
    const today = new Date().toISOString().split('T')[0];

    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(2) : 0;
    const clickRate = sent > 0 ? ((clicked / sent) * 100).toFixed(2) : 0;
    const conversionRate = sent > 0 ? ((conversions / sent) * 100).toFixed(2) : 0;

    const query = `
      INSERT INTO campaign_daily_stats (
        campaign_id, stat_date, emails_sent, emails_opened, emails_clicked,
        conversions, open_rate, click_rate, conversion_rate, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (campaign_id, stat_date) DO UPDATE SET
        emails_sent = campaign_daily_stats.emails_sent + EXCLUDED.emails_sent,
        emails_opened = campaign_daily_stats.emails_opened + EXCLUDED.emails_opened,
        emails_clicked = campaign_daily_stats.emails_clicked + EXCLUDED.emails_clicked,
        conversions = campaign_daily_stats.conversions + EXCLUDED.conversions,
        open_rate = CASE
          WHEN campaign_daily_stats.emails_sent + EXCLUDED.emails_sent > 0
          THEN ((campaign_daily_stats.emails_opened + EXCLUDED.emails_opened)::DECIMAL / (campaign_daily_stats.emails_sent + EXCLUDED.emails_sent) * 100)
          ELSE 0
        END,
        click_rate = CASE
          WHEN campaign_daily_stats.emails_sent + EXCLUDED.emails_sent > 0
          THEN ((campaign_daily_stats.emails_clicked + EXCLUDED.emails_clicked)::DECIMAL / (campaign_daily_stats.emails_sent + EXCLUDED.emails_sent) * 100)
          ELSE 0
        END,
        conversion_rate = CASE
          WHEN campaign_daily_stats.emails_sent + EXCLUDED.emails_sent > 0
          THEN ((campaign_daily_stats.conversions + EXCLUDED.conversions)::DECIMAL / (campaign_daily_stats.emails_sent + EXCLUDED.emails_sent) * 100)
          ELSE 0
        END
    `;

    await pool.query(query, [campaignId, today, sent, opened, clicked, conversions, openRate, clickRate, conversionRate]);
  }

  /**
   * Render email template with variables
   * @param {string} template - Template string
   * @param {Object} variables - Variables to replace
   * @returns {string} Rendered template
   */
  renderTemplate(template, variables) {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }

    return rendered;
  }

  /**
   * Get campaign by ID
   * @param {number} campaignId - Campaign ID
   */
  async getCampaignById(campaignId) {
    const query = `SELECT * FROM marketing_campaigns WHERE id = $1`;
    const { rows } = await pool.query(query, [campaignId]);
    return rows[0];
  }

  /**
   * Get all campaigns
   * @param {Object} filters - Filter options
   */
  async getAllCampaigns(filters = {}) {
    let query = `SELECT * FROM marketing_campaigns WHERE 1=1`;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.campaign_type) {
      params.push(filters.campaign_type);
      query += ` AND campaign_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get campaign performance stats
   * @param {number} campaignId - Campaign ID
   */
  async getCampaignStats(campaignId) {
    const campaign = await this.getCampaignById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Get recipient stats
    const recipientStatsQuery = `
      SELECT
        COUNT(*) as total_recipients,
        COUNT(CASE WHEN status = 'sent' OR status = 'opened' OR status = 'clicked' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'opened' OR status = 'clicked' THEN 1 END) as opened,
        COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM campaign_recipients
      WHERE campaign_id = $1
    `;

    const { rows: [recipientStats] } = await pool.query(recipientStatsQuery, [campaignId]);

    // Get daily stats
    const dailyStatsQuery = `
      SELECT * FROM campaign_daily_stats
      WHERE campaign_id = $1
      ORDER BY stat_date DESC
      LIMIT 30
    `;

    const { rows: dailyStats } = await pool.query(dailyStatsQuery, [campaignId]);

    // Calculate rates
    const delivered = parseInt(recipientStats.delivered) || 0;
    const openRate = delivered > 0 ? ((parseInt(recipientStats.opened) / delivered) * 100).toFixed(2) : 0;
    const clickRate = delivered > 0 ? ((parseInt(recipientStats.clicked) / delivered) * 100).toFixed(2) : 0;

    return {
      campaign,
      totalSent: campaign.total_sent,
      totalOpened: campaign.total_opened,
      totalClicked: campaign.total_clicked,
      totalConverted: campaign.total_converted,
      recipients: recipientStats,
      openRate,
      clickRate,
      dailyStats
    };
  }

  /**
   * Get user by ID (helper method)
   * @param {number} userId - User ID
   */
  async getUserById(userId) {
    const query = `SELECT * FROM users WHERE id = $1`;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }

  /**
   * Delete campaign
   * @param {number} campaignId - Campaign ID
   */
  async deleteCampaign(campaignId) {
    const query = `DELETE FROM marketing_campaigns WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [campaignId]);
    return rows[0];
  }
}

module.exports = new CampaignService();
