import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, DollarSign, TrendingUp, Link2, Copy, 
  Users, Network, CheckCircle, AlertCircle, Clock, Award
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp,
  scaleIn 
} from '../utils/animations';
import { formatCurrency } from '../utils/formatters';

const MemberProfile = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getProfile();
      setProfile(response.data.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load profile';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showSuccess('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(profile.referralCode);
    showSuccess('Referral code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Profile</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadProfile} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const approvalStatus = user?.approvalStatus || 'approved';
  const isApproved = approvalStatus === 'approved';

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="p-6 space-y-8 max-w-6xl mx-auto"
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
            className="p-3 rounded-2xl bg-gradient-to-br from-gold-400/20 to-purple-500/20"
          >
            <User className="w-8 h-8 text-gold-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">My Profile</h1>
            <p className="text-lg text-text-muted">Account information and referral details</p>
          </div>
        </div>
      </motion.div>

      {/* Pending Approval Banner */}
      {!isApproved && (
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass-strong" padding="xl">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="p-3 rounded-xl bg-warning/10"
              >
                <Clock className="w-8 h-8 text-warning" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-semibold mb-2 text-warning">
                  Account Pending Approval
                </h3>
                <p className="text-text-muted">
                  Your registration is pending instructor approval. You'll be able to access full features and your referral link once approved.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Profile Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Account Information */}
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gold-400/10">
                <User className="w-6 h-6 text-gold-400" />
              </div>
              <h3 className="text-2xl font-display font-semibold">Account Information</h3>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-text-dimmed mb-2">
                  <User className="w-4 h-4" />
                  <span>Username</span>
                </div>
                <div className="text-xl font-semibold text-text-primary">
                  {profile?.username}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-text-dimmed mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
                <div className="text-lg text-text-primary">
                  {profile?.email}
                </div>
              </div>

              <div className="pt-4 border-t border-glass-border">
                <div className="flex items-center gap-2 text-sm text-text-dimmed mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Current Balance</span>
                </div>
                <div className="text-3xl font-display font-bold text-gold-400">
                  $<AnimatedNumber value={profile?.balance || 0} decimals={2} />
                </div>
                <div className="text-sm text-text-dimmed">USDT</div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-text-dimmed mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total Earned</span>
                </div>
                <div className="text-3xl font-display font-bold text-green-400">
                  $<AnimatedNumber value={profile?.totalEarned || 0} decimals={2} />
                </div>
                <div className="text-sm text-text-dimmed">USDT</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Network Stats */}
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" className="h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500/10">
                <Network className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-display font-semibold">Network Overview</h3>
            </div>

            <div className="space-y-6">
              <Card variant="glass-medium" padding="lg">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="p-4 rounded-xl bg-gold-400/10"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Users className="w-8 h-8 text-gold-400" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-text-dimmed mb-1">Direct Recruits</p>
                    <p className="text-4xl font-display font-bold">
                      <AnimatedNumber value={profile?.directRecruits || 0} />
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="glass-medium" padding="lg">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="p-4 rounded-xl bg-green-500/10"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Network className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-text-dimmed mb-1">Total Network Size</p>
                    <p className="text-4xl font-display font-bold">
                      <AnimatedNumber value={profile?.networkSize || 0} />
                    </p>
                  </div>
                </div>
              </Card>

              <Card variant="glass-medium" padding="lg">
                <div className="flex items-center gap-4">
                  <motion.div
                    className="p-4 rounded-xl bg-purple-500/10"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Award className="w-8 h-8 text-purple-400" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm text-text-dimmed mb-1">Rank Level</p>
                    <p className="text-2xl font-display font-bold">
                      {profile?.rank || 'Member'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Referral Section */}
      {isApproved && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass-strong" padding="xl" glow="gold">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-gold-400/20 to-green-500/20"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Link2 className="w-8 h-8 text-gold-400" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-display font-semibold">Your Referral Link</h3>
                <p className="text-sm text-text-muted">Share this link to earn commissions</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Referral Code */}
              <div>
                <label className="block text-sm text-text-dimmed mb-3">Your Referral Code</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-6 py-4 bg-glass-medium border border-gold-400/30 rounded-xl text-center">
                    <span className="text-3xl font-display font-bold text-gold-400 tracking-wider">
                      {profile?.referralCode}
                    </span>
                  </div>
                  <Button
                    onClick={copyReferralCode}
                    variant="outline"
                    icon={<Copy className="w-5 h-5" />}
                    size="lg"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm text-text-dimmed mb-3">Complete Referral Link</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-glass-medium border border-glass-border rounded-xl font-mono text-sm text-text-muted truncate">
                    {window.location.origin}/register?ref={profile?.referralCode}
                  </div>
                  <Button
                    onClick={copyReferralLink}
                    variant={copied ? 'success' : 'primary'}
                    icon={copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    success={copied}
                    size="lg"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-glass-border">
                <p className="text-sm text-text-dimmed text-center">
                  Share your referral link with others to invite them to the network. When they register and participate, you'll earn commissions based on their activity.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Pending Approval Referral Message */}
      {!isApproved && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass" padding="xl">
            <div className="text-center py-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block p-6 rounded-full bg-glass-medium mb-4"
              >
                <Lock className="w-12 h-12 text-text-dimmed" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Referral Link Locked</h3>
              <p className="text-text-muted max-w-md mx-auto">
                Your referral link will be available after your account is approved by the instructor. Please check back soon!
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MemberProfile;
