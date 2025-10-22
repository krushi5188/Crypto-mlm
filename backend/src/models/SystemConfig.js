const { pool } = require('../config/database');

class SystemConfig {
  // Get config value by key
  static async get(key) {
    const [rows] = await pool.query(
      'SELECT config_value, data_type FROM system_config WHERE config_key = ?',
      [key]
    );

    if (rows.length === 0) return null;

    const { config_value, data_type } = rows[0];

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
    const [result] = await pool.query(
      `UPDATE system_config
       SET config_value = ?, updated_by = ?, updated_at = NOW()
       WHERE config_key = ?`,
      [String(value), updatedBy, key]
    );

    return result.affectedRows > 0;
  }

  // Get multiple config values
  static async getMultiple(keys) {
    const [rows] = await pool.query(
      'SELECT config_key, config_value, data_type FROM system_config WHERE config_key IN (?)',
      [keys]
    );

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
    const [rows] = await pool.query('SELECT config_key, config_value, data_type FROM system_config');

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
    await pool.query(
      `UPDATE system_config
       SET config_value = CAST(config_value AS DECIMAL(10,2)) + ?
       WHERE config_key = 'total_coins_distributed'`,
      [amount]
    );
  }

  // Increment total recruitment fees
  static async incrementRecruitmentFees(amount) {
    await pool.query(
      `UPDATE system_config
       SET config_value = CAST(config_value AS DECIMAL(10,2)) + ?
       WHERE config_key = 'total_recruitment_fees'`,
      [amount]
    );
  }
}

module.exports = SystemConfig;
