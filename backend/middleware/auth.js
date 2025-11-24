// middleware/auth.js
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

async function verifyToken(req, res, next) {
  try {
    // Accept both lowercase and uppercase header key
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ success: false, message: 'Invalid Authorization header format' });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Your auth.js signs payload with { user: { id, role, ... } }
    req.user = decoded.user || decoded;

    // Ensure id exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Check if student account is still active
    if (req.user.role === 'student') {
      try {
        const result = await pool.query(
          'SELECT is_active FROM students WHERE id = $1',
          [req.user.id]
        );
        
        if (result.rows.length > 0 && result.rows[0].is_active === false) {
          return res.status(403).json({ 
            success: false, 
            message: 'Your account has been deactivated. Please contact support for assistance.' 
          });
        }
      } catch (dbError) {
        console.error('Database error checking student status:', dbError);
        // Continue with request if DB check fails (fail open for availability)
      }
    }

    next();
  } catch (err) {
    console.error('Token verify error:', err && err.message ? err.message : err);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = verifyToken;
