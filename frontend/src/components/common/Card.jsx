import React from 'react';

const Card = ({ children, title, className = '', style = {} }) => {
  const cardStyles = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--glass-border)',
    transition: 'all var(--transition-base)',
    ...style
  };

  return (
    <div className={`card glass card-glow ${className}`} style={cardStyles}>
      {title && (
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
