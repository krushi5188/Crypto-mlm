import React, { useState, useEffect, useRef } from 'react';
import { gamificationAPI } from '../services/api';
import { formatTimeAgo } from '../utils/formatters';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await gamificationAPI.getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadNotifications = async () => {
    if (notifications.length > 0) return; // Already loaded

    setLoading(true);
    try {
      const res = await gamificationAPI.getNotifications({ limit: 10, includeRead: false });
      setNotifications(res.data.data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await gamificationAPI.markAsRead(id);
      setNotifications(notifications.filter(n => n.id !== id));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await gamificationAPI.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
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

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--space-sm)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={{ fontSize: '1.5rem' }}>🔔</span>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: 'var(--danger)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: '700',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '380px',
          maxWidth: '90vw',
          backgroundColor: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            padding: 'var(--space-md)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontWeight: '600', fontSize: 'var(--text-lg)' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  padding: 'var(--space-xs) var(--space-sm)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '500'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{
            overflowY: 'auto',
            flex: 1
          }}>
            {loading ? (
              <div style={{
                padding: 'var(--space-xl)',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <div className="spin" style={{ fontSize: '2rem' }}>⏳</div>
                <p style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                padding: 'var(--space-xl)',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🔔</div>
                <p style={{ fontSize: 'var(--text-sm)' }}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: 'var(--space-md)',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                >
                  <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: 'var(--text-sm)',
                        marginBottom: 'var(--space-xs)'
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--space-xs)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.message}
                      </div>
                      <div style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)'
                      }}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: 'var(--space-md)',
              borderTop: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <Link
                to="/gamification/notifications"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500'
                }}
                onClick={() => setIsOpen(false)}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
