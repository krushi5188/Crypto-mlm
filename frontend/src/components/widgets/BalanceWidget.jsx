import React from 'react';

const BalanceWidget = ({ data }) => {
  const { balance = 0, totalEarned = 0 } = data || {};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>💰</span>
        <h3 style={styles.title}>Balance</h3>
      </div>
      <div style={styles.content}>
        <div style={styles.mainStat}>
          <span style={styles.label}>Current Balance</span>
          <span style={styles.value}>${parseFloat(balance).toFixed(2)}</span>
        </div>
        <div style={styles.secondaryStat}>
          <span style={styles.secondaryLabel}>Total Earned</span>
          <span style={styles.secondaryValue}>${parseFloat(totalEarned).toFixed(2)}</span>
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
    justifyContent: 'center',
    gap: 'var(--space-md)'
  },
  mainStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)'
  },
  label: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    fontWeight: '500'
  },
  value: {
    fontSize: 'var(--text-3xl)',
    fontWeight: '700',
    color: 'var(--primary-gold)'
  },
  secondaryStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-sm)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-md)'
  },
  secondaryLabel: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    fontWeight: '500'
  },
  secondaryValue: {
    fontSize: 'var(--text-lg)',
    fontWeight: '700',
    color: 'var(--accent-green)'
  }
};

export default BalanceWidget;
