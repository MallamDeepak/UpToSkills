// scripts/run_migrations.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

(async () => {
  const migrationPath = path.join(__dirname, '..', 'migrations', 'add_is_active_to_students.sql');
  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Applying migration: add_is_active_to_students.sql');
    await pool.query(sql);
    console.log('✅ Migration applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();