const express = require('express');
const pool = require('../config/database');
const upload = require('../middleware/upload');
const { createNotification } = require('../utils/notification');

const router = express.Router();

/**
 * @swagger
 * /api/complaints/public:
 *   get:
 *     summary: Get all public complaints (no authentication required)
 *     tags: [Complaints]
 *     responses:
 *       200:
 *         description: List of public complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 complaints:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 */
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.category, c.description, c.priority, c.status, c.deadline, c.created_at, c.support_count, c.media_path, c.feedback_rating, c.feedback_comments,
              w.name as worker_name
       FROM complaints c
       LEFT JOIN users w ON c.assigned_worker_id = w.id
       ORDER BY c.created_at DESC`
    );

    res.json({ complaints: result.rows });
  } catch (error) {
    console.error('Get public complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Create a new complaint
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - description
 *             properties:
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               deadline:
 *                 type: string
 *                 format: date
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 complaint:
 *                   $ref: '#/components/schemas/Complaint'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('media'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { category, description, priority, deadline } = req.body;
  const mediaPath = req.file ? req.file.filename : null;

  if (!category || !description) {
    return res.status(400).json({ message: 'Category and description are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO complaints (user_id, category, description, priority, media_path, status, assigned_worker_id, feedback_rating, feedback_comments, deadline, support_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [req.session.user.id, category, description, priority || 'medium', mediaPath, 'review_board', null, null, null, deadline || null, 0]
    );

    // Notify all admins about new complaint
    const adminResult = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
    for (const admin of adminResult.rows) {
      await createNotification(
        admin.id,
        result.rows[0].id,
        'new_complaint',
        `New ${category} complaint raised by ${req.session.user.name}`
      );
    }

    res.status(201).json({ message: 'Complaint created successfully', complaint: result.rows[0] });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Failed to create complaint' });
  }
});

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: Get all complaints (Admin only)
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 complaints:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*,
              s.name as student_name, s.email as student_email, s.room_number, s.hostel_block,
              w.name as worker_name
       FROM complaints c
       LEFT JOIN users s ON c.user_id = s.id
       LEFT JOIN users w ON c.assigned_worker_id = w.id
       ORDER BY c.created_at DESC`
    );

    res.json({ complaints: result.rows });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});

/**
 * @swagger
 * /api/complaints/supervisor:
 *   get:
 *     summary: Get all complaints (Supervisor only)
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: List of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 complaints:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/supervisor', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'supervisor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, 
              s.name as student_name, s.email as student_email, s.room_number, s.hostel_block,
              w.name as worker_name 
       FROM complaints c 
       LEFT JOIN users s ON c.user_id = s.id 
       LEFT JOIN users w ON c.assigned_worker_id = w.id 
       ORDER BY c.created_at DESC`
    );
    
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});

// Get user's complaints
router.get('/my', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, w.name as worker_name 
       FROM complaints c 
       LEFT JOIN users w ON c.assigned_worker_id = w.id 
       WHERE c.user_id = $1 
       ORDER BY c.created_at DESC`,
      [req.session.user.id]
    );
    
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});

// Get worker's assigned complaints
router.get('/assigned', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'worker') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, 
              s.name as student_name, s.email as student_email, s.room_number, s.hostel_block 
       FROM complaints c 
       LEFT JOIN users s ON c.user_id = s.id 
       WHERE c.assigned_worker_id = $1 
       ORDER BY c.created_at DESC`,
      [req.session.user.id]
    );
    
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error('Get assigned complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
});

// Get single complaint
router.get('/:id', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      `SELECT c.*, 
              s.name as student_name, s.email as student_email, s.room_number, s.hostel_block,
              w.name as worker_name 
       FROM complaints c 
       LEFT JOIN users s ON c.user_id = s.id 
       LEFT JOIN users w ON c.assigned_worker_id = w.id 
       WHERE c.id = $1`,
      [parseInt(req.params.id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json({ complaint: result.rows[0] });
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Failed to fetch complaint' });
  }
});

// Get comments for a complaint (public - no authentication required)
router.get('/:id/comments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.name as user_name, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.complaint_id = $1
       ORDER BY c.created_at ASC`,
      [parseInt(req.params.id)]
    );
    
    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Add comment to a complaint (anyone can comment)
router.post('/:id/comments', async (req, res) => {
  const { content, userId, userName, userRole } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Comment content is required' });
  }

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // First, check if the user exists (for guest users, we may need to create a temporary entry)
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [parseInt(userId)]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await pool.query(
      'INSERT INTO comments (complaint_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [parseInt(req.params.id), parseInt(userId), content]
    );
    
    // Fetch the comment with user info
    const commentWithUser = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.name as user_name, u.role as user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json({ comment: commentWithUser.rows[0] });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// Support a complaint (increase support count and add comment)
router.post('/:id/support', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { comment } = req.body;

  try {
    const result = await pool.query(
      'UPDATE complaints SET support_count = support_count + 1, comments = COALESCE(comments, \'\') || $1 WHERE id = $2 RETURNING support_count',
      [comment ? `\n\n- ${req.session.user.name}: ${comment}` : '', parseInt(req.params.id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json({ message: 'Support added successfully', supportCount: result.rows[0].support_count });
  } catch (error) {
    console.error('Support complaint error:', error);
    res.status(500).json({ message: 'Failed to support complaint' });
  }
});

/**
 * @swagger
 * /api/complaints/{id}/status:
 *   put:
 *     summary: Update complaint status
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [review_board, pending, assigned, in_progress, completed, rejected]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 complaint:
 *                   $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/status', async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'worker')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
      [status, parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // If worker marks task as completed, notify admin and student
    if (status === 'completed' && req.session.user.role === 'worker') {
      const complaint = result.rows[0];

      // Notify all admins
      const adminResult = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
      for (const admin of adminResult.rows) {
        await createNotification(
          admin.id,
          parseInt(req.params.id),
          'task_completed',
          `A ${complaint.category} complaint has been completed by ${req.session.user.name}`
        );
      }

      // Notify the student who created the complaint
      await createNotification(
        complaint.user_id,
        parseInt(req.params.id),
        'task_completed',
        `Your ${complaint.category} complaint has been completed. Please provide feedback.`
      );
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

/**
 * @swagger
 * /api/complaints/{id}/assign:
 *   put:
 *     summary: Assign a worker to a complaint
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workerId
 *             properties:
 *               workerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Worker assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 complaint:
 *                   $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/assign', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({ message: 'Worker ID is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE complaints SET assigned_worker_id = $1, status = $2 WHERE id = $3 RETURNING *',
      [parseInt(workerId), 'assigned', parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Create notification for the assigned worker
    await createNotification(
      parseInt(workerId),
      parseInt(req.params.id),
      'task_assigned',
      `You have been assigned a new ${result.rows[0].category} complaint`
    );

    res.json({ message: 'Worker assigned successfully' });
  } catch (error) {
    console.error('Assign worker error:', error);
    res.status(500).json({ message: 'Failed to assign worker' });
  }
});

/**
 * @swagger
 * /api/complaints/{id}/approve:
 *   put:
 *     summary: Approve a complaint (Supervisor only)
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Complaint approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 complaint:
 *                   $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/approve', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'supervisor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      'UPDATE complaints SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['pending', parseInt(req.params.id), 'review_board']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found or not in review_board status' });
    }

    res.json({ message: 'Complaint approved successfully', complaint: result.rows[0] });
  } catch (error) {
    console.error('Approve complaint error:', error);
    res.status(500).json({ message: 'Failed to approve complaint' });
  }
});

/**
 * @swagger
 * /api/complaints/{id}/deadline:
 *   put:
 *     summary: Update complaint deadline (Supervisor only)
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deadline
 *             properties:
 *               deadline:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Deadline updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 complaint:
 *                   $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/deadline', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'supervisor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { deadline } = req.body;

  if (!deadline) {
    return res.status(400).json({ message: 'Deadline is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE complaints SET deadline = $1 WHERE id = $2 RETURNING *',
      [deadline, parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Deadline updated successfully', complaint: result.rows[0] });
  } catch (error) {
    console.error('Update deadline error:', error);
    res.status(500).json({ message: 'Failed to update deadline' });
  }
});

/**
 * @swagger
 * /api/complaints/{id}/priority:
 *   put:
 *     summary: Update complaint priority (Supervisor only)
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priority
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Priority updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 complaint:
 *                   $ref: '#/components/schemas/Complaint'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/priority', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'supervisor') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { priority } = req.body;

  if (!priority || !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ message: 'Priority must be low, medium, or high' });
  }

  try {
    const result = await pool.query(
      'UPDATE complaints SET priority = $1 WHERE id = $2 RETURNING *',
      [priority, parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Priority updated successfully', complaint: result.rows[0] });
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({ message: 'Failed to update priority' });
  }
});

/**
 * @swagger
 * /api/complaints/{id}/feedback:
 *   post:
 *     summary: Submit feedback for a completed complaint
 *     tags: [Complaints]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/feedback', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { rating, comments } = req.body;

  if (!rating) {
    return res.status(400).json({ message: 'Rating is required' });
  }

  try {
    // First check if complaint exists and belongs to user
    const complaintCheck = await pool.query(
      'SELECT user_id FROM complaints WHERE id = $1',
      [parseInt(req.params.id)]
    );

    if (complaintCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaintCheck.rows[0].user_id !== req.session.user.id) {
      return res.status(403).json({ message: 'You can only provide feedback for your own complaints' });
    }

    const result = await pool.query(
      'UPDATE complaints SET feedback_rating = $1, feedback_comments = $2 WHERE id = $3 RETURNING *',
      [rating, comments || null, parseInt(req.params.id)]
    );

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

module.exports = router;
