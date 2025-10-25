import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, Users, DollarSign, Calendar, CheckCircle,
  AlertCircle, Trash2, Plus, Sparkles, Award, Trophy, X
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
import { formatCurrency } from '../utils/formatters';

const MemberGoals = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: 'earnings',
    target_value: '',
    target_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsRes, recsRes] = await Promise.all([
        memberAPI.getGoals(),
        memberAPI.getGoalRecommendations()
      ]);
      setGoals(goalsRes.data.data.goals || []);
      setRecommendations(recsRes.data.data.recommendations || []);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to load goals';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await memberAPI.createGoal({
        goal_type: formData.goal_type,
        target_value: parseFloat(formData.target_value),
        target_date: formData.target_date || null
      });

      showSuccess('Goal created successfully!');
      setShowModal(false);
      setFormData({ goal_type: 'earnings', target_value: '', target_date: '' });
      await loadData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await memberAPI.deleteGoal(id);
      showSuccess('Goal deleted successfully');
      await loadData();
    } catch (err) {
      showError('Failed to delete goal');
    }
  };

  const useRecommendation = (rec) => {
    setFormData({
      goal_type: rec.goal_type,
      target_value: rec.target_value.toString(),
      target_date: ''
    });
    setShowModal(true);
  };

  const getProgressPercentage = (goal) => {
    const progress = (goal.current_value / goal.target_value) * 100;
    return Math.min(progress, 100);
  };

  const getGoalConfig = (type) => {
    const configs = {
      earnings: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Total Earnings' },
      recruits: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'Direct Recruits' },
      network_size: { icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', label: 'Network Size' }
    };
    return configs[type] || { icon: Target, color: 'text-text-muted', bg: 'bg-glass-medium', border: 'border-glass-border', label: type };
  };

  const formatGoalValue = (value, type) => {
    if (type === 'earnings') {
      return `${formatCurrency(value)} USDT`;
    }
    return value;
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'from-green-500 to-emerald-500';
    if (progress >= 75) return 'from-blue-500 to-cyan-500';
    if (progress >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Goals</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadData} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);
  const successRate = goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0;

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
            className="p-3 rounded-2xl bg-gradient-to-br from-gold-400/20 to-green-500/20"
          >
            <Target className="w-8 h-8 text-gold-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">My Goals</h1>
            <p className="text-lg text-text-muted">Set and track your performance goals</p>
          </div>
        </div>

        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          icon={<Plus className="w-5 h-5" />}
        >
          Create New Goal
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="green">
            <div className="text-center">
              <p className="text-sm text-text-dimmed mb-2">Active Goals</p>
              <p className="text-5xl font-display font-bold text-green-400">
                <AnimatedNumber value={activeGoals.length} />
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="blue">
            <div className="text-center">
              <p className="text-sm text-text-dimmed mb-2">Completed Goals</p>
              <p className="text-5xl font-display font-bold text-blue-400">
                <AnimatedNumber value={completedGoals.length} />
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card variant="glass-strong" padding="xl" interactive glow="gold">
            <div className="text-center">
              <p className="text-sm text-text-dimmed mb-2">Success Rate</p>
              <p className="text-5xl font-display font-bold text-gold-400">
                <AnimatedNumber value={successRate} />%
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass-strong" padding="xl" glow="purple">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-semibold">Recommended Goals</h2>
            </div>
            <p className="text-sm text-text-dimmed mb-6">Based on your current progress</p>

            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="glass-medium" padding="lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{rec.reason}</h4>
                        <p className="text-sm text-text-dimmed">
                          {getGoalConfig(rec.goal_type).label}: {formatGoalValue(rec.target_value, rec.goal_type)}
                        </p>
                      </div>
                      <Button
                        onClick={() => useRecommendation(rec)}
                        variant="success"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        Set Goal
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-semibold">Active Goals</h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {activeGoals.map((goal, index) => {
              const progress = getProgressPercentage(goal);
              const config = getGoalConfig(goal.goal_type);
              const IconComponent = config.icon;

              return (
                <motion.div key={goal.id} variants={itemVariants}>
                  <Card variant="glass-strong" padding="lg" interactive>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`flex-shrink-0 w-12 h-12 ${config.bg} border ${config.border} rounded-xl flex items-center justify-center`}
                          >
                            <IconComponent className={`w-6 h-6 ${config.color}`} />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1">{config.label}</h3>
                            <p className="text-sm text-text-dimmed">
                              Target: {formatGoalValue(goal.target_value, goal.goal_type)}
                              {goal.target_date && (
                                <span className="flex items-center gap-1 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  by {new Date(goal.target_date).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleDelete(goal.id)}
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                        >
                          Delete
                        </Button>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2 text-sm">
                          <span className="text-text-dimmed">
                            Current: {formatGoalValue(goal.current_value, goal.goal_type)}
                          </span>
                          <span className={`font-semibold ${progress >= 100 ? 'text-green-400' : 'text-gold-400'}`}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>

                        <div className="w-full h-3 bg-glass-medium border border-glass-border rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={`h-full bg-gradient-to-r ${getProgressColor(progress)}`}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-gold-400" />
            <h2 className="text-2xl font-semibold">Completed Goals</h2>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {completedGoals.map((goal) => {
              const config = getGoalConfig(goal.goal_type);
              const IconComponent = config.icon;

              return (
                <motion.div key={goal.id} variants={itemVariants}>
                  <Card variant="glass" padding="lg">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex-shrink-0 w-12 h-12 ${config.bg} border ${config.border} rounded-xl flex items-center justify-center opacity-50`}>
                          <IconComponent className={`w-6 h-6 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold mb-1 opacity-70">{config.label}</h3>
                          <p className="text-sm text-text-dimmed">
                            Achieved: {formatGoalValue(goal.current_value, goal.goal_type)}
                            {goal.completed_at && ` on ${new Date(goal.completed_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Award className="w-8 h-8 text-gold-400" />
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <EmptyState
            icon={Target}
            title="No Goals Yet"
            description="Set your first goal to start tracking your progress and achieve milestones!"
            actionLabel="Create Your First Goal"
            onAction={() => setShowModal(true)}
          />
        </motion.div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ goal_type: 'earnings', target_value: '', target_date: '' });
        }}
        title="Create New Goal"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Goal Type</label>
            <select
              value={formData.goal_type}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_type: e.target.value }))}
              className="w-full px-4 py-3 bg-glass-medium border border-glass-border rounded-xl focus:outline-none focus:border-gold-400 transition-colors"
            >
              <option value="earnings">Total Earnings (USDT)</option>
              <option value="recruits">Direct Recruits</option>
              <option value="network_size">Network Size</option>
            </select>
          </div>

          <Input
            type="number"
            step={formData.goal_type === 'earnings' ? '0.01' : '1'}
            label="Target Value"
            placeholder="Enter target value..."
            value={formData.target_value}
            onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
            required
          />

          <Input
            type="date"
            label="Target Date (Optional)"
            value={formData.target_date}
            onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
            helperText="Set a deadline to stay motivated"
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
              Create Goal
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowModal(false);
                setFormData({ goal_type: 'earnings', target_value: '', target_date: '' });
              }}
              fullWidth
              variant="outline"
              icon={<X className="w-5 h-5" />}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default MemberGoals;
