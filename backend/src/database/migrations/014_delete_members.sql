-- WARNING: This script will permanently delete all users with the 'member' role.
-- It is intended to be run once to transition to a wallet-only system.

DELETE FROM users WHERE role = 'member';
