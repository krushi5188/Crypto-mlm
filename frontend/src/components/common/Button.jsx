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
    fontWeight: '500',
    borderRadius: '12px',
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    secondary: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ffffff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    outline: {
      background: 'transparent',
      color: '#ffffff',
      border: '2px solid #ffffff'
    }
  };

  const hoverStyles = !disabled && !loading ? {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)'
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
