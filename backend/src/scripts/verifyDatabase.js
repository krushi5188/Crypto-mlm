#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks if all required tables exist and reports any missing ones
 */

const { pool } = require('../config/database');

async function verifyDatabase() {
  console.log('\n========================================');
  console.log('  Database Verification');
  console.log('========================================\n');

  try {
    // Test connection
    console.log('1. Testing database connection...');
    const client = await pool.connect();
    console.log('   ✓ Database connected successfully\n');

    // Check required tables
    console.log('2. Checking required tables...');

    const requiredTables = [
      'users',
      'referrals',
      'transactions',
      'system_config',
      'admin_actions',
      'device_fingerprints',
      'ip_addresses',
      'fraud_rules',
      'fraud_alerts',
      'related_accounts',
      'user_preferences'
    ];

    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    `, [requiredTables]);

    const existingTables = result.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    console.log(`   Found ${existingTables.length} / ${requiredTables.length} tables\n`);

    if (existingTables.length > 0) {
      console.log('   ✓ Existing tables:');
      existingTables.forEach(table => {
        console.log(`     - ${table}`);
      });
      console.log('');
    }

    if (missingTables.length > 0) {
      console.log('   ✗ Missing tables:');
      missingTables.forEach(table => {
        console.log(`     - ${table}`);
      });
      console.log('\n   These tables are required for fraud detection.');
      console.log('   Run migration 008_fraud_detection.sql to create them.\n');
    }

    // Check fraud detection columns on users table
    console.log('3. Checking users table fraud detection columns...');
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name IN ('risk_score', 'is_flagged', 'flagged_at', 'flagged_reason', 'avatar_url')
    `);

    const existingColumns = columnResult.rows.map(row => row.column_name);
    const requiredColumns = ['risk_score', 'is_flagged', 'flagged_at', 'flagged_reason', 'avatar_url'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (existingColumns.length > 0) {
      console.log('   ✓ Existing columns:');
      existingColumns.forEach(col => {
        console.log(`     - ${col}`);
      });
      console.log('');
    }

    if (missingColumns.length > 0) {
      console.log('   ✗ Missing columns on users table:');
      missingColumns.forEach(col => {
        console.log(`     - ${col}`);
      });
      console.log('');
    }

    // Check search_path
    console.log('4. Checking database search_path...');
    const pathResult = await client.query('SHOW search_path');
    console.log(`   Current search_path: ${pathResult.rows[0].search_path}\n`);

    // Count records in key tables
    console.log('5. Checking table record counts...');

    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`   Users: ${userCount.rows[0].count}`);

    if (existingTables.includes('fraud_rules')) {
      const rulesCount = await client.query('SELECT COUNT(*) as count FROM fraud_rules');
      console.log(`   Fraud Rules: ${rulesCount.rows[0].count}`);
    }

    if (existingTables.includes('device_fingerprints')) {
      const deviceCount = await client.query('SELECT COUNT(*) as count FROM device_fingerprints');
      console.log(`   Device Fingerprints: ${deviceCount.rows[0].count}`);
    }

    if (existingTables.includes('ip_addresses')) {
      const ipCount = await client.query('SELECT COUNT(*) as count FROM ip_addresses');
      console.log(`   IP Addresses: ${ipCount.rows[0].count}`);
    }

    console.log('');

    // Summary
    console.log('========================================');
    console.log('  Verification Summary');
    console.log('========================================\n');

    if (missingTables.length === 0 && missingColumns.length === 0) {
      console.log('✓ All required tables and columns exist!');
      console.log('✓ Database is properly configured.\n');
    } else {
      console.log('✗ Database is missing some components:');
      if (missingTables.length > 0) {
        console.log(`  - ${missingTables.length} missing tables`);
      }
      if (missingColumns.length > 0) {
        console.log(`  - ${missingColumns.length} missing columns`);
      }
      console.log('\nTo fix:');
      console.log('  Run: psql <connection_string> -f backend/src/database/migrations/008_fraud_detection.sql\n');
    }

    client.release();
    await pool.end();

    process.exit(missingTables.length === 0 && missingColumns.length === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nConnection Details:');
    console.error('  Host:', process.env.DB_HOST || 'localhost');
    console.error('  Port:', process.env.DB_PORT || '5432');
    console.error('  Database:', process.env.DB_NAME || 'not set');
    console.error('  User:', process.env.DB_USER || 'not set');
    console.error('  SSL:', process.env.DB_SSL || 'not set');
    console.error('');

    await pool.end();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyDatabase();
}

module.exports = verifyDatabase;
