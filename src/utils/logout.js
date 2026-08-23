import { getApiUrl } from './config';
import { notifyAuthTokenChanged } from './authTokenEvents';

/**
 * Logout function that calls the logout API endpoint
 * Clears the token from localStorage and redirects to login page
 */
export const handleLogout = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Call logout API endpoint
      const apiUrl = getApiUrl('api/auth/logout');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Log response for debugging (even if it fails, we still want to logout locally)
      if (response.ok) {
        console.log('Logout successful');
      } else {
        console.warn('Logout API call failed, but proceeding with local logout');
      }
    }
  } catch (error) {
    console.error('Error during logout API call:', error);
    // Continue with logout even if API call fails
  } finally {
    // Clear token and session data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('sessionExpired');
    notifyAuthTokenChanged();
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

