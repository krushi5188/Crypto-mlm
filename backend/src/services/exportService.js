const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs').promises;
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Referral = require('../models/Referral');

class ExportService {
  /**
   * Export data to CSV or JSON format
   */
  static async exportData(exportType, format = 'csv') {
    let data;
    let filename;

    switch (exportType) {
      case 'participants':
        data = await this.getParticipantsData();
        filename = `participants_${this.getDateString()}`;
        break;

      case 'transactions':
        data = await this.getTransactionsData();
        filename = `transactions_${this.getDateString()}`;
        break;

      case 'network':
        data = await this.getNetworkData();
        filename = `network_${this.getDateString()}`;
        break;

      case 'analytics':
        data = await this.getAnalyticsData();
        filename = `analytics_${this.getDateString()}`;
        break;

      default:
        throw new Error('Invalid export type');
    }

    if (format === 'csv') {
      return await this.generateCSV(data, filename);
    } else if (format === 'json') {
      return await this.generateJSON(data, filename);
    } else {
      throw new Error('Invalid export format');
    }
  }

  /**
   * Get participants data
   */
  static async getParticipantsData() {
    const { participants } = await User.getAllStudents(1, 10000);

    return participants.map(p => ({
      id: p.id,
      username: p.username,
      email: p.email,
      balance: p.balance,
      totalEarned: p.total_earned,
      directRecruits: p.direct_recruits,
      networkSize: p.network_size,
      joinedAt: p.created_at,
      lastLogin: p.last_login
    }));
  }

  /**
   * Get transactions data
   */
  static async getTransactionsData() {
    return await Transaction.getAllTransactions();
  }

  /**
   * Get network data
   */
  static async getNetworkData() {
    const { nodes, edges } = await Referral.getCompleteNetwork();

    return nodes.map(node => {
      const userEdges = edges.filter(e => e.from_id === node.id);
      return {
        id: node.id,
        username: node.username,
        balance: node.balance,
        directRecruits: node.direct_recruits,
        referralCount: userEdges.length
      };
    });
  }

  /**
   * Get analytics summary data
   */
  static async getAnalyticsData() {
    const distStats = await User.getDistributionStats();
    const topEarners = await User.getTopEarners(10);

    return [{
      totalMembers: distStats.total_members,
      zeroBalance: distStats.zero_balance,
      brokeEven: distStats.broke_even,
      profited: distStats.profited,
      totalBalance: distStats.total_balance,
      topEarner: topEarners[0]?.username || 'N/A',
      topEarnerBalance: topEarners[0]?.balance || 0
    }];
  }

  /**
   * Generate CSV file
   */
  static async generateCSV(data, filename) {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const tmpDir = path.join(__dirname, '../../tmp');
    await fs.mkdir(tmpDir, { recursive: true });

    const filepath = path.join(tmpDir, `${filename}.csv`);

    // Get headers from first object
    const headers = Object.keys(data[0]).map(key => ({
      id: key,
      title: key.toUpperCase()
    }));

    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: headers
    });

    await csvWriter.writeRecords(data);

    return {
      filepath,
      filename: `${filename}.csv`,
      contentType: 'text/csv'
    };
  }

  /**
   * Generate JSON file
   */
  static async generateJSON(data, filename) {
    const tmpDir = path.join(__dirname, '../../tmp');
    await fs.mkdir(tmpDir, { recursive: true });

    const filepath = path.join(tmpDir, `${filename}.json`);

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    return {
      filepath,
      filename: `${filename}.json`,
      contentType: 'application/json'
    };
  }

  /**
   * Get formatted date string for filenames
   */
  static getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Clean up old export files
   */
  static async cleanupOldFiles() {
    const tmpDir = path.join(__dirname, '../../tmp');
    try {
      const files = await fs.readdir(tmpDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      for (const file of files) {
        const filepath = path.join(tmpDir, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtimeMs > oneHour) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or other error - ignore
    }
  }
}

module.exports = ExportService;
