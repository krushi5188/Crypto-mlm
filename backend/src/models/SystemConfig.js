const { db } = require('../config/database');

class SystemConfig {
  // Get config value by key
  static async get(key) {
    const row = await db('system_config').select('config_value', 'data_type').where({ config_key: key }).first();

    if (!row) {
      return null;
    }

    const { config_value, data_type } = row;

    // Cast to appropriate type
    switch (data_type) {
      case 'integer':
        return parseInt(config_value);
      case 'float':
        return parseFloat(config_value);
      case 'boolean':
        return config_value === 'true' || config_value === '1';
      case 'json':
        return JSON.parse(config_value);
      default:
        return config_value;
    }
  }

  // Set config value
  static async set(key, value, updatedBy = 'system') {
    const result = await db('system_config')
      .insert({
        config_key: key,
        config_value: String(value),
        data_type: 'string',
        updated_by: updatedBy,
        updated_at: db.fn.now()
      })
      .onConflict('config_key')
      .merge();
    return result.rowCount > 0;
  }

  // Get multiple config values
  static async getMultiple(keys) {
    const rows = await db('system_config').whereIn('config_key', keys);

    const config = {};
    rows.forEach(row => {
      const { config_key, config_value, data_type } = row;

      switch (data_type) {
        case 'integer':
          config[config_key] = parseInt(config_value);
          break;
        case 'float':
          config[config_key] = parseFloat(config_value);
          break;
        case 'boolean':
          config[config_key] = config_value === 'true' || config_value === '1';
          break;
        case 'json':
          config[config_key] = JSON.parse(config_value);
          break;
        default:
          config[config_key] = config_value;
      }
    });

    return config;
  }

  // Get all config
  static async getAll() {
    const rows = await db('system_config');

    const config = {};
    rows.forEach(row => {
      const { config_key, config_value, data_type } = row;

      switch (data_type) {
        case 'integer':
          config[config_key] = parseInt(config_value);
          break;
        case 'float':
          config[config_key] = parseFloat(config_value);
          break;
        case 'boolean':
          config[config_key] = config_value === 'true' || config_value === '1';
          break;
        case 'json':
          config[config_key] = JSON.parse(config_value);
          break;
        default:
          config[config_key] = config_value;
      }
    });

    return config;
  }

  // Increment total coins distributed
  static async incrementCoinsDistributed(amount) {
    return db('system_config')
      .where({ config_key: 'total_coins_distributed' })
      .increment('config_value', amount);
  }

  // Increment total recruitment fees
  static async incrementRecruitmentFees(amount) {
    return db('system_config')
      .where({ config_key: 'total_recruitment_fees' })
      .increment('config_value', amount);
  }
}

module.exports = SystemConfig;
