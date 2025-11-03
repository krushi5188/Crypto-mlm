// backend/knexfile.js
const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, './dev.sqlite3')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, './src/database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, './src/database/seeds')
    }
  },
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      directory: path.resolve(__dirname, './src/database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, './src/database/seeds')
    }
  }
};
