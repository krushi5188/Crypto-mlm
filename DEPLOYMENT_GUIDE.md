# 🚀 Atlas Network - Unified Deployment Guide

Complete guide to deploy Atlas Network on **Vercel** OR **Render.com**. Choose the platform that works best for you!

---

## 📊 Platform Comparison

| Feature | Vercel | Render.com |
|---------|--------|------------|
| **Setup Complexity** | Medium | Easy (Blueprint) |
| **Frontend + Backend** | ✅ Unified | ✅ Unified |
| **Database Included** | ❌ (need external) | ✅ PostgreSQL included |
| **Free Tier** | ✅ Generous | ✅ Good |
| **Auto Deploy** | ✅ GitHub | ✅ GitHub |
| **Best For** | Global CDN, Fast | Full-stack, Simple setup |

**Quick Recommendation:**
- **Choose Vercel** if you want blazing fast global CDN for frontend
- **Choose Render.com** if you want everything in one place (simpler)

---

# Option 1: Deploy on Vercel 🔷

## Prerequisites
- GitHub account with this repo
- Vercel account (free) - https://vercel.com
- External database (Supabase or PlanetScale)

## Step 1: Setup Database (Choose One)

### Option A: Supabase (Recommended - PostgreSQL)

1. Go to https://supabase.com → Sign up
2. Click **"New project"**
3. Choose organization → Name: `atlas-network`
4. Generate a strong database password
5. Choose region closest to your users
6. Wait for project setup (~2 minutes)

**Get Connection Details:**
1. Go to **Settings** → **Database**
2. Scroll to **Connection string** → Select **URI** mode
3. Copy the connection string (starts with `postgresql://`)
4. Connection pooler settings:
   - Host: `aws-0-us-east-1.pooler.supabase.com`
   - Port: `6543` (transaction mode) or `5432` (session mode)
   - Database: `postgres`
   - User: `postgres.[your-project-ref]`
   - Password: Your database password

**Import Schema:**
1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New query"**
3. Copy contents from `backend/src/database/schema.sql`
4. Paste and click **"Run"**

### Option B: PlanetScale (MySQL - Alternative)

1. Go to https://planetscale.com → Sign up
2. Click **"Create a new database"**
3. Name: `atlas-network`, choose region
4. Click **"Create database"**
5. Get connection string from **"Connect"** → **"Node.js"**

**Import Schema:**
1. Install PlanetScale CLI: `brew install planetscale/tap/pscale`
2. `pscale auth login`
3. `pscale connect atlas-network main`
4. Import: `mysql -h 127.0.0.1 -P 3306 -u root < backend/src/database/schema.sql`

## Step 2: Deploy to Vercel

### Initial Setup

1. Go to https://vercel.com → Login with GitHub
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository: `Crypto-mlm`
4. **Important:** Leave **Root Directory** as **`.`** (root)
5. Click **"Deploy"** (will fail first time - expected!)

### Configure Environment Variables

1. Go to Project → **"Settings"** → **"Environment Variables"**
2. Add the following variables:

#### Database Variables (from Supabase/PlanetScale)
```env
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.[your-project-ref]
DB_PASSWORD=[your-database-password]
DB_SSL=true
```

#### Backend Variables
```env
NODE_ENV=production
JWT_SECRET=[generate-random-32-char-string]
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=instructor@university.edu
ADMIN_USERNAME=instructor
ADMIN_PASSWORD=YourSecurePassword123!
MAX_PARTICIPANTS=300
SEMESTER_DURATION_DAYS=112
RECRUITMENT_FEE=100
COMMISSION_LEVEL_1=10
COMMISSION_LEVEL_2=7
COMMISSION_LEVEL_3=5
COMMISSION_LEVEL_4=3
COMMISSION_LEVEL_5=2
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend Variables (placeholder first)
```env
VITE_API_BASE_URL=https://your-app.vercel.app/api/v1
VITE_APP_NAME=Atlas Network Simulator
VITE_REFERRAL_BASE_URL=https://your-app.vercel.app/register
FRONTEND_URL=https://your-app.vercel.app
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Redeploy with Environment Variables

1. Go to **"Deployments"** tab
2. Click **"..."** on latest deployment → **"Redeploy"**
3. Wait ~2-3 minutes for build

### Update URLs After First Deploy

1. Copy your actual Vercel URL (e.g., `crypto-mlm-abc123.vercel.app`)
2. Go back to **"Settings"** → **"Environment Variables"**
3. Edit these variables with your real URL:
```env
VITE_API_BASE_URL=https://[YOUR-URL].vercel.app/api/v1
VITE_REFERRAL_BASE_URL=https://[YOUR-URL].vercel.app/register
FRONTEND_URL=https://[YOUR-URL].vercel.app
```
4. Redeploy one more time

## Step 3: Verify Vercel Deployment

**Test Backend:**
```
https://your-app.vercel.app/api/v1/health
```
Should return: `{"status":"ok",...}`

**Test Frontend:**
```
https://your-app.vercel.app
```
Should show login page

**Login as Instructor:**
- Email: `instructor@university.edu`
- Password: `YourSecurePassword123!`

---

# Option 2: Deploy on Render.com 🟦

**Why Render?** Everything in one place - frontend, backend, and database!

## Prerequisites
- GitHub account with this repo
- Render.com account (free) - https://render.com

## Step 1: Deploy Using Blueprint (Easiest!)

### One-Click Deploy

1. Go to https://render.com → Sign up with GitHub
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository: `Crypto-mlm`
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

**What Gets Created:**
- ✅ PostgreSQL Database (5GB free)
- ✅ Backend API Web Service
- ✅ Frontend Static Site

### Configure Missing Environment Variables

After blueprint deployment, you need to set a few variables manually:

1. Go to **Backend API service** → **"Environment"**
2. Add/Update:
```env
ADMIN_PASSWORD=YourSecurePassword123!
FRONTEND_URL=https://[your-frontend-url].onrender.com
```

3. Go to **Frontend service** → **"Environment"**
4. Add/Update:
```env
VITE_API_BASE_URL=https://[your-backend-url].onrender.com/api/v1
VITE_REFERRAL_BASE_URL=https://[your-frontend-url].onrender.com/register
```

### Import Database Schema

1. Go to your **Database** → **"Connect"**
2. Click **"External Connection"** → Copy the **External Database URL**
3. Use any PostgreSQL client or terminal:
```bash
psql [paste-database-url-here] < backend/src/database/schema.sql
```

**Or use Render Shell:**
1. Go to **Database** → **"Shell"**
2. Copy/paste contents of `backend/src/database/schema.sql`
3. Execute

## Step 2: Verify Render Deployment

**Test Backend:**
```
https://atlas-network-api.onrender.com/api/v1/health
```

**Test Frontend:**
```
https://atlas-network-frontend.onrender.com
```

**Login as Instructor:**
- Email: `instructor@university.edu`
- Password: `YourSecurePassword123!`

---

# Manual Render Deployment (Alternative)

If you prefer manual setup over Blueprint:

## Step 1: Create PostgreSQL Database

1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Name: `atlas-network-db`
3. Database: `atlas_network`
4. User: `atlas_admin`
5. Region: Oregon (or nearest)
6. Plan: **Free**
7. Click **"Create Database"**
8. Import schema (see above)

## Step 2: Create Backend Web Service

1. Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `atlas-network-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Add Environment Variables (click **"Advanced"**):
   - Connect database (auto-populates DB_* variables)
   - Add all other variables from `.env.example`

5. Click **"Create Web Service"**

## Step 3: Create Frontend Static Site

1. Dashboard → **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `atlas-network-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Plan:** Free

4. Add Environment Variables:
   - `VITE_API_BASE_URL`: `https://[backend-url].onrender.com/api/v1`
   - `VITE_APP_NAME`: `Atlas Network Simulator`
   - `VITE_REFERRAL_BASE_URL`: `https://[frontend-url].onrender.com/register`

5. Click **"Create Static Site"**

---

# 🔄 Updates & Maintenance

## Automatic Deployments

Both platforms automatically redeploy when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

**Vercel:** Auto-rebuilds in ~2-3 minutes
**Render:** Auto-rebuilds in ~3-5 minutes

## Manual Redeployment

**Vercel:**
- Dashboard → Deployments → "..." → Redeploy

**Render:**
- Dashboard → Service → "Manual Deploy" → Deploy latest commit

---

# 🐛 Troubleshooting

## Common Issues

### "Database connection failed"
**Vercel:**
- Verify DB_* environment variables match your database provider
- Check database is running (Supabase/PlanetScale dashboard)
- Ensure IP whitelist includes Vercel IPs

**Render:**
- Check database service is running
- Verify connection string in environment variables
- Try database "Suspend & Resume"

### "API calls failing" / CORS errors
- Verify `FRONTEND_URL` matches your actual frontend URL
- No trailing slashes in URLs
- Both services must be deployed (frontend + backend)

### "502 Bad Gateway"
**Render specific:**
- Backend service is still starting (wait 2-3 minutes)
- Check backend logs: Service → Logs
- Verify `PORT` environment variable is set

### Frontend shows but API 404
- Check `VITE_API_BASE_URL` is correct
- Verify backend is deployed and healthy
- Test backend health endpoint directly

### Build failures
**Check logs:**
- **Vercel:** Deployments → Click deployment → Build Logs
- **Render:** Service → Events / Logs

**Common fixes:**
- Ensure `package.json` has correct scripts
- Check Node version compatibility
- Verify all dependencies in `package.json`

---

# 📊 Monitoring & Logs

## Vercel

**View Logs:**
1. Project → Deployments → Click deployment
2. Functions tab → See backend logs
3. Build Logs → See build process

**Monitoring:**
- Dashboard shows request counts, errors, build times
- Integrations → Add monitoring tools (LogDrain, etc.)

## Render

**View Logs:**
1. Service → Logs (live streaming)
2. Events → Deployment history
3. Metrics → CPU, Memory, Request counts

**Database:**
1. Database → Metrics → Connections, queries, storage
2. Logs → Database logs

---

# 💰 Cost Comparison

## Free Tier Limits

### Vercel Free
- ✅ 100GB bandwidth/month
- ✅ 6,000 build minutes/month
- ✅ Unlimited frontend deployments
- ❌ Database separate (Supabase/PlanetScale free tiers)

### Render Free
- ✅ 750 hours/month (per service)
- ✅ PostgreSQL 256MB RAM, 1GB storage
- ⚠️ Services spin down after 15min inactivity (cold start ~30s)
- ✅ All in one place

### Upgrading

**Vercel Pro ($20/month):**
- 1TB bandwidth
- Better performance
- More build minutes

**Render Starter ($7/month per service):**
- No spin down
- Better performance
- More resources

**Database Upgrades:**
- Supabase Pro: $25/month (8GB RAM, 100GB storage)
- Render PostgreSQL: $7/month (1GB RAM, 10GB storage)

---

# 🔐 Production Checklist

Before going live with real users:

- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Generate strong `JWT_SECRET` (32+ random characters)
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `MAX_PARTICIPANTS` limit
- [ ] Test instructor dashboard access
- [ ] Test student registration flow
- [ ] Verify commission calculations
- [ ] Test email notifications (if configured)
- [ ] Check all API endpoints work
- [ ] Verify CORS settings
- [ ] Enable rate limiting
- [ ] Review database backups (both platforms auto-backup)
- [ ] Set up monitoring/alerts
- [ ] Document your custom configuration

---

# 🚀 Quick Start Summary

## For Vercel:
1. Create Supabase database (2 min)
2. Import schema to Supabase (1 min)
3. Deploy to Vercel (1 click)
4. Add environment variables (3 min)
5. Redeploy (2 min)
✅ **Total: ~10 minutes**

## For Render:
1. Sign up for Render (1 min)
2. Deploy using Blueprint (1 click)
3. Set missing env vars (2 min)
4. Import schema to database (2 min)
✅ **Total: ~5 minutes**

---

# 🆘 Need Help?

**Check deployment status:**
- Vercel: Dashboard → Deployments → Check for errors
- Render: Dashboard → Events → Check build logs

**Test health endpoints:**
- Backend: `/api/v1/health`
- Status: `/api/v1/status`
- Environment check: `/api/v1/env-check`

**Community Support:**
- Open GitHub Issue
- Check deployment logs first
- Include error messages and platform used

---

**Choose your platform and start deploying! Both work great for Atlas Network.** 🎉
