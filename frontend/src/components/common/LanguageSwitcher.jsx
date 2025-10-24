import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../../i18n/config';

const LanguageSwitcher = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Compact variant for navbar
  if (variant === 'compact') {
    return (
      <div ref={dropdownRef} style={styles.compactContainer}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={styles.compactButton}
          aria-label="Change language"
        >
          <span style={styles.flag}>{currentLanguage.flag}</span>
          <span style={styles.langCode}>{currentLanguage.code.toUpperCase()}</span>
          <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div style={styles.compactDropdown}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  ...styles.compactOption,
                  ...(lang.code === i18n.language ? styles.compactOptionActive : {})
                }}
              >
                <span style={styles.flag}>{lang.flag}</span>
                <span style={styles.langName}>{lang.name}</span>
                {lang.code === i18n.language && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant with full language names
  return (
    <div ref={dropdownRef} style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button}
      >
        <span style={styles.flag}>{currentLanguage.flag}</span>
        <span style={styles.currentLang}>{currentLanguage.name}</span>
        <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                ...styles.option,
                ...(lang.code === i18n.language ? styles.optionActive : {})
              }}
            >
              <span style={styles.flag}>{lang.flag}</span>
              <span style={styles.langName}>{lang.name}</span>
              {lang.code === i18n.language && (
                <span style={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  // Default variant styles
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
    borderRadius: 'var(--radius-md, 8px)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  currentLang: {
    fontSize: '0.875rem'
  },
  flag: {
    fontSize: '1.25rem',
    lineHeight: '1'
  },
  arrow: {
    fontSize: '0.75rem',
    marginLeft: '0.25rem',
    opacity: 0.6
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    left: 0,
    minWidth: '200px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
    borderRadius: 'var(--radius-md, 8px)',
    boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.3))',
    overflow: 'hidden',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease'
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textAlign: 'left',
    transition: 'background 0.2s ease',
    outline: 'none'
  },
  optionActive: {
    background: 'rgba(212, 175, 55, 0.1)',
    color: 'var(--primary-gold)'
  },
  langName: {
    flex: 1
  },
  checkmark: {
    color: 'var(--primary-gold)',
    fontSize: '1rem',
    fontWeight: 'bold'
  },

  // Compact variant styles
  compactContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  compactButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 'var(--radius-sm, 6px)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  langCode: {
    fontSize: '0.8125rem',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  compactDropdown: {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: 0,
    minWidth: '180px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
    borderRadius: 'var(--radius-md, 8px)',
    boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.3))',
    overflow: 'hidden',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease'
  },
  compactOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    width: '100%',
    padding: '0.625rem 1rem',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    textAlign: 'left',
    transition: 'background 0.2s ease',
    outline: 'none'
  },
  compactOptionActive: {
    background: 'rgba(212, 175, 55, 0.1)',
    color: 'var(--primary-gold)'
  }
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
const keyframes = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

if (styleSheet && !document.getElementById('language-switcher-animations')) {
  const style = document.createElement('style');
  style.id = 'language-switcher-animations';
  style.textContent = keyframes;
  document.head.appendChild(style);
}

export default LanguageSwitcher;
