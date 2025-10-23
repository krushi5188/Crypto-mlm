import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const StudentEarnings = () => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [stats, setStats] = useState({
    totalEarned: 0,
    byLevel: {}
  });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const response = await studentAPI.getEarnings();
      const earningsData = response.data.data.earnings || [];
      setEarnings(earningsData);
      calculateStats(earningsData);
    } catch (error) {
      console.error('Failed to load earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (earningsData) => {
    let totalEarned = 0;
    const byLevel = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    earningsData.forEach((earning) => {
      totalEarned += earning.amount;
      if (earning.level && earning.level >= 1 && earning.level <= 5) {
        byLevel[earning.level] += earning.amount;
      }
    });

    setStats({ totalEarned, byLevel });
  };

  const filteredEarnings = selectedLevel === 'all'
    ? earnings
    : earnings.filter(e => e.level === parseInt(selectedLevel));

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading earnings...</p>
      </div>
    );
  }

  const containerStyles = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  };

  const getLevelColor = (level) => {
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'];
    return colors[level - 1] || '#a0aec0';
  };

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Earnings</h1>
        <p style={{ color: '#a0aec0' }}>Your commission history and earnings breakdown</p>
      </div>

      {/* Total Earned */}
      <Card style={{
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
        border: '2px solid #10b981'
      }}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Earned
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: '#10b981' }}>
            {formatCurrency(stats.totalEarned)} NC
          </div>
        </div>
      </Card>

      {/* Earnings by Level */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[1, 2, 3, 4, 5].map(level => (
          <Card key={level} style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#a0aec0', marginBottom: '0.5rem' }}>
              Level {level}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: getLevelColor(level) }}>
              {formatCurrency(stats.byLevel[level] || 0)} NC
            </div>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedLevel('all')}
            style={{
              padding: '0.5rem 1rem',
              background: selectedLevel === 'all' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              color: selectedLevel === 'all' ? '#fff' : '#a0aec0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            All Levels
          </button>
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level.toString())}
              style={{
                padding: '0.5rem 1rem',
                background: selectedLevel === level.toString() ? getLevelColor(level) : 'rgba(255, 255, 255, 0.1)',
                color: selectedLevel === level.toString() ? '#1a1a1a' : '#a0aec0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Level {level}
            </button>
          ))}
        </div>
      </Card>

      {/* Earnings History */}
      <Card>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Transaction History</h3>
          <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {filteredEarnings.length} {filteredEarnings.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Level</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>From</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredEarnings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
                    {earnings.length === 0
                      ? 'No earnings yet. Start building your network to earn commissions!'
                      : 'No transactions found for this filter.'}
                  </td>
                </tr>
              ) : (
                filteredEarnings.map((earning, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '1rem', color: '#a0aec0', fontSize: '0.875rem' }}>
                      {formatDateTime(earning.createdAt)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981'
                      }}>
                        {earning.type === 'referral_bonus' ? 'REFERRAL' : 'COMMISSION'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {earning.level ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          background: `${getLevelColor(earning.level)}33`,
                          color: getLevelColor(earning.level)
                        }}>
                          L{earning.level}
                        </span>
                      ) : (
                        <span style={{ color: '#a0aec0', fontSize: '0.875rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                      {earning.triggeredBy || earning.fromUser || '-'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                      +{formatCurrency(earning.amount)} NC
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StudentEarnings;
