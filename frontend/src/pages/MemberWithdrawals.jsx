import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingDown, Clock, CheckCircle, XCircle, 
  AlertCircle, Wallet, Plus, X, Info
} from 'lucide-react';
import { memberAPI } from '../services/api';
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
import { formatCurrency, formatDateTime } from '../utils/formatters';

const MemberWithdrawals = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [notes, setNotes] = useState('');
  const [feeInfo, setFeeInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const withdrawAmount = parseFloat(amount);
      const percentageFee = withdrawAmount * 0.02;
      const totalFee = percentageFee + 1;
      const netAmount = withdrawAmount - totalFee;
      setFeeInfo({ fee: totalFee.toFixed(2), netAmount: netAmount.toFixed(2) });
    } else {
      setFeeInfo(null);
    }
  }, [amount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [withdrawalsRes, statsRes, walletsRes] = await Promise.all([
        memberAPI.getWithdrawals(),
        memberAPI.getWithdrawalStats(),
        memberAPI.getWallets()
      ]);
      setWithdrawals(withdrawalsRes.data.data.withdrawals || []);
      setStats(statsRes.data.data);
      setWallets(walletsRes.data.data.wallets || []);
      const primary = walletsRes.data.data.wallets.find(w => w.is_primary);
      if (primary) setSelectedWallet(primary.id.toString());
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load withdrawal data';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load withdrawal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const withdrawAmount = parseFloat(amount);
      if (withdrawAmount < 10) {
        setFormError('Minimum withdrawal amount is $10 USDT');
        setSubmitting(false);
        return;
      }
      if (!selectedWallet) {
        setFormError('Please select a wallet address');
        setSubmitting(false);
        return;
      }
      const wallet = wallets.find(w => w.id === parseInt(selectedWallet));
      await memberAPI.createWithdrawal({
        amount: withdrawAmount,
        wallet_id: parseInt(selectedWallet),
        wallet_address: wallet.address,
        network: wallet.network,
        notes: notes || null
      });
      showSuccess('Withdrawal request submitted successfully');
      setAmount('');
      setNotes('');
      setSelectedWallet('');
      setShowRequestModal(false);
      setFeeInfo(null);
      await loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit withdrawal request';
      setFormError(errorMsg);
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    try {
      await memberAPI.cancelWithdrawal(withdrawalId);
      showSuccess('Withdrawal request cancelled');
      await loadData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to cancel withdrawal');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
      pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
      approved: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
      rejected: { icon: XCircle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
    };
    return statusMap[status] || { icon: Clock, color: 'text-text-muted', bg: 'bg-glass-medium', border: 'border-glass-border' };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={3} />
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Withdrawals</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadData} variant="primary" size="sm">
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20"
            >
              <TrendingDown className="w-8 h-8 text-green-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-display font-bold">Withdrawals</h1>
              <p className="text-lg text-text-muted">Manage your withdrawal requests</p>
            </div>
          </div>
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
          >
            Request Withdrawal
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive glow="green">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-sm text-text-dimmed">Total Withdrawn</p>
                </div>
                <p className="text-4xl font-display font-bold text-green-400 mb-1">
                  $<AnimatedNumber value={stats.total_withdrawn} decimals={2} />
                </p>
                <p className="text-sm text-text-dimmed">USDT</p>
              </div>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive glow="gold">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <p className="text-sm text-text-dimmed">Pending</p>
                </div>
                <p className="text-4xl font-display font-bold text-warning mb-1">
                  $<AnimatedNumber value={stats.pending_amount} decimals={2} />
                </p>
                <p className="text-sm text-text-dimmed">USDT</p>
              </div>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-text-muted" />
                  <p className="text-sm text-text-dimmed">Total Fees</p>
                </div>
                <p className="text-4xl font-display font-bold mb-1">
                  $<AnimatedNumber value={stats.total_fees} decimals={2} />
                </p>
                <p className="text-sm text-text-dimmed">USDT</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Withdrawal History */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass" padding="none">
          <div className="p-6 border-b border-glass-border">
            <h3 className="text-2xl font-display font-semibold">Withdrawal History</h3>
          </div>
          {withdrawals.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={TrendingDown}
                title="No Withdrawals Yet"
                description="You haven't made any withdrawal requests. Click the button above to request your first withdrawal."
                actionLabel="Request Withdrawal"
                onAction={() => setShowRequestModal(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Amount</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Net</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-dimmed">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-text-dimmed">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {withdrawals.map((w, index) => {
                    const statusInfo = getStatusInfo(w.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <motion.tr
                        key={w.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 text-text-muted">{formatDateTime(w.created_at)}</td>
                        <td className="px-6 py-4 text-right font-semibold">${formatCurrency(w.amount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-green-400">${formatCurrency(w.net_amount)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color} border ${statusInfo.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              {w.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {w.status === 'pending' && (
                            <Button
                              onClick={() => handleCancelWithdrawal(w.id)}
                              variant="danger"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          )}
                          {w.status === 'rejected' && w.rejected_reason && (
                            <span className="text-sm text-error">{w.rejected_reason}</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Withdrawal Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setAmount('');
          setNotes('');
          setFormError('');
          setFeeInfo(null);
        }}
        title="Request Withdrawal"
        size="lg"
      >
        <form onSubmit={handleSubmitWithdrawal} className="space-y-6">
          <AnimatePresence>
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-error/10 border border-error/30 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error">{formError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Input
            type="number"
            label="Amount (USDT)"
            placeholder="Minimum: $10 USDT"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            icon={<DollarSign className="w-5 h-5" />}
            required
            step="0.01"
            min="10"
            helperText="Minimum withdrawal: $10 USDT"
          />

          {feeInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2"
            >
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Fee Calculation</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount:</span>
                <span className="font-semibold">${amount} USDT</span>
              </div>
              <div className="flex justify-between text-sm text-text-dimmed">
                <span>Fee (2% + $1):</span>
                <span>-${feeInfo.fee} USDT</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-500/20 text-lg font-bold text-green-400">
                <span>You will receive:</span>
                <span>${feeInfo.netAmount} USDT</span>
              </div>
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Wallet</label>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              required
              className="w-full px-4 py-3 bg-glass-medium border border-glass-border rounded-xl focus:outline-none focus:border-gold-400 transition-colors"
            >
              <option value="">Select a wallet</option>
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.slice(-6)} ({wallet.network})
                </option>
              ))}
            </select>
            {wallets.length === 0 && (
              <p className="text-sm text-error mt-2">Please add a wallet address in your profile first</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows="3"
              className="w-full px-4 py-3 bg-glass-medium border border-glass-border rounded-xl focus:outline-none focus:border-gold-400 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting || wallets.length === 0}
              fullWidth
              variant="primary"
            >
              Submit Request
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowRequestModal(false);
                setAmount('');
                setNotes('');
                setFormError('');
                setFeeInfo(null);
              }}
              fullWidth
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default MemberWithdrawals;
