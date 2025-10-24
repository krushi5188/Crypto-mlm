import React from 'react';

const Avatar = ({
  src,
  name = '',
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { width: '32px', height: '32px', fontSize: '0.875rem' },
    md: { width: '40px', height: '40px', fontSize: '1rem' },
    lg: { width: '56px', height: '56px', fontSize: '1.25rem' },
    xl: { width: '96px', height: '96px', fontSize: '2rem' },
    '2xl': { width: '128px', height: '128px', fontSize: '2.5rem' }
  };

  const sizeStyle = sizes[size] || sizes.md;

  // Generate initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate consistent color from name
  const getColorFromName = (fullName) => {
    if (!fullName) return 'var(--text-muted)';
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, var(--primary-gold) 0%, var(--accent-green) 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const containerStyle = {
    width: sizeStyle.width,
    height: sizeStyle.height,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid var(--glass-border)',
    transition: 'all var(--transition-base)'
  };

  if (src) {
    return (
      <div
        className={`avatar ${className}`}
        style={containerStyle}
      >
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            // If image fails to load, hide it and show initials instead
            e.target.style.display = 'none';
            e.target.parentElement.style.background = getColorFromName(name);
            const initialsSpan = document.createElement('span');
            initialsSpan.textContent = getInitials(name);
            initialsSpan.style.fontSize = sizeStyle.fontSize;
            initialsSpan.style.fontWeight = '600';
            initialsSpan.style.color = '#ffffff';
            e.target.parentElement.appendChild(initialsSpan);
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar ${className}`}
      style={{
        ...containerStyle,
        background: getColorFromName(name),
        fontSize: sizeStyle.fontSize,
        fontWeight: '600',
        color: '#ffffff',
        userSelect: 'none'
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
