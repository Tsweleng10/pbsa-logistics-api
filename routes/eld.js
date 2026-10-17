// routes/eld.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const schemas = require('../middleware/schemas');

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/eld/clock-in
// Start a duty period (Drivers only)
// ─────────────────────────────────────────────
router.post('/clock-in', requireAuth, validate(schemas.clockIn), async (req, res, next) => {
  try {
    // Check if there's already an open log (end_time is null)
    const openLog = await db.query(
      'SELECT id FROM eld_logs WHERE driver_id = $1 AND end_time IS NULL',
      [req.user.id]
    );

    if (openLog.rows.length > 0) {
      return res.status(400).json({ error: 'You are already clocked in. Clock out first.' });
    }

    const { load_id, duty_status, location } = req.body;

    const result = await db.query(
      `INSERT INTO eld_logs (driver_id, load_id, duty_status, location, start_time)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, load_id || null, duty_status, location || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /api/eld/clock-out
// End the current duty period
// ─────────────────────────────────────────────
router.post('/clock-out', requireAuth, validate(schemas.clockOut), async (req, res, next) => {
  try {
    const { notes } = req.body;

    const result = await db.query(
      `UPDATE eld_logs
       SET end_time = CURRENT_TIMESTAMP, notes = $1
       WHERE driver_id = $2 AND end_time IS NULL
       RETURNING *`,
      [notes || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'You are not currently clocked in.' });
    }

    res.json({ message: 'Clocked out successfully', log: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /api/eld/my
// Get logged-in driver's history
// ─────────────────────────────────────────────
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT e.*, l.reference as load_reference
       FROM eld_logs e
       LEFT JOIN loads l ON e.load_id = l.id
       WHERE e.driver_id = $1
       ORDER BY e.start_time DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;