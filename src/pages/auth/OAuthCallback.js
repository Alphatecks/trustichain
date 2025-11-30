import React, { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleOAuthCallback = useCallback(async (code) => {
    try {
      const response = await fetch(getApiUrl('api/auth/google/callback'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      console.log('OAuth callback response:', data);
      console.log('OAuth callback response keys:', Object.keys(data));
      console.log('OAuth callback response JSON:', JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        toast.error(data.message || data.error || 'Failed to complete Google sign in');
        navigate('/login');
        return;
      }

      // Store token if provided (check multiple possible field names and nested paths)
      let tokenFound = false;
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Token stored from data.token');
        tokenFound = true;
      } else if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        console.log('Token stored from data.accessToken');
        tokenFound = true;
      } else if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        console.log('Token stored from data.access_token');
        tokenFound = true;
      } else if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        console.log('Token stored from data.data.token');
        tokenFound = true;
      } else if (data.user?.token) {
        localStorage.setItem('token', data.user.token);
        console.log('Token stored from data.user.token');
        tokenFound = true;
      } else if (data.auth?.token) {
        localStorage.setItem('token', data.auth.token);
        console.log('Token stored from data.auth.token');
        tokenFound = true;
      } else if (data.result?.token) {
        localStorage.setItem('token', data.result.token);
        console.log('Token stored from data.result.token');
        tokenFound = true;
      } else if (data.user?.accessToken) {
        localStorage.setItem('token', data.user.accessToken);
        console.log('Token stored from data.user.accessToken');
        tokenFound = true;
      } else if (data.user?.access_token) {
        localStorage.setItem('token', data.user.access_token);
        console.log('Token stored from data.user.access_token');
        tokenFound = true;
      } else if (data.data?.accessToken) {
        localStorage.setItem('token', data.data.accessToken);
        console.log('Token stored from data.data.accessToken');
        tokenFound = true;
      }
      
      if (!tokenFound) {
        console.warn('No token found in OAuth callback response. Full response structure:');
        console.warn('Response keys:', Object.keys(data));
        if (data.data) {
          console.warn('data.data keys:', Object.keys(data.data));
        }
        if (data.user) {
          console.warn('data.user keys:', Object.keys(data.user));
        }
        console.warn('Full response object:', JSON.stringify(data, null, 2));
      }

      toast.success('Successfully signed in with Google!');
      navigate('/dashboard');
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('An error occurred during authentication');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('error_message') || searchParams.get('message');

    if (error || errorMessage) {
      toast.error(errorMessage || error || 'OAuth authentication failed');
      navigate('/login');
      return;
    }

    if (code) {
      // If we have a code, the backend should handle it
      // But if we're here, it means the backend redirected back with the code
      // We need to send it to the backend to complete the OAuth flow
      handleOAuthCallback(code);
    } else {
      // No code and no error - might be a direct redirect from backend after success
      // Check if there's a token or success indicator
      const token = searchParams.get('token');
      const success = searchParams.get('success');
      
      if (token || success) {
        // Store token if provided
        if (token) {
          localStorage.setItem('token', token);
        }
        toast.success('Successfully signed in with Google!');
        navigate('/dashboard');
      } else {
        toast.error('Missing authorization code. Please try signing in again.');
        navigate('/login');
      }
    }
  }, [searchParams, navigate, handleOAuthCallback]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div>Processing your Google sign in...</div>
    </div>
  );
};

export default OAuthCallback;

