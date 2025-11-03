const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool for better performance
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atlas_network_simulator',
  max: process.env.NODE_ENV === 'production' ? 5 : 10, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // SSL for production databases (Supabase requires SSL)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✓ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
