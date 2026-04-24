const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const [totalResult, pendingResult, inProgressResult, completedResult, usersResult, workersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM complaints'),
      pool.query("SELECT COUNT(*) FROM complaints WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM complaints WHERE status = 'in_progress'"),
      pool.query("SELECT COUNT(*) FROM complaints WHERE status = 'completed'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'worker'")
    ]);
    
    const stats = {
      total: parseInt(totalResult.rows[0].count),
      pending: parseInt(pendingResult.rows[0].count),
      inProgress: parseInt(inProgressResult.rows[0].count),
      completed: parseInt(completedResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      totalWorkers: parseInt(workersResult.rows[0].count)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
