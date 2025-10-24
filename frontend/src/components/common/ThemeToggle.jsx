import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = ({ variant = 'default' }) => {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '8px',
          padding: '0.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          fontSize: '1.25rem',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '🌞' : '🌙'}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        fontSize: 'var(--text-base)',
        fontWeight: '500',
        color: 'var(--text-primary)',
        transition: 'all var(--transition-fast)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>
        {theme === 'dark' ? '🌞' : '🌙'}
      </span>
      <span>
        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
