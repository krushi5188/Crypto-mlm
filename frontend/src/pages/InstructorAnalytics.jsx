import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, TrendingUp, DollarSign, Calendar, Activity,
  AlertCircle, Award, Trophy, TrendingDown, Info
} from 'lucide-react';
import { instructorAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const InstructorAnalytics = () => {
  const { error: showError } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await instructorAPI.getAnalytics();
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load analytics';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="400px" />
          <LoadingSkeleton variant="text" width="600px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (error || !analytics) {
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
              <h3 className="text-xl font-semibold mb-2">Database Connection Required</h3>
              <p className="text-text-muted mb-4">{error || 'Unable to load analytics data.'}</p>
              
              <Card variant="glass-strong" padding="lg" glow="gold" className="mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-semibold mb-3 text-gold-400">Setup Required</h4>
                    <ol className="space-y-2 text-sm text-text-muted list-decimal list-inside">
                      <li>Create a PostgreSQL database (Supabase, Neon, or Railway)</li>
                      <li>Run the schema.sql file to create tables</li>
                      <li>Add database environment variables to Vercel</li>
                      <li>Redeploy your application</li>
                    </ol>
                  </div>
                </div>
              </Card>

              <Button onClick={loadAnalytics} variant="primary" size="sm">
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
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20"
          >
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Analytics Dashboard</h1>
            <p className="text-lg text-text-muted">System-wide statistics and insights</p>
          </div>
        </div>
      </motion.div>

      {/* Overview Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Total Participants</p>
                <p className="text-5xl font-display font-bold text-blue-400">
                  <AnimatedNumber value={analytics.overview.totalParticipants} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-blue-500/10"
              >
                <Users className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow={analytics.overview.simulationStatus === 'active' ? 'green' : 'red'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Platform Status</p>
                <p className={`text-3xl font-display font-bold uppercase ${
                  analytics.overview.simulationStatus === 'active' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analytics.overview.simulationStatus}
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                animate={analytics.overview.simulationStatus === 'active' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`p-4 rounded-2xl ${
                  analytics.overview.simulationStatus === 'active' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              >
                <Activity className={`w-8 h-8 ${
                  analytics.overview.simulationStatus === 'active' ? 'text-green-400' : 'text-red-400'
                }`} />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Days Active</p>
                <p className="text-5xl font-display font-bold text-purple-400">
                  <AnimatedNumber value={analytics.overview.daysRemaining} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="p-4 rounded-2xl bg-purple-500/10"
              >
                <Calendar className="w-8 h-8 text-purple-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Coins Distributed</p>
                <p className="text-3xl font-display font-bold text-gold-400">
                  <AnimatedNumber value={analytics.systemTotals.totalCoinsDistributed} decimals={2} />
                  <span className="text-xl ml-1">USDT</span>
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-gold-400/10"
              >
                <DollarSign className="w-8 h-8 text-gold-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Distribution Stats */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-semibold">Participant Distribution</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="glass-medium" padding="xl" glow="red">
              <div className="text-center">
                <p className="text-sm text-text-dimmed mb-2">Zero Balance</p>
                <p className="text-5xl font-display font-bold text-red-400 mb-2">
                  <AnimatedNumber value={analytics.distribution.zeroBalance} />
                </p>
                <p className="text-2xl font-semibold text-red-400">
                  {formatPercentage(analytics.distribution.percentZero)}
                </p>
              </div>
            </Card>

            <Card variant="glass-medium" padding="xl" glow="yellow">
              <div className="text-center">
                <p className="text-sm text-text-dimmed mb-2">Broke Even</p>
                <p className="text-5xl font-display font-bold text-yellow-400 mb-2">
                  <AnimatedNumber value={analytics.distribution.brokeEven} />
                </p>
                <p className="text-2xl font-semibold text-yellow-400">
                  {formatPercentage(analytics.distribution.percentBrokeEven)}
                </p>
              </div>
            </Card>

            <Card variant="glass-medium" padding="xl" glow="green">
              <div className="text-center">
                <p className="text-sm text-text-dimmed mb-2">Profited</p>
                <p className="text-5xl font-display font-bold text-green-400 mb-2">
                  <AnimatedNumber value={analytics.distribution.profited} />
                </p>
                <p className="text-2xl font-semibold text-green-400">
                  {formatPercentage(analytics.distribution.percentProfited)}
                </p>
              </div>
            </Card>
          </div>
        </Card>
      </motion.div>

      {/* Wealth Concentration */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-semibold">Wealth Concentration</h2>
          </div>
          <p className="text-sm text-text-dimmed mb-6">
            Demonstrates MLM inequality: how wealth is distributed across participants
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass-medium" padding="lg">
              <p className="text-sm text-text-dimmed mb-2">Top 10% Control</p>
              <p className="text-4xl font-display font-bold text-red-400">
                {formatPercentage(analytics.wealth.top10Percent)}
              </p>
            </Card>

            <Card variant="glass-medium" padding="lg">
              <p className="text-sm text-text-dimmed mb-2">Middle 20% Control</p>
              <p className="text-4xl font-display font-bold text-yellow-400">
                {formatPercentage(analytics.wealth.middle20Percent)}
              </p>
            </Card>

            <Card variant="glass-medium" padding="lg">
              <p className="text-sm text-text-dimmed mb-2">Bottom 70% Control</p>
              <p className="text-4xl font-display font-bold text-green-400">
                {formatPercentage(analytics.wealth.bottom70Percent)}
              </p>
            </Card>

            <Card variant="glass-medium" padding="lg">
              <p className="text-sm text-text-dimmed mb-2">Gini Coefficient</p>
              <p className="text-4xl font-display font-bold text-purple-400">
                {analytics.wealth.giniCoefficient}
              </p>
            </Card>
          </div>
        </Card>
      </motion.div>

      {/* Top Earners */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl font-semibold">Top 10 Earners</h2>
          </div>

          <Card variant="glass" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Username</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Balance</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Recruits</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Network</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {analytics.topEarners.map((earner, index) => (
                    <motion.tr
                      key={earner.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                      className="transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index < 3 && (
                            <Award className={`w-5 h-5 ${
                              index === 0 ? 'text-gold-400' : index === 1 ? 'text-gray-300' : 'text-orange-400'
                            }`} />
                          )}
                          <span className="font-semibold">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{earner.username}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gold-400">
                        {formatCurrency(earner.balance)} USDT
                      </td>
                      <td className="px-6 py-4 text-right">
                        <AnimatedNumber value={earner.directRecruits} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <AnimatedNumber value={earner.networkSize} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default InstructorAnalytics;
