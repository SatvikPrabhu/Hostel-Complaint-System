# HostelCare - Smart Hostel Grievance Management System

A comprehensive digital platform for managing hostel maintenance complaints efficiently. HostelCare enables students to report issues, administrators to manage complaints, and workers to track and resolve assigned tasks through a centralized platform.

## Features

### For Students
- **Secure Registration & Login**: Create accounts with hostel details (block, room number)
- **Complaint Submission**: Report issues with categories (electrical, plumbing, sanitation, infrastructure, furniture, other)
- **Priority Levels**: Set complaint priority (low, medium, high, urgent)
- **Media Upload**: Attach images/videos to provide visual evidence
- **Real-time Status Tracking**: Monitor complaint progress through dashboard
- **Feedback System**: Rate and provide feedback on completed work
- **Complaint History**: View all submitted complaints and their status

### For Administrators
- **Centralized Dashboard**: View all complaints with comprehensive statistics
- **Worker Assignment**: Assign maintenance workers to specific complaints
- **Status Management**: Update complaint statuses and track progress
- **Filter & Search**: Filter complaints by status
- **Worker Management**: View available maintenance workers
- **Analytics**: Dashboard with total, pending, in-progress, and completed statistics

### For Workers
- **Task Dashboard**: View assigned complaints and tasks
- **Status Updates**: Update task status (start work, mark complete)
- **Complaint Details**: View full complaint details with location and student info
- **Media Viewing**: Access attached images/videos for better understanding
- **Feedback Review**: View student ratings and comments

## Tech Stack

### Frontend
- **React.js**: UI framework
- **Tailwind CSS**: Styling
- **React Router**: Navigation
- **Axios**: HTTP client
- **Lucide React**: Icons

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **In-Memory Storage**: Data stored in memory (no database required)
- **Multer**: File upload handling
- **Bcryptjs**: Password hashing
- **Express Session**: Session management (without JWT)

## Project Structure

```
Hostel-Complaint-System/
├── client/                 # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── WorkerDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                 # Express backend
│   ├── index.js           # Main server file
│   └── uploads/           # Uploaded media files
├── package.json           # Root dependencies
├── .env                   # Environment variables
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
cd Hostel-Complaint-System
```

### Step 2: Install Backend Dependencies
```bash
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd client
npm install
cd ..
```

### Step 4: Start the Application

**Terminal 1 - Start Backend Server:**
```bash
npm start
```
Backend will run on `http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
```
Frontend will run on `http://localhost:3000`

## Default Credentials

The system comes with pre-configured demo accounts:

### Admin
- **Email**: admin@hostelcare.com
- **Password**: password

### Student
- **Email**: rahul@hostelcare.com
- **Password**: password
- **Details**: Block A, Room 101

### Workers
- **Email**: john@hostelcare.com
- **Password**: password (Electrician)
- **Email**: mike@hostelcare.com
- **Password**: password (Plumber)

## Usage Guide

### Student Workflow

1. **Login/Register**: Use your credentials or create a new account
2. **Submit Complaint**:
   - Click "New Complaint" button
   - Select category (electrical, plumbing, etc.)
   - Set priority level
   - Write detailed description
   - Optionally upload an image
   - Submit
3. **Track Status**: View your complaints in the dashboard with real-time status updates
4. **Provide Feedback**: When a complaint is completed, rate the service (1-5 stars)

### Admin Workflow

1. **Login**: Use admin credentials
2. **View Dashboard**: See statistics (total, pending, in-progress, completed complaints)
3. **Manage Complaints**:
   - View all complaints in a table format
   - Filter by status
   - Assign workers to pending complaints
   - Update complaint statuses
4. **Monitor Progress**: Track which workers are assigned to which complaints

### Worker Workflow

1. **Login**: Use worker credentials
2. **View Assigned Tasks**: See all complaints assigned to you
3. **Update Status**:
   - Click "Start Work" when you begin working on a complaint
   - Click "Mark Complete" when the work is finished
4. **View Feedback**: See student ratings and comments after completion

## Data Structure

The system uses in-memory storage with the following data structures:

### User Object
- `id`: Unique identifier
- `name`: User full name
- `email`: Email address
- `password`: Hashed password
- `role`: student, admin, or worker
- `studentId`: Student ID (for students)
- `hostelBlock`: Hostel block (for students)
- `roomNumber`: Room number (for students)
- `phone`: Phone number

### Complaint Object
- `id`: Unique identifier
- `user_id`: User who created the complaint
- `category`: Complaint category
- `description`: Detailed description
- `priority`: low, medium, high, urgent
- `media_path`: Path to uploaded media file
- `status`: pending, assigned, in_progress, completed, rejected
- `assigned_worker_id`: Worker assigned to the complaint
- `feedback_rating`: Student rating (1-5)
- `feedback_comments`: Student feedback text
- `created_at`: Timestamp
- `updated_at`: Timestamp

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Complaints
- `POST /api/complaints` - Create new complaint (with file upload)
- `GET /api/complaints` - Get all complaints (admin only)
- `GET /api/complaints/my` - Get user's complaints
- `GET /api/complaints/assigned` - Get worker's assigned complaints
- `GET /api/complaints/:id` - Get single complaint details
- `PUT /api/complaints/:id/status` - Update complaint status
- `PUT /api/complaints/:id/assign` - Assign worker to complaint
- `POST /api/complaints/:id/feedback` - Submit feedback

### Users
- `GET /api/users/workers` - Get all workers (admin only)

### Statistics
- `GET /api/stats/dashboard` - Get dashboard statistics (admin only)

## Features Implemented

✅ User Registration & Login (without JWT)
✅ Role-based access control (Student, Admin, Worker)
✅ Complaint submission with categories
✅ Priority levels for complaints
✅ Media upload (images/videos)
✅ Real-time status tracking
✅ Admin dashboard with statistics
✅ Worker assignment system
✅ Complaint filtering
✅ Feedback mechanism
✅ Complaint history
✅ Responsive UI with Tailwind CSS
✅ Professional and modern design

## Future Enhancements

- Email notifications for status updates
- SMS alerts for urgent complaints
- Analytics and reporting dashboard
- Mobile app (React Native)
- Advanced search functionality
- Complaint escalation system
- Multi-language support
- Dark mode theme

## Troubleshooting

### Data Persistence
- Data is stored in memory and will be lost when the server restarts
- For production use, consider integrating a database (MySQL, MongoDB, PostgreSQL)
- All data resets on server restart

### File Upload Issues
- Ensure `server/uploads` directory exists and is writable
- Check file size limits (max 10MB)
- Verify allowed file types (jpeg, jpg, png, gif, mp4, webm)

### CORS Issues
- Backend runs on port 5000
- Frontend runs on port 3000
- CORS is enabled in the backend

### Session Issues
- Sessions are stored in memory
- For production, use Redis or a session store
- Session expires after 24 hours

## License

This project is created for educational purposes.

## Contact

For support or questions, please contact the development team.

---

**HostelCare** - Making hostel maintenance management smarter and more efficient! 🏠
