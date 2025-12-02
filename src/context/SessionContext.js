import React, { createContext, useContext, useState, useEffect } from 'react';

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const [isSessionExpired, setIsSessionExpired] = useState(() => {
    // Check localStorage for session expiration status
    return localStorage.getItem('sessionExpired') === 'true';
  });

  const setSessionExpired = (expired) => {
    setIsSessionExpired(expired);
    if (expired) {
      localStorage.setItem('sessionExpired', 'true');
    } else {
      localStorage.removeItem('sessionExpired');
    }
  };

  // Clear session expired flag when user logs in (token is set)
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token');
      if (token && isSessionExpired) {
        // User has logged in, clear expired flag
        setSessionExpired(false);
      }
    };

    // Check immediately
    checkToken();

    // Check periodically
    const interval = setInterval(checkToken, 1000);

    return () => clearInterval(interval);
  }, [isSessionExpired]);

  return (
    <SessionContext.Provider value={{ isSessionExpired, setSessionExpired }}>
      {children}
    </SessionContext.Provider>
  );
};
