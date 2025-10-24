-- Migration: Add team management and API enhancement features
-- Date: 2025-01-24

-- Create resource type enum
CREATE TYPE resource_type AS ENUM ('document', 'video', 'image', 'link', 'template');

-- Training Resources Table
CREATE TABLE training_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    resource_type resource_type NOT NULL,
    file_url TEXT NULL, -- For uploaded files or external links
    content TEXT NULL, -- For text-based templates
    thumbnail_url TEXT NULL,
    category VARCHAR(100) NULL,
    tags TEXT[] NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_resources_type ON training_resources(resource_type);
CREATE INDEX idx_training_resources_category ON training_resources(category);
CREATE INDEX idx_training_resources_created_by ON training_resources(created_by);

-- Resource Access Log (track who viewed what)
CREATE TABLE resource_access_log (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES training_resources(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL, -- 'view', 'download', 'share'
    accessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resource_access_resource ON resource_access_log(resource_id);
CREATE INDEX idx_resource_access_user ON resource_access_log(user_id);

-- Team Events/Webinars Table
CREATE TABLE team_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'webinar', 'training', 'meeting', 'announcement'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    meeting_link TEXT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern VARCHAR(50) NULL, -- 'daily', 'weekly', 'monthly'
    max_attendees INTEGER NULL,
    current_attendees INTEGER NOT NULL DEFAULT 0,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_events_start_time ON team_events(start_time);
CREATE INDEX idx_team_events_type ON team_events(event_type);
CREATE INDEX idx_team_events_created_by ON team_events(created_by);

-- Event Attendees Table
CREATE TABLE event_attendees (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES team_events(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'attended'
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP NULL,
    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);

-- Message Templates Table
CREATE TABLE message_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'social', 'whatsapp'
    subject VARCHAR(255) NULL,
    content TEXT NOT NULL,
    variables JSONB NULL, -- Available variables like {{name}}, {{link}}, etc.
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_templates_type ON message_templates(template_type);

-- Referral Shares Log (track sharing activity)
CREATE TABLE referral_shares (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'whatsapp', 'telegram', 'email', 'link'
    template_id INTEGER NULL REFERENCES message_templates(id) ON DELETE SET NULL,
    shared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_shares_user ON referral_shares(user_id);
CREATE INDEX idx_referral_shares_platform ON referral_shares(platform);
CREATE INDEX idx_referral_shares_date ON referral_shares(shared_at);

-- API Keys Table (for public API access)
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    api_secret VARCHAR(64) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of allowed endpoints/scopes
    rate_limit_per_hour INTEGER NOT NULL DEFAULT 1000,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- API Request Log (for rate limiting and monitoring)
CREATE TABLE api_request_log (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER NULL REFERENCES api_keys(id) ON DELETE SET NULL,
    user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    response_status INTEGER NOT NULL,
    response_time_ms INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_request_log_api_key ON api_request_log(api_key_id);
CREATE INDEX idx_api_request_log_endpoint ON api_request_log(endpoint);
CREATE INDEX idx_api_request_log_created_at ON api_request_log(created_at);

-- Webhooks Table
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- ['withdrawal.created', 'goal.completed', etc.]
    secret VARCHAR(255) NOT NULL, -- For signature verification
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    retry_count INTEGER NOT NULL DEFAULT 3,
    last_triggered_at TIMESTAMP NULL,
    last_status VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(is_active);

-- Webhook Delivery Log
CREATE TABLE webhook_deliveries (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER NULL,
    response_body TEXT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- Cache Table (for performance optimization)
CREATE TABLE cache_entries (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    cache_value JSONB NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX idx_cache_entries_expires ON cache_entries(expires_at);

-- Team Performance Metrics (aggregated data)
CREATE TABLE team_performance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    new_recruits INTEGER NOT NULL DEFAULT 0,
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    network_growth INTEGER NOT NULL DEFAULT 0,
    active_members INTEGER NOT NULL DEFAULT 0,
    rank_position INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, metric_date)
);

CREATE INDEX idx_team_performance_user ON team_performance(user_id);
CREATE INDEX idx_team_performance_date ON team_performance(metric_date);
CREATE INDEX idx_team_performance_earnings ON team_performance(total_earnings DESC);

-- Triggers for updated_at columns
CREATE TRIGGER update_training_resources_updated_at BEFORE UPDATE ON training_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_events_updated_at BEFORE UPDATE ON team_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default message templates
INSERT INTO message_templates (name, template_type, subject, content, variables, is_default) VALUES
('Default Referral Email', 'email', 'Join me on Atlas Network!',
 E'Hi {{recipient_name}},\n\nI wanted to share an amazing opportunity with you! I''ve been part of Atlas Network and it''s been incredible.\n\nJoin my team using my referral link:\n{{referral_link}}\n\nBest regards,\n{{sender_name}}',
 '{"recipient_name": "Recipient''s name", "sender_name": "Your name", "referral_link": "Your referral link"}',
 true),

('Social Media Post', 'social', NULL,
 E'🚀 Building wealth with crypto MLM! Join my team and start earning today.\n\n💰 Passive income potential\n👥 Amazing community\n📈 Proven system\n\nUse my link: {{referral_link}}\n\n#CryptoMLM #PassiveIncome #NetworkMarketing',
 '{"referral_link": "Your referral link"}',
 true),

('WhatsApp Message', 'whatsapp', NULL,
 E'Hey! 👋\n\nI''ve found an amazing opportunity and I thought of you!\n\nI''m building a team in crypto MLM and we''re seeing great results. Want to join?\n\nCheck it out: {{referral_link}}',
 '{"referral_link": "Your referral link"}',
 true),

('Welcome Email', 'email', 'Welcome to the Team!',
 E'Welcome {{new_member_name}}! 🎉\n\nI''m {{sponsor_name}}, and I''m excited to have you on my team!\n\nHere are your next steps:\n1. Complete your profile\n2. Set up your wallet\n3. Share your referral link\n\nLet''s grow together!\n\nYour referral link: {{referral_link}}',
 '{"new_member_name": "New member name", "sponsor_name": "Your name", "referral_link": "Their referral link"}',
 true);

-- Add system config for new features
INSERT INTO system_config (config_key, config_value, data_type, description) VALUES
('enable_webhooks', 'true', 'boolean', 'Enable webhook functionality'),
('webhook_timeout_seconds', '30', 'integer', 'Webhook request timeout'),
('api_rate_limit_enabled', 'true', 'boolean', 'Enable API rate limiting'),
('default_rate_limit_per_hour', '1000', 'integer', 'Default API rate limit per hour'),
('cache_enabled', 'true', 'boolean', 'Enable caching layer'),
('cache_default_ttl_seconds', '300', 'integer', 'Default cache TTL in seconds'),
('max_file_upload_size_mb', '50', 'integer', 'Maximum file upload size in MB'),
('enable_team_events', 'true', 'boolean', 'Enable team events/webinars feature');

-- Comments
COMMENT ON TABLE training_resources IS 'Training materials and resources library';
COMMENT ON TABLE team_events IS 'Scheduled team events, webinars, and meetings';
COMMENT ON TABLE message_templates IS 'Pre-written message templates for sharing';
COMMENT ON TABLE referral_shares IS 'Tracks referral link sharing activity';
COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON TABLE api_request_log IS 'API usage tracking and rate limiting';
COMMENT ON TABLE webhooks IS 'Webhook subscriptions for external systems';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery attempts and responses';
COMMENT ON TABLE cache_entries IS 'Application-level cache for performance';
COMMENT ON TABLE team_performance IS 'Daily team performance metrics';
