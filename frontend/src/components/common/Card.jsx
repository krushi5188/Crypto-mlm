import React from 'react';

const Card = ({ children, title, className = '', style = {} }) => {
  const cardStyles = {
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-xl)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    transition: 'all var(--transition-base)',
    ...style
  };

  return (
    <div className={`${className}`} style={cardStyles}>
      {title && (
        <h3 style={{ 
          marginBottom: 'var(--space-lg)', 
          fontSize: 'var(--text-2xl)', 
          fontWeight: '600',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em'
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
