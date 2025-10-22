# 🚀 Deploy Atlas Network Entirely on Vercel

Complete guide to deploy **both frontend AND backend** on Vercel with external database.

---

## 📋 What You Need

1. **Vercel account** (free) - https://vercel.com
2. **PlanetScale account** (free) - https://planetscale.com
3. **GitHub repo** (you have: https://github.com/krushi5188/Crypto-mlm)

---

## Step 1: Setup Database on PlanetScale (3 minutes)

### Create Database

1. Go to https://planetscale.com → Sign up (free)
2. Click **"Create a new database"**
3. Name: `atlas-network`
4. Region: Choose closest to your users
5. Click **"Create database"**

### Get Connection String

1. Click on your database → **"Connect"**
2. Select **"Connect with: Node.js"**
3. Copy the connection string (looks like):
```
mysql://user:password@aws.connect.psdb.cloud/atlas-network?ssl={"rejectUnauthorized":true}
```

### Import Schema

1. Install PlanetScale CLI:
```bash
# Mac
brew install planetscale/tap/pscale

# Windows
scoop install pscale

# Linux
curl -sS https://downloads.planetscale.com/psdb-shell/install.sh | sh
```

2. Login and connect:
```bash
pscale auth login
pscale connect atlas-network main
```

3. In another terminal, import schema:
```bash
mysql -h 127.0.0.1 -P 3306 -u root < backend/src/database/schema.sql
```

**OR use PlanetScale web console:**
1. Database → **"Console"** tab
2. Copy/paste content from `backend/src/database/schema.sql`
3. Click **"Run"**

---

## Step 2: Deploy to Vercel (5 minutes)

### Initial Deploy

1. Go to https://vercel.com → Login with GitHub
2. Click **"Add New"** → **"Project"**
3. Import **`krushi5188/Crypto-mlm`**
4. **IMPORTANT:** Leave Root Directory as **`.`** (root) - don't change it!
5. Click **"Deploy"** (it will fail first time, that's okay!)

### Configure Environment Variables

1. Go to your project → **"Settings"** → **"Environment Variables"**
2. Add these variables:

#### Database Variables (from PlanetScale):
```
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_NAME=atlas-network
DB_USER=<from PlanetScale connection string>
DB_PASSWORD=<from PlanetScale connection string>
```

#### Application Variables:
```
NODE_ENV=production
JWT_SECRET=<generate random 32+ character string>
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=instructor@university.edu
ADMIN_USERNAME=instructor
ADMIN_PASSWORD=InstructorPassword123!
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

#### Frontend Variables (your Vercel URL):
```
VITE_API_BASE_URL=https://your-vercel-project.vercel.app/api/v1
VITE_APP_NAME=Atlas Network Simulator
VITE_REFERRAL_BASE_URL=https://your-vercel-project.vercel.app/register
FRONTEND_URL=https://your-vercel-project.vercel.app
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Redeploy

1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment → **"Redeploy"**
3. Wait for deployment to complete (~2 minutes)

---

## Step 3: Update Environment Variables with Real URL

After first deployment, you'll have your actual Vercel URL:

1. Copy your Vercel URL (e.g., `https://crypto-mlm-abc123.vercel.app`)
2. Go back to **"Settings"** → **"Environment Variables"**
3. **Edit** these variables with your real URL:
```
VITE_API_BASE_URL=https://YOUR-ACTUAL-URL.vercel.app/api/v1
VITE_REFERRAL_BASE_URL=https://YOUR-ACTUAL-URL.vercel.app/register
FRONTEND_URL=https://YOUR-ACTUAL-URL.vercel.app
```
4. Redeploy again

---

## ✅ Verify Deployment

### Test Backend API:
Visit: `https://your-app.vercel.app/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-..."
}
```

### Test Frontend:
Visit: `https://your-app.vercel.app`

Should see the Atlas Network login page.

### Test Full System:
1. Go to login page
2. Login as instructor:
   - Email: `instructor@university.edu`
   - Password: `InstructorPassword123!`
3. Should see analytics dashboard

---

## 🎉 You're Live!

Your Atlas Network is now fully deployed on Vercel!

**Your URLs:**
- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-app.vercel.app/api/v1`
- **Database:** PlanetScale cloud

---

## 💰 Cost

- **Vercel:** FREE (Hobby plan - 100GB bandwidth/month)
- **PlanetScale:** FREE (Hobby plan - 5GB storage, 1 billion reads/month)
- **Total:** $0/month for development and small classes!

---

## 🔧 Troubleshooting

### "Database connection failed"
- Check DB_* environment variables match PlanetScale exactly
- Verify schema was imported to PlanetScale
- Check PlanetScale database is in "Ready" state

### "500 Internal Server Error" on /api/*
- Check Vercel deployment logs: Project → Deployments → Click latest → Logs
- Verify all environment variables are set
- Check backend/src/server.js for errors

### Frontend loads but API calls fail
- Verify VITE_API_BASE_URL matches your actual Vercel URL
- Check browser console for errors
- Verify backend health: visit /api/health

### "CORS Error"
- Verify FRONTEND_URL environment variable matches your Vercel URL exactly
- No trailing slash in URLs

---

## 📊 Monitoring

**View Logs:**
1. Vercel Dashboard → Your Project
2. Click **"Deployments"**
3. Click on latest deployment
4. Click **"Functions"** tab to see backend logs
5. Or **"Build Logs"** to see build process

**Database Monitoring:**
1. PlanetScale Dashboard
2. Your database → **"Insights"** tab
3. View queries, connections, storage usage

---

## 🔄 Making Updates

When you push to GitHub:
```bash
git add .
git commit -m "Update message"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Rebuild both frontend and backend
3. Deploy automatically (~2 minutes)

---

## 🎓 Share With Students

Once deployed, share your Vercel URL with students:
- **Registration:** `https://your-app.vercel.app/register`
- **Login:** `https://your-app.vercel.app/login`

Students can register and start participating!

---

## 🔐 Security Checklist

Before going live with students:

- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Generate strong `JWT_SECRET` (32+ random characters)
- [ ] Review `MAX_PARTICIPANTS` limit
- [ ] Test instructor dashboard access
- [ ] Test student registration with referral codes
- [ ] Verify commission distribution works
- [ ] Check educational watermark is visible

---

## 📈 Scaling Up

If you outgrow free tier:

**Vercel Pro ($20/month):**
- More bandwidth
- Better performance
- Priority support

**PlanetScale Scaler ($29/month):**
- 25GB storage
- More connections
- Better performance

---

## 🆘 Need Help?

Check deployment status:
1. Vercel Dashboard → Your Project → "Deployments"
2. Click latest deployment → Check for errors

Common fixes:
- Redeploy after env var changes
- Check all variables are saved (no typos)
- Verify PlanetScale database is running
- Check browser console for frontend errors

---

**Ready to deploy? Start with Step 1 (PlanetScale database)!**
