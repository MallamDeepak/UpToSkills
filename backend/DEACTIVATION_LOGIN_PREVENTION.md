# Student Deactivation - Login Prevention

## Overview
Deactivated students are now prevented from logging in and accessing the system. This works at two levels:
1. **Login Prevention**: Students with `is_active = false` cannot log in
2. **Session Validation**: Even if a student is logged in and then gets deactivated, their subsequent API requests will be blocked

## Implementation Details

### 1. Login Check (routes/auth.js)
When a student attempts to login:
- The system checks if `is_active` is `false`
- If deactivated, returns HTTP 403 with error message
- Login is blocked before password verification to prevent timing attacks

**Error Response:**
```json
{
  "success": false,
  "message": "Your account has been deactivated. Please contact support for assistance."
}
```

### 2. Middleware Check (middleware/auth.js)
For all protected routes that use the `verifyToken` middleware:
- After JWT verification, checks if user is a student
- If student, queries database for current `is_active` status
- If deactivated, returns HTTP 403 and blocks the request
- Logged-in students who get deactivated will be logged out on their next API call

**Error Response:**
```json
{
  "success": false,
  "message": "Your account has been deactivated. Please contact support for assistance."
}
```

## Testing Instructions

### Test Case 1: Login Prevention
1. Go to admin panel and deactivate a student
2. Try to log in as that student
3. **Expected Result**: Login fails with "Your account has been deactivated" message

### Test Case 2: Session Termination
1. Log in as a student (Student A)
2. While logged in, have an admin deactivate Student A's account
3. Student A tries to perform any action (e.g., view courses, update profile)
4. **Expected Result**: Request fails with "Your account has been deactivated" message

### Test Case 3: Reactivation
1. Admin reactivates the student account
2. Student tries to log in again
3. **Expected Result**: Login succeeds normally

## Files Modified

### Backend
- `backend/routes/auth.js` - Added login check for deactivated students
- `backend/middleware/auth.js` - Added middleware check for ongoing sessions

### Database
- Uses existing `is_active` column in `students` table

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 403  | Forbidden | Student account is deactivated |
| 401  | Unauthorized | Invalid/expired token or missing auth |
| 400  | Bad Request | Invalid credentials |

## Security Considerations

1. **Check Order**: Account activation is checked AFTER user existence but BEFORE password verification to prevent timing attacks
2. **Fail-Safe**: If the database check fails in middleware, the request continues (fail-open) to maintain system availability
3. **Consistent Messaging**: Same error message prevents account enumeration
4. **Real-time Enforcement**: Session checks happen on every protected request, ensuring immediate enforcement

## Frontend Integration

The frontend Login component already handles error messages from the backend:

```javascript
catch (err) {
  const message =
    err.response?.data?.message ||
    err.message ||
    "Login failed. Please try again.";
  alert(message);
}
```

When a deactivated student tries to login, they'll see:
> "Your account has been deactivated. Please contact support for assistance."

## API Examples

### Attempt to Login (Deactivated Student)
```bash
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}

Response: 403 Forbidden
{
  "success": false,
  "message": "Your account has been deactivated. Please contact support for assistance."
}
```

### Protected Route Access (Deactivated Student)
```bash
GET /api/students/getStudent
Authorization: Bearer <valid_jwt_token>

Response: 403 Forbidden
{
  "success": false,
  "message": "Your account has been deactivated. Please contact support for assistance."
}
```

## Performance Impact

- **Login**: One additional condition check (negligible)
- **Protected Routes**: One additional database query per request for students only
  - Query is simple (indexed primary key lookup)
  - Results can be cached if needed in future optimizations
  - No impact on admin, mentor, or company accounts

## Future Enhancements

Consider implementing:
1. **Token Blacklisting**: Invalidate existing JWTs when account is deactivated
2. **Grace Period**: Allow X minutes before session termination
3. **Reason Tracking**: Store deactivation reason and display to user
4. **Email Notification**: Send email when account is deactivated
5. **Audit Logging**: Track login attempts by deactivated users
