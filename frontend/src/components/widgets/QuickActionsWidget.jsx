import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActionsWidget = ({ data }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { referralLink = '' } = data || {};

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const actions = [
    {
      icon: '🔗',
      label: copied ? 'Copied!' : 'Copy Referral Link',
      onClick: copyReferralLink,
      variant: 'primary'
    },
    {
      icon: '👥',
      label: 'View Network',
      onClick: () => navigate('/network'),
      variant: 'secondary'
    },
    {
      icon: '💵',
      label: 'View Earnings',
      onClick: () => navigate('/earnings'),
      variant: 'secondary'
    },
    {
      icon: '⚙️',
      label: 'Settings',
      onClick: () => navigate('/profile'),
      variant: 'secondary'
    }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>⚡</span>
        <h3 style={styles.title}>Quick Actions</h3>
      </div>
      <div style={styles.content}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            style={action.variant === 'primary' ? styles.primaryButton : styles.secondaryButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={styles.buttonIcon}>{action.icon}</span>
            <span style={styles.buttonLabel}>{action.label}</span>
          </button>
        ))}
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-sm)',
    alignContent: 'start'
  },
  primaryButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-md)',
    background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-green))',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#000',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)',
    gridColumn: '1 / -1'
  },
  secondaryButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-xs)',
    padding: 'var(--space-md)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all var(--transition-base)'
  },
  buttonIcon: {
    fontSize: '1.5rem'
  },
  buttonLabel: {
    fontSize: 'var(--text-xs)',
    textAlign: 'center',
    lineHeight: 1.2
  }
};

export default QuickActionsWidget;
