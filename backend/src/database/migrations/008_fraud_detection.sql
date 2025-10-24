-- Migration 008: Fraud Detection System
-- Adds risk scoring, device fingerprinting, IP tracking, and flagging capabilities

BEGIN;

-- ============================================
-- 1. ADD FRAUD DETECTION COLUMNS TO USERS
-- ============================================

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS flagged_reason TEXT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewed_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_risk_score ON users(risk_score);
CREATE INDEX IF NOT EXISTS idx_users_is_flagged ON users(is_flagged);

COMMENT ON COLUMN users.risk_score IS 'Fraud risk score from 0-100';
COMMENT ON COLUMN users.is_flagged IS 'Manually or automatically flagged for review';

-- ============================================
-- 2. DEVICE FINGERPRINTING
-- ============================================

CREATE TABLE IF NOT EXISTS device_fingerprints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_hash VARCHAR(64) NOT NULL,
    device_info JSONB NOT NULL,
    user_agent TEXT NOT NULL,
    browser VARCHAR(100) NULL,
    os VARCHAR(100) NULL,
    device_type VARCHAR(50) NULL,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_count INTEGER DEFAULT 1,
    is_suspicious BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_suspicious ON device_fingerprints(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_last_seen ON device_fingerprints(last_seen_at);

COMMENT ON TABLE device_fingerprints IS 'Track devices used to access accounts';

-- ============================================
-- 3. IP ADDRESS TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS ip_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    location_info JSONB NULL,
    isp VARCHAR(255) NULL,
    first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    login_count INTEGER DEFAULT 1,
    is_vpn BOOLEAN DEFAULT FALSE,
    is_proxy BOOLEAN DEFAULT FALSE,
    is_suspicious BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ip_addresses_user_id ON ip_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_ip_addresses_ip ON ip_addresses(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_addresses_suspicious ON ip_addresses(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_ip_addresses_last_seen ON ip_addresses(last_seen_at);

-- Composite index for finding shared IPs
CREATE INDEX IF NOT EXISTS idx_ip_addresses_shared ON ip_addresses(ip_address, user_id);

COMMENT ON TABLE ip_addresses IS 'Track IP addresses used to access accounts';

-- ============================================
-- 4. FRAUD DETECTION RULES
-- ============================================

DO $$ BEGIN
    CREATE TYPE fraud_rule_type AS ENUM (
        'multi_account_ip',
        'multi_account_device',
        'rapid_registration',
        'suspicious_transaction',
        'failed_login_threshold',
        'unusual_location',
        'bot_behavior'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS fraud_rules (
    id SERIAL PRIMARY KEY,
    rule_type fraud_rule_type UNIQUE NOT NULL,
    rule_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    threshold JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auto_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_rules_active ON fraud_rules(is_active);

COMMENT ON TABLE fraud_rules IS 'Configurable fraud detection rules';

-- ============================================
-- 5. FRAUD ALERTS
-- ============================================

DO $$ BEGIN
    CREATE TYPE fraud_alert_status AS ENUM ('pending', 'investigating', 'resolved', 'false_positive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS fraud_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_type fraud_rule_type NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    evidence JSONB NOT NULL,
    risk_score_contribution INTEGER NOT NULL,
    status fraud_alert_status DEFAULT 'pending',
    assigned_to INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_created_at ON fraud_alerts(created_at);

COMMENT ON TABLE fraud_alerts IS 'Fraud detection alerts and investigations';

-- ============================================
-- 6. RELATED ACCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS related_accounts (
    id SERIAL PRIMARY KEY,
    user_id_1 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    evidence JSONB NOT NULL,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id_1, user_id_2, relationship_type),
    CHECK (user_id_1 < user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_related_accounts_user1 ON related_accounts(user_id_1);
CREATE INDEX IF NOT EXISTS idx_related_accounts_user2 ON related_accounts(user_id_2);
CREATE INDEX IF NOT EXISTS idx_related_accounts_confidence ON related_accounts(confidence_score);

COMMENT ON TABLE related_accounts IS 'Detected relationships between potentially related accounts';

-- ============================================
-- 7. INSERT DEFAULT FRAUD RULES
-- ============================================

INSERT INTO fraud_rules (rule_type, rule_name, description, weight, threshold, auto_flag) VALUES
('multi_account_ip', 'Multiple Accounts - Same IP', 'Multiple accounts accessed from same IP address', 30, '{"max_accounts": 3}', true),
('multi_account_device', 'Multiple Accounts - Same Device', 'Multiple accounts accessed from same device', 25, '{"max_accounts": 2}', true),
('rapid_registration', 'Rapid Account Creation', 'Multiple accounts created in short time from same source', 20, '{"accounts": 3, "hours": 24}', false),
('failed_login_threshold', 'Failed Login Attempts', 'Excessive failed login attempts', 10, '{"attempts": 5, "minutes": 30}', false),
('suspicious_transaction', 'Suspicious Transaction Pattern', 'Unusual transaction patterns detected', 15, '{"threshold": "dynamic"}', false)
ON CONFLICT (rule_type) DO NOTHING;

-- ============================================
-- 8. USER PREFERENCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
    dashboard_layout JSONB DEFAULT '{}',
    hidden_widgets TEXT[] DEFAULT '{}',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    show_onboarding BOOLEAN DEFAULT TRUE,
    onboarding_step INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'User UI preferences and settings';

-- ============================================
-- 9. AVATAR SUPPORT
-- ============================================

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

COMMENT ON COLUMN users.avatar_url IS 'URL to user profile avatar image';

-- ============================================
-- 10. UPDATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_fraud_rules_updated_at ON fraud_rules;
CREATE TRIGGER update_fraud_rules_updated_at BEFORE UPDATE ON fraud_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. FUNCTIONS FOR FRAUD DETECTION
-- ============================================

-- Function to find accounts sharing IPs
CREATE OR REPLACE FUNCTION find_accounts_by_ip(target_ip VARCHAR(45))
RETURNS TABLE (
    user_id INTEGER,
    username VARCHAR(100),
    email VARCHAR(255),
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    login_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.email,
        ip.first_seen_at,
        ip.last_seen_at,
        ip.login_count
    FROM ip_addresses ip
    JOIN users u ON ip.user_id = u.id
    WHERE ip.ip_address = target_ip
    ORDER BY ip.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to find accounts sharing devices
CREATE OR REPLACE FUNCTION find_accounts_by_device(target_fingerprint VARCHAR(64))
RETURNS TABLE (
    user_id INTEGER,
    username VARCHAR(100),
    email VARCHAR(255),
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    login_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.username,
        u.email,
        df.first_seen_at,
        df.last_seen_at,
        df.login_count
    FROM device_fingerprints df
    JOIN users u ON df.user_id = u.id
    WHERE df.fingerprint_hash = target_fingerprint
    ORDER BY df.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMIT;
