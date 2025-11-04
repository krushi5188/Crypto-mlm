-- Add wallet_address to users table for Web3 login
ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42) UNIQUE;

-- Add an index for faster lookups by wallet address
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
