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
  const [showDripFunds, setShowDripFunds] = useState(false)
  const [dripAmount, setDripAmount] = useState('')
  const [dripNote, setDripNote] = useState('')
  const [dripError, setDripError] = useState('')
  const [showDeductFunds, setShowDeductFunds] = useState(false)
  const [deductAmount, setDeductAmount] = useState('')
  const [deductNote, setDeductNote] = useState('')
  const [deductError, setDeductError] = useState('')
  const [showPromote, setShowPromote] = useState(false)
  const [targetRank, setTargetRank] = useState('')
  const [promoteError, setPromoteError] = useState('')
  const [ranks, setRanks] = useState([]) // We'll hardcode ranks or fetch if an API exists, for now hardcode based on migration
  const [showMove, setShowMove] = useState(false)
  const [newSponsorId, setNewSponsorId] = useState('')
  const [moveError, setMoveError] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [addMemberData, setAddMemberData] = useState({
    email: '',
    username: '',
    password: ''
  })
  const [addMemberError, setAddMemberError] = useState('')

  useEffect(() => {
    fetchMembers()
    fetchRanks()
  }, [])

  const fetchRanks = async () => {
    try {
      // Assuming gamificationAPI.getAllRanks exists as per services/api.js
      const { gamificationAPI } = await import('../../services/api');
      const response = await gamificationAPI.getAllRanks();
      setRanks(response.data || []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      // Fallback to hardcoded if API fails or not implemented yet
      setRanks([
        { id: 1, name: 'Starter' },
        { id: 2, name: 'Bronze' },
        { id: 3, name: 'Silver' },
        { id: 4, name: 'Gold' },
        { id: 5, name: 'Platinum' },
        { id: 6, name: 'Diamond' },
        { id: 7, name: 'Ambassador' },
      ]);
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await adminAPI.getParticipants()
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

  const handleApprove = async (memberId) => {
    try {
      await adminAPI.approveParticipant(memberId);
      fetchMembers();
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  const handleReject = async (memberId) => {
    try {
      await adminAPI.rejectParticipant(memberId, { reason: 'Admin rejection' });
      fetchMembers();
    } catch (error) {
      console.error('Error rejecting member:', error);
    }
  };


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

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    setAddMemberError('');
    try {
      await adminAPI.addMember(addMemberData);
      setShowAddMember(false);
      fetchMembers();
    } catch (error) {
      setAddMemberError(error.response?.data?.error || 'Failed to add member');
    }
  };

  const filteredMembers = members.filter(member => {
    // Text search
    const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'pending' ? member.approvalStatus === 'pending' :
      statusFilter === 'active' ? member.approvalStatus === 'approved' :
      statusFilter === 'suspended' ? member.approvalStatus === 'rejected' :
      statusFilter === 'flagged' ? member.flagged === true :
      true;

    return matchesSearch && matchesStatus;
  })

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Members Management
            </h1>
            <p className="text-gray-400">
              View and manage platform members
            </p>
          </div>
          <Button onClick={() => setShowAddMember(true)}>
            Add Member
          </Button>
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
              {['all', 'pending', 'active', 'suspended', 'flagged'].map((filter) => (
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
                    {member.referredBy && (
                      <p className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        Referred by: {member.referredBy}
                      </p>
                    )}
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
                    {member.approvalStatus === 'pending' ? (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(member.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(member.id)}
                        >
                          <Ban className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewDetails(member)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
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
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-6">
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
                <div className="mt-6 flex justify-end gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDetails(false);
                      setShowPromote(true);
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Promote Rank
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDetails(false);
                      setShowMove(true);
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Change Sponsor
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowDetails(false);
                      setShowDeductFunds(true);
                    }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Deduct Funds
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      setShowDripFunds(true);
                    }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Drip Funds
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Promote Modal */}
        {showPromote && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card padding="lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      Promote {selectedMember.username}
                    </h2>
                    <p className="text-gray-400">Manually override member rank.</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowPromote(false);
                      setTargetRank('');
                      setPromoteError('');
                    }}
                  >
                    Close
                  </Button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setPromoteError('');
                    try {
                      await adminAPI.promoteParticipant(selectedMember.id, parseInt(targetRank));

                      setShowPromote(false);
                      setTargetRank('');
                      fetchMembers();
                    } catch (error) {
                      setPromoteError(error.response?.data?.error || 'Failed to promote member');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Select New Rank</label>
                    <select
                      value={targetRank}
                      onChange={(e) => setTargetRank(e.target.value)}
                      className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl text-white focus:outline-none focus:border-green-500 transition-all"
                      required
                    >
                      <option value="">-- Select Rank --</option>
                      {ranks.map(rank => (
                        <option key={rank.id} value={rank.id}>{rank.name}</option>
                      ))}
                    </select>
                  </div>

                  {promoteError && <p className="text-red-500 text-sm">{promoteError}</p>}

                  <div className="p-3 bg-yellow-500 bg-opacity-10 rounded-lg border border-yellow-500 border-opacity-20">
                    <p className="text-yellow-400 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        This will permanently lock the user's rank to this level (or higher) until manually changed again.
                        They will not be auto-downgraded if their stats drop.
                      </span>
                    </p>
                  </div>

                  <Button type="submit" fullWidth variant="primary">
                    Confirm Promotion
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Move User Modal */}
        {showMove && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card padding="lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      Change Sponsor
                    </h2>
                    <p className="text-gray-400">Move {selectedMember.username} under a new sponsor.</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowMove(false);
                      setNewSponsorId('');
                      setMoveError('');
                    }}
                  >
                    Close
                  </Button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setMoveError('');
                    try {
                      await adminAPI.moveParticipant(selectedMember.id, parseInt(newSponsorId));
                      setShowMove(false);
                      setNewSponsorId('');
                      fetchMembers();
                    } catch (error) {
                      setMoveError(error.response?.data?.error || 'Failed to move member');
                    }
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="New Sponsor ID"
                    type="number"
                    value={newSponsorId}
                    onChange={(e) => setNewSponsorId(e.target.value)}
                    required
                    placeholder="e.g., 1"
                  />

                  {moveError && <p className="text-red-500 text-sm">{moveError}</p>}

                  <div className="p-3 bg-red-500 bg-opacity-10 rounded-lg border border-red-500 border-opacity-20">
                    <p className="text-red-400 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Warning: This will alter the entire downline structure. The user and all their recruits will be moved.
                      </span>
                    </p>
                  </div>

                  <Button type="submit" fullWidth variant="danger">
                    Confirm Move
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Deduct Funds Modal */}
        {showDeductFunds && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card padding="lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      Deduct Funds from {selectedMember.username}
                    </h2>
                    <p className="text-gray-400">Manually deduct funds from a member's balance.</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowDeductFunds(false);
                      setDeductAmount('');
                      setDeductNote('');
                      setDeductError('');
                    }}
                  >
                    Close
                  </Button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setDeductError('');
                    try {
                      await adminAPI.deductCoins({
                        userId: selectedMember.id,
                        amount: parseFloat(deductAmount),
                        note: deductNote,
                      });
                      setShowDeductFunds(false);
                      setDeductAmount('');
                      setDeductNote('');
                      fetchMembers(); // Refresh member list to show updated balance
                    } catch (error) {
                      setDeductError(error.response?.data?.error || 'Failed to deduct funds');
                    }
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Amount (USDT)"
                    type="number"
                    value={deductAmount}
                    onChange={(e) => setDeductAmount(e.target.value)}
                    required
                    placeholder="e.g., 50"
                  />
                  <Input
                    label="Note (Optional)"
                    type="text"
                    value={deductNote}
                    onChange={(e) => setDeductNote(e.target.value)}
                    placeholder="e.g., Deduction for policy violation"
                  />
                  {deductError && <p className="text-red-500 text-sm">{deductError}</p>}
                  <Button type="submit" fullWidth variant="danger">
                    Confirm Deduction
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card padding="lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      Add New Member
                    </h2>
                    <p className="text-gray-400">Create a new member account</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddMember(false)}
                  >
                    Close
                  </Button>
                </div>
                <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={addMemberData.email}
                    onChange={(e) => setAddMemberData({ ...addMemberData, email: e.target.value })}
                    required
                  />
                  <Input
                    label="Username"
                    type="text"
                    value={addMemberData.username}
                    onChange={(e) => setAddMemberData({ ...addMemberData, username: e.target.value })}
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={addMemberData.password}
                    onChange={(e) => setAddMemberData({ ...addMemberData, password: e.target.value })}
                    required
                  />
                  {addMemberError && <p className="text-red-500 text-sm">{addMemberError}</p>}
                  <Button type="submit" fullWidth>Create Member</Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Drip Funds Modal */}
        {showDripFunds && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full"
            >
              <Card padding="lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-1">
                      Drip Funds to {selectedMember.username}
                    </h2>
                    <p className="text-gray-400">Manually add funds to a member's balance.</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowDripFunds(false);
                      setDripAmount('');
                      setDripNote('');
                      setDripError('');
                    }}
                  >
                    Close
                  </Button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setDripError('');
                    try {
                      await adminAPI.injectCoins({
                        userId: selectedMember.id,
                        amount: parseFloat(dripAmount),
                        note: dripNote,
                      });
                      setShowDripFunds(false);
                      setDripAmount('');
                      setDripNote('');
                      fetchMembers(); // Refresh member list to show updated balance
                    } catch (error) {
                      setDripError(error.response?.data?.error || 'Failed to drip funds');
                    }
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Amount (USDT)"
                    type="number"
                    value={dripAmount}
                    onChange={(e) => setDripAmount(e.target.value)}
                    required
                    placeholder="e.g., 100"
                  />
                  <Input
                    label="Note (Optional)"
                    type="text"
                    value={dripNote}
                    onChange={(e) => setDripNote(e.target.value)}
                    placeholder="e.g., Manual bonus"
                  />
                  {dripError && <p className="text-red-500 text-sm">{dripError}</p>}
                  <Button type="submit" fullWidth>
                    Confirm Drip
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default AdminMembers
