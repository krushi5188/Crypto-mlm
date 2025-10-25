import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const StudentRank = () => {
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRankData();
  }, []);

  const loadRankData = async () => {
    try {
      setLoading(true);
      const [progressRes, leaderboardRes] = await Promise.all([
        apiService.get('/student/rank/progress'),
        apiService.get('/student/rank/leaderboard?limit=10')
      ]);
      setProgress(progressRes.data.progress);
      setLeaderboard(leaderboardRes.data.leaderboard);
    } catch (error) {
      console.error('Failed to load rank data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPromotion = async () => {
    try {
      setChecking(true);
      const response = await apiService.post('/student/rank/check');
      setMessage(response.data.message);
      setTimeout(() => setMessage(''), 5000);

      // Reload data if promoted
      if (response.data.newRank) {
        await loadRankData();
      }
    } catch (error) {
      setMessage('Failed to check rank promotion');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading rank data...</div>
      </div>
    );
  }

  const currentRank = progress?.currentRank;
  const nextRank = progress?.nextRank;
  const progressData = progress?.progress;
  const allRanks = progress?.allRanks || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rank & Progression</h1>
          <p style={styles.subtitle}>Climb the ranks and unlock exclusive perks</p>
        </div>
        <button
          style={styles.checkButton}
          onClick={checkPromotion}
          disabled={checking}
        >
          {checking ? 'Checking...' : '🔄 Check for Promotion'}
        </button>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.mainSection}>
          {/* Current Rank Card */}
          <div style={styles.currentRankCard}>
            <div style={styles.rankBadgeSection}>
              <div style={{
                ...styles.rankBadge,
                backgroundColor: currentRank?.color || '#95a5a6'
              }}>
                <div style={styles.rankIcon}>
                  {currentRank?.icon || '🌱'}
                </div>
                <div style={styles.rankName}>
                  {currentRank?.name || 'Newbie'}
                </div>
                {currentRank?.achievedAt && (
                  <div style={styles.rankDate}>
                    Achieved {new Date(currentRank.achievedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.statsSection}>
              <h3 style={styles.statsTitle}>Your Progress</h3>
              <div style={styles.statsList}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Direct Recruits</span>
                  <span style={styles.statValue}>{progress?.userStats?.directRecruits || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Network Size</span>
                  <span style={styles.statValue}>{progress?.userStats?.networkSize || 0}</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Total Earned</span>
                  <span style={styles.statValue}>{progress?.userStats?.totalEarned?.toFixed(2) || '0.00'} AC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Rank Progress */}
          {nextRank && progressData && (
            <div style={styles.progressCard}>
              <div style={styles.progressHeader}>
                <h3 style={styles.progressTitle}>
                  Progress to {nextRank.rank_name}
                  <span style={styles.nextRankIcon}>{nextRank.badge_icon}</span>
                </h3>
                <div style={styles.overallProgress}>
                  {progressData.overall}% Complete
                </div>
              </div>

              <div style={styles.requirementsList}>
                {/* Recruits Progress */}
                <div style={styles.requirement}>
                  <div style={styles.requirementHeader}>
                    <span style={styles.requirementLabel}>
                      👥 Direct Recruits
                    </span>
                    <span style={styles.requirementValue}>
                      {progressData.recruits.current} / {progressData.recruits.required}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressBarFill,
                      width: `${progressData.recruits.percentage}%`,
                      backgroundColor: progressData.recruits.percentage >= 100 ? '#22c55e' : '#3b82f6'
                    }} />
                  </div>
                </div>

                {/* Network Progress */}
                <div style={styles.requirement}>
                  <div style={styles.requirementHeader}>
                    <span style={styles.requirementLabel}>
                      🌐 Network Size
                    </span>
                    <span style={styles.requirementValue}>
                      {progressData.network.current} / {progressData.network.required}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressBarFill,
                      width: `${progressData.network.percentage}%`,
                      backgroundColor: progressData.network.percentage >= 100 ? '#22c55e' : '#3b82f6'
                    }} />
                  </div>
                </div>

                {/* Earnings Progress */}
                <div style={styles.requirement}>
                  <div style={styles.requirementHeader}>
                    <span style={styles.requirementLabel}>
                      💰 Total Earned
                    </span>
                    <span style={styles.requirementValue}>
                      {progressData.earnings.current.toFixed(2)} / {progressData.earnings.required.toFixed(2)} AC
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressBarFill,
                      width: `${progressData.earnings.percentage}%`,
                      backgroundColor: progressData.earnings.percentage >= 100 ? '#22c55e' : '#3b82f6'
                    }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!nextRank && (
            <div style={styles.maxRankCard}>
              <div style={styles.maxRankIcon}>👑</div>
              <div style={styles.maxRankTitle}>Maximum Rank Achieved!</div>
              <div style={styles.maxRankText}>
                You've reached the highest rank in the system. Congratulations!
              </div>
            </div>
          )}

          {/* All Ranks List */}
          <div style={styles.ranksCard}>
            <h3 style={styles.ranksTitle}>All Ranks</h3>
            <div style={styles.ranksList}>
              {allRanks.map((rank, index) => {
                const isCurrent = currentRank?.id === rank.id;
                const isPast = currentRank?.order > rank.rank_order;

                return (
                  <div
                    key={rank.id}
                    style={{
                      ...styles.rankItem,
                      ...(isCurrent ? styles.rankItemCurrent : {}),
                      ...(isPast ? styles.rankItemPast : {})
                    }}
                  >
                    <div style={styles.rankItemIcon}>
                      {rank.badge_icon}
                    </div>
                    <div style={styles.rankItemContent}>
                      <div style={styles.rankItemName}>
                        {rank.rank_name}
                        {isCurrent && <span style={styles.currentBadge}>Current</span>}
                        {isPast && <span style={styles.completedBadge}>✓</span>}
                      </div>
                      <div style={styles.rankItemRequirements}>
                        {rank.min_direct_recruits > 0 && (
                          <span>{rank.min_direct_recruits} recruits</span>
                        )}
                        {rank.min_network_size > 0 && (
                          <span> • {rank.min_network_size} network</span>
                        )}
                        {rank.min_total_earned > 0 && (
                          <span> • {rank.min_total_earned} AC earned</span>
                        )}
                      </div>
                      {rank.perks && (
                        <div style={styles.rankItemPerks}>
                          Perks: {JSON.stringify(rank.perks)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.leaderboardCard}>
            <h3 style={styles.leaderboardTitle}>
              <span>👑</span>
              <span>Rank Leaderboard</span>
            </h3>
            <div style={styles.leaderboardList}>
              {leaderboard.map((user, index) => (
                <div key={user.id} style={styles.leaderboardItem}>
                  <div style={styles.leaderboardRank}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div style={styles.leaderboardUser}>
                    <div style={styles.leaderboardUsername}>
                      {user.rank_name && (
                        <span style={styles.userRankBadge}>{user.badge_icon}</span>
                      )}
                      {user.username}
                    </div>
                    <div style={styles.leaderboardStats}>
                      {user.rank_name || 'No Rank'} • {user.direct_recruits} recruits
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>How Ranks Work</h3>
            <ul style={styles.infoList}>
              <li>Meet all requirements to advance to the next rank</li>
              <li>Higher ranks unlock special perks and benefits</li>
              <li>Ranks are permanent once achieved</li>
              <li>Check regularly for automatic promotions</li>
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
    gap: 'var(--space-xs)'
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
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 'var(--space-xl)'
  },
  mainSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  currentRankCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: 'var(--space-xl)',
    alignItems: 'center'
  },
  rankBadgeSection: {
    display: 'flex',
    justifyContent: 'center'
  },
  rankBadge: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
  },
  rankIcon: {
    fontSize: '64px',
    marginBottom: 'var(--space-sm)'
  },
  rankName: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    textAlign: 'center'
  },
  rankDate: {
    fontSize: 'var(--text-xs)',
    opacity: 0.9,
    marginTop: 'var(--space-xs)'
  },
  statsSection: {
    flex: 1
  },
  statsTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-md)'
  },
  statsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)'
  },
  statLabel: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)'
  },
  statValue: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  progressCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)'
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--space-lg)'
  },
  progressTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  nextRankIcon: {
    fontSize: '28px'
  },
  overallProgress: {
    fontSize: 'var(--text-lg)',
    fontWeight: '700',
    color: 'var(--primary)'
  },
  requirementsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)'
  },
  requirement: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-sm)'
  },
  requirementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  requirementLabel: {
    fontSize: 'var(--text-base)',
    fontWeight: '500',
    color: 'var(--text-primary)'
  },
  requirementValue: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-secondary)'
  },
  progressBar: {
    width: '100%',
    height: '12px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: 'var(--radius-full)'
  },
  maxRankCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--primary-gold)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)',
    textAlign: 'center'
  },
  maxRankIcon: {
    fontSize: '64px',
    marginBottom: 'var(--space-md)'
  },
  maxRankTitle: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)',
    marginBottom: 'var(--space-sm)'
  },
  maxRankText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)'
  },
  ranksCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-xl)'
  },
  ranksTitle: {
    fontSize: 'var(--text-xl)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-lg)'
  },
  ranksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-md)'
  },
  rankItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s'
  },
  rankItemCurrent: {
    border: '2px solid var(--primary)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)'
  },
  rankItemPast: {
    opacity: 0.7
  },
  rankItemIcon: {
    fontSize: '36px',
    minWidth: '48px',
    textAlign: 'center'
  },
  rankItemContent: {
    flex: 1
  },
  rankItemName: {
    fontSize: 'var(--text-lg)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-xs)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)'
  },
  currentBadge: {
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)'
  },
  completedBadge: {
    fontSize: 'var(--text-sm)',
    color: 'var(--success)'
  },
  rankItemRequirements: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  },
  rankItemPerks: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    marginTop: 'var(--space-xs)'
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
    backgroundColor: 'var(--bg-tertiary)'
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
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)'
  },
  userRankBadge: {
    fontSize: '16px'
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

export default StudentRank;
