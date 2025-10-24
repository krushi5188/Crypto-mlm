import React, { useState, useEffect } from 'react';
import { gamificationAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatCurrency } from '../utils/formatters';

const StudentLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('earners'); // earners, recruiters, fastest
  const [period, setPeriod] = useState('all_time'); // all_time, weekly, monthly

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, period]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, period };

      let data;
      if (activeTab === 'earners') {
        const res = await gamificationAPI.getTopEarners(params);
        data = res.data.data.leaderboard;
      } else if (activeTab === 'recruiters') {
        const res = await gamificationAPI.getTopRecruiters(params);
        data = res.data.data.leaderboard;
      } else {
        const res = await gamificationAPI.getFastestGrowing(params);
        data = res.data.data.leaderboard;
      }

      setLeaderboard(data);

      // Get user position
      const posRes = await gamificationAPI.getUserPosition({
        type: activeTab,
        period
      });
      setUserPosition(posRes.data.data);

      setError(null);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

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
            Unable to Load Leaderboard
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadLeaderboard} size="lg">
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
            🏅 Leaderboard
          </h1>
          <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)' }}>
            See how you rank against other members
          </p>
        </div>

        {/* User Position Card */}
        {userPosition && (
          <Card style={{ marginBottom: 'var(--space-2xl)', background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)' }}>
            <div style={{ padding: 'var(--space-lg)', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 'var(--space-xs)' }}>
                    Your Position
                  </div>
                  <div style={{ fontSize: 'var(--text-4xl)', fontWeight: '700' }}>
                    {getRankMedal(userPosition.position)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-sm)', opacity: 0.9, marginBottom: 'var(--space-xs)' }}>
                    Your {activeTab === 'earners' ? 'Earnings' : activeTab === 'recruiters' ? 'Recruits' : 'Growth'}
                  </div>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '700' }}>
                    {activeTab === 'earners' ? formatCurrency(userPosition.value) : userPosition.value}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap'
        }}>
          <Button
            variant={activeTab === 'earners' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('earners')}
          >
            💰 Top Earners
          </Button>
          <Button
            variant={activeTab === 'recruiters' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('recruiters')}
          >
            👥 Top Recruiters
          </Button>
          <Button
            variant={activeTab === 'fastest' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('fastest')}
            disabled={period === 'all_time'}
          >
            🚀 Fastest Growing
          </Button>
        </div>

        {/* Period Filter */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap'
        }}>
          <Button
            variant={period === 'all_time' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriod('all_time')}
          >
            All Time
          </Button>
          <Button
            variant={period === 'monthly' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriod('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={period === 'weekly' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </Button>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-3xl)',
            color: 'var(--text-muted)'
          }}>
            <div className="spin" style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⏳</div>
            <p>Loading leaderboard...</p>
          </div>
        ) : (
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--text-sm)'
              }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>Rank</th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>User</th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'left', fontWeight: '600' }}>Badge</th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'right', fontWeight: '600' }}>
                      {activeTab === 'earners' ? 'Earnings' : activeTab === 'recruiters' ? 'Recruits' : 'New Members'}
                    </th>
                    <th style={{ padding: 'var(--space-md)', textAlign: 'right', fontWeight: '600' }}>Network</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard && leaderboard.map((entry) => (
                    <tr key={entry.userId} style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.2s'
                    }}>
                      <td style={{ padding: 'var(--space-md)', fontWeight: '600', fontSize: 'var(--text-lg)' }}>
                        {getRankMedal(entry.rank)}
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        <div style={{ fontWeight: '500' }}>{entry.username}</div>
                      </td>
                      <td style={{ padding: 'var(--space-md)' }}>
                        {entry.currentRank && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--space-xs)',
                            padding: 'var(--space-xs) var(--space-sm)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: entry.currentRank.color + '20',
                            color: entry.currentRank.color,
                            fontSize: 'var(--text-xs)',
                            fontWeight: '600'
                          }}>
                            {entry.currentRank.icon} {entry.currentRank.name}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'right', fontWeight: '600' }}>
                        {activeTab === 'earners'
                          ? formatCurrency(entry.earnings)
                          : activeTab === 'recruiters'
                          ? entry.recruitCount
                          : entry.newMembers
                        }
                      </td>
                      <td style={{ padding: 'var(--space-md)', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {entry.networkSize || entry.totalNetworkSize}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {leaderboard && leaderboard.length === 0 && (
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-3xl)',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🏅</div>
              <p>No entries yet for this leaderboard</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentLeaderboard;
