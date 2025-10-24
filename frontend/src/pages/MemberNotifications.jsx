import React, { useState, useEffect } from 'react';
import { gamificationAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatTimeAgo } from '../utils/formatters';

const MemberNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read

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

      // Apply filter
      if (filter === 'read') {
        data = data.filter(n => n.isRead);
      } else if (filter === 'unread') {
        data = data.filter(n => !n.isRead);
      }

      setNotifications(data);
      setSummary(summaryRes.data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError('Failed to load notifications');
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
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await gamificationAPI.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await gamificationAPI.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await gamificationAPI.deleteAllRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'commission_earned': return '💰';
      case 'rank_up': return '🎖️';
      case 'achievement_unlocked': return '🏆';
      case 'security_alert': return '🔒';
      case 'new_recruit': return '👥';
      case 'withdrawal_status': return '💸';
      default: return '📢';
    }
  };

  if (loading && !notifications.length) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        <div className="spin" style={{ fontSize: '4rem' }}>⏳</div>
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading notifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)'
      }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>⚠️</div>
          <h2 style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-md)', fontWeight: '600' }}>
            Unable to Load Notifications
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadNotifications} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-md)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: 'var(--text-5xl)', fontWeight: '700', marginBottom: 'var(--space-md)' }}>
            🔔 Notifications
          </h1>
          <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)' }}>
            Stay updated with your activity
          </p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-2xl)'
          }}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                  {summary.total}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Total</div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)', color: 'var(--primary)' }}>
                  {summary.unread}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Unread</div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                  {summary.read}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Read</div>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'secondary'}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'read' ? 'primary' : 'secondary'}
              onClick={() => setFilter('read')}
            >
              Read
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {summary && summary.unread > 0 && (
              <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            {summary && summary.read > 0 && (
              <Button variant="danger" size="sm" onClick={handleDeleteAllRead}>
                Delete all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {notifications.map((notification) => (
            <Card key={notification.id} style={{
              backgroundColor: notification.isRead ? 'var(--bg)' : 'var(--primary-light)',
              borderLeft: notification.isRead ? '4px solid var(--border)' : '4px solid var(--primary)'
            }}>
              <div style={{ padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-md)' }}>
                {/* Icon */}
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: 'var(--space-xs)',
                    gap: 'var(--space-md)'
                  }}>
                    <h3 style={{ fontWeight: '600', fontSize: 'var(--text-lg)' }}>
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                    )}
                  </div>

                  <p style={{
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-sm)',
                    fontSize: 'var(--text-base)'
                  }}>
                    {notification.message}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      {formatTimeAgo(notification.createdAt)}
                    </span>

                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      {!notification.isRead && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {notifications.length === 0 && (
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-3xl)',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔔</div>
              <p>No notifications found</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MemberNotifications;
