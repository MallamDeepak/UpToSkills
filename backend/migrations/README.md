# Database Migrations

## How to Apply the Deactivate Student Feature

To enable the deactivate student feature, you need to add the `is_active` column to the `students` table.

### Option 1: Using psql command line

```bash
psql -U your_username -d your_database_name -f backend/migrations/add_is_active_to_students.sql
```

### Option 2: Using pgAdmin or any PostgreSQL client

1. Connect to your database
2. Open the SQL query editor
3. Copy the contents of `add_is_active_to_students.sql`
4. Execute the SQL

### Option 3: Using Node.js script

If you have a database connection set up, you can run:

```javascript
const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', 'add_is_active_to_students.sql'),
    'utf8'
  );
  
  try {
    await pool.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
}

runMigration();
```

## What This Migration Does

- Adds an `is_active` column to the `students` table (default: `true`)
- Adds an `updated_at` column if it doesn't exist
- Creates an index on `is_active` for better query performance
- Sets all existing students to active status

## After Running the Migration

1. Restart your backend server
2. The deactivate button in the admin panel will now work
3. Deactivated students will have `is_active = false` in the database
