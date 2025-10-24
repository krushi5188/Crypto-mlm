-- Migration: Upgrade to Dynamic Commission System
-- Removes 5-level constraints and adds developer pool tracking

BEGIN;

-- Step 1: Remove level constraints
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_level_check;
ALTER TABLE referrals ADD CONSTRAINT referrals_level_check CHECK (level >= 1);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_level_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_level_check CHECK (level IS NULL OR level >= 1);

-- Step 2: Remove old commission config
DELETE FROM system_config WHERE config_key IN (
  'commission_level_1',
  'commission_level_2',
  'commission_level_3',
  'commission_level_4',
  'commission_level_5'
);

-- Step 3: Add new commission config
INSERT INTO system_config (config_key, config_value, data_type, description) VALUES
('commission_direct_fixed', '10', 'float', 'Direct inviter fixed commission (10 AC)'),
('commission_level_1_cap', '4', 'float', 'Level 1 (top) maximum commission cap (4 AC)'),
('commission_pool_total', '30', 'float', 'Total pool for chain distribution (30 AC)'),
('commission_decrement_start', '0.1', 'float', 'Starting decrement between levels (0.1 AC)'),
('commission_minimum_payout', '0.5', 'float', 'Minimum payout per level (0.5 AC)'),
('developer_pool_balance', '0', 'float', 'Developer pool accumulated balance'),
('total_to_developer_pool', '0', 'float', 'Total AC sent to developer pool')
ON CONFLICT (config_key) DO NOTHING;

COMMIT;
