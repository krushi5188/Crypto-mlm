# Database Import Guide for Render.com

## Problem
Your Render PostgreSQL database is empty - no tables created yet. This causes all those errors about missing tables.

## Solution: Import Schema to Render Database

### Method 1: Via Render Shell (Recommended)

1. **Open Render Dashboard**
   - Go to https://dashboard.render.com
   - Click your PostgreSQL database (`atlas-network-db`)

2. **Go to Shell Tab**
   - Click **"Shell"** in the top navigation
   - Wait for shell to connect

3. **Get Schema File**
   ```bash
   # Download schema from GitHub
   curl -o /tmp/schema.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/schema.sql

   # Import to database
   psql $DATABASE_URL -f /tmp/schema.sql
   ```

4. **Import Migrations** (run these in order)
   ```bash
   # Download and run migrations
   curl -o /tmp/003.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/003_add_approval_status.sql
   psql $DATABASE_URL -f /tmp/003.sql

   curl -o /tmp/004.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/004_add_financial_features.sql
   psql $DATABASE_URL -f /tmp/004.sql

   curl -o /tmp/005.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/005_add_team_and_api_features.sql
   psql $DATABASE_URL -f /tmp/005.sql

   curl -o /tmp/006.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/006_upgrade_commission_system.sql
   psql $DATABASE_URL -f /tmp/006.sql

   curl -o /tmp/007.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/007_advanced_features.sql
   psql $DATABASE_URL -f /tmp/007.sql

   curl -o /tmp/008_fraud.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/008_fraud_detection.sql
   psql $DATABASE_URL -f /tmp/008_fraud.sql

   curl -o /tmp/008_avatar.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/008_add_avatar_column.sql
   psql $DATABASE_URL -f /tmp/008_avatar.sql

   curl -o /tmp/009.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/009_predictive_analytics.sql
   psql $DATABASE_URL -f /tmp/009.sql

   curl -o /tmp/010.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/010_marketing_campaigns.sql
   psql $DATABASE_URL -f /tmp/010.sql

   curl -o /tmp/011.sql https://raw.githubusercontent.com/krushi5188/Crypto-mlm/main/backend/src/database/migrations/011_team_messaging.sql
   psql $DATABASE_URL -f /tmp/011.sql
   ```

---

### Method 2: Via psql Connection String

If you have psql installed locally:

1. **Get Connection String**
   - Render Dashboard → Your Database → **Info** tab
   - Copy **"External Database URL"**

2. **Import Schema**
   ```bash
   # From your local machine
   psql "postgresql://user:password@host:port/database?sslmode=require" -f backend/src/database/schema.sql

   # Then run migrations
   psql "your-connection-string" -f backend/src/database/migrations/003_add_approval_status.sql
   # ... (repeat for all migrations)
   ```

---

### Method 3: Copy-Paste SQL (Slowest but Always Works)

1. **Open Render Shell**
2. **Type:** `psql $DATABASE_URL`
3. **Copy entire contents** of:
   - `backend/src/database/schema.sql`
   - Each migration file in order
4. **Paste into shell** and press Enter

---

## Verify Import

After importing, verify tables exist:

```sql
-- In Render shell or psql
\dt

-- You should see these tables:
-- users, referrals, transactions, system_config, achievements, ranks,
-- user_achievements, goals, wallets, withdrawals, security_events,
-- login_history, user_preferences, training_resources, team_events,
-- event_rsvps, message_templates, template_shares, webhooks,
-- webhook_deliveries, api_keys, api_usage, device_fingerprints,
-- ip_addresses, fraud_alerts, fraud_rules, network_stats,
-- retention_cohorts, conversion_funnels, ab_experiments,
-- ab_experiment_variants, ab_experiment_events, campaigns,
-- campaign_recipients, drip_steps, team_channels, channel_messages
```

---

## After Import

1. **Restart your web service** on Render
2. **Visit your app:** https://crypto-mlm.onrender.com
3. **Login with:**
   - Email: `admin@atlasnetwork.com`
   - Password: `YourSecurePassword123!` (or what you set in env)

---

## Troubleshooting

**If you see "permission denied":**
- Make sure you're connected to the right database
- The DATABASE_URL environment variable should be set

**If tables still don't exist:**
- Check for errors in the SQL output
- Make sure you ran schema.sql BEFORE migrations

**If you see "relation already exists":**
- That's OK! It means tables are already there
- Continue with next migrations
