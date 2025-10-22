# 🚀 Quick Start: Deploy to Vercel in 10 Minutes

Fast track guide to get Atlas Network running on Vercel.

## Step 1: Deploy Database (2 min)

1. Go to https://railway.app → Sign up
2. Click "New Project" → "Provision MySQL"
3. Click on MySQL → "Variables" tab → Copy all credentials

## Step 2: Deploy Backend to Railway (3 min)

1. Railway → "New Project" → "Deploy from GitHub repo"
2. Select `krushi5188/Crypto-mlm`
3. Settings → Change root directory to `backend`
4. Variables → Add these:

```
NODE_ENV=production
PORT=3001
DB_HOST=<from step 1>
DB_PORT=<from step 1>
DB_NAME=<from step 1>
DB_USER=<from step 1>
DB_PASSWORD=<from step 1>
JWT_SECRET=supersecretkey123456789abcdefghij
ADMIN_EMAIL=instructor@university.edu
ADMIN_USERNAME=instructor
ADMIN_PASSWORD=InstructorPassword123!
FRONTEND_URL=https://will-update-later.vercel.app
```

5. Copy your backend URL (e.g., `atlas-backend-production.up.railway.app`)

## Step 3: Import Database Schema (2 min)

Install Railway CLI and connect:
```bash
npm i -g @railway/cli
railway login
railway link
railway run mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> < backend/src/database/schema.sql
```

OR use any MySQL client with the credentials from Step 1.

## Step 4: Deploy Frontend to Vercel (3 min)

1. Go to https://vercel.com → Sign up with GitHub
2. "Add New" → "Project" → Import `krushi5188/Crypto-mlm`
3. Configure:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Environment Variables → Add:
```
VITE_API_BASE_URL=https://your-railway-backend-url.railway.app/api/v1
VITE_APP_NAME=Atlas Network Simulator
VITE_REFERRAL_BASE_URL=https://your-app.vercel.app/register
```

5. Click "Deploy"

## Step 5: Update CORS (1 min)

1. Go back to Railway backend
2. Add environment variable:
```
FRONTEND_URL=https://your-vercel-app.vercel.app
```
3. Redeploy

## ✅ Done!

Visit your Vercel URL and login:
- Email: `instructor@university.edu`
- Password: `InstructorPassword123!`

---

## 🔧 Quick Fixes

**Can't connect to API?**
- Check VITE_API_BASE_URL in Vercel matches Railway backend URL
- Visit `https://your-backend.railway.app/health` to verify backend is up

**CORS Error?**
- Update FRONTEND_URL in Railway to match your Vercel URL exactly

**Database Error?**
- Verify schema was imported
- Check DB credentials in Railway

---

## 📞 Need Help?

See full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
