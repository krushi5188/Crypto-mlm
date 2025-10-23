import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = ''
}) => {
  const baseStyles = {
    padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '1rem 2rem' : '0.75rem 1.5rem',
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-base)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.5 : 1,
    position: 'relative',
    overflow: 'hidden'
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, var(--primary-gold) 0%, var(--accent-green) 100%)',
      color: 'var(--bg-primary)',
      boxShadow: 'var(--shadow-md)',
      fontWeight: '700'
    },
    secondary: {
      background: 'linear-gradient(135deg, var(--primary-gold-dark) 0%, var(--primary-gold) 100%)',
      color: 'var(--bg-primary)',
      boxShadow: 'var(--shadow-md)'
    },
    success: {
      background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-md)'
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff',
      boxShadow: 'var(--shadow-md)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--primary-gold)',
      border: '2px solid var(--primary-gold)',
      boxShadow: 'none'
    }
  };

  const hoverStyles = !disabled && !loading ? {
    transform: 'translateY(-2px)',
    boxShadow: variant === 'outline' ? '0 0 20px rgba(251, 191, 36, 0.3)' : 'var(--shadow-lg)'
  } : {};

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      style={{ ...baseStyles, ...variantStyles[variant] }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.target.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = variantStyles[variant].boxShadow || 'none';
        }
      }}
    >
      {loading && (
        <span className="spin" style={{ fontSize: '1rem' }}>⏳</span>
      )}
      {children}
    </button>
  );
};

export default Button;
