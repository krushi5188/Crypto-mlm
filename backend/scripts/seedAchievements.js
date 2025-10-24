#!/usr/bin/env node

/**
 * Seed Achievements Script
 * Populates the achievements table with initial data
 *
 * Usage: node backend/scripts/seedAchievements.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Achievement = require('../src/models/Achievement');
const { pool } = require('../src/config/database');

async function seedAchievements() {
  try {
    console.log('🌱 Starting achievement seeding...\n');

    // Seed achievements using the model's method
    await Achievement.seedAchievements();

    console.log('✅ Achievements seeded successfully!\n');

    // Display seeded achievements
    const achievements = await Achievement.getAll();

    console.log(`📊 Total achievements: ${achievements.length}\n`);

    console.log('Achievement List:');
    console.log('─────────────────────────────────────────────────────');

    achievements.forEach((achievement, index) => {
      console.log(`${index + 1}. ${achievement.icon} ${achievement.name} (${achievement.points} points)`);
      console.log(`   Category: ${achievement.category}`);
      console.log(`   ${achievement.description}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding achievements:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedAchievements();
