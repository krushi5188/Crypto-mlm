import React from 'react'

/**
 * Card Component - Clean container for dashboard content
 *
 * Variants:
 * - default: Basic card with border
 * - elevated: Slightly lighter background
 * - glass: Glassmorphism effect
 *
 * All cards have consistent padding and visible borders on black background
 */

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}) => {
  const baseStyles = 'rounded-xl border transition-all'

  const variants = {
    default: 'bg-white bg-opacity-5 border-white border-opacity-10 hover:border-opacity-20',
    elevated: 'bg-white bg-opacity-10 border-white border-opacity-15 hover:border-opacity-25',
    glass: 'bg-white bg-opacity-5 backdrop-blur-sm border-white border-opacity-10 hover:border-opacity-20',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const interactive = onClick ? 'cursor-pointer hover:bg-opacity-10' : ''

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card
