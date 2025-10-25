import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Crown, Zap, Users, TrendingUp, DollarSign, 
  Award, AlertCircle, Medal, Star
} from 'lucide-react';
import { gamificationAPI } from '../services/api';
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

const MemberLeaderboard = () => {
  const { error: showError } = useToast();
  const [leaderboard, setLeaderboard] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('earners');
  const [period, setPeriod] = useState('all_time');

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, period };

      let data;
      if (activeTab === 'earners') {
        const res = await gamificationAPI.getTopEarners(params);
        data = res.data.data.leaderboard;
      } else if (activeTab === 'recruiters') {
        const res = await gamificationAPI.getTopRecruiters(params);
        data = res.data.data.leaderboard;
      } else {
        const res = await gamificationAPI.getFastestGrowing(params);
        data = res.data.data.leaderboard;
      }

      setLeaderboard(data);

      const posRes = await gamificationAPI.getUserPosition({
        type: activeTab,
        period
      });
      setUserPosition(posRes.data.data);

      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load leaderboard';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return { emoji: '🥇', icon: Crown, color: 'text-gold-400' };
    if (rank === 2) return { emoji: '🥈', icon: Medal, color: 'text-gray-300' };
    if (rank === 3) return { emoji: '🥉', icon: Award, color: 'text-orange-400' };
    return { emoji: `#${rank}`, icon: null, color: 'text-text-muted' };
  };

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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Leaderboard</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadLeaderboard} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-gold-400/20 to-purple-500/20"
          >
            <Trophy className="w-8 h-8 text-gold-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Leaderboard</h1>
            <p className="text-lg text-text-muted">See how you rank against other members</p>
          </div>
        </div>
      </motion.div>

      {/* User Position Card */}
      {userPosition && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass-strong" padding="xl" glow="gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Your Position</p>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-display font-bold text-gold-400">
                    {getRankIcon(userPosition.position).emoji}
                  </span>
                  <div>
                    <p className="text-3xl font-display font-bold">
                      Rank #{userPosition.position}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-dimmed mb-2">
                  Your {activeTab === 'earners' ? 'Earnings' : activeTab === 'recruiters' ? 'Recruits' : 'Growth'}
                </p>
                <p className="text-3xl font-display font-bold text-green-400">
                  {activeTab === 'earners' ? (
                    <>$<AnimatedNumber value={userPosition.value} decimals={2} /></>
                  ) : (
                    <AnimatedNumber value={userPosition.value} />
                  )}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tab Buttons */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="flex gap-3 flex-wrap"
      >
        <Button
          variant={activeTab === 'earners' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('earners')}
          icon={<DollarSign className="w-4 h-4" />}
        >
          Top Earners
        </Button>
        <Button
          variant={activeTab === 'recruiters' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('recruiters')}
          icon={<Users className="w-4 h-4" />}
        >
          Top Recruiters
        </Button>
        <Button
          variant={activeTab === 'fastest' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('fastest')}
          icon={<Zap className="w-4 h-4" />}
          disabled={period === 'all_time'}
        >
          Fastest Growing
        </Button>
      </motion.div>

      {/* Period Filter */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="flex gap-3 flex-wrap"
      >
        <Button
          variant={period === 'all_time' ? 'success' : 'outline'}
          onClick={() => setPeriod('all_time')}
          size="sm"
        >
          All Time
        </Button>
        <Button
          variant={period === 'monthly' ? 'success' : 'outline'}
          onClick={() => setPeriod('monthly')}
          size="sm"
        >
          Monthly
        </Button>
        <Button
          variant={period === 'weekly' ? 'success' : 'outline'}
          onClick={() => setPeriod('weekly')}
          size="sm"
        >
          Weekly
        </Button>
      </motion.div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton variant="card" count={10} />
        </div>
      ) : leaderboard && leaderboard.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No Leaderboard Entries"
          description="No members have qualified for this leaderboard yet. Be the first to make the list!"
          actionLabel="Refresh"
          onAction={loadLeaderboard}
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${period}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Badge</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">
                        {activeTab === 'earners' ? 'Earnings' : activeTab === 'recruiters' ? 'Recruits' : 'New Members'}
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Network</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {leaderboard && leaderboard.map((entry, index) => {
                      const rankInfo = getRankIcon(entry.rank);
                      return (
                        <motion.tr
                          key={entry.userId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                          className="transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {rankInfo.icon && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', delay: index * 0.05 }}
                                >
                                  <rankInfo.icon className={`w-6 h-6 ${rankInfo.color}`} />
                                </motion.div>
                              )}
                              <span className={`text-xl font-display font-bold ${rankInfo.color}`}>
                                {rankInfo.emoji}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <motion.div
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-green-500 flex items-center justify-center text-black font-semibold"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                              >
                                {entry.username?.charAt(0).toUpperCase() || 'U'}
                              </motion.div>
                              <span className="font-semibold">{entry.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {entry.currentRank && (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                                style={{
                                  backgroundColor: `${entry.currentRank.color}20`,
                                  color: entry.currentRank.color,
                                  border: `1px solid ${entry.currentRank.color}40`
                                }}
                              >
                                <span>{entry.currentRank.icon}</span>
                                <span>{entry.currentRank.name}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-lg font-semibold text-green-400">
                              {activeTab === 'earners' ? (
                                <>$<AnimatedNumber value={entry.earnings} decimals={2} /></>
                              ) : activeTab === 'recruiters' ? (
                                <AnimatedNumber value={entry.recruitCount} />
                              ) : (
                                <AnimatedNumber value={entry.newMembers} />
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-text-dimmed">
                            <AnimatedNumber value={entry.networkSize || entry.totalNetworkSize || 0} />
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
};

export default MemberLeaderboard;
