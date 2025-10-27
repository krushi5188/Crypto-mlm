import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/base/Card'
import Button from '../../components/base/Button'
import Input from '../../components/base/Input'
import { adminAPI } from '../../services/api'
import {
  Users, Search, Filter, Eye, Ban, CheckCircle, AlertTriangle,
  Mail, Calendar, DollarSign, TrendingUp, UserCheck
} from 'lucide-react'

const AdminMembers = () => {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [statusFilter])

  const fetchMembers = async () => {
    try {
      const response = await adminAPI.getParticipants({ status: statusFilter })
      // Backend returns: { success, data: { participants: [...], pagination: {...} } }
      const responseData = response.data.data || response.data || {}
      setMembers(responseData.participants || responseData || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (member) => {
    setSelectedMember(member)
    setShowDetails(true)
  }

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      if (newStatus === 'suspended') {
        await adminAPI.freezeAccount(memberId, 'Admin action')
      } else {
        await adminAPI.unfreezeAccount(memberId)
      }
      fetchMembers()
    } catch (error) {
      console.error('Error updating member status:', error)
    }
  }

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Members Management
          </h1>
          <p className="text-gray-400">
            View and manage platform members
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-white" />
              <p className="text-gray-400 text-sm">Total Members</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">{members.length}</p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-400" />
              <p className="text-gray-400 text-sm">Active</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">
              {members.filter(m => m.approvalStatus === 'approved').length}
            </p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <Ban className="w-5 h-5 text-red-400" />
              <p className="text-gray-400 text-sm">Suspended</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">
              {members.filter(m => m.approvalStatus === 'rejected').length}
            </p>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-gray-400 text-sm">Flagged</p>
            </div>
            <p className="text-3xl font-display font-bold text-white">
              {members.filter(m => m.flagged).length}
            </p>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card padding="lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                icon={<Search className="w-5 h-5" />}
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              {['all', 'active', 'suspended', 'flagged'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-black'
                      : 'bg-white bg-opacity-5 text-white hover:bg-opacity-10'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Members List */}
        <Card padding="lg">
          <h2 className="text-2xl font-display font-bold text-white mb-6">
            Members ({filteredMembers.length})
          </h2>

          {filteredMembers.length > 0 ? (
            <div className="space-y-3">
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="flex items-center gap-4 p-4 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-10 hover:bg-opacity-10 transition-all"
                >
                  {/* Member Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    member.approvalStatus === 'approved' ? 'bg-green-500' :
                    member.approvalStatus === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  } bg-opacity-20`}>
                    <Users className={`w-6 h-6 ${
                      member.approvalStatus === 'approved' ? 'text-green-400' :
                      member.approvalStatus === 'rejected' ? 'text-red-400' :
                      'text-gray-400'
                    }`} />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{member.username}</p>
                      {member.flagged && (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{member.networkSize} members</p>
                    <p className="text-gray-400 text-xs">network size</p>
                  </div>

                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{member.totalEarned} USDT</p>
                    <p className="text-gray-400 text-xs">earned</p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDetails(member)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No members found</p>
            </div>
          )}
        </Card>

        {/* Member Details Modal */}
        {showDetails && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl w-full"
            >
              <Card padding="lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      {selectedMember.username}
                    </h2>
                    <p className="text-gray-400">{selectedMember.email}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Account Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        selectedMember.approvalStatus === 'approved'
                          ? 'bg-green-500 bg-opacity-20 text-green-400'
                          : selectedMember.approvalStatus === 'pending'
                          ? 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                          : 'bg-red-500 bg-opacity-20 text-red-400'
                      }`}>
                        {selectedMember.approvalStatus ? selectedMember.approvalStatus.charAt(0).toUpperCase() + selectedMember.approvalStatus.slice(1) : 'Unknown'}
                      </span>
                      {selectedMember.flagged === true && (
                        <span className="px-3 py-1 rounded-lg text-sm font-medium bg-yellow-500 bg-opacity-20 text-yellow-400">
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white bg-opacity-5 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">Network Size</p>
                      <p className="text-2xl font-display font-bold text-white">
                        {selectedMember.networkSize}
                      </p>
                    </div>

                    <div className="p-4 bg-white bg-opacity-5 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">Total Earned</p>
                      <p className="text-2xl font-display font-bold text-white">
                        {selectedMember.totalEarned} USDT
                      </p>
                    </div>

                    <div className="p-4 bg-white bg-opacity-5 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">Direct Recruits</p>
                      <p className="text-2xl font-display font-bold text-white">
                        {selectedMember.directRecruits}
                      </p>
                    </div>

                    <div className="p-4 bg-white bg-opacity-5 rounded-xl">
                      <p className="text-gray-400 text-sm mb-1">Balance</p>
                      <p className="text-2xl font-display font-bold text-white">
                        {selectedMember.balance} USDT
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl">
                      <span className="text-gray-400 text-sm">Joined Date</span>
                      <span className="text-white">{selectedMember.joinedAt ? new Date(selectedMember.joinedAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>

                    {selectedMember.referralCode && (
                      <div className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl">
                        <span className="text-gray-400 text-sm">Referral Code</span>
                        <span className="text-white font-mono">{selectedMember.referralCode}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-xl">
                      <span className="text-gray-400 text-sm">Last Active</span>
                      <span className="text-white">{selectedMember.lastLogin ? new Date(selectedMember.lastLogin).toLocaleString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminMembers
