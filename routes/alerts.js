// routes/alerts.js
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../middleware/schemas');

const router = express.Router();

// ─────────────────────────────────────────────
// GET /api/alerts
// Get logged-in user's alerts
// ─────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM alerts
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PUT /api/alerts/:id/read
// Mark an alert as read
// ─────────────────────────────────────────────
router.put('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE alerts SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Alert not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /api/alerts
// Send an alert (Dispatchers only)
// ─────────────────────────────────────────────
router.post('/', requireAuth, requireRole('DISPATCHER', 'ADMIN'), validate(schemas.createAlert), async (req, res, next) => {
  try {
    const { user_id, title, message, severity } = req.body;

    const result = await db.query(
      `INSERT INTO alerts (user_id, title, message, severity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, message || null, severity]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;