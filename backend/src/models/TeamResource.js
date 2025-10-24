const { pool } = require('../config/database');

class TeamResource {
  // Create new resource
  static async create(resourceData) {
    const {
      title,
      description,
      resource_type,
      file_url,
      content,
      thumbnail_url,
      category,
      tags,
      is_featured = false,
      created_by
    } = resourceData;

    const result = await pool.query(
      `INSERT INTO training_resources
       (title, description, resource_type, file_url, content, thumbnail_url, category, tags, is_featured, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, description, resource_type, file_url, content, thumbnail_url, category, tags, is_featured, created_by]
    );

    return result.rows[0];
  }

  // Get all resources with filters
  static async getAll(filters = {}) {
    const { type, category, search, featured, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let params = [];
    let paramCount = 1;

    if (type) {
      whereConditions.push(`resource_type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }

    if (category) {
      whereConditions.push(`category = $${paramCount}`);
      params.push(category);
      paramCount++;
    }

    if (featured !== undefined) {
      whereConditions.push(`is_featured = $${paramCount}`);
      params.push(featured);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT r.*, u.username as creator_name
       FROM training_resources r
       LEFT JOIN users u ON r.created_by = u.id
       ${whereClause}
       ORDER BY is_featured DESC, created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM training_resources ${whereClause}`,
      params.slice(0, paramCount - 1)
    );

    return {
      resources: result.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  // Get resource by ID
  static async getById(resourceId) {
    const result = await pool.query(
      `SELECT r.*, u.username as creator_name
       FROM training_resources r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [resourceId]
    );

    return result.rows[0];
  }

  // Update resource
  static async update(resourceId, updates) {
    const allowedFields = ['title', 'description', 'file_url', 'content', 'thumbnail_url', 'category', 'tags', 'is_featured'];
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

    params.push(resourceId);

    const result = await pool.query(
      `UPDATE training_resources
       SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    return result.rows[0];
  }

  // Delete resource
  static async delete(resourceId) {
    const result = await pool.query(
      'DELETE FROM training_resources WHERE id = $1 RETURNING *',
      [resourceId]
    );

    return result.rows[0];
  }

  // Log resource access
  static async logAccess(resourceId, userId, accessType = 'view') {
    await pool.query(
      `INSERT INTO resource_access_log (resource_id, user_id, access_type)
       VALUES ($1, $2, $3)`,
      [resourceId, userId, accessType]
    );

    // Increment counter
    const counterField = accessType === 'download' ? 'download_count' : 'view_count';
    await pool.query(
      `UPDATE training_resources
       SET ${counterField} = ${counterField} + 1
       WHERE id = $1`,
      [resourceId]
    );
  }

  // Get resource statistics
  static async getStats(resourceId) {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM resource_access_log WHERE resource_id = $1 AND access_type = 'view') as total_views,
        (SELECT COUNT(*) FROM resource_access_log WHERE resource_id = $1 AND access_type = 'download') as total_downloads,
        (SELECT COUNT(DISTINCT user_id) FROM resource_access_log WHERE resource_id = $1) as unique_users
       FROM training_resources WHERE id = $1`,
      [resourceId]
    );

    return result.rows[0];
  }

  // Get popular resources
  static async getPopular(limit = 10) {
    const result = await pool.query(
      `SELECT r.*, u.username as creator_name
       FROM training_resources r
       LEFT JOIN users u ON r.created_by = u.id
       ORDER BY (r.view_count + r.download_count * 2) DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  // Get user's recent resources
  static async getUserRecent(userId, limit = 10) {
    const result = await pool.query(
      `SELECT DISTINCT r.*, u.username as creator_name, ral.accessed_at
       FROM training_resources r
       LEFT JOIN users u ON r.created_by = u.id
       JOIN resource_access_log ral ON r.id = ral.resource_id
       WHERE ral.user_id = $1
       ORDER BY ral.accessed_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }

  // Get categories with counts
  static async getCategories() {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM training_resources
       WHERE category IS NOT NULL
       GROUP BY category
       ORDER BY count DESC`
    );

    return result.rows;
  }
}

module.exports = TeamResource;
