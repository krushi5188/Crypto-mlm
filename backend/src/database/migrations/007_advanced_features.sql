-- Migration 007: Advanced Features (Safe Version with IF NOT EXISTS)
-- Adds tables for 2FA, activity logs, achievements, custom referral links, analytics tracking

BEGIN;

-- ============================================
-- 1. TWO-FACTOR AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS user_2fa (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes TEXT[],
    enabled_at TIMESTAMP NULL,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON user_2fa(is_enabled);

COMMENT ON TABLE user_2fa IS '2FA settings and secrets for users';

-- ============================================
-- 2. LOGIN HISTORY & SECURITY
-- ============================================

CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    device_info JSONB NULL,
    location_info JSONB NULL,
    login_method VARCHAR(50) NOT NULL DEFAULT 'password',
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success);

COMMENT ON TABLE login_history IS 'Complete login history for security auditing';

-- ============================================
-- 3. SECURITY EVENTS & ALERTS
-- ============================================

DO $$ BEGIN
    CREATE TYPE security_event_type AS ENUM (
        'suspicious_login',
        'failed_login_attempts',
        'password_change',
        '2fa_enabled',
        '2fa_disabled',
        'unusual_activity',
        'account_locked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE security_event_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS security_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type security_event_type NOT NULL,
    severity security_event_severity NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    metadata JSONB NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP NULL,
    resolved_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(is_resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);

COMMENT ON TABLE security_events IS 'Security events and alerts for monitoring';

-- ============================================
-- 4. ACHIEVEMENTS & GAMIFICATION
-- ============================================

DO $$ BEGIN
    CREATE TYPE achievement_category AS ENUM (
        'recruiting',
        'earnings',
        'network_building',
        'milestones',
        'special'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category achievement_category NOT NULL,
    icon VARCHAR(100) NULL,
    criteria JSONB NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    badge_color VARCHAR(7) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

COMMENT ON TABLE achievements IS 'Available achievements and their criteria';

CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    progress JSONB NULL,
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON user_achievements(unlocked_at);

COMMENT ON TABLE user_achievements IS 'User-earned achievements';

-- ============================================
-- 5. USER RANKS & LEVELS
-- ============================================

CREATE TABLE IF NOT EXISTS user_ranks (
    id SERIAL PRIMARY KEY,
    rank_name VARCHAR(50) UNIQUE NOT NULL,
    min_direct_recruits INTEGER NOT NULL DEFAULT 0,
    min_network_size INTEGER NOT NULL DEFAULT 0,
    min_total_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
    rank_order INTEGER NOT NULL,
    badge_icon VARCHAR(100) NULL,
    badge_color VARCHAR(7) NULL,
    perks JSONB NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_ranks_order ON user_ranks(rank_order);

COMMENT ON TABLE user_ranks IS 'Rank definitions and requirements';

-- Add current rank to users table
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS current_rank_id INTEGER NULL REFERENCES user_ranks(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS rank_achieved_at TIMESTAMP NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_rank ON users(current_rank_id);

-- ============================================
-- 6. LEADERBOARD SNAPSHOTS
-- ============================================

DO $$ BEGIN
    CREATE TYPE leaderboard_type AS ENUM ('weekly', 'monthly', 'all_time');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
    id SERIAL PRIMARY KEY,
    period_type leaderboard_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_type ON leaderboard_snapshots(period_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_period ON leaderboard_snapshots(period_start, period_end);

COMMENT ON TABLE leaderboard_snapshots IS 'Historical leaderboard data';

-- ============================================
-- 7. NOTIFICATIONS
-- ============================================

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'achievement_unlocked',
        'rank_up',
        'new_recruit',
        'commission_earned',
        'security_alert',
        'system_message'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

COMMENT ON TABLE notifications IS 'In-app notifications for users';

-- ============================================
-- 8. UPDATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_user_2fa_updated_at ON user_2fa;
CREATE TRIGGER update_user_2fa_updated_at BEFORE UPDATE ON user_2fa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. INSERT DEFAULT RANKS
-- ============================================

INSERT INTO user_ranks (rank_name, min_direct_recruits, min_network_size, min_total_earned, rank_order, badge_icon, badge_color) VALUES
('Newbie', 0, 0, 0, 1, '🌱', '#95a5a6'),
('Starter', 1, 1, 10, 2, '⭐', '#3498db'),
('Builder', 3, 5, 50, 3, '🔨', '#2ecc71'),
('Recruiter', 5, 10, 100, 4, '🎯', '#f39c12'),
('Manager', 10, 25, 250, 5, '👔', '#e74c3c'),
('Director', 20, 50, 500, 6, '💼', '#9b59b6'),
('Executive', 50, 100, 1000, 7, '👑', '#e67e22'),
('Diamond', 100, 250, 2500, 8, '💎', '#1abc9c')
ON CONFLICT (rank_name) DO NOTHING;

-- ============================================
-- 10. INSERT DEFAULT ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (code, name, description, category, icon, criteria, points, badge_color) VALUES
('first_recruit', 'First Recruit', 'Successfully recruit your first member', 'recruiting', '🎉', '{"direct_recruits": 1}', 10, '#3498db'),
('five_recruits', '5 Recruits', 'Build a team of 5 direct recruits', 'recruiting', '🌟', '{"direct_recruits": 5}', 25, '#2ecc71'),
('ten_recruits', '10 Recruits', 'Build a team of 10 direct recruits', 'recruiting', '⭐', '{"direct_recruits": 10}', 50, '#f39c12'),
('first_100', 'First 100 AC', 'Earn your first 100 AC', 'earnings', '💰', '{"total_earned": 100}', 15, '#e74c3c'),
('first_1000', 'First 1000 AC', 'Earn 1000 AC in total', 'earnings', '💎', '{"total_earned": 1000}', 75, '#9b59b6'),
('network_50', 'Network of 50', 'Build a network of 50 members', 'network_building', '🌐', '{"network_size": 50}', 40, '#1abc9c'),
('network_100', 'Network of 100', 'Build a network of 100 members', 'network_building', '🚀', '{"network_size": 100}', 80, '#e67e22'),
('early_bird', 'Early Bird', 'One of the first 100 members', 'special', '🐦', '{"user_id_below": 100}', 20, '#3498db')
ON CONFLICT (code) DO NOTHING;

COMMIT;
