# Atlas Network Educational Simulator - Backend

Node.js/Express backend API for the Atlas Network Educational MLM Simulator.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** Joi
- **Rate Limiting:** express-rate-limit

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL credentials
- `JWT_SECRET` - Secret key for JWT tokens
- `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` - Instructor account

## Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE atlas_network_simulator;

# Import schema
mysql -u root -p atlas_network_simulator < src/database/schema.sql
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on port 3001 by default.

## API Endpoints

See main README.md for complete API documentation.

## Project Structure

```
src/
├── config/          # Database and JWT configuration
├── middleware/      # Auth, validation, rate limiting
├── models/          # Database models (User, Transaction, etc.)
├── routes/          # API route handlers
├── services/        # Business logic (commissions, analytics)
├── utils/           # Helper functions
├── database/        # SQL schema and migrations
└── server.js        # Application entry point
```

## Key Features

### Commission Distribution

The commission service handles the core MLM logic:
- Atomic transactions (all-or-nothing)
- 5-level upline commission distribution
- Automatic referral tree creation
- Balance updates

### Analytics Service

Calculates system-wide statistics:
- Participant distribution
- Wealth concentration
- Gini coefficient (inequality measure)
- Top earners analysis

### Security

- JWT authentication on all protected routes
- bcrypt password hashing (10 rounds)
- Rate limiting on sensitive endpoints
- Input validation with Joi schemas
- SQL injection protection (parameterized queries)

## License

MIT
