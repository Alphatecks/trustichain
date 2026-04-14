import React, { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import { isNewlyRegisteredAuthResponse, queueTrustitagWelcomeModal } from '../../utils/trustitag';

/**
 * Google OAuth + MFA (server redirect flow)
 * -----------------------------------------
 * The backend does NOT return `requires_mfa` / `mfa_token` as a normal JSON login body.
 * After `GET /api/auth/google/callback?code=...`, the API responds with **302** whose
 * `Location` is your SPA, e.g.:
 *   {FRONTEND_URL}/auth/callback?success=true&provider=google#requires_mfa=true&mfa_token=<...>&user_email=...&user_id=...
 * MFA flags live in the **URL fragment** (hash), snake_case. This component reads them via
 * `window.location.hash` / `parseHashParams()` — not from a JSON response body.
 *
 * Email/password login still uses `POST /api/auth/login` JSON with `requiresMfa` + `mfaToken` when applicable.
 */

/** Survives React Strict Mode remount (refs reset); prevents double POST of the same OAuth code. */
const oauthCodeExchangeStarted = new Set();
const oauthHashTokenHandled = new Set();
/** Prevents double navigation when hash has requires_mfa + mfa_token (Strict Mode). */
const oauthMfaFragmentHandled = new Set();

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

function applyDashboardPrefsFromProfileUser(user, options = {}) {
  const isNewlyRegistered = options.isNewlyRegistered === true;
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

  const tag = user.trustitag ?? user.trustiTag;
  if (typeof tag === 'string' && tag.trim()) {
    try {
      localStorage.setItem('trustitag', tag.trim());
    } catch (_) {
      /* ignore */
    }
    queueTrustitagWelcomeModal(tag.trim(), { newlyRegistered: isNewlyRegistered });
  }
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
  if (typeof value !== 'string' || value.length < 10) return false;
  return looksLikeJwt(value) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/.test(value);
}

/** Avoid "Bearer Bearer xxx" when sending Authorization headers. */
function normalizeBearerToken(raw) {
  if (typeof raw !== 'string') return '';
  let s = raw.trim();
  while (/^bearer\s+/i.test(s)) {
    s = s.replace(/^bearer\s+/i, '').trim();
  }
  return s;
}

function storeSessionToken(raw) {
  const t = normalizeBearerToken(raw);
  if (!t) return null;
  localStorage.setItem('token', t);
  return t;
}

/**
 * Last resort: find a JWT-shaped string in the JSON tree, preferring keys that look like auth fields.
 */
function findApiJwtInObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 12) return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const t = findApiJwtInObject(item, depth + 1);
      if (t) return t;
    }
    return null;
  }
  const keys = Object.keys(obj);
  const score = (k) => (/token|jwt|access|bearer|auth|session|credential/i.test(k) ? 1 : 0);
  keys.sort((a, b) => score(b) - score(a));
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string') {
      const t = normalizeBearerToken(v);
      if (looksLikeJwt(t)) return t;
    } else if (v && typeof v === 'object') {
      const t = findApiJwtInObject(v, depth + 1);
      if (t) return t;
    }
  }
  return null;
}

/** Strip trailing slashes for redirect_uri parity with OAuth authorize request. */
function normalizeCallbackPathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function buildOAuthRedirectUri(pathname) {
  if (typeof window === 'undefined') return '';
  const p = normalizeCallbackPathname(pathname);
  return `${window.location.origin}${p}`;
}

/**
 * Deep scan for session strings (handles nested data.tokens.accessToken, etc.)
 */
function deepFindAuthToken(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return null;
  const priorityKeys = [
    'accessToken',
    'access_token',
    'authentication_token',
    'auth_token',
    'token',
    'jwt',
    'idToken',
    'id_token',
    'authToken',
    'bearerToken',
    'sessionToken',
    'session_token',
  ];
  for (const k of priorityKeys) {
    if (!(k in obj)) continue;
    const v = obj[k];
    if (typeof v === 'string') {
      const t = normalizeBearerToken(v);
      if (t.length >= 8) return t;
    }
  }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item && typeof item === 'object') {
          const t = deepFindAuthToken(item, depth + 1);
          if (t) return t;
        }
      }
      continue;
    }
    if (v && typeof v === 'object') {
      const t = deepFindAuthToken(v, depth + 1);
      if (t) return t;
    }
  }
  return null;
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
    data.tokens,
    data.session && typeof data.session === 'object' ? data.session : null,
  ].filter((x) => x && typeof x === 'object');

  const keyPattern = /token|jwt|access|bearer/i;

  for (const obj of containers) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'string') continue;
      if (!keyPattern.test(key)) continue;
      if (looksLikeTokenString(value)) return normalizeBearerToken(value);
    }
  }
  return null;
}

function extractAndStoreToken(data) {
  if (!data || typeof data !== 'object') {
    const fb = extractTokenFallback(data);
    return fb ? storeSessionToken(fb) : null;
  }

  let raw =
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.authentication_token ||
    data.auth_token ||
    data.jwt ||
    data.data?.token ||
    data.data?.jwt ||
    data.data?.accessToken ||
    data.data?.access_token ||
    data.data?.authentication_token ||
    data.data?.auth_token ||
    data.user?.token ||
    data.user?.accessToken ||
    data.user?.access_token ||
    data.user?.authentication_token ||
    data.auth?.token ||
    data.result?.token ||
    data.session?.token ||
    data.session?.accessToken ||
    data.session?.access_token ||
    data.tokens?.access_token ||
    data.tokens?.accessToken;

  if (typeof raw === 'string') {
    const stored = storeSessionToken(raw);
    if (stored) return stored;
  }

  const deep = deepFindAuthToken(data);
  if (deep) {
    const stored = storeSessionToken(deep);
    if (stored) {
      console.log('OAuth: token stored via deep key scan');
      return stored;
    }
  }

  const fallback = extractTokenFallback(data);
  if (fallback) {
    const stored = storeSessionToken(fallback);
    if (stored) {
      console.log('OAuth: token stored via fallback key scan');
      return stored;
    }
  }

  const jwtScan = findApiJwtInObject(data);
  if (jwtScan) {
    const stored = storeSessionToken(jwtScan);
    if (stored) {
      console.log('OAuth: token stored via JWT scan of callback JSON');
      return stored;
    }
  }

  return null;
}

/**
 * Parse `#requires_mfa=true&mfa_token=...&user_email=...` from the OAuth redirect fragment.
 * (Fragment is not sent to the server; only the browser sees it.)
 */
function parseHashParams() {
  if (typeof window === 'undefined') return new URLSearchParams();
  const raw = window.location.hash?.replace(/^#/, '') || '';
  return new URLSearchParams(raw);
}

/** Strip #fragment from URL without navigation (tokens leave the visible URL). */
function clearOAuthHashFromUrl() {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}`);
}

async function postEnsureProfile(accessToken) {
  const t = normalizeBearerToken(accessToken);
  if (!t) return { ok: false };
  try {
    const res = await fetch(getApiUrl('api/auth/ensure-profile'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn('ensure-profile:', res.status, body);
    }
    return { ok: res.ok, body };
  } catch (e) {
    console.warn('ensure-profile request failed:', e);
    return { ok: false };
  }
}

/** Only treat explicit success values as true (avoid truthy "false"). */
function isQueryParamSuccessTrue(raw) {
  if (raw == null || raw === '') return false;
  if (raw === true) return true;
  const s = String(raw).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function getOAuthTokenFromSearchParams(searchParams) {
  const keys = ['token', 'access_token', 'accessToken', 'jwt', 'id_token'];
  for (const k of keys) {
    const v = searchParams.get(k);
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
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
  const isNewlyRegistered = isNewlyRegisteredAuthResponse(oauthData || {});
  const rawStored = localStorage.getItem('token') || '';
  const token = normalizeBearerToken(rawStored);
  if (token && token !== rawStored) {
    localStorage.setItem('token', token);
  }
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
      applyDashboardPrefsFromProfileUser(profileUser, { isNewlyRegistered });
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const handleOAuthCallback = useCallback(
    async (code, exchangeMeta) => {
      const redirect_uri =
        exchangeMeta?.redirectUri || buildOAuthRedirectUri(location.pathname);
      const state = exchangeMeta?.state;
      try {
        const response = await fetch(getApiUrl('api/auth/google/callback'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri,
            redirectUri: redirect_uri,
            ...(state ? { state } : {}),
          }),
        });

        const rawText = (await response.text()) || '';
        let data = {};
        let token = null;
        const trimmedBody = rawText.trim();
        const bodyAsJwt = trimmedBody ? normalizeBearerToken(trimmedBody) : '';
        if (bodyAsJwt && looksLikeJwt(bodyAsJwt)) {
          token = storeSessionToken(bodyAsJwt);
        } else if (trimmedBody) {
          try {
            data = JSON.parse(rawText);
          } catch {
            data = {};
          }
        }

        console.log('OAuth callback response:', data);

        if (!token) {
          token = extractAndStoreToken(data);
        }
        if (!token && trimmedBody) {
          const t = normalizeBearerToken(trimmedBody);
          if (looksLikeJwt(t)) token = storeSessionToken(t);
        }
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

        const isNew = isNewlyRegisteredAuthResponse(data);

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
    [navigate, location.pathname]
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
      const redirectUri = buildOAuthRedirectUri(location.pathname);
      const state = searchParams.get('state') || undefined;
      handleOAuthCallback(code, { redirectUri, state });
      return;
    }

    const hashParams = parseHashParams();
    const requiresMfaFragment =
      hashParams.get('requires_mfa') === 'true' ||
      hashParams.get('requiresMfa') === 'true' ||
      hashParams.get('requires_mfa') === '1' ||
      hashParams.get('requiresMfa') === '1';
    const mfaTokenFragment =
      hashParams.get('mfa_token') || hashParams.get('mfaToken') || '';
    const hashAccess =
      hashParams.get('access_token') || hashParams.get('id_token');
    const hashRefresh = hashParams.get('refresh_token');

    // Google OAuth server redirect: MFA required — no access_token until TOTP succeeds
    if ((requiresMfaFragment || mfaTokenFragment) && !hashAccess) {
      if (!mfaTokenFragment) {
        toast.error('Additional verification required but MFA token is missing.');
        navigate('/login', { replace: true });
        return;
      }
      const dedupeKey = `mfa:${mfaTokenFragment.length}:${mfaTokenFragment.slice(0, 48)}`;
      if (oauthMfaFragmentHandled.has(dedupeKey)) {
        return;
      }
      oauthMfaFragmentHandled.add(dedupeKey);
      const ue =
        hashParams.get('user_email') ||
        hashParams.get('email') ||
        hashParams.get('userEmail') ||
        '';
      try {
        sessionStorage.setItem('mfa_login_token', String(mfaTokenFragment).trim());
        sessionStorage.setItem('mfa_login_email', String(ue).trim());
      } catch (_) {
        /* ignore */
      }
      clearOAuthHashFromUrl();
      navigate('/two-factor', {
        replace: true,
        state: {
          mfaToken: String(mfaTokenFragment).trim(),
          email: ue,
          oauthMeta: {
            userId: hashParams.get('user_id') || hashParams.get('userId') || '',
            fullName: hashParams.get('full_name') || hashParams.get('fullName') || '',
            country: hashParams.get('country') || '',
          },
        },
      });
      return;
    }

    if (hashAccess && !oauthHashTokenHandled.has(hashAccess)) {
      oauthHashTokenHandled.add(hashAccess);
      storeSessionToken(hashAccess);
      if (hashRefresh) {
        localStorage.setItem(
          'refresh_token',
          normalizeBearerToken(hashRefresh)
        );
      }
      clearOAuthHashFromUrl();
      (async () => {
        await postEnsureProfile(hashAccess);
        applyDashboardPrefsFromAuthResponse({});
        await verifySessionThenDashboard(
          navigate,
          {},
          'Successfully signed in with Google!'
        );
      })();
      return;
    }

    const tokenFromQuery = getOAuthTokenFromSearchParams(searchParams);
    const successOk = isQueryParamSuccessTrue(searchParams.get('success'));

    if (tokenFromQuery) {
      storeSessionToken(tokenFromQuery);
      const kyc = searchParams.get('kycComplete') || searchParams.get('kyc');
      if (kyc === '1' || kyc === 'true') {
        localStorage.setItem('kycComplete', 'true');
      } else if (kyc === '0' || kyc === 'false') {
        localStorage.setItem('kycComplete', 'false');
      } else {
        applyDashboardPrefsFromAuthResponse({});
      }
      verifySessionThenDashboard(navigate, {}, 'Successfully signed in with Google!');
    } else if (successOk && localStorage.getItem('token')) {
      applyDashboardPrefsFromAuthResponse({});
      verifySessionThenDashboard(navigate, {}, 'Successfully signed in with Google!');
    } else if (successOk) {
      navigate('/dashboard', { replace: true });
      return;
    } else if (!hashAccess) {
      toast.error('Missing authorization code or token. Please try signing in again.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, handleOAuthCallback, location.pathname, location.hash]);

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
