import React from 'react';

const ReferralStatsWidget = ({ data }) => {
  const { referralCode = '', directRecruits = 0, networkSize = 0 } = data || {};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>🎯</span>
        <h3 style={styles.title}>Referral Stats</h3>
      </div>
      <div style={styles.content}>
        <div style={styles.codeSection}>
          <span style={styles.codeLabel}>Your Referral Code</span>
          <div style={styles.codeBox}>
            <code style={styles.code}>{referralCode}</code>
          </div>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{directRecruits}</span>
            <span style={styles.statLabel}>Direct</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{networkSize}</span>
            <span style={styles.statLabel}>Network</span>
          </div>
        </div>
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
    gap: 'var(--space-md)'
  },
  codeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  codeLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  codeBox: {
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center'
  },
  code: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)',
    fontFamily: 'monospace',
    letterSpacing: '0.1em'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-sm)'
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)'
  },
  statValue: {
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--accent-green)',
    marginBottom: 'var(--space-xs)'
  },
  statLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
    fontWeight: '500'
  }
};

export default ReferralStatsWidget;
