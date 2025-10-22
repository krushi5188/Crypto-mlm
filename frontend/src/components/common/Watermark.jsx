import React from 'react';

const Watermark = () => {
  const watermarkStyles = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(239, 68, 68, 0.9)',
    color: '#ffffff',
    padding: '0.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    fontWeight: '600',
    zIndex: 9999,
    borderTop: '2px solid #dc2626'
  };

  return (
    <div style={watermarkStyles}>
      ⚠️ EDUCATIONAL SIMULATION - NO REAL VALUE ⚠️
    </div>
  );
};

export default Watermark;
