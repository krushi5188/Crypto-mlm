import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, BarChart3, Target, AlertTriangle, CheckCircle, 
  Info, RefreshCw, Calendar, Clock, Activity, AlertCircle
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';
import { formatCurrency } from '../utils/formatters';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MemberAnalytics = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, insightsRes] = await Promise.all([
        memberAPI.get('/analytics/predictions'),
        memberAPI.get('/analytics/insights')
      ]);

      setAnalytics(analyticsRes.data.data.analytics);
      setInsights(insightsRes.data.data.insights);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load analytics data';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      await memberAPI.post('/analytics/recalculate');
      await loadAnalytics();
      showSuccess('Analytics recalculated successfully');
    } catch (err) {
      showError('Failed to recalculate analytics');
      console.error('Failed to recalculate:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const getRiskLevelInfo = (level) => {
    const riskMap = {
      low: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
      medium: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
      high: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
      critical: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' }
    };
    return riskMap[level] || riskMap.low;
  };

  const getInsightInfo = (type) => {
    const insightMap = {
      warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
      success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
      info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' }
    };
    return insightMap[type] || insightMap.info;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="400px" />
          <LoadingSkeleton variant="text" width="600px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LoadingSkeleton variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" count={2} />
        </div>
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Analytics</h3>
              <p className="text-text-muted mb-4">{error || 'Unable to load analytics data.'}</p>
              <Button onClick={loadAnalytics} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const earningsProjectionData = [
    { period: 'Current', value: analytics.avgMonthlyEarnings, type: 'actual' },
    { period: '30 Days', value: analytics.predicted30dEarnings, type: 'predicted' },
    { period: '90 Days', value: analytics.predicted90dEarnings, type: 'predicted' }
  ];

  const growthData = [
    { metric: 'Earnings', rate: analytics.earningsGrowthRate },
    { metric: 'Network', rate: analytics.networkGrowthRate }
  ];

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
        className="space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            >
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-display font-bold">Predictive Analytics</h1>
              <p className="text-lg text-text-muted">AI-powered insights into your earnings and growth</p>
            </div>
          </div>
          <Button
            onClick={handleRecalculate}
            loading={recalculating}
            disabled={recalculating}
            variant="outline"
            icon={<RefreshCw className="w-5 h-5" />}
          >
            Refresh Analytics
          </Button>
        </div>
      </motion.div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <h2 className="text-3xl font-display font-semibold">Actionable Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const insightInfo = getInsightInfo(insight.type);
              const InsightIcon = insightInfo.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card variant="glass-strong" padding="lg" interactive>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${insightInfo.bg}`}>
                        <InsightIcon className={`w-6 h-6 ${insightInfo.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{insight.title}</h3>
                        <p className="text-sm text-text-muted mb-3">{insight.message}</p>
                        {insight.action && (
                          <Button variant="ghost" size="sm">
                            {insight.action} →
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Key Metrics */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive>
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-3 text-blue-400" />
              <p className="text-sm text-text-dimmed mb-2 uppercase tracking-wider">Activity Score</p>
              <p className={`text-4xl font-display font-bold mb-2 ${
                analytics.activityScore >= 0.7 ? 'text-success' : 
                analytics.activityScore >= 0.4 ? 'text-warning' : 'text-error'
              }`}>
                <AnimatedNumber value={analytics.activityScore * 100} decimals={0} />%
              </p>
              <p className="text-xs text-text-dimmed">{analytics.daysActive} days active</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive>
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-warning" />
              <p className="text-sm text-text-dimmed mb-2 uppercase tracking-wider">Churn Risk</p>
              <div className={`inline-flex px-4 py-2 rounded-full text-2xl font-display font-bold mb-2 capitalize ${
                getRiskLevelInfo(analytics.churnRiskLevel).bg
              } ${getRiskLevelInfo(analytics.churnRiskLevel).color} border ${getRiskLevelInfo(analytics.churnRiskLevel).border}`}>
                {analytics.churnRiskLevel}
              </div>
              <p className="text-xs text-text-dimmed">Score: {(analytics.churnRiskScore * 100).toFixed(0)}%</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive glow="gold">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-gold-400" />
              <p className="text-sm text-text-dimmed mb-2 uppercase tracking-wider">Avg Daily Earnings</p>
              <p className="text-4xl font-display font-bold text-gold-400 mb-2">
                $<AnimatedNumber value={analytics.avgDailyEarnings} decimals={2} />
              </p>
              <p className="text-xs text-text-dimmed">${analytics.avgWeeklyEarnings.toFixed(2)}/week</p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="lg" interactive glow="green">
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-green-400" />
              <p className="text-sm text-text-dimmed mb-2 uppercase tracking-wider">Earnings Growth</p>
              <p className={`text-4xl font-display font-bold mb-2 ${
                analytics.earningsGrowthRate >= 0 ? 'text-success' : 'text-error'
              }`}>
                {analytics.earningsGrowthRate > 0 ? '+' : ''}
                <AnimatedNumber value={analytics.earningsGrowthRate} decimals={1} />%
              </p>
              <p className="text-xs text-text-dimmed">Last 30 days</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass-strong" padding="xl">
            <h3 className="text-2xl font-display font-semibold mb-6">Earnings Projection</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={earningsProjectionData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="period" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f0f23', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '12px' }}
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#fbbf24"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-text-dimmed mb-1">Current Monthly</p>
                <p className="text-lg font-semibold text-gold-400">
                  $<AnimatedNumber value={analytics.avgMonthlyEarnings} decimals={2} />
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-dimmed mb-1">30-Day Forecast</p>
                <p className="text-lg font-semibold text-green-400">
                  $<AnimatedNumber value={analytics.predicted30dEarnings} decimals={2} />
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-dimmed mb-1">90-Day Forecast</p>
                <p className="text-lg font-semibold text-green-400">
                  $<AnimatedNumber value={analytics.predicted90dEarnings} decimals={2} />
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass-strong" padding="xl">
            <h3 className="text-2xl font-display font-semibold mb-6">Growth Rates</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f0f23', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Rate']}
                />
                <Bar dataKey="rate" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Optimal Recruitment Times */}
      {analytics.bestRecruitmentDay && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
        >
          <Card variant="glass-strong" padding="xl" glow="gold">
            <h3 className="text-2xl font-display font-semibold mb-6">Optimal Recruitment Times</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gold-400" />
                <p className="text-sm text-text-dimmed mb-2">Best Day</p>
                <p className="text-3xl font-display font-bold text-gold-400">
                  {analytics.bestRecruitmentDay}
                </p>
              </div>
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gold-400" />
                <p className="text-sm text-text-dimmed mb-2">Best Hour</p>
                <p className="text-3xl font-display font-bold text-gold-400">
                  {analytics.bestRecruitmentHour}:00
                </p>
              </div>
            </div>
            <div className="p-4 bg-gold-400/10 border border-gold-400/30 rounded-xl">
              <p className="text-sm text-text-muted">
                <strong className="text-gold-400">Tip:</strong> Based on your historical data, you have the best success recruiting on {analytics.bestRecruitmentDay}s around {analytics.bestRecruitmentHour}:00. Focus your outreach during these times!
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Additional Metrics */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
      >
        <Card variant="glass-strong" padding="xl">
          <h3 className="text-2xl font-display font-semibold mb-6">Additional Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-text-dimmed mb-2">Network Growth Rate</p>
              <p className="text-3xl font-display font-bold">
                {analytics.networkGrowthRate > 0 ? '+' : ''}
                <AnimatedNumber value={analytics.networkGrowthRate} decimals={1} />%
              </p>
            </div>
            <div>
              <p className="text-sm text-text-dimmed mb-2">Predicted 30d Recruits</p>
              <p className="text-3xl font-display font-bold">
                <AnimatedNumber value={analytics.predicted30dRecruits} />
              </p>
            </div>
            <div>
              <p className="text-sm text-text-dimmed mb-2">Days Inactive</p>
              <p className={`text-3xl font-display font-bold ${
                analytics.daysInactive > 7 ? 'text-error' : 'text-success'
              }`}>
                <AnimatedNumber value={analytics.daysInactive} />
              </p>
            </div>
            <div>
              <p className="text-sm text-text-dimmed mb-2">Last Updated</p>
              <p className="text-lg text-text-muted">
                {new Date(analytics.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MemberAnalytics;
