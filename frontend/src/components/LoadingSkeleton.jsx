import React from 'react';
import { motion } from 'framer-motion';

const LoadingSkeleton = ({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  className = ''
}) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded-lg',
    avatar: 'w-12 h-12 rounded-full',
    card: 'h-48 rounded-xl',
    button: 'h-10 rounded-lg w-32'
  };

  const shimmerVariants = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const baseClasses = `
    bg-gradient-to-r from-glass-light via-glass-medium to-glass-light
    bg-[length:200%_100%]
    ${variants[variant]}
    ${className}
  `;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={baseClasses}
          style={{ width, height }}
          variants={shimmerVariants}
          animate="animate"
        />
      ))}
    </>
  );
};

export default LoadingSkeleton;
