# Quick Setup Instructions

## Your Supabase Project Details

**Project URL:** https://chvdcbbxplnzmwaehxma.supabase.co
**Project Ref:** chvdcbbxplnzmwaehxma
**API Key (anon):** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNodmRjYmJ4cGxuem13YWVoeG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMzYyMDcsImV4cCI6MjA3NjcxMjIwN30.tdA7oX5d70V-saZPONR7quZOer15nTSR05zy1yJ04ZM

---

## Step 1: Import Database Schema

1. Go to https://chvdcbbxplnzmwaehxma.supabase.co
2. Click **SQL Editor** → **New Query**
3. Copy the entire contents of `backend/src/database/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

---

## Step 2: Get Connection Pooling URL (IMPORTANT!)

**For Vercel serverless, you MUST use connection pooling:**

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to "Connection string" section
3. Click the **"Connection pooling"** tab
4. Select **"Transaction"** mode
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres.chvdcbbxplnzmwaehxma:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

**Note:** The port should be **6543** (not 5432!)

---

## Step 3: Backend Environment Variables

Create `backend/.env` file with these values:

```env
# Database (Supabase Connection Pooling - REQUIRED for Vercel)
DB_HOST=aws-0-[region].pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.chvdcbbxplnzmwaehxma
DB_PASSWORD=Krun@l5188
DB_NAME=postgres
DB_SSL=true

# Server
NODE_ENV=development
PORT=3001

# JWT (Generate new secret for production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin Account
ADMIN_EMAIL=instructor@university.edu
ADMIN_USERNAME=instructor
ADMIN_PASSWORD=InstructorPassword123!

# Simulation Settings
MAX_PARTICIPANTS=300
SEMESTER_DURATION_DAYS=112
RECRUITMENT_FEE=100
COMMISSION_LEVEL_1=10
COMMISSION_LEVEL_2=7
COMMISSION_LEVEL_3=5
COMMISSION_LEVEL_4=3
COMMISSION_LEVEL_5=2

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ IMPORTANT:** Replace `DB_HOST` with your actual connection pooling host from Step 2!

---

## Step 4: Frontend Environment Variables

Create `frontend/.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=Atlas Network Simulator
VITE_REFERRAL_BASE_URL=http://localhost:3000/register
```

---

## Step 5: Test Locally

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Should see:
# ✓ Database connected successfully
# ✓ Instructor account created
# Server running on port 3001

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Frontend runs on http://localhost:3000
```

---

## Step 6: Deploy to Vercel

### Deploy Backend:
1. Go to https://vercel.com
2. New Project → Import from GitHub
3. Select: krushi5188/Crypto-mlm
4. Root Directory: `backend`
5. Add ALL environment variables from Step 3 (but with connection pooling URL!)
6. Deploy

### Deploy Frontend:
1. New Project → Import from GitHub (again)
2. Select: krushi5188/Crypto-mlm
3. Root Directory: `frontend`
4. Framework: Vite
5. Environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend.vercel.app/api/v1
   VITE_APP_NAME=Atlas Network Simulator
   VITE_REFERRAL_BASE_URL=https://your-frontend.vercel.app/register
   ```
6. Deploy

### Update Backend CORS:
1. Go to backend project → Settings → Environment Variables
2. Update `FRONTEND_URL` to your frontend Vercel URL
3. Redeploy

---

## Verification Checklist

- [ ] Schema imported successfully in Supabase
- [ ] Backend starts locally without errors
- [ ] Can login as instructor: instructor@university.edu / InstructorPassword123!
- [ ] Frontend loads and connects to backend
- [ ] Can register a test student
- [ ] Backend deployed on Vercel
- [ ] Frontend deployed on Vercel
- [ ] Production login works

---

## Troubleshooting

**Error: "Connection timeout"**
- Make sure you're using connection pooling URL (port 6543)
- Check DB_SSL=true is set

**Error: "Authentication failed"**
- Double-check DB_USER and DB_PASSWORD
- Make sure password has no extra spaces

**Instructor login fails:**
- Check backend logs in Vercel
- Verify ADMIN_EMAIL and ADMIN_PASSWORD in env vars

---

## Need Help?

See full guides:
- Database setup: SUPABASE_SETUP.md
- Deployment: DEPLOYMENT.md
- General info: README.md
