import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, Play, Pause, Trophy, Trash2, ChevronDown, 
  ChevronUp, BarChart3, Target, Users, Calendar, Plus, X
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
import { formatDateTime } from '../utils/formatters';

const InstructorABTesting = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [experimentResults, setExperimentResults] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    experiment_type: 'ui_variant',
    variant_a: { description: '' },
    variant_b: { description: '' },
    variant_c: null,
    traffic_a: 50,
    traffic_b: 50,
    traffic_c: 0,
    target_role: 'all',
    primary_metric: 'conversion_rate',
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerTarget, setWinnerTarget] = useState(null);
  const [summary, setSummary] = useState({ draft: 0, running: 0, paused: 0, completed: 0, total: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [experimentsRes, summaryRes] = await Promise.all([
        instructorAPI.getExperiments({ limit: 100 }),
        instructorAPI.getExperimentsSummary()
      ]);

      setExperiments(experimentsRes.data.data.experiments);
      setSummary(summaryRes.data.data.summary);
      setError(null);
    } catch (error) {
      console.error('Failed to load experiments:', error);
      setError('Failed to load experiments');
      showError('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const loadExperimentResults = async (experimentId) => {
    try {
      const response = await instructorAPI.getExperimentResults(experimentId);
      setExperimentResults(prev => ({
        ...prev,
        [experimentId]: response.data.data.results
      }));
    } catch (error) {
      console.error('Failed to load experiment results:', error);
    }
  };

  const handleCreateExperiment = async (e) => {
    e.preventDefault();

    // Validate traffic allocation
    const totalTraffic = parseInt(formData.traffic_a) + parseInt(formData.traffic_b) + parseInt(formData.traffic_c || 0);
    if (totalTraffic !== 100) {
      showError(`Traffic allocation must sum to 100% (currently ${totalTraffic}%)`);
      return;
    }

    if (!formData.name || !formData.primary_metric) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      await instructorAPI.createExperiment(formData);
      await loadData();
      setFormData({
        name: '',
        description: '',
        experiment_type: 'ui_variant',
        variant_a: { description: '' },
        variant_b: { description: '' },
        variant_c: null,
        traffic_a: 50,
        traffic_b: 50,
        traffic_c: 0,
        target_role: 'all',
        primary_metric: 'conversion_rate',
        start_date: '',
        end_date: ''
      });
      setShowCreateModal(false);
      showSuccess(`Experiment "${formData.name}" created successfully!`);
    } catch (error) {
      console.error('Create experiment error:', error);
      showError(error.response?.data?.error || 'Failed to create experiment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (experimentId, newStatus) => {
    try {
      await instructorAPI.updateExperimentStatus(experimentId, newStatus);
      await loadData();
      showSuccess(`Experiment status updated to ${newStatus}`);
    } catch (error) {
      console.error('Update status error:', error);
      showError(error.response?.data?.error || 'Failed to update experiment status');
    }
  };

  const handleSetWinner = async (variant) => {
    if (!winnerTarget) return;

    try {
      await instructorAPI.setExperimentWinner(winnerTarget.id, variant);
      await loadData();
      setShowWinnerModal(false);
      setWinnerTarget(null);
      showSuccess(`Winner set to variant ${variant.toUpperCase()}`);
    } catch (error) {
      console.error('Set winner error:', error);
      showError(error.response?.data?.error || 'Failed to set winner');
    }
  };

  const handleDeleteExperiment = async () => {
    if (!deleteTarget) return;

    try {
      await instructorAPI.deleteExperiment(deleteTarget.id);
      await loadData();
      setShowDeleteModal(false);
      setDeleteTarget(null);
      showSuccess(`Experiment "${deleteTarget.name}" deleted successfully`);
    } catch (error) {
      console.error('Delete experiment error:', error);
      showError(error.response?.data?.error || 'Failed to delete experiment');
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const toggleExperimentDetails = async (experiment) => {
    if (selectedExperiment?.id === experiment.id) {
      setSelectedExperiment(null);
    } else {
      setSelectedExperiment(experiment);
      if (!experimentResults[experiment.id]) {
        await loadExperimentResults(experiment.id);
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      draft: { icon: FlaskConical, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Draft' },
      running: { icon: Play, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Running' },
      paused: { icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Paused' },
      completed: { icon: Trophy, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Completed' }
    };
    return configs[status] || configs.draft;
  };

  const filteredExperiments = experiments.filter(e => {
    return statusFilter === 'all' || e.status === statusFilter;
  });

  const tabs = [
    { id: 'all', label: 'All Experiments', count: experiments.length },
    { id: 'draft', label: 'Draft', count: summary.draft },
    { id: 'running', label: 'Running', count: summary.running },
    { id: 'paused', label: 'Paused', count: summary.paused },
    { id: 'completed', label: 'Completed', count: summary.completed }
  ];

  const totalTraffic = parseInt(formData.traffic_a) + parseInt(formData.traffic_b) + parseInt(formData.traffic_c || 0);

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
        <LoadingSkeleton variant="card" count={3} />
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
            icon={FlaskConical}
            title="Error Loading Experiments"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20"
            >
              <FlaskConical className="w-8 h-8 text-green-400" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-display font-bold">A/B Testing</h1>
              <p className="text-lg text-text-muted">Create and manage experiments to optimize user experience</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="success"
            icon={<Plus className="w-5 h-5" />}
          >
            Create Experiment
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          { label: 'Draft', value: summary.draft, color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FlaskConical },
          { label: 'Running', value: summary.running, color: 'text-green-400', bg: 'bg-green-500/10', icon: Play },
          { label: 'Paused', value: summary.paused, color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Pause },
          { label: 'Completed', value: summary.completed, color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Trophy }
        ].map((stat, index) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card variant="glass-strong" padding="xl" interactive>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-dimmed mb-2">{stat.label}</p>
                  <p className={`text-5xl font-display font-bold ${stat.color}`}>
                    <AnimatedNumber value={stat.value} />
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 rounded-2xl ${stat.bg}`}
                >
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <Card variant="glass-strong" padding="none">
          <div className="flex gap-2 p-2 relative">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-colors relative z-10 ${
                  statusFilter === tab.id
                    ? 'text-green-400'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  statusFilter === tab.id
                    ? 'bg-green-400/20 text-green-400'
                    : 'bg-glass-medium text-text-dimmed'
                }`}>
                  {tab.count}
                </span>
                {statusFilter === tab.id && (
                  <motion.div
                    layoutId="activeExperimentTab"
                    className="absolute inset-0 bg-green-400/10 border border-green-400/30 rounded-xl"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Experiments List */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredExperiments.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No Experiments Found"
            description={
              experiments.length === 0
                ? "Create your first A/B test to start optimizing"
                : "No experiments match your current filter"
            }
            actionLabel="Create Experiment"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          filteredExperiments.map((experiment, index) => {
            const statusConfig = getStatusConfig(experiment.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = selectedExperiment?.id === experiment.id;
            const results = experimentResults[experiment.id];

            return (
              <motion.div
                key={experiment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="glass-strong" padding="xl" interactive>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-xl ${statusConfig.bg}`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        </div>
                        <h3 className="text-2xl font-semibold">{experiment.name}</h3>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {experiment.description && (
                        <p className="text-text-muted mb-3">{experiment.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-text-dimmed">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span className="capitalize">{experiment.experiment_type.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          <span className="capitalize">{experiment.primary_metric.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(experiment.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {experiment.status === 'draft' && (
                        <Button
                          onClick={() => handleUpdateStatus(experiment.id, 'running')}
                          variant="success"
                          size="sm"
                          icon={<Play className="w-4 h-4" />}
                        >
                          Start
                        </Button>
                      )}

                      {experiment.status === 'running' && (
                        <Button
                          onClick={() => handleUpdateStatus(experiment.id, 'paused')}
                          variant="outline"
                          size="sm"
                          icon={<Pause className="w-4 h-4" />}
                          className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          Pause
                        </Button>
                      )}

                      {experiment.status === 'paused' && (
                        <Button
                          onClick={() => handleUpdateStatus(experiment.id, 'running')}
                          variant="success"
                          size="sm"
                          icon={<Play className="w-4 h-4" />}
                        >
                          Resume
                        </Button>
                      )}

                      <Button
                        onClick={() => toggleExperimentDetails(experiment)}
                        variant="ghost"
                        size="sm"
                        icon={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      >
                        {isExpanded ? 'Hide' : 'View'} Results
                      </Button>

                      <Button
                        onClick={() => {
                          setDeleteTarget(experiment);
                          setShowDeleteModal(true);
                        }}
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  {/* Experiment Results */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 pt-6 border-t border-glass-border"
                      >
                        {results ? (
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                              <BarChart3 className="w-5 h-5 text-blue-400" />
                              <h4 className="text-xl font-semibold">Experiment Results</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {Object.entries(results.variants).map(([variantKey, variantData]) => (
                                <Card
                                  key={variantKey}
                                  variant="glass-medium"
                                  padding="lg"
                                  className={results.winner === variantKey ? 'border-2 border-green-500/50' : ''}
                                >
                                  <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                      <span className="text-sm font-semibold text-text-dimmed">
                                        Variant {variantKey.toUpperCase()}
                                      </span>
                                      {results.winner === variantKey && (
                                        <Trophy className="w-4 h-4 text-green-400" />
                                      )}
                                    </div>
                                    <div className="text-4xl font-display font-bold text-green-400 mb-2">
                                      {variantData.conversionRate}%
                                    </div>
                                    <div className="text-xs text-text-dimmed">
                                      <div>{variantData.users} users</div>
                                      <div>{variantData.conversions} conversions</div>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>

                            {results.statisticalSignificance && (
                              <Card
                                variant="glass-medium"
                                padding="lg"
                                className={results.isSignificant ? 'border border-green-500/30' : 'border border-yellow-500/30'}
                              >
                                <div className={`text-sm ${results.isSignificant ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {results.isSignificant
                                    ? `✓ Statistically significant (${results.confidenceLevel}% confidence, p=${results.statisticalSignificance})`
                                    : '⚠️ Not statistically significant yet - continue running'}
                                </div>
                              </Card>
                            )}

                            {experiment.status === 'running' && results.isSignificant && !experiment.winner_variant && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setWinnerTarget(experiment);
                                    setShowWinnerModal(true);
                                  }}
                                  variant="success"
                                  icon={<Trophy className="w-5 h-5" />}
                                >
                                  Declare Winner
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-text-muted">
                            Loading results...
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Create Experiment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({
            name: '',
            description: '',
            experiment_type: 'ui_variant',
            variant_a: { description: '' },
            variant_b: { description: '' },
            variant_c: null,
            traffic_a: 50,
            traffic_b: 50,
            traffic_c: 0,
            target_role: 'all',
            primary_metric: 'conversion_rate',
            start_date: '',
            end_date: ''
          });
        }}
        title="Create New A/B Test"
        size="lg"
      >
        <form onSubmit={handleCreateExperiment} className="space-y-6">
          <Card variant="glass-medium" padding="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                label="Experiment Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Button Color Test"
                required
                icon={<FlaskConical className="w-5 h-5" />}
              />

              <Input
                type="select"
                label="Experiment Type"
                value={formData.experiment_type}
                onChange={(e) => setFormData({ ...formData, experiment_type: e.target.value })}
                required
                icon={<Target className="w-5 h-5" />}
              >
                <option value="ui_variant">UI Variant</option>
                <option value="commission_rate">Commission Rate</option>
                <option value="message_template">Message Template</option>
                <option value="feature_toggle">Feature Toggle</option>
              </Input>
            </div>

            <div className="mt-4">
              <Input
                type="textarea"
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what you're testing and why..."
                rows={3}
              />
            </div>
          </Card>

          <Card variant="glass-medium" padding="lg">
            <h4 className="text-lg font-semibold mb-4">Traffic Allocation</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                label="Variant A (Control) %"
                value={formData.traffic_a}
                onChange={(e) => setFormData({ ...formData, traffic_a: parseInt(e.target.value) || 0 })}
                min="0"
                max="100"
              />
              <Input
                type="number"
                label="Variant B (Treatment) %"
                value={formData.traffic_b}
                onChange={(e) => setFormData({ ...formData, traffic_b: parseInt(e.target.value) || 0 })}
                min="0"
                max="100"
              />
              <Input
                type="number"
                label="Variant C (Optional) %"
                value={formData.traffic_c}
                onChange={(e) => setFormData({ ...formData, traffic_c: parseInt(e.target.value) || 0 })}
                min="0"
                max="100"
              />
            </div>
            <div className={`mt-2 text-sm font-semibold ${totalTraffic === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total: {totalTraffic}% (must equal 100%)
            </div>
          </Card>

          <Card variant="glass-medium" padding="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="select"
                label="Primary Metric"
                value={formData.primary_metric}
                onChange={(e) => setFormData({ ...formData, primary_metric: e.target.value })}
                required
                icon={<BarChart3 className="w-5 h-5" />}
              >
                <option value="conversion_rate">Conversion Rate</option>
                <option value="click_through_rate">Click-Through Rate</option>
                <option value="earnings">Earnings</option>
                <option value="retention">Retention</option>
                <option value="engagement">Engagement</option>
              </Input>

              <Input
                type="select"
                label="Target Role"
                value={formData.target_role}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                required
                icon={<Users className="w-5 h-5" />}
              >
                <option value="all">All Users</option>
                <option value="member">Members Only</option>
                <option value="instructor">Instructors Only</option>
              </Input>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              variant="outline"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || totalTraffic !== 100}
              variant="success"
              fullWidth
              icon={<Plus className="w-5 h-5" />}
            >
              {submitting ? 'Creating...' : 'Create Experiment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Delete Experiment"
        size="md"
      >
        {deleteTarget && (
          <div className="space-y-6">
            <Card variant="glass-medium" padding="lg" className="border border-red-500/30">
              <p className="text-text-muted leading-relaxed">
                Are you sure you want to delete "<strong>{deleteTarget.name}</strong>"? 
                This will also delete all assignments and event data. This action cannot be undone.
              </p>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                variant="outline"
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteExperiment}
                variant="danger"
                fullWidth
                icon={<Trash2 className="w-5 h-5" />}
              >
                Delete Experiment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Winner Selection Modal */}
      <Modal
        isOpen={showWinnerModal}
        onClose={() => {
          setShowWinnerModal(false);
          setWinnerTarget(null);
        }}
        title="Declare Winner"
        size="md"
      >
        {winnerTarget && experimentResults[winnerTarget.id] && (
          <div className="space-y-6">
            <Card variant="glass-medium" padding="lg" glow="green">
              <p className="text-text-muted mb-4">
                Select the winning variant for "<strong>{winnerTarget.name}</strong>". 
                This will complete the experiment and mark the selected variant as the winner.
              </p>

              <div className="space-y-2">
                {Object.entries(experimentResults[winnerTarget.id].variants).map(([variantKey, variantData]) => (
                  <Button
                    key={variantKey}
                    onClick={() => handleSetWinner(variantKey)}
                    variant="outline"
                    fullWidth
                    className="justify-between border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10"
                  >
                    <span>Variant {variantKey.toUpperCase()}</span>
                    <span className="text-green-400 font-bold">{variantData.conversionRate}%</span>
                  </Button>
                ))}
                <Button
                  onClick={() => handleSetWinner('inconclusive')}
                  variant="outline"
                  fullWidth
                  className="border-yellow-500/30 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-400"
                >
                  Mark Inconclusive
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default InstructorABTesting;
