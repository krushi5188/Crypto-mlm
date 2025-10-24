import React, { useState, useEffect } from 'react';
import { memberAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatTimeAgo } from '../utils/formatters';

const MemberDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await memberAPI.getDashboard();
      setData(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard. Please ensure the database is configured.');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
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
            Unable to Load Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error || 'Unable to load dashboard data.'}
          </p>
          <Button onClick={() => window.location.reload()} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-md)' }}>
      {/* Hero Section - Large Welcome */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div className="fade-in" style={{ maxWidth: '800px' }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '700',
            letterSpacing: '-0.02em'
          }}>
            Your Dashboard
          </h1>
          <p style={{ 
            fontSize: 'var(--text-xl)', 
            color: 'var(--text-muted)',
            lineHeight: '1.6'
          }}>
            Track your earnings, network growth, and manage your referrals
          </p>
        </div>
      </div>

      {/* Stats - Huge Numbers */}
      <div className="container" style={{ marginBottom: 'var(--space-3xl)' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-xl)'
        }}>
          <div className="fade-in-up delay-100" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'clamp(3rem, 6vw, 5rem)', 
              fontWeight: '700',
              marginBottom: 'var(--space-sm)',
              background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {formatCurrency(data.balance)}
            </div>
            <div style={{ 
              fontSize: 'var(--text-xl)', 
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xs)'
            }}>
              USDT
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              Current Balance
            </div>
          </div>

          <div className="fade-in-up delay-200" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'clamp(3rem, 6vw, 5rem)', 
              fontWeight: '700',
              marginBottom: 'var(--space-sm)',
              color: 'var(--text-primary)'
            }}>
              {formatCurrency(data.totalEarned)}
            </div>
            <div style={{ 
              fontSize: 'var(--text-xl)', 
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xs)'
            }}>
              USDT
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              Total Earned
            </div>
          </div>

          <div className="fade-in-up delay-300" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'clamp(3rem, 6vw, 5rem)', 
              fontWeight: '700',
              marginBottom: 'var(--space-sm)',
              color: 'var(--text-primary)'
            }}>
              {data.directRecruits}
            </div>
            <div style={{ 
              fontSize: 'var(--text-xl)', 
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xs)'
            }}>
              Direct
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              Recruits
            </div>
          </div>

          <div className="fade-in-up delay-400" style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: 'clamp(3rem, 6vw, 5rem)', 
              fontWeight: '700',
              marginBottom: 'var(--space-sm)',
              color: 'var(--text-primary)'
            }}>
              {data.networkSize}
            </div>
            <div style={{ 
              fontSize: 'var(--text-xl)', 
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-xs)'
            }}>
              Total
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-dimmed)' }}>
              Network Size
            </div>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="container-narrow" style={{ marginBottom: 'var(--space-3xl)' }}>
        <Card className="fade-in-up delay-100">
          <h2 style={{ 
            fontSize: 'var(--text-3xl)', 
            marginBottom: 'var(--space-md)',
            fontWeight: '600',
            letterSpacing: '-0.01em'
          }}>
            Share Your Referral Link
          </h2>
          <p style={{ 
            color: 'var(--text-muted)', 
            marginBottom: 'var(--space-xl)', 
            fontSize: 'var(--text-lg)',
            lineHeight: '1.7'
          }}>
            Invite others to join your network and earn commissions automatically
          </p>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: 'var(--space-lg)'
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 'var(--text-base)',
              wordBreak: 'break-all',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-md)'
            }}>
              {data.referralLink}
            </div>
            <Button onClick={copyReferralLink} variant="secondary" fullWidth>
              {copied ? '✓ Copied to Clipboard' : 'Copy Referral Link'}
            </Button>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-sm)',
            fontSize: 'var(--text-base)',
            color: 'var(--text-muted)'
          }}>
            <span>Your referral code:</span>
            <span style={{ 
              color: 'var(--primary-gold)', 
              fontWeight: '600',
              fontSize: 'var(--text-lg)',
              letterSpacing: '0.05em'
            }}>
              {data.referralCode}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="container-narrow">
        <h2 style={{ 
          fontSize: 'var(--text-3xl)', 
          marginBottom: 'var(--space-xl)',
          fontWeight: '600',
          letterSpacing: '-0.01em'
        }}>
          Recent Activity
        </h2>

        {data.recentActivity.length === 0 ? (
          <div className="fade-in-up" style={{ 
            textAlign: 'center', 
            padding: 'var(--space-3xl)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📊</div>
            <p style={{ 
              color: 'var(--text-muted)', 
              fontSize: 'var(--text-lg)',
              lineHeight: '1.6'
            }}>
              No activity yet. Start by inviting others to join your network!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {data.recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className={`fade-in-up delay-${Math.min(index * 100, 500)}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-lg)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  transition: 'all var(--transition-base)',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '500',
                    fontSize: 'var(--text-lg)',
                    marginBottom: 'var(--space-xs)',
                    color: 'var(--text-primary)'
                  }}>
                    {activity.description}
                  </div>
                  <div style={{ 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-dimmed)'
                  }}>
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
                <div style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: '700',
                  color: 'var(--accent-green)'
                }}>
                  +{formatCurrency(activity.amount)} USDT
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
