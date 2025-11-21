const { pool } = require('../config/database');

class LeaderboardService {
  /**
   * Get top earners leaderboard
   */
  static async getTopEarners(limit = 100, period = 'all_time') {
    try {
      let dateFilter = '';

      if (period === 'weekly') {
        dateFilter = `AND t.created_at >= NOW() - INTERVAL '7 days'`;
      } else if (period === 'monthly') {
        dateFilter = `AND t.created_at >= NOW() - INTERVAL '30 days'`;
      }

      const query = `
        SELECT
          u.id,
          u.username,
          u.email,
          u.current_rank_id,
          r.rank_name,
          r.badge_icon,
          r.badge_color,
          ${period === 'all_time'
            ? 'u.total_earned as earnings'
            : 'COALESCE(SUM(t.amount), 0) as earnings'
          },
          u.direct_recruits,
          u.network_size,
          u.created_at as joined_at
        FROM users u
        LEFT JOIN user_ranks r ON u.current_rank_id = r.id
        ${period !== 'all_time' ? `
          LEFT JOIN transactions t ON t.user_id = u.id
            AND t.type = 'commission'
            ${dateFilter}
        ` : ''}
        ${period !== 'all_time' ? 'GROUP BY u.id, r.id' : ''}
        ORDER BY ${period === 'all_time' ? 'u.total_earned' : 'earnings'} DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);

      const realData = result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        username: row.username,
        earnings: parseFloat(row.earnings),
        currentRank: {
          id: row.current_rank_id,
          name: row.rank_name,
          icon: row.badge_icon,
          color: row.badge_color
        },
        directRecruits: row.direct_recruits,
        networkSize: row.network_size,
        joinedAt: row.joined_at
      }));

      return this.injectGhostData(realData, 'earnings', limit);
    } catch (error) {
      console.error('Get top earners error:', error);
      throw error;
    }
  }

  /**
   * Get top recruiters leaderboard
   */
  static async getTopRecruiters(limit = 100, period = 'all_time') {
    try {
      let query;

      if (period === 'all_time') {
        query = `
          SELECT
            u.id,
            u.username,
            u.email,
            u.current_rank_id,
            r.rank_name,
            r.badge_icon,
            r.badge_color,
            u.direct_recruits as recruit_count,
            u.network_size,
            u.total_earned,
            u.created_at as joined_at
          FROM users u
          LEFT JOIN user_ranks r ON u.current_rank_id = r.id
          ORDER BY u.direct_recruits DESC
          LIMIT $1
        `;
      } else {
        const dateFilter = period === 'weekly'
          ? `NOW() - INTERVAL '7 days'`
          : `NOW() - INTERVAL '30 days'`;

        query = `
          SELECT
            u.id,
            u.username,
            u.email,
            u.current_rank_id,
            r.rank_name,
            r.badge_icon,
            r.badge_color,
            COUNT(recruited.id) as recruit_count,
            u.network_size,
            u.total_earned,
            u.created_at as joined_at
          FROM users u
          LEFT JOIN user_ranks r ON u.current_rank_id = r.id
          LEFT JOIN users recruited ON recruited.referred_by_id = u.id
            AND recruited.created_at >= ${dateFilter}
          GROUP BY u.id, r.id
          ORDER BY recruit_count DESC
          LIMIT $1
        `;
      }

      const result = await pool.query(query, [limit]);

      const realData = result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        username: row.username,
        recruitCount: parseInt(row.recruit_count),
        currentRank: {
          id: row.current_rank_id,
          name: row.rank_name,
          icon: row.badge_icon,
          color: row.badge_color
        },
        networkSize: row.network_size,
        totalEarned: parseFloat(row.total_earned),
        joinedAt: row.joined_at
      }));

      return this.injectGhostData(realData, 'recruits', limit);
    } catch (error) {
      console.error('Get top recruiters error:', error);
      throw error;
    }
  }

  /**
   * Inject ghost (bot) data to populate empty leaderboards
   */
  static injectGhostData(realData, type, limit) {
    // Ensure ghost members are always present
    // We want a mix of high performers (50-70 invites) and some regular ones

    const botNames = [
      'CryptoKing99', 'SatoshiDream', 'MoonWalker', 'AlphaWolf', 'HodlGang',
      'BitcoinBaron', 'EthEmpire', 'ChainMaster', 'BlockBuilder', 'DefiDynasty',
      'TokenTitan', 'YieldFarmer', 'MintMaster', 'HashHero', 'NodeNinja',
      'LedgerLegend', 'WalletWhale', 'CoinCaptain', 'AssetAce', 'ValueViking',
      'BullRun2025', 'WhaleWatcher', 'SmartMoney', 'DiamondHands', 'HODLer'
    ];

    const ghostData = [];
    // Generate ~25 ghosts to populate the leaderboard
    // Some are top tier (Whales), some are mid tier

    for (let i = 0; i < 25; i++) {
      const name = botNames[i % botNames.length] + (i > botNames.length ? i : '');
      let earnings, recruits;

      // Top 5 ghosts are "Whales" (50-70 invites) as requested
      if (i < 5) {
        recruits = Math.floor(Math.random() * 21) + 50; // 50 to 70
        earnings = (recruits * 10) + (Math.random() * 5000); // Realistic earnings based on recruits
      } else if (i < 15) {
        // Mid tier
        recruits = Math.floor(Math.random() * 30) + 10; // 10 to 40
        earnings = (recruits * 10) + (Math.random() * 1000);
      } else {
        // Low tier / inactive
        recruits = Math.floor(Math.random() * 10); // 0 to 9
        earnings = (recruits * 10) + (Math.random() * 100);
      }

      ghostData.push({
        rank: 0,
        userId: -1 * (i + 1),
        username: name,
        earnings: parseFloat(earnings.toFixed(2)),
        recruitCount: recruits,
        currentRank: {
          id: 99,
          name: recruits >= 50 ? 'Diamond' : recruits >= 25 ? 'Gold' : recruits >= 10 ? 'Silver' : 'Starter',
          icon: recruits >= 50 ? '💎' : recruits >= 25 ? '🥇' : recruits >= 10 ? '🥈' : '🌱',
          color: recruits >= 50 ? '#b9f2ff' : '#ffd700'
        },
        directRecruits: recruits,
        networkSize: recruits * (Math.floor(Math.random() * 5) + 1),
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000))
      });
    }

    // Merge Real Data with Ghost Data
    // Real users compete with ghosts. If a real user has 60 recruits, they will rank among the Whales.
    const combined = [...realData, ...ghostData];

    if (type === 'earnings') {
      combined.sort((a, b) => b.earnings - a.earnings);
    } else {
      combined.sort((a, b) => (b.recruitCount || b.directRecruits) - (a.recruitCount || a.directRecruits));
    }

    // Re-assign ranks and slice to limit
    return combined.slice(0, limit).map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  /**
   * Get fastest growing networks
   */
  static async getFastestGrowing(limit = 100, period = 'monthly') {
    try {
      const dateFilter = period === 'weekly'
        ? `NOW() - INTERVAL '7 days'`
        : `NOW() - INTERVAL '30 days'`;

      const query = `
        SELECT
          u.id,
          u.username,
          u.email,
          u.current_rank_id,
          r.rank_name,
          r.badge_icon,
          r.badge_color,
          COUNT(recruited.id) as new_members,
          u.network_size as total_network_size,
          u.direct_recruits,
          u.total_earned,
          u.created_at as joined_at
        FROM users u
        LEFT JOIN user_ranks r ON u.current_rank_id = r.id
        LEFT JOIN referrals ref ON ref.referrer_id = u.id
        LEFT JOIN users recruited ON recruited.id = ref.referred_user_id
          AND recruited.created_at >= ${dateFilter}
        WHERE u.created_at < ${dateFilter}
        GROUP BY u.id, r.id
        HAVING COUNT(recruited.id) > 0
        ORDER BY new_members DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);

      return result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.id,
        username: row.username,
        newMembers: parseInt(row.new_members),
        totalNetworkSize: row.total_network_size,
        currentRank: {
          id: row.current_rank_id,
          name: row.rank_name,
          icon: row.badge_icon,
          color: row.badge_color
        },
        directRecruits: row.direct_recruits,
        totalEarned: parseFloat(row.total_earned),
        joinedAt: row.joined_at
      }));
    } catch (error) {
      console.error('Get fastest growing error:', error);
      throw error;
    }
  }

  /**
   * Get combined leaderboard data
   */
  static async getCombinedLeaderboard(limit = 100, period = 'all_time') {
    try {
      const [topEarners, topRecruiters, fastestGrowing] = await Promise.all([
        this.getTopEarners(limit, period),
        this.getTopRecruiters(limit, period),
        period !== 'all_time' ? this.getFastestGrowing(limit, period) : Promise.resolve([])
      ]);

      return {
        topEarners,
        topRecruiters,
        fastestGrowing: period !== 'all_time' ? fastestGrowing : []
      };
    } catch (error) {
      console.error('Get combined leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Create a leaderboard snapshot for historical tracking
   */
  static async createSnapshot(periodType, startDate, endDate) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get leaderboard data based on period
      const topEarners = await this.getTopEarners(100, periodType);
      const topRecruiters = await this.getTopRecruiters(100, periodType);

      // Insert snapshot
      const result = await client.query(
        `INSERT INTO leaderboard_snapshots
         (period_type, period_start, period_end, top_earners_data, top_recruiters_data)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          periodType,
          startDate,
          endDate,
          JSON.stringify(topEarners),
          JSON.stringify(topRecruiters)
        ]
      );

      await client.query('COMMIT');

      return {
        snapshotId: result.rows[0].id,
        periodType,
        periodStart: startDate,
        periodEnd: endDate,
        topEarnersCount: topEarners.length,
        topRecruitersCount: topRecruiters.length
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create snapshot error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get historical leaderboard snapshot
   */
  static async getHistoricalLeaderboard(periodType, date = null) {
    try {
      let query;
      let params;

      if (date) {
        // Get specific snapshot by date
        query = `
          SELECT id, period_type, period_start, period_end,
                 top_earners_data, top_recruiters_data, created_at
          FROM leaderboard_snapshots
          WHERE period_type = $1
            AND period_start <= $2
            AND period_end >= $2
          ORDER BY created_at DESC
          LIMIT 1
        `;
        params = [periodType, date];
      } else {
        // Get most recent snapshot
        query = `
          SELECT id, period_type, period_start, period_end,
                 top_earners_data, top_recruiters_data, created_at
          FROM leaderboard_snapshots
          WHERE period_type = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        params = [periodType];
      }

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      const snapshot = result.rows[0];

      return {
        snapshotId: snapshot.id,
        periodType: snapshot.period_type,
        periodStart: snapshot.period_start,
        periodEnd: snapshot.period_end,
        topEarners: typeof snapshot.top_earners_data === 'string'
          ? JSON.parse(snapshot.top_earners_data)
          : snapshot.top_earners_data,
        topRecruiters: typeof snapshot.top_recruiters_data === 'string'
          ? JSON.parse(snapshot.top_recruiters_data)
          : snapshot.top_recruiters_data,
        createdAt: snapshot.created_at
      };
    } catch (error) {
      console.error('Get historical leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Get all snapshots for a period type
   */
  static async getSnapshotHistory(periodType, limit = 12) {
    try {
      const result = await pool.query(
        `SELECT id, period_type, period_start, period_end, created_at
         FROM leaderboard_snapshots
         WHERE period_type = $1
         ORDER BY period_start DESC
         LIMIT $2`,
        [periodType, limit]
      );

      return result.rows.map(row => ({
        snapshotId: row.id,
        periodType: row.period_type,
        periodStart: row.period_start,
        periodEnd: row.period_end,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Get snapshot history error:', error);
      throw error;
    }
  }

  /**
   * Get user's position in leaderboard
   */
  static async getUserPosition(userId, leaderboardType = 'earners', period = 'all_time') {
    try {
      let query;

      if (leaderboardType === 'earners') {
        if (period === 'all_time') {
          query = `
            SELECT
              COUNT(*) + 1 as position,
              u.total_earned as value
            FROM users u
            WHERE u.total_earned > (SELECT total_earned FROM users WHERE id = $1)
          `;
        } else {
          const dateFilter = period === 'weekly'
            ? `NOW() - INTERVAL '7 days'`
            : `NOW() - INTERVAL '30 days'`;

          query = `
            WITH user_earnings AS (
              SELECT
                user_id,
                SUM(amount) as earnings
              FROM transactions
              WHERE type = 'commission'
                AND created_at >= ${dateFilter}
              GROUP BY user_id
            )
            SELECT
              COUNT(*) + 1 as position,
              COALESCE(ue.earnings, 0) as value
            FROM user_earnings ue
            WHERE ue.earnings > COALESCE((
              SELECT earnings FROM user_earnings WHERE user_id = $1
            ), 0)
          `;
        }
      } else if (leaderboardType === 'recruiters') {
        if (period === 'all_time') {
          query = `
            SELECT
              COUNT(*) + 1 as position,
              u.direct_recruits as value
            FROM users u
            WHERE u.direct_recruits > (SELECT direct_recruits FROM users WHERE id = $1)
          `;
        } else {
          const dateFilter = period === 'weekly'
            ? `NOW() - INTERVAL '7 days'`
            : `NOW() - INTERVAL '30 days'`;

          query = `
            WITH user_recruits AS (
              SELECT
                referred_by_id,
                COUNT(*) as recruit_count
              FROM users
              WHERE created_at >= ${dateFilter}
              GROUP BY referred_by_id
            )
            SELECT
              COUNT(*) + 1 as position,
              COALESCE(ur.recruit_count, 0) as value
            FROM user_recruits ur
            WHERE ur.recruit_count > COALESCE((
              SELECT recruit_count FROM user_recruits WHERE referred_by_id = $1
            ), 0)
          `;
        }
      }

      const result = await pool.query(query, [userId]);

      // Get user's actual value
      const userQuery = leaderboardType === 'earners'
        ? (period === 'all_time'
            ? 'SELECT total_earned as value FROM users WHERE id = $1'
            : `SELECT COALESCE(SUM(amount), 0) as value FROM transactions
               WHERE user_id = $1 AND type = 'commission'
               AND created_at >= NOW() - INTERVAL '${period === 'weekly' ? '7' : '30'} days'`)
        : (period === 'all_time'
            ? 'SELECT direct_recruits as value FROM users WHERE id = $1'
            : `SELECT COUNT(*) as value FROM users
               WHERE referred_by_id = $1
               AND created_at >= NOW() - INTERVAL '${period === 'weekly' ? '7' : '30'} days'`);

      const userResult = await pool.query(userQuery, [userId]);

      return {
        position: result.rows.length > 0 ? parseInt(result.rows[0].position) : 1,
        value: userResult.rows.length > 0 ? parseFloat(userResult.rows[0].value) : 0,
        leaderboardType,
        period
      };
    } catch (error) {
      console.error('Get user position error:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard statistics
   */
  static async getLeaderboardStats(period = 'all_time') {
    try {
      const dateFilter = period === 'all_time'
        ? ''
        : period === 'weekly'
          ? `WHERE created_at >= NOW() - INTERVAL '7 days'`
          : `WHERE created_at >= NOW() - INTERVAL '30 days'`;

      const result = await pool.query(`
        SELECT
          COUNT(*) as total_users,
          COALESCE(SUM(total_earned), 0) as total_earnings,
          COALESCE(AVG(total_earned), 0) as avg_earnings,
          COALESCE(MAX(total_earned), 0) as highest_earnings,
          COALESCE(SUM(direct_recruits), 0) as total_recruits,
          COALESCE(AVG(direct_recruits), 0) as avg_recruits,
          COALESCE(MAX(direct_recruits), 0) as highest_recruits,
          COALESCE(AVG(network_size), 0) as avg_network_size
        FROM users
        ${dateFilter}
      `);

      return {
        totalUsers: parseInt(result.rows[0].total_users),
        totalEarnings: parseFloat(result.rows[0].total_earnings),
        avgEarnings: parseFloat(result.rows[0].avg_earnings),
        highestEarnings: parseFloat(result.rows[0].highest_earnings),
        totalRecruits: parseInt(result.rows[0].total_recruits),
        avgRecruits: parseFloat(result.rows[0].avg_recruits),
        highestRecruits: parseInt(result.rows[0].highest_recruits),
        avgNetworkSize: parseFloat(result.rows[0].avg_network_size),
        period
      };
    } catch (error) {
      console.error('Get leaderboard stats error:', error);
      throw error;
    }
  }
}

module.exports = LeaderboardService;
