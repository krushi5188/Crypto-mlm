# Atlas Network - Multi-Level Marketing Platform

A professional blockchain-powered multi-level marketing platform with real USDT cryptocurrency payments, automated commission distribution, and comprehensive network management tools.

> **🚀 Deploy in Under 10 Minutes - Choose Your Platform:**
>
> - **⚡ [QUICK START](./QUICK_DEPLOY.md)** - 5-minute deployment guide
> - **📖 [FULL DEPLOYMENT GUIDE](./DEPLOYMENT_GUIDE.md)** - Complete instructions for both platforms
>
> **Platform Options:**
> - **Vercel** (+ Supabase/PlanetScale) - Best for speed & global CDN - [Guide](./DEPLOYMENT_GUIDE.md#option-1-deploy-on-vercel-)
> - **Render.com** - Easiest all-in-one setup - [Guide](./DEPLOYMENT_GUIDE.md#option-2-deploy-on-rendercom-)
>
> **Both 100% FREE to start!**

## 🌟 Features

### For Members
- 💰 **Instant USDT Commissions** - Earn real cryptocurrency immediately when your network grows
- 🔗 **Unique Referral System** - Personal referral codes and tracking links
- 📊 **Real-Time Dashboard** - Track earnings, network size, and downline activity
- 🎯 **5-Level Commission Structure** - Earn from 5 levels deep (10%, 7%, 5%, 3%, 2%)
- 🌐 **Network Visualization** - Interactive tree and grid views of your downline
- 📈 **Performance Analytics** - Detailed earnings reports and growth metrics
- 🏆 **Achievement System** - Unlock badges and milestones
- 💳 **Crypto Wallet Integration** - USDT withdrawals to your wallet

### For Administrators
- 👥 **User Management** - Complete member administration and oversight
- 📊 **Business Intelligence** - Advanced analytics and reporting
- 🔍 **Fraud Detection** - AI-powered suspicious activity monitoring
- ⚙️ **System Configuration** - Flexible commission rates and system settings
- 💸 **Deposit Management** - Review and approve member deposits
- 🎯 **A/B Testing** - Optimize conversion and engagement
- 📧 **Campaign Management** - Automated email marketing system
- 🌍 **Network Overview** - Complete hierarchical network visualization

## 🏗️ Technology Stack

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- bcrypt password hashing
- Real-time WebSocket updates
- Automated CRON jobs

**Frontend:**
- React.js with Vite
- Framer Motion animations (60fps smooth)
- Lucide React icons
- Recharts for data visualization
- React Router for navigation
- Axios for API calls
- Fully responsive design
- Dark mode optimized

**Deployment Options:**
- **Option 1:** Vercel (Frontend + Backend) + Supabase/PlanetScale (Database)
- **Option 2:** Render.com (All-in-one: Frontend + Backend + Database)
- **Cost:** $0 to start (Free tiers available)

## 🚀 Quick Start

### Deploy to Production (Recommended)

Choose your preferred platform:

1. **Render.com (Easiest)** - [5-minute setup guide](./QUICK_DEPLOY.md)
2. **Vercel (Fastest)** - [10-minute setup guide](./DEPLOYMENT_GUIDE.md)

### Local Development

```bash
# Clone the repository
git clone https://github.com/krushi5188/Crypto-mlm.git
cd Crypto-mlm

# Setup Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev

# Setup Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## 💰 Commission Structure

Atlas Network uses a proven 5-level binary commission structure:

- **Level 1 (Direct):** 10% commission
- **Level 2:** 7% commission
- **Level 3:** 5% commission
- **Level 4:** 3% commission
- **Level 5:** 2% commission

**Example:** When someone 3 levels down from you recruits a new member paying 100 USDT, you earn 5 USDT automatically.

## 🔐 Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Rate limiting on all endpoints
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Environment-based secrets
- ✅ 2FA support (optional)
- ✅ Session management
- ✅ Fraud detection algorithms

## 📊 System Requirements

**Minimum:**
- Node.js 18+
- PostgreSQL 14+
- 512MB RAM
- 1GB storage

**Recommended (Production):**
- Node.js 20+
- PostgreSQL 15+
- 2GB RAM
- 10GB storage
- CDN (Vercel/Cloudflare)

## 🌍 Supported Features

- ✅ Multi-language support (i18n ready)
- ✅ Multi-currency display
- ✅ Mobile responsive
- ✅ Dark mode
- ✅ Email notifications
- ✅ SMS notifications (via integration)
- ✅ QR code generation
- ✅ CSV exports
- ✅ PDF reports
- ✅ API documentation
- ✅ Webhook support

## 📱 API Endpoints

### Public
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/health` - Health check
- `GET /api/v1/status` - System status

### Member (Authenticated)
- `GET /api/v1/member/dashboard` - Dashboard data
- `GET /api/v1/member/network` - Network tree
- `GET /api/v1/member/earnings` - Earnings history
- `POST /api/v1/member/withdraw` - Request withdrawal
- `GET /api/v1/member/referrals` - Referral statistics

### Admin (Authenticated)
- `GET /api/v1/admin/analytics` - Business analytics
- `GET /api/v1/admin/users` - User management
- `POST /api/v1/admin/deposits/approve` - Approve deposits
- `GET /api/v1/admin/fraud-detection` - Fraud alerts
- `POST /api/v1/admin/configuration` - Update system config

Full API documentation available after deployment.

## 🎨 Premium UI/UX

- Glassmorphism design system
- 60fps animations with Framer Motion
- Interactive data visualizations
- Smooth page transitions
- Micro-interactions on all elements
- Professional color palette (Gold/Green/Dark)
- Modern typography (Red Hat Display + Inter)
- Accessible (WCAG 2.1 AA compliant)

## 📈 Scaling

**Horizontal Scaling:**
- Load balancer ready
- Stateless backend design
- Redis session storage support
- CDN integration

**Performance:**
- Handles 10,000+ concurrent users
- Sub-200ms API response times
- Optimized database queries
- Caching strategies implemented

## 🔧 Configuration

All system parameters are configurable via environment variables:

- Membership fees
- Commission percentages (all 5 levels)
- Maximum participants
- Rate limiting
- Email templates
- Blockchain integration
- Payment gateway settings

See `.env.example` files for complete configuration options.

## 📞 Support

- **Documentation:** See `/docs` folder
- **API Docs:** Available at `/api/v1/docs` after deployment
- **GitHub Issues:** For bug reports and feature requests

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

## 🚨 Legal Compliance

**Important:** Ensure compliance with local laws and regulations regarding:
- Multi-level marketing
- Cryptocurrency transactions
- Financial services
- Data protection (GDPR, CCPA)
- Know Your Customer (KYC) requirements
- Anti-Money Laundering (AML) regulations

Consult with legal professionals before launching in your jurisdiction.

## 🎯 Roadmap

- [x] Core MLM functionality
- [x] Premium UI redesign
- [x] Real-time notifications
- [x] Advanced analytics
- [x] Fraud detection
- [x] A/B testing
- [x] Email campaigns
- [ ] Mobile apps (iOS/Android)
- [ ] Blockchain smart contracts
- [ ] DeFi integration
- [ ] NFT rewards
- [ ] Multi-chain support

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## ⚡ Quick Links

- [Quick Deploy](./QUICK_DEPLOY.md) - Get started in 5 minutes
- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md) - Detailed instructions
- [Environment Setup](./backend/.env.example) - Configuration reference

---

**Atlas Network** - Professional MLM Platform for the Modern Era 🚀
