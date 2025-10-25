import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Trash2, CheckCheck, X, DollarSign, 
  Trophy, Users, Shield, TrendingUp, AlertCircle, Filter
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
  fadeInUp 
} from '../utils/animations';
import { formatTimeAgo } from '../utils/formatters';

const MemberNotifications = () => {
  const { success: showSuccess, error: showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const includeRead = filter !== 'unread';

      const [notifRes, summaryRes] = await Promise.all([
        gamificationAPI.getNotifications({ limit: 100, includeRead }),
        gamificationAPI.getNotificationSummary()
      ]);

      let data = notifRes.data.data.notifications;

      if (filter === 'read') {
        data = data.filter(n => n.isRead);
      } else if (filter === 'unread') {
        data = data.filter(n => !n.isRead);
      }

      setNotifications(data);
      setSummary(summaryRes.data.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load notifications';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await gamificationAPI.markAsRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
      if (summary) {
        setSummary({ ...summary, unread: Math.max(0, summary.unread - 1), read: summary.read + 1 });
      }
      showSuccess('Marked as read');
    } catch (error) {
      showError('Failed to mark as read');
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await gamificationAPI.markAllAsRead();
      showSuccess('All notifications marked as read');
      await loadNotifications();
    } catch (error) {
      showError('Failed to mark all as read');
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await gamificationAPI.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      showSuccess('Notification deleted');
    } catch (error) {
      showError('Failed to delete notification');
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await gamificationAPI.deleteAllRead();
      showSuccess('All read notifications deleted');
      await loadNotifications();
    } catch (error) {
      showError('Failed to delete notifications');
      console.error('Failed to delete read notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      commission_earned: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
      rank_up: { icon: Trophy, color: 'text-gold-400', bg: 'bg-gold-400/10' },
      achievement_unlocked: { icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      security_alert: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
      new_recruit: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
      withdrawal_status: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
    };
    return iconMap[type] || { icon: Bell, color: 'text-text-muted', bg: 'bg-glass-medium' };
  };

  if (loading && !notifications.length) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <LoadingSkeleton variant="title" width="300px" />
          <LoadingSkeleton variant="text" width="500px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
        <div className="space-y-4">
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
              <h3 className="text-xl font-semibold mb-2">Failed to Load Notifications</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button onClick={loadNotifications} variant="primary" size="sm">
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
            className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 relative"
          >
            <Bell className="w-8 h-8 text-blue-400" />
            {summary && summary.unread > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-gold-400 rounded-full flex items-center justify-center text-black text-xs font-bold"
              >
                {summary.unread > 99 ? '99+' : summary.unread}
              </motion.div>
            )}
          </motion.div>
          <div>
            <h1 className="text-4xl font-display font-bold">Notifications</h1>
            <p className="text-lg text-text-muted">Stay updated with your activity</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      {summary && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive>
              <div className="text-center">
                <p className="text-sm text-text-dimmed mb-2">Total</p>
                <p className="text-4xl font-display font-bold">
                  <AnimatedNumber value={summary.total} />
                </p>
              </div>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive glow="gold">
              <div className="text-center">
                <p className="text-sm text-text-dimmed mb-2">Unread</p>
                <p className="text-4xl font-display font-bold text-gold-400">
                  <AnimatedNumber value={summary.unread} />
                </p>
              </div>
            </Card>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card variant="glass-strong" padding="lg" interactive>
              <div className="text-center">
                <p className="text-sm text-text-dimmed mb-2">Read</p>
                <p className="text-4xl font-display font-bold">
                  <AnimatedNumber value={summary.read} />
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 justify-between"
      >
        <div className="flex gap-3 flex-wrap">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            icon={<Filter className="w-4 h-4" />}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'warning' : 'outline'}
            onClick={() => setFilter('unread')}
            icon={<Bell className="w-4 h-4" />}
            size="sm"
          >
            Unread
          </Button>
          <Button
            variant={filter === 'read' ? 'success' : 'outline'}
            onClick={() => setFilter('read')}
            icon={<Check className="w-4 h-4" />}
            size="sm"
          >
            Read
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          {summary && summary.unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              icon={<CheckCheck className="w-4 h-4" />}
            >
              Mark all as read
            </Button>
          )}
          {summary && summary.read > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAllRead}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete all read
            </Button>
          )}
        </div>
      </motion.div>

      {/* Notifications List */}
      <AnimatePresence mode="popLayout">
        {notifications.length === 0 ? (
          <motion.div
            key="empty"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <EmptyState
              icon={Bell}
              title="No Notifications"
              description="You're all caught up! No notifications to show."
              actionLabel="Refresh"
              onAction={loadNotifications}
            />
          </motion.div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => {
              const iconInfo = getNotificationIcon(notification.type);
              const IconComponent = iconInfo.icon;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card
                    variant={notification.isRead ? 'glass' : 'glass-strong'}
                    padding="none"
                    className={`${!notification.isRead ? 'border-l-4 border-gold-400' : ''}`}
                  >
                    <div className="p-6 flex gap-4">
                      <motion.div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl ${iconInfo.bg} flex items-center justify-center`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <IconComponent className={`w-6 h-6 ${iconInfo.color}`} />
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold">{notification.title}</h3>
                          {!notification.isRead && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex-shrink-0 w-2 h-2 bg-gold-400 rounded-full"
                            />
                          )}
                        </div>

                        <p className="text-text-muted mb-3">{notification.message}</p>

                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <span className="text-sm text-text-dimmed">
                            {formatTimeAgo(notification.createdAt)}
                          </span>

                          <div className="flex gap-2">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                icon={<Check className="w-4 h-4" />}
                              >
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNotification(notification.id)}
                              icon={<Trash2 className="w-4 h-4" />}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MemberNotifications;
