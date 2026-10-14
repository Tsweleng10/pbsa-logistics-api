// init-db.js
// Applies schema.sql to the Neon database
// Run once with: node init-db.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function init() {
  console.log('🚀 Starting init-db...');

  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log('📄 Reading schema from:', schemaPath);

  if (!fs.existsSync(schemaPath)) {
    console.error('❌ schema.sql not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('📦 Schema file size:', sql.length, 'characters');

  console.log('🚀 Applying schema.sql to database...');
  try {
    await pool.query(sql);
    console.log('✅ Schema applied successfully');
  } catch (err) {
    console.error('❌ Failed to apply schema:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();