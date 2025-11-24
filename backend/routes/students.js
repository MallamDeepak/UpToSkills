// backend/routes/students.js
const express = require('express');
const router = express.Router();

const pool = require('../config/database'); // used below in count/delete
const {
  getStudents,
  getStudentById,
  searchStudents,
  searchStudentsByQuery,
  getStudentDetails,
  deactivateStudent,
  reactivateStudent
} = require('../controllers/students.controller');

// Route: get student count (keeps your existing count route)
router.get('/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*)::int AS total_students FROM students');
    res.json({ totalStudents: result.rows[0].total_students });
  } catch (err) {
    console.error('❌ Error fetching student count:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete student by ID (keep as-is)
// Delete student by ID safely: remove dependent rows in user_details first (transaction)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove dependent rows that reference this student to avoid FK violations.
    // If you prefer cascading deletes at the DB level, alter the FK to use ON DELETE CASCADE instead.
    await client.query('DELETE FROM user_details WHERE student_id = $1', [id]);

    const result = await client.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Student deleted', data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting student:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
});

// --- SEARCH ROUTES ---
// Improved query-style search: /api/students/search?q=react
router.get('/search', searchStudentsByQuery);

// Legacy param search: /api/students/search/:name
router.get('/search/:name', searchStudents);

// Provide "all-students" alias for clients that expect it
router.get('/all-students', getStudents);

// Keep root route (getStudents) at /api/students/
router.get('/', getStudents);

// Deactivate student by ID
router.patch('/:id/deactivate', deactivateStudent);

// Reactivate student by ID
router.patch('/:id/reactivate', reactivateStudent);

// Get complete student details with all activities
router.get('/:id/details', getStudentDetails);

// Provide "student/:id" alias (used by your frontend code) -> maps to getStudentById
router.get('/student/:id', getStudentById);

// Also keep '/:id' for other clients
router.get('/:id', getStudentById);

module.exports = router;
