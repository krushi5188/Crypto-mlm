import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Clock, CheckCircle, Users, Calendar, 
  Mail, AlertCircle, Link as LinkIcon, User, XCircle, Hash
} from 'lucide-react';
import apiService from '../services/api';
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

const InstructorDeposits = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState({});

  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadDepositData();
  }, [filter]);

  const loadDepositData = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending'
        ? '/instructor/deposits/pending'
        : `/instructor/deposits?status=${filter !== 'all' ? filter : ''}`;

      const [depositsRes, statsRes] = await Promise.all([
        apiService.get(endpoint),
        apiService.get('/instructor/deposits/stats')
      ]);

      setDeposits(depositsRes.data.deposits);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Failed to load deposit data:', error);
      showError('Failed to load deposit data');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (deposit) => {
    setSelectedDeposit(deposit);
    setShowConfirmModal(true);
  };

  const openRejectModal = (deposit) => {
    setSelectedDeposit(deposit);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedDeposit) return;

    try {
      setProcessing(prev => ({ ...prev, [selectedDeposit.id]: true }));

      await apiService.post(`/instructor/deposits/${selectedDeposit.id}/confirm`);

      showSuccess(`Deposit confirmed - ${formatCurrency(selectedDeposit.amount)} AC credited to ${selectedDeposit.username}`);
      setShowConfirmModal(false);
      setSelectedDeposit(null);
      await loadDepositData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to confirm deposit');
    } finally {
      setProcessing(prev => ({ ...prev, [selectedDeposit.id]: false }));
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !rejectReason.trim()) {
      showError('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, [selectedDeposit.id]: true }));

      await apiService.post(`/instructor/deposits/${selectedDeposit.id}/reject`, { 
        reason: rejectReason 
      });

      showSuccess(`Deposit rejected - ${selectedDeposit.username} will be notified`);
      setShowRejectModal(false);
      setSelectedDeposit(null);
      setRejectReason('');
      await loadDepositData();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to reject deposit');
    } finally {
      setProcessing(prev => ({ ...prev, [selectedDeposit.id]: false }));
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { 
        icon: Clock, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/10', 
        border: 'border-yellow-500/30', 
        label: 'Pending' 
      },
      confirmed: { 
        icon: CheckCircle, 
        color: 'text-green-400', 
        bg: 'bg-green-500/10', 
        border: 'border-green-500/30', 
        label: 'Confirmed' 
      },
      failed: { 
        icon: XCircle, 
        color: 'text-red-400', 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/30', 
        label: 'Rejected' 
      }
    };
    return configs[status] || configs.pending;
  };

  const tabs = [
    { id: 'all', label: 'All Deposits', count: null },
    { id: 'pending', label: 'Pending', count: stats?.pendingCount },
    { id: 'confirmed', label: 'Confirmed', count: null },
    { id: 'failed', label: 'Rejected', count: null }
  ];

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
        <LoadingSkeleton variant="card" />
      </div>
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
            className="p-3 rounded-2xl bg-gradient-to-br from-gold-500/20 to-yellow-500/20"
          >
            <DollarSign className="w-8 h-8 text-gold-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Deposit Management</h1>
            <p className="text-lg text-text-muted">Review and confirm user deposits</p>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      {stats && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="gold">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Total Confirmed</p>
                  <p className="text-3xl font-display font-bold text-gold-400">
                    <AnimatedNumber value={stats.totalConfirmed || 0} decimals={2} />
                    <span className="text-xl ml-1">AC</span>
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl bg-gold-400/10"
                >
                  <DollarSign className="w-8 h-8 text-gold-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Pending Deposits</p>
                  <p className="text-5xl font-display font-bold text-yellow-400">
                    <AnimatedNumber value={stats.pendingCount || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
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
                  <p className="text-sm text-text-dimmed mb-2">Confirmed</p>
                  <p className="text-5xl font-display font-bold text-green-400">
                    <AnimatedNumber value={stats.confirmedCount || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl bg-green-500/10"
                >
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Unique Depositors</p>
                  <p className="text-5xl font-display font-bold text-blue-400">
                    <AnimatedNumber value={stats.uniqueDepositors || 0} />
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
      )}

      {/* Filter Tabs */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="none">
          <div className="flex gap-2 p-2 relative">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors relative z-10 ${
                  filter === tab.id
                    ? 'text-gold-400'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.label}
                {tab.count !== null && tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === tab.id
                      ? 'bg-gold-400/20 text-gold-400'
                      : 'bg-glass-medium text-text-dimmed'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {filter === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gold-400/10 border border-gold-400/30 rounded-xl"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Deposits Table */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">
                {filter === 'all' ? 'All Deposits' : 
                 filter === 'pending' ? 'Pending Deposits' :
                 filter === 'confirmed' ? 'Confirmed Deposits' : 'Rejected Deposits'}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {deposits.length} deposit{deposits.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {deposits.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No Deposits Found"
              description={
                filter === 'pending' 
                  ? "No deposits are currently waiting for approval" 
                  : `No ${filter === 'all' ? '' : filter} deposits to display`
              }
            />
          ) : (
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">User</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Network</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Transaction Hash</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {deposits.map((deposit, index) => {
                      const statusConfig = getStatusConfig(deposit.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <motion.tr
                          key={deposit.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                          className="transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-text-dimmed" />
                              <div>
                                <div className="font-semibold">
                                  {formatDate(deposit.created_at)}
                                </div>
                                <div className="text-xs text-text-dimmed">
                                  {new Date(deposit.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500 to-yellow-500 flex items-center justify-center font-bold text-white">
                                {deposit.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold">{deposit.username}</div>
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                  <Mail className="w-3 h-3" />
                                  {deposit.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="text-2xl font-display font-bold text-gold-400">
                              {formatCurrency(parseFloat(deposit.amount))}
                              <span className="text-sm ml-1">AC</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              <LinkIcon className="w-3 h-3" />
                              {deposit.network}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Hash className="w-4 h-4 text-text-dimmed" />
                              <code className="text-xs font-mono text-text-muted" title={deposit.transaction_hash}>
                                {deposit.transaction_hash.substring(0, 10)}...
                                {deposit.transaction_hash.substring(deposit.transaction_hash.length - 8)}
                              </code>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            {deposit.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => openConfirmModal(deposit)}
                                  disabled={processing[deposit.id]}
                                  variant="success"
                                  size="sm"
                                  icon={<CheckCircle className="w-4 h-4" />}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  onClick={() => openRejectModal(deposit)}
                                  disabled={processing[deposit.id]}
                                  variant="danger"
                                  size="sm"
                                  icon={<XCircle className="w-4 h-4" />}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {deposit.status === 'confirmed' && deposit.confirmed_at && (
                              <div className="text-xs text-text-muted">
                                Confirmed: {formatDate(deposit.confirmed_at)}
                              </div>
                            )}
                            {deposit.status === 'failed' && (
                              <div className="text-xs text-red-400">
                                Rejected
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Card>
      </motion.div>

      {/* Confirm Deposit Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedDeposit(null);
        }}
        title="Confirm Deposit"
        size="md"
      >
        {selectedDeposit && (
          <div className="space-y-6">
            <Card variant="glass-medium" padding="lg" glow="green">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-text-muted leading-relaxed">
                    Are you sure you want to confirm this deposit? The user's account will be credited immediately.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-glass-border">
                  <div>
                    <p className="text-xs text-text-dimmed mb-1">User</p>
                    <p className="font-semibold">{selectedDeposit.username}</p>
                    <p className="text-xs text-text-muted">{selectedDeposit.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-dimmed mb-1">Amount</p>
                    <p className="text-2xl font-display font-bold text-gold-400">
                      {formatCurrency(parseFloat(selectedDeposit.amount))} AC
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-dimmed mb-1">Network</p>
                    <p className="font-semibold text-blue-400">{selectedDeposit.network}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-dimmed mb-1">Date</p>
                    <p className="font-semibold">{formatDate(selectedDeposit.created_at)}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-text-dimmed mb-1">Transaction Hash</p>
                  <code className="text-xs font-mono text-text-muted break-all">
                    {selectedDeposit.transaction_hash}
                  </code>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedDeposit(null);
                }}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={processing[selectedDeposit.id]}
                variant="success"
                fullWidth
                icon={<CheckCircle className="w-5 h-5" />}
              >
                {processing[selectedDeposit.id] ? 'Processing...' : 'Confirm Deposit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Deposit Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedDeposit(null);
          setRejectReason('');
        }}
        title="Reject Deposit"
        size="md"
      >
        {selectedDeposit && (
          <div className="space-y-6">
            <Card variant="glass-medium" padding="lg" className="border border-red-500/30">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-text-muted leading-relaxed">
                    Please provide a reason for rejecting this deposit. The user will be notified.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-glass-border">
                  <div>
                    <p className="text-xs text-text-dimmed mb-1">User</p>
                    <p className="font-semibold">{selectedDeposit.username}</p>
                    <p className="text-xs text-text-muted">{selectedDeposit.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-dimmed mb-1">Amount</p>
                    <p className="text-2xl font-display font-bold text-gold-400">
                      {formatCurrency(parseFloat(selectedDeposit.amount))} AC
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Input
              type="textarea"
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this deposit is being rejected..."
              rows={4}
              required
            />

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDeposit(null);
                  setRejectReason('');
                }}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing[selectedDeposit.id] || !rejectReason.trim()}
                variant="danger"
                fullWidth
                icon={<XCircle className="w-5 h-5" />}
              >
                {processing[selectedDeposit.id] ? 'Processing...' : 'Reject Deposit'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default InstructorDeposits;
