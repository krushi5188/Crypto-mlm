import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Plus, Star, Trash2, CheckCircle, AlertCircle,
  Info, Copy, ExternalLink
} from 'lucide-react';
import { memberAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';

const MemberWallets = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    wallet_address: '',
    wallet_type: 'manual',
    network: 'TRC20',
    label: ''
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [metaMaskAvailable, setMetaMaskAvailable] = useState(false);

  useEffect(() => {
    loadWallets();
    checkMetaMask();
  }, []);

  const checkMetaMask = () => {
    setMetaMaskAvailable(typeof window.ethereum !== 'undefined');
  };

  const loadWallets = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getWallets();
      setWallets(response.data.data.wallets || []);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load wallets';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectMetaMask = async () => {
    if (!metaMaskAvailable) {
      showError('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      setFormData({
        wallet_address: address,
        wallet_type: 'metamask',
        network: 'ERC20',
        label: 'MetaMask Wallet'
      });
      setShowModal(true);
      showSuccess('MetaMask connected successfully');
    } catch (err) {
      console.error('MetaMask connection error:', err);
      showError('Failed to connect MetaMask');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      await memberAPI.addWallet(formData);
      showSuccess('Wallet added successfully');
      setShowModal(false);
      setFormData({ wallet_address: '', wallet_type: 'manual', network: 'TRC20', label: '' });
      await loadWallets();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add wallet';
      setFormError(errorMsg);
      showError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await memberAPI.setPrimaryWallet(id);
      showSuccess('Primary wallet updated');
      await loadWallets();
    } catch (err) {
      showError('Failed to set primary wallet');
    }
  };

  const handleDelete = async (id) => {
    try {
      await memberAPI.deleteWallet(id);
      showSuccess('Wallet deleted successfully');
      await loadWallets();
    } catch (err) {
      showError('Failed to delete wallet');
    }
  };

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    showSuccess('Address copied to clipboard');
  };

  const getNetworkInfo = (network) => {
    const networkMap = {
      TRC20: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'TRC20' },
      ERC20: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'ERC20' },
      BEP20: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'BEP20' }
    };
    return networkMap[network] || networkMap.TRC20;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="flex gap-3">
          <LoadingSkeleton variant="button" width="200px" />
          <LoadingSkeleton variant="button" width="200px" />
        </div>
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Wallets</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadWallets} variant="primary" size="sm">
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
          >
            <Wallet className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">My Wallets</h1>
            <p className="text-lg text-text-muted">Manage your cryptocurrency wallet addresses</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          {metaMaskAvailable && (
            <Button
              onClick={connectMetaMask}
              variant="primary"
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              <span className="text-xl mr-2">🦊</span>
              Connect MetaMask
            </Button>
          )}
          <Button
            onClick={() => {
              setFormData({ wallet_address: '', wallet_type: 'manual', network: 'TRC20', label: '' });
              setShowModal(true);
            }}
            variant="outline"
            icon={<Plus className="w-5 h-5" />}
          >
            Add Manual Address
          </Button>
        </div>
      </motion.div>

      {/* Wallet List */}
      {wallets.length === 0 ? (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <EmptyState
            icon={Wallet}
            title="No Wallets Added"
            description="Add your first wallet address to enable withdrawals and receive payments."
            actionLabel="Add Wallet"
            onAction={() => setShowModal(true)}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {wallets.map((wallet, index) => {
            const networkInfo = getNetworkInfo(wallet.network);
            return (
              <motion.div key={wallet.id} variants={itemVariants}>
                <Card variant={wallet.is_primary ? 'glass-strong' : 'glass'} padding="lg" glow={wallet.is_primary ? 'gold' : undefined}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <h4 className="text-xl font-semibold">
                          {wallet.label || wallet.wallet_type}
                        </h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${networkInfo.bg} ${networkInfo.color} border ${networkInfo.border}`}>
                          {networkInfo.label}
                        </span>
                        {wallet.is_primary && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gold-400/10 text-gold-400 border border-gold-400/30"
                          >
                            <Star className="w-3 h-3 fill-current" />
                            PRIMARY
                          </motion.span>
                        )}
                        {wallet.wallet_type === 'metamask' && (
                          <span className="text-xl">🦊</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm text-text-muted font-mono break-all">
                          {wallet.wallet_address}
                        </code>
                        <button
                          onClick={() => copyAddress(wallet.wallet_address)}
                          className="p-1 hover:bg-glass-light rounded transition-colors flex-shrink-0"
                        >
                          <Copy className="w-4 h-4 text-text-dimmed" />
                        </button>
                      </div>

                      {wallet.last_used_at && (
                        <p className="text-xs text-text-dimmed">
                          Last used: {new Date(wallet.last_used_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {!wallet.is_primary && (
                        <Button
                          onClick={() => handleSetPrimary(wallet.id)}
                          variant="success"
                          size="sm"
                          icon={<Star className="w-4 h-4" />}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(wallet.id)}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass-strong" padding="lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-lg font-semibold mb-3 text-blue-400">Wallet Information</h4>
              <ul className="space-y-2 text-sm text-text-muted">
                <li>• Your primary wallet will be pre-selected for withdrawals</li>
                <li>• Make sure to use the correct network for your wallet address</li>
                <li>• TRC20 = TRON, ERC20 = Ethereum, BEP20 = Binance Smart Chain</li>
                <li>• Double-check addresses before adding - incorrect addresses may result in loss of funds</li>
                <li>• MetaMask wallets are automatically set to ERC20 (Ethereum)</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Wallet Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormError(null);
        }}
        title={formData.wallet_type === 'metamask' ? 'Add MetaMask Wallet' : 'Add Wallet Address'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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
            type="text"
            label="Wallet Address"
            placeholder="Enter wallet address..."
            value={formData.wallet_address}
            onChange={(e) => setFormData(prev => ({ ...prev, wallet_address: e.target.value }))}
            required
            readOnly={formData.wallet_type === 'metamask'}
            className="font-mono"
            helperText={formData.wallet_type === 'metamask' ? 'Address from MetaMask' : undefined}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Network</label>
            <select
              value={formData.network}
              onChange={(e) => setFormData(prev => ({ ...prev, network: e.target.value }))}
              disabled={formData.wallet_type === 'metamask'}
              required
              className="w-full px-4 py-3 bg-glass-medium border border-glass-border rounded-xl focus:outline-none focus:border-gold-400 transition-colors disabled:opacity-50"
            >
              <option value="TRC20">TRC20 (TRON)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
              <option value="BEP20">BEP20 (BSC)</option>
            </select>
          </div>

          <Input
            type="text"
            label="Label (Optional)"
            placeholder="e.g., My Main Wallet"
            value={formData.label}
            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
            helperText="Give your wallet a memorable name"
          />

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={submitting}
              disabled={submitting}
              fullWidth
              variant="primary"
            >
              Add Wallet
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowModal(false);
                setFormError(null);
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

export default MemberWallets;
