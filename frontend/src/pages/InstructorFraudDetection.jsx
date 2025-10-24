import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';

const InstructorFraudDetection = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [multiAccounts, setMultiAccounts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, flaggedRes, multiRes, alertsRes] = await Promise.all([
        instructorAPI.getFraudDashboard(),
        instructorAPI.getFlaggedUsers(),
        instructorAPI.getMultiAccounts(),
        instructorAPI.getFraudAlerts({ limit: 50 })
      ]);

      setDashboard(dashboardRes.data.data);
      setFlaggedUsers(flaggedRes.data.data.flaggedUsers || []);
      setMultiAccounts(multiRes.data.data.groups || []);
      setAlerts(alertsRes.data.data.alerts || []);
    } catch (err) {
      console.error('Failed to load fraud detection data:', err);
      setError('Failed to load fraud detection data');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagUser = async (userId) => {
    const reason = prompt('Enter reason for flagging:');
    if (!reason) return;

    try {
      await instructorAPI.flagUser(userId, reason);
      await loadData();
      alert('User flagged successfully');
    } catch (err) {
      console.error('Failed to flag user:', err);
      alert('Failed to flag user');
    }
  };

  const handleUnflagUser = async (userId) => {
    const notes = prompt('Enter review notes (optional):') || '';

    try {
      await instructorAPI.unflagUser(userId, notes);
      await loadData();
      alert('User unflagged successfully');
    } catch (err) {
      console.error('Failed to unflag user:', err);
      alert('Failed to unflag user');
    }
  };

  const handleViewUserDetails = async (userId) => {
    try {
      const response = await instructorAPI.getUserFraudDetails(userId);
      setSelectedUser(response.data.data);
    } catch (err) {
      console.error('Failed to load user details:', err);
      alert('Failed to load user details');
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'critical':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' };
      case 'high':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' };
      case 'medium':
        return { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: '#10b981' };
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}>⏳</div>
          <p style={styles.loadingText}>Loading fraud detection data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={loadData} style={styles.retryButton}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fraud Detection</h1>
        <p style={styles.subtitle}>Monitor and manage suspicious activity</p>
      </div>

      {/* Overview Stats */}
      {activeTab === 'overview' && dashboard && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🚨</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{dashboard.totalFlagged || 0}</div>
              <div style={styles.statLabel}>
                Flagged Users
                <HelpTooltip content="Users manually flagged by administrators for review due to suspicious activity or policy violations." position="top" />
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>⚠️</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{dashboard.highRiskCount || 0}</div>
              <div style={styles.statLabel}>
                High Risk
                <HelpTooltip content="Users with risk scores above 51/100. System automatically monitors these accounts for suspicious patterns." position="top" />
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔍</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{dashboard.recentAlertsCount || 0}</div>
              <div style={styles.statLabel}>
                Recent Alerts
                <HelpTooltip content="Automated alerts triggered by suspicious activity in the last 24 hours." position="top" />
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{dashboard.multiAccountGroups || 0}</div>
              <div style={styles.statLabel}>
                Multi-Account Groups
                <HelpTooltip content="Groups of accounts sharing the same IP address or device fingerprint, indicating possible multi-accounting." position="top" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.tabActive : styles.tab}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('flagged')}
          style={activeTab === 'flagged' ? styles.tabActive : styles.tab}
        >
          Flagged Users ({flaggedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('multi')}
          style={activeTab === 'multi' ? styles.tabActive : styles.tab}
        >
          Multi-Accounts ({multiAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          style={activeTab === 'alerts' ? styles.tabActive : styles.tab}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={styles.overviewContent}>
            <h2 style={styles.sectionTitle}>High Risk Users</h2>
            {dashboard?.highRiskUsers?.length > 0 ? (
              <div style={styles.userList}>
                {dashboard.highRiskUsers.map(user => (
                  <div key={user.userId} style={styles.userCard}>
                    <div style={styles.userInfo}>
                      <div style={styles.userHeader}>
                        <span style={styles.userName}>{user.email}</span>
                        <span style={{
                          ...styles.badge,
                          ...getRiskBadgeColor(user.riskLevel)
                        }}>
                          Risk: {user.riskScore}/100
                        </span>
                      </div>
                      <div style={styles.userDetails}>
                        <span style={styles.userDetail}>🆔 ID: {user.userId}</span>
                        {user.isFlagged && <span style={styles.flaggedBadge}>⚠️ Flagged</span>}
                      </div>
                    </div>
                    <div style={styles.userActions}>
                      <button
                        onClick={() => handleViewUserDetails(user.userId)}
                        style={styles.actionButton}
                      >
                        View Details
                      </button>
                      {!user.isFlagged && (
                        <button
                          onClick={() => handleFlagUser(user.userId)}
                          style={styles.flagButton}
                        >
                          Flag User
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No high-risk users detected</p>
              </div>
            )}

            <h2 style={styles.sectionTitle}>Recent Events</h2>
            {dashboard?.recentEvents?.length > 0 ? (
              <div style={styles.eventsList}>
                {dashboard.recentEvents.map((event, index) => (
                  <div key={index} style={styles.eventCard}>
                    <div style={styles.eventIcon}>📌</div>
                    <div style={styles.eventContent}>
                      <div style={styles.eventTitle}>{event.eventType}</div>
                      <div style={styles.eventDetails}>
                        User #{event.userId} • {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>No recent events</p>
              </div>
            )}
          </div>
        )}

        {/* Flagged Users Tab */}
        {activeTab === 'flagged' && (
          <div>
            {flaggedUsers.length > 0 ? (
              <div style={styles.userList}>
                {flaggedUsers.map(user => (
                  <div key={user.id} style={styles.userCard}>
                    <div style={styles.userInfo}>
                      <div style={styles.userHeader}>
                        <span style={styles.userName}>{user.email}</span>
                        <span style={{
                          ...styles.badge,
                          ...getRiskBadgeColor(user.riskLevel)
                        }}>
                          Risk: {user.riskScore}/100
                        </span>
                      </div>
                      <div style={styles.userDetails}>
                        <span style={styles.userDetail}>🚩 Reason: {user.flaggedReason}</span>
                        <span style={styles.userDetail}>
                          📅 Flagged: {new Date(user.flaggedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={styles.userActions}>
                      <button
                        onClick={() => handleViewUserDetails(user.id)}
                        style={styles.actionButton}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleUnflagUser(user.id)}
                        style={styles.unflagButton}
                      >
                        Unflag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✅</div>
                <p style={styles.emptyText}>No flagged users</p>
              </div>
            )}
          </div>
        )}

        {/* Multi-Accounts Tab */}
        {activeTab === 'multi' && (
          <div>
            {multiAccounts.length > 0 ? (
              <div style={styles.groupsList}>
                {multiAccounts.map((group, index) => (
                  <div key={index} style={styles.groupCard}>
                    <div style={styles.groupHeader}>
                      <h3 style={styles.groupTitle}>
                        {group.type === 'ip' ? '🌐 Shared IP Address' : '📱 Shared Device'}
                      </h3>
                      <span style={styles.groupCount}>{group.userCount} accounts</span>
                    </div>
                    <div style={styles.groupDetails}>
                      <p style={styles.groupInfo}>
                        <strong>Identifier:</strong> {group.identifier}
                      </p>
                      <p style={styles.groupInfo}>
                        <strong>Users:</strong> {group.users.map(u => u.email).join(', ')}
                      </p>
                      <p style={styles.groupInfo}>
                        <strong>First Seen:</strong> {new Date(group.firstSeen).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={styles.groupActions}>
                      {group.users.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleViewUserDetails(user.id)}
                          style={styles.actionButton}
                        >
                          View {user.email}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✅</div>
                <p style={styles.emptyText}>No multi-account patterns detected</p>
              </div>
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div>
            {alerts.length > 0 ? (
              <div style={styles.alertsList}>
                {alerts.map(alert => {
                  const colors = getRiskBadgeColor(alert.severity);
                  return (
                    <div key={alert.id} style={{
                      ...styles.alertCard,
                      borderLeft: `4px solid ${colors.color}`
                    }}>
                      <div style={styles.alertHeader}>
                        <span style={styles.alertType}>{alert.alertType}</span>
                        <span style={{
                          ...styles.badge,
                          ...colors
                        }}>
                          {alert.severity}
                        </span>
                      </div>
                      <p style={styles.alertMessage}>{alert.message}</p>
                      <div style={styles.alertFooter}>
                        <span style={styles.alertUser}>User #{alert.userId}</span>
                        <span style={styles.alertTime}>
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✅</div>
                <p style={styles.emptyText}>No alerts</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>User Fraud Details</h2>
              <button onClick={() => setSelectedUser(null)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailSection}>
                <h3 style={styles.detailTitle}>User Information</h3>
                <p style={styles.detailText}>
                  <strong>Email:</strong> {selectedUser.user?.email}
                </p>
                <p style={styles.detailText}>
                  <strong>Username:</strong> {selectedUser.user?.username}
                </p>
                <p style={styles.detailText}>
                  <strong>Risk Score:</strong> {selectedUser.riskScore}/100 ({selectedUser.riskLevel})
                </p>
                {selectedUser.user?.isFlagged && (
                  <p style={styles.detailText}>
                    <strong>Flagged:</strong> {selectedUser.user.flaggedReason}
                  </p>
                )}
              </div>

              {selectedUser.evidence && selectedUser.evidence.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailTitle}>Risk Evidence</h3>
                  <ul style={styles.evidenceList}>
                    {selectedUser.evidence.map((item, index) => (
                      <li key={index} style={styles.evidenceItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedUser.devices && selectedUser.devices.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailTitle}>Devices</h3>
                  {selectedUser.devices.map((device, index) => (
                    <div key={index} style={styles.deviceCard}>
                      <p style={styles.detailText}>
                        <strong>Browser:</strong> {device.browser || 'Unknown'}
                      </p>
                      <p style={styles.detailText}>
                        <strong>OS:</strong> {device.os || 'Unknown'}
                      </p>
                      <p style={styles.detailText}>
                        <strong>Logins:</strong> {device.loginCount}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser.ipAddresses && selectedUser.ipAddresses.length > 0 && (
                <div style={styles.detailSection}>
                  <h3 style={styles.detailTitle}>IP Addresses</h3>
                  {selectedUser.ipAddresses.map((ip, index) => (
                    <div key={index} style={styles.ipCard}>
                      <p style={styles.detailText}>
                        <strong>IP:</strong> {ip.ipAddress}
                      </p>
                      <p style={styles.detailText}>
                        <strong>Location:</strong> {ip.location || 'Unknown'}
                      </p>
                      <p style={styles.detailText}>
                        <strong>Logins:</strong> {ip.loginCount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.modalActions}>
              {!selectedUser.user?.isFlagged ? (
                <button
                  onClick={() => {
                    handleFlagUser(selectedUser.user.id);
                    setSelectedUser(null);
                  }}
                  style={styles.flagButton}
                >
                  Flag User
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleUnflagUser(selectedUser.user.id);
                    setSelectedUser(null);
                  }}
                  style={styles.unflagButton}
                >
                  Unflag User
                </button>
              )}
              <button onClick={() => setSelectedUser(null)} style={styles.cancelButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: 'var(--space-lg)',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: 'var(--space-lg)'
  },
  title: {
    fontSize: 'var(--text-4xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted)'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: 'var(--space-md)'
  },
  spinner: {
    fontSize: '3rem',
    animation: 'pulse 2s ease-in-out infinite'
  },
  loadingText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted)'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-3xl)'
  },
  errorText: {
    fontSize: 'var(--text-base)',
    color: '#ef4444'
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-lg)'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--transition-base)'
  },
  statIcon: {
    fontSize: '2.5rem'
  },
  statContent: {
    flex: 1
  },
  statValue: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem'
  },
  statLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  tabs: {
    display: 'flex',
    gap: 'var(--space-xs)',
    marginBottom: 'var(--space-lg)',
    borderBottom: '2px solid var(--glass-border)'
  },
  tab: {
    padding: 'var(--space-md) var(--space-lg)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: 'var(--text-muted)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    marginBottom: '-2px'
  },
  tabActive: {
    padding: 'var(--space-md) var(--space-lg)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid var(--primary-gold)',
    color: 'var(--primary-gold)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '-2px'
  },
  tabContent: {
    minHeight: '400px'
  },
  overviewContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xl)'
  },
  sectionTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)'
  },
  userList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    transition: 'all var(--transition-base)'
  },
  userInfo: {
    flex: 1
  },
  userHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-sm)'
  },
  userName: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '700',
    border: '1px solid'
  },
  userDetails: {
    display: 'flex',
    gap: 'var(--space-md)',
    flexWrap: 'wrap'
  },
  userDetail: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)'
  },
  flaggedBadge: {
    fontSize: 'var(--text-sm)',
    color: '#ef4444',
    fontWeight: '600'
  },
  userActions: {
    display: 'flex',
    gap: 'var(--space-sm)'
  },
  actionButton: {
    padding: '0.5rem 1rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  },
  flagButton: {
    padding: '0.5rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#ef4444',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  },
  unflagButton: {
    padding: '0.5rem 1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: '#10b981',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-3xl)',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: 'var(--space-md)'
  },
  emptyText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-muted)'
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  eventCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)'
  },
  eventIcon: {
    fontSize: '1.5rem'
  },
  eventContent: {
    flex: 1
  },
  eventTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.25rem'
  },
  eventDetails: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)'
  },
  groupsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  groupCard: {
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)'
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-md)'
  },
  groupTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  groupCount: {
    padding: '0.25rem 0.75rem',
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: 'var(--radius-sm)',
    color: '#f59e0b',
    fontSize: 'var(--text-sm)',
    fontWeight: '700'
  },
  groupDetails: {
    marginBottom: 'var(--space-md)'
  },
  groupInfo: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    marginBottom: '0.5rem'
  },
  groupActions: {
    display: 'flex',
    gap: 'var(--space-sm)',
    flexWrap: 'wrap'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  alertCard: {
    padding: 'var(--space-lg)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-sm)'
  },
  alertType: {
    fontSize: 'var(--text-base)',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  alertMessage: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    marginBottom: 'var(--space-sm)'
  },
  alertFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)'
  },
  alertUser: {},
  alertTime: {},
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 'var(--space-md)'
  },
  modal: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-lg)',
    borderBottom: '1px solid var(--glass-border)'
  },
  modalTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--text-primary)'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: 'var(--text-2xl)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)'
  },
  modalContent: {
    flex: 1,
    overflowY: 'auto',
    padding: 'var(--space-lg)'
  },
  detailSection: {
    marginBottom: 'var(--space-lg)'
  },
  detailTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-sm)'
  },
  detailText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem'
  },
  evidenceList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  evidenceItem: {
    padding: 'var(--space-sm)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-sm)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  deviceCard: {
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-sm)'
  },
  ipCard: {
    padding: 'var(--space-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--space-sm)'
  },
  modalActions: {
    display: 'flex',
    gap: 'var(--space-sm)',
    justifyContent: 'flex-end',
    padding: 'var(--space-lg)',
    borderTop: '1px solid var(--glass-border)'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  }
};

export default InstructorFraudDetection;
