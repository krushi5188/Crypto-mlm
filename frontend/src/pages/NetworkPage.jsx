import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import { memberAPI } from '../services/api'
import { Users, UserPlus, TrendingUp, ChevronRight, Calendar, DollarSign } from 'lucide-react'

const NetworkPage = () => {
  const [networkData, setNetworkData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tree')

  useEffect(() => {
    fetchNetworkData()
  }, [])

  const fetchNetworkData = async () => {
    try {
      const response = await memberAPI.getNetwork()
      setNetworkData(response.data)
    } catch (error) {
      console.error('Error fetching network:', error)
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
      label: 'Total Network Size',
      value: networkData?.totalMembers || 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Direct Recruits',
      value: networkData?.directRecruits || 0,
      icon: UserPlus,
      color: 'green',
    },
    {
      label: 'Network Earnings',
      value: `${networkData?.networkEarnings || 0} USDT`,
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
            My Network
          </h1>
          <p className="text-gray-400">
            View and manage your referral network
          </p>
        </div>

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
                <Card padding="lg">
                  <div className="flex items-start justify-between">
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

        {/* Tabs */}
        <Card padding="sm">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'tree'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Network Tree
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Member List
            </button>
          </div>
        </Card>

        {/* Content */}
        {activeTab === 'tree' ? (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              Your Network Tree
            </h2>

            {/* Upline */}
            {networkData?.upline && (
              <div className="mb-8">
                <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                  Your Upline
                </h3>
                <div className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                  <div className="w-12 h-12 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{networkData.upline.username}</p>
                    <p className="text-gray-400 text-sm">Invited you to the network</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">Level {networkData.upline.level}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current User */}
            <div className="mb-8">
              <h3 className="text-lg font-display font-semibold text-white mb-4">
                You
              </h3>
              <div className="flex items-center gap-4 p-6 bg-white rounded-xl border-2 border-white">
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-black font-medium text-lg">{networkData?.username}</p>
                  <p className="text-gray-700 text-sm">Network Root</p>
                </div>
              </div>
            </div>

            {/* Downline */}
            <div>
              <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                <ChevronRight className="w-5 h-5" />
                Your Downline ({networkData?.directRecruits || 0} Direct)
              </h3>

              {networkData?.downline && networkData.downline.length > 0 ? (
                <div className="space-y-3">
                  {networkData.downline.map((member, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 hover:bg-opacity-10 transition-all"
                    >
                      <div className="w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{member.username}</p>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Joined {member.joinedDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-medium">
                          {member.networkSize} members
                        </p>
                        <p className="text-gray-400 text-xs">in their network</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-medium">{member.earnings} USDT</p>
                        <p className="text-gray-400 text-xs">total earned</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10">
                  <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No direct recruits yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Share your referral link to start building your network
                  </p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <h2 className="text-2xl font-display font-bold text-white mb-6">
              All Network Members
            </h2>

            {networkData?.allMembers && networkData.allMembers.length > 0 ? (
              <div className="space-y-3">
                {networkData.allMembers.map((member, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10"
                  >
                    <div className="w-10 h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.username}</p>
                      <p className="text-gray-400 text-sm">Level {member.level} member</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm">{member.earnings} USDT</p>
                      <p className="text-gray-400 text-xs">earned</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{member.joinedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No network members yet</p>
              </div>
            )}
          </Card>
        )}

        {/* Network Growth */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Network Growth
          </h2>

          {networkData?.growthHistory && networkData.growthHistory.length > 0 ? (
            <div className="space-y-4">
              {networkData.growthHistory.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 pb-4 border-b border-white border-opacity-10 last:border-0"
                >
                  <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                    <UserPlus className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{entry.username} joined your network</p>
                    <p className="text-gray-400 text-sm">Level {entry.level} • {entry.path}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs">{entry.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No growth activity yet</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default NetworkPage
