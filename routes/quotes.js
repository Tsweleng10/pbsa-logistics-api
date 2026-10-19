// routes/quotes.js
const express = require('express');
const db = require('../db');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const router = express.Router();

// Joi schema specifically for website quotes
const quoteSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  company_name: Joi.string().max(100).optional().allow('', null),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,20}$/).required(),
  origin: Joi.string().max(150).required(),
  destination: Joi.string().max(150).required(),
  goods_description: Joi.string().max(1000).optional().allow('', null),
  weight_kg: Joi.number().positive().optional().allow(null, ''),
  preferred_date: Joi.date().iso().optional().allow(null, '')
});

// POST /api/quotes - Receive quote from website
router.post('/', validate(quoteSchema), async (req, res, next) => {
  try {
    const { 
      full_name, company_name, email, phone, 
      origin, destination, goods_description, weight_kg, preferred_date 
    } = req.body;

    const result = await db.query(
      `INSERT INTO quotes (full_name, company_name, email, phone, origin, destination, goods_description, weight_kg, preferred_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [full_name, company_name || null, email, phone, origin, destination, goods_description || null, weight_kg || null, preferred_date || null]
    );

    res.status(201).json({ 
      message: 'Quote request submitted successfully', 
      quote: result.rows[0] 
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotes - For admin/dispatcher to view quote requests
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM quotes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;