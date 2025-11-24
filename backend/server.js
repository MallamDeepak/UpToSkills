// backend/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const path = require('path');
const { ensureNotificationsTable } = require('./utils/ensureNotificationsTable');

// Database connection
const pool = require('./config/database');

// Initialize Express app FIRST
const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000';
const ALLOWED_ORIGINS = FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean);
if (!ALLOWED_ORIGINS.length) {
    ALLOWED_ORIGINS.push('http://localhost:3000');
}
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        credentials: true,
    },
});

app.set('io', io);

ensureNotificationsTable()
    .then(() => console.log('✅ Notifications table ready'))
    .catch((err) => {
        console.error('❌ Failed to ensure notifications schema', err);
        process.exit(1);
    });

const NOTIFICATION_ROLES = new Set(['student', 'mentor', 'admin', 'company']);

io.on('connection', (socket) => {
    const { role, recipientId } = socket.handshake.auth || {};

    if (!role || !NOTIFICATION_ROLES.has(role)) {
        socket.emit('notifications:error', { message: 'Invalid role supplied' });
        return socket.disconnect(true);
    }

    socket.join(role);
    if (recipientId) {
        socket.join(`${role}:${recipientId}`);
    }

    socket.emit('notifications:ready', {
        role,
        recipientId: recipientId || null,
    });
});

// Import routers
const userProfileRoutes = require('./routes/userProfile');
const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const mentorProjectRoutes = require('./routes/mentor_projects');
const mentorReviewRoutes = require('./routes/mentorReviews');
const companyProfilesRoutes = require('./routes/companyProfiles.route');
const statsRoutes = require("./routes/stats");
const testimonialsRouter = require("./routes/testimonials");
const studentsRoutes = require('./routes/students');
const mentorsRoutes = require('./routes/mentors');
const companiesRouter = require("./routes/companies.route");  // ✅ FIXED: Use the correct file
const searchCompaniesRouter = require("./routes/searchcompanies");  // Keep this separate if it's for search
const searchProjectRoutes = require('./routes/searchproject');
const searchStudent = require('./routes/searchStudents');
const formRoute = require('./routes/formRoutes');
const skillBadgesRoutes = require('./routes/skillBadges');
const coursesRoutes = require('./routes/courses.route');
const interviewRoutes = require('./routes/interviews');
const notificationRoutes = require('./routes/notifications');
const adminNotificationRoutes = require('./routes/adminNotifications');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

// Middleware setup
app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routes in proper order
app.use('/api/auth', authRoutes);
app.use('/api', userProfileRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/mentor_projects', mentorProjectRoutes);
app.use('/api/mentorreviews', mentorReviewRoutes);
app.use('/api/company-profiles', companyProfilesRoutes);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/stats', statsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/searchStudents', searchStudent);
app.use('/api/mentors', mentorsRoutes);
app.use('/api/form', formRoute);
app.use('/api/skill-badges', skillBadgesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// ✅ FIXED: Mount the companies route
app.use('/api/companies', companiesRouter);

// If searchcompanies is different, mount it too
app.use('/api/searchcompanies', searchCompaniesRouter);

// Search routes
app.use('/api/searchproject', searchProjectRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running successfully',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start the server last
httpServer.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    
});