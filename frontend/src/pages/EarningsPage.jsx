import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import { memberAPI } from '../services/api'
import {
  DollarSign, TrendingUp, Calendar, Users, ArrowUpRight,
  PieChart, Clock, CheckCircle, Filter
} from 'lucide-react'

const EarningsPage = () => {
  const [earningsData, setEarningsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')

  useEffect(() => {
    fetchEarningsData()
  }, [timeFilter])

  const fetchEarningsData = async () => {
    try {
      const response = await memberAPI.getEarnings({ period: timeFilter })
      setEarningsData(response.data)
    } catch (error) {
      console.error('Error fetching earnings:', error)
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

  const stats = [
    {
      label: 'Total Earned',
      value: `${earningsData?.totalEarned || 0} USDT`,
      icon: DollarSign,
      change: earningsData?.totalChange,
    },
    {
      label: 'This Month',
      value: `${earningsData?.thisMonth || 0} USDT`,
      icon: TrendingUp,
      change: earningsData?.monthChange,
    },
    {
      label: 'Today',
      value: `${earningsData?.today || 0} USDT`,
      icon: Calendar,
      change: earningsData?.todayChange,
    },
    {
      label: 'Avg per Member',
      value: `${earningsData?.avgPerMember || 0} USDT`,
      icon: Users,
      change: earningsData?.avgChange,
    },
  ]

  const commissionTypes = [
    {
      label: 'Direct Referral',
      amount: earningsData?.directCommissions || 0,
      percentage: 40,
      color: 'bg-blue-500',
    },
    {
      label: 'Level 2-5',
      amount: earningsData?.level2to5Commissions || 0,
      percentage: 30,
      color: 'bg-green-500',
    },
    {
      label: 'Deep Network',
      amount: earningsData?.deepNetworkCommissions || 0,
      percentage: 20,
      color: 'bg-purple-500',
    },
    {
      label: 'Bonuses',
      amount: earningsData?.bonuses || 0,
      percentage: 10,
      color: 'bg-yellow-500',
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Earnings
            </h1>
            <p className="text-gray-400">
              Track your commissions and earnings breakdown
            </p>
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2">
            {['all', 'month', 'week', 'today'].map((filter) => (
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
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

        {/* Commission Breakdown */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Commission Breakdown
          </h2>

          <div className="space-y-4">
            {commissionTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <span className="text-white font-medium">{type.label}</span>
                  </div>
                  <span className="text-white font-bold">{type.amount} USDT</span>
                </div>
                <div className="w-full h-3 bg-white bg-opacity-5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${type.percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full ${type.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
            <p className="text-sm text-gray-300 leading-relaxed">
              <strong className="text-white">How Commissions Work:</strong><br />
              • <strong>Direct Referral:</strong> 10 USDT per person you directly invite<br />
              • <strong>Level 2-5:</strong> Weighted commissions from your close network<br />
              • <strong>Deep Network:</strong> Ongoing earnings from your entire downline<br />
              • <strong>Bonuses:</strong> Performance and milestone rewards
            </p>
          </div>
        </Card>

        {/* Earnings History */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Recent Earnings
          </h2>

          {earningsData?.earningsHistory && earningsData.earningsHistory.length > 0 ? (
            <div className="space-y-3">
              {earningsData.earningsHistory.map((earning, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                >
                  <div className="p-3 bg-green-500 bg-opacity-20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{earning.description}</p>
                    <p className="text-gray-400 text-sm">{earning.source}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">+{earning.amount} USDT</p>
                    <p className="text-gray-400 text-xs flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {earning.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No earnings yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start building your network to earn commissions
              </p>
            </div>
          )}
        </Card>

        {/* Pending Earnings */}
        {earningsData?.pendingEarnings && earningsData.pendingEarnings.length > 0 && (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Pending Earnings
            </h2>

            <div className="space-y-3">
              {earningsData.pendingEarnings.map((pending, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-yellow-500 bg-opacity-10 rounded-xl border border-yellow-500 border-opacity-30"
                >
                  <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{pending.description}</p>
                    <p className="text-gray-400 text-sm">{pending.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{pending.amount} USDT</p>
                    <p className="text-gray-400 text-xs">{pending.unlockTime}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Earnings Milestones */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Earnings Milestones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'First Earning', achieved: true, amount: '10 USDT' },
              { label: 'Bronze Earner', achieved: true, amount: '100 USDT' },
              { label: 'Silver Earner', achieved: false, amount: '1,000 USDT' },
            ].map((milestone, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  milestone.achieved
                    ? 'bg-green-500 bg-opacity-10 border-green-500 border-opacity-30'
                    : 'bg-white bg-opacity-5 border-white border-opacity-10'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {milestone.achieved ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <span className={`font-medium ${
                    milestone.achieved ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {milestone.label}
                  </span>
                </div>
                <p className="text-white text-sm">{milestone.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default EarningsPage
