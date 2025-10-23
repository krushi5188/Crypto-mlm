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
}

module.exports = ReferralService;
