-- Atlas Network Educational Simulator Database Schema
-- Database: atlas_network_simulator

-- Drop existing tables (for clean installation)
DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS referrals;
DROP TABLE IF EXISTS system_config;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'instructor') NOT NULL DEFAULT 'student',
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_earned DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    direct_recruits INT NOT NULL DEFAULT 0,
    network_size INT NOT NULL DEFAULT 0,
    referred_by_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login DATETIME NULL,
    INDEX idx_referred_by (referred_by_id),
    INDEX idx_created_at (created_at),
    INDEX idx_balance (balance),
    FOREIGN KEY (referred_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Referrals Table
CREATE TABLE referrals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    upline_id INT NOT NULL,
    level INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_upline_id (upline_id),
    INDEX idx_level (level),
    INDEX idx_user_level (user_id, level),
    INDEX idx_upline_level (upline_id, level),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (upline_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_level CHECK (level BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transactions Table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('commission', 'injection', 'adjustment', 'reset') NOT NULL,
    level INT NULL,
    triggered_by_user_id INT NULL,
    description TEXT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_triggered_by (triggered_by_user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (triggered_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_transaction_level CHECK (level IS NULL OR (level BETWEEN 1 AND 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Config Table
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    data_type ENUM('string', 'integer', 'boolean', 'float', 'json') NOT NULL,
    description TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) NULL,
    UNIQUE INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Actions Table
CREATE TABLE admin_actions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action_type ENUM('pause', 'resume', 'reset', 'inject_coins', 'config_change', 'export_data', 'view_participant') NOT NULL,
    target_user_id INT NULL,
    details JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_target_user (target_user_id),
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, data_type, description) VALUES
('simulation_status', 'active', 'string', 'Current status: active or paused'),
('max_participants', '300', 'integer', 'Maximum number of student participants'),
('semester_duration_days', '112', 'integer', 'Duration of semester in days (16 weeks)'),
('semester_start_date', CURDATE(), 'string', 'Start date of current semester'),
('commission_level_1', '10', 'float', 'Level 1 commission percentage'),
('commission_level_2', '7', 'float', 'Level 2 commission percentage'),
('commission_level_3', '5', 'float', 'Level 3 commission percentage'),
('commission_level_4', '3', 'float', 'Level 4 commission percentage'),
('commission_level_5', '2', 'float', 'Level 5 commission percentage'),
('recruitment_fee', '100', 'float', 'Fee per recruitment in NexusCoins'),
('total_coins_distributed', '0', 'float', 'Total NexusCoins distributed as commissions'),
('total_recruitment_fees', '0', 'float', 'Total recruitment fees collected');
