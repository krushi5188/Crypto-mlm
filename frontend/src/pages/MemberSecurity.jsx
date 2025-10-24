import React, { useState, useEffect } from 'react';
import { gamificationAPI, authAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatTimeAgo } from '../utils/formatters';

const StudentSecurity = () => {
  const [loginHistory, setLoginHistory] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, events, 2fa

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const [summaryRes, historyRes, eventsRes, twoFARes] = await Promise.all([
        gamificationAPI.getSecuritySummary().catch(() => null),
        gamificationAPI.getLoginHistory({ limit: 20 }).catch(() => ({ data: { data: { history: [] } } })),
        gamificationAPI.getSecurityEvents({ limit: 20 }).catch(() => ({ data: { data: { events: [] } } })),
        authAPI.get2FAStatus().catch(() => null)
      ]);

      if (summaryRes) setSummary(summaryRes.data.data);
      setLoginHistory(historyRes.data.data.history);
      setSecurityEvents(eventsRes.data.data.events);
      if (twoFARes) setTwoFAStatus(twoFARes.data.data);

      setError(null);
    } catch (error) {
      console.error('Failed to load security data:', error);
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEvent = async (eventId) => {
    try {
      await gamificationAPI.resolveSecurityEvent(eventId);
      setSecurityEvents(securityEvents.map(e =>
        e.id === eventId ? { ...e, isResolved: true, resolvedAt: new Date().toISOString() } : e
      ));
    } catch (error) {
      console.error('Failed to resolve event:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'var(--success)';
      case 'medium': return 'var(--warning)';
      case 'high': return 'var(--danger)';
      case 'critical': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
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
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading security data...</p>
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
            Unable to Load Security Data
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadSecurityData} size="lg">
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
            🔒 Security
          </h1>
          <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)' }}>
            Monitor your account security and activity
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-2xl)',
          borderBottom: '2px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          {['overview', 'history', 'events', '2fa'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 'var(--space-md)',
                fontSize: 'var(--text-base)',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                textTransform: 'capitalize'
              }}
            >
              {tab === '2fa' ? '2FA' : tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && summary && (
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', marginBottom: 'var(--space-xl)' }}>
              Security Overview
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-2xl)'
            }}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                    {summary.logins.total}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Total Logins</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>
                    Last 30 days
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)', color: 'var(--success)' }}>
                    {summary.logins.successful}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Successful</div>
                </div>
              </Card>

              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)', color: 'var(--danger)' }}>
                    {summary.logins.failed}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Failed</div>
                </div>
              </Card>

              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                    {summary.logins.uniqueIPs}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Unique IPs</div>
                </div>
              </Card>
            </div>

            <Card>
              <div style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '600', marginBottom: 'var(--space-md)' }}>
                  Security Events
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-lg)'
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', marginBottom: 'var(--space-xs)' }}>
                      {summary.securityEvents.total}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Total Events</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', color: 'var(--warning)', marginBottom: 'var(--space-xs)' }}>
                      {summary.securityEvents.unresolved}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Unresolved</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', color: 'var(--danger)', marginBottom: 'var(--space-xs)' }}>
                      {summary.securityEvents.highSeverity}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>High Severity</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', marginBottom: 'var(--space-xl)' }}>
              Login History
            </h2>

            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 'var(--text-sm)'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600)' }}>IP Address</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>Device</th>
                      <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((login) => (
                      <tr key={login.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 'var(--space-md)' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: '600',
                            backgroundColor: login.success ? 'var(--success-light)' : 'var(--danger-light)',
                            color: login.success ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {login.success ? '✓ Success' : '✗ Failed'}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          {formatTimeAgo(login.createdAt)}
                        </td>
                        <td style={{ padding: 'var(--space-md)', fontFamily: 'monospace' }}>
                          {login.ipAddress}
                        </td>
                        <td style={{ padding: 'var(--space-md)' }}>
                          {login.deviceInfo?.os?.name || 'Unknown'} - {login.deviceInfo?.browser?.name || 'Unknown'}
                        </td>
                        <td style={{ padding: 'var(--space-md)', textTransform: 'capitalize' }}>
                          {login.loginMethod}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {loginHistory.length === 0 && (
              <Card>
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-3xl)',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔒</div>
                  <p>No login history found</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Security Events Tab */}
        {activeTab === 'events' && (
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', marginBottom: 'var(--space-xl)' }}>
              Security Events
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {securityEvents.map((event) => (
                <Card key={event.id}>
                  <div style={{ padding: 'var(--space-lg)' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: 'var(--space-md)',
                      gap: 'var(--space-md)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-sm)',
                          marginBottom: 'var(--space-xs)'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: '600',
                            backgroundColor: getSeverityColor(event.severity) + '20',
                            color: getSeverityColor(event.severity)
                          }}>
                            {event.severity.toUpperCase()}
                          </span>
                          {event.isResolved && (
                            <span style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--success)',
                              fontWeight: '500'
                            }}>
                              ✓ Resolved
                            </span>
                          )}
                        </div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                          {event.description}
                        </h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                          {formatTimeAgo(event.createdAt)}
                        </p>
                      </div>
                      {!event.isResolved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResolveEvent(event.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {securityEvents.length === 0 && (
              <Card>
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-3xl)',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔒</div>
                  <p>No security events found</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* 2FA Tab */}
        {activeTab === '2fa' && (
          <div>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: '600', marginBottom: 'var(--space-xl)' }}>
              Two-Factor Authentication
            </h2>

            <Card>
              <div style={{ padding: 'var(--space-xl)' }}>
                {twoFAStatus?.enabled ? (
                  <div>
                    <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: 'var(--space-lg)' }}>🔐</div>
                    <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: '600', textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                      2FA is Enabled
                    </h3>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                      Your account is protected with two-factor authentication
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: 'var(--space-lg)',
                      marginBottom: 'var(--space-xl)'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-xs)' }}>
                          Enabled
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                          {formatTimeAgo(twoFAStatus.enabledAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-xs)' }}>
                          {twoFAStatus.backupCodesRemaining}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                          Backup codes left
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <Button variant="danger">
                        Disable 2FA
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: 'var(--space-lg)' }}>🔓</div>
                    <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: '600', textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                      2FA is Disabled
                    </h3>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 'var(--space-xl)' }}>
                      Enable two-factor authentication for enhanced security
                    </p>
                    <div style={{ textAlign: 'center' }}>
                      <Button variant="primary" size="lg">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSecurity;
