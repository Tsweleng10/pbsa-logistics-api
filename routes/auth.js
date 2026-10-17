// routes/auth.js
// Authentication endpoints for PBSA Logistics API

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validate } = require('../middleware/validate');
const schemas = require('../middleware/schemas');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────
// HELPER: Generate a JWT token
// ─────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account
// ─────────────────────────────────────────────
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { full_name, email, password, role, phone, license_number } = req.body;

    // Check if email is already taken
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Hash the password (10 salt rounds)
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user and return only non-sensitive fields
    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, license_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role, phone, license_number, created_at`,
      [full_name, email.toLowerCase(), password_hash, role, phone || null, license_number || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (err) {
    // Handle PostgreSQL unique constraint violation (code 23505)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    next(err); // pass to global error handler (we'll build this in Step 6)
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Returns a JWT if credentials are valid
// ─────────────────────────────────────────────
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      `SELECT id, full_name, email, password_hash, role, phone, license_number, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    // If no user found OR password wrong — same generic message
    // (prevents attackers from knowing which emails exist)
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Strip password_hash before sending the user object
    delete user.password_hash;

    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      user,
      token
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns the logged-in user's profile
// ─────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, role, phone, license_number, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PUT /api/auth/settings
// Update user's phone number or name
// ─────────────────────────────────────────────
router.put('/settings', requireAuth, validate(schemas.updateSettings), async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;

    const result = await db.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone     = COALESCE($2, phone)
       WHERE id = $3
       RETURNING id, full_name, email, role, phone, license_number, updated_at`,
      [full_name || null, phone || null, req.user.id]
    );

    res.status(200).json({
      message: 'Settings updated',
      user: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PUT /api/auth/change-password
// Requires the old password as confirmation
// ─────────────────────────────────────────────
router.put('/change-password', requireAuth, validate(schemas.changePassword), async (req, res, next) => {
  try {
    const { old_password, new_password } = req.body;

    // Fetch current hash
    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Confirm old password matches
    const isMatch = await bcrypt.compare(old_password, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password and save
    const new_hash = await bcrypt.hash(new_password, 10);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      new_hash,
      req.user.id
    ]);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;