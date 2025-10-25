import React from 'react';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  error,
  required = false,
  disabled = false,
  className = ''
}) => {
  const inputStyles = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    borderRadius: '8px',
    border: error ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s'
  };

  return (
    <div className={`input-group ${className}`} style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)'
          }}
        >
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={inputStyles}
        onFocus={(e) => {
          e.target.style.border = '2px solid #667eea';
          e.target.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onBlur={(e) => {
          e.target.style.border = error ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.2)';
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      />
      {error && (
        <span style={{
          display: 'block',
          marginTop: '0.25rem',
          fontSize: '0.875rem',
          color: '#ef4444'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
