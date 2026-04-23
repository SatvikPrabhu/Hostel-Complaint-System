-- Migration script to add deadline, support_count, review_board status, and comments
-- Run this if you already have the complaints table without these columns

-- Add deadline column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- Add support_count column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS support_count INTEGER DEFAULT 0;

-- Add comments column to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add index for deadline
CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON complaints(deadline);

-- Update status constraint to include review_board
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check CHECK (status IN ('review_board', 'pending', 'assigned', 'in_progress', 'completed', 'rejected'));

-- Update supervisor role constraint if needed
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'admin', 'worker', 'supervisor'));

-- Insert default supervisor user if not exists
INSERT INTO users (name, email, password, role, phone) 
VALUES ('Sarah Supervisor', 'sarah@hostelcare.com', '$2a$10$YourHashedPasswordHere', 'supervisor', '9876543213')
ON CONFLICT (email) DO NOTHING;
