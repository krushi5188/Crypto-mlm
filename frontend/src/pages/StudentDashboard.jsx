import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency, formatTimeAgo } from '../utils/formatters';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await studentAPI.getDashboard();
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
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Unable to Load Dashboard</h2>
            <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
              {error || 'Unable to load dashboard data.'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: '#fbbf24',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '2rem'
  };

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  };

  const statCardStyles = {
    textAlign: 'center',
    padding: '2rem'
  };

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }} className="fade-in">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: '#a0aec0' }}>Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div style={gridStyles}>
        <Card style={statCardStyles} className="fade-in-up delay-100">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
            {formatCurrency(data.balance)} USDT
          </div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Current Balance</div>
        </Card>

        <Card style={statCardStyles} className="fade-in-up delay-200">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {formatCurrency(data.totalEarned)} USDT
          </div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Total Earned</div>
        </Card>

        <Card style={statCardStyles} className="fade-in-up delay-300">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{data.directRecruits}</div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Direct Recruits</div>
        </Card>

        <Card style={statCardStyles} className="fade-in-up delay-400">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌐</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>{data.networkSize}</div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Network Size</div>
        </Card>
      </div>

      {/* Referral Link */}
      <Card style={{ marginBottom: '2rem' }} className="fade-in-up delay-100">
        <h3 style={{ marginBottom: '1rem' }}>Share Your Referral Link</h3>
        <p style={{ color: '#a0aec0', marginBottom: '1rem', fontSize: '0.95rem' }}>
          Invite others to join your network and earn commissions!
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            minWidth: '300px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '1rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            wordBreak: 'break-all'
          }}>
            {data.referralLink}
          </div>
          <Button onClick={copyReferralLink} variant="secondary">
            {copied ? '✓ Copied!' : 'Copy Link'}
          </Button>
        </div>

        <div style={{ marginTop: '1rem', color: '#a0aec0', fontSize: '0.875rem' }}>
          Your referral code: <span style={{ color: '#fbbf24', fontWeight: '600' }}>{data.referralCode}</span>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity" className="fade-in-up delay-200">
        {data.recentActivity.length === 0 ? (
          <p style={{ color: '#a0aec0', textAlign: 'center', padding: '2rem' }}>
            No activity yet. Start by inviting others to join your network!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500' }}>{activity.description}</div>
                  <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginTop: '0.25rem' }}>
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#10b981'
                }}>
                  +{formatCurrency(activity.amount)} USDT
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentDashboard;
