const { pool } = require('../config/database');

// Check if simulation is active
const checkSimulationActive = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT config_value FROM system_config WHERE config_key = 'simulation_status'"
    );

    if (rows.length === 0 || rows[0].config_value !== 'active') {
      return res.status(503).json({
        error: 'Simulation paused by instructor',
        code: 'SIMULATION_PAUSED'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking simulation status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'DATABASE_ERROR'
    });
  }
};

module.exports = { checkSimulationActive };
