#!/usr/bin/env node

/**
 * Configure Platform Wallet Addresses Script
 * Sets up platform wallet addresses for different networks
 *
 * Usage: node backend/scripts/configureWalletAddresses.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { pool } = require('../src/config/database');

// Default wallet addresses (REPLACE THESE WITH REAL ADDRESSES)
const walletAddresses = {
  TRC20: process.env.PLATFORM_WALLET_TRC20 || 'TYourPlatformTRC20WalletAddressHere123456',
  ERC20: process.env.PLATFORM_WALLET_ERC20 || 'EYourPlatformERC20WalletAddressHere123456',
  BEP20: process.env.PLATFORM_WALLET_BEP20 || 'BYourPlatformBEP20WalletAddressHere123456'
};

async function configureWalletAddresses() {
  try {
    console.log('💼 Starting wallet address configuration...\n');

    for (const [network, address] of Object.entries(walletAddresses)) {
      const configKey = `platform_wallet_${network.toLowerCase()}`;

      // Check if config already exists
      const existing = await pool.query(
        'SELECT * FROM system_config WHERE config_key = $1',
        [configKey]
      );

      if (existing.rows.length > 0) {
        // Update existing
        await pool.query(
          'UPDATE system_config SET config_value = $1, updated_at = CURRENT_TIMESTAMP WHERE config_key = $2',
          [address, configKey]
        );
        console.log(`✅ Updated ${network} wallet address`);
      } else {
        // Insert new
        await pool.query(
          `INSERT INTO system_config (config_key, config_value, data_type, description)
           VALUES ($1, $2, 'string', $3)`,
          [configKey, address, `Platform ${network} wallet address for deposits`]
        );
        console.log(`✅ Inserted ${network} wallet address`);
      }

      console.log(`   ${network}: ${address}`);
      console.log('');
    }

    console.log('✅ Wallet addresses configured successfully!\n');

    // Display configuration summary
    console.log('📊 Platform Wallet Configuration:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('Network | Wallet Address');
    console.log('─────────────────────────────────────────────────────────────────');

    for (const [network, address] of Object.entries(walletAddresses)) {
      const networkStr = network.padEnd(7);
      console.log(`${networkStr} | ${address}`);
    }
    console.log('─────────────────────────────────────────────────────────────────\n');

    console.log('⚠️  IMPORTANT: Update these addresses with your real wallet addresses!');
    console.log('   You can set them via environment variables:');
    console.log('   - PLATFORM_WALLET_TRC20');
    console.log('   - PLATFORM_WALLET_ERC20');
    console.log('   - PLATFORM_WALLET_BEP20\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error configuring wallet addresses:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the configuration
configureWalletAddresses();
