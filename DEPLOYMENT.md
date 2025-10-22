# Atlas Network - Vercel Deployment Guide

Complete guide to deploy Atlas Network Educational Simulator to production.

## 🏗️ Architecture

- **Frontend:** Vercel (React/Vite)
- **Backend:** Vercel (Node.js/Express serverless)
- **Database:** Supabase (PostgreSQL)

## 📦 Prerequisites

1. GitHub account (already have: https://github.com/krushi5188/Crypto-mlm)
2. Vercel account (sign up at https://vercel.com)
3. Supabase account (sign up at https://supabase.com)

---

## 🎯 Deployment Steps

### **Step 1: Deploy Database**

#### Supabase PostgreSQL (Free & Recommended)

1. Go to https://supabase.com
2. Create account and new project
3. **Project Settings:**
   - Name: `atlas-network`
   - Database Password: Create strong password (SAVE THIS!)
   - Region: Choose closest to you
   - Plan: Free (500MB - plenty for 300 students)

4. Wait 2-3 minutes for project initialization

5. **Import Schema:**
   - Go to SQL Editor in Supabase dashboard
   - Click "New Query"
   - Copy entire `/backend/src/database/schema.sql` file
   - Paste and click "Run"
   - Should see "Success. No rows returned"

6. **Get Connection Details:**
   - Go to Settings → Database
   - Select "Connection pooling" tab
   - Choose "Transaction" mode
   - Copy connection string:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   
   - Extract these values:
     ```
     DB_HOST=aws-0-[REGION].pooler.supabase.com
     DB_PORT=6543
     DB_USER=postgres.[PROJECT-REF]
     DB_PASSWORD=[YOUR-PASSWORD]
     DB_NAME=postgres
     DB_SSL=true
     ```

**💡 See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed database setup guide**

---

### **Step 2: Deploy Backend to Vercel**

#### Option: Vercel Serverless (Recommended)

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import `krushi5188/Crypto-mlm` from GitHub
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Output Directory:** (leave empty)

5. Add Environment Variables (click "Environment Variables"):

**Database Variables:**
```env
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.abcdefgh
DB_PASSWORD=your-supabase-password
DB_NAME=postgres
DB_SSL=true
```

**Server Variables:**
```env
NODE_ENV=production
PORT=3001
```

**JWT Variables:**
```env
JWT_SECRET=generate-strong-random-string-here
JWT_EXPIRES_IN=7d
```

**Admin Variables:**
```env
ADMIN_EMAIL=instructor@university.edu
ADMIN_USERNAME=instructor
ADMIN_PASSWORD=YourStrongPassword123!
```

**Simulation Settings:**
```env
MAX_PARTICIPANTS=300
SEMESTER_DURATION_DAYS=112
RECRUITMENT_FEE=100
COMMISSION_LEVEL_1=10
COMMISSION_LEVEL_2=7
COMMISSION_LEVEL_3=5
COMMISSION_LEVEL_4=3
COMMISSION_LEVEL_5=2
```

**CORS (will update after frontend deployment):**
```env
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Rate Limiting:**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

6. Click "Deploy"

7. Note your backend URL (e.g., `https://atlas-backend.vercel.app`)

---

### **Step 3: Deploy Frontend to Vercel**

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import `krushi5188/Crypto-mlm` from GitHub (create new project)
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. Add Environment Variables:
```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app/api/v1
VITE_APP_NAME=Atlas Network Simulator
VITE_REFERRAL_BASE_URL=https://your-vercel-app.vercel.app/register
```

6. Click "Deploy"

7. Your frontend will be live at: `https://your-app-name.vercel.app`

---

### **Step 4: Update Backend CORS**

1. Go back to Vercel backend project
2. Go to Settings → Environment Variables
3. Update `FRONTEND_URL` environment variable:
```env
FRONTEND_URL=https://your-frontend-app.vercel.app
```

4. Redeploy backend (Deployments → latest → three dots → Redeploy)

---

### **Step 5: Update Frontend API URL**

1. Go to Vercel frontend project settings
2. Update `VITE_API_BASE_URL` with your actual backend URL
3. Update `VITE_REFERRAL_BASE_URL` with your actual frontend URL
4. Redeploy frontend

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at Vercel URL
- [ ] Backend health check: `https://your-backend-url.vercel.app/health`
- [ ] Login page loads
- [ ] Instructor can login: `instructor@university.edu` / `YourPassword`
- [ ] Student can register
- [ ] Commission system works (register 2 users with referral)
- [ ] Instructor dashboard shows analytics
- [ ] Educational watermark is visible
- [ ] Database in Supabase shows user records

---

## 🔧 Production Configuration

### Security Checklist

- [ ] Change `JWT_SECRET` to strong random string (32+ chars)
- [ ] Change `ADMIN_PASSWORD` to secure password
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Database SSL enabled (`DB_SSL=true`)
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

### Vercel Backend
1. Go to backend project → "Settings" → "Domains"
2. Add custom domain for API (e.g., `api.atlas-network.youruniversity.edu`)
3. Update DNS records

---

## 📊 Monitoring

**Backend Logs:**
- Vercel: Project → "Deployments" → Click deployment → "Logs"

**Frontend Logs:**
- Vercel: Project → "Deployments" → Click deployment → "Logs"

**Database Monitoring:**
- Supabase: Dashboard → Database → "Table Editor" to view data
- Supabase: Dashboard → Database → "Usage" to see storage/bandwidth

---

## 🚨 Troubleshooting

### Frontend shows 404 for API calls
- Check `VITE_API_BASE_URL` in Vercel environment variables
- Verify backend is running: visit `https://your-backend-url/health`
- Check browser console for CORS errors

### CORS Errors
- Verify `FRONTEND_URL` in backend environment variables matches Vercel URL
- Ensure no trailing slash in URLs
- Check backend CORS configuration in `server.js`

### Database Connection Failed
- Verify all `DB_*` environment variables are correct
- Use **Connection pooling** URL (port 6543), not Direct connection (port 5432)
- Verify `DB_SSL=true` is set
- Check Supabase project is active (not paused)

### Instructor Login Fails
- Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in backend env vars
- Check backend logs for instructor account creation
- Try resetting via Supabase SQL Editor:
  ```sql
  DELETE FROM users WHERE email = 'instructor@university.edu';
  ```
  Then redeploy backend to recreate account

---

## 📈 Scaling Considerations

**For larger classes (300+ students):**

1. **Database:**
   - Free Supabase (500MB) handles 300+ students easily
   - Upgrade to Supabase Pro ($25/mo) for 8GB if needed

2. **Backend:**
   - Vercel auto-scales serverless functions
   - Free tier: 100GB bandwidth (enough for 300 students)
   - Pro ($20/mo): 1TB bandwidth for heavy usage

3. **Frontend:**
   - Vercel auto-scales
   - CDN caching automatic
   - No action needed

---

## 🔄 Updates & Redeployment

**To deploy updates:**

1. Push code to GitHub:
```bash
git add .
git commit -m "Update message"
git push origin main
```

2. Vercel will auto-deploy both frontend and backend

**Manual redeploy:**
- Vercel: Project → "Deployments" → Click "..." → "Redeploy"

---

## 💰 Cost Estimate

**Free Tier (Perfect for Educational Use):**
- Vercel Frontend: Free (Hobby plan)
- Vercel Backend: Free (100GB bandwidth included)
- Supabase Database: Free (500MB storage)
- **Total: $0/month for 300 students**

**Paid Tier (If Needed):**
- Vercel Pro: $20/month (1TB bandwidth)
- Supabase Pro: $25/month (8GB database)
- Total: ~$45/month (only if exceeding free limits)

---

## 📞 Support

If you encounter issues:

1. Check deployment logs first
2. Review this guide's troubleshooting section
3. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database help
4. Verify all environment variables
5. Check GitHub repository for updates

---

## 🎉 You're Done!

Your Atlas Network Educational Simulator is now live and accessible to students!

**Next Steps:**
1. Share the URL with your class
2. Test with a few students first
3. Monitor analytics during simulation
4. Prepare educational reveal materials

**Database URL:** Check Supabase dashboard
**Backend API:** `https://your-backend.vercel.app/api/v1`
**Frontend:** `https://your-frontend.vercel.app`
