# ⚡ Quick Deploy Atlas Network

Choose your platform and deploy in under 10 minutes!

---

## 🔷 Deploy on Vercel (Recommended for Speed)

**Best for:** Global CDN, fastest frontend performance

```bash
# 1. Create database on Supabase
# Visit: https://supabase.com

# 2. Import schema
# Copy backend/src/database/schema.sql to Supabase SQL Editor

# 3. Deploy to Vercel
# Visit: https://vercel.com/new
# Import your GitHub repo: Crypto-mlm

# 4. Add environment variables
# See: .env.vercel.example

# 5. Redeploy
```

**Time:** ~10 minutes
**Cost:** FREE (Vercel + Supabase free tiers)

[Full Vercel Guide →](./DEPLOYMENT_GUIDE.md#option-1-deploy-on-vercel-)

---

## 🟦 Deploy on Render.com (Easiest Setup)

**Best for:** All-in-one solution, simplest setup

```bash
# 1. Sign up for Render
# Visit: https://render.com

# 2. Deploy using Blueprint
# Dashboard → New → Blueprint
# Connect repo: Crypto-mlm
# Click Apply

# 3. Set missing variables
# Backend: ADMIN_PASSWORD, FRONTEND_URL
# Frontend: VITE_API_BASE_URL, VITE_REFERRAL_BASE_URL

# 4. Import database schema
# Database → Shell → Paste schema.sql
```

**Time:** ~5 minutes
**Cost:** FREE (Render free tier)

[Full Render Guide →](./DEPLOYMENT_GUIDE.md#option-2-deploy-on-rendercom-)

---

## 📋 What You Get

✅ Full-stack application (Frontend + Backend + Database)
✅ Automatic HTTPS
✅ Auto-deploy on Git push
✅ Instructor dashboard
✅ Student registration system
✅ Real-time commission tracking
✅ Network visualization

---

## 🎯 Quick Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Setup Time** | 10 min | 5 min |
| **Complexity** | Medium | Easy |
| **Database** | External | Included |
| **Performance** | ⚡ Fastest | 🚀 Fast |
| **Cold Starts** | None | Yes (free tier) |

---

## 🔗 Next Steps

After deployment:

1. **Test your deployment:**
   - Visit: `https://your-url.vercel.app` or `https://your-app.onrender.com`
   - Login as instructor
   - Test student registration

2. **Secure your app:**
   - Change default `ADMIN_PASSWORD`
   - Keep `JWT_SECRET` secure
   - Review rate limits

3. **Share with users:**
   - Give them the registration URL
   - Share referral codes
   - Monitor via instructor dashboard

---

## 🆘 Having Issues?

**Check these first:**
- Backend health: `https://your-url/api/v1/health`
- Environment variables: All set correctly?
- Database: Schema imported?
- Logs: Check deployment logs

**Full troubleshooting:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-troubleshooting)

---

## 📚 Documentation

- **Full Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Vercel Template:** [.env.vercel.example](./.env.vercel.example)
- **Render Template:** [.env.render.example](./.env.render.example)
- **Project Setup:** [README.md](./README.md)

---

**Ready? Pick a platform above and start deploying!** 🚀
