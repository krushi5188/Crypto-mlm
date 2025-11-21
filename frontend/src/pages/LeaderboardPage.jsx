import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/layout/DashboardLayout'
import Card from '../components/base/Card'
import { gamificationAPI } from '../services/api'
import { Trophy, Users, TrendingUp, Medal, Award } from 'lucide-react'

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('earners')
  const [leaderboardData, setLeaderboardData] = useState([])
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [activeTab])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      let response;
      if (activeTab === 'earners') {
        response = await gamificationAPI.getTopEarners(50);
        // Backend returns { success, data: { leaderboard: [...] } }
        setLeaderboardData(response.data.leaderboard || []);

        // Fetch user position
        const posResponse = await gamificationAPI.getUserPosition({ type: 'earners' });
        setUserPosition(posResponse.data);
      } else {
        response = await gamificationAPI.getTopRecruiters(50);
        setLeaderboardData(response.data.leaderboard || []);

        const posResponse = await gamificationAPI.getUserPosition({ type: 'recruiters' });
        setUserPosition(posResponse.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-400';
      default: return 'text-gray-600';
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold text-white">
            Leaderboard
          </h1>
          <p className="text-gray-400">
            Compete with top performers and earn recognition
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab('earners')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'earners'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/20'
                : 'bg-white bg-opacity-5 text-gray-400 hover:bg-opacity-10'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Top Earners
          </button>
          <button
            onClick={() => setActiveTab('recruiters')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'recruiters'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white bg-opacity-5 text-gray-400 hover:bg-opacity-10'
            }`}
          >
            <Users className="w-5 h-5" />
            Top Recruiters
          </button>
        </div>

        {/* User Position Card */}
        {userPosition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card padding="md" className="bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white bg-opacity-10 rounded-full">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Your Rank</p>
                    <p className="text-2xl font-display font-bold text-white">
                      #{userPosition.position}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'earners' ? 'Total Earned' : 'Total Recruits'}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {activeTab === 'earners'
                      ? `$${userPosition.value.toFixed(2)}`
                      : userPosition.value}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <Card padding="none" className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading rankings...</div>
          ) : (
            <div className="divide-y divide-white divide-opacity-5">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-white bg-opacity-5 text-sm font-medium text-gray-400">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-6">Member</div>
                <div className="col-span-4 text-right">
                  {activeTab === 'earners' ? 'Earnings' : 'Recruits'}
                </div>
              </div>

              {/* Data Rows */}
              {leaderboardData.map((item, index) => (
                <motion.div
                  key={item.userId} // Note: Ghost IDs are negative, Real are positive
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white hover:bg-opacity-5 transition-colors"
                >
                  <div className="col-span-2 flex justify-center">
                    {item.rank <= 3 ? (
                      <Medal className={`w-6 h-6 ${getMedalColor(item.rank)}`} />
                    ) : (
                      <span className="text-gray-500 font-bold">#{item.rank}</span>
                    )}
                  </div>

                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white">
                      {item.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.username}</p>
                      {item.currentRank && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-10 text-gray-300">
                          {item.currentRank.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="col-span-4 text-right font-bold text-white">
                    {activeTab === 'earners'
                      ? `$${item.earnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : item.recruitCount || item.directRecruits
                    }
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

// Helper icon import
import { DollarSign } from 'lucide-react';

export default LeaderboardPage
