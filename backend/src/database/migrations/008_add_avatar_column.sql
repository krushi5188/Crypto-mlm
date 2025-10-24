-- Migration 008: Add avatar_url column to users table
-- Description: Adds support for user profile pictures

-- Add avatar_url column
ALTER TABLE users
ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL;

-- Create index for faster avatar queries
CREATE INDEX idx_users_avatar ON users(id) WHERE avatar_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.avatar_url IS 'URL/path to user profile picture';
