# Atlas Network - Vercel Deployment Guide

Complete guide to deploy Atlas Network Educational Simulator to production.

## 🏗️ Architecture

- **Frontend:** Vercel (React/Vite)
- **Backend:** Railway or Render (Node.js/Express)
- **Database:** Railway MySQL or PlanetScale

## 📦 Prerequisites

1. GitHub account (already have: https://github.com/krushi5188/Crypto-mlm)
2. Vercel account (sign up at https://vercel.com)
3. Railway account (sign up at https://railway.app) OR Render account
4. Database: Railway MySQL or PlanetScale

---

## 🎯 Deployment Steps

### **Step 1: Deploy Database**

#### Option A: Railway MySQL (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Provision MySQL"
3. Once created, go to "Variables" tab
4. Note down these values:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

5. Connect to MySQL and import schema:
```bash
mysql -h MYSQL_HOST -P MYSQL_PORT -u MYSQL_USER -p MYSQL_DATABASE < backend/src/database/schema.sql
```

#### Option B: PlanetScale

1. Go to https://planetscale.com
2. Create new database: `atlas-network`
3. Get connection string
4. Import schema using their CLI

---

### **Step 2: Deploy Backend**

#### Option A: Railway (Recommended)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `krushi5188/Crypto-mlm`
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. Add Environment Variables (in Railway dashboard):
```env
NODE_ENV=production
PORT=3001
DB_HOST=<from Railway MySQL>
DB_PORT=<from Railway MySQL>
DB_NAME=<from Railway MySQL>
DB_USER=<from Railway MySQL>
DB_PASSWORD=<from Railway MySQL>
JWT_SECRET=<generate strong random string>
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
FRONTEND_URL=<will add after frontend deployment>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

6. Deploy and note your backend URL (e.g., `https://atlas-network-backend.railway.app`)

#### Option B: Render

1. Go to https://render.com
2. Create "New Web Service"
3. Connect GitHub repo
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (same as Railway)

---

### **Step 3: Deploy Frontend to Vercel**

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import `krushi5188/Crypto-mlm` from GitHub
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add Environment Variables:
```env
VITE_API_BASE_URL=https://your-railway-backend-url.railway.app/api/v1
VITE_APP_NAME=Atlas Network Simulator
VITE_REFERRAL_BASE_URL=https://your-vercel-app.vercel.app/register
```

6. Click "Deploy"

7. Your frontend will be live at: `https://your-app-name.vercel.app`

---

### **Step 4: Update Backend CORS**

1. Go back to Railway backend
2. Update `FRONTEND_URL` environment variable:
```env
FRONTEND_URL=https://your-vercel-app.vercel.app
```

3. Redeploy backend

---

### **Step 5: Update Frontend API URL**

1. Go to Vercel project settings
2. Update `VITE_API_BASE_URL` with your actual Railway backend URL
3. Update `VITE_REFERRAL_BASE_URL` with your actual Vercel URL
4. Redeploy frontend

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Backend health check: `https://your-backend-url.railway.app/health`
- [ ] Login page loads
- [ ] Instructor can login: `instructor@university.edu` / `InstructorPassword123!`
- [ ] Student can register
- [ ] Commission system works (register 2 users with referral)
- [ ] Instructor dashboard shows analytics
- [ ] Educational watermark is visible

---

## 🔧 Production Configuration

### Security Checklist

- [ ] Change `JWT_SECRET` to strong random string (32+ chars)
- [ ] Change `ADMIN_PASSWORD` to secure password
- [ ] Enable HTTPS (automatic on Vercel/Railway)
- [ ] Configure database SSL if available
- [ ] Set proper CORS origins
- [ ] Review rate limiting settings

### Environment Variables Generator

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🎓 Custom Domain (Optional)

### Vercel Frontend
1. Go to Vercel project → "Settings" → "Domains"
2. Add your custom domain (e.g., `atlas-network.youruniversity.edu`)
3. Update DNS records as instructed

### Railway Backend
1. Go to Railway project → "Settings" → "Domains"
2. Add custom domain for API (e.g., `api.atlas-network.youruniversity.edu`)
3. Update DNS records

---

## 📊 Monitoring

**Backend Logs:**
- Railway: Project → "Deployments" → Click deployment → "Logs"
- Render: Dashboard → Service → "Logs"

**Frontend Logs:**
- Vercel: Project → "Deployments" → Click deployment → "Logs"

**Database Monitoring:**
- Railway: MySQL service → "Metrics"
- PlanetScale: Dashboard → "Insights"

---

## 🚨 Troubleshooting

### Frontend shows 404 for API calls
- Check `VITE_API_BASE_URL` in Vercel environment variables
- Verify backend is running: visit `https://your-backend-url/health`
- Check browser console for CORS errors

### CORS Errors
- Verify `FRONTEND_URL` in backend environment variables matches Vercel URL
- Check backend CORS configuration in `server.js`

### Database Connection Failed
- Verify all `DB_*` environment variables are correct
- Check if database allows connections from backend IP
- Verify schema was imported correctly

### Instructor Login Fails
- Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in backend env vars
- Verify instructor account was created (check backend logs on first startup)
- Try password reset if needed

---

## 📈 Scaling Considerations

**For larger classes (300+ students):**

1. **Database:**
   - Upgrade to Railway Pro plan
   - Or use dedicated MySQL instance

2. **Backend:**
   - Scale Railway instances
   - Enable connection pooling

3. **Frontend:**
   - Vercel auto-scales
   - Configure CDN caching

---

## 🔄 Updates & Redeployment

**To deploy updates:**

1. Push code to GitHub:
```bash
git add .
git commit -m "Update message"
git push origin main
```

2. Vercel will auto-deploy frontend
3. Railway will auto-deploy backend

**Manual redeploy:**
- Vercel: Project → "Deployments" → Click "..." → "Redeploy"
- Railway: Project → "Deployments" → Click "Deploy"

---

## 💰 Cost Estimate

**Free Tier (Development/Small Classes):**
- Vercel: Free (Hobby plan)
- Railway: $5/month (with $5 free credit)
- Total: ~$5/month

**Paid Tier (Production/Large Classes):**
- Vercel Pro: $20/month
- Railway Pro: $20/month
- Database: Included in Railway
- Total: ~$40/month

---

## 📞 Support

If you encounter issues:

1. Check deployment logs first
2. Review this guide's troubleshooting section
3. Verify all environment variables
4. Check GitHub repository for updates

---

## 🎉 You're Done!

Your Atlas Network Educational Simulator is now live and accessible to students!

**Next Steps:**
1. Share the URL with your class
2. Test with a few students first
3. Monitor analytics during simulation
4. Prepare educational reveal materials
