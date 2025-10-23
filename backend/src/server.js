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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const instructorRoutes = require('./routes/instructor');
const systemRoutes = require('./routes/system');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/instructor', instructorRoutes);
app.use('/api/v1/system', systemRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root endpoint
app.get('/api', (req, res) => {
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

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    code: 'NOT_FOUND'
  });
});

// Initialize database and create instructor account if needed
const initializeDatabase = async () => {
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
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};

// Initialize database on startup (works for both local and serverless)
let dbInitialized = false;
const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

// Run initialization on first request (serverless)
app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(503).json({
      error: 'Service temporarily unavailable',
      code: 'DB_INIT_ERROR'
    });
  }
});

// Start server only if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
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

  startServer();

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
}

// Export for Vercel serverless
module.exports = app;
