import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Input Component - Clean, visible, accessible
 *
 * Features:
 * - Floating label animation (centered when empty, top-left when focused/filled)
 * - Password toggle visibility
 * - Error and success states
 * - Icons support
 *
 * All text guaranteed WHITE and visible on black background
 */

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  placeholder = '',
  error = '',
  success = false,
  required = false,
  disabled = false,
  icon,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isFloating = isFocused || value

  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3 bg-white bg-opacity-5 border rounded-xl
            text-white placeholder-transparent
            transition-all duration-200
            ${icon ? 'pl-12' : ''}
            ${type === 'password' ? 'pr-12' : ''}
            ${error ? 'border-red-500 focus:border-red-500' : success ? 'border-green-500 focus:border-green-500' : 'border-white border-opacity-20 focus:border-white focus:border-opacity-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:bg-opacity-10
          `}
          placeholder={placeholder || label}
        />

        {/* Floating Label */}
        <label
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${icon ? 'left-12' : 'left-4'}
            ${isFloating
              ? 'top-0 -translate-y-1/2 text-xs px-2 bg-black'
              : 'top-1/2 -translate-y-1/2 text-base'
            }
            ${error ? 'text-red-400' : success ? 'text-green-400' : isFocused ? 'text-white' : 'text-gray-400'}
          `}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      {/* Success Message */}
      {success && typeof success === 'string' && (
        <p className="mt-2 text-sm text-green-400">{success}</p>
      )}
    </div>
  )
}

export default Input
