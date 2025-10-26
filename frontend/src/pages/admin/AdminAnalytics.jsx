import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/base/Card'
import { instructorAPI } from '../../services/api'
import {
  Users, DollarSign, TrendingUp, Activity, UserPlus, Wallet,
  ArrowUpRight, AlertTriangle, CheckCircle, Clock
} from 'lucide-react'

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('month')

  useEffect(() => {
    fetchAnalytics()
  }, [timeFilter])

  const fetchAnalytics = async () => {
    try {
      const response = await instructorAPI.getAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  const mainStats = [
    {
      label: 'Total Members',
      value: analytics?.totalMembers || 0,
      change: analytics?.membersChange,
      icon: Users,
    },
    {
      label: 'Total Volume',
      value: `${analytics?.totalVolume || 0} USDT`,
      change: analytics?.volumeChange,
      icon: DollarSign,
    },
    {
      label: 'Active Members',
      value: analytics?.activeMembers || 0,
      change: analytics?.activeChange,
      icon: Activity,
    },
    {
      label: 'Pending Withdrawals',
      value: `${analytics?.pendingWithdrawals || 0} USDT`,
      change: analytics?.withdrawalsChange,
      icon: Wallet,
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Platform performance and key metrics
            </p>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2">
            {['today', 'week', 'month', 'all'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  timeFilter === filter
                    ? 'bg-white text-black'
                    : 'bg-white bg-opacity-5 text-white hover:bg-opacity-10'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => {
            const Icon = stat.icon
            const isPositive = stat.change > 0
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card padding="lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-white bg-opacity-10 rounded-xl">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {stat.change !== undefined && (
                      <div className={`flex items-center gap-1 text-sm ${
                        isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        <ArrowUpRight className={`w-4 h-4 ${!isPositive && 'rotate-90'}`} />
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-display font-bold text-white">
                    {stat.value}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Growth Chart Placeholder */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Platform Growth
          </h2>

          <div className="h-64 flex items-center justify-center bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
            <p className="text-gray-400">Growth chart visualization would go here</p>
          </div>
        </Card>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Activity */}
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Member Activity
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5 text-green-400" />
                  <span className="text-white">New Signups</span>
                </div>
                <span className="text-white font-bold">{analytics?.newSignups || 0}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Daily Active</span>
                </div>
                <span className="text-white font-bold">{analytics?.dailyActive || 0}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Avg Network Size</span>
                </div>
                <span className="text-white font-bold">{analytics?.avgNetworkSize || 0}</span>
              </div>
            </div>
          </Card>

          {/* Financial Overview */}
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Financial Overview
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white">Total Deposits</span>
                </div>
                <span className="text-white font-bold">{analytics?.totalDeposits || 0} USDT</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">Total Withdrawn</span>
                </div>
                <span className="text-white font-bold">{analytics?.totalWithdrawn || 0} USDT</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-xl">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Platform Balance</span>
                </div>
                <span className="text-white font-bold">{analytics?.platformBalance || 0} USDT</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Recent Platform Activity
          </h2>

          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => {
                const statusConfig = {
                  signup: { icon: UserPlus, color: 'text-green-400', bg: 'bg-green-500' },
                  deposit: { icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-500' },
                  withdrawal: { icon: Wallet, color: 'text-yellow-400', bg: 'bg-yellow-500' },
                  alert: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500' },
                }
                const config = statusConfig[activity.type] || statusConfig.signup
                const Icon = config.icon

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                  >
                    <div className={`p-3 ${config.bg} bg-opacity-20 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.description}</p>
                      <p className="text-gray-400 text-sm">{activity.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity</p>
            </div>
          )}
        </Card>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-display font-bold text-white">System Status</h3>
            </div>
            <p className="text-green-400 font-medium">All Systems Operational</p>
            <p className="text-gray-400 text-sm mt-1">Last checked: {analytics?.lastCheck || 'Just now'}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-display font-bold text-white">User Retention</h3>
            </div>
            <p className="text-white font-bold text-2xl">{analytics?.retention || 0}%</p>
            <p className="text-gray-400 text-sm mt-1">30-day retention rate</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-display font-bold text-white">Pending Issues</h3>
            </div>
            <p className="text-white font-bold text-2xl">{analytics?.pendingIssues || 0}</p>
            <p className="text-gray-400 text-sm mt-1">Require attention</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminAnalytics
