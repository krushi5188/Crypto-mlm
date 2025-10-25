import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Layers, DollarSign, Users,
  Activity, Target, Calendar, AlertCircle
} from 'lucide-react';
import { instructorAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
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

const InstructorBI = () => {
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    retention: null,
    conversion: null,
    networkDepth: null,
    earningsDistribution: null,
    growthPredictions: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [retention, conversion, networkDepth, earnings, growth] = await Promise.all([
        instructorAPI.getBIRetention(),
        instructorAPI.getBIConversion(),
        instructorAPI.getBINetworkDepth(),
        instructorAPI.getBIEarningsDistribution(),
        instructorAPI.getBIGrowthPredictions()
      ]);

      setData({
        retention: retention.data.data,
        conversion: conversion.data.data,
        networkDepth: networkDepth.data.data,
        earningsDistribution: earnings.data.data,
        growthPredictions: growth.data.data
      });
    } catch (err) {
      console.error('Failed to load BI data:', err);
      setError('Failed to load analytics data');
      showError('Failed to load analytics data');
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
          <EmptyState
            icon={AlertCircle}
            title="Failed to Load Analytics Data"
            description={error}
            actionLabel="Try Again"
            onAction={loadAllData}
          />
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
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
          >
            <BarChart3 className="w-8 h-8 text-blue-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Business Intelligence</h1>
            <p className="text-lg text-text-muted">Advanced analytics and insights</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="none">
          <div className="flex gap-3 overflow-x-auto pb-2 px-4 pt-4">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'conversion', label: 'Conversion Funnel' },
              { value: 'network', label: 'Network Depth' },
              { value: 'earnings', label: 'Earnings Distribution' },
              { value: 'growth', label: 'Growth Predictions' }
            ].map((tab) => (
              <motion.button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.value ? 'text-gold-400' : 'text-text-dimmed hover:text-text-primary'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <span>{tab.label}</span>
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="activeBITab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel Preview */}
            {data.conversion && (
              <Card variant="glass-strong" padding="xl" glow="blue">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-blue-400" />
                  <h3 className="text-2xl font-semibold">Conversion Funnel</h3>
                </div>
                <div className="space-y-4">
                  {data.conversion.funnel.map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{stage.stage}</span>
                        <span className="text-text-muted">
                          {stage.count} ({stage.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-3 bg-glass-medium rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                        />
                      </div>
                    </div>
                  ))}
                  <Card variant="glass-medium" padding="md" className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-dimmed">Avg Days to First Commission</span>
                      <span className="font-bold text-blue-400">
                        {data.conversion.avgDaysToFirstCommission.toFixed(1)} days
                      </span>
                    </div>
                  </Card>
                </div>
              </Card>
            )}

            {/* Network Depth Preview */}
            {data.networkDepth && (
              <Card variant="glass-strong" padding="xl" glow="purple">
                <div className="flex items-center gap-3 mb-6">
                  <Layers className="w-6 h-6 text-purple-400" />
                  <h3 className="text-2xl font-semibold">Network Depth</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card variant="glass-medium" padding="lg">
                      <div className="text-center">
                        <p className="text-sm text-text-dimmed mb-2">Max Depth</p>
                        <p className="text-4xl font-display font-bold text-purple-400">
                          <AnimatedNumber value={data.networkDepth.maxDepth} />
                        </p>
                        <p className="text-xs text-text-dimmed mt-1">levels</p>
                      </div>
                    </Card>
                    <Card variant="glass-medium" padding="lg">
                      <div className="text-center">
                        <p className="text-sm text-text-dimmed mb-2">Avg Depth</p>
                        <p className="text-4xl font-display font-bold text-blue-400">
                          <AnimatedNumber value={data.networkDepth.avgDepth} decimals={1} />
                        </p>
                        <p className="text-xs text-text-dimmed mt-1">levels</p>
                      </div>
                    </Card>
                  </div>
                  <div className="space-y-2">
                    {data.networkDepth.distribution.slice(0, 5).map((level, index) => (
                      <Card key={index} variant="glass-medium" padding="sm">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold">Level {level.level}</span>
                          <div className="flex gap-4 text-text-muted">
                            <span>{level.userCount} users</span>
                            <span className="text-green-400 font-semibold">
                              ${level.totalEarned.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Earnings Distribution Preview */}
            {data.earningsDistribution && (
              <Card variant="glass-strong" padding="xl" glow="gold">
                <div className="flex items-center gap-3 mb-6">
                  <DollarSign className="w-6 h-6 text-gold-400" />
                  <h3 className="text-2xl font-semibold">Earnings Distribution</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(data.earningsDistribution.percentiles).map(([key, value]) => (
                    <Card key={key} variant="glass-medium" padding="lg">
                      <div className="text-center">
                        <p className="text-xs text-text-dimmed mb-2">{key.toUpperCase()}</p>
                        <p className="text-2xl font-display font-bold text-gold-400">
                          ${value.toFixed(2)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Growth Predictions Preview */}
            {data.growthPredictions && (
              <Card variant="glass-strong" padding="xl" glow="green">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <h3 className="text-2xl font-semibold">Growth Projections</h3>
                </div>
                <div className="space-y-6">
                  <Card variant="glass-medium" padding="lg">
                    <div className="flex items-center justify-between">
                      <span className="text-text-dimmed">Growth Rate</span>
                      <span className="text-2xl font-bold text-green-400">
                        {data.growthPredictions.growthRate}
                      </span>
                    </div>
                  </Card>
                  <div className="grid grid-cols-2 gap-4">
                    <Card variant="glass-medium" padding="lg">
                      <div className="text-center">
                        <p className="text-sm text-text-dimmed mb-2">7-Day</p>
                        <p className="text-3xl font-display font-bold text-blue-400">
                          <AnimatedNumber value={data.growthPredictions.projections[6]?.projectedUsers || 0} />
                        </p>
                        <p className="text-xs text-text-dimmed mt-1">users</p>
                      </div>
                    </Card>
                    <Card variant="glass-medium" padding="lg">
                      <div className="text-center">
                        <p className="text-sm text-text-dimmed mb-2">30-Day</p>
                        <p className="text-3xl font-display font-bold text-green-400">
                          <AnimatedNumber value={data.growthPredictions.projections[29]?.projectedUsers || 0} />
                        </p>
                        <p className="text-xs text-text-dimmed mt-1">users</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Conversion Funnel Tab */}
        {activeTab === 'conversion' && data.conversion && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-400" />
              Conversion Funnel Analysis
            </h2>
            <div className="space-y-6">
              {data.conversion.funnel.map((stage, index) => (
                <Card key={index} variant="glass" padding="lg">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-xl font-semibold">{stage.stage}</h3>
                      <div className="text-right">
                        <div className="text-3xl font-display font-bold text-blue-400">
                          {stage.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-text-muted">{stage.count} users</div>
                      </div>
                    </div>
                    <div className="h-4 bg-glass-medium rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      />
                    </div>
                    {index < data.conversion.funnel.length - 1 && (
                      <div className="text-sm text-red-400 font-semibold">
                        Dropoff: {(stage.percentage - data.conversion.funnel[index + 1].percentage).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Network Depth Tab */}
        {activeTab === 'network' && data.networkDepth && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <Layers className="w-6 h-6 text-purple-400" />
              Network Depth Distribution
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card variant="glass-medium" padding="xl" glow="purple">
                <div className="text-center">
                  <p className="text-sm text-text-dimmed mb-3">Maximum Depth</p>
                  <p className="text-6xl font-display font-bold text-purple-400 mb-2">
                    <AnimatedNumber value={data.networkDepth.maxDepth} />
                  </p>
                  <p className="text-sm text-text-dimmed">levels</p>
                </div>
              </Card>
              <Card variant="glass-medium" padding="xl" glow="blue">
                <div className="text-center">
                  <p className="text-sm text-text-dimmed mb-3">Average Depth</p>
                  <p className="text-6xl font-display font-bold text-blue-400 mb-2">
                    <AnimatedNumber value={data.networkDepth.avgDepth} decimals={1} />
                  </p>
                  <p className="text-sm text-text-dimmed">levels</p>
                </div>
              </Card>
              <Card variant="glass-medium" padding="xl" glow="green">
                <div className="text-center">
                  <p className="text-sm text-text-dimmed mb-3">Total Levels</p>
                  <p className="text-6xl font-display font-bold text-green-400 mb-2">
                    <AnimatedNumber value={data.networkDepth.distribution.length} />
                  </p>
                  <p className="text-sm text-text-dimmed">active</p>
                </div>
              </Card>
            </div>

            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Level</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Users</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Avg Network</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Total Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {data.networkDepth.distribution.map((level, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold">Level {level.level}</td>
                        <td className="px-6 py-4 text-right text-blue-400 font-semibold">
                          <AnimatedNumber value={level.userCount} />
                        </td>
                        <td className="px-6 py-4 text-right text-purple-400">
                          {level.avgNetworkSize.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-right text-green-400 font-semibold">
                          ${level.totalEarned.toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Card>
        )}

        {/* Earnings Distribution Tab */}
        {activeTab === 'earnings' && data.earningsDistribution && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-gold-400" />
              Earnings Distribution
            </h2>

            <h3 className="text-xl font-semibold mb-4">Percentiles</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {Object.entries(data.earningsDistribution.percentiles).map(([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass-medium" padding="lg" glow="gold">
                    <div className="text-center">
                      <p className="text-xs text-text-dimmed mb-2">{key.toUpperCase()}</p>
                      <p className="text-3xl font-display font-bold text-gold-400">
                        ${value.toFixed(2)}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mb-4">Distribution by Bracket</h3>
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Bracket</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Users</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Min</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Max</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {data.earningsDistribution.distribution.map((bracket, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold">${bracket.bracket}</td>
                        <td className="px-6 py-4 text-right text-blue-400 font-semibold">
                          <AnimatedNumber value={bracket.userCount} />
                        </td>
                        <td className="px-6 py-4 text-right text-text-muted">
                          ${bracket.minEarned.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-text-muted">
                          ${bracket.maxEarned.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-green-400 font-semibold">
                          ${bracket.avgEarned.toFixed(2)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Card>
        )}

        {/* Growth Predictions Tab */}
        {activeTab === 'growth' && data.growthPredictions && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
              Growth Predictions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card variant="glass-medium" padding="xl" glow="blue">
                <div className="text-center">
                  <p className="text-sm text-text-dimmed mb-3">Growth Rate</p>
                  <p className="text-4xl font-display font-bold text-blue-400 mb-2">
                    {data.growthPredictions.growthRate}
                  </p>
                </div>
              </Card>
              <Card variant="glass-medium" padding="xl" glow="purple">
                <div className="text-center">
                  <p className="text-sm text-text-dimmed mb-3">7-Day Projection</p>
                  <p className="text-4xl font-display font-bold text-purple-400 mb-2">
                    <AnimatedNumber value={data.growthPredictions.projections[6]?.projectedUsers || 0} />
                  </p>
                  <p className="text-sm text-text-dimmed">users</p>
                </div>
              </Card>
              <Card variant="glass-medium" padding="xl" glow="green">
                <div className="text-center">
                  <p className="text-sm text-text-dimmed mb-3">30-Day Projection</p>
                  <p className="text-4xl font-display font-bold text-green-400 mb-2">
                    <AnimatedNumber value={data.growthPredictions.projections[29]?.projectedUsers || 0} />
                  </p>
                  <p className="text-sm text-text-dimmed">users</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Historical Growth (Last 10 Days)
                </h3>
                <div className="space-y-3">
                  {data.growthPredictions.historicalGrowth.slice(-10).map((day, index) => (
                    <Card key={index} variant="glass-medium" padding="md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-400 font-semibold">+{day.newUsers} new</span>
                          <span className="text-text-muted">{day.cumulativeUsers} total</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  30-Day Projection
                </h3>
                <div className="space-y-3">
                  {data.growthPredictions.projections
                    .filter((_, index) => index % 5 === 0 || index === data.growthPredictions.projections.length - 1)
                    .map((proj, index) => (
                      <Card key={index} variant="glass-medium" padding="md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Day +{proj.day}</span>
                          <span className="text-green-400 font-bold">
                            <AnimatedNumber value={proj.projectedUsers} /> users
                          </span>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
};

export default InstructorBI;
