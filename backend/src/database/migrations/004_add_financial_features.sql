-- Migration: Add financial features (withdrawals, goals, wallets)
-- Date: 2025-01-24

-- Create withdrawal status enum
CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Withdrawals Table
CREATE TABLE withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    wallet_address VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL DEFAULT 'TRC20', -- TRC20, ERC20, BEP20, etc.
    status withdrawal_status NOT NULL DEFAULT 'pending',
    transaction_hash VARCHAR(255) NULL, -- Blockchain tx hash when completed
    transaction_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount DECIMAL(10,2) NOT NULL, -- Amount after fee
    notes TEXT NULL,
    rejected_reason TEXT NULL,
    approved_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for withdrawals
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at);

-- Create trigger for withdrawals table
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Goals Table
CREATE TABLE user_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'earnings', 'recruits', 'network_size'
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    target_date DATE NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for user_goals
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_is_completed ON user_goals(is_completed);
CREATE INDEX idx_user_goals_type ON user_goals(goal_type);

-- Create trigger for user_goals table
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Wallets Table
CREATE TABLE user_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    wallet_type VARCHAR(50) NOT NULL, -- 'metamask', 'manual', 'trustwallet', etc.
    network VARCHAR(50) NOT NULL DEFAULT 'TRC20', -- TRC20, ERC20, BEP20
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    label VARCHAR(100) NULL, -- Optional nickname for wallet
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, wallet_address, network)
);

-- Create indexes for user_wallets
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON user_wallets(wallet_address);
CREATE INDEX idx_user_wallets_is_primary ON user_wallets(user_id, is_primary);

-- Create trigger for user_wallets table
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON user_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Deposits Table (for tracking incoming payments)
CREATE TABLE deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    wallet_address VARCHAR(255) NOT NULL,
    network VARCHAR(50) NOT NULL,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
    confirmations INTEGER NOT NULL DEFAULT 0,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for deposits
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_tx_hash ON deposits(transaction_hash);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at);

-- Add withdrawal-related config
INSERT INTO system_config (config_key, config_value, data_type, description) VALUES
('min_withdrawal_amount', '10', 'float', 'Minimum withdrawal amount in USDT'),
('withdrawal_fee_percentage', '2', 'float', 'Withdrawal fee percentage'),
('withdrawal_fee_fixed', '1', 'float', 'Fixed withdrawal fee in USDT'),
('auto_approve_withdrawals', 'false', 'boolean', 'Auto-approve withdrawals under threshold'),
('auto_approve_threshold', '100', 'float', 'Auto-approve withdrawals under this amount');

-- Comments
COMMENT ON TABLE withdrawals IS 'User withdrawal requests and history';
COMMENT ON TABLE user_goals IS 'User-defined goals and progress tracking';
COMMENT ON TABLE user_wallets IS 'User cryptocurrency wallet addresses';
COMMENT ON TABLE deposits IS 'Incoming cryptocurrency deposits';
