-- HostelCare Database Schema for Supabase (PostgreSQL)

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'worker', 'supervisor')),
    student_id VARCHAR(50),
    hostel_block VARCHAR(100),
    room_number VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    media_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'review_board' CHECK (status IN ('review_board', 'pending', 'assigned', 'in_progress', 'completed', 'rejected')),
    assigned_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comments TEXT,
    deadline TIMESTAMP,
    support_count INTEGER DEFAULT 0,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_worker_id ON complaints(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON complaints(deadline);

-- Insert default admin user
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@hostelcare.com', '$2a$10$YourHashedPasswordHere', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default workers
INSERT INTO users (name, email, password, role, phone) 
VALUES 
    ('John Electrician', 'john@hostelcare.com', '$2a$10$YourHashedPasswordHere', 'worker', '9876543210'),
    ('Mike Plumber', 'mike@hostelcare.com', '$2a$10$YourHashedPasswordHere', 'worker', '9876543211')
ON CONFLICT (email) DO NOTHING;

-- Insert default supervisor
INSERT INTO users (name, email, password, role, phone) 
VALUES ('Sarah Supervisor', 'sarah@hostelcare.com', '$2a$10$YourHashedPasswordHere', 'supervisor', '9876543213')
ON CONFLICT (email) DO NOTHING;

-- Insert default student
INSERT INTO users (name, email, password, role, student_id, hostel_block, room_number, phone) 
VALUES ('Rahul Sharma', 'rahul@hostelcare.com', '$2a$10$YourHashedPasswordHere', 'student', 'STU001', 'Block A', '101', '9876543212')
ON CONFLICT (email) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
