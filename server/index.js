const express = require('express');
const cors = require('cors');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'hostelcare_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// In-memory storage
let users = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@hostelcare.com',
    password: bcrypt.hashSync('password', 10),
    role: 'admin'
  },
  {
    id: 2,
    name: 'John Electrician',
    email: 'john@hostelcare.com',
    password: bcrypt.hashSync('password', 10),
    role: 'worker',
    phone: '9876543210'
  },
  {
    id: 3,
    name: 'Mike Plumber',
    email: 'mike@hostelcare.com',
    password: bcrypt.hashSync('password', 10),
    role: 'worker',
    phone: '9876543211'
  },
  {
    id: 4,
    name: 'Rahul Sharma',
    email: 'rahul@hostelcare.com',
    password: bcrypt.hashSync('password', 10),
    role: 'student',
    studentId: 'STU001',
    hostelBlock: 'Block A',
    roomNumber: '101',
    phone: '9876543212'
  }
];

let complaints = [];
let userIdCounter = 5;
let complaintIdCounter = 1;

console.log('Using in-memory storage');

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
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, studentId, hostelBlock, roomNumber, phone } = req.body;
  
  console.log('Registration attempt:', { name, email, role });
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  // Check if email already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userIdCounter++,
    name,
    email,
    password: hashedPassword,
    role,
    studentId: studentId || null,
    hostelBlock: hostelBlock || null,
    roomNumber: roomNumber || null,
    phone: phone || null
  };

  users.push(newUser);
  console.log('User registered successfully. Total users:', users.length);
  console.log('Registered user email:', newUser.email);
  res.status(201).json({ message: 'Registration successful', userId: newUser.id });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email });
  console.log('Current users in database:', users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = users.find(u => u.email === email);
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
    studentId: user.studentId,
    hostelBlock: user.hostelBlock,
    roomNumber: user.roomNumber
  };

  console.log('Login successful for:', req.session.user.email);
  res.json({ 
    message: 'Login successful', 
    user: req.session.user 
  });
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

// Get current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({ user: req.session.user });
});

// ==================== COMPLAINT ROUTES ====================

// Create complaint
app.post('/api/complaints', upload.single('media'), (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { category, description, priority } = req.body;
  const mediaPath = req.file ? req.file.filename : null;

  if (!category || !description) {
    return res.status(400).json({ message: 'Category and description are required' });
  }

  const newComplaint = {
    id: complaintIdCounter++,
    user_id: req.session.user.id,
    category,
    description,
    priority: priority || 'medium',
    media_path: mediaPath,
    status: 'pending',
    assigned_worker_id: null,
    feedback_rating: null,
    feedback_comments: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  complaints.push(newComplaint);
  res.status(201).json({ message: 'Complaint created successfully', complaint: newComplaint });
});

// Get all complaints (for admin)
app.get('/api/complaints', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const complaintsWithDetails = complaints.map(c => {
    const student = users.find(u => u.id === c.user_id);
    const worker = users.find(u => u.id === c.assigned_worker_id);
    return {
      ...c,
      student_name: student?.name,
      student_email: student?.email,
      room_number: student?.roomNumber,
      hostel_block: student?.hostelBlock,
      worker_name: worker?.name
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ complaints: complaintsWithDetails });
});

// Get user's complaints
app.get('/api/complaints/my', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userComplaints = complaints
    .filter(c => c.user_id === req.session.user.id)
    .map(c => {
      const worker = users.find(u => u.id === c.assigned_worker_id);
      return {
        ...c,
        worker_name: worker?.name
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ complaints: userComplaints });
});

// Get worker's assigned complaints
app.get('/api/complaints/assigned', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'worker') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const assignedComplaints = complaints
    .filter(c => c.assigned_worker_id === req.session.user.id)
    .map(c => {
      const student = users.find(u => u.id === c.user_id);
      return {
        ...c,
        student_name: student?.name,
        student_email: student?.email,
        room_number: student?.roomNumber,
        hostel_block: student?.hostelBlock
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ complaints: assignedComplaints });
});

// Get single complaint
app.get('/api/complaints/:id', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const complaint = complaints.find(c => c.id === parseInt(req.params.id));
  
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  const student = users.find(u => u.id === complaint.user_id);
  const worker = users.find(u => u.id === complaint.assigned_worker_id);

  const complaintWithDetails = {
    ...complaint,
    student_name: student?.name,
    student_email: student?.email,
    room_number: student?.roomNumber,
    hostel_block: student?.hostelBlock,
    worker_name: worker?.name
  };

  res.json({ complaint: complaintWithDetails });
});

// Update complaint status
app.put('/api/complaints/:id/status', (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'worker')) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const complaint = complaints.find(c => c.id === parseInt(req.params.id));
  
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  complaint.status = status;
  complaint.updated_at = new Date().toISOString();
  
  res.json({ message: 'Status updated successfully' });
});

// Assign worker to complaint
app.put('/api/complaints/:id/assign', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({ message: 'Worker ID is required' });
  }

  const complaint = complaints.find(c => c.id === parseInt(req.params.id));
  
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  complaint.assigned_worker_id = parseInt(workerId);
  complaint.status = 'assigned';
  complaint.updated_at = new Date().toISOString();
  
  res.json({ message: 'Worker assigned successfully' });
});

// Submit feedback
app.post('/api/complaints/:id/feedback', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { rating, comments } = req.body;

  if (!rating) {
    return res.status(400).json({ message: 'Rating is required' });
  }

  const complaint = complaints.find(c => c.id === parseInt(req.params.id));
  
  if (!complaint) {
    return res.status(404).json({ message: 'Complaint not found' });
  }

  if (complaint.user_id !== req.session.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  complaint.feedback_rating = rating;
  complaint.feedback_comments = comments || null;
  complaint.status = 'completed';
  complaint.updated_at = new Date().toISOString();
  
  res.json({ message: 'Feedback submitted successfully' });
});

// ==================== USER ROUTES ====================

// Get all workers (for admin)
app.get('/api/users/workers', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const workers = users
    .filter(u => u.role === 'worker')
    .map(u => ({ id: u.id, name: u.name, email: u.email }));

  res.json({ workers });
});

// Get dashboard stats
app.get('/api/stats/dashboard', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    completed: complaints.filter(c => c.status === 'completed').length,
    totalUsers: users.filter(u => u.role === 'student').length,
    totalWorkers: users.filter(u => u.role === 'worker').length
  };

  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
