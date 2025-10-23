-- Add approval status for instructor approval workflow
-- This migration adds approval_status field to track pending signups

-- Create approval status enum
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval_status column to users table
ALTER TABLE users
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'approved';

-- Add index for filtering by approval status
CREATE INDEX idx_users_approval_status ON users(approval_status);

-- Update existing users to 'approved' (instructor should already be approved)
UPDATE users SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Comment
COMMENT ON COLUMN users.approval_status IS 'Instructor approval status for student registrations';
