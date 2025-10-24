<<<<<<< HEAD
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext(null);
=======
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
<<<<<<< HEAD
    throw new Error('useTheme must be used within a ThemeProvider');
=======
    throw new Error('useTheme must be used within ThemeProvider');
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
<<<<<<< HEAD
  // Initialize from localStorage, default to 'dark'
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
=======
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark'; // Default to dark
  });

  useEffect(() => {
    // Apply theme to document
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

<<<<<<< HEAD
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
=======
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
  };

  const value = {
    theme,
<<<<<<< HEAD
    setTheme,
=======
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

<<<<<<< HEAD
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
=======
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
>>>>>>> cff4413b1c03039cbf120a9440b4da1d73a81893
};

export default ThemeContext;
