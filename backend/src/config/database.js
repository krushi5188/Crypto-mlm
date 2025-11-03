const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: process.env.DB_CLIENT || 'pg',
  connection: process.env.DB_CLIENT === 'sqlite3'
    ? { filename: process.env.DB_CONNECTION }
    : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
  useNullAsDefault: process.env.DB_CLIENT === 'sqlite3'
});

const testConnection = async () => {
  try {
    await db.raw('select 1+1 as result');
    console.log('✓ Database connected successfully');
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
};

module.exports = { db, testConnection };
