import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const StudentAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAchievements();
    loadLeaderboard();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/student/achievements');
      setAchievements(response.data.achievements);
      setTotalPoints(response.data.totalPoints);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await apiService.get('/student/achievements/leaderboard?limit=10');
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      setChecking(true);
      const response = await apiService.post('/student/achievements/check');
      setMessage(response.data.message);
      setTimeout(() => setMessage(''), 5000);

      if (response.data.newAchievements.length > 0) {
        await loadAchievements();
        await loadLeaderboard();
      }
    } catch (error) {
      setMessage('Failed to check achievements');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setChecking(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'recruiting', name: 'Recruiting', icon: '👥' },
    { id: 'earnings', name: 'Earnings', icon: '💰' },
    { id: 'network', name: 'Network', icon: '🌐' }
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const completionRate = Math.round((unlockedCount / achievements.length) * 100) || 0;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading achievements...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Achievements</h1>
          <p style={styles.subtitle}>Unlock achievements to earn points and climb the leaderboard</p>
        </div>
        <button
          style={styles.checkButton}
          onClick={checkAchievements}
          disabled={checking}
        >
          {checking ? 'Checking...' : '🔄 Check for New Achievements'}
        </button>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏆</div>
          <div>
            <div style={styles.statValue}>{totalPoints}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div>
            <div style={styles.statValue}>{unlockedCount}/{achievements.length}</div>
            <div style={styles.statLabel}>Achievements Unlocked</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div>
            <div style={styles.statValue}>{completionRate}%</div>
            <div style={styles.statLabel}>Completion Rate</div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.mainSection}>
          <div style={styles.categoryTabs}>
            {categories.map(category => (
              <button
                key={category.id}
                style={{
                  ...styles.categoryTab,
                  ...(selectedCategory === category.id ? styles.categoryTabActive : {})
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span style={styles.categoryIcon}>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          <div style={styles.achievementsGrid}>
            {filteredAchievements.map(achievement => (
              <div
                key={achievement.id}
                style={{
                  ...styles.achievementCard,
                  ...(achievement.is_unlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked)
                }}
              >
                <div style={styles.achievementIcon}>
                  {achievement.is_unlocked ? achievement.icon : '🔒'}
                </div>
                <div style={styles.achievementContent}>
                  <div style={styles.achievementName}>
                    {achievement.is_unlocked ? achievement.name : '???'}
                  </div>
                  <div style={styles.achievementDescription}>
                    {achievement.is_unlocked ? achievement.description : 'Locked'}
                  </div>
                  <div style={styles.achievementFooter}>
                    <div style={styles.achievementPoints}>
                      {achievement.points} pts
                    </div>
                    {achievement.is_unlocked && (
                      <div style={styles.achievementUnlockedDate}>
                        Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🏆</div>
              <div style={styles.emptyText}>No achievements in this category</div>
            </div>
          )}
        </div>

        <div style={styles.sidebar}>
          <div style={styles.leaderboardCard}>
            <h3 style={styles.leaderboardTitle}>
              <span>🏅</span>
              <span>Leaderboard</span>
            </h3>
            <div style={styles.leaderboardList}>
              {leaderboard.map((user, index) => (
                <div key={user.id} style={styles.leaderboardItem}>
                  <div style={styles.leaderboardRank}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div style={styles.leaderboardUser}>
                    <div style={styles.leaderboardUsername}>{user.username}</div>
                    <div style={styles.leaderboardStats}>
                      {user.achievement_points} pts • {user.achievements_count} achievements
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>How It Works</h3>
            <ul style={styles.infoList}>
              <li>Complete activities to unlock achievements</li>
              <li>Each achievement awards points</li>
              <li>Climb the leaderboard by earning points</li>
              <li>Check for new achievements regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: 'var(--space-xl)',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'var(--space-xl)',
    flexWrap: 'wrap',
    gap: 'var(--space-md)'
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)'
  },
  checkButton: {
    padding: 'var(--space-sm) var(--space-lg)',
    backgroundColor: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    ':hover': {
      opacity: 0.9
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  message: {
    padding: 'var(--space-md)',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--success)',
    marginBottom: 'var(--space-lg)',
    textAlign: 'center'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'var(--space-lg)',
    marginBottom: 'var(--space-xl)'
  },
  statCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)'
  },
  statIcon: {
    fontSize: '36px'
  },
  statValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)'
  },
  statLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: 'var(--space-xl)',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr'
    }
  },
  mainSection: {
    minWidth: 0
  },
  categoryTabs: {
    display: 'flex',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-lg)',
    flexWrap: 'wrap'
  },
  categoryTab: {
    padding: 'var(--space-sm) var(--space-md)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    ':hover': {
      backgroundColor: 'var(--bg-tertiary)',
      color: 'var(--text-primary)'
    }
  },
  categoryTabActive: {
    backgroundColor: 'var(--primary)',
    color: 'white',
    borderColor: 'var(--primary)'
  },
  categoryIcon: {
    fontSize: '18px'
  },
  achievementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'var(--space-lg)'
  },
  achievementCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }
  },
  achievementCardUnlocked: {
    borderColor: 'var(--primary-gold)',
    boxShadow: '0 0 0 1px var(--primary-gold-dim)'
  },
  achievementCardLocked: {
    opacity: 0.6
  },
  achievementIcon: {
    fontSize: '48px',
    marginBottom: 'var(--space-md)',
    textAlign: 'center'
  },
  achievementContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  achievementName: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  achievementDescription: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  achievementFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'var(--space-sm)',
    paddingTop: 'var(--space-sm)',
    borderTop: '1px solid var(--border-color)'
  },
  achievementPoints: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--primary-gold)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  achievementUnlockedDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: 'var(--space-md)'
  },
  emptyText: {
    fontSize: 'var(--text-base)'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  leaderboardCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)',
    position: 'sticky',
    top: 'var(--space-lg)'
  },
  leaderboardTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-sm)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--bg-tertiary)',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'var(--bg-primary)'
    }
  },
  leaderboardRank: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    minWidth: '32px',
    textAlign: 'center'
  },
  leaderboardUser: {
    flex: 1,
    minWidth: 0
  },
  leaderboardUsername: {
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  leaderboardStats: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-secondary)'
  },
  infoCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-lg)'
  },
  infoTitle: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)'
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6
  },
  loading: {
    textAlign: 'center',
    padding: 'var(--space-xl)',
    color: 'var(--text-secondary)'
  }
};

export default StudentAchievements;
