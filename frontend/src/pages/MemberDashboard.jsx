import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Users, TrendingUp, Link2, Copy, 
  Activity, CheckCircle, AlertCircle, Calendar,
  ArrowUpRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { memberAPI, systemAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import StatsCard from '../components/StatsCard';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  slowStaggerContainer,
  fadeInUp,
  scaleIn 
} from '../utils/animations';

const MemberDashboard = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getDashboard();
      setDashboard(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    showSuccess('Referral link copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="400px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Dashboard</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={fetchDashboard} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const stats = [
    {
      title: 'Available Balance',
      value: dashboard?.balance || 0,
      prefix: '$',
      decimals: 2,
      icon: <DollarSign className="w-6 h-6" />,
      variant: 'gold',
      trend: dashboard?.balanceTrend > 0 ? 'up' : dashboard?.balanceTrend < 0 ? 'down' : null,
      trendValue: dashboard?.balanceTrend ? `${Math.abs(dashboard.balanceTrend)}%` : null
    },
    {
      title: 'Total Earned',
      value: dashboard?.totalEarned || 0,
      prefix: '$',
      decimals: 2,
      icon: <TrendingUp className="w-6 h-6" />,
      variant: 'green',
      trend: 'up',
      trendValue: dashboard?.earningsTrend ? `${dashboard.earningsTrend}%` : null
    },
    {
      title: 'Direct Recruits',
      value: dashboard?.directRecruits || 0,
      icon: <Users className="w-6 h-6" />,
      variant: 'blue',
      trend: dashboard?.recruitsTrend > 0 ? 'up' : null,
      trendValue: dashboard?.recruitsTrend ? `+${dashboard.recruitsTrend}` : null
    },
    {
      title: 'Network Size',
      value: dashboard?.networkSize || 0,
      icon: <Activity className="w-6 h-6" />,
      variant: 'purple',
      trend: dashboard?.networkTrend > 0 ? 'up' : null,
      trendValue: dashboard?.networkTrend ? `+${dashboard.networkTrend}` : null
    }
  ];

  const recentActivity = dashboard?.recentActivity || [];

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
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <Sparkles className="w-6 h-6 text-gold-400" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold">
            Welcome back, <span className="text-gradient">{user?.username}</span>
          </h1>
        </div>
        <p className="text-lg text-text-muted">
          Here's your network performance overview
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Referral Link Section */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass-strong" padding="xl" glow="gold">
          <div className="flex items-start gap-4">
            <motion.div
              className="p-4 rounded-2xl bg-gradient-to-br from-gold-400/20 to-green-500/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Link2 className="w-8 h-8 text-gold-400" />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-2xl font-display font-semibold mb-2">
                Your Referral Link
              </h3>
              <p className="text-text-muted mb-4">
                Share this link to earn commissions when new members join
              </p>
              <div className="flex gap-3">
                <div className="flex-1 px-4 py-3 bg-glass-medium border border-glass-border rounded-xl font-mono text-sm text-text-muted truncate">
                  {window.location.origin}/register?ref={user?.referralCode}
                </div>
                <Button
                  onClick={handleCopyReferralLink}
                  variant={copySuccess ? 'success' : 'primary'}
                  icon={copySuccess ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  success={copySuccess}
                >
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        variants={slowStaggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-semibold">Recent Activity</h2>
          {recentActivity.length > 0 && (
            <Button variant="ghost" size="sm" iconRight={<ArrowUpRight className="w-4 h-4" />}>
              View All
            </Button>
          )}
        </motion.div>

        {recentActivity.length === 0 ? (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={Activity}
              title="No Recent Activity"
              description="Your network activity will appear here. Start by sharing your referral link!"
              actionLabel="Copy Referral Link"
              onAction={handleCopyReferralLink}
            />
          </motion.div>
        ) : (
          <Card variant="glass" padding="none">
            <div className="divide-y divide-glass-border">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  className="p-6 flex items-start gap-4 cursor-pointer transition-colors"
                >
                  <motion.div
                    className={`
                      p-3 rounded-xl
                      ${activity.type === 'earning' ? 'bg-green-500/10 text-green-400' : ''}
                      ${activity.type === 'recruit' ? 'bg-gold-400/10 text-gold-400' : ''}
                      ${activity.type === 'withdrawal' ? 'bg-blue-500/10 text-blue-400' : ''}
                    `}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {activity.type === 'earning' && <DollarSign className="w-5 h-5" />}
                    {activity.type === 'recruit' && <Users className="w-5 h-5" />}
                    {activity.type === 'withdrawal' && <TrendingUp className="w-5 h-5" />}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-text-dimmed">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {activity.amount && (
                    <div className="text-right">
                      <div className="text-xl font-semibold text-green-400">
                        +<AnimatedNumber value={activity.amount} decimals={2} prefix="$" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MemberDashboard;
