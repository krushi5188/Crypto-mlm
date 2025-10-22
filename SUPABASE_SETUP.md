# Supabase Setup Guide - Atlas Network

Complete guide to set up PostgreSQL database on Supabase for Atlas Network Educational Simulator.

## 🎯 Why Supabase?

- **FREE Forever**: 500MB database + 1GB file storage + 2GB bandwidth
- **PostgreSQL**: Industry-standard database with excellent performance
- **Auto-backups**: Daily backups included
- **SSL Connection**: Built-in security
- **Easy Setup**: 5 minutes to get started

---

## 📋 Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## 📦 Step 2: Create New Project

1. Click "New Project" in the Supabase dashboard
2. Fill in project details:
   - **Name**: `atlas-network` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Pricing Plan**: Select "Free" (no credit card required)

3. Click "Create new project"
4. Wait 2-3 minutes for project to initialize

---

## 🔧 Step 3: Set Up Database Schema

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `/backend/src/database/schema.sql`
4. Paste into the SQL editor
5. Click "Run" button (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

### Option B: Using PostgreSQL Client

If you have `psql` installed locally:

```bash
# Get connection string from Supabase dashboard (Settings → Database → Connection string → URI)
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < backend/src/database/schema.sql
```

---

## 🔑 Step 4: Get Database Connection Details

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to "Connection string" section
3. Select **Connection pooling** tab (important for serverless)
4. Choose **Transaction** mode
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### Extract Connection Details:

From the connection string above, you need:

```
DB_HOST=aws-0-[REGION].pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.[PROJECT-REF]
DB_PASSWORD=[YOUR-PASSWORD]
DB_NAME=postgres
DB_SSL=true
```

**Example:**
```
Connection string: postgresql://postgres.abcdefgh:myP@ssw0rd!@aws-0-us-east-1.pooler.supabase.com:6543/postgres

Becomes:
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.abcdefgh
DB_PASSWORD=myP@ssw0rd!
DB_NAME=postgres
DB_SSL=true
```

---

## ⚙️ Step 5: Configure Backend Environment Variables

### Local Development

1. Update `/backend/.env`:

```env
# Database (Supabase PostgreSQL)
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.abcdefgh
DB_PASSWORD=your-database-password
DB_NAME=postgres
DB_SSL=true

# Server
NODE_ENV=development
PORT=3001

# JWT
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

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

2. Test local connection:

```bash
cd backend
npm install
npm start
```

You should see:
```
✓ Database connected successfully
✓ Instructor account created (or already exists)
✓ Database initialization complete
Server running on port 3001
```

---

## 🚀 Step 6: Configure Vercel Deployment

### Backend Environment Variables on Vercel

1. Go to Vercel dashboard → Your project → Settings → Environment Variables

2. Add these variables (one by one):

**Database Variables:**
```
DB_HOST = aws-0-us-east-1.pooler.supabase.com
DB_PORT = 6543
DB_USER = postgres.abcdefgh
DB_PASSWORD = your-database-password
DB_NAME = postgres
DB_SSL = true
```

**Server Variables:**
```
NODE_ENV = production
PORT = 3001
```

**JWT Variables:**
```
JWT_SECRET = [generate-strong-random-string]
JWT_EXPIRES_IN = 7d
```

**Admin Variables:**
```
ADMIN_EMAIL = instructor@university.edu
ADMIN_USERNAME = instructor
ADMIN_PASSWORD = [create-strong-password]
```

**Simulation Settings:**
```
MAX_PARTICIPANTS = 300
SEMESTER_DURATION_DAYS = 112
RECRUITMENT_FEE = 100
COMMISSION_LEVEL_1 = 10
COMMISSION_LEVEL_2 = 7
COMMISSION_LEVEL_3 = 5
COMMISSION_LEVEL_4 = 3
COMMISSION_LEVEL_5 = 2
```

**CORS Settings:**
```
FRONTEND_URL = https://your-vercel-app.vercel.app
```

**Rate Limiting:**
```
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

### Frontend Environment Variables on Vercel

```
VITE_API_BASE_URL = https://your-backend-url.vercel.app/api/v1
VITE_APP_NAME = Atlas Network Simulator
VITE_REFERRAL_BASE_URL = https://your-frontend-url.vercel.app/register
```

---

## 🔒 Step 7: Security Best Practices

### Generate Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use as `JWT_SECRET`

### Change Default Admin Password

- Don't use `InstructorPassword123!` in production
- Use a password manager to generate strong password
- Minimum 12 characters with uppercase, lowercase, numbers, symbols

---

## ✅ Step 8: Verify Everything Works

### Test Database Connection

1. In Supabase dashboard → SQL Editor
2. Run this query:
```sql
SELECT COUNT(*) FROM users WHERE role = 'instructor';
```
Should return 1 (the instructor account)

### Test Backend API

```bash
# Health check
curl https://your-backend-url.vercel.app/health

# Should return: {"status":"ok","timestamp":"..."}
```

### Test Login

```bash
curl -X POST https://your-backend-url.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@university.edu","password":"your-admin-password"}'

# Should return JWT token and user info
```

---

## 📊 Step 9: Monitor Database Usage

### Check Database Size

In Supabase dashboard → Settings → Database:
- View current database size
- Free tier: 500MB limit
- Monitor as students register

### Expected Usage

- Empty database: ~2MB
- 100 students: ~5-10MB
- 300 students: ~15-20MB
- **Well within 500MB free limit**

---

## 🔄 Database Backups

Supabase automatically backs up your database daily:
- **Free Plan**: 7 days of backups
- Access backups: Database → Backups tab
- Can restore to any backup point

To manually export data:
1. Use the instructor dashboard "Export Data" feature
2. Or in Supabase SQL Editor:
```sql
COPY users TO STDOUT WITH CSV HEADER;
COPY transactions TO STDOUT WITH CSV HEADER;
```

---

## 🛠️ Troubleshooting

### Error: "Connection timeout"

**Problem**: Backend can't connect to Supabase

**Solutions**:
1. Check if you're using the **Connection pooling** URL (not Direct connection)
2. Verify port is 6543 (not 5432)
3. Ensure `DB_SSL=true` is set
4. Check Supabase project is active (not paused due to inactivity)

### Error: "SSL connection required"

**Problem**: Trying to connect without SSL

**Solution**: Set `DB_SSL=true` in environment variables

### Error: "Authentication failed"

**Problem**: Wrong password or username

**Solutions**:
1. Double-check password (no extra spaces)
2. Verify username format: `postgres.[project-ref]`
3. Reset password in Supabase Settings → Database → Database Password

### Error: "Too many connections"

**Problem**: Connection pool exhausted (rare on free tier)

**Solutions**:
1. Use connection pooling URL (should already be using it)
2. Reduce `max` in `database.js` (currently set to 5 for production)
3. Restart backend to release connections

### Database paused after 7 days

**Problem**: Supabase pauses inactive projects

**Solution**:
1. Projects are only paused if NO connections for 7 days
2. While simulation is active, this won't happen
3. If paused, just click "Resume" in dashboard

---

## 📈 Upgrading to Pro (Optional)

If you need more resources:

### Supabase Pro - $25/month
- 8GB database (16x free tier)
- 50GB bandwidth (25x free tier)
- 100GB file storage (100x free tier)
- 7-day point-in-time recovery
- Daily backups

### When to upgrade:
- 300+ students with high activity
- Multiple simulation runs per semester
- Need longer backup retention

---

## 🎓 Teaching Notes

### During Simulation

1. **Monitor in real-time**: Database → Table Editor → Select `users` table
2. **View transactions**: Select `transactions` table to see commission flow
3. **Network visualization**: Use instructor dashboard for live network graph

### After Simulation Ends

1. **Export all data**: Use instructor export feature
2. **Keep database**: Free tier persists indefinitely
3. **Reset for next semester**: Use instructor "Reset Simulation" feature

---

## 🆘 Need Help?

### Supabase Support
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

### Atlas Network Issues
- Check backend logs in Vercel dashboard
- Review this guide's troubleshooting section
- Verify all environment variables are set correctly

---

## ✨ You're All Set!

Your Atlas Network Educational Simulator is now connected to Supabase!

**Next Steps:**
1. Share frontend URL with students
2. Students register with referral codes
3. Monitor network formation in instructor dashboard
4. Export data for educational analysis
5. Conduct reveal session at semester end

**Remember**: This is an educational tool to demonstrate pyramid scheme mechanics. All "coins" have no real value!
