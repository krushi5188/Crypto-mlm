const Referral = require('../models/Referral');
const User = require('../models/User');

class ReferralService {
  /**
   * Get downline tree structure for a user
   * Returns hierarchical data organized by level
   */
  static async getDownlineTree(userId, filterLevel = null) {
    const downline = await Referral.getDownlineByLevel(userId, filterLevel);

    // Group by level
    const levels = {};

    for (let i = 1; i <= 5; i++) {
      levels[i] = {
        count: 0,
        members: []
      };
    }

    downline.forEach(member => {
      const level = member.level;
      levels[level].count++;
      levels[level].members.push({
        id: member.user_id,
        displayName: `Member #${member.user_id}`, // Anonymized
        joinedAt: member.created_at,
        recruits: member.direct_recruits,
        isActive: member.is_active
      });
    });

    const totalNetwork = downline.length;

    return {
      levels,
      totalNetwork
    };
  }

  /**
   * Get complete network graph for instructor visualization
   * Shows usernames only for instructor admin purposes
   */
  static async getCompleteNetworkGraph() {
    const { nodes, edges } = await Referral.getCompleteNetwork();

    // Calculate status for each node
    const processedNodes = nodes.map(node => {
      let status = 'loss';
      if (node.total_earned >= 100 && node.total_earned <= 100) {
        status = 'brokeEven';
      } else if (node.total_earned > 100) {
        status = 'profited';
      }

      return {
        id: node.id,
        username: node.username, // Keep username for instructor only
        balance: parseFloat(node.balance),
        directRecruits: node.direct_recruits,
        status
      };
    });

    // Format edges for graph
    const processedEdges = edges.map(edge => ({
      from: edge.to_id, // Parent (upline)
      to: edge.from_id, // Child (downline)
      level: edge.level
    }));

    // Calculate stats
    const maxDepth = 5; // Fixed to 5 levels
    const totalNodes = processedNodes.length;

    return {
      nodes: processedNodes,
      edges: processedEdges,
      stats: {
        totalNodes,
        maxDepth
      }
    };
  }

  /**
   * Get upline chain for a specific user
   * Anonymized for privacy
   */
  static async getUplineChain(userId) {
    const upline = await Referral.getUpline(userId);

    return upline.map((u, index) => ({
      id: u.upline_id,
      displayName: `Level ${u.level} Upline`, // Anonymized
      level: u.level,
      balance: parseFloat(u.balance)
    }));
  }

  /**
   * Check if targetUser is in the downline of sourceUser (to prevent cycles)
   * Used when moving users in the tree.
   */
  static async isDownline(sourceUserId, targetUserId) {
    const { pool } = require('../config/database');
    // Recursive query to check if target is a descendant of source
    const result = await pool.query(
      `WITH RECURSIVE downline AS (
         SELECT id FROM users WHERE referred_by_id = $1
         UNION ALL
         SELECT u.id FROM users u
         INNER JOIN downline d ON u.referred_by_id = d.id
       )
       SELECT 1 FROM downline WHERE id = $2`,
      [sourceUserId, targetUserId]
    );
    return result.rows.length > 0;
  }

  /**
   * Move a user to a new sponsor (referrer)
   */
  static async moveUser(userId, newReferrerId) {
    const { pool } = require('../config/database');

    // 1. Validation
    if (userId === newReferrerId) throw new Error('Cannot refer self');

    // Check cycle
    const isCycle = await this.isDownline(userId, newReferrerId);
    if (isCycle) throw new Error('Cannot move user under their own downline (Cycle detected)');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 2. Update User's Referrer
      await client.query(
        'UPDATE users SET referred_by_id = $1 WHERE id = $2',
        [newReferrerId, userId]
      );

      // 3. Rebuild Referrals Table (Closure Table)
      // Strategy:
      // a. Delete ALL paths where the moved user (or their descendants) is the descendant.
      //    We must do this because their relationship to the OLD upline is broken.
      // b. Re-insert paths for the moved user and all descendants to the NEW upline.

      // Find all descendants (including self)
      const descendantsResult = await client.query(`
        WITH RECURSIVE subtree AS (
          SELECT id FROM users WHERE id = $1
          UNION ALL
          SELECT u.id FROM users u
          INNER JOIN subtree s ON u.referred_by_id = s.id
        )
        SELECT id FROM subtree
      `, [userId]);

      const descendantIds = descendantsResult.rows.map(r => r.id);

      // Delete old upline paths for everyone in the subtree
      // (This removes 'A -> B' where B is in subtree, but we want to keep 'B -> C' where both are in subtree?
      //  Actually, the closure table stores (user_id, upline_id).
      //  If B is in subtree, its upline_id could be:
      //    1. Someone inside the subtree (Keep this! The internal structure didn't change)
      //    2. Someone outside (Delete this! The connection to old upline is gone)
      // )

      // Delete paths where user is in subtree AND upline is NOT in subtree
      await client.query(`
        DELETE FROM referrals
        WHERE user_id = ANY($1)
        AND upline_id != ALL($1)
      `, [descendantIds]);

      // Insert new paths to the new upline
      // Find the new upline chain for the new referrer
      const newReferrerUplineResult = await client.query(`
        SELECT upline_id, level FROM referrals WHERE user_id = $1
      `, [newReferrerId]);

      const newUplineChain = newReferrerUplineResult.rows.map(r => ({ id: r.upline_id, depth: r.level }));
      // Add the new referrer themselves as level 1
      newUplineChain.push({ id: newReferrerId, depth: 0 });
      // (Note: In existing logic, direct parent might be level 1. Let's verify schema logic.
      //  Usually referrals table: user_id, upline_id, level.
      //  If A -> B, then (A, B, 1).
      //  If B -> C, then (B, C, 1), (A, C, 2).
      //  So for the moved user (A), new referrer (B) is level 1. B's upline (C) is level 2.)

      // Re-insert paths for each descendant
      for (const descendantId of descendantIds) {
        // 1. Calculate distance from moved user to this descendant
        // If descendant is the moved user, distance is 0.
        // If descendant is child, distance is 1.
        // We can get this from the internal subtree paths we preserved.

        const internalPathResult = await client.query(`
          SELECT level FROM referrals
          WHERE user_id = $1 AND upline_id = $2
        `, [descendantId, userId]);

        // If descendant == userId, distance is 0.
        // If descendant != userId, query returns level (e.g., 1).
        let distanceToRoot = 0;
        if (descendantId !== userId) {
           if (internalPathResult.rows.length > 0) {
             distanceToRoot = internalPathResult.rows[0].level;
           } else {
             // Should not happen if internal structure preserved, but safe fallback
             continue;
           }
        }

        // 2. Link to new upline
        // New Level = (Level of Upline relative to New Referrer) + 1 + DistanceToRoot
        // Wait, let's simplify.
        // For the Moved User (distanceToRoot=0):
        //   Link to NewReferrer (Level 1)
        //   Link to NewReferrer's Upline (Level = UplineLevel + 1)

        // Insert NewReferrer link
        await client.query(`
          INSERT INTO referrals (user_id, upline_id, level)
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
        `, [descendantId, newReferrerId, distanceToRoot + 1]);

        // Insert links to NewReferrer's upline
        for (const upline of newUplineChain) {
           // upline.depth is distance from NewReferrer to Upline (e.g., 1, 2...)
           // Actually my previous query `SELECT upline_id, level` gets distance from NewReferrer to that Upline.
           // So if C is level 1 upline of B.
           // A links to C at level: (Distance A->B) + (Distance B->C) = (distanceToRoot + 1) + upline.depth

           // Correction: The newUplineChain I fetched earlier comes from `referrals`.
           // row: upline_id, level.
           // If B -> C (level 1).
           // A -> C will be: (A->B is 1) + (B->C is 1) = 2.
           // General formula: level = (distanceToRoot + 1) + upline.depth

           // Filter out the {id: newReferrerId} object I manually added, handled above.
           if (upline.id === newReferrerId) continue;

           await client.query(`
            INSERT INTO referrals (user_id, upline_id, level)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `, [descendantId, upline.id, (distanceToRoot + 1) + upline.depth]);
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ReferralService;
