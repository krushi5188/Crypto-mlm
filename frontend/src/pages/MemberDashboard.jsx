import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import Button from '../components/base/Button'
import { memberAPI } from '../services/api'
import {
  DollarSign, Users, UserPlus, TrendingUp, Copy, Check,
  ArrowRight, Clock, CheckCircle
} from 'lucide-react'

const MemberDashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await memberAPI.getDashboard()
      setData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${data?.referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      label: 'Network Size',
      value: data?.networkSize || 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Direct Invites',
      value: data?.directRecruits || 0,
      icon: UserPlus,
      color: 'green',
    },
    {
      label: 'Total Earned',
      value: `${data?.totalEarned || 0} USDT`,
      icon: TrendingUp,
      color: 'purple',
    },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, {data?.username}
          </p>
        </div>

        {/* Balance Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card variant="glass" padding="lg" className="text-center">
            <p className="text-gray-400 text-lg mb-2">Your Balance</p>
            <h2 className="text-7xl font-display font-bold text-white mb-4">
              {data?.balance || 0} <span className="text-5xl text-gray-400">USDT</span>
            </h2>
            {data?.todayEarnings > 0 && (
              <p className="text-green-400 flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                +{data.todayEarnings} USDT today
              </p>
            )}
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card padding="lg" className="min-h-[160px] flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
                      <p className="text-4xl font-display font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-3 bg-white bg-opacity-10 rounded-xl">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card padding="lg">
            <h3 className="text-xl font-display font-bold text-white mb-4">
              Share Your Referral Link
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Invite others to join your network and start earning commissions
            </p>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 text-white text-sm truncate">
                {window.location.origin}/register?ref={data?.referralCode}
              </div>
              <Button
                variant={copied ? 'secondary' : 'primary'}
                onClick={copyReferralLink}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-xl font-display font-bold text-white mb-4">
              Withdraw Funds
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Transfer your earnings to your USDT wallet
            </p>
            <Button
              fullWidth
              onClick={() => navigate('/withdrawals')}
              disabled={data?.balance < 10}
            >
              Withdraw Funds <ArrowRight className="w-5 h-5" />
            </Button>
            {data?.balance < 10 && (
              <p className="text-xs text-gray-500 mt-2">
                Minimum withdrawal: 10 USDT
              </p>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <Card padding="lg">
          <h3 className="text-xl font-display font-bold text-white mb-6">
            Recent Activity
          </h3>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 pb-4 border-b border-white border-opacity-10 last:border-0"
                >
                  <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.description}</p>
                    <p className="text-gray-400 text-sm">{activity.amount} USDT</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No recent activity</p>
              <p className="text-gray-500 text-sm mt-2">
                Start building your network to see activity here
              </p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default MemberDashboard
