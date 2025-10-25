import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, X, Check, AlertCircle } from 'lucide-react';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  helperText,
  error,
  success = false,
  required = false,
  disabled = false,
  clearable = false,
  onClear,
  icon = null,
  iconRight = null,
  maxLength,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isFloating = isFocused || value;
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type;

  // Handle clear
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  // Character count
  const characterCount = value ? value.length : 0;
  const showCharCount = maxLength && isFocused;

  // Determine state styles
  const getStateStyles = () => {
    if (error) {
      return {
        border: 'border-error',
        ring: 'focus:ring-error/10',
        text: 'text-error'
      };
    }
    if (success) {
      return {
        border: 'border-success',
        ring: 'focus:ring-success/10',
        text: 'text-success'
      };
    }
    return {
      border: 'border-glass-border',
      ring: 'focus:ring-gold-400/10',
      text: 'text-gold-400'
    };
  };

  const stateStyles = getStateStyles();

  // Base classes for input container
  const containerClasses = `
    relative w-full
    ${className}
  `.trim();

  // Input classes
  const inputClasses = `
    w-full px-4 py-3
    ${icon ? 'pl-12' : ''}
    ${iconRight || isPassword || (clearable && value) ? 'pr-12' : ''}
    bg-bg-input
    border-2 ${stateStyles.border}
    rounded-xl
    text-text-primary
    placeholder-transparent
    transition-all duration-200
    focus:outline-none focus:border-${error ? 'error' : success ? 'success' : 'gold-400'}
    focus:ring-4 ${stateStyles.ring}
    focus:bg-bg-input-hover
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim().replace(/\s+/g, ' ');

  // Label classes
  const labelClasses = `
    absolute transition-all duration-200 pointer-events-none
    ${isFloating
      ? 'top-0 left-4 -translate-y-1/2 text-xs px-1 bg-zinc-900'
      : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-base'
    }
    ${error ? 'text-error' : success ? 'text-success' : isFocused ? 'text-gold-400' : 'text-gray-400'}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 ${isFloating ? 'opacity-100' : 'opacity-0'} text-gray-500`}>
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={actualType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder=" "
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Floating Label */}
        {label && (
          <motion.label
            htmlFor={name}
            className={labelClasses}
            initial={false}
            animate={{
              left: isFloating ? '16px' : '50%',
              x: isFloating ? '0%' : '-50%',
              y: '-50%',
              top: isFloating ? '0' : '50%',
              fontSize: isFloating ? '0.75rem' : '1rem',
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </motion.label>
        )}

        {/* Right Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {/* Success Icon */}
          {success && !error && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Check className="w-5 h-5 text-success" />
            </motion.div>
          )}

          {/* Clear Button */}
          {clearable && value && !disabled && !isPassword && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}

          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Custom Right Icon */}
          {iconRight && !success && !clearable && !isPassword && (
            <div className="text-gray-400">
              {iconRight}
            </div>
          )}
        </div>
      </div>

      {/* Helper Text / Error / Character Count */}
      <div className="flex items-start justify-between mt-2 min-h-[1.25rem]">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { duration: 0.2 }
              }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-1 text-sm text-red-400"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
          {!error && helperText && (
            <motion.span
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`text-sm ${success ? 'text-success' : 'text-gray-400'}`}
            >
              {helperText}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Character Counter */}
        {showCharCount && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`text-sm ml-auto ${
              characterCount >= maxLength ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            {characterCount} / {maxLength}
          </motion.span>
        )}
      </div>
    </div>
  );
};

export default Input;
