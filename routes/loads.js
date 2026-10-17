// routes/loads.js
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../middleware/schemas');

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/loads
// List all loads (Dispatchers only)
// ─────────────────────────────────────────────
router.get('/', requireAuth, requireRole('DISPATCHER', 'ADMIN'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*, u.full_name as driver_name, v.registration as vehicle_reg
       FROM loads l
       LEFT JOIN users u ON l.driver_id = u.id
       LEFT JOIN vehicles v ON l.vehicle_id = v.id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /api/loads/my
// List loads assigned to the logged-in driver
// ─────────────────────────────────────────────
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*, v.registration as vehicle_reg
       FROM loads l
       LEFT JOIN vehicles v ON l.vehicle_id = v.id
       WHERE l.driver_id = $1
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /api/loads/:id
// Get specific load details
// ─────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT l.*, u.full_name as driver_name, v.registration as vehicle_reg
       FROM loads l
       LEFT JOIN users u ON l.driver_id = u.id
       LEFT JOIN vehicles v ON l.vehicle_id = v.id
       WHERE l.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Load not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /api/loads
// Create a new load (Dispatchers only)
// ─────────────────────────────────────────────
router.post('/', requireAuth, requireRole('DISPATCHER', 'ADMIN'), validate(schemas.createLoad), async (req, res, next) => {
  try {
    const { reference, driver_id, vehicle_id, origin, destination, cargo_description, weight_kg, eta } = req.body;

    const result = await db.query(
      `INSERT INTO loads (reference, driver_id, vehicle_id, origin, destination, cargo_description, weight_kg, eta, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
       RETURNING *`,
      [reference, driver_id || null, vehicle_id || null, origin, destination, cargo_description || null, weight_kg || null, eta || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Load reference already exists' });
    next(err);
  }
});

// ─────────────────────────────────────────────
// PUT /api/loads/:id/status
// Update load status (Driver or Dispatcher)
// ─────────────────────────────────────────────
router.put('/:id/status', requireAuth, validate(schemas.updateLoadStatus), async (req, res, next) => {
  try {
    const { status } = req.body;
    const loadId = req.params.id;

    // If driver, ensure they own this load
    if (req.user.role === 'DRIVER') {
      const check = await db.query('SELECT driver_id FROM loads WHERE id = $1', [loadId]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Load not found' });
      if (check.rows[0].driver_id !== req.user.id) {
        return res.status(403).json({ error: 'You are not assigned to this load' });
      }
    }

    const delivered_at = status === 'DELIVERED' ? new Date() : null;

    const result = await db.query(
      `UPDATE loads
       SET status = $1, delivered_at = COALESCE($2, delivered_at), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, delivered_at, loadId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;