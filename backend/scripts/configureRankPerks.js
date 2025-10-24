#!/usr/bin/env node

/**
 * Configure Rank Perks Script
 * Sets up commission multipliers and other perks for each rank
 *
 * Usage: node backend/scripts/configureRankPerks.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { pool } = require('../src/config/database');

// Define perks for each rank
const rankPerks = {
  'Newbie': {
    commissionMultiplier: 1.0,
    withdrawalFeeDiscount: 0,
    features: []
  },
  'Starter': {
    commissionMultiplier: 1.05,
    withdrawalFeeDiscount: 0,
    features: ['Basic analytics']
  },
  'Builder': {
    commissionMultiplier: 1.1,
    withdrawalFeeDiscount: 5,
    features: ['Basic analytics', 'Team resources']
  },
  'Recruiter': {
    commissionMultiplier: 1.15,
    withdrawalFeeDiscount: 10,
    features: ['Advanced analytics', 'Team resources', 'Priority support']
  },
  'Manager': {
    commissionMultiplier: 1.25,
    withdrawalFeeDiscount: 15,
    features: ['Advanced analytics', 'Team resources', 'Priority support', 'Custom training']
  },
  'Director': {
    commissionMultiplier: 1.35,
    withdrawalFeeDiscount: 20,
    features: ['Advanced analytics', 'Team resources', 'Priority support', 'Custom training', 'Fast withdrawals']
  },
  'Executive': {
    commissionMultiplier: 1.5,
    withdrawalFeeDiscount: 25,
    features: ['Advanced analytics', 'Team resources', 'Priority support', 'Custom training', 'Fast withdrawals', 'Exclusive events']
  },
  'Diamond': {
    commissionMultiplier: 2.0,
    withdrawalFeeDiscount: 30,
    features: ['Advanced analytics', 'Team resources', 'Priority support', 'Custom training', 'Fast withdrawals', 'Exclusive events', 'Personal account manager']
  }
};

async function configureRankPerks() {
  try {
    console.log('🎯 Starting rank perks configuration...\n');

    // Get all ranks
    const ranksResult = await pool.query('SELECT * FROM user_ranks ORDER BY rank_order ASC');
    const ranks = ranksResult.rows;

    console.log(`Found ${ranks.length} ranks\n`);

    for (const rank of ranks) {
      const perks = rankPerks[rank.rank_name];

      if (!perks) {
        console.log(`⚠️  No perks defined for rank: ${rank.rank_name}`);
        continue;
      }

      // Update rank with perks
      await pool.query(
        'UPDATE user_ranks SET perks = $1 WHERE id = $2',
        [JSON.stringify(perks), rank.id]
      );

      console.log(`✅ ${rank.badge_icon} ${rank.rank_name}`);
      console.log(`   Commission Multiplier: ${perks.commissionMultiplier}x`);
      console.log(`   Withdrawal Fee Discount: ${perks.withdrawalFeeDiscount}%`);
      console.log(`   Features: ${perks.features.length > 0 ? perks.features.join(', ') : 'None'}`);
      console.log('');
    }

    console.log('✅ Rank perks configured successfully!\n');

    // Display summary table
    console.log('📊 Rank Perks Summary:');
    console.log('─────────────────────────────────────────────────────────────────────');
    console.log('Rank          | Commission | Fee Discount | Features');
    console.log('─────────────────────────────────────────────────────────────────────');

    for (const rank of ranks) {
      const perks = rankPerks[rank.rank_name];
      if (perks) {
        const rankName = rank.rank_name.padEnd(13);
        const commissionStr = `${perks.commissionMultiplier}x`.padEnd(10);
        const discountStr = `${perks.withdrawalFeeDiscount}%`.padEnd(12);
        const featuresCount = perks.features.length;
        console.log(`${rankName} | ${commissionStr} | ${discountStr} | ${featuresCount} features`);
      }
    }
    console.log('─────────────────────────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error configuring rank perks:', error.message);
    process.exit(1);
  }
}

// Run the configuration
configureRankPerks();
