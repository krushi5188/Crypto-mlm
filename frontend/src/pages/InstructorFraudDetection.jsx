import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, AlertTriangle, Users, Activity, Eye, Flag,
  UserX, Globe, Smartphone, MapPin, Clock, Search, X
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

const InstructorFraudDetection = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [multiAccounts, setMultiAccounts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Flag/Unflag modals
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showUnflagModal, setShowUnflagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [unflagNotes, setUnflagNotes] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const [processing, setProcessing] = useState(false);

  // User details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, flaggedRes, multiRes, alertsRes] = await Promise.all([
        instructorAPI.getFraudDashboard(),
        instructorAPI.getFlaggedUsers(),
        instructorAPI.getMultiAccounts(),
        instructorAPI.getFraudAlerts({ limit: 50 })
      ]);

      setDashboard(dashboardRes.data.data);
      setFlaggedUsers(flaggedRes.data.data.flaggedUsers || []);
      setMultiAccounts(multiRes.data.data.groups || []);
      setAlerts(alertsRes.data.data.alerts || []);
    } catch (err) {
      console.error('Failed to load fraud detection data:', err);
      setError('Failed to load fraud detection data');
      showError('Failed to load fraud detection data');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagUser = (userId) => {
    setPendingUserId(userId);
    setFlagReason('');
    setShowFlagModal(true);
  };

  const confirmFlagUser = async () => {
    if (!flagReason.trim()) {
      showError('Please provide a reason for flagging');
      return;
    }

    setProcessing(true);
    try {
      await instructorAPI.flagUser(pendingUserId, flagReason);
      await loadData();
      showSuccess('User flagged successfully');
      setShowFlagModal(false);
      setPendingUserId(null);
      setFlagReason('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to flag user');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnflagUser = (userId) => {
    setPendingUserId(userId);
    setUnflagNotes('');
    setShowUnflagModal(true);
  };

  const confirmUnflagUser = async () => {
    setProcessing(true);
    try {
      await instructorAPI.unflagUser(pendingUserId, unflagNotes);
      await loadData();
      showSuccess('User unflagged successfully');
      setShowUnflagModal(false);
      setPendingUserId(null);
      setUnflagNotes('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to unflag user');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewUserDetails = async (userId) => {
    try {
      const response = await instructorAPI.getUserFraudDetails(userId);
      setSelectedUser(response.data.data);
      setShowDetailsModal(true);
    } catch (err) {
      showError('Failed to load user details');
    }
  };

  const getRiskConfig = (level) => {
    const configs = {
      critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertTriangle },
      high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle },
      medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: Activity },
      low: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: Shield }
    };
    return configs[level] || configs.low;
  };

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
          <EmptyState
            icon={AlertTriangle}
            title="Failed to Load Fraud Detection Data"
            description={error}
            actionLabel="Try Again"
            onAction={loadData}
          />
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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-purple-500/20"
          >
            <Shield className="w-8 h-8 text-red-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Fraud Detection</h1>
            <p className="text-lg text-text-muted">Monitor and manage suspicious activity</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      {dashboard && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="red">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Flagged Users</p>
                  <p className="text-5xl font-display font-bold text-red-400">
                    <AnimatedNumber value={dashboard.totalFlagged || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl bg-red-500/10"
                >
                  <Flag className="w-8 h-8 text-red-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="orange">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">High Risk</p>
                  <p className="text-5xl font-display font-bold text-orange-400">
                    <AnimatedNumber value={dashboard.highRiskCount || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="p-4 rounded-2xl bg-orange-500/10"
                >
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="yellow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Recent Alerts</p>
                  <p className="text-5xl font-display font-bold text-yellow-400">
                    <AnimatedNumber value={dashboard.recentAlertsCount || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-4 rounded-2xl bg-yellow-500/10"
                >
                  <Activity className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive glow="purple">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">Multi-Account Groups</p>
                  <p className="text-5xl font-display font-bold text-purple-400">
                    <AnimatedNumber value={dashboard.multiAccountGroups || 0} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="p-4 rounded-2xl bg-purple-500/10"
                >
                  <Users className="w-8 h-8 text-purple-400" />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="none">
          <div className="flex gap-3 overflow-x-auto pb-2 px-4 pt-4">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'flagged', label: `Flagged (${flaggedUsers.length})` },
              { value: 'multi', label: `Multi-Accounts (${multiAccounts.length})` },
              { value: 'alerts', label: `Alerts (${alerts.length})` }
            ].map((tab) => (
              <motion.button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.value ? 'text-gold-400' : 'text-text-dimmed hover:text-text-primary'
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <span>{tab.label}</span>
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="activeFraudTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* High Risk Users */}
            <Card variant="glass-strong" padding="xl">
              <h2 className="text-2xl font-semibold mb-6">High Risk Users</h2>
              {dashboard?.highRiskUsers?.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.highRiskUsers.map((user, index) => {
                    const riskConfig = getRiskConfig(user.riskLevel);
                    return (
                      <motion.div
                        key={user.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card variant="glass" padding="lg" interactive>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-lg">{user.email}</span>
                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${riskConfig.bg} ${riskConfig.color} border ${riskConfig.border}`}>
                                  Risk: {user.riskScore}/100
                                </span>
                                {user.isFlagged && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                    <Flag className="w-3 h-3" />
                                    Flagged
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-text-muted">
                                ID: {user.userId}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleViewUserDetails(user.userId)}
                                variant="ghost"
                                size="sm"
                                icon={<Eye className="w-4 h-4" />}
                              >
                                View
                              </Button>
                              {!user.isFlagged && (
                                <Button
                                  onClick={() => handleFlagUser(user.userId)}
                                  variant="danger"
                                  size="sm"
                                  icon={<Flag className="w-4 h-4" />}
                                >
                                  Flag
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Shield}
                  title="No High-Risk Users"
                  description="All users have acceptable risk scores"
                />
              )}
            </Card>

            {/* Recent Events */}
            <Card variant="glass-strong" padding="xl">
              <h2 className="text-2xl font-semibold mb-6">Recent Events</h2>
              {dashboard?.recentEvents?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentEvents.map((event, index) => (
                    <Card key={index} variant="glass-medium" padding="md">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <div className="font-semibold">{event.eventType}</div>
                          <div className="text-sm text-text-muted">
                            User #{event.userId} • {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="No Recent Events"
                  description="No suspicious activity detected"
                />
              )}
            </Card>
          </div>
        )}

        {/* Flagged Users Tab */}
        {activeTab === 'flagged' && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6">Flagged Users</h2>
            {flaggedUsers.length > 0 ? (
              <div className="space-y-4">
                {flaggedUsers.map((user, index) => {
                  const riskConfig = getRiskConfig(user.riskLevel);
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card variant="glass" padding="lg" interactive>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-lg">{user.email}</span>
                              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${riskConfig.bg} ${riskConfig.color} border ${riskConfig.border}`}>
                                Risk: {user.riskScore}/100
                              </span>
                            </div>
                            <div className="text-sm text-text-muted space-y-1">
                              <div className="flex items-center gap-2">
                                <Flag className="w-4 h-4 text-red-400" />
                                Reason: {user.flaggedReason}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Flagged: {new Date(user.flaggedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleViewUserDetails(user.id)}
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => handleUnflagUser(user.id)}
                              variant="success"
                              size="sm"
                              icon={<UserX className="w-4 h-4" />}
                            >
                              Unflag
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="No Flagged Users"
                description="All users are in good standing"
              />
            )}
          </Card>
        )}

        {/* Multi-Accounts Tab */}
        {activeTab === 'multi' && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6">Multi-Account Groups</h2>
            {multiAccounts.length > 0 ? (
              <div className="space-y-6">
                {multiAccounts.map((group, index) => (
                  <Card key={index} variant="glass" padding="lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          {group.type === 'ip' ? (
                            <>
                              <Globe className="w-5 h-5 text-blue-400" />
                              Shared IP Address
                            </>
                          ) : (
                            <>
                              <Smartphone className="w-5 h-5 text-purple-400" />
                              Shared Device
                            </>
                          )}
                        </h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          {group.userCount} accounts
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-text-dimmed">Identifier:</span>
                          <span className="ml-2 font-mono text-text-primary">{group.identifier}</span>
                        </div>
                        <div>
                          <span className="text-text-dimmed">First Seen:</span>
                          <span className="ml-2 text-text-primary">{new Date(group.firstSeen).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-text-dimmed">Users:</span>
                          <span className="ml-2 text-text-primary">{group.users.map(u => u.email).join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {group.users.map(user => (
                          <Button
                            key={user.id}
                            onClick={() => handleViewUserDetails(user.id)}
                            variant="outline"
                            size="sm"
                            icon={<Eye className="w-4 h-4" />}
                          >
                            {user.email}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="No Multi-Account Patterns"
                description="No suspicious account groupings detected"
              />
            )}
          </Card>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <Card variant="glass-strong" padding="xl">
            <h2 className="text-2xl font-semibold mb-6">Fraud Alerts</h2>
            {alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const riskConfig = getRiskConfig(alert.severity);
                  return (
                    <Card
                      key={alert.id}
                      variant="glass"
                      padding="lg"
                      className={`border-l-4 ${riskConfig.border}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-semibold text-lg">{alert.alertType}</div>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${riskConfig.bg} ${riskConfig.color} border ${riskConfig.border}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-text-muted mb-3">{alert.message}</p>
                      <div className="flex items-center justify-between text-sm text-text-dimmed">
                        <span>User #{alert.userId}</span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="No Alerts"
                description="No fraud alerts have been triggered"
              />
            )}
          </Card>
        )}
      </motion.div>

      {/* Flag User Modal */}
      <Modal
        isOpen={showFlagModal}
        onClose={() => {
          setShowFlagModal(false);
          setPendingUserId(null);
          setFlagReason('');
        }}
        title="Flag User"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-text-muted">
            Please provide a reason for flagging this user. This will help track suspicious activity patterns.
          </p>

          <Input
            type="textarea"
            label="Reason for Flagging"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Enter detailed reason..."
            rows={4}
            required
          />

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowFlagModal(false);
                setPendingUserId(null);
                setFlagReason('');
              }}
              variant="outline"
              fullWidth
              icon={<X className="w-5 h-5" />}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmFlagUser}
              variant="danger"
              fullWidth
              disabled={processing || !flagReason.trim()}
              icon={<Flag className="w-5 h-5" />}
            >
              {processing ? 'Flagging...' : 'Flag User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unflag User Modal */}
      <Modal
        isOpen={showUnflagModal}
        onClose={() => {
          setShowUnflagModal(false);
          setPendingUserId(null);
          setUnflagNotes('');
        }}
        title="Unflag User"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-text-muted">
            Remove the flag from this user. Optionally add review notes for future reference.
          </p>

          <Input
            type="textarea"
            label="Review Notes (Optional)"
            value={unflagNotes}
            onChange={(e) => setUnflagNotes(e.target.value)}
            placeholder="Enter review notes..."
            rows={4}
          />

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowUnflagModal(false);
                setPendingUserId(null);
                setUnflagNotes('');
              }}
              variant="outline"
              fullWidth
              icon={<X className="w-5 h-5" />}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnflagUser}
              variant="success"
              fullWidth
              disabled={processing}
              icon={<UserX className="w-5 h-5" />}
            >
              {processing ? 'Unflagging...' : 'Unflag User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          title="User Fraud Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* User Info */}
            <Card variant="glass-medium" padding="lg">
              <h3 className="text-lg font-semibold mb-4">User Information</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-text-dimmed">Email:</span> <span className="ml-2 font-semibold">{selectedUser.user?.email}</span></div>
                <div><span className="text-text-dimmed">Username:</span> <span className="ml-2 font-semibold">{selectedUser.user?.username}</span></div>
                <div>
                  <span className="text-text-dimmed">Risk Score:</span>
                  <span className="ml-2 font-semibold">
                    {selectedUser.riskScore}/100
                    <span className={`ml-2 text-xs ${getRiskConfig(selectedUser.riskLevel).color}`}>
                      ({selectedUser.riskLevel})
                    </span>
                  </span>
                </div>
                {selectedUser.user?.isFlagged && (
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-semibold">Flagged: {selectedUser.user.flaggedReason}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Evidence */}
            {selectedUser.evidence && selectedUser.evidence.length > 0 && (
              <Card variant="glass-medium" padding="lg">
                <h3 className="text-lg font-semibold mb-4">Risk Evidence</h3>
                <div className="space-y-2">
                  {selectedUser.evidence.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-text-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Devices */}
            {selectedUser.devices && selectedUser.devices.length > 0 && (
              <Card variant="glass-medium" padding="lg">
                <h3 className="text-lg font-semibold mb-4">Devices</h3>
                <div className="space-y-3">
                  {selectedUser.devices.map((device, index) => (
                    <Card key={index} variant="glass" padding="md">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                        <div className="flex-1 space-y-1 text-sm">
                          <div><span className="text-text-dimmed">Browser:</span> <span className="ml-2">{device.browser || 'Unknown'}</span></div>
                          <div><span className="text-text-dimmed">OS:</span> <span className="ml-2">{device.os || 'Unknown'}</span></div>
                          <div><span className="text-text-dimmed">Logins:</span> <span className="ml-2 font-semibold">{device.loginCount}</span></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* IP Addresses */}
            {selectedUser.ipAddresses && selectedUser.ipAddresses.length > 0 && (
              <Card variant="glass-medium" padding="lg">
                <h3 className="text-lg font-semibold mb-4">IP Addresses</h3>
                <div className="space-y-3">
                  {selectedUser.ipAddresses.map((ip, index) => (
                    <Card key={index} variant="glass" padding="md">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <div className="flex-1 space-y-1 text-sm">
                          <div><span className="text-text-dimmed">IP:</span> <span className="ml-2 font-mono">{ip.ipAddress}</span></div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span className="text-text-dimmed">Location:</span>
                            <span className="ml-1">{ip.location || 'Unknown'}</span>
                          </div>
                          <div><span className="text-text-dimmed">Logins:</span> <span className="ml-2 font-semibold">{ip.loginCount}</span></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {!selectedUser.user?.isFlagged ? (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleFlagUser(selectedUser.user.id);
                  }}
                  variant="danger"
                  fullWidth
                  icon={<Flag className="w-5 h-5" />}
                >
                  Flag User
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleUnflagUser(selectedUser.user.id);
                  }}
                  variant="success"
                  fullWidth
                  icon={<UserX className="w-5 h-5" />}
                >
                  Unflag User
                </Button>
              )}
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
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

export default InstructorFraudDetection;
