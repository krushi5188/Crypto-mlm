-- Migration: Add Commission Tier System
-- 1. Adds commission_tier to users (the override)
-- 2. Adds default_commission_tier to user_ranks (the automation rule)

BEGIN;

-- Add commission_tier to users table
ALTER TABLE users ADD COLUMN commission_tier INTEGER NULL;
COMMENT ON COLUMN users.commission_tier IS 'Override for commission calculation. If set, user is treated as being at this depth tier.';

-- Add default_commission_tier to user_ranks table
ALTER TABLE user_ranks ADD COLUMN default_commission_tier INTEGER NULL;
COMMENT ON COLUMN user_ranks.default_commission_tier IS 'The commission tier automatically assigned when achieving this rank.';

-- Update existing ranks with tiers and descriptive perks
-- Assumption: Tier 1 is best (Top), Tier 10 is worst (Bottom)
UPDATE user_ranks SET default_commission_tier = 10, perks = '{"benefit": "Standard Commission rates"}' WHERE rank_name = 'Starter';
UPDATE user_ranks SET default_commission_tier = 8,  perks = '{"benefit": "Tier 8 Commission (Higher Payouts)"}' WHERE rank_name = 'Bronze';
UPDATE user_ranks SET default_commission_tier = 6,  perks = '{"benefit": "Tier 6 Commission (Bronze + Bonus)"}' WHERE rank_name = 'Silver';
UPDATE user_ranks SET default_commission_tier = 4,  perks = '{"benefit": "Tier 4 Commission (Gold Standard)"}' WHERE rank_name = 'Gold';
UPDATE user_ranks SET default_commission_tier = 3,  perks = '{"benefit": "Tier 3 Commission (Premium Payouts)"}' WHERE rank_name = 'Platinum';
UPDATE user_ranks SET default_commission_tier = 2,  perks = '{"benefit": "Tier 2 Commission (Elite Status)"}' WHERE rank_name = 'Diamond';
UPDATE user_ranks SET default_commission_tier = 1,  perks = '{"benefit": "Tier 1 Commission (Maximum Payout)"}' WHERE rank_name = 'Ambassador';

COMMIT;
