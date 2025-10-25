import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Play, Pause, AlertTriangle, DollarSign, 
  RotateCcw, Trash2, Activity, CheckCircle, XCircle, User
} from 'lucide-react';
import { instructorAPI, systemAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';

const InstructorControls = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Inject Coins State
  const [injectUserId, setInjectUserId] = useState('');
  const [injectAmount, setInjectAmount] = useState('');
  const [injectNote, setInjectNote] = useState('');

  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    action: null,
    isDestructive: false
  });

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const response = await systemAPI.getStatus();
      setSystemStatus(response.data.data);
    } catch (err) {
      console.error('Failed to load system status:', err);
      showError('Failed to load system status');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmDialog = (title, message, action, isDestructive = false) => {
    setConfirmConfig({ title, message, action, isDestructive });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmConfig.action) {
      confirmConfig.action();
    }
    setShowConfirmModal(false);
  };

  const handlePause = () => {
    showConfirmDialog(
      'Pause System',
      'Members will not be able to register or earn commissions while the system is paused.',
      async () => {
        setProcessing(true);
        try {
          await instructorAPI.pause();
          await loadSystemStatus();
          showSuccess('System paused successfully');
        } catch (err) {
          showError(err.response?.data?.error || 'Failed to pause system');
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleResume = () => {
    showConfirmDialog(
      'Resume System',
      'Members will be able to register and earn commissions again.',
      async () => {
        setProcessing(true);
        try {
          await instructorAPI.resume();
          await loadSystemStatus();
          showSuccess('System resumed successfully');
        } catch (err) {
          showError(err.response?.data?.error || 'Failed to resume system');
        } finally {
          setProcessing(false);
        }
      }
    );
  };

  const handleReset = (type) => {
    const message = type === 'full'
      ? 'This will DELETE ALL member data, transactions, and balances permanently. This action CANNOT be undone!'
      : 'This will reset all balances to zero but keep user accounts and network structure.';

    showConfirmDialog(
      type === 'full' ? 'Full Reset - PERMANENT' : 'Soft Reset',
      message,
      async () => {
        setProcessing(true);
        try {
          await instructorAPI.reset({ type, confirm: true });
          await loadSystemStatus();
          showSuccess(`${type === 'full' ? 'Full' : 'Soft'} reset completed successfully`);
        } catch (err) {
          showError(err.response?.data?.error || 'Failed to reset system');
        } finally {
          setProcessing(false);
        }
      },
      type === 'full'
    );
  };

  const handleInjectCoins = async (e) => {
    e.preventDefault();

    if (!injectUserId || !injectAmount) {
      showError('Please provide user ID and amount');
      return;
    }

    setProcessing(true);
    
    try {
      await instructorAPI.injectCoins({
        userId: parseInt(injectUserId),
        amount: parseFloat(injectAmount),
        note: injectNote
      });
      showSuccess(`Successfully injected ${injectAmount} USDT to user ${injectUserId}`);
      setInjectUserId('');
      setInjectAmount('');
      setInjectNote('');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to inject coins');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <LoadingSkeleton variant="card" count={4} />
      </div>
    );
  }

  const isActive = systemStatus?.simulationStatus === 'active';

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
            className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20"
          >
            <Settings className="w-8 h-8 text-red-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">System Controls</h1>
            <p className="text-lg text-text-muted">Manage platform state and resources</p>
          </div>
        </div>
      </motion.div>

      {/* Current Status */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl" glow={isActive ? "green" : "red"}>
          <div className="flex items-center gap-6">
            <motion.div
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className={`p-6 rounded-2xl ${isActive ? 'bg-green-500/20' : 'bg-red-500/20'}`}
            >
              <Activity className={`w-12 h-12 ${isActive ? 'text-green-400' : 'text-red-400'}`} />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-2">Current Status</h3>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isActive ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    ACTIVE
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    PAUSED
                  </>
                )}
              </div>
              <p className="text-sm text-text-muted mt-3">
                {isActive
                  ? 'System is running. Members can register and earn commissions.'
                  : 'System is paused. No new registrations or commission distributions.'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Platform State Controls */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" glow="red">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Pause className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-semibold">Pause System</h3>
              </div>
              <p className="text-sm text-text-muted">
                Stop all operations. Members cannot register or earn commissions while paused.
              </p>
              <Button
                onClick={handlePause}
                disabled={!isActive || processing}
                variant="danger"
                fullWidth
                icon={<Pause className="w-5 h-5" />}
              >
                Pause System
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" glow="green">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-semibold">Resume System</h3>
              </div>
              <p className="text-sm text-text-muted">
                Activate all operations. Members can register and earn commissions again.
              </p>
              <Button
                onClick={handleResume}
                disabled={isActive || processing}
                variant="success"
                fullWidth
                icon={<Play className="w-5 h-5" />}
              >
                Resume System
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Inject Coins */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <Card variant="glass-strong" padding="xl" glow="gold">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-gold-400" />
              <h2 className="text-2xl font-semibold">Add USDT</h2>
            </div>
            <p className="text-sm text-text-muted">
              Manually add USDT to a member's balance for adjustments or corrections.
            </p>

            <form onSubmit={handleInjectCoins} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="User ID"
                  value={injectUserId}
                  onChange={(e) => setInjectUserId(e.target.value)}
                  placeholder="e.g., 5"
                  icon={<User className="w-5 h-5" />}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  label="Amount (USDT)"
                  value={injectAmount}
                  onChange={(e) => setInjectAmount(e.target.value)}
                  placeholder="e.g., 100.00"
                  icon={<DollarSign className="w-5 h-5" />}
                  required
                />
              </div>
              <Input
                type="text"
                label="Note (optional)"
                value={injectNote}
                onChange={(e) => setInjectNote(e.target.value)}
                placeholder="Reason for injection..."
              />
              <Button 
                type="submit" 
                disabled={processing}
                variant="primary"
                fullWidth
                icon={<DollarSign className="w-5 h-5" />}
              >
                {processing ? 'Adding...' : 'Add Coins'}
              </Button>
            </form>
          </div>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
      >
        <Card variant="glass-strong" padding="xl" className="border-2 border-red-500/50 bg-red-500/5">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h2 className="text-2xl font-semibold text-red-400">Danger Zone</h2>
            </div>

            <div className="space-y-6">
              {/* Soft Reset */}
              <Card variant="glass-medium" padding="lg" className="border border-yellow-500/30">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold">Soft Reset</h3>
                  </div>
                  <p className="text-sm text-text-muted">
                    Reset all balances to zero but keep user accounts and network structure intact.
                  </p>
                  <Button
                    onClick={() => handleReset('soft')}
                    disabled={processing}
                    variant="outline"
                    icon={<RotateCcw className="w-5 h-5" />}
                    className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Soft Reset
                  </Button>
                </div>
              </Card>

              {/* Full Reset */}
              <Card variant="glass-medium" padding="lg" className="border border-red-500/50">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <h3 className="text-lg font-semibold text-red-400">Full Reset</h3>
                  </div>
                  <p className="text-sm text-text-muted">
                    Delete ALL member data, transactions, referrals, and balances. This CANNOT be undone!
                  </p>
                  <Button
                    onClick={() => handleReset('full')}
                    disabled={processing}
                    variant="danger"
                    icon={<Trash2 className="w-5 h-5" />}
                  >
                    Full Reset (Destructive)
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmConfig.title}
        size="md"
      >
        <div className="space-y-6">
          <Card 
            variant="glass-medium" 
            padding="lg" 
            className={confirmConfig.isDestructive ? 'border border-red-500/50' : ''}
          >
            <p className="text-text-muted leading-relaxed">
              {confirmConfig.message}
            </p>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant={confirmConfig.isDestructive ? "danger" : "primary"}
              fullWidth
            >
              {confirmConfig.isDestructive ? 'Yes, Delete Everything' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default InstructorControls;
