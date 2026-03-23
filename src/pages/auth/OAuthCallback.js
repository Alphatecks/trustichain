import React, { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';

/** Survives React Strict Mode remount (refs reset); prevents double POST of the same OAuth code. */
const oauthCodeExchangeStarted = new Set();
const oauthHashTokenHandled = new Set();

/**
 * Keep local dashboard prefs in sync with auth API (parity with Signup.js for new users).
 * Dashboard reads kycComplete from localStorage on load.
 */
function applyDashboardPrefsFromAuthResponse(data) {
  if (!data || typeof data !== 'object') {
    localStorage.setItem('kycComplete', 'false');
    return;
  }

  const user = data.user ?? data.data?.user;
  const nested = data.data && typeof data.data === 'object' ? data.data : null;

  let kycComplete = false;

  const truthy = (v) => v === true || v === 'true' || v === 1;
  const userKycVerified =
    user &&
    typeof user === 'object' &&
    (truthy(user.kycComplete) ||
      truthy(user.kycVerified) ||
      truthy(user.isKycVerified) ||
      truthy(user.kyc_completed));

  if (userKycVerified) {
    kycComplete = true;
  } else if (nested && truthy(nested.kycComplete)) {
    kycComplete = true;
  } else if (truthy(data.kycComplete)) {
    kycComplete = true;
  } else {
    kycComplete = false;
  }

  localStorage.setItem('kycComplete', kycComplete ? 'true' : 'false');
}

function applyDashboardPrefsFromProfileUser(user) {
  if (!user || typeof user !== 'object') {
    localStorage.setItem('kycComplete', 'false');
    return;
  }
  const truthy = (v) => v === true || v === 'true' || v === 1;
  const kyc =
    truthy(user.kycComplete) ||
    truthy(user.kycVerified) ||
    truthy(user.isKycVerified) ||
    truthy(user.kyc_completed);
  localStorage.setItem('kycComplete', kyc ? 'true' : 'false');
}

function isApiSuccessFlag(data) {
  if (!data || typeof data !== 'object') return false;
  const s = data.success;
  if (s === true || s === 'true' || s === 1 || s === '1') return true;
  if (data.status === 'success' || data.status === 'ok') return true;
  return false;
}

function looksLikeJwt(value) {
  return typeof value === 'string' && value.split('.').length === 3 && value.length > 20;
}

function looksLikeTokenString(value) {
  if (typeof value !== 'string' || value.length < 20) return false;
  return looksLikeJwt(value) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value);
}

/**
 * Last-resort token discovery for varying backend shapes (jwt, session.accessToken, etc.)
 */
function extractTokenFallback(data) {
  if (!data || typeof data !== 'object') return null;
  const containers = [
    data,
    data.data,
    data.user,
    data.auth,
    data.result,
    data.session,
    data.session && typeof data.session === 'object' ? data.session : null,
  ].filter((x) => x && typeof x === 'object');

  const keyPattern = /token|jwt|access|bearer/i;

  for (const obj of containers) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'string') continue;
      if (!keyPattern.test(key)) continue;
      if (looksLikeTokenString(value)) return value;
    }
  }
  return null;
}

function extractAndStoreToken(data) {
  if (!data || typeof data !== 'object') {
    return extractTokenFallback(data);
  }

  let token =
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.jwt ||
    data.data?.token ||
    data.data?.jwt ||
    data.data?.accessToken ||
    data.data?.access_token ||
    data.user?.token ||
    data.user?.accessToken ||
    data.user?.access_token ||
    data.auth?.token ||
    data.result?.token ||
    data.session?.token ||
    data.session?.accessToken ||
    data.session?.access_token;

  if (typeof token === 'string' && token.length > 0) {
    localStorage.setItem('token', token);
    return token;
  }

  const fallback = extractTokenFallback(data);
  if (fallback) {
    localStorage.setItem('token', fallback);
    console.log('OAuth: token stored via fallback key scan');
    return fallback;
  }
  return null;
}

function parseHashParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  const raw = window.location.hash?.replace(/^#/, '') || '';
  return new URLSearchParams(raw);
}

const goToDashboard = (navigate, message) => {
  if (message) toast.success(message);
  navigate('/dashboard', { replace: true });
};

function pickProfileUserFromBody(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) return body.data;
  if (body.user && typeof body.user === 'object') return body.user;
  if (body.profile && typeof body.profile === 'object') return body.profile;
  return null;
}

async function verifySessionThenDashboard(navigate, oauthData, successMessage) {
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('No session token. Please sign in again.');
    navigate('/login', { replace: true });
    return;
  }

  localStorage.removeItem('sessionExpired');

  try {
    const res = await fetch(getApiUrl('api/user/profile'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
      localStorage.removeItem('token');
      toast.error(body?.message || 'Session invalid. Please sign in again.');
      navigate('/login', { replace: true });
      return;
    }

    const profileUser = pickProfileUserFromBody(body);
    const allowProfile =
      res.ok &&
      profileUser &&
      (body?.success === true ||
        body?.success === 1 ||
        body?.success === 'true' ||
        body?.success === '1' ||
        body?.success == null);

    if (allowProfile) {
      applyDashboardPrefsFromProfileUser(profileUser);
    } else {
      applyDashboardPrefsFromAuthResponse(oauthData || {});
    }
  } catch (e) {
    console.warn('OAuth profile verify failed, using callback payload for prefs:', e);
    applyDashboardPrefsFromAuthResponse(oauthData || {});
  }

  goToDashboard(navigate, successMessage);
}

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleOAuthCallback = useCallback(
    async (code) => {
      try {
        const response = await fetch(getApiUrl('api/auth/google/callback'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        console.log('OAuth callback response:', data);

        const token = extractAndStoreToken(data);
        const successFlag = isApiSuccessFlag(data);
        const treatAsSuccess = response.ok && (successFlag || !!token);

        if (!treatAsSuccess || !token) {
          if (!response.ok || !successFlag) {
            toast.error(data.message || data.error || 'Failed to complete Google sign in');
          } else {
            toast.error(
              data.message || 'Sign-in succeeded but no session token was returned. Please try again.'
            );
          }
          oauthCodeExchangeStarted.delete(code);
          navigate('/login', { replace: true });
          return;
        }

        if (!successFlag && token) {
          console.warn('OAuth: treating as success because token present though success flag missing');
        }

        applyDashboardPrefsFromAuthResponse(data);

        const isNew =
          data.isNewUser === true ||
          data.user?.isNewUser === true ||
          data.data?.isNewUser === true ||
          data.data?.user?.isNewUser === true;

        const msg = isNew
          ? 'Account created! Welcome to TrustiChain.'
          : 'Successfully signed in with Google!';

        await verifySessionThenDashboard(navigate, data, msg);
      } catch (error) {
        console.error('OAuth callback error:', error);
        oauthCodeExchangeStarted.delete(code);
        toast.error('An error occurred during authentication');
        navigate('/login', { replace: true });
      }
    },
    [navigate]
  );

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('error_message') || searchParams.get('message');

    if (error || errorMessage) {
      toast.error(errorMessage || error || 'OAuth authentication failed');
      navigate('/login', { replace: true });
      return;
    }

    if (code) {
      if (oauthCodeExchangeStarted.has(code)) {
        return;
      }
      oauthCodeExchangeStarted.add(code);
      handleOAuthCallback(code);
      return;
    }

    const hashParams = parseHashParams();
    const hashAccess = hashParams.get('access_token') || hashParams.get('id_token');
    if (hashAccess && !oauthHashTokenHandled.has(hashAccess)) {
      oauthHashTokenHandled.add(hashAccess);
      localStorage.setItem('token', hashAccess);
      applyDashboardPrefsFromAuthResponse({});
      verifySessionThenDashboard(navigate, {}, 'Successfully signed in with Google!');
      return;
    }

    const token = searchParams.get('token');
    const success = searchParams.get('success');

    if (token) {
      localStorage.setItem('token', token);
      const kyc = searchParams.get('kycComplete') || searchParams.get('kyc');
      if (kyc === '1' || kyc === 'true') {
        localStorage.setItem('kycComplete', 'true');
      } else if (kyc === '0' || kyc === 'false') {
        localStorage.setItem('kycComplete', 'false');
      } else {
        applyDashboardPrefsFromAuthResponse({});
      }
      verifySessionThenDashboard(navigate, {}, 'Successfully signed in with Google!');
    } else if (success && localStorage.getItem('token')) {
      applyDashboardPrefsFromAuthResponse({});
      verifySessionThenDashboard(navigate, {}, 'Successfully signed in with Google!');
    } else if (!hashAccess) {
      toast.error('Missing authorization code or token. Please try signing in again.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, handleOAuthCallback]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div>Processing your Google sign in...</div>
    </div>
  );
};

export default OAuthCallback;
