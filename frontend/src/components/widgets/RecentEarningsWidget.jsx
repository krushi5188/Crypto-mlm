import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecentEarningsWidget = ({ data }) => {
  const navigate = useNavigate();
  const { recentActivity = [] } = data || {};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>📈</span>
        <h3 style={styles.title}>Recent Earnings</h3>
      </div>
      <div style={styles.content}>
        {recentActivity.length > 0 ? (
          <div style={styles.list}>
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} style={styles.item}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemDescription}>{activity.description}</span>
                  <span style={styles.itemDate}>
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <span style={styles.itemAmount}>
                  +${parseFloat(activity.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No recent earnings yet</p>
          </div>
        )}
        <button onClick={() => navigate('/earnings')} style={styles.button}>
          View All →
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
    minHeight: 0
  },
  list: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-xs)',
    overflowY: 'auto',
    marginBottom: 'var(--space-md)'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-sm)',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-sm)',
    gap: 'var(--space-sm)'
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0
  },
  itemDescription: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  itemDate: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-dimmed)'
  },
  itemAmount: {
    fontSize: 'var(--text-sm)',
    fontWeight: '700',
    color: 'var(--accent-green)',
    flexShrink: 0
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--space-md)'
  },
  emptyText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    textAlign: 'center'
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

export default RecentEarningsWidget;
