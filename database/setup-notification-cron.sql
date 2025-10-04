-- Enable pg_cron extension (Supabase Pro required)
-- This allows scheduled jobs to run automatically

-- Note: pg_cron is available on Supabase Pro plan and above
-- Run this in your Supabase SQL Editor

-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permission to use pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- ============================================
-- Daily Engagement Notifications (2 PM daily)
-- ============================================
SELECT cron.schedule(
    'daily-engagement-notifications',
    '0 14 * * *', -- Every day at 2 PM
    $$
    SELECT
      net.http_post(
        url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object('type', 'daily')
      ) as request_id;
    $$
);

-- ============================================
-- Prime Time Notifications (7 PM daily)
-- ============================================
SELECT cron.schedule(
    'prime-time-notifications',
    '0 19 * * *', -- Every day at 7 PM
    $$
    SELECT
      net.http_post(
        url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object('type', 'prime_time')
      ) as request_id;
    $$
);

-- ============================================
-- Re-engagement Notifications (11 PM daily)
-- ============================================
SELECT cron.schedule(
    're-engagement-notifications',
    '0 23 * * *', -- Every day at 11 PM
    $$
    SELECT
      net.http_post(
        url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := jsonb_build_object('type', 're_engagement')
      ) as request_id;
    $$
);

-- ============================================
-- View all scheduled jobs
-- ============================================
-- Run this to see all your cron jobs:
-- SELECT * FROM cron.job;

-- ============================================
-- To unschedule a job (if needed):
-- ============================================
-- SELECT cron.unschedule('job-name-here');

-- Examples:
-- SELECT cron.unschedule('daily-engagement-notifications');
-- SELECT cron.unschedule('prime-time-notifications');
-- SELECT cron.unschedule('re-engagement-notifications');
