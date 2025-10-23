-- Nexus Network Platform Database Schema
-- Database: PostgreSQL (Supabase)

-- Drop existing tables (for clean installation)
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;
DROP TYPE IF EXISTS admin_action_type CASCADE;
DROP TYPE IF EXISTS config_data_type CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'instructor');
CREATE TYPE transaction_type AS ENUM ('commission', 'injection', 'adjustment', 'reset');
CREATE TYPE admin_action_type AS ENUM ('pause', 'resume', 'reset', 'inject_coins', 'config_change', 'export_data', 'view_participant');
CREATE TYPE config_data_type AS ENUM ('string', 'integer', 'boolean', 'float', 'json');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    direct_recruits INTEGER NOT NULL DEFAULT 0,
    network_size INTEGER NOT NULL DEFAULT 0,
    referred_by_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL
);

-- Create indexes for users table
CREATE INDEX idx_users_referred_by ON users(referred_by_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_balance ON users(balance);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Referrals Table
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upline_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for referrals table
CREATE INDEX idx_referrals_user_id ON referrals(user_id);
CREATE INDEX idx_referrals_upline_id ON referrals(upline_id);
CREATE INDEX idx_referrals_level ON referrals(level);
CREATE INDEX idx_referrals_user_level ON referrals(user_id, level);
CREATE INDEX idx_referrals_upline_level ON referrals(upline_id, level);

-- Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type transaction_type NOT NULL,
    level INTEGER NULL CHECK (level IS NULL OR (level BETWEEN 1 AND 5)),
    triggered_by_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transactions table
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_triggered_by ON transactions(triggered_by_user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type ON transactions(type);

-- System Config Table
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    data_type config_data_type NOT NULL,
    description TEXT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NULL
);

-- Create index for system_config table
CREATE UNIQUE INDEX idx_system_config_key ON system_config(config_key);

-- Create trigger for system_config table
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin Actions Table
CREATE TABLE admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type admin_action_type NOT NULL,
    target_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    details JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL
);

-- Create indexes for admin_actions table
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX idx_admin_actions_target_user ON admin_actions(target_user_id);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, data_type, description) VALUES
('simulation_status', 'active', 'string', 'Current status: active or paused'),
('max_participants', '300', 'integer', 'Maximum number of members'),
('commission_level_1', '10', 'float', 'Level 1 commission percentage'),
('commission_level_2', '7', 'float', 'Level 2 commission percentage'),
('commission_level_3', '5', 'float', 'Level 3 commission percentage'),
('commission_level_4', '3', 'float', 'Level 4 commission percentage'),
('commission_level_5', '2', 'float', 'Level 5 commission percentage'),
('recruitment_fee', '100', 'float', 'Fee per recruitment in NexusCoins'),
('total_coins_distributed', '0', 'float', 'Total NexusCoins distributed as commissions'),
('total_recruitment_fees', '0', 'float', 'Total recruitment fees collected');

-- Comments
COMMENT ON TABLE users IS 'All user accounts (members and instructor)';
COMMENT ON TABLE referrals IS 'Referral tree relationships';
COMMENT ON TABLE transactions IS 'All NexusCoin movements and commissions';
COMMENT ON TABLE system_config IS 'Platform settings and state';
COMMENT ON TABLE admin_actions IS 'Audit log of instructor actions';
