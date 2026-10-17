// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Core middleware
app.use(cors());
app.use(express.json());

// ── Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PBSA Logistics API is running' });
});

// ── Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/loads', require('./routes/loads'));
app.use('/api/eld', require('./routes/eld'));
app.use('/api/alerts', require('./routes/alerts'));

// ── 404 handler (unknown route)
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global error handler (prevents app crashes)
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ── Start server (skip if imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;