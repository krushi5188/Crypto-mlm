-- Migration: Add Promotions System
-- Adds tables for managing promotions and user sign-ups for them.

BEGIN;

-- 1. Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- e.g., 'referral_milestone'
    rules JSONB NOT NULL, -- e.g., '{"referrals_required": 10}'
    reward_amount DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);

-- 2. User Promotions Table
CREATE TABLE IF NOT EXISTS user_promotions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    signed_up_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, promotion_id)
);

CREATE INDEX IF NOT EXISTS idx_user_promotions_user_id ON user_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promotions_promotion_id ON user_promotions(promotion_id);

COMMIT;
