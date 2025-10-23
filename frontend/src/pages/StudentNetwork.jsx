import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';
import Card from '../components/common/Card';
import { formatCurrency } from '../utils/formatters';

const StudentNetwork = () => {
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all');

  useEffect(() => {
    loadNetwork();
  }, [selectedLevel]);

  const loadNetwork = async () => {
    try {
      const level = selectedLevel === 'all' ? undefined : parseInt(selectedLevel);
      const response = await studentAPI.getNetwork(level);
      setNetwork(response.data.data.downline || []);
    } catch (error) {
      console.error('Failed to load network:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spin" style={{ fontSize: '3rem' }}>⏳</div>
        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>Loading network...</p>
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

  const levelCounts = [1, 2, 3, 4, 5].map(level => ({
    level,
    count: network.filter(n => n.level === level).length
  }));

  return (
    <div style={containerStyles}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Network</h1>
        <p style={{ color: '#a0aec0' }}>Your downline structure across 5 levels</p>
      </div>

      {/* Level Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {levelCounts.map(({ level, count }) => (
          <Card key={level} style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: getLevelColor(level) }}>
              {count}
            </div>
            <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>Level {level}</div>
          </Card>
        ))}
        <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{network.length}</div>
          <div style={{ color: '#a0aec0', fontSize: '0.875rem' }}>Total</div>
        </Card>
      </div>

      {/* Filter */}
      <Card style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedLevel('all')}
            style={{
              padding: '0.5rem 1rem',
              background: selectedLevel === 'all' ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
              color: selectedLevel === 'all' ? '#1a1a1a' : '#fff',
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
                color: selectedLevel === level.toString() ? '#1a1a1a' : '#fff',
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

      {/* Network List */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Member</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Level</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Recruits</th>
              </tr>
            </thead>
            <tbody>
              {network.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: '#a0aec0' }}>
                    No downline members yet. Share your referral link to start building your network!
                  </td>
                </tr>
              ) : (
                network.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{member.displayName}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        background: `${getLevelColor(member.level)}33`,
                        color: getLevelColor(member.level)
                      }}>
                        L{member.level}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#a0aec0' }}>
                      {member.networkSize}
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

export default StudentNetwork;
