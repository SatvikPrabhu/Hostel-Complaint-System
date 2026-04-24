const express = require('express');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'hostelcare_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax' } // 24 hours
}));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
});

console.log('Using PostgreSQL database');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and videos are allowed'));
  }
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, studentId, hostelBlock, roomNumber, phone } = req.body;

  console.log('Registration attempt:', { name, email, role });

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  // For student registration, validate email domain
  if (role === 'student' && !email.endsWith('vjti.ac.in')) {
    return res.status(400).json({ message: 'Only vjti.ac.in email addresses are allowed for student registration' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, student_id, hostel_block, room_number, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [name, email, hashedPassword, role || 'student', studentId || null, hostelBlock || null, roomNumber || null, phone || null]
    );

    console.log('User registered successfully. User ID:', result.rows[0].id);
    res.status(201).json({ message: 'Registration successful', userId: result.rows[0].id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email });

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    const user = result.rows[0];
    console.log('User found:', user ? { id: user.id, email: user.email, role: user.role } : 'Not found');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Set session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.student_id,
      hostelBlock: user.hostel_block,
      roomNumber: user.room_number
    };

    console.log('Login successful for:', req.session.user.email);
    res.json({ 
      message: 'Login successful', 
      user: req.session.user 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Support a complaint (increase support count and add comment)
app.post('/api/complaints/:id/support', async (req, res) => {
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

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

// Get all complaints (public - no authentication required)
app.get('/api/complaints/public', async (req, res) => {
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

// ==================== COMPLAINT ROUTES ====================

// Create complaint
app.post('/api/complaints', upload.single('media'), async (req, res) => {
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

// Get all complaints (for admin)
app.get('/api/complaints', async (req, res) => {
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

// Get user's complaints
app.get('/api/complaints/my', async (req, res) => {
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
app.get('/api/complaints/assigned', async (req, res) => {
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
app.get('/api/complaints/:id', async (req, res) => {
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
app.get('/api/complaints/:id/comments', async (req, res) => {
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
app.post('/api/complaints/:id/comments', async (req, res) => {
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

// Update complaint status
app.put('/api/complaints/:id/status', async (req, res) => {
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

// Update complaint deadline and priority (admin and supervisor)
app.put('/api/complaints/:id/details', async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'supervisor')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { deadline, priority } = req.body;

  try {
    const result = await pool.query(
      'UPDATE complaints SET deadline = $1, priority = $2 WHERE id = $3 RETURNING *',
      [deadline || null, priority, parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Complaint details updated successfully', complaint: result.rows[0] });
  } catch (error) {
    console.error('Update details error:', error);
    res.status(500).json({ message: 'Failed to update complaint details' });
  }
});

// Assign worker to complaint
app.put('/api/complaints/:id/assign', async (req, res) => {
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

// Submit feedback
app.post('/api/complaints/:id/feedback', async (req, res) => {
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
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await pool.query(
      'UPDATE complaints SET feedback_rating = $1, feedback_comments = $2, status = $3 WHERE id = $4',
      [rating, comments || null, 'completed', parseInt(req.params.id)]
    );

    // Get complaint details for notification
    const complaintDetails = await pool.query(
      'SELECT category, user_id FROM complaints WHERE id = $1',
      [parseInt(req.params.id)]
    );

    // Notify all admins about completed task
    const adminResult = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
    for (const admin of adminResult.rows) {
      await createNotification(
        admin.id,
        parseInt(req.params.id),
        'task_completed',
        `A ${complaintDetails.rows[0].category} complaint has been completed with rating: ${rating}/5`
      );
    }

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
});

// ==================== USER ROUTES ====================

// Get all workers (for admin)
app.get('/api/users/workers', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE role = $1',
      ['worker']
    );

    res.json({ workers: result.rows });
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ message: 'Failed to fetch workers' });
  }
});

// Get all supervisors (for admin)
app.get('/api/users/supervisors', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE role = $1',
      ['supervisor']
    );

    res.json({ supervisors: result.rows });
  } catch (error) {
    console.error('Get supervisors error:', error);
    res.status(500).json({ message: 'Failed to fetch supervisors' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [parseInt(req.params.id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ==================== NOTIFICATION ROUTES ====================

// Get notifications for current user
app.get('/api/notifications', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at, c.category, c.status
       FROM notifications n
       LEFT JOIN complaints c ON n.complaint_id = c.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [req.session.user.id]
    );

    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id',
      [parseInt(req.params.id), req.session.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.session.user.id]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Helper function to create notification
const createNotification = async (userId, complaintId, type, message) => {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, complaint_id, type, message) VALUES ($1, $2, $3, $4)',
      [userId, complaintId, type, message]
    );
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Create worker (admin only)
app.post('/api/users/workers', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone',
      [name, email, hashedPassword, 'worker', phone || null]
    );

    res.status(201).json({ message: 'Worker created successfully', worker: result.rows[0] });
  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({ message: 'Failed to create worker' });
  }
});

// Create supervisor (admin only)
app.post('/api/users/supervisors', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone',
      [name, email, hashedPassword, 'supervisor', phone || null]
    );

    res.status(201).json({ message: 'Supervisor created successfully', supervisor: result.rows[0] });
  } catch (error) {
    console.error('Create supervisor error:', error);
    res.status(500).json({ message: 'Failed to create supervisor' });
  }
});

// Get dashboard stats
app.get('/api/stats/dashboard', async (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
