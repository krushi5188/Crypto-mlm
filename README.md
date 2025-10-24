# Educational MLM Simulator - Atlas Network

An educational platform that teaches university members about multi-level marketing (MLM) structures, pyramid schemes, and crypto-based network marketing through hands-on simulation.

> **🚀 Deploy Everything on Vercel + Supabase (Recommended & FREE):** 
> 
> See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide
> 
> See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database setup

## 🎓 Educational Purpose

This simulator allows members to:
- Experience participant perspective in an MLM system
- Understand the mathematics behind pyramid schemes
- Analyze economic realities of MLM structures
- Detect red flags in network marketing
- Develop critical thinking about financial opportunities

**Key Features:**
- ✅ Simulated tokens only (no real money)
- ✅ Maximum 300 participants (classroom size)
- ✅ Semester-limited duration
- ✅ Educational watermarks throughout
- ✅ Instructor analytics revealing system realities
- ✅ Built-in collapse mechanism

## 🏗️ Technology Stack

**Backend:**
- Node.js with Express.js
- PostgreSQL database (Supabase)
- JWT authentication
- bcrypt password hashing

**Frontend:**
- React.js with Vite
- React Router for navigation
- Axios for API calls
- Responsive design (mobile-first)

**Deployment:**
- Frontend: Vercel
- Backend: Vercel (serverless)
- Database: Supabase (PostgreSQL)
- **Total Cost: $0 (Free tier handles 300+ members)**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free at https://supabase.com)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/krushi5188/Crypto-mlm.git
cd Crypto-mlm
```

2. **Setup Database (Supabase):**

   a. Create account at https://supabase.com
   
   b. Create new project (takes 2-3 minutes)
   
   c. Go to SQL Editor → New Query
   
   d. Copy and paste contents of `backend/src/database/schema.sql`
   
   e. Click "Run" to create all tables
   
   f. Get connection details from Settings → Database → Connection Pooling
   
   **📖 Detailed instructions:** See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

3. **Setup Backend:**
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Database (from Supabase Connection Pooling)
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.your-project-ref
DB_PASSWORD=your-database-password
DB_NAME=postgres
DB_SSL=true

# Other settings (use defaults for local dev)
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret-change-in-production
```

4. **Start Backend:**
```bash
npm run dev
# Backend runs on http://localhost:3001
```

You should see:
```
✓ Database connected successfully
✓ Instructor account created
Server running on port 3001
```

5. **Setup Frontend (in new terminal):**
```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `.env` if needed (default values should work for local development).

6. **Start Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

## 🔑 Default Credentials

**Instructor Account:**
- Email: `instructor@university.edu`
- Username: `instructor`
- Password: `InstructorPassword123!`

(Configured via environment variables in `backend/.env`)

## 📊 How It Works

### Member Experience

1. **Registration:** Members register with optional referral code
2. **Dashboard:** View balance, earnings, network size
3. **Recruitment:** Share referral link to recruit others
4. **Commissions:** Earn 5-level commissions when downline recruits

**Commission Structure:**
- Level 1 (Direct): 10 AC per recruit (Atlas Coins)
- Level 2: 7 AC per recruit
- Level 3: 5 AC per recruit
- Level 4: 3 AC per recruit
- Level 5: 2 AC per recruit

Total: 27 AC distributed per 100 AC "recruitment fee"

**Referral Codes:** Format ATN-XXXXXX (e.g., ATN-ABC123)

### Instructor Experience

1. **Analytics Dashboard:** System-wide statistics
   - Participant distribution (profited vs lost)
   - Wealth concentration metrics
   - Gini coefficient calculation
   - Top earners vs bottom performers

2. **Participant Management:** View and manage all members

3. **Network Visualization:** Complete pyramid structure

4. **Simulation Controls:**
   - Pause/Resume simulation
   - Inject coins for testing
   - Reset (soft or full)
   - Export data to CSV

## 🎯 Educational Reveal

After members have participated for several weeks:

1. **Pause simulation** to freeze activity
2. **Project analytics** showing:
   - ~70-80% participants earned nothing
   - Top 10% control ~60-70% of wealth
   - High Gini coefficient (0.7-0.9)
3. **Facilitate discussion:**
   - Why did early participants win?
   - Why did late participants lose?
   - Is this sustainable at scale?
   - Compare to legitimate businesses

## 📁 Project Structure

```
Crypto-mlm/
├── backend/
│   ├── src/
│   │   ├── config/          # Database and JWT config
│   │   ├── middleware/      # Auth, rate limiting, validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   ├── database/        # PostgreSQL schema
│   │   └── server.js        # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context (auth)
│   │   ├── services/        # API client
│   │   ├── utils/           # Helper functions
│   │   ├── styles/          # CSS and theme
│   │   ├── App.jsx          # Main app
│   │   └── index.jsx        # Entry point
│   ├── package.json
│   └── .env.example
│
├── DEPLOYMENT.md            # Complete deployment guide
├── SUPABASE_SETUP.md        # Database setup guide
└── README.md
```

## 🔧 Configuration

### Backend Environment Variables

See `backend/.env.example` for all configuration options:

- **Database:** Supabase PostgreSQL connection settings
- **JWT:** Secret key and expiration
- **Admin:** Instructor credentials
- **Simulation:** Commission rates, participant limits
- **CORS:** Frontend URL

### Frontend Environment Variables

See `frontend/.env.example`:

- **API URL:** Backend API endpoint
- **App Name:** Display name
- **Referral URL:** Base URL for referral links

## 🧪 Testing the System

### Manual Testing Flow

1. **Register 5 users in sequence:**
   - User A (no referral)
   - User B (use A's referral: ATN-XXXXXX)
   - User C (use B's referral: ATN-YYYYYY)
   - User D (use C's referral: ATN-ZZZZZZ)
   - User E (use D's referral: ATN-WWWWWW)

2. **Verify commissions:**
   - A should have: 10 (from B) + 7 (from C) + 5 (from D) + 3 (from E) = 25 AC
   - B should have: 10 (from C) + 7 (from D) + 5 (from E) = 22 AC
   - C should have: 10 (from D) + 7 (from E) = 17 AC
   - D should have: 10 (from E) = 10 AC
   - E should have: 0 AC

3. **Check instructor analytics:**
   - Shows all participants
   - Wealth distribution
   - Network visualization

4. **Verify in Supabase:**
   - Go to Table Editor → `users` table
   - See all registered users with balances
   - Go to `transactions` table
   - See all commission transactions

## 🎓 Classroom Usage

**Week 1-2:** Launch simulation, seed initial users

**Week 3-8:** Active recruitment phase

**Week 9-12:** Saturation (limited member pool)

**Week 13-14:** Educational reveal
- Pause simulation
- Project analytics
- Facilitate discussion

**Week 15-16:** Analysis and reflection

## ⚠️ Important Notes

- **Educational Only:** This is for teaching purposes
- **No Real Money:** Uses simulated Atlas Coins only
- **Classroom Controlled:** Instructor has full oversight
- **Safeguards Built-in:** Participant limits, semester duration
- **Ethical Use:** Always include educational context

## 📝 API Documentation

### Public Endpoints

- `POST /api/v1/auth/register` - Register new member
- `POST /api/v1/auth/login` - Login (member or instructor)
- `GET /api/v1/system/status` - Get simulation status

### Member Endpoints (Auth Required)

- `GET /api/v1/member/dashboard` - Dashboard data
- `GET /api/v1/member/network` - Network tree
- `GET /api/v1/member/earnings` - Earnings history
- `GET /api/v1/member/profile` - Profile info
- `PUT /api/v1/member/profile` - Update profile

### Instructor Endpoints (Auth Required)

- `GET /api/v1/instructor/analytics` - Comprehensive analytics
- `GET /api/v1/instructor/participants` - All participants
- `GET /api/v1/instructor/network-graph` - Full network graph
- `POST /api/v1/instructor/inject-coins` - Add coins to account
- `POST /api/v1/instructor/pause` - Pause simulation
- `POST /api/v1/instructor/resume` - Resume simulation
- `POST /api/v1/instructor/reset` - Reset simulation
- `POST /api/v1/instructor/export` - Export data (CSV/JSON)
- `PUT /api/v1/instructor/config` - Update configuration

## 🤝 Contributing

This is an educational project. Contributions should maintain the educational focus and safeguards.

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

Created for educational purposes to teach members about MLM schemes and financial literacy.

---

**Remember:** This simulator demonstrates why MLMs mathematically fail for most participants. Use it to educate, not to promote real MLM participation.
