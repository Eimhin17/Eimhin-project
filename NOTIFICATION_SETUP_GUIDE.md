# 📱 Notification Setup Guide

This guide explains how to set up automatic scheduled notifications for your dating app.

## ✅ Already Working (No Setup Needed)

These notifications send **automatically** when events happen:
- ✅ New Like notifications
- ✅ New Match notifications
- ✅ New Message notifications

## 🔔 Scheduled Notifications (Require Setup)

These need a scheduling mechanism to run automatically:
- Daily engagement reminders
- Weekly summaries
- Re-engagement for inactive users
- Prime time notifications
- Profile completion reminders

---

## Setup Options

### Option 1: Supabase pg_cron (Recommended - Pro Plan Only)

**Requirements:** Supabase Pro plan or above

**Steps:**

1. **Deploy Edge Functions**
```bash
# Deploy the notification edge functions
supabase functions deploy send-engagement-notification
supabase functions deploy scheduled-notifications
```

2. **Set up Service Role Key**
```sql
-- In Supabase SQL Editor, set your service role key
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
```

3. **Run the Cron Setup SQL**
- Open `database/setup-notification-cron.sql`
- Replace `YOUR_PROJECT_ID` with your actual Supabase project ID
- Run the SQL in your Supabase SQL Editor

4. **Verify Cron Jobs**
```sql
-- Check your scheduled jobs
SELECT * FROM cron.job;
```

**Schedule:**
- 📊 2 PM GMT - Daily engagement notifications
- 🔥 7 PM GMT - Prime time notifications
- 💫 11 PM GMT - Re-engagement checks

---

### Option 2: External Cron Service (Free Alternative)

**Use:** cron-job.org, EasyCron, or GitHub Actions

**Setup with cron-job.org:**

1. **Deploy Edge Functions**
```bash
supabase functions deploy send-engagement-notification
supabase functions deploy scheduled-notifications
```

2. **Get your Service Role Key**
   - Go to Supabase Dashboard → Settings → API
   - Copy your `service_role` key (keep it secret!)

3. **Create Cron Jobs on cron-job.org**

   Create these scheduled HTTP requests:

   **Daily Engagement (2 PM)**
   - URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-notifications`
   - Method: POST
   - Headers:
     ```
     Content-Type: application/json
     Authorization: Bearer YOUR_SERVICE_ROLE_KEY
     ```
   - Body: `{"type": "daily"}`
   - Schedule: Daily at 2:00 PM

   **Prime Time (7 PM)**
   - Same as above but:
   - Body: `{"type": "prime_time"}`
   - Schedule: Daily at 7:00 PM

   **Re-engagement (11 PM)**
   - Same as above but:
   - Body: `{"type": "re_engagement"}`
   - Schedule: Daily at 11:00 PM

---

### Option 3: Manual Triggers (Testing Only)

For testing, you can manually trigger notifications:

```bash
# Test daily engagement notification for a specific user
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-engagement-notification' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "user-id-here", "type": "daily"}'

# Test scheduled batch notification
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type": "daily"}'
```

---

## 📊 Notification Types

### Instant (Already Active)
- `new_like` - Someone liked you
- `new_match` - You matched with someone
- `new_message` - New chat message

### Scheduled (Need Setup)
- `daily` - Smart daily engagement (unread messages > unopened likes > new profiles)
- `weekly` - Weekly activity summary
- `re_engagement` - Bring back inactive users (3+ days)
- `prime_time` - Peak usage time reminder (7-10 PM)
- `unopened_likes_reminder` - Likes they haven't checked
- `unread_messages_reminder` - Messages they haven't read
- `new_profiles_reminder` - New people to swipe on
- `profile_completion_reminder` - Incomplete profile reminder

---

## 🔒 Security Notes

1. **Never commit service role keys** to git
2. Use environment variables for sensitive keys
3. The edge functions check if users have `push_notifications_enabled: true`
4. Notifications fail gracefully - app continues to work even if they fail

---

## 🧪 Testing Notifications

1. **Test Push Token Setup**
   - Open app on iOS/Android
   - Complete onboarding
   - Grant notification permissions
   - Check `push_tokens` table for your device token

2. **Test Instant Notifications**
   - Have someone like you (test account)
   - Match with someone
   - Send a message

3. **Test Scheduled Notifications**
   - Use manual curl commands above
   - Check Supabase Edge Function logs for errors

---

## 📈 Monitoring

Check notification performance:

```sql
-- View recent push tokens
SELECT * FROM push_tokens
WHERE is_active = true
ORDER BY last_used_at DESC
LIMIT 10;

-- Count users with notifications enabled
SELECT COUNT(*) FROM profiles
WHERE push_notifications_enabled = true
AND profile_completed = true;
```

---

## ❓ Troubleshooting

**Notifications not sending?**
1. Check user has `push_notifications_enabled: true`
2. Verify push token exists in `push_tokens` table
3. Check Supabase Edge Function logs
4. Ensure service role key is correct
5. Verify edge functions are deployed

**Cron jobs not running?**
1. Verify you have Supabase Pro plan (for pg_cron)
2. Check cron jobs are scheduled: `SELECT * FROM cron.job;`
3. Check cron job history: `SELECT * FROM cron.job_run_details;`
4. Verify URLs and auth headers are correct
