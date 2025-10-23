require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./config/database');
const { hashPassword } = require('./utils/passwordHash');
const { apiLimiter } = require('./middleware/rateLimiter');
const User = require('./models/User');
const { generateReferralCode } = require('./utils/generateReferralCode');

const app = express();
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

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Diagnostic endpoint (BEFORE any middleware that might fail)
app.get('/api/v1/status', (req, res) => {
  res.json({ 
    service: 'Educational MLM Simulator API',
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

// Middleware to ensure database is initialized (for serverless)
app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('Initialization error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return res.status(503).json({
        error: 'Service initializing, please try again',
        code: 'INITIALIZING',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const instructorRoutes = require('./routes/instructor');
const systemRoutes = require('./routes/system');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/system', systemRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Educational MLM Simulator API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      student: '/api/v1/student',
      instructor: '/api/v1/instructor',
      system: '/api/v1/system'
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

    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('  Educational MLM Simulator API');
      console.log('========================================');
      console.log(`  Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  API Base: http://localhost:${PORT}/api/v1`);
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
