import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Copy, Trash2, AlertCircle, Plus, BarChart3, 
  Calendar, Activity, CheckCircle, Info, Eye, EyeOff, Shield
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

const MemberApiKeys = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    key_name: '',
    rate_limit_per_hour: 1000,
    expires_at: '',
    permissions: []
  });
  const [createdKey, setCreatedKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [keyStats, setKeyStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getApiKeys();
      setApiKeys(response.data.data.keys);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load API keys';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await memberAPI.createApiKey(newKeyData);
      setCreatedKey(response.data.data.apiKey);
      showSuccess('API key created successfully!');
      setShowCreateModal(false);
      setShowCreatedModal(true);
      setNewKeyData({
        key_name: '',
        rate_limit_per_hour: 1000,
        expires_at: '',
        permissions: []
      });
      await loadApiKeys();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create API key');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKey = async (keyId) => {
    try {
      await memberAPI.deleteApiKey(keyId);
      showSuccess('API key deleted successfully');
      await loadApiKeys();
      if (selectedKey?.id === keyId) {
        setSelectedKey(null);
        setShowStatsModal(false);
      }
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  const handleViewStats = async (key) => {
    setSelectedKey(key);
    setShowStatsModal(true);
    try {
      const response = await memberAPI.getApiKeyStats(key.id);
      setKeyStats(response.data.data.stats);
    } catch (err) {
      showError('Failed to load stats');
      console.error('Failed to load stats:', err);
    }
  };

  const copyToClipboard = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    showSuccess(message);
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const maskKey = (key) => {
    if (!key) return '';
    return `${key.substring(0, 8)}${'*'.repeat(24)}${key.substring(key.length - 8)}`;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <LoadingSkeleton variant="card" />
        <div className="space-y-4">
          <LoadingSkeleton variant="card" count={3} />
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load API Keys</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadApiKeys} variant="primary" size="sm">
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
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
          >
            <Key className="w-8 h-8 text-cyan-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">API Keys</h1>
            <p className="text-lg text-text-muted">Manage API keys for external integrations</p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
        >
          Create New API Key
        </Button>
      </motion.div>

      {/* Info Card */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="lg" glow="cyan">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold mb-3 text-cyan-400">API Key Security</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• API keys provide full access to your account - keep them secure</li>
                <li>• Never share your API secret or commit it to version control</li>
                <li>• The API secret is only shown once after creation</li>
                <li>• You can delete keys at any time to revoke access</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <EmptyState
            icon={Key}
            title="No API Keys"
            description="Create your first API key to enable programmatic access to your account."
            actionLabel="Create API Key"
            onAction={() => setShowCreateModal(true)}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {apiKeys.map((key, index) => (
            <motion.div key={key.id} variants={itemVariants}>
              <Card variant="glass-strong" padding="lg" interactive>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex-shrink-0 w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center"
                      >
                        <Key className="w-6 h-6 text-cyan-400" />
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{key.key_name}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            key.is_active 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <code className="text-sm text-text-muted font-mono">
                            {visibleKeys[key.id] ? key.api_key : maskKey(key.api_key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="p-1 hover:bg-glass-light rounded transition-colors"
                          >
                            {visibleKeys[key.id] ? (
                              <EyeOff className="w-4 h-4 text-text-dimmed" />
                            ) : (
                              <Eye className="w-4 h-4 text-text-dimmed" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.api_key, 'API key copied!')}
                            className="p-1 hover:bg-glass-light rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-text-dimmed" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-text-dimmed mb-1">Rate Limit</p>
                            <p className="font-medium">{key.rate_limit_per_hour}/hour</p>
                          </div>
                          <div>
                            <p className="text-text-dimmed mb-1">Last Used</p>
                            <p className="font-medium">{formatDate(key.last_used_at)}</p>
                          </div>
                          <div>
                            <p className="text-text-dimmed mb-1">Expires</p>
                            <p className="font-medium">{key.expires_at ? formatDate(key.expires_at) : 'Never'}</p>
                          </div>
                          <div>
                            <p className="text-text-dimmed mb-1">Created</p>
                            <p className="font-medium">{formatDate(key.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleViewStats(key)}
                        variant="outline"
                        size="sm"
                        icon={<BarChart3 className="w-4 h-4" />}
                      >
                        Stats
                      </Button>
                      <Button
                        onClick={() => handleDeleteKey(key.id)}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Key Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewKeyData({
            key_name: '',
            rate_limit_per_hour: 1000,
            expires_at: '',
            permissions: []
          });
        }}
        title="Create New API Key"
        size="md"
      >
        <form onSubmit={handleCreateKey} className="space-y-6">
          <Input
            type="text"
            label="Key Name"
            placeholder="My API Key"
            value={newKeyData.key_name}
            onChange={(e) => setNewKeyData(prev => ({ ...prev, key_name: e.target.value }))}
            required
            helperText="A descriptive name for this API key"
          />

          <Input
            type="number"
            label="Rate Limit (requests/hour)"
            value={newKeyData.rate_limit_per_hour}
            onChange={(e) => setNewKeyData(prev => ({ ...prev, rate_limit_per_hour: parseInt(e.target.value) }))}
            min="100"
            max="10000"
            helperText="Maximum requests per hour (100-10,000)"
          />

          <Input
            type="datetime-local"
            label="Expiration Date (Optional)"
            value={newKeyData.expires_at}
            onChange={(e) => setNewKeyData(prev => ({ ...prev, expires_at: e.target.value }))}
            helperText="Leave empty for no expiration"
          />

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              fullWidth
              variant="primary"
              icon={<CheckCircle className="w-5 h-5" />}
            >
              Create API Key
            </Button>
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              fullWidth
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Created Key Success Modal */}
      {createdKey && (
        <Modal
          isOpen={showCreatedModal}
          onClose={() => {
            setShowCreatedModal(false);
            setCreatedKey(null);
          }}
          title="API Key Created!"
          size="lg"
        >
          <div className="space-y-6">
            <Card variant="glass-strong" padding="lg" glow="gold">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-gold-400" />
                <h4 className="font-semibold text-gold-400">Save Your Credentials</h4>
              </div>
              <p className="text-sm text-text-dimmed">
                Make sure to copy your API secret now. You won't be able to see it again!
              </p>
            </Card>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Button
                    onClick={() => copyToClipboard(createdKey.api_key, 'API key copied!')}
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Copy
                  </Button>
                </div>
                <Card variant="glass-medium" padding="md">
                  <code className="text-sm text-text-primary font-mono break-all">
                    {createdKey.api_key}
                  </code>
                </Card>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-error">API Secret (Save Now!)</label>
                  <Button
                    onClick={() => copyToClipboard(createdKey.api_secret, 'API secret copied!')}
                    variant="ghost"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                  >
                    Copy
                  </Button>
                </div>
                <Card variant="glass-medium" padding="md" className="border-error/30">
                  <code className="text-sm text-error font-mono break-all">
                    {createdKey.api_secret}
                  </code>
                </Card>
              </div>
            </div>

            <Button
              onClick={() => {
                setShowCreatedModal(false);
                setCreatedKey(null);
              }}
              variant="primary"
              fullWidth
              icon={<CheckCircle className="w-5 h-5" />}
            >
              I've Saved the Secret
            </Button>
          </div>
        </Modal>
      )}

      {/* Stats Modal */}
      {selectedKey && (
        <Modal
          isOpen={showStatsModal}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedKey(null);
            setKeyStats(null);
          }}
          title={`${selectedKey.key_name} - Statistics`}
          size="lg"
        >
          {keyStats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card variant="glass-strong" padding="xl" glow="blue">
                  <div className="text-center">
                    <p className="text-sm text-text-dimmed mb-2">Total Requests</p>
                    <p className="text-5xl font-display font-bold text-blue-400">
                      <AnimatedNumber value={keyStats.total_requests || 0} />
                    </p>
                  </div>
                </Card>

                <Card variant="glass-strong" padding="xl" glow="green">
                  <div className="text-center">
                    <p className="text-sm text-text-dimmed mb-2">Successful</p>
                    <p className="text-5xl font-display font-bold text-green-400">
                      <AnimatedNumber value={keyStats.successful_requests || 0} />
                    </p>
                  </div>
                </Card>

                <Card variant="glass-strong" padding="xl" glow="red">
                  <div className="text-center">
                    <p className="text-sm text-text-dimmed mb-2">Failed</p>
                    <p className="text-5xl font-display font-bold text-red-400">
                      <AnimatedNumber value={keyStats.failed_requests || 0} />
                    </p>
                  </div>
                </Card>

                <Card variant="glass-strong" padding="xl" glow="purple">
                  <div className="text-center">
                    <p className="text-sm text-text-dimmed mb-2">Avg Response</p>
                    <p className="text-5xl font-display font-bold text-purple-400">
                      <AnimatedNumber value={parseFloat(keyStats.avg_response_time || 0).toFixed(0)} />
                      <span className="text-2xl">ms</span>
                    </p>
                  </div>
                </Card>
              </div>

              <Button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedKey(null);
                  setKeyStats(null);
                }}
                variant="outline"
                fullWidth
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-text-dimmed mx-auto mb-4 animate-pulse" />
              <p className="text-text-muted">Loading statistics...</p>
            </div>
          )}
        </Modal>
      )}
    </motion.div>
  );
};

export default MemberApiKeys;
