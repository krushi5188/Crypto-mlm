-- 017_add_withdrawals_and_balance.sql

BEGIN;

-- Add balance to users table
ALTER TABLE users
ADD COLUMN balance NUMERIC(18, 2) DEFAULT 0.00;

-- Create withdrawals table
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMIT;
