import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const getIsMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  };

  const [isMobile, setIsMobile] = useState(getIsMobile());

  const [theme, setTheme] = useState(() => {
    // On mobile, always default to light
    if (getIsMobile()) {
      return 'light';
    }
    // Desktop default should be light; only use saved preference if present
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return 'light';
  });

  useEffect(() => {
    // Track viewport changes to determine mobile/desktop
    const handleResize = () => {
      setIsMobile(getIsMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // If mobile, force light theme
    if (isMobile && theme !== 'light') {
      setTheme('light');
      return;
    }
    // Save to localStorage on desktop; on mobile, we still store 'light'
    localStorage.setItem('theme', theme);

    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, isMobile]);

  const toggleTheme = () => {
    // Disable toggling on mobile view
    if (isMobile) return;
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isMobile,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

