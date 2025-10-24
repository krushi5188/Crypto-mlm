import React, { useState, useEffect } from 'react';
import { gamificationAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const StudentAchievements = () => {
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unlocked, locked

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const [progressRes, summaryRes] = await Promise.all([
        gamificationAPI.getAchievementProgress(),
        gamificationAPI.getAchievementSummary()
      ]);

      setProgress(progressRes.data.data.progress);
      setSummary(summaryRes.data.data);
      setError(null);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      setError('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    if (filter === 'unlocked') {
      return progress.filter(a => a.unlocked);
    } else if (filter === 'locked') {
      return progress.filter(a => !a.unlocked);
    }
    return progress;
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
        <p style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Loading achievements...</p>
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
            Unable to Load Achievements
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', fontSize: 'var(--text-lg)' }}>
            {error}
          </p>
          <Button onClick={loadAchievements} size="lg">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const filteredAchievements = getFilteredAchievements();

  return (
    <div style={{ padding: 'var(--space-xl) var(--space-md)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1 style={{ fontSize: 'var(--text-5xl)', fontWeight: '700', marginBottom: 'var(--space-md)' }}>
            🏆 Achievements
          </h1>
          <p style={{ fontSize: 'var(--text-xl)', color: 'var(--text-muted)' }}>
            Track your progress and unlock rewards
          </p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-2xl)'
          }}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                  {summary.totalUnlocked}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Unlocked</div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                  {summary.totalAvailable}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Total</div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                  {summary.totalPoints}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Points</div>
              </div>
            </Card>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-sm)' }}>
                  {summary.completionPercent}%
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Complete</div>
              </div>
            </Card>
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
          flexWrap: 'wrap'
        }}>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setFilter('all')}
          >
            All ({progress.length})
          </Button>
          <Button
            variant={filter === 'unlocked' ? 'primary' : 'secondary'}
            onClick={() => setFilter('unlocked')}
          >
            Unlocked ({progress.filter(a => a.unlocked).length})
          </Button>
          <Button
            variant={filter === 'locked' ? 'primary' : 'secondary'}
            onClick={() => setFilter('locked')}
          >
            Locked ({progress.filter(a => !a.unlocked).length})
          </Button>
        </div>

        {/* Achievements Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {filteredAchievements.map((achievement) => (
            <Card key={achievement.id}>
              <div style={{
                padding: 'var(--space-lg)',
                opacity: achievement.unlocked ? 1 : 0.6
              }}>
                {/* Icon and Title */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  marginBottom: 'var(--space-md)'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    filter: achievement.unlocked ? 'none' : 'grayscale(100%)'
                  }}>
                    {achievement.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: '600',
                      marginBottom: 'var(--space-xs)'
                    }}>
                      {achievement.name}
                    </h3>
                    {achievement.unlocked && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-xs)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--success)',
                        fontWeight: '500'
                      }}>
                        ✓ Unlocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-md)',
                  fontSize: 'var(--text-sm)'
                }}>
                  {achievement.description}
                </p>

                {/* Progress Bar */}
                {!achievement.unlocked && (
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--space-xs)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontWeight: '600' }}>{achievement.progress}%</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--border)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${achievement.progress}%`,
                        height: '100%',
                        backgroundColor: 'var(--primary)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      marginTop: 'var(--space-xs)'
                    }}>
                      {achievement.progressText}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 'var(--space-md)',
                  borderTop: '1px solid var(--border)'
                }}>
                  <span style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-muted)',
                    textTransform: 'capitalize'
                  }}>
                    {achievement.category}
                  </span>
                  <span style={{
                    fontWeight: '600',
                    color: achievement.badgeColor,
                    fontSize: 'var(--text-sm)'
                  }}>
                    +{achievement.points} pts
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-3xl)',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🏆</div>
              <p>No achievements found for this filter</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentAchievements;
