import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check } from 'lucide-react';
import { buttonLiftVariants } from '../../utils/animations';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  success = false,
  fullWidth = false,
  ripple = true,
  icon = null,
  iconRight = null,
  className = ''
}) => {
  const [ripples, setRipples] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success state
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle ripple effect
  const createRipple = (e) => {
    if (!ripple || disabled || loading) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  // Size styles
  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  // Variant styles
  const variantClasses = {
    primary: 'bg-gradient-to-br from-gold-400 to-green-500 text-black font-bold shadow-md hover:shadow-glow-gold',
    secondary: 'bg-gradient-to-br from-gold-500 to-gold-400 text-black font-semibold shadow-md',
    success: 'bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold shadow-md hover:shadow-glow-green',
    danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold shadow-md',
    outline: 'bg-transparent border-2 border-gold-400 text-gold-400 font-semibold hover:bg-gold-400/10',
    ghost: 'bg-transparent text-text-secondary hover:bg-glass-light font-medium'
  };

  // Base classes
  const baseClasses = `
    relative overflow-hidden rounded-xl font-medium
    inline-flex items-center justify-center gap-2
    transition-all duration-200
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${sizeStyles[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading || showSuccess}
      className={baseClasses}
      onMouseDown={createRipple}
      variants={disabled || loading ? {} : buttonLiftVariants}
      initial="initial"
      whileHover={disabled || loading ? {} : "hover"}
      whileTap={disabled || loading ? {} : "tap"}
    >
      {/* Ripple effect */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ))}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </motion.div>
      )}

      {/* Success state */}
      {showSuccess && !loading && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1]
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.68, -0.55, 0.265, 1.55]
          }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
      )}

      {/* Left icon */}
      {!loading && !showSuccess && icon && (
        <span className="flex items-center justify-center">
          {icon}
        </span>
      )}

      {/* Button text */}
      {!showSuccess && (
        <span className="flex items-center justify-center">
          {children}
        </span>
      )}

      {/* Right icon */}
      {!loading && !showSuccess && iconRight && (
        <span className="flex items-center justify-center">
          {iconRight}
        </span>
      )}

      {/* Success text */}
      {showSuccess && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-1"
        >
          Success!
        </motion.span>
      )}
    </motion.button>
  );
};

export default Button;
