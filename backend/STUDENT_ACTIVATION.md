# Student Activation/Deactivation Feature

## Overview
Students can now be deactivated instead of deleted, allowing you to temporarily disable accounts while preserving all data.

## Database Changes
- Added `is_active` column to the `students` table (default: `true`)
- Added `updated_at` column to track when student status changes
- Added index on `is_active` for better query performance

## API Endpoints

### 1. Deactivate Student
**Endpoint:** `PATCH /api/students/:id/deactivate`

**Description:** Sets a student's `is_active` status to `false`

**Response:**
```json
{
  "success": true,
  "message": "Student deactivated successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "is_active": false
  }
}
```

### 2. Reactivate Student
**Endpoint:** `PATCH /api/students/:id/reactivate`

**Description:** Sets a student's `is_active` status back to `true`

**Response:**
```json
{
  "success": true,
  "message": "Student reactivated successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "full_name": "John Doe",
    "email": "john@example.com",
    "is_active": true
  }
}
```

### 3. Get Students (Updated)
**Endpoint:** `GET /api/students`

**Changes:** Now includes `is_active` field in the response for each student

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john_doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "is_active": true,
      "created_at": "2025-11-22T10:00:00.000Z"
    }
  ]
}
```

All other student endpoints (search, details, getById) also now include the `is_active` field.

## Running the Migration

To add the `is_active` column to an existing database:

```bash
# From the backend directory
npm run migrate
```

This will:
- Add the `is_active` column (default `true`)
- Add the `updated_at` column
- Create an index on `is_active`
- Set all existing students to active

## Files Modified

### Backend
- `backend/controllers/students.controller.js` - Added `deactivateStudent` and `reactivateStudent` functions, updated all queries to include `is_active`
- `backend/routes/students.js` - Added deactivate and reactivate routes
- `backend/scripts/initDB.js` - Updated to create `is_active` and `updated_at` columns automatically
- `backend/package.json` - Added `migrate` npm script

### New Files
- `backend/scripts/run_migrations.js` - Script to run SQL migrations
- `backend/migrations/add_is_active_to_students.sql` - SQL migration for adding columns

## Frontend Integration

Update your frontend to:

1. **Display activation status:**
```javascript
{student.is_active ? 'Active' : 'Deactivated'}
```

2. **Call deactivate endpoint:**
```javascript
await axios.patch(`/api/students/${studentId}/deactivate`);
```

3. **Call reactivate endpoint:**
```javascript
await axios.patch(`/api/students/${studentId}/reactivate`);
```

4. **Update button text dynamically:**
```javascript
{student.is_active ? 'Deactivate' : 'Reactivate'}
```

## Benefits Over Deletion

- **Data Preservation:** All student data, projects, badges, and enrollments remain intact
- **Reversible:** Students can be reactivated at any time
- **Audit Trail:** Track when students were deactivated via `updated_at`
- **Safer:** Prevents accidental permanent data loss
