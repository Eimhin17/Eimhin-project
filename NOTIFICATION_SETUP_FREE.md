# 📱 Free Notification Setup (GitHub Actions)

The easiest and most reliable free way to set up scheduled notifications using GitHub Actions.

## ✅ What's Already Working

These notifications send **automatically** when events happen:
- New Like notifications
- New Match notifications
- New Message notifications

## 🆓 Free Scheduled Setup (5 minutes)

### Step 1: Deploy Edge Functions

```bash
# Make sure you're in your project directory
cd /Users/gregoryohare/Desktop/DebsMatch

# Login to Supabase (if not already)
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_ID

# Deploy the notification functions
npx supabase functions deploy send-engagement-notification
npx supabase functions deploy scheduled-notifications
```

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

   **Secret 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://YOUR_PROJECT_ID.supabase.co`

   **Secret 2:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key (from Supabase Dashboard → Settings → API)

### Step 3: Push the GitHub Actions Workflow

The workflow file is already created at `.github/workflows/scheduled-notifications.yml`

```bash
# Add and commit the workflow
git add .github/workflows/scheduled-notifications.yml
git commit -m "Add scheduled notifications workflow"
git push
```

### Step 4: Verify It's Working

1. Go to your GitHub repo → **Actions** tab
2. You should see "Scheduled Notifications" workflow
3. Click **Run workflow** to test manually
4. Select notification type (e.g., "daily") and run

## 📅 Schedule

The workflow runs automatically at:
- **2 PM GMT** - Daily engagement notifications
- **7 PM GMT** - Prime time notifications
- **11 PM GMT** - Re-engagement checks

### Adjust Timezone

The times are set for GMT (same as UTC). If you need a different timezone:

Edit `.github/workflows/scheduled-notifications.yml` and change the cron times:

```yaml
schedule:
  # For EST (GMT-5), add 5 hours to desired time
  - cron: '0 19 * * *'  # 2 PM EST = 19:00 GMT
  # For PST (GMT-8), add 8 hours to desired time
  - cron: '0 22 * * *'  # 2 PM PST = 22:00 GMT
```

**Cron time converter:** https://crontab.guru/

## 🧪 Testing

### Manual Test (Recommended First)
```bash
# Test daily engagement notification
curl -X POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/scheduled-notifications' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"type": "daily"}'
```

### GitHub Actions Test
1. Go to **Actions** tab in GitHub
2. Click **Scheduled Notifications** workflow
3. Click **Run workflow**
4. Select type and run

### Check Logs
- GitHub: Actions tab → Click workflow run → View logs
- Supabase: Dashboard → Edge Functions → View logs

## 💰 Costs

**Completely FREE** for:
- GitHub Actions: 2,000 minutes/month (free tier)
- These workflows use ~1 minute per run = ~120 minutes/month
- Supabase Edge Functions: 500,000 invocations/month (free tier)

## 🔒 Security

✅ Service role key stored securely in GitHub Secrets
✅ Not exposed in logs or code
✅ Only runs on your scheduled times
✅ Respects user notification preferences

## 📊 Monitor Performance

### Check if notifications are being sent:
```sql
-- View active push tokens
SELECT COUNT(*) as active_devices
FROM push_tokens
WHERE is_active = true;

-- Users with notifications enabled
SELECT COUNT(*) as users_with_notifications
FROM profiles
WHERE push_notifications_enabled = true
AND profile_completed = true;
```

### View GitHub Actions history:
- Go to **Actions** tab
- See all workflow runs, success/failure status
- View detailed logs for each run

## ❓ Troubleshooting

**Workflow not running?**
1. Check GitHub Actions is enabled: Settings → Actions → Allow all actions
2. Verify workflow file is in `.github/workflows/` directory
3. Make sure you pushed the file to GitHub

**Notifications not sending?**
1. Check secrets are set correctly in GitHub
2. Test edge functions manually with curl
3. View Supabase Edge Function logs for errors
4. Ensure users have `push_notifications_enabled: true`

**Wrong timezone?**
1. GitHub Actions uses UTC/GMT time
2. Convert your timezone to GMT for cron schedule
3. Example: 2 PM EST = 7 PM GMT = `cron: '0 19 * * *'`

## 🚀 Advanced: More Notification Types

Add more scheduled notifications by editing the workflow:

```yaml
schedule:
  # Morning motivation - 8 AM UTC
  - cron: '0 8 * * *'
  # Lunch break reminder - 12 PM UTC
  - cron: '0 12 * * *'
  # Weekend boost - Saturday 11 AM UTC
  - cron: '0 11 * * 6'
```

Then update the notification type logic in the workflow.
