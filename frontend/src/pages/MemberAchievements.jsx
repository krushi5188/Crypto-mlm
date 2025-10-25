import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Award, Target, Star, Lock, CheckCircle, 
  AlertCircle, Filter, TrendingUp, Zap
} from 'lucide-react';
import { gamificationAPI } from '../services/api';
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
  fadeInUp,
  scaleIn 
} from '../utils/animations';

const MemberAchievements = () => {
  const { error: showError } = useToast();
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const [progressRes, summaryRes] = await Promise.all([
        gamificationAPI.getAchievementProgress(),
        gamificationAPI.getAchievementSummary()
      ]);

      setProgress(progressRes.data.data.progress);
      setSummary(summaryRes.data.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load achievements';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    if (filter === 'unlocked') {
      return progress.filter(a => a.unlocked);
    } else if (filter === 'locked') {
      return progress.filter(a => !a.unlocked);
    }
    return progress;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={6} />
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Achievements</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadAchievements} variant="primary" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  const filteredAchievements = getFilteredAchievements();

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
            className="p-3 rounded-2xl bg-gradient-to-br from-gold-400/20 to-purple-500/20"
          >
            <Trophy className="w-8 h-8 text-gold-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Achievements</h1>
            <p className="text-lg text-text-muted">Track your progress and unlock rewards</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive glow="gold">
              <div className="text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-gold-400/10"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <Trophy className="w-8 h-8 text-gold-400" />
                </motion.div>
                <div className="text-4xl font-display font-bold mb-1">
                  <AnimatedNumber value={summary.totalUnlocked} />
                </div>
                <div className="text-sm text-text-dimmed">Unlocked</div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive>
              <div className="text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-purple-500/10"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <Target className="w-8 h-8 text-purple-400" />
                </motion.div>
                <div className="text-4xl font-display font-bold mb-1">
                  <AnimatedNumber value={summary.totalAvailable} />
                </div>
                <div className="text-sm text-text-dimmed">Total Available</div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive glow="green">
              <div className="text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-green-500/10"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <Star className="w-8 h-8 text-green-400" />
                </motion.div>
                <div className="text-4xl font-display font-bold text-green-400 mb-1">
                  <AnimatedNumber value={summary.totalPoints} />
                </div>
                <div className="text-sm text-text-dimmed">Points Earned</div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive>
              <div className="text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 mb-3 rounded-full bg-blue-500/10"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </motion.div>
                <div className="text-4xl font-display font-bold mb-1">
                  <AnimatedNumber value={summary.completionPercent} />%
                </div>
                <div className="text-sm text-text-dimmed">Complete</div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Filter Buttons */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="flex gap-3 flex-wrap"
      >
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
          icon={<Filter className="w-4 h-4" />}
          size="sm"
        >
          All ({progress.length})
        </Button>
        <Button
          variant={filter === 'unlocked' ? 'success' : 'outline'}
          onClick={() => setFilter('unlocked')}
          icon={<CheckCircle className="w-4 h-4" />}
          size="sm"
        >
          Unlocked ({progress.filter(a => a.unlocked).length})
        </Button>
        <Button
          variant={filter === 'locked' ? 'outline' : 'outline'}
          onClick={() => setFilter('locked')}
          icon={<Lock className="w-4 h-4" />}
          size="sm"
        >
          Locked ({progress.filter(a => !a.unlocked).length})
        </Button>
      </motion.div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <EmptyState
            icon={Trophy}
            title="No Achievements Found"
            description="No achievements match your selected filter. Try changing the filter to see more."
            actionLabel="Show All"
            onAction={() => setFilter('all')}
          />
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <Card
                variant={achievement.unlocked ? 'glass-strong' : 'glass'}
                padding="lg"
                className={`h-full ${!achievement.unlocked ? 'opacity-70' : ''}`}
                glow={achievement.unlocked ? 'gold' : undefined}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    className={`text-5xl ${!achievement.unlocked ? 'grayscale opacity-50' : ''}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {achievement.unlocked ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: index * 0.05 }}
                      >
                        {achievement.icon}
                      </motion.div>
                    ) : (
                      achievement.icon
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-display font-semibold mb-1 truncate">
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-semibold border border-success/30"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Unlocked
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-text-muted mb-4 line-clamp-2">
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-text-dimmed">Progress</span>
                      <span className="font-semibold">{achievement.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-glass-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-gold-400 to-green-500"
                      />
                    </div>
                    {achievement.progressText && (
                      <p className="text-xs text-text-dimmed mt-2">
                        {achievement.progressText}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                  <span className="text-xs text-text-dimmed uppercase tracking-wider font-medium">
                    {achievement.category}
                  </span>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30"
                  >
                    <Zap className="w-3 h-3 text-gold-400" />
                    <span className="text-sm font-semibold text-gold-400">
                      +{achievement.points}
                    </span>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default MemberAchievements;
