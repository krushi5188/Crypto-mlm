import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, Users, TrendingUp, Wallet, AlertCircle, 
  ChevronDown, ChevronRight, Shield, Mail, User,
  Trophy, Target, X, Layers
} from 'lucide-react';
import { instructorAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AnimatedNumber from '../components/AnimatedNumber';
import { 
  pageVariants, 
  pageTransition, 
  containerVariants, 
  itemVariants,
  fadeInUp 
} from '../utils/animations';
import { formatCurrency } from '../utils/formatters';

const InstructorNetwork = () => {
  const { error: showError } = useToast();
  const [networkData, setNetworkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  useEffect(() => {
    loadNetwork();
  }, []);

  const loadNetwork = async () => {
    try {
      setLoading(true);
      const response = await instructorAPI.getNetworkGraph();
      setNetworkData(response.data.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load network data';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load network:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNodeCollapse = (nodeId) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setShowDetailsModal(true);
  };

  const getDepthColor = (level) => {
    const colors = [
      'from-gold-400 to-yellow-500',
      'from-blue-400 to-cyan-500',
      'from-purple-400 to-pink-500',
      'from-green-400 to-emerald-500',
      'from-red-400 to-orange-500'
    ];
    return colors[level % colors.length];
  };

  const renderNode = (node, level = 0) => {
    const isInstructor = node.role === 'instructor';
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes.has(node.id);

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.05 }}
        className={`${level > 0 ? 'ml-8 mt-4' : 'mt-4'}`}
      >
        <motion.div
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            variant={isInstructor ? "glass-strong" : "glass"}
            padding="lg"
            interactive
            glow={isInstructor ? "gold" : undefined}
            className="cursor-pointer"
            onClick={() => handleNodeClick(node)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {hasChildren && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNodeCollapse(node.id);
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 hover:bg-glass-medium rounded-lg transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-text-dimmed" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-dimmed" />
                    )}
                  </motion.button>
                )}

                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getDepthColor(level)} flex items-center justify-center font-bold text-white text-lg`}>
                  {node.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-lg">{node.username}</span>
                    {isInstructor && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gold-400/20 text-gold-400 border border-gold-400/30">
                        <Shield className="w-3 h-3" />
                        INSTRUCTOR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Mail className="w-3 h-3" />
                    {node.email}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-display font-bold text-gold-400 mb-1">
                  {formatCurrency(node.balance)} USDT
                </div>
                <div className="text-sm text-text-muted">
                  <span className="text-green-400 font-semibold">{node.directRecruits}</span> direct • 
                  <span className="text-blue-400 font-semibold ml-1">{node.networkSize}</span> total
                </div>
              </div>
            </div>

            {hasChildren && (
              <div className="mt-2 pt-2 border-t border-glass-border">
                <div className="flex items-center gap-2 text-xs text-text-dimmed">
                  <Users className="w-3 h-3" />
                  {node.children.length} direct referral{node.children.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Children */}
        <AnimatePresence>
          {hasChildren && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="ml-4 pl-4 border-l-2 border-glass-border"
            >
              {node.children.map(child => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="400px" />
          <LoadingSkeleton variant="text" width="600px" />
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Network</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadNetwork} variant="primary" size="sm">
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
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20"
          >
            <Network className="w-8 h-8 text-purple-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Network Visualization</h1>
            <p className="text-lg text-text-muted">Complete MLM network structure and hierarchy</p>
          </div>
        </div>
      </motion.div>

      {/* Network Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Total Members</p>
                <p className="text-5xl font-display font-bold text-blue-400">
                  <AnimatedNumber value={networkData?.totalNodes || 0} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-4 rounded-2xl bg-blue-500/10"
              >
                <Users className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Max Depth</p>
                <p className="text-5xl font-display font-bold text-purple-400">
                  <AnimatedNumber value={networkData?.maxDepth || 0} />
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="p-4 rounded-2xl bg-purple-500/10"
              >
                <Layers className="w-8 h-8 text-purple-400" />
              </motion.div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="gold">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-dimmed mb-2">Total Balance</p>
                <p className="text-3xl font-display font-bold text-gold-400">
                  <AnimatedNumber value={networkData?.totalBalance || 0} decimals={2} />
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

      {/* Network Tree */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="xl">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-semibold">Network Hierarchy</h2>
          </div>

          {networkData && networkData.tree ? (
            <div className="space-y-2">
              {renderNode(networkData.tree)}
            </div>
          ) : (
            <div className="text-center py-12">
              <Network className="w-16 h-16 text-text-dimmed mx-auto mb-4 opacity-50" />
              <p className="text-text-muted">No network data available</p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Node Details Modal */}
      {selectedNode && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedNode(null);
          }}
          title={selectedNode.username}
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl font-bold text-white">
                {selectedNode.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-display font-bold">{selectedNode.username}</h3>
                <p className="text-text-muted">{selectedNode.email}</p>
                {selectedNode.role === 'instructor' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gold-400/20 text-gold-400 border border-gold-400/30 mt-2">
                    <Shield className="w-3 h-3" />
                    INSTRUCTOR
                  </span>
                )}
              </div>
            </div>

            <Card variant="glass-medium" padding="lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-gold-400" />
                    <span className="text-sm text-text-dimmed">Balance</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-gold-400">
                    {formatCurrency(selectedNode.balance)} USDT
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-text-dimmed">Total Earned</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-green-400">
                    {formatCurrency(selectedNode.totalEarned || 0)} USDT
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-text-dimmed">Direct Recruits</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-blue-400">
                    <AnimatedNumber value={selectedNode.directRecruits} />
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-text-dimmed">Network Size</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-purple-400">
                    <AnimatedNumber value={selectedNode.networkSize} />
                  </p>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-text-dimmed">Referral Code</span>
                  </div>
                  <p className="font-mono text-lg font-bold text-yellow-400 tracking-wider">
                    {selectedNode.referralCode}
                  </p>
                </div>
              </div>
            </Card>

            <Button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedNode(null);
              }}
              variant="outline"
              fullWidth
              icon={<X className="w-5 h-5" />}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default InstructorNetwork;
