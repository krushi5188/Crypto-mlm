-- Migration 009: Predictive Analytics System
-- Description: Tables for storing predictions, forecasts, and analytics data

-- User Analytics Cache (stores computed analytics for performance)
CREATE TABLE user_analytics_cache (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Growth metrics
  avg_daily_earnings DECIMAL(10,2) DEFAULT 0,
  avg_weekly_earnings DECIMAL(10,2) DEFAULT 0,
  avg_monthly_earnings DECIMAL(10,2) DEFAULT 0,
  earnings_growth_rate DECIMAL(5,2) DEFAULT 0, -- percentage

  -- Network metrics
  avg_daily_recruits DECIMAL(5,2) DEFAULT 0,
  avg_weekly_recruits DECIMAL(5,2) DEFAULT 0,
  network_growth_rate DECIMAL(5,2) DEFAULT 0, -- percentage

  -- Activity metrics
  days_active INTEGER DEFAULT 0,
  days_inactive INTEGER DEFAULT 0,
  last_activity_date TIMESTAMP,
  activity_score DECIMAL(3,2) DEFAULT 0, -- 0-1 score

  -- Predictions
  predicted_30d_earnings DECIMAL(10,2) DEFAULT 0,
  predicted_90d_earnings DECIMAL(10,2) DEFAULT 0,
  predicted_30d_recruits INTEGER DEFAULT 0,
  churn_risk_score DECIMAL(3,2) DEFAULT 0, -- 0-1 score (higher = more likely to churn)
  churn_risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical

  -- Best times
  best_recruitment_day VARCHAR(10), -- Monday, Tuesday, etc
  best_recruitment_hour INTEGER, -- 0-23

  computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_analytics UNIQUE(user_id)
);

-- Network Growth Forecasts (system-wide predictions)
CREATE TABLE network_forecasts (
  id SERIAL PRIMARY KEY,
  forecast_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly
  forecast_date DATE NOT NULL,

  -- Predicted metrics
  predicted_new_users INTEGER,
  predicted_total_users INTEGER,
  predicted_total_earnings DECIMAL(12,2),
  predicted_active_users INTEGER,

  -- Confidence intervals
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  lower_bound DECIMAL(12,2),
  upper_bound DECIMAL(12,2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_forecast UNIQUE(forecast_type, forecast_date)
);

-- A/B Test Experiments
CREATE TABLE ab_experiments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  experiment_type VARCHAR(50) NOT NULL, -- ui_variant, commission_rate, message_template
  status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed

  -- Variants (stored as JSON)
  variant_a JSONB NOT NULL, -- control
  variant_b JSONB NOT NULL, -- treatment
  variant_c JSONB, -- optional third variant

  -- Traffic allocation (percentages, must sum to 100)
  traffic_a INTEGER DEFAULT 50,
  traffic_b INTEGER DEFAULT 50,
  traffic_c INTEGER DEFAULT 0,

  -- Targeting
  target_role VARCHAR(20), -- student, instructor, all
  target_conditions JSONB, -- additional targeting rules

  -- Timeline
  start_date TIMESTAMP,
  end_date TIMESTAMP,

  -- Metrics to track
  primary_metric VARCHAR(100) NOT NULL, -- conversion_rate, earnings, retention, etc
  secondary_metrics JSONB, -- array of additional metrics

  -- Results
  winner_variant VARCHAR(10), -- a, b, c, or inconclusive
  statistical_significance DECIMAL(3,2), -- p-value

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B Test Assignments (which user sees which variant)
CREATE TABLE ab_assignments (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant VARCHAR(10) NOT NULL, -- a, b, or c
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_user_experiment UNIQUE(experiment_id, user_id)
);

-- A/B Test Events (track user actions in experiments)
CREATE TABLE ab_events (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant VARCHAR(10) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- conversion, click, signup, purchase, etc
  event_value DECIMAL(10,2), -- optional numeric value
  metadata JSONB, -- additional event data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_analytics_user ON user_analytics_cache(user_id);
CREATE INDEX idx_user_analytics_churn ON user_analytics_cache(churn_risk_level);
CREATE INDEX idx_network_forecasts_date ON network_forecasts(forecast_date);
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_assignments_user ON ab_assignments(user_id);
CREATE INDEX idx_ab_assignments_experiment ON ab_assignments(experiment_id);
CREATE INDEX idx_ab_events_experiment ON ab_events(experiment_id);
CREATE INDEX idx_ab_events_user ON ab_events(user_id);
CREATE INDEX idx_ab_events_created ON ab_events(created_at);

COMMENT ON TABLE user_analytics_cache IS 'Cached analytics and predictions per user';
COMMENT ON TABLE network_forecasts IS 'System-wide growth forecasts and predictions';
COMMENT ON TABLE ab_experiments IS 'A/B testing experiments configuration';
COMMENT ON TABLE ab_assignments IS 'User assignments to experiment variants';
COMMENT ON TABLE ab_events IS 'User actions tracked in A/B tests';
