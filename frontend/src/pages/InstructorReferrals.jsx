import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Link2, Copy, Check, TrendingUp, Wallet, 
  Calendar, Mail, AlertCircle, Share2, Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { instructorAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
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

const InstructorReferrals = () => {
  const { user } = useAuth();
  const { success: showSuccess } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [myReferrals, setMyReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMyReferrals();
  }, []);

  const loadMyReferrals = async () => {
    try {
      setLoading(true);
      const response = await instructorAPI.getParticipants({ limit: 1000 });
      const allParticipants = response.data.data.participants;

      const instructorReferrals = allParticipants.filter(
        p => p.referredBy === user?.id
      );

      setMyReferrals(instructorReferrals);
      setError(null);
    } catch (err) {
      console.error('Failed to load referrals:', err);
      setError('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/register?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedLink(true);
      showSuccess('Invite link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode).then(() => {
        setCopiedCode(true);
        showSuccess('Referral code copied to clipboard!');
        setTimeout(() => setCopiedCode(false), 2000);
      });
    }
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
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  const inviteUrl = user?.referralCode ? `${window.location.origin}/register?ref=${user.referralCode}` : '';

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
            className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20"
          >
            <Users className="w-8 h-8 text-green-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">My Referrals</h1>
            <p className="text-lg text-text-muted">Track your referral network and share your invite link</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="green">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Direct Referrals</p>
                <p className="text-5xl font-display font-bold text-green-400">
                  <AnimatedNumber value={user?.directRecruits || 0} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-green-500/10"
              >
                <Users className="w-8 h-8 text-green-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Total Network</p>
                <p className="text-5xl font-display font-bold text-blue-400">
                  <AnimatedNumber value={user?.networkSize || 0} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="p-4 rounded-2xl bg-blue-500/10"
              >
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Total Earned</p>
                <p className="text-3xl font-display font-bold text-gold-400">
                  <AnimatedNumber value={user?.totalEarned || 0} decimals={2} />
                  <span className="text-xl ml-1">USDT</span>
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-gold-400/10"
              >
                <Wallet className="w-8 h-8 text-gold-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Referral Information */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl" glow="gold">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-gold-400" />
              <h2 className="text-2xl font-semibold">Your Referral Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referral Code */}
              <div>
                <label className="block text-sm font-medium mb-3 text-text-dimmed">
                  Your Referral Code
                </label>
                <Card variant="glass-medium" padding="none">
                  <div className="flex items-center">
                    <div className="flex-1 px-6 py-4 font-mono text-2xl font-bold text-gold-400 tracking-wider text-center">
                      {user?.referralCode || 'Loading...'}
                    </div>
                    <motion.button
                      onClick={copyReferralCode}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-4 border-l border-glass-border transition-colors ${
                        copiedCode 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gold-400/10 text-gold-400 hover:bg-gold-400/20'
                      }`}
                    >
                      {copiedCode ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </Card>
              </div>

              {/* Invite Link */}
              <div>
                <label className="block text-sm font-medium mb-3 text-text-dimmed">
                  Invite Link
                </label>
                <Card variant="glass-medium" padding="none">
                  <div className="flex items-center">
                    <div className="flex-1 px-4 py-4 text-sm text-green-400 truncate">
                      {inviteUrl || 'Loading...'}
                    </div>
                    <motion.button
                      onClick={copyInviteLink}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-4 border-l border-glass-border transition-colors ${
                        copiedLink 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {copiedLink ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Link2 className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </Card>
              </div>
            </div>

            <Card variant="glass-medium" padding="lg" glow="blue">
              <div className="flex items-start gap-3">
                <Share2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-text-muted leading-relaxed">
                  Share this link with potential members to grow your network. All participants you create manually are automatically added under your referral.
                </p>
              </div>
            </Card>
          </div>
        </Card>
      </motion.div>

      {/* My Direct Referrals */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">My Direct Referrals</h2>
              <p className="text-sm text-text-muted mt-1">
                Participants directly referred by you ({myReferrals.length})
              </p>
            </div>
          </div>

          {myReferrals.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Direct Referrals Yet"
              description="Share your invite link to start building your network"
              actionLabel="Copy Invite Link"
              onAction={copyInviteLink}
            />
          ) : (
            <Card variant="glass" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Username</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Email</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Balance</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text-dimmed">Network</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {myReferrals.map((referral, index) => (
                      <motion.tr
                        key={referral.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center font-bold text-white">
                              {referral.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold">{referral.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-text-muted">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{referral.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gold-400">
                          {formatCurrency(referral.balance)} USDT
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm">
                            <div className="text-green-400 font-semibold">{referral.directRecruits} direct</div>
                            <div className="text-text-dimmed">{referral.networkSize} total</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-text-muted text-sm">
                            <Calendar className="w-4 h-4" />
                            {formatDate(referral.joinedAt)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Card>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="glass" padding="lg">
            <div className="flex items-start gap-3 text-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Error Loading Referrals</p>
                <p className="text-sm text-text-muted">{error}</p>
                <Button onClick={loadMyReferrals} variant="outline" size="sm" className="mt-3">
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InstructorReferrals;
