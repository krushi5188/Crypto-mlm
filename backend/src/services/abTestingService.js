const pool = require('../config/database');

/**
 * A/B Testing Service
 * Handles experiment creation, variant assignment, event tracking, and results analysis
 */
class ABTestingService {
  /**
   * Create a new A/B test experiment
   * @param {Object} experimentData - Experiment configuration
   */
  async createExperiment(experimentData) {
    const {
      name,
      description,
      experiment_type,
      variant_a,
      variant_b,
      variant_c,
      traffic_a = 50,
      traffic_b = 50,
      traffic_c = 0,
      target_role = 'all',
      target_conditions,
      start_date,
      end_date,
      primary_metric,
      secondary_metrics,
      created_by
    } = experimentData;

    // Validate traffic allocation sums to 100
    const totalTraffic = traffic_a + traffic_b + traffic_c;
    if (totalTraffic !== 100) {
      throw new Error(`Traffic allocation must sum to 100, got ${totalTraffic}`);
    }

    const query = `
      INSERT INTO ab_experiments (
        name, description, experiment_type, variant_a, variant_b, variant_c,
        traffic_a, traffic_b, traffic_c, target_role, target_conditions,
        start_date, end_date, primary_metric, secondary_metrics,
        status, created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        'draft', $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      name,
      description,
      experiment_type,
      JSON.stringify(variant_a),
      JSON.stringify(variant_b),
      variant_c ? JSON.stringify(variant_c) : null,
      traffic_a,
      traffic_b,
      traffic_c,
      target_role,
      target_conditions ? JSON.stringify(target_conditions) : null,
      start_date,
      end_date,
      primary_metric,
      secondary_metrics ? JSON.stringify(secondary_metrics) : null,
      created_by
    ]);

    return rows[0];
  }

  /**
   * Update experiment status
   * @param {number} experimentId - Experiment ID
   * @param {string} status - New status (draft, running, paused, completed)
   */
  async updateExperimentStatus(experimentId, status) {
    const validStatuses = ['draft', 'running', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const query = `
      UPDATE ab_experiments
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [status, experimentId]);

    if (rows.length === 0) {
      throw new Error('Experiment not found');
    }

    return rows[0];
  }

  /**
   * Assign a user to a variant in an experiment
   * @param {number} experimentId - Experiment ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Assignment with variant
   */
  async assignVariant(experimentId, userId) {
    // Check if already assigned
    const existingQuery = `
      SELECT * FROM ab_assignments
      WHERE experiment_id = $1 AND user_id = $2
    `;
    const { rows: existing } = await pool.query(existingQuery, [experimentId, userId]);

    if (existing.length > 0) {
      return existing[0];
    }

    // Get experiment details
    const experiment = await this.getExperimentById(experimentId);

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    if (experiment.status !== 'running') {
      throw new Error('Experiment is not running');
    }

    // Determine variant based on traffic allocation
    const variant = this.selectVariant(experiment.traffic_a, experiment.traffic_b, experiment.traffic_c);

    // Create assignment
    const insertQuery = `
      INSERT INTO ab_assignments (
        experiment_id, user_id, variant, assigned_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await pool.query(insertQuery, [experimentId, userId, variant]);
    return rows[0];
  }

  /**
   * Select variant based on traffic allocation
   * @param {number} trafficA - Traffic allocation for variant A
   * @param {number} trafficB - Traffic allocation for variant B
   * @param {number} trafficC - Traffic allocation for variant C
   * @returns {string} Selected variant ('a', 'b', or 'c')
   */
  selectVariant(trafficA, trafficB, trafficC) {
    const random = Math.random() * 100;

    if (random < trafficA) {
      return 'a';
    } else if (random < trafficA + trafficB) {
      return 'b';
    } else {
      return 'c';
    }
  }

  /**
   * Get user's assigned variant for an experiment
   * @param {number} experimentId - Experiment ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Assignment or null
   */
  async getUserVariant(experimentId, userId) {
    const query = `
      SELECT * FROM ab_assignments
      WHERE experiment_id = $1 AND user_id = $2
    `;
    const { rows } = await pool.query(query, [experimentId, userId]);

    if (rows.length === 0) {
      // Auto-assign if experiment is running
      const experiment = await this.getExperimentById(experimentId);
      if (experiment && experiment.status === 'running') {
        return await this.assignVariant(experimentId, userId);
      }
      return null;
    }

    return rows[0];
  }

  /**
   * Track an event for an experiment
   * @param {number} experimentId - Experiment ID
   * @param {number} userId - User ID
   * @param {string} eventType - Event type (e.g., 'conversion', 'click', 'signup')
   * @param {number} eventValue - Optional numeric value
   * @param {Object} metadata - Additional event metadata
   */
  async trackEvent(experimentId, userId, eventType, eventValue = null, metadata = null) {
    // Get user's variant
    const assignment = await this.getUserVariant(experimentId, userId);

    if (!assignment) {
      console.warn(`User ${userId} not assigned to experiment ${experimentId}`);
      return null;
    }

    // Record event
    const query = `
      INSERT INTO ab_events (
        experiment_id, user_id, variant, event_type,
        event_value, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      experimentId,
      userId,
      assignment.variant,
      eventType,
      eventValue,
      metadata ? JSON.stringify(metadata) : null
    ]);

    return rows[0];
  }

  /**
   * Get experiment results with statistical analysis
   * @param {number} experimentId - Experiment ID
   * @returns {Promise<Object>} Experiment results
   */
  async getExperimentResults(experimentId) {
    const experiment = await this.getExperimentById(experimentId);

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Get assignment counts per variant
    const assignmentsQuery = `
      SELECT
        variant,
        COUNT(*) as user_count
      FROM ab_assignments
      WHERE experiment_id = $1
      GROUP BY variant
    `;
    const { rows: assignments } = await pool.query(assignmentsQuery, [experimentId]);

    // Get event counts per variant
    const eventsQuery = `
      SELECT
        variant,
        event_type,
        COUNT(*) as event_count,
        AVG(event_value) as avg_value,
        SUM(event_value) as total_value
      FROM ab_events
      WHERE experiment_id = $1
      GROUP BY variant, event_type
    `;
    const { rows: events } = await pool.query(eventsQuery, [experimentId]);

    // Get primary metric events per variant
    const primaryMetricQuery = `
      SELECT
        variant,
        COUNT(DISTINCT user_id) as converted_users,
        COUNT(*) as total_events,
        AVG(event_value) as avg_value
      FROM ab_events
      WHERE experiment_id = $1 AND event_type = $2
      GROUP BY variant
    `;
    const { rows: primaryMetric } = await pool.query(primaryMetricQuery, [
      experimentId,
      experiment.primary_metric
    ]);

    // Build results object
    const results = {
      experiment,
      variants: {},
      summary: {
        total_users: 0,
        total_events: 0
      }
    };

    // Initialize variant results
    const variantNames = ['a', 'b'];
    if (experiment.traffic_c > 0) {
      variantNames.push('c');
    }

    for (const variant of variantNames) {
      const assignmentData = assignments.find(a => a.variant === variant) || { user_count: 0 };
      const metricData = primaryMetric.find(m => m.variant === variant) || {
        converted_users: 0,
        total_events: 0,
        avg_value: 0
      };

      const userCount = parseInt(assignmentData.user_count) || 0;
      const convertedUsers = parseInt(metricData.converted_users) || 0;
      const conversionRate = userCount > 0 ? (convertedUsers / userCount) * 100 : 0;

      results.variants[variant] = {
        name: `Variant ${variant.toUpperCase()}`,
        config: experiment[`variant_${variant}`],
        users: userCount,
        conversions: convertedUsers,
        conversionRate: conversionRate.toFixed(2),
        avgValue: parseFloat(metricData.avg_value || 0).toFixed(2),
        events: events.filter(e => e.variant === variant)
      };

      results.summary.total_users += userCount;
    }

    // Calculate statistical significance (simplified chi-square test)
    if (results.variants.a && results.variants.b) {
      const variantA = results.variants.a;
      const variantB = results.variants.b;

      const significance = this.calculateSignificance(
        variantA.conversions,
        variantA.users,
        variantB.conversions,
        variantB.users
      );

      results.statisticalSignificance = significance.pValue.toFixed(4);
      results.isSignificant = significance.isSignificant;
      results.confidenceLevel = significance.confidenceLevel;

      // Determine winner
      if (significance.isSignificant) {
        const rateA = parseFloat(variantA.conversionRate);
        const rateB = parseFloat(variantB.conversionRate);

        if (results.variants.c) {
          const rateC = parseFloat(results.variants.c.conversionRate);
          const maxRate = Math.max(rateA, rateB, rateC);

          if (maxRate === rateA) results.winner = 'a';
          else if (maxRate === rateB) results.winner = 'b';
          else results.winner = 'c';
        } else {
          results.winner = rateA > rateB ? 'a' : 'b';
        }
      } else {
        results.winner = 'inconclusive';
      }
    }

    // Get daily event trends
    const trendsQuery = `
      SELECT
        DATE(created_at) as date,
        variant,
        event_type,
        COUNT(*) as count
      FROM ab_events
      WHERE experiment_id = $1
      GROUP BY DATE(created_at), variant, event_type
      ORDER BY date ASC
    `;
    const { rows: trends } = await pool.query(trendsQuery, [experimentId]);
    results.trends = trends;

    return results;
  }

  /**
   * Calculate statistical significance using chi-square test
   * @param {number} conversionsA - Conversions in variant A
   * @param {number} usersA - Total users in variant A
   * @param {number} conversionsB - Conversions in variant B
   * @param {number} usersB - Total users in variant B
   * @returns {Object} Significance test results
   */
  calculateSignificance(conversionsA, usersA, conversionsB, usersB) {
    // Avoid division by zero
    if (usersA === 0 || usersB === 0) {
      return {
        pValue: 1,
        isSignificant: false,
        confidenceLevel: 0
      };
    }

    // Calculate observed values
    const nonConversionsA = usersA - conversionsA;
    const nonConversionsB = usersB - conversionsB;

    // Calculate expected values
    const totalConversions = conversionsA + conversionsB;
    const totalNonConversions = nonConversionsA + nonConversionsB;
    const totalUsers = usersA + usersB;

    const expectedConversionsA = (usersA * totalConversions) / totalUsers;
    const expectedNonConversionsA = (usersA * totalNonConversions) / totalUsers;
    const expectedConversionsB = (usersB * totalConversions) / totalUsers;
    const expectedNonConversionsB = (usersB * totalNonConversions) / totalUsers;

    // Calculate chi-square statistic
    const chiSquare = (
      Math.pow(conversionsA - expectedConversionsA, 2) / expectedConversionsA +
      Math.pow(nonConversionsA - expectedNonConversionsA, 2) / expectedNonConversionsA +
      Math.pow(conversionsB - expectedConversionsB, 2) / expectedConversionsB +
      Math.pow(nonConversionsB - expectedNonConversionsB, 2) / expectedNonConversionsB
    );

    // Calculate p-value (simplified approximation)
    // For df=1, critical values: 3.84 (95%), 6.63 (99%), 10.83 (99.9%)
    let pValue, confidenceLevel, isSignificant;

    if (chiSquare >= 10.83) {
      pValue = 0.001;
      confidenceLevel = 99.9;
      isSignificant = true;
    } else if (chiSquare >= 6.63) {
      pValue = 0.01;
      confidenceLevel = 99;
      isSignificant = true;
    } else if (chiSquare >= 3.84) {
      pValue = 0.05;
      confidenceLevel = 95;
      isSignificant = true;
    } else {
      pValue = 0.1;
      confidenceLevel = 0;
      isSignificant = false;
    }

    return {
      pValue,
      isSignificant,
      confidenceLevel,
      chiSquare: chiSquare.toFixed(2)
    };
  }

  /**
   * Get experiment by ID
   * @param {number} experimentId - Experiment ID
   */
  async getExperimentById(experimentId) {
    const query = `SELECT * FROM ab_experiments WHERE id = $1`;
    const { rows } = await pool.query(query, [experimentId]);

    if (rows.length === 0) {
      return null;
    }

    const experiment = rows[0];

    // Parse JSON fields
    if (experiment.variant_a) experiment.variant_a = JSON.parse(experiment.variant_a);
    if (experiment.variant_b) experiment.variant_b = JSON.parse(experiment.variant_b);
    if (experiment.variant_c) experiment.variant_c = JSON.parse(experiment.variant_c);
    if (experiment.target_conditions) experiment.target_conditions = JSON.parse(experiment.target_conditions);
    if (experiment.secondary_metrics) experiment.secondary_metrics = JSON.parse(experiment.secondary_metrics);

    return experiment;
  }

  /**
   * Get all experiments
   * @param {Object} filters - Filter options
   */
  async getAllExperiments(filters = {}) {
    let query = `SELECT * FROM ab_experiments WHERE 1=1`;
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.experiment_type) {
      params.push(filters.experiment_type);
      query += ` AND experiment_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      params.push(filters.limit);
      query += ` LIMIT $${params.length}`;
    }

    const { rows } = await pool.query(query, params);

    // Parse JSON fields
    return rows.map(experiment => {
      if (experiment.variant_a) experiment.variant_a = JSON.parse(experiment.variant_a);
      if (experiment.variant_b) experiment.variant_b = JSON.parse(experiment.variant_b);
      if (experiment.variant_c) experiment.variant_c = JSON.parse(experiment.variant_c);
      if (experiment.target_conditions) experiment.target_conditions = JSON.parse(experiment.target_conditions);
      if (experiment.secondary_metrics) experiment.secondary_metrics = JSON.parse(experiment.secondary_metrics);
      return experiment;
    });
  }

  /**
   * Update experiment
   * @param {number} experimentId - Experiment ID
   * @param {Object} updateData - Fields to update
   */
  async updateExperiment(experimentId, updateData) {
    const allowedFields = [
      'name', 'description', 'end_date', 'traffic_a', 'traffic_b', 'traffic_c'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(experimentId);

    const query = `
      UPDATE ab_experiments
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      throw new Error('Experiment not found');
    }

    return rows[0];
  }

  /**
   * Delete experiment
   * @param {number} experimentId - Experiment ID
   */
  async deleteExperiment(experimentId) {
    const query = `DELETE FROM ab_experiments WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [experimentId]);

    if (rows.length === 0) {
      throw new Error('Experiment not found');
    }

    return rows[0];
  }

  /**
   * Set experiment winner and complete
   * @param {number} experimentId - Experiment ID
   * @param {string} winnerVariant - Winning variant ('a', 'b', 'c', or 'inconclusive')
   */
  async setExperimentWinner(experimentId, winnerVariant) {
    const validWinners = ['a', 'b', 'c', 'inconclusive'];
    if (!validWinners.includes(winnerVariant)) {
      throw new Error(`Invalid winner variant: ${winnerVariant}`);
    }

    // Get current results to calculate significance
    const results = await this.getExperimentResults(experimentId);

    const query = `
      UPDATE ab_experiments
      SET winner_variant = $1,
          statistical_significance = $2,
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      winnerVariant,
      results.statisticalSignificance || null,
      experimentId
    ]);

    if (rows.length === 0) {
      throw new Error('Experiment not found');
    }

    return rows[0];
  }

  /**
   * Get experiment summary statistics
   * @returns {Promise<Object>} Summary stats
   */
  async getExperimentsSummary() {
    const query = `
      SELECT
        status,
        COUNT(*) as count
      FROM ab_experiments
      GROUP BY status
    `;

    const { rows } = await pool.query(query);

    const summary = {
      draft: 0,
      running: 0,
      paused: 0,
      completed: 0,
      total: 0
    };

    rows.forEach(row => {
      summary[row.status] = parseInt(row.count);
      summary.total += parseInt(row.count);
    });

    return summary;
  }
}

module.exports = new ABTestingService();
