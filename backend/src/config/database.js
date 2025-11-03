const knex = require('knex');
const knexConfig = require('../../knexfile');
require('dotenv').config();

// Use 'development' config by default, but allow override for test/production
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`Database configuration for environment '${environment}' not found in knexfile.js`);
}

// Create a single connection instance
const db = knex(config);

// Expose the raw knex connection pool (for services that use it directly)
const pool = db.client.pool;

// Test database connection using knex
const testConnection = async () => {
  try {
    // Knex doesn't have a direct 'connect' test, but we can run a simple query
    await db.raw('SELECT 1+1 AS result');
    console.log(`✓ Database connected successfully (env: ${environment})`);
    return true;
  } catch (error) {
    console.error(`✗ Database connection failed (env: ${environment}):`, error.message);
    return false;
  }
};

module.exports = {
  // Main knex instance for query building
  db,
  // Raw pool for legacy services
  pool,
  testConnection
};
