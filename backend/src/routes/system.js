const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SystemConfig = require('../models/SystemConfig');

/**
 * GET /api/v1/system/status
 * Get simulation status (public endpoint)
 */
router.get('/status', async (req, res) => {
  try {
    const [simulationStatus, participantCount, maxParticipants] = await Promise.all([
      SystemConfig.get('simulation_status'),
      User.countStudents(),
      SystemConfig.get('max_participants')
    ]);

    res.json({
      success: true,
      data: {
        simulationStatus: simulationStatus || 'active',
        isActive: simulationStatus === 'active',
        participantCount,
        maxParticipants,
        spotsRemaining: Math.max(0, maxParticipants - participantCount)
      }
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({
      error: 'Failed to get system status',
      code: 'DATABASE_ERROR'
    });
  }
});

/**
 * GET /api/v1/system/config
 * Get all system configuration (public endpoint for feature toggles)
 */
router.get('/config', async (req, res) => {
  try {
    const config = await SystemConfig.getAll();

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('System config error:', error);
    res.status(500).json({
      error: 'Failed to get system configuration',
      code: 'DATABASE_ERROR'
    });
  }
});

module.exports = router;
