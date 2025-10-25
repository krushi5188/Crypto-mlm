import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, AlertCircle, Network } from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import RankBadge from '../components/RankBadge';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';
import { formatCurrency } from '../utils/formatters';

const MemberNetwork = () => {
  const { error: showError } = useToast();
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getNetwork();
      setNetwork(response.data.data.downline || []);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load network';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load network:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <Card variant="glass" padding="xl">
          <LoadingSkeleton variant="text" count={8} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="p-6"
      >
        <Card variant="glass" padding="xl">
          <div className="flex items-start gap-3 text-error">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Failed to Load Network</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadNetwork} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const totalNetworkEarnings = network.reduce((sum, member) => sum + (member.totalEarned || 0), 0);
  const totalNetworkSize = network.reduce((sum, member) => sum + (member.networkSize || 0), 0);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="p-6 space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-gold-400/20 to-green-500/20"
          >
            <Network className="w-8 h-8 text-gold-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">My Network</h1>
            <p className="text-lg text-text-muted">Your downline members and their performance</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive glow="gold">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gold-400/10">
                <Users className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <p className="text-sm text-text-dimmed mb-1">Direct Recruits</p>
                <p className="text-3xl font-display font-bold">
                  <AnimatedNumber value={network.length} />
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive glow="green">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-text-dimmed mb-1">Network Earnings</p>
                <p className="text-3xl font-display font-bold text-green-400">
                  $<AnimatedNumber value={totalNetworkEarnings} decimals={2} />
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive glow="purple">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-dimmed mb-1">Total Network Size</p>
                <p className="text-3xl font-display font-bold">
                  <AnimatedNumber value={totalNetworkSize} />
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Network Table */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        {network.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Network Members Yet"
            description="Share your referral link to start building your network and earning commissions from your downline."
            actionLabel="View Dashboard"
            onAction={() => window.location.href = '/dashboard'}
          />
        ) : (
          <Card variant="glass" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed uppercase tracking-wider">
                      Earned
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed uppercase tracking-wider">
                      Network
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {network.map((member, index) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                      className="transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-green-500 flex items-center justify-center text-black font-semibold"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            {member.displayName?.charAt(0).toUpperCase() || 'M'}
                          </motion.div>
                          <div>
                            <p className="font-semibold text-text-primary">
                              {member.displayName || 'Anonymous'}
                            </p>
                            <p className="text-sm text-text-dimmed">
                              {member.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30">
                          <span className="text-sm font-semibold text-gold-400">
                            Level {member.level || 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-semibold text-green-400">
                          $<AnimatedNumber value={member.totalEarned || 0} decimals={2} />
                        </p>
                        <p className="text-xs text-text-dimmed">USDT</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Users className="w-4 h-4 text-text-dimmed" />
                          <span className="font-medium">
                            <AnimatedNumber value={member.networkSize || 0} />
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MemberNetwork;
