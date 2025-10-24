-- Migration 010: Automated Marketing Campaigns
-- Description: Email campaigns, drip sequences, and automated marketing

-- Marketing Campaigns
CREATE TABLE marketing_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) NOT NULL, -- drip, one_time, recurring, behavioral
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, paused, completed

  -- Targeting
  target_audience VARCHAR(50) DEFAULT 'all', -- all, new_users, active, inactive, high_earners, etc
  target_conditions JSONB, -- additional filtering rules

  -- Trigger conditions (for behavioral campaigns)
  trigger_event VARCHAR(100), -- user_signup, first_referral, milestone_reached, inactive_30_days, etc
  trigger_delay_hours INTEGER DEFAULT 0,

  -- Email content
  subject_line VARCHAR(255),
  email_template TEXT,
  email_variables JSONB, -- variables to replace in template

  -- Scheduling (for recurring campaigns)
  schedule_type VARCHAR(20), -- immediate, scheduled, recurring
  schedule_time TIME,
  schedule_days VARCHAR(50), -- comma-separated: monday,wednesday,friday
  next_run_at TIMESTAMP,

  -- Stats
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drip Campaign Sequences (multi-step email sequences)
CREATE TABLE drip_sequences (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  delay_days INTEGER NOT NULL, -- days after previous email (or signup for first email)

  -- Email content
  subject_line VARCHAR(255) NOT NULL,
  email_template TEXT NOT NULL,
  email_variables JSONB,

  -- Stats
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_campaign_sequence UNIQUE(campaign_id, sequence_order)
);

-- Campaign Recipients (tracks who received what)
CREATE TABLE campaign_recipients (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sequence_step INTEGER, -- for drip campaigns

  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, opened, clicked, converted
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  converted_at TIMESTAMP,

  -- Tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates Library
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- welcome, milestone, inactive, promotional, etc
  subject_line VARCHAR(255) NOT NULL,
  template_body TEXT NOT NULL,
  available_variables JSONB, -- list of {{variable}} names that can be used
  preview_text VARCHAR(255),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Performance by Day (for analytics)
CREATE TABLE campaign_daily_stats (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,

  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  open_rate DECIMAL(5,2), -- percentage
  click_rate DECIMAL(5,2), -- percentage
  conversion_rate DECIMAL(5,2), -- percentage

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_campaign_date UNIQUE(campaign_id, stat_date)
);

CREATE INDEX idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX idx_campaigns_next_run ON marketing_campaigns(next_run_at);
CREATE INDEX idx_drip_campaign ON drip_sequences(campaign_id);
CREATE INDEX idx_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_recipients_user ON campaign_recipients(user_id);
CREATE INDEX idx_recipients_status ON campaign_recipients(status);
CREATE INDEX idx_templates_category ON email_templates(category);
CREATE INDEX idx_campaign_stats_date ON campaign_daily_stats(stat_date);

COMMENT ON TABLE marketing_campaigns IS 'Automated marketing campaigns and email sequences';
COMMENT ON TABLE drip_sequences IS 'Multi-step email sequences within campaigns';
COMMENT ON TABLE campaign_recipients IS 'Tracks campaign delivery and engagement per user';
COMMENT ON TABLE email_templates IS 'Reusable email templates library';
COMMENT ON TABLE campaign_daily_stats IS 'Daily performance metrics for campaigns';
