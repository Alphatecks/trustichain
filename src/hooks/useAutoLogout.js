import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook to mark session as expired after 3600 seconds (1 hour) of inactivity
 * Instead of logging out, sets a flag that causes components to use fallback data
 * Tracks user activity: mouse movements, clicks, keyboard presses, scrolls
 * @param {number} inactivityTimeout - Timeout in milliseconds (default: 3600000 = 1 hour)
 */
const useAutoLogout = (inactivityTimeout = 3600000) => { // 3600 seconds = 3600000 milliseconds
  const timeoutRef = useRef(null);
  const isAuthenticatedRef = useRef(false);

  const checkAuthentication = useCallback(() => {
    return !!localStorage.getItem('token');
  }, []);

  const expireSession = useCallback(() => {
    // Mark session as expired instead of logging out
    localStorage.setItem('sessionExpired', 'true');
    isAuthenticatedRef.current = false;
    
    // Show notification
    toast.error('Session expired due to inactivity. Displaying fallback data.');
    
    // Trigger a custom event to notify components
    window.dispatchEvent(new CustomEvent('sessionExpired'));
  }, []);

  const resetTimer = useCallback(() => {
    // Only reset if user is authenticated
    if (!checkAuthentication()) {
      isAuthenticatedRef.current = false;
      // Clear existing timeout if user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    isAuthenticatedRef.current = true;

    // Clear session expired flag when user is active
    if (localStorage.getItem('sessionExpired') === 'true') {
      localStorage.removeItem('sessionExpired');
      window.dispatchEvent(new CustomEvent('sessionRestored'));
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.log('Auto-logout timer reset. Will expire session in', inactivityTimeout / 1000, 'seconds if no activity');

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Session expiration timeout reached. Checking authentication...');
      // Double-check authentication before expiring session
      if (checkAuthentication()) {
        console.log('User is authenticated. Expiring session (using fallback data)...');
        expireSession();
      } else {
        console.log('User is not authenticated. Skipping session expiration.');
      }
    }, inactivityTimeout);
  }, [checkAuthentication, expireSession, inactivityTimeout]);

  useEffect(() => {
    // Check authentication status periodically and set up listeners
    const checkAndSetup = () => {
      if (checkAuthentication()) {
        isAuthenticatedRef.current = true;
        // Set initial timer
        resetTimer();
      } else {
        isAuthenticatedRef.current = false;
        // Clear timeout if not authenticated
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    };

    // Initial check
    checkAndSetup();
    console.log('Auto-logout hook initialized. Timeout:', inactivityTimeout / 1000, 'seconds');

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Add event listeners with throttling for mousemove to improve performance
    // For testing with 2 seconds, throttle to 500ms to allow timer resets
    let mousemoveThrottle = false;
    const throttleDelay = Math.min(500, inactivityTimeout / 4); // Throttle to 25% of timeout or 500ms, whichever is smaller
    const handleMouseMove = () => {
      if (!mousemoveThrottle) {
        resetTimer();
        mousemoveThrottle = true;
        setTimeout(() => {
          mousemoveThrottle = false;
        }, throttleDelay);
      }
    };

    // Add event listeners
    events.forEach(event => {
      if (event === 'mousemove') {
        document.addEventListener(event, handleMouseMove, true);
      } else {
        document.addEventListener(event, resetTimer, true);
      }
    });

    // Check authentication status every 30 seconds
    const authCheckInterval = setInterval(checkAndSetup, 30000);

    // Cleanup function
    return () => {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Clear interval
      clearInterval(authCheckInterval);

      // Remove event listeners
      events.forEach(event => {
        if (event === 'mousemove') {
          document.removeEventListener(event, handleMouseMove, true);
        } else {
          document.removeEventListener(event, resetTimer, true);
        }
      });
    };
  }, [resetTimer, checkAuthentication, expireSession]);

  return { resetTimer };
};

export default useAutoLogout;
