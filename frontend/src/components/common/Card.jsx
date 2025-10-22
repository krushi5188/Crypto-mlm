import React from 'react';

const Card = ({ children, title, className = '', style = {} }) => {
  const cardStyles = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    ...style
  };

  return (
    <div className={`card ${className}`} style={cardStyles}>
      {title && (
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '700' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
