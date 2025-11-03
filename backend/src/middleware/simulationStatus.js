const { db } = require('../config/database');

// Check if system is active
const checkSimulationActive = async (req, res, next) => {
  try {
    const simulationStatus = await db('system_config')
      .where({ config_key: 'simulation_status' })
      .select('config_value')
      .first();

    if (!simulationStatus || simulationStatus.config_value !== 'active') {
      return res.status(503).json({
        error: 'System temporarily paused',
        code: 'SYSTEM_PAUSED'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking system status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'DATABASE_ERROR'
    });
  }
};

module.exports = { checkSimulationActive };
