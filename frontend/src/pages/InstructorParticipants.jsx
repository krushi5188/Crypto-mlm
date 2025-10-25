import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, CheckCircle, XCircle, Clock, 
  UserPlus, Eye, Mail, Wallet, TrendingUp, AlertCircle,
  X, Calendar, Shield
} from 'lucide-react';
import { instructorAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
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
import { formatCurrency, formatDate } from '../utils/formatters';

const InstructorParticipants = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  
  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Reject Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingRejectId, setPendingRejectId] = useState(null);
  const [pendingRejectUsername, setPendingRejectUsername] = useState('');
  
  // Approve Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [pendingApproveId, setPendingApproveId] = useState(null);
  const [pendingApproveUsername, setPendingApproveUsername] = useState('');
  
  // Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await instructorAPI.getParticipants({ limit: 1000 });
      setParticipants(response.data.data.participants);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load participants';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.password) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    
    try {
      await instructorAPI.addMember(formData);
      await loadParticipants();
      setFormData({ email: '', username: '', password: '' });
      setShowAddModal(false);
      showSuccess(`Member ${formData.username} created successfully!`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create member account';
      const details = err.response?.data?.details;
      if (details && details.length > 0) {
        showError(`${errorMsg}: ${details.map(d => d.message).join(', ')}`);
      } else {
        showError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (participantId, username) => {
    setPendingApproveId(participantId);
    setPendingApproveUsername(username);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    setShowApproveModal(false);
    setProcessingId(pendingApproveId);
    
    try {
      await instructorAPI.approveParticipant(pendingApproveId);
      await loadParticipants();
      showSuccess(`${pendingApproveUsername} has been approved successfully!`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to approve participant');
    } finally {
      setProcessingId(null);
      setPendingApproveId(null);
      setPendingApproveUsername('');
    }
  };

  const handleReject = (participantId, username) => {
    setPendingRejectId(participantId);
    setPendingRejectUsername(username);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    setShowRejectModal(false);
    setProcessingId(pendingRejectId);
    
    try {
      await instructorAPI.rejectParticipant(pendingRejectId, { reason: rejectReason });
      await loadParticipants();
      showSuccess(`${pendingRejectUsername} has been rejected.`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to reject participant');
    } finally {
      setProcessingId(null);
      setPendingRejectId(null);
      setPendingRejectUsername('');
      setRejectReason('');
    }
  };

  const handleViewDetails = (participant) => {
    setSelectedParticipant(participant);
    setShowDetailsModal(true);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Pending' },
      approved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Approved' },
      rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Rejected' }
    };
    return configs[status] || configs.approved;
  };

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = p.username.toLowerCase().includes(search.toLowerCase()) ||
                         p.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || p.approvalStatus === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = participants.filter(p => p.approvalStatus === 'pending').length;
  const approvedCount = participants.filter(p => p.approvalStatus === 'approved').length;
  const rejectedCount = participants.filter(p => p.approvalStatus === 'rejected').length;

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
          <div className="flex items-start gap-3 text-error">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-semibold mb-2">Failed to Load Participants</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadParticipants} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            >
              <Users className="w-8 h-8 text-blue-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-display font-bold">Participants Management</h1>
              <p className="text-lg text-text-muted">Manage member registrations and approvals</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="primary"
            icon={<UserPlus className="w-5 h-5" />}
          >
            Add Member
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="yellow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Pending Approval</p>
                <p className="text-5xl font-display font-bold text-yellow-400">
                  <AnimatedNumber value={pendingCount} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-yellow-500/10"
              >
                <Clock className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Approved</p>
                <p className="text-5xl font-display font-bold text-green-400">
                  <AnimatedNumber value={approvedCount} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="p-4 rounded-2xl bg-green-500/10"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="red">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Rejected</p>
                <p className="text-5xl font-display font-bold text-red-400">
                  <AnimatedNumber value={rejectedCount} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-red-500/10"
              >
                <XCircle className="w-8 h-8 text-red-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Total Members</p>
                <p className="text-5xl font-display font-bold text-blue-400">
                  <AnimatedNumber value={participants.length} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="p-4 rounded-2xl bg-blue-500/10"
              >
                <Users className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Filter Participants</h3>
            </div>

            <Input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />

            <div className="flex gap-3 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'All Members', count: participants.length },
                { value: 'pending', label: 'Pending', count: pendingCount },
                { value: 'approved', label: 'Approved', count: approvedCount },
                { value: 'rejected', label: 'Rejected', count: rejectedCount }
              ].map((tab) => (
                <motion.button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
                    filter === tab.value ? 'text-gold-400' : 'text-text-dimmed hover:text-text-primary'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab.value ? 'bg-gold-400/20 text-gold-400' : 'bg-glass-medium text-text-dimmed'
                  }`}>
                    {tab.count}
                  </span>
                  {filter === tab.value && (
                    <motion.div
                      layoutId="activeParticipantTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Participants Table */}
      {filteredParticipants.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <EmptyState
            icon={Users}
            title="No Participants Found"
            description={search ? "No participants match your search criteria." : "No participants available."}
            actionLabel={search ? "Clear Search" : "Add Member"}
            onAction={search ? () => setSearch('') : () => setShowAddModal(true)}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass-strong" padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Email</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-dimmed">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Balance</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Network</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Joined</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-dimmed">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {filteredParticipants.map((participant, index) => {
                    const statusConfig = getStatusConfig(participant.approvalStatus);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.tr
                        key={participant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                              {participant.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold">{participant.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-muted">{participant.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gold-400">
                          {formatCurrency(participant.balance)} USDT
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm">
                            <div className="text-blue-400 font-semibold">{participant.directRecruits} direct</div>
                            <div className="text-text-dimmed">{participant.networkSize} total</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-dimmed text-sm">
                          {formatDate(participant.joinedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => handleViewDetails(participant)}
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                            >
                              View
                            </Button>
                            {participant.approvalStatus === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleApprove(participant.id, participant.username)}
                                  disabled={processingId === participant.id}
                                  variant="success"
                                  size="sm"
                                  icon={<CheckCircle className="w-4 h-4" />}
                                >
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleReject(participant.id, participant.username)}
                                  disabled={processingId === participant.id}
                                  variant="danger"
                                  size="sm"
                                  icon={<XCircle className="w-4 h-4" />}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData({ email: '', username: '', password: '' });
        }}
        title="Add New Member"
        size="md"
      >
        <form onSubmit={handleAddMember} className="space-y-6">
          <Card variant="glass-medium" padding="lg" glow="blue">
            <p className="text-sm text-text-muted">
              Members added by instructor are automatically approved and can login immediately.
            </p>
          </Card>

          <Input
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="member@example.com"
            icon={<Mail className="w-5 h-5" />}
            required
          />

          <Input
            type="text"
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="johndoe (3-20 alphanumeric)"
            icon={<Users className="w-5 h-5" />}
            minLength={3}
            maxLength={20}
            pattern="[a-zA-Z0-9]+"
            required
            helpText="3-20 alphanumeric characters"
          />

          <Input
            type="password"
            label="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimum 8 characters"
            icon={<Shield className="w-5 h-5" />}
            minLength={8}
            required
            helpText="8+ chars, 1 uppercase, 1 lowercase, 1 number"
          />

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                setFormData({ email: '', username: '', password: '' });
              }}
              variant="outline"
              fullWidth
              icon={<X className="w-5 h-5" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={submitting}
              icon={<UserPlus className="w-5 h-5" />}
            >
              {submitting ? 'Creating...' : 'Create Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setPendingApproveId(null);
          setPendingApproveUsername('');
        }}
        title="Approve Member"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-text-muted leading-relaxed">
            Approve <span className="font-semibold text-green-400">{pendingApproveUsername}</span>? This will activate their account and distribute commissions to their upline.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowApproveModal(false);
                setPendingApproveId(null);
                setPendingApproveUsername('');
              }}
              variant="outline"
              fullWidth
              icon={<X className="w-5 h-5" />}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApprove}
              variant="success"
              fullWidth
              icon={<CheckCircle className="w-5 h-5" />}
            >
              Confirm Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setPendingRejectId(null);
          setPendingRejectUsername('');
          setRejectReason('');
        }}
        title={`Reject ${pendingRejectUsername}`}
        size="md"
      >
        <div className="space-y-6">
          <p className="text-text-muted leading-relaxed">
            Please provide a reason for rejecting this member:
          </p>

          <Input
            type="textarea"
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            required
          />

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setPendingRejectId(null);
                setPendingRejectUsername('');
                setRejectReason('');
              }}
              variant="outline"
              fullWidth
              icon={<X className="w-5 h-5" />}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              variant="danger"
              fullWidth
              disabled={!rejectReason.trim()}
              icon={<XCircle className="w-5 h-5" />}
            >
              Reject Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Participant Details Modal */}
      {selectedParticipant && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedParticipant(null);
          }}
          title={selectedParticipant.username}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                {selectedParticipant.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold">{selectedParticipant.username}</h3>
                <p className="text-text-muted">{selectedParticipant.email}</p>
              </div>
            </div>

            <Card variant="glass-medium" padding="lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-text-dimmed">Status</span>
                  </div>
                  <div className="flex">
                    {(() => {
                      const statusConfig = getStatusConfig(selectedParticipant.approvalStatus);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-gold-400" />
                    <span className="text-sm text-text-dimmed">Balance</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-gold-400">
                    {formatCurrency(selectedParticipant.balance)} USDT
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-text-dimmed">Direct Recruits</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-blue-400">
                    <AnimatedNumber value={selectedParticipant.directRecruits} />
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-text-dimmed">Network Size</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-purple-400">
                    <AnimatedNumber value={selectedParticipant.networkSize} />
                  </p>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-text-dimmed">Joined Date</span>
                  </div>
                  <p className="text-lg font-semibold text-green-400">
                    {formatDate(selectedParticipant.joinedAt)}
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              {selectedParticipant.approvalStatus === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApprove(selectedParticipant.id, selectedParticipant.username);
                    }}
                    variant="success"
                    fullWidth
                    icon={<CheckCircle className="w-5 h-5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReject(selectedParticipant.id, selectedParticipant.username);
                    }}
                    variant="danger"
                    fullWidth
                    icon={<XCircle className="w-5 h-5" />}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedParticipant(null);
                }}
                variant="outline"
                fullWidth
                icon={<X className="w-5 h-5" />}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default InstructorParticipants;