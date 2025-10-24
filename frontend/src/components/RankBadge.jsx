import React, { useState, useEffect } from 'react';
import { gamificationAPI } from '../services/api';

const RankBadge = ({ showProgress = false }) => {
  const [rank, setRank] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRank();
  }, []);

  const loadRank = async () => {
    try {
      const [rankRes, progressRes] = await Promise.all([
        gamificationAPI.getUserRank(),
        showProgress ? gamificationAPI.getRankProgress() : Promise.resolve(null)
      ]);

      setRank(rankRes.data.data);
      if (progressRes) {
        setProgress(progressRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load rank:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !rank || !rank.currentRank) {
    return null;
  }

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      gap: 'var(--space-xs)'
    }}>
      {/* Rank Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: rank.currentRank.color + '20',
        border: `2px solid ${rank.currentRank.color}`,
        fontWeight: '600',
        fontSize: 'var(--text-sm)'
      }}>
        <span style={{ fontSize: '1.2rem' }}>{rank.currentRank.icon}</span>
        <span style={{ color: rank.currentRank.color }}>{rank.currentRank.name}</span>
      </div>

      {/* Progress Bar (optional) */}
      {showProgress && progress && !progress.atMaxRank && (
        <div style={{ minWidth: '200px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-xs)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)'
          }}>
            <span>Next: {progress.nextRank.name}</span>
            <span>{progress.overallProgress}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--border)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress.overallProgress}%`,
              height: '100%',
              backgroundColor: rank.currentRank.color,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RankBadge;
