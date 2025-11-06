const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireInstructor } = require('../middleware/roleAuth');

// Middleware for admin-only access
router.use(authenticate, requireInstructor);

// GET /api/v1/promotions - Get all promotions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

// POST /api/v1/promotions - Create a new promotion
router.post('/', async (req, res) => {
  try {
    const { name, description, type, rules, reward_amount, is_active, start_date, end_date } = req.body;
    const result = await pool.query(
      'INSERT INTO promotions (name, description, type, rules, reward_amount, is_active, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, description, type, rules, reward_amount, is_active, start_date, end_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

// PUT /api/v1/promotions/:id - Update a promotion
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, rules, reward_amount, is_active, start_date, end_date } = req.body;
    const result = await pool.query(
      'UPDATE promotions SET name = $1, description = $2, type = $3, rules = $4, reward_amount = $5, is_active = $6, start_date = $7, end_date = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
      [name, description, type, rules, reward_amount, is_active, start_date, end_date, id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

// DELETE /api/v1/promotions/:id - Delete a promotion
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM promotions WHERE id = $1', [id]);
    res.json({ success: true, message: 'Promotion deleted' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

module.exports = router;
