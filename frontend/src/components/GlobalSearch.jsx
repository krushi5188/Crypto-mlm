import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberAPI } from '../services/api';

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        // Use real API endpoint
        const response = await memberAPI.search(query, 20);
        const apiResults = response.data.data.results || [];
        
        // Map API results to component format
        const mappedResults = apiResults.map(result => {
          const baseResult = {
            type: result.type,
            title: result.title,
            subtitle: result.subtitle
          };

          switch (result.type) {
            case 'network_member':
              return {
                ...baseResult,
                icon: '👤',
                action: () => navigate('/network')
              };
            case 'transaction':
              return {
                ...baseResult,
                icon: '💰',
                action: () => navigate('/earnings')
              };
            case 'goal':
              return {
                ...baseResult,
                icon: '🎯',
                action: () => navigate('/profile')
              };
            default:
              return {
                ...baseResult,
                icon: '📄',
                action: () => {}
              };
          }
        });

        // Add page results based on query
        const pageResults = generatePageResults(query);
        
        setResults([...pageResults, ...mappedResults]);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to page-only search if API fails
        setResults(generatePageResults(query));
        setSelectedIndex(0);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const generatePageResults = (searchQuery) => {
    const lower = searchQuery.toLowerCase();
    const mockResults = [];

    // Pages
    if ('dashboard'.includes(lower)) {
      mockResults.push({
        type: 'page',
        title: 'Dashboard',
        subtitle: 'View your overview',
        icon: '📊',
        action: () => navigate('/dashboard')
      });
    }
    if ('network'.includes(lower)) {
      mockResults.push({
        type: 'page',
        title: 'Network',
        subtitle: 'View your downline',
        icon: '🌐',
        action: () => navigate('/network')
      });
    }
    if ('earnings'.includes(lower) || 'transactions'.includes(lower)) {
      mockResults.push({
        type: 'page',
        title: 'Earnings',
        subtitle: 'View transaction history',
        icon: '💰',
        action: () => navigate('/earnings')
      });
    }
    if ('profile'.includes(lower) || 'settings'.includes(lower)) {
      mockResults.push({
        type: 'page',
        title: 'Profile',
        subtitle: 'Manage your account',
        icon: '👤',
        action: () => navigate('/profile')
      });
    }

    return mockResults;
  };

  const handleSelectResult = (result) => {
    if (result.action) {
      result.action();
    }
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 'var(--space-3xl) var(--space-md)',
    zIndex: 10000,
    animation: 'fadeIn 0.15s ease-out'
  };

  const modalStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '600px',
    boxShadow: 'var(--shadow-2xl)',
    overflow: 'hidden',
    animation: 'slideDown 0.2s ease-out'
  };

  const searchBoxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-sm)',
    padding: 'var(--space-md)',
    borderBottom: '1px solid var(--glass-border)'
  };

  const inputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 'var(--text-lg)',
    color: 'var(--text-primary)',
    fontWeight: '500'
  };

  const resultsStyle = {
    maxHeight: '400px',
    overflowY: 'auto'
  };

  const emptyStateStyle = {
    padding: 'var(--space-3xl)',
    textAlign: 'center',
    color: 'var(--text-muted)'
  };

  const resultItemStyle = (isSelected) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
    padding: 'var(--space-md)',
    background: isSelected ? 'var(--glass-bg)' : 'transparent',
    borderLeft: isSelected ? '3px solid var(--primary-gold)' : '3px solid transparent',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  });

  const iconStyle = {
    fontSize: '1.5rem',
    flexShrink: 0
  };

  const contentStyle = {
    flex: 1,
    minWidth: 0
  };

  const titleStyle = {
    fontSize: 'var(--text-base)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '0.125rem'
  };

  const subtitleStyle = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--space-sm) var(--space-md)',
    borderTop: '1px solid var(--glass-border)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-dimmed)'
  };

  const keyStyle = {
    padding: '0.25rem 0.5rem',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    fontFamily: 'monospace'
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <div style={overlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={searchBoxStyle}>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for pages, users, transactions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={inputStyle}
            />
            {loading && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Searching...
              </span>
            )}
          </div>

          <div style={resultsStyle}>
            {!query.trim() ? (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>⌨️</div>
                <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xs)' }}>
                  Quick Search
                </div>
                <div style={{ fontSize: 'var(--text-xs)' }}>
                  Type to search across pages, users, and more
                </div>
              </div>
            ) : results.length === 0 && !loading ? (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>😕</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  No results found for "{query}"
                </div>
              </div>
            ) : (
              results.map((result, index) => (
                <div
                  key={index}
                  style={resultItemStyle(index === selectedIndex)}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div style={iconStyle}>{result.icon}</div>
                  <div style={contentStyle}>
                    <div style={titleStyle}>{result.title}</div>
                    <div style={subtitleStyle}>{result.subtitle}</div>
                  </div>
                  {index === selectedIndex && (
                    <span style={keyStyle}>↵</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={footerStyle}>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <span style={keyStyle}>↑↓</span>
              <span>Navigate</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <span style={keyStyle}>↵</span>
              <span>Select</span>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <span style={keyStyle}>ESC</span>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook to manage global search state
export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev)
  };
};

export default GlobalSearch;
