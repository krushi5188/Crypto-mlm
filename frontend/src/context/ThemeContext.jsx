import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize from localStorage, default to 'dark'
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync with backend preferences (if user is logged in)
  const syncWithBackend = async (newTheme) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('/api/v1/student/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (error) {
      console.error('Failed to sync theme with backend:', error);
      // Don't throw - local theme still works
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    syncWithBackend(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
