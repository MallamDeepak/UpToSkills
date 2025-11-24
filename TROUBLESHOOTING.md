# Troubleshooting Guide

## Current Issues Fixed

### 1. ❌ "Failed to load courses" Error
**Cause:** Backend server is not running on port 5000

**Solution:**
```powershell
# Navigate to backend folder
cd F:\UpToSkills-main\backend

# Start the backend server
npm start
```

### 2. ❌ "websocket error" in Notifications
**Cause:** Socket.IO cannot connect to backend server

**Solution:** 
Same as above - start the backend server. Socket.IO runs on the same server as the REST API.

## Quick Start Checklist

### ✅ Step 1: Verify PostgreSQL is Running
```powershell
# Check if PostgreSQL service is running
Get-Service postgresql*
```
If not running:
- Start pgAdmin or PostgreSQL service
- Verify database credentials in `.env` file

### ✅ Step 2: Start Backend Server
```powershell
cd F:\UpToSkills-main\backend
npm start
```

**Expected Output:**
```
✅ Server is running on port 5000
🌐 Health check: http://localhost:5000/health
✅ Notifications table ready
```

**If you see errors:**
- Check if PostgreSQL is running
- Verify `.env` file exists with correct database credentials:
  ```env
  DB_USER=postgres
  DB_HOST=localhost
  DB_DATABASE=your_database_name
  DB_PASSWORD=your_password
  DB_PORT=5432
  JWT_SECRET=your_secret_key
  ```

### ✅ Step 3: Start Frontend Server
```powershell
# In a NEW terminal window
cd F:\UpToSkills-main
npm start
```

**Expected Output:**
```
Compiled successfully!
Local:            http://localhost:3000
```

### ✅ Step 4: Verify Everything is Working

#### Test Backend Health:
Open browser to: `http://localhost:5000/health`

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running successfully",
  "timestamp": "2025-11-24T14:58:04.000Z"
}
```

#### Test Frontend:
1. Navigate to: `http://localhost:3000`
2. Login as a student
3. Check notifications - should NOT show "websocket error"
4. Navigate to "My Courses" - should NOT show "Failed to load courses"

## Common Errors and Solutions

### Error: "Cannot connect to server"
**Symptoms:** 
- "Failed to load courses" message
- No data loading in any component
- All API calls failing

**Solutions:**
1. **Check if backend is running:**
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 5000
   ```
   If `TcpTestSucceeded : False`, backend is not running - start it!

2. **Check backend terminal for errors**

3. **Verify CORS settings** in `backend/server.js`

### Error: "Session expired. Please login again"
**Cause:** JWT token expired or invalid

**Solution:**
1. Logout and login again
2. Clear localStorage: 
   - Open browser DevTools (F12)
   - Go to Application > Local Storage
   - Delete the "token" entry
   - Login again

### Error: "Student not found"
**Cause:** Student record doesn't exist in database

**Solution:**
1. Register as a new student
2. Or check database:
   ```sql
   SELECT * FROM students WHERE email = 'your_email@example.com';
   ```

### Error: "websocket error" persists
**Even after starting backend:**

1. **Check if Socket.IO endpoint is accessible:**
   - Open DevTools Console (F12)
   - Look for connection attempts
   - Should see: `Socket.IO connection established`

2. **Verify backend Socket.IO configuration** in `backend/server.js`:
   ```javascript
   const io = new Server(httpServer, {
       cors: {
           origin: ['http://localhost:3000'],
           credentials: true,
       },
   });
   ```

3. **Clear browser cache and reload**

### Error: "No courses enrolled" but you just enrolled
**Cause:** Enrollment was created but not displayed

**Debugging Steps:**
1. **Check browser console** for API errors
2. **Check backend logs** for enrollment creation success
3. **Query database directly:**
   ```sql
   SELECT e.*, s.full_name, c.title 
   FROM enrollments e
   JOIN students s ON e.student_id = s.id
   JOIN courses c ON e.course_id = c.id
   WHERE s.email = 'your_email@example.com'
   ORDER BY e.enrolled_at DESC;
   ```

4. **Refresh the My Courses page**

## Development Workflow

### Recommended Terminal Setup:
**Terminal 1 - Backend:**
```powershell
cd F:\UpToSkills-main\backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd F:\UpToSkills-main
npm start
```

**Terminal 3 - Database (optional):**
```powershell
# PostgreSQL CLI
psql -U postgres -d your_database_name
```

### Logs to Monitor:

**Backend Logs:**
- Server startup messages
- API request logs
- Database connection status
- Enrollment creation logs
- Notification sending logs

**Frontend Logs (Browser Console):**
- Component mounting/unmounting
- API call success/failures
- State updates
- WebSocket connection status

## Database Verification

### Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Required tables:**
- students
- courses
- enrollments
- programs
- notifications
- mentors
- companies
- skill_badges
- projects
- etc.

### Check enrollment data:
```sql
-- All enrollments
SELECT * FROM enrollments ORDER BY enrolled_at DESC LIMIT 10;

-- Enrollments with course names
SELECT 
    e.id,
    s.full_name as student_name,
    s.email,
    c.title as course_name,
    e.status,
    e.enrolled_at
FROM enrollments e
JOIN students s ON e.student_id = s.id
JOIN courses c ON e.course_id = c.id
ORDER BY e.enrolled_at DESC;
```

### Check notification data:
```sql
-- Recent notifications
SELECT * FROM notifications 
WHERE role = 'student' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Environment Variables

### Backend (.env file location: `F:\UpToSkills-main\backend\.env`)
```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=uptoskills_db
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your_super_secret_key_here

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_ORIGIN=http://localhost:3000
CLIENT_URL=http://localhost:3000
```

### Frontend (.env file location: `F:\UpToSkills-main\.env`)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

## Port Conflicts

If port 5000 or 3000 is already in use:

### Check what's using the port:
```powershell
# Check port 5000
netstat -ano | findstr :5000

# Check port 3000
netstat -ano | findstr :3000
```

### Kill the process:
```powershell
# Replace PID with actual Process ID from above command
taskkill /PID <PID> /F
```

### Or change the port:
**Backend:** Edit `backend/server.js` or `.env`
```env
PORT=5001
```

**Frontend:** React will prompt to use different port automatically

## Need More Help?

1. **Check backend console** for error messages
2. **Check browser console** (F12) for frontend errors
3. **Check PostgreSQL logs** if database connection fails
4. **Verify all dependencies are installed:**
   ```powershell
   # Backend
   cd F:\UpToSkills-main\backend
   npm install
   
   # Frontend
   cd F:\UpToSkills-main
   npm install
   ```

## Quick Fix Summary

**Most common issue: Backend not running**
```powershell
cd F:\UpToSkills-main\backend
npm start
```

That should fix BOTH errors:
✅ "Failed to load courses" → Fixed (API now accessible)
✅ "websocket error" → Fixed (Socket.IO now accessible)
