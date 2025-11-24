// ========================================
// auth.js - Authentication Routes
// ========================================
const express = require('express');
const pool = require('../config/database'); // PostgreSQL connection pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const verifyToken= require('../middleware/auth');
const { ensureWelcomeNotification, pushNotification } = require('../utils/notificationService');
const { notifyAdminOfNewRegistration } = require('../utils/adminNotifications');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';



// ---------------- HELPERS ----------------
function validateEmail(email) {
  const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(email);
}

function validateRole(role) {
  const roles = ['admin', 'student', 'company', 'mentor'];
  return roles.includes(role.toLowerCase());
}

// ---------------- REGISTER ----------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, username } = req.body;

    // ✅ Basic validation
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // ✅ Validate username is provided
    if (!username || username.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (!validateRole(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (role.toLowerCase() === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin registration is not allowed' });
    }

    // Choose table
    let tableName;
    if (role.toLowerCase() === 'company') {
      tableName = 'companies';
    } else if (role.toLowerCase() === 'mentor') {
      tableName = 'mentors';
    } else {
      tableName = 'students';
    }

    // ✅ Check if email exists
    const existingEmail = await pool.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // ✅ Check if username exists (NEW VALIDATION)
    const existingUsername = await pool.query(`SELECT * FROM ${tableName} WHERE username = $1`, [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already taken. Please choose a different username.' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let insertQuery, values;
    if (role.toLowerCase() === 'company') {
      insertQuery = `
        INSERT INTO companies (company_name, email, phone, password, username)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, company_name AS name, email, username
      `;
      values = [name, email, phone, hashedPassword, username];
    } else if (role.toLowerCase() === 'mentor') {
      insertQuery = `
        INSERT INTO mentors (full_name, email, phone, password, username)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, full_name AS name, email, username
      `;
      values = [name, email, phone, hashedPassword, username];
    } else {
      insertQuery = `
        INSERT INTO students (full_name, email, phone, password, username)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, full_name AS name, email, username
      `;
      values = [name, email, phone, hashedPassword, username];
    }

    const result = await pool.query(insertQuery, values);
    const user = { ...result.rows[0], role: role.toLowerCase() };
    
    // Notify admins of new registration
    try {
      const io = req.app.get('io');
      await notifyAdminOfNewRegistration({
        userRole: role.toLowerCase(),
        userName: user.name,
        userEmail: user.email,
        io
      });
    } catch (notificationError) {
      console.error('Admin notification error:', notificationError);
      // Don't fail registration if notification fails
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // ✅ Handle database unique constraint error (fallback)
    if (error.code === '23505') { // PostgreSQL unique violation error code
      if (error.constraint && error.constraint.includes('username')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken. Please choose a different username.' 
        });
      }
      return res.status(400).json({ 
        success: false, 
        message: 'This email or username is already registered.' 
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// ---------------- LOGIN ----------------
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Email, password and role are required' });
    }
    if (!validateRole(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const normalizedRole = role.toLowerCase();

    // Choose table
    let tableName;
    if (normalizedRole === 'admin') {
      tableName = 'admins';
    } else if (normalizedRole === 'student') {
      tableName = 'students';
    } else if (normalizedRole === 'mentor') {
      tableName = 'mentors';
    } else {
      tableName = 'companies';
    }

    const userResult = await pool.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    
    // Check if student account is deactivated
    if (normalizedRole === 'student' && user.is_active === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact support for assistance.' 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Build JWT payload (IMPORTANT: nested under `user`)
    const payload = {
      user: {
        id: user.id,
        role: normalizedRole,
        email: user.email,
        name: user.full_name || user.company_name
      }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const ioInstance = req.app.get('io');

    await ensureWelcomeNotification({
      role: normalizedRole,
      recipientId: user.id,
      name: user.full_name || user.company_name,
      io: ioInstance,
    });

    try {
      const timestamp = new Date();
      const friendlyTime = timestamp.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      await pushNotification({
        role: normalizedRole,
        recipientRole: normalizedRole,
        recipientId: user.id,
        type: 'login',
        title: 'New login detected',
        message: `You signed in on ${friendlyTime}. If this wasn't you, please reset your password.`,
        metadata: {
          timestamp: timestamp.toISOString(),
          ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
          userAgent: req.get('user-agent') || 'unknown',
        },
        io: ioInstance,
      });
    } catch (notificationError) {
      console.error('Login notification error:', notificationError);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.full_name || user.company_name,
        email: user.email,
        role: role.toLowerCase()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ---------------- SETUP ADMIN TABLE ----------------
router.get('/setup-admin-table', async (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createTableQuery);
    res.json({ success: true, message: "✅ Admins table created (or already exists)" });
  } catch (error) {
    console.error("❌ Error creating admins table:", error);
    res.status(500).json({ success: false, message: "Error creating admins table" });
  }
});

router.get("/getStudent", verifyToken,
  async (req, res) => {
  try {
    const userId = req.user.id; // decoded from token

    const query = 'SELECT * FROM students WHERE id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
})


module.exports = router;