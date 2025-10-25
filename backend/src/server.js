const path = require('path');
const fs = require('fs');

// Load .env file only in local development (not on Vercel)
// On Vercel, environment variables are injected automatically
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  // On Vercel/serverless, dotenv won't find a file, but env vars are already available
  require('dotenv').config();
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const { pool, testConnection } = require('./config/database');
const { hashPassword } = require('./utils/passwordHash');
const { apiLimiter } = require('./middleware/rateLimiter');
const User = require('./models/User');
const { generateReferralCode } = require('./utils/generateReferralCode');
const websocketService = require('./services/websocketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
// Allow CORS for same-origin requests in production and localhost in dev
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    // In production, allow requests from any origin (since frontend and backend are on same domain)
    // In development, allow localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow if origin matches or in production mode (same domain)
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Diagnostic endpoint (BEFORE any middleware that might fail)
app.get('/api/v1/status', (req, res) => {
  res.json({ 
    service: 'Atlas Network API',
    status: 'running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      initialized: isInitialized,
      configured: {
        host: !!process.env.DB_HOST,
        port: !!process.env.DB_PORT,
        user: !!process.env.DB_USER,
        password: !!process.env.DB_PASSWORD,
        database: !!process.env.DB_NAME,
        ssl: !!process.env.DB_SSL
      },
      values: {
        host: process.env.DB_HOST ? 'SET' : 'MISSING',
        port: process.env.DB_PORT || 'DEFAULT',
        user: process.env.DB_USER ? 'SET' : 'MISSING',
        database: process.env.DB_NAME ? 'SET' : 'MISSING',
        ssl: process.env.DB_SSL || 'MISSING'
      }
    },
    admin: {
      email: process.env.ADMIN_EMAIL ? 'SET' : 'MISSING',
      username: process.env.ADMIN_USERNAME ? 'SET' : 'MISSING',
      password: process.env.ADMIN_PASSWORD ? 'SET' : 'MISSING'
    }
  });
});

// Database test endpoint - actually tries to connect
app.get('/api/v1/db-test', async (req, res) => {
  try {
    // Test 1: Connection
    const connected = await testConnection();
    if (!connected) {
      return res.json({
        success: false,
        error: 'Database connection failed',
        step: 'connection'
      });
    }

    // Test 2: Query tables
    const client = await pool.connect();
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const tables = tablesResult.rows.map(r => r.table_name);
    
    // Test 3: Check if users table exists
    const usersTableExists = tables.includes('users');
    
    // Test 4: If users table exists, try to query it
    let userCount = null;
    if (usersTableExists) {
      const countResult = await client.query('SELECT COUNT(*) FROM users');
      userCount = parseInt(countResult.rows[0].count);
    }
    
    client.release();
    
    return res.json({
      success: true,
      connection: 'OK',
      tables: tables,
      usersTableExists: usersTableExists,
      userCount: userCount,
      initializationStatus: isInitialized
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
});

// Health check endpoint (BEFORE initialization - no database needed)
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: {
      initialized: isInitialized,
      host: process.env.DB_HOST ? 'configured' : 'missing',
      port: process.env.DB_PORT || 'not set',
      user: process.env.DB_USER ? 'configured' : 'missing',
      database: process.env.DB_NAME ? 'configured' : 'missing',
      ssl: process.env.DB_SSL || 'not set'
    },
    admin: {
      email: process.env.ADMIN_EMAIL || 'not set',
      username: process.env.ADMIN_USERNAME || 'not set'
    }
  });
});

// Comprehensive environment variable validation endpoint
app.get('/api/v1/env-check', async (req, res) => {
  const checks = [];
  let criticalIssues = 0;
  let warnings = 0;

  // Helper function to add check results
  const addCheck = (name, status, value, message, howToFix, priority = 'normal') => {
    checks.push({ name, status, value, message, howToFix, priority });
    if (status === 'error' && priority === 'critical') criticalIssues++;
    if (status === 'warning') warnings++;
  };

  // 1. Database Configuration
  if (!process.env.DB_HOST) {
    addCheck(
      'DB_HOST',
      'error',
      'MISSING',
      'Database host not configured',
      'Add DB_HOST=localhost (or your PostgreSQL host) to your .env file',
      'critical'
    );
  } else {
    addCheck('DB_HOST', 'ok', 'SET', `Database host: ${process.env.DB_HOST}`, null);
  }

  if (!process.env.DB_PORT) {
    addCheck(
      'DB_PORT',
      'warning',
      'DEFAULT (5432)',
      'Using default PostgreSQL port',
      'Add DB_PORT=5432 to your .env file (optional if using default)',
      'normal'
    );
  } else {
    addCheck('DB_PORT', 'ok', process.env.DB_PORT, `Database port: ${process.env.DB_PORT}`, null);
  }

  if (!process.env.DB_USER) {
    addCheck(
      'DB_USER',
      'error',
      'MISSING',
      'Database user not configured',
      'Add DB_USER=postgres (or your PostgreSQL username) to your .env file',
      'critical'
    );
  } else {
    addCheck('DB_USER', 'ok', 'SET', `Database user configured`, null);
  }

  if (!process.env.DB_PASSWORD) {
    addCheck(
      'DB_PASSWORD',
      'error',
      'MISSING',
      'Database password not configured - THIS IS LIKELY THE ISSUE',
      'Add DB_PASSWORD=your_password_here to your .env file. Use the password for your PostgreSQL user.',
      'critical'
    );
  } else {
    addCheck('DB_PASSWORD', 'ok', 'SET', `Database password configured`, null);
  }

  if (!process.env.DB_NAME) {
    addCheck(
      'DB_NAME',
      'error',
      'MISSING',
      'Database name not configured',
      'Add DB_NAME=crypto_mlm to your .env file. Make sure this database exists in PostgreSQL.',
      'critical'
    );
  } else {
    addCheck('DB_NAME', 'ok', 'SET', `Database name: ${process.env.DB_NAME}`, null);
  }

  // 2. JWT Configuration
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    addCheck(
      'JWT_SECRET',
      'warning',
      'DEFAULT/MISSING',
      'Using default JWT secret (insecure for production)',
      'Add JWT_SECRET=your_random_secret_key_here to your .env file. Generate a strong random string.',
      'normal'
    );
  } else {
    addCheck('JWT_SECRET', 'ok', 'SET', `JWT secret configured`, null);
  }

  if (!process.env.JWT_EXPIRES_IN) {
    addCheck(
      'JWT_EXPIRES_IN',
      'info',
      'DEFAULT (7d)',
      'Using default token expiration (7 days)',
      'Add JWT_EXPIRES_IN=7d to your .env file (optional)',
      'normal'
    );
  } else {
    addCheck('JWT_EXPIRES_IN', 'ok', process.env.JWT_EXPIRES_IN, `Token expiration: ${process.env.JWT_EXPIRES_IN}`, null);
  }

  // 3. Server Configuration
  if (!process.env.PORT) {
    addCheck(
      'PORT',
      'info',
      'DEFAULT (3001)',
      'Using default port',
      'Add PORT=3001 to your .env file (optional)',
      'normal'
    );
  } else {
    addCheck('PORT', 'ok', process.env.PORT, `Server port: ${process.env.PORT}`, null);
  }

  if (!process.env.NODE_ENV) {
    addCheck(
      'NODE_ENV',
      'info',
      'DEFAULT (development)',
      'Environment not specified',
      'Add NODE_ENV=development to your .env file (optional)',
      'normal'
    );
  } else {
    addCheck('NODE_ENV', 'ok', process.env.NODE_ENV, `Environment: ${process.env.NODE_ENV}`, null);
  }

  // 4. Admin Account Configuration
  if (!process.env.ADMIN_EMAIL) {
    addCheck(
      'ADMIN_EMAIL',
      'warning',
      'DEFAULT',
      'Using default admin email (instructor@university.edu)',
      'Add ADMIN_EMAIL=your@email.com to your .env file (optional)',
      'normal'
    );
  } else {
    addCheck('ADMIN_EMAIL', 'ok', process.env.ADMIN_EMAIL, `Admin email: ${process.env.ADMIN_EMAIL}`, null);
  }

  if (!process.env.ADMIN_USERNAME) {
    addCheck(
      'ADMIN_USERNAME',
      'warning',
      'DEFAULT',
      'Using default admin username (instructor)',
      'Add ADMIN_USERNAME=your_username to your .env file (optional)',
      'normal'
    );
  } else {
    addCheck('ADMIN_USERNAME', 'ok', 'SET', `Admin username configured`, null);
  }

  if (!process.env.ADMIN_PASSWORD) {
    addCheck(
      'ADMIN_PASSWORD',
      'warning',
      'DEFAULT',
      'Using default admin password (insecure)',
      'Add ADMIN_PASSWORD=YourSecurePassword123! to your .env file (optional but recommended)',
      'normal'
    );
  } else {
    addCheck('ADMIN_PASSWORD', 'ok', 'SET', `Admin password configured`, null);
  }

  // 5. Test database connection if critical vars are present
  let dbConnectionTest = null;
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
    try {
      const connected = await testConnection();
      if (connected) {
        dbConnectionTest = {
          status: 'success',
          message: 'Database connection successful'
        };
      } else {
        dbConnectionTest = {
          status: 'failed',
          message: 'Database connection failed - check credentials and ensure PostgreSQL is running',
          howToFix: '1. Verify PostgreSQL is running: sudo service postgresql status\n2. Check credentials are correct\n3. Ensure database exists: psql -U postgres -c "CREATE DATABASE crypto_mlm;"'
        };
        criticalIssues++;
      }
    } catch (error) {
      dbConnectionTest = {
        status: 'error',
        message: `Database connection error: ${error.message}`,
        code: error.code,
        howToFix: 'Check that PostgreSQL is installed and running, and that your credentials are correct'
      };
      criticalIssues++;
    }
  } else {
    dbConnectionTest = {
      status: 'skipped',
      message: 'Cannot test connection - missing required environment variables'
    };
  }

  // Overall assessment
  let overallStatus = 'healthy';
  let summary = 'All critical environment variables are configured correctly';
  
  if (criticalIssues > 0) {
    overallStatus = 'critical';
    summary = `${criticalIssues} critical issue(s) found. Application will not work properly.`;
  } else if (warnings > 0) {
    overallStatus = 'warning';
    summary = `${warnings} warning(s) found. Application will work but some settings use defaults.`;
  }

  // Response
  res.json({
    overallStatus,
    summary,
    criticalIssues,
    warnings,
    timestamp: new Date().toISOString(),
    checks,
    databaseConnectionTest: dbConnectionTest,
    quickFix: {
      message: 'Create a .env file in the backend directory with these variables',
      example: `# Database Configuration (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_NAME=crypto_mlm

# JWT Configuration (REQUIRED for production)
JWT_SECRET=your-random-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Server Configuration (OPTIONAL)
PORT=3001
NODE_ENV=development

# Admin Account (OPTIONAL - defaults will be used)
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecurePassword123!

# Frontend URL for CORS (OPTIONAL)
FRONTEND_URL=http://localhost:3000`,
      steps: [
        '1. Create a file named .env in the backend directory',
        '2. Copy the example above and fill in your actual values',
        '3. Make sure PostgreSQL is installed and running',
        '4. Create the database: psql -U postgres -c "CREATE DATABASE crypto_mlm;"',
        '5. Restart the backend server',
        '6. Visit /api/v1/env-check again to verify'
      ]
    }
  });
});

// Initialize database and create instructor account if needed
let isInitialized = false;
const initializeDatabase = async () => {
  if (isInitialized) return;
  
  try {
    console.log('Initializing database...');

    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Check if instructor account exists
    const instructorEmail = process.env.ADMIN_EMAIL || 'instructor@university.edu';
    const existingInstructor = await User.findByEmail(instructorEmail);

    if (!existingInstructor) {
      console.log('Creating instructor account...');

      const instructorUsername = process.env.ADMIN_USERNAME || 'instructor';
      const instructorPassword = process.env.ADMIN_PASSWORD || 'InstructorPassword123!';

      const passwordHash = await hashPassword(instructorPassword);
      const referralCode = await generateReferralCode();

      await User.create({
        email: instructorEmail,
        username: instructorUsername,
        password_hash: passwordHash,
        role: 'instructor',
        referral_code: referralCode,
        referred_by_id: null
      });

      console.log('✓ Instructor account created');
      console.log(`  Email: ${instructorEmail}`);
      console.log(`  Username: ${instructorUsername}`);
    } else {
      console.log('✓ Instructor account already exists');
    }

    console.log('✓ Database initialization complete');
    isInitialized = true;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};

// Lazy initialization - runs once in background, doesn't block requests
// On Vercel/serverless, this will run on first cold start but won't block
if (process.env.NODE_ENV === 'production') {
  // In production (Vercel), skip blocking initialization
  // Instructor account should already exist in database
  console.log('Production mode: Skipping blocking initialization');
  isInitialized = true; // Mark as initialized to skip checks
} else {
  // In development, initialize in background (non-blocking)
  initializeDatabase().catch(err => {
    console.error('Background initialization failed:', err);
  });
}

// Routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const instructorRoutes = require('./routes/instructor');
const systemRoutes = require('./routes/system');
const gamificationRoutes = require('./routes/gamification');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/gamification', gamificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Atlas Network API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      member: '/api/v1/member',
      instructor: '/api/v1/instructor',
      system: '/api/v1/system',
      gamification: '/api/v1/gamification'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();

    // Initialize WebSocket
    websocketService.initialize(server);
    console.log('✓ WebSocket service initialized');

    server.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  Atlas Network API');
      console.log('========================================');
      console.log(`  Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  API Base: http://localhost:${PORT}/api/v1`);
      console.log(`  WebSocket: Enabled`);
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

// Export the app for serverless (Vercel)
module.exports = app;

// Start the server only when running directly (not imported)
if (require.main === module) {
  startServer();
}
