const { db } = require('../config/database');

class TeamResource {
  // Create new resource
  static async create(resourceData) {
    const [result] = await db('training_resources').insert(resourceData).returning('*');
    return result;
  }

  // Get all resources with filters
  static async getAll(filters = {}) {
    const { type, category, search, featured, page = 1, limit = 20 } = filters;

    const query = db('training_resources as r')
      .select('r.*', 'u.username as creator_name')
      .leftJoin('users as u', 'r.created_by', 'u.id');

    if (type) {
      query.where('r.resource_type', type);
    }
    if (category) {
      query.where('r.category', category);
    }
    if (featured !== undefined) {
      query.where('r.is_featured', featured);
    }
    if (search) {
      query.where(function () {
        this.where('r.title', 'ilike', `%${search}%`).orWhere('r.description', 'ilike', `%${search}%`);
      });
    }

    const total = await query.clone().count({ count: '*' }).first();
    const resources = await query.orderBy(['is_featured', 'created_at'], ['desc', 'desc']).limit(limit).offset((page - 1) * limit);

    return {
      resources,
      total: parseInt(total.count)
    };
  }

  // Get resource by ID
  static async getById(resourceId) {
    return db('training_resources as r')
      .select('r.*', 'u.username as creator_name')
      .leftJoin('users as u', 'r.created_by', 'u.id')
      .where('r.id', resourceId)
      .first();
  }

  // Update resource
  static async update(resourceId, updates) {
    const allowedFields = ['title', 'description', 'file_url', 'content', 'thumbnail_url', 'category', 'tags', 'is_featured'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const [result] = await db('training_resources')
      .where({ id: resourceId })
      .update({ ...filteredUpdates, updated_at: db.fn.now() })
      .returning('*');
    return result;
  }

  // Delete resource
  static async delete(resourceId) {
    const [result] = await db('training_resources').where({ id: resourceId }).del().returning('*');
    return result;
  }

  // Log resource access
  static async logAccess(resourceId, userId, accessType = 'view') {
    await db('resource_access_log').insert({
      resource_id: resourceId,
      user_id: userId,
      access_type: accessType
    });

    const counterField = accessType === 'download' ? 'download_count' : 'view_count';
    return db('training_resources').where({ id: resourceId }).increment(counterField, 1);
  }

  // Get resource statistics
  static async getStats(resourceId) {
    const total_views = await db('resource_access_log').where({ resource_id: resourceId, access_type: 'view' }).count({ count: '*' }).first();
    const total_downloads = await db('resource_access_log').where({ resource_id: resourceId, access_type: 'download' }).count({ count: '*' }).first();
    const unique_users = await db('resource_access_log').where({ resource_id: resourceId }).nunique('user_id as count').first();

    return {
      total_views: total_views.count,
      total_downloads: total_downloads.count,
      unique_users: unique_users.count
    };
  }

  // Get popular resources
  static async getPopular(limit = 10) {
    return db('training_resources as r')
      .select('r.*', 'u.username as creator_name')
      .leftJoin('users as u', 'r.created_by', 'u.id')
      .orderByRaw('(r.view_count + r.download_count * 2) DESC')
      .limit(limit);
  }

  // Get user's recent resources
  static async getUserRecent(userId, limit = 10) {
    return db('training_resources as r')
      .distinct('r.*', 'u.username as creator_name', 'ral.accessed_at')
      .leftJoin('users as u', 'r.created_by', 'u.id')
      .join('resource_access_log as ral', 'r.id', 'ral.resource_id')
      .where('ral.user_id', userId)
      .orderBy('ral.accessed_at', 'desc')
      .limit(limit);
  }

  // Get categories with counts
  static async getCategories() {
    return db('training_resources')
      .select('category')
      .count('* as count')
      .whereNotNull('category')
      .groupBy('category')
      .orderBy('count', 'desc');
  }
}

module.exports = TeamResource;
