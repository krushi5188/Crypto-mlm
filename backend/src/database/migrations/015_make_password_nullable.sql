-- Migration: Make password_hash nullable
-- Date: 2025-11-02
-- Reason: To allow for wallet-only users who do not have a password.

ALTER TABLE users
ALTER COLUMN password_hash DROP NOT NULL;
