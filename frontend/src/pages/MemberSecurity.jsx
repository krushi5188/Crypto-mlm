import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Lock, Unlock, CheckCircle, XCircle, AlertTriangle,
  LogIn, Monitor, MapPin, Clock, Key, AlertCircle
} from 'lucide-react';
import { gamificationAPI, authAPI } from '../services/api';
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
import { formatTimeAgo } from '../utils/formatters';

const MemberSecurity = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes, eventsRes, twoFARes] = await Promise.all([
        gamificationAPI.getSecuritySummary().catch(() => null),
        gamificationAPI.getLoginHistory({ limit: 20 }).catch(() => ({ data: { data: { history: [] } } })),
        gamificationAPI.getSecurityEvents({ limit: 20 }).catch(() => ({ data: { data: { events: [] } } })),
        authAPI.get2FAStatus().catch(() => null)
      ]);

      if (summaryRes) setSummary(summaryRes.data.data);
      setLoginHistory(historyRes.data.data.history);
      setSecurityEvents(eventsRes.data.data.events);
      if (twoFARes) setTwoFAStatus(twoFARes.data.data);

      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load security data';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEvent = async (eventId) => {
    try {
      await gamificationAPI.resolveSecurityEvent(eventId);
      setSecurityEvents(securityEvents.map(e =>
        e.id === eventId ? { ...e, isResolved: true, resolvedAt: new Date().toISOString() } : e
      ));
      showSuccess('Security event marked as resolved');
    } catch (error) {
      showError('Failed to resolve event');
      console.error('Failed to resolve event:', error);
    }
  };

  const getSeverityInfo = (severity) => {
    const severityMap = {
      low: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle },
      medium: { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: AlertTriangle },
      high: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30', icon: AlertTriangle },
      critical: { color: 'text-error', bg: 'bg-error/10', border: 'border-error/30', icon: XCircle },
    };
    return severityMap[severity] || { color: 'text-text-muted', bg: 'bg-glass-medium', border: 'border-glass-border', icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Security Data</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadSecurityData} variant="primary" size="sm">
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
            className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-purple-500/20"
          >
            <Shield className="w-8 h-8 text-red-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Security</h1>
            <p className="text-lg text-text-muted">Monitor your account security and activity</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="flex gap-2 border-b border-glass-border overflow-x-auto"
      >
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'history', label: 'Login History', icon: LogIn },
          { id: 'events', label: 'Security Events', icon: AlertTriangle },
          { id: '2fa', label: '2FA', icon: Key }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-gold-400'
                : 'text-text-dimmed hover:text-text-primary'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-400"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && summary && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-display font-semibold mb-6">Security Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card variant="glass-strong" padding="lg" interactive>
                  <div className="text-center">
                    <LogIn className="w-8 h-8 mx-auto mb-3 text-blue-400" />
                    <p className="text-4xl font-display font-bold mb-1">
                      <AnimatedNumber value={summary.logins.total} />
                    </p>
                    <p className="text-sm text-text-dimmed">Total Logins</p>
                    <p className="text-xs text-text-dimmed mt-1">Last 30 days</p>
                  </div>
                </Card>
                <Card variant="glass-strong" padding="lg" interactive glow="green">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-3 text-success" />
                    <p className="text-4xl font-display font-bold text-success mb-1">
                      <AnimatedNumber value={summary.logins.successful} />
                    </p>
                    <p className="text-sm text-text-dimmed">Successful</p>
                  </div>
                </Card>
                <Card variant="glass-strong" padding="lg" interactive>
                  <div className="text-center">
                    <XCircle className="w-8 h-8 mx-auto mb-3 text-error" />
                    <p className="text-4xl font-display font-bold text-error mb-1">
                      <AnimatedNumber value={summary.logins.failed} />
                    </p>
                    <p className="text-sm text-text-dimmed">Failed</p>
                  </div>
                </Card>
                <Card variant="glass-strong" padding="lg" interactive>
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                    <p className="text-4xl font-display font-bold mb-1">
                      <AnimatedNumber value={summary.logins.uniqueIPs} />
                    </p>
                    <p className="text-sm text-text-dimmed">Unique IPs</p>
                  </div>
                </Card>
              </div>
            </div>

            <Card variant="glass-strong" padding="xl">
              <h3 className="text-2xl font-display font-semibold mb-6">Security Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-4xl font-display font-bold mb-2">
                    <AnimatedNumber value={summary.securityEvents.total} />
                  </p>
                  <p className="text-sm text-text-dimmed">Total Events</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-display font-bold text-warning mb-2">
                    <AnimatedNumber value={summary.securityEvents.unresolved} />
                  </p>
                  <p className="text-sm text-text-dimmed">Unresolved</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-display font-bold text-error mb-2">
                    <AnimatedNumber value={summary.securityEvents.highSeverity} />
                  </p>
                  <p className="text-sm text-text-dimmed">High Severity</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-semibold">Login History</h2>
            {loginHistory.length === 0 ? (
              <EmptyState
                icon={LogIn}
                title="No Login History"
                description="Your login history will appear here."
              />
            ) : (
              <Card variant="glass" padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-glass-border">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">IP Address</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Device</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-dimmed">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border">
                      {loginHistory.map((login, index) => (
                        <motion.tr
                          key={login.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                          className="transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                              login.success
                                ? 'bg-success/10 text-success border border-success/30'
                                : 'bg-error/10 text-error border border-error/30'
                            }`}>
                              {login.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {login.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-text-muted">{formatTimeAgo(login.createdAt)}</td>
                          <td className="px-6 py-4 font-mono text-sm">{login.ipAddress}</td>
                          <td className="px-6 py-4 text-sm">
                            {login.deviceInfo?.os?.name || 'Unknown'} - {login.deviceInfo?.browser?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-sm capitalize">{login.loginMethod}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-semibold">Security Events</h2>
            {securityEvents.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No Security Events"
                description="No security events have been recorded for your account."
              />
            ) : (
              <div className="space-y-4">
                {securityEvents.map((event, index) => {
                  const severityInfo = getSeverityInfo(event.severity);
                  const SeverityIcon = severityInfo.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card variant="glass-strong" padding="lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-xl ${severityInfo.bg}`}>
                              <SeverityIcon className={`w-6 h-6 ${severityInfo.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${severityInfo.bg} ${severityInfo.color} border ${severityInfo.border}`}>
                                  {event.severity.toUpperCase()}
                                </span>
                                {event.isResolved && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30">
                                    <CheckCircle className="w-3 h-3" />
                                    Resolved
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold mb-2">{event.description}</h3>
                              <p className="text-sm text-text-dimmed">{formatTimeAgo(event.createdAt)}</p>
                            </div>
                          </div>
                          {!event.isResolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveEvent(event.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === '2fa' && (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-semibold">Two-Factor Authentication</h2>
            <Card variant="glass-strong" padding="xl">
              {twoFAStatus?.enabled ? (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-success/10"
                  >
                    <Lock className="w-12 h-12 text-success" />
                  </motion.div>
                  <h3 className="text-3xl font-display font-bold mb-3">2FA is Enabled</h3>
                  <p className="text-text-muted mb-8 max-w-md mx-auto">
                    Your account is protected with two-factor authentication
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
                    <Card variant="glass-medium" padding="lg">
                      <p className="text-sm text-text-dimmed mb-2">Enabled</p>
                      <p className="text-lg font-semibold">{formatTimeAgo(twoFAStatus.enabledAt)}</p>
                    </Card>
                    <Card variant="glass-medium" padding="lg">
                      <p className="text-sm text-text-dimmed mb-2">Backup Codes Left</p>
                      <p className="text-lg font-semibold">{twoFAStatus.backupCodesRemaining}</p>
                    </Card>
                  </div>
                  <Button variant="danger" size="lg">Disable 2FA</Button>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-full bg-warning/10"
                  >
                    <Unlock className="w-12 h-12 text-warning" />
                  </motion.div>
                  <h3 className="text-3xl font-display font-bold mb-3">2FA is Disabled</h3>
                  <p className="text-text-muted mb-8 max-w-md mx-auto">
                    Enable two-factor authentication for enhanced security
                  </p>
                  <Button variant="primary" size="lg" icon={<Lock className="w-5 h-5" />}>
                    Enable 2FA
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MemberSecurity;
