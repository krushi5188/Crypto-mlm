import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const MemberApiKeys = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    key_name: '',
    rate_limit_per_hour: 1000,
    expires_at: '',
    permissions: []
  });
  const [createdKey, setCreatedKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [keyStats, setKeyStats] = useState(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await memberAPI.getApiKeys();
      setApiKeys(response.data.data.keys);
      setError(null);
    } catch (error) {
      console.error('Failed to load API keys:', error);
      setError(error.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const response = await memberAPI.createApiKey(newKeyData);
      setCreatedKey(response.data.data.apiKey);
      setShowCreateForm(false);
      setNewKeyData({
        key_name: '',
        rate_limit_per_hour: 1000,
        expires_at: '',
        permissions: []
      });
      loadApiKeys();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    try {
      await memberAPI.deleteApiKey(keyId);
      alert('API key deleted successfully');
      loadApiKeys();
      if (selectedKey?.id === keyId) {
        setSelectedKey(null);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete API key');
    }
  };

  const handleViewStats = async (key) => {
    setSelectedKey(key);
    try {
      const response = await memberAPI.getApiKeyStats(key.id);
      setKeyStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading API keys...</p>
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
            Unable to Load API Keys
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadApiKeys} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-md)' }}>
      {/* Header */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="fade-in" style={{ maxWidth: '800px', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            API Keys
          </h1>
          <p style={{
            fontSize: 'var(--text-xl)',
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            Manage API keys for external integrations and programmatic access
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)} size="lg">
          + Create New API Key
        </Button>
      </div>

      {/* Info Card */}
      <div className="container-narrow" style={{ marginBottom: 'var(--space-3xl)' }}>
        <Card className="fade-in-up delay-100" style={{
          background: 'rgba(var(--accent-blue-rgb), 0.1)',
          borderColor: 'rgba(var(--accent-blue-rgb), 0.2)'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ fontSize: '2rem' }}>ℹ️</div>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                API Key Security
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                API keys provide full access to your account. Keep them secure and never share them publicly.
                The API secret is only shown once after creation.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* API Keys List */}
      <div className="container-narrow">
        {apiKeys.length === 0 ? (
          <div className="fade-in-up" style={{
            textAlign: 'center',
            padding: 'var(--space-3xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔑</div>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: 'var(--text-lg)',
              lineHeight: '1.6'
            }}>
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {apiKeys.map((key, index) => (
              <div
                key={key.id}
                className={`fade-in-up delay-${Math.min(index * 100, 500)}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: 'var(--space-xl)',
                  transition: 'all var(--transition-base)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                  <div>
                    <h3 style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-sm)',
                      color: 'var(--text-primary)'
                    }}>
                      {key.key_name}
                    </h3>
                    <div style={{
                      display: 'inline-block',
                      padding: 'var(--space-xs) var(--space-sm)',
                      background: key.is_active ? 'rgba(var(--accent-green-rgb), 0.1)' : 'rgba(255, 0, 0, 0.1)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      color: key.is_active ? 'var(--accent-green)' : '#ff4444'
                    }}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewStats(key)}
                    >
                      View Stats
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-xs)'
                  }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>API Key:</span>
                    <button
                      onClick={() => copyToClipboard(key.api_key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-gold)',
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    wordBreak: 'break-all'
                  }}>
                    {key.api_key}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--space-md)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)'
                }}>
                  <div>
                    <div style={{ marginBottom: 'var(--space-xs)' }}>Rate Limit:</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {key.rate_limit_per_hour}/hour
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 'var(--space-xs)' }}>Last Used:</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {formatDate(key.last_used_at)}
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 'var(--space-xs)' }}>Expires:</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 'var(--space-xs)' }}>Created:</div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                      {formatDate(key.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
            zIndex: 1000
          }}
          onClick={() => setShowCreateForm(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              maxWidth: '600px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: '600',
              marginBottom: 'var(--space-xl)',
              color: 'var(--text-primary)'
            }}>
              Create New API Key
            </h2>

            <form onSubmit={handleCreateKey} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--text-muted)'
                }}>
                  Key Name *
                </label>
                <input
                  type="text"
                  required
                  value={newKeyData.key_name}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, key_name: e.target.value }))}
                  placeholder="My API Key"
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--text-muted)'
                }}>
                  Rate Limit (requests/hour)
                </label>
                <input
                  type="number"
                  value={newKeyData.rate_limit_per_hour}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, rate_limit_per_hour: parseInt(e.target.value) }))}
                  min="100"
                  max="10000"
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-sm)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: '500',
                  color: 'var(--text-muted)'
                }}>
                  Expiration Date (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newKeyData.expires_at}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, expires_at: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-md)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--text-base)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>
                  Create API Key
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Key Modal */}
      {createdKey && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
            zIndex: 1000
          }}
          onClick={() => setCreatedKey(null)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              maxWidth: '700px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎉</div>
              <h2 style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: '600',
                marginBottom: 'var(--space-sm)',
                color: 'var(--text-primary)'
              }}>
                API Key Created!
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-base)' }}>
                Save your API secret now - it won't be shown again!
              </p>
            </div>

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{
                background: 'rgba(255, 215, 0, 0.1)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                marginBottom: 'var(--space-md)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-sm)'
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>API Key:</span>
                  <button
                    onClick={() => copyToClipboard(createdKey.api_key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-gold)',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  padding: 'var(--space-md)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {createdKey.api_key}
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 0, 0, 0.1)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 0, 0, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-sm)'
                }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: '500' }}>API Secret:</span>
                  <button
                    onClick={() => copyToClipboard(createdKey.api_secret)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-gold)',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Copy
                  </button>
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  padding: 'var(--space-md)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  {createdKey.api_secret}
                </div>
              </div>
            </div>

            <Button onClick={() => setCreatedKey(null)} variant="primary" fullWidth>
              I've Saved the Secret
            </Button>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedKey && keyStats && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
            zIndex: 1000
          }}
          onClick={() => { setSelectedKey(null); setKeyStats(null); }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              maxWidth: '600px',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: '600',
              marginBottom: 'var(--space-xl)',
              color: 'var(--text-primary)'
            }}>
              {selectedKey.key_name} - Statistics
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-xl)'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>
                  {keyStats.total_requests || 0}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Total Requests</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>
                  {keyStats.successful_requests || 0}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Successful</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>
                  {keyStats.failed_requests || 0}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Failed</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: 'var(--space-lg)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700', marginBottom: 'var(--space-xs)' }}>
                  {parseFloat(keyStats.avg_response_time || 0).toFixed(0)}ms
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Avg Response Time</div>
              </div>
            </div>

            <Button onClick={() => { setSelectedKey(null); setKeyStats(null); }} variant="secondary" fullWidth>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberApiKeys;
