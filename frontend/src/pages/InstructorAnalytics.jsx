import React, { useState, useEffect } from 'react';
import { instructorAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const InstructorAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await instructorAPI.getAnalytics();
      setAnalytics(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError(error.response?.data?.error || 'Failed to load analytics. Please ensure the database is configured.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading analytics...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Database Connection Required</h2>
            <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
              {error || 'Unable to load analytics data.'}
            </p>
            <div style={{ 
              background: 'rgba(251, 191, 36, 0.1)', 
              border: '1px solid #fbbf24', 
              borderRadius: '8px', 
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.875rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#fbbf24' }}>Setup Required:</div>
              <ol style={{ margin: '0', paddingLeft: '1.5rem', color: '#a0aec0' }}>
                <li>Create a PostgreSQL database (Supabase, Neon, or Railway)</li>
                <li>Run the schema.sql file to create tables</li>
                <li>Add database environment variables to Vercel</li>
                <li>Redeploy your application</li>
              </ol>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: '1.5rem',
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

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Analytics Dashboard</h1>
        <p style={{ color: '#a0aec0' }}>System-wide statistics and insights</p>
      </div>

      {/* Overview */}
      <div style={gridStyles}>
        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👥</div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {analytics.overview.totalParticipants}
          </div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Total Participants</div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {analytics.overview.simulationStatus === 'active' ? '▶️' : '⏸️'}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', textTransform: 'uppercase' }}>
            {analytics.overview.simulationStatus}
          </div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Platform Status</div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {analytics.overview.daysRemaining} Days
          </div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Days Active</div>
        </Card>

        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            {formatCurrency(analytics.systemTotals.totalCoinsDistributed)} USDT
          </div>
          <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Coins Distributed</div>
        </Card>
      </div>

      {/* Distribution Stats */}
      <Card title="Participant Distribution" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '0.5rem' }}>
              {analytics.distribution.zeroBalance}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ef4444' }}>
              {formatPercentage(analytics.distribution.percentZero)}
            </div>
            <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Zero Balance</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
              {analytics.distribution.brokeEven}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#f59e0b' }}>
              {formatPercentage(analytics.distribution.percentBrokeEven)}
            </div>
            <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Broke Even</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '0.5rem' }}>
              {analytics.distribution.profited}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
              {formatPercentage(analytics.distribution.percentProfited)}
            </div>
            <div style={{ color: '#a0aec0', marginTop: '0.5rem' }}>Profited</div>
          </div>
        </div>
      </Card>

      {/* Wealth Concentration */}
      <Card title="Wealth Concentration" style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.95rem', color: '#a0aec0', marginBottom: '1.5rem' }}>
          Shows how wealth is distributed across participants (demonstrates MLM inequality)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ marginBottom: '0.5rem', color: '#a0aec0' }}>Top 10% Control:</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#ef4444' }}>
              {formatPercentage(analytics.wealth.top10Percent)}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '0.5rem', color: '#a0aec0' }}>Middle 20% Control:</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
              {formatPercentage(analytics.wealth.middle20Percent)}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '0.5rem', color: '#a0aec0' }}>Bottom 70% Control:</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              {formatPercentage(analytics.wealth.bottom70Percent)}
            </div>
          </div>

          <div>
            <div style={{ marginBottom: '0.5rem', color: '#a0aec0' }}>Gini Coefficient:</div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#667eea' }}>
              {analytics.wealth.giniCoefficient}
            </div>
          </div>
        </div>
      </Card>

      {/* Top Earners */}
      <Card title="Top 10 Earners">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Username</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Balance</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Recruits</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Network</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topEarners.map((earner, index) => (
                <tr key={earner.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <td style={{ padding: '1rem' }}>#{index + 1}</td>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>{earner.username}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24', fontWeight: '600' }}>
                    {formatCurrency(earner.balance)} USDT
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{earner.directRecruits}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>{earner.networkSize}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default InstructorAnalytics;
