import React from 'react';
import { useNavigate } from 'react-router-dom';

const NetworkOverviewWidget = ({ data }) => {
  const navigate = useNavigate();
  const { directRecruits = 0, networkSize = 0 } = data || {};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🌐</span>
        <h3 style={styles.title}>Network</h3>
      </div>
      <div style={styles.content}>
        <div style={styles.statsGrid}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{directRecruits}</span>
            <span style={styles.statLabel}>Direct Recruits</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{networkSize}</span>
            <span style={styles.statLabel}>Total Network</span>
          </div>
        </div>
        <button onClick={() => navigate('/network')} style={styles.button}>
          View Network →
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-md)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    marginBottom: 'var(--space-md)'
  },
  icon: {
    fontSize: '1.5rem'
  },
  title: {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-md)',
    marginBottom: 'var(--space-md)'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)'
  },
  statValue: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)',
    marginBottom: 'var(--space-xs)'
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    textAlign: 'center',
    fontWeight: '500'
  },
  button: {
    padding: 'var(--space-sm)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    textAlign: 'center'
  }
};

export default NetworkOverviewWidget;
