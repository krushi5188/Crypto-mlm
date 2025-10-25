import React from 'react';
import { motion } from 'framer-motion';
import { cardHoverVariants } from '../../utils/animations';

const Card = ({
  children,
  title,
  variant = 'glass',
  interactive = false,
  glow = false,
  padding = 'lg',
  loading = false,
  as = 'div',
  className = '',
  style = {},
  onClick,
  ...rest
}) => {
  // Padding variants
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  };

  // Variant styles
  const variantStyles = {
    minimal: 'bg-transparent border-none shadow-none',
    elevated: 'bg-card-black border border-glass-border-subtle shadow-lg',
    outlined: 'bg-transparent border-2 border-gold-400 shadow-none',
    glass: 'bg-glass-medium backdrop-blur-md border border-glass-border shadow-lg',
    'glass-strong': 'bg-glass-strong backdrop-blur-xl border border-glass-border-strong shadow-2xl'
  };

  // Glow styles
  const glowStyles = {
    gold: 'hover:shadow-glow-gold',
    green: 'hover:shadow-glow-green',
    true: 'hover:shadow-glow-gold'
  };

  // Base classes
  const baseClasses = `
    rounded-2xl transition-all duration-250
    ${paddingStyles[padding]}
    ${variantStyles[variant]}
    ${glow ? glowStyles[glow === true ? 'true' : glow] : ''}
    ${interactive ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Loading shimmer effect
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-glass-medium rounded w-3/4"></div>
      <div className="h-4 bg-glass-medium rounded w-1/2"></div>
      <div className="h-4 bg-glass-medium rounded w-5/6"></div>
    </div>
  );

  // Determine which component to render
  const Component = motion[as] || motion.div;

  // Motion props
  const motionProps = interactive ? {
    variants: cardHoverVariants,
    initial: "initial",
    whileHover: "hover",
    whileTap: "tap",
    layout: true,
    transition: { duration: 0.25 }
  } : {
    layout: true,
    transition: { duration: 0.3 }
  };

  return (
    <Component
      className={baseClasses}
      style={style}
      onClick={onClick}
      {...motionProps}
      {...rest}
    >
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {title && (
            <motion.h3
              className="mb-6 text-2xl font-semibold text-text-primary tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h3>
          )}
          {children}
        </>
      )}
    </Component>
  );
};

export default Card;
