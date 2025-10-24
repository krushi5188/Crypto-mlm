import React, { useState, useRef, useEffect } from 'react';

const HelpTooltip = ({
  content,
  position = 'top',
  maxWidth = '300px',
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 8;
          break;
        default:
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      }

      // Keep tooltip within viewport
      const padding = 8;
      if (left < padding) left = padding;
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }
      if (top < padding) top = triggerRect.bottom + 8;

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const triggerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'help',
    transition: 'all var(--transition-fast)',
    flexShrink: 0
  };

  const tooltipStyle = {
    position: 'fixed',
    top: `${tooltipPosition.top}px`,
    left: `${tooltipPosition.left}px`,
    maxWidth,
    padding: 'var(--space-sm) var(--space-md)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-xl)',
    fontSize: 'var(--text-sm)',
    lineHeight: '1.5',
    color: 'var(--text-secondary)',
    zIndex: 10001,
    pointerEvents: 'none',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    transition: 'opacity 0.15s ease-out, transform 0.15s ease-out'
  };

  const arrowStyle = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid'
  };

  const getArrowStyle = () => {
    const baseArrow = { ...arrowStyle };
    const arrowSize = 6;

    switch (position) {
      case 'top':
        return {
          ...baseArrow,
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `${arrowSize}px ${arrowSize}px 0 ${arrowSize}px`,
          borderColor: `var(--bg-tertiary) transparent transparent transparent`
        };
      case 'bottom':
        return {
          ...baseArrow,
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent var(--bg-tertiary) transparent`
        };
      case 'left':
        return {
          ...baseArrow,
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
          borderColor: `transparent transparent transparent var(--bg-tertiary)`
        };
      case 'right':
        return {
          ...baseArrow,
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
          borderColor: `transparent var(--bg-tertiary) transparent transparent`
        };
      default:
        return baseArrow;
    }
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={triggerStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--bg-tertiary)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--glass-bg)';
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {children || '?'}
      </span>

      {isVisible && (
        <div ref={tooltipRef} style={tooltipStyle}>
          <div style={getArrowStyle()} />
          {content}
        </div>
      )}
    </>
  );
};

export default HelpTooltip;
