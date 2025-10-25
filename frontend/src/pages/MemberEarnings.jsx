import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Users, TrendingUp, ChevronDown, ChevronUp, 
  Filter, X, Calendar, Award, AlertCircle, Search
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp,
  scaleIn 
} from '../utils/animations';
import { formatCurrency, formatDateTime, redactEmail } from '../utils/formatters';

const MemberEarnings = () => {
  const { error: showError } = useToast();
  const [earnings, setEarnings] = useState([]);
  const [invites, setInvites] = useState([]);
  const [expandedInvite, setExpandedInvite] = useState(null);
  const [inviteTransactions, setInviteTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [error, setError] = useState(null);
  
  // Search/Filter states
  const [searchEmail, setSearchEmail] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const [earningsResponse, invitesResponse] = await Promise.all([
        memberAPI.getEarnings(),
        memberAPI.getDirectInvites()
      ]);

      const earningsData = earningsResponse.data.data.transactions || [];
      setEarnings(earningsData);

      const invitesData = invitesResponse.data.data.invites || [];
      setInvites(invitesData);

      const total = earningsData.reduce((sum, e) => sum + e.amount, 0);
      setTotalEarned(total);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load earnings';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInviteTransactions = async (inviteUserId) => {
    if (inviteTransactions[inviteUserId]) {
      return;
    }

    try {
      const response = await memberAPI.getInviteTransactions(inviteUserId);
      setInviteTransactions(prev => ({
        ...prev,
        [inviteUserId]: response.data.data.transactions || []
      }));
    } catch (error) {
      console.error('Failed to load invite transactions:', error);
      showError('Failed to load transaction details');
    }
  };

  const toggleExpand = async (inviteUserId) => {
    if (expandedInvite === inviteUserId) {
      setExpandedInvite(null);
    } else {
      setExpandedInvite(inviteUserId);
      await loadInviteTransactions(inviteUserId);
    }
  };

  const filteredInvites = useMemo(() => {
    return invites.filter(invite => {
      if (searchEmail && !invite.email.toLowerCase().includes(searchEmail.toLowerCase())) {
        return false;
      }
      
      if (minAmount && invite.totalEarned < parseFloat(minAmount)) {
        return false;
      }
      
      if (maxAmount && invite.totalEarned > parseFloat(maxAmount)) {
        return false;
      }
      
      return true;
    });
  }, [invites, searchEmail, minAmount, maxAmount]);

  const clearFilters = () => {
    setSearchEmail('');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = searchEmail || minAmount || maxAmount;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <LoadingSkeleton variant="card" />
        <Card variant="glass" padding="xl">
          <LoadingSkeleton variant="text" count={8} />
        </Card>
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Earnings</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadEarnings} variant="primary" size="sm">
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
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-gold-400/20"
          >
            <TrendingUp className="w-8 h-8 text-green-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">My Earnings</h1>
            <p className="text-lg text-text-muted">Commission history from your network</p>
          </div>
        </div>
      </motion.div>

      {/* Total Earned Card */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl" glow="green">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-5 h-5 text-green-400" />
              <p className="text-sm text-text-dimmed uppercase tracking-wider font-semibold">
                Total Earned
              </p>
            </div>
            <div className="text-6xl font-display font-bold text-green-400 mb-2">
              $<AnimatedNumber value={totalEarned} decimals={2} />
            </div>
            <p className="text-lg text-text-muted">USDT</p>
          </div>
        </Card>
      </motion.div>

      {/* People You Invited */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <Card variant="glass" padding="none">
          {/* Header with Filter Toggle */}
          <div className="p-6 border-b border-glass-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-display font-semibold mb-1">People You Invited</h3>
                <p className="text-sm text-text-dimmed">
                  {filteredInvites.length} {filteredInvites.length === 1 ? 'invite' : 'invites'}
                  {hasActiveFilters && invites.length !== filteredInvites.length && 
                    ` (filtered from ${invites.length})`}
                </p>
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? 'primary' : 'outline'}
                icon={<Filter className="w-4 h-4" />}
                size="sm"
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-6 p-4 bg-glass-medium border border-glass-border rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        type="text"
                        label="Search Email"
                        placeholder="Filter by email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        icon={<Search className="w-5 h-5" />}
                        clearable
                      />
                      <Input
                        type="number"
                        label="Min Amount (USDT)"
                        placeholder="0"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        icon={<DollarSign className="w-5 h-5" />}
                        clearable
                      />
                      <Input
                        type="number"
                        label="Max Amount (USDT)"
                        placeholder="Unlimited"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        icon={<DollarSign className="w-5 h-5" />}
                        clearable
                      />
                    </div>
                    {hasActiveFilters && (
                      <div className="flex justify-end">
                        <Button
                          onClick={clearFilters}
                          variant="ghost"
                          size="sm"
                          icon={<X className="w-4 h-4" />}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Invites List */}
          <div className="divide-y divide-glass-border">
            {filteredInvites.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={Users}
                  title={invites.length === 0 ? "No Direct Invites Yet" : "No Matching Invites"}
                  description={
                    invites.length === 0
                      ? "Share your referral link to start earning commissions from direct invites!"
                      : "No invites match your current filters. Try adjusting your search criteria."
                  }
                  actionLabel={invites.length === 0 ? "View Dashboard" : "Clear Filters"}
                  onAction={invites.length === 0 ? () => window.location.href = '/dashboard' : clearFilters}
                />
              </div>
            ) : (
              filteredInvites.map((invite, index) => (
                <motion.div
                  key={invite.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Main Invite Row */}
                  <div
                    className="p-6 hover:bg-glass-light transition-colors cursor-pointer"
                    onClick={() => toggleExpand(invite.userId)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <motion.div
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-green-500 flex items-center justify-center text-black text-xl font-bold flex-shrink-0"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          {invite.email.charAt(0).toUpperCase()}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-text-primary truncate">
                            {redactEmail(invite.email)}
                          </p>
                          <p className="text-sm text-text-dimmed">
                            {invite.transactionCount} {invite.transactionCount === 1 ? 'transaction' : 'transactions'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-display font-bold text-green-400">
                            $<AnimatedNumber value={invite.totalEarned} decimals={2} />
                          </p>
                          <p className="text-xs text-text-dimmed">USDT</p>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedInvite === invite.userId ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-5 h-5 text-text-dimmed" />
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Transactions */}
                  <AnimatePresence>
                    {expandedInvite === invite.userId && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden bg-glass-medium"
                      >
                        {!inviteTransactions[invite.userId] ? (
                          <div className="p-8 text-center">
                            <LoadingSkeleton variant="text" count={3} />
                          </div>
                        ) : inviteTransactions[invite.userId].length === 0 ? (
                          <div className="p-8 text-center text-text-dimmed">
                            No transactions yet
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-glass-border">
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-dimmed uppercase">
                                    Date
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-dimmed uppercase">
                                    Type
                                  </th>
                                  <th className="px-6 py-3 text-right text-xs font-semibold text-text-dimmed uppercase">
                                    Amount
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-dimmed uppercase">
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-glass-border/50">
                                {inviteTransactions[invite.userId].map((transaction, idx) => (
                                  <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-glass-light/50 transition-colors"
                                  >
                                    <td className="px-6 py-3 text-sm text-text-dimmed">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {formatDateTime(transaction.createdAt)}
                                      </div>
                                    </td>
                                    <td className="px-6 py-3">
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30">
                                        {transaction.type === 'referral_bonus' ? 'REFERRAL' : transaction.type.toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                      <span className="text-lg font-semibold text-green-400">
                                        +$<AnimatedNumber value={transaction.amount} decimals={2} />
                                      </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-text-muted">
                                      {transaction.description || '-'}
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MemberEarnings;
