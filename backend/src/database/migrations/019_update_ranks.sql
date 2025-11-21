-- Migration: Seed Named Ranks and Update Rank System
-- This migration inserts/updates the rank definitions to use the "Named Levels" scheme.

BEGIN;

-- 1. Ensure user_ranks table exists (it should from 007, but safety first)
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

-- 2. Upsert the Ranks (Starter -> Diamond)
-- We use ON CONFLICT to update existing rows if the migration 007 already ran.
INSERT INTO user_ranks (rank_name, min_direct_recruits, min_network_size, min_total_earned, rank_order, badge_icon, badge_color) VALUES
('Starter', 0, 0, 0, 1, '🌱', '#95a5a6'),
('Bronze', 3, 10, 50, 2, '🥉', '#cd7f32'),
('Silver', 10, 50, 250, 3, '🥈', '#c0c0c0'),
('Gold', 25, 100, 1000, 4, '🥇', '#ffd700'),
('Platinum', 50, 250, 2500, 5, '💠', '#e5e4e2'),
('Diamond', 100, 500, 5000, 6, '💎', '#b9f2ff'),
('Ambassador', 250, 1000, 10000, 7, '👑', '#9b59b6')
ON CONFLICT (rank_name) DO UPDATE SET
    min_direct_recruits = EXCLUDED.min_direct_recruits,
    min_network_size = EXCLUDED.min_network_size,
    min_total_earned = EXCLUDED.min_total_earned,
    rank_order = EXCLUDED.rank_order,
    badge_icon = EXCLUDED.badge_icon,
    badge_color = EXCLUDED.badge_color;

-- 3. Add 'is_manual_override' column to users table
-- This flag prevents the automatic system from downgrading a manually promoted user.
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN manual_rank_override BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

COMMIT;
