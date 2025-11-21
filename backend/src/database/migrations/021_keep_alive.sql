-- Migration: Keep Alive Mechanism
-- Attempts to install and schedule a pg_cron job to keep the database active.
-- Note: This relies on the 'pg_cron' extension which is available on Supabase.

BEGIN;

-- 1. Attempt to enable pg_cron extension
-- This might fail if the user lacks superuser permissions, but Supabase usually allows it.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the job
DO $$
DECLARE
    job_exists boolean;
BEGIN
    -- Check if the 'cron' schema and 'schedule' function exist
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron') THEN

        -- Unschedule existing job if it exists to prevent duplicates
        PERFORM cron.unschedule('supa_keep_alive');

        -- Schedule a job to run every 6 hours (0 */6 * * *)
        -- This executes a simple query 'SELECT 1' to generate internal activity.
        PERFORM cron.schedule('supa_keep_alive', '0 */6 * * *', 'SELECT 1');

        RAISE NOTICE 'Keep-alive cron job scheduled successfully.';
    ELSE
        RAISE NOTICE 'pg_cron extension not active. Skipping keep-alive schedule.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to schedule keep-alive job: %', SQLERRM;
END $$;

COMMIT;
