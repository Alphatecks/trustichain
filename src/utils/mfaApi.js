/**
 * MFA API — matches backend curl contract
 * ---------------------------------------
 * Start setup (returns secret + otpauthUrl):
 *   POST /api/user/mfa/setup
 *   Headers: Authorization: Bearer <jwt>, Content-Type: application/json
 *
 * Finish setup (6-digit code from the app):
 *   POST /api/user/mfa/setup/verify
 *   Body: {"code":"123456"}
 *
 * Disable MFA:
 *   POST /api/user/mfa/disable
 *   Body: {"code":"123456"}
 *
 * Login step 1 — password:
 *   POST /api/auth/login  {"email":"...","password":"..."}
 *   If MFA is on: requiresMfa: true, mfaToken (no JWT yet).
 *
 * Login step 2 — TOTP:
 *   POST /api/auth/login/mfa
 *   Body: {"code":"123456","mfaToken":"<from step 1>"}
 *   Never send mfaToken as Authorization Bearer — only in JSON body.
 *   Success: use data.accessToken (and data.refreshToken if you store it) for Bearer on API calls.
 *
 * OAuth SPA (Supabase session) — optional:
 *   POST /api/auth/oauth/mfa-prep  {"accessToken","refreshToken"}
 *   If requiresMfa + mfaToken → TOTP screen then POST /api/auth/login/mfa as above.
 *
 * MFA status (Settings reads this on load and after enroll/disable):
 *   GET /api/user/profile
 *   data.mfaEnabled — boolean
 */
import { getApiUrl } from './config';

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getErrorMessage(payload, fallback) {
  return payload?.message || payload?.error || fallback;
}

/**
 * Normalize MFA setup payload from various backend shapes.
 */
export function normalizeMfaSetupPayload(payload) {
  const d = payload?.data ?? payload;
  const secret = d.secret ?? d.base32Secret ?? d.base32_secret ?? d.manualEntryKey ?? '';
  const otpauthUrl =
    d.otpauthUrl ??
    d.otpauth_url ??
    d.uri ??
    d.url ??
    (secret ? buildOtpauthUrlFromSecret(d) : '');
  return {
    secret: String(secret),
    otpauthUrl: String(otpauthUrl),
    issuer: d.issuer ?? d.issuerName ?? 'TrustiChain',
    accountName: d.accountName ?? d.account ?? d.email ?? d.label ?? 'user',
  };
}

function buildOtpauthUrlFromSecret(d) {
  const secret = d.secret ?? d.base32Secret ?? d.base32_secret ?? d.manualEntryKey ?? '';
  if (!secret) return '';
  const issuer = String(d.issuer ?? d.issuerName ?? 'TrustiChain').replace(/:/g, '');
  const account = String(d.accountName ?? d.account ?? d.email ?? d.label ?? 'user');
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}`;
}

/**
 * Start TOTP enrollment (Google Authenticator).
 * POST api/user/mfa/setup — expects { success, data: { secret, otpauthUrl?, ... } }
 */
export async function startMfaSetup(token) {
  const res = await fetch(getApiUrl('api/user/mfa/setup'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const payload = await parseJson(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(getErrorMessage(payload, 'Failed to start authenticator setup'));
  }
  return normalizeMfaSetupPayload(payload);
}

/**
 * Confirm enrollment with a 6-digit TOTP code.
 * POST api/user/mfa/setup/verify — body { code }
 */
export async function verifyMfaSetup(token, code) {
  const clean = String(code || '').replace(/\D/g, '').slice(0, 6);
  const res = await fetch(getApiUrl('api/user/mfa/setup/verify'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: clean }),
  });
  const payload = await parseJson(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(getErrorMessage(payload, 'Invalid verification code'));
  }
  return payload?.data ?? payload;
}

/**
 * Disable MFA (requires current TOTP).
 * POST api/user/mfa/disable — body { code }
 */
export async function disableMfa(token, code) {
  const clean = String(code || '').replace(/\D/g, '').slice(0, 6);
  const res = await fetch(getApiUrl('api/user/mfa/disable'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: clean }),
  });
  const payload = await parseJson(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(getErrorMessage(payload, 'Could not disable authenticator'));
  }
  return payload?.data ?? payload;
}

/**
 * Extract access JWT from login / MFA responses (backend: data.accessToken).
 */
export function extractTokenFromAuthPayload(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.data?.accessToken) return data.data.accessToken;
  if (data.data?.access_token) return data.data.access_token;
  if (data.data?.token) return data.data.token;
  if (data.data?.jwt) return data.data.jwt;
  if (data.accessToken) return data.accessToken;
  if (data.access_token) return data.access_token;
  if (data.token) return data.token;
  if (data.jwt) return data.jwt;
  if (data.authToken) return data.authToken;
  if (data.data?.user?.token) return data.data.user.token;
  if (data.user?.token) return data.user.token;
  if (data.user?.accessToken) return data.user.accessToken;
  if (data.user?.access_token) return data.user.access_token;
  return null;
}

/**
 * Extract refresh token from login / MFA responses.
 */
export function extractRefreshTokenFromAuthPayload(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.data?.refreshToken) return data.data.refreshToken;
  if (data.data?.refresh_token) return data.data.refresh_token;
  if (data.refreshToken) return data.refreshToken;
  if (data.refresh_token) return data.refresh_token;
  return null;
}

/**
 * POST /api/auth/oauth/mfa-prep — after browser OAuth (e.g. Supabase session).
 * If response has requiresMfa + mfaToken, show TOTP then POST /api/auth/login/mfa.
 * Caller may call supabase.auth.signOut() after this until TOTP succeeds (recommended).
 */
export async function oauthMfaPrep({ accessToken, refreshToken }) {
  const at = String(accessToken || '').trim();
  const rt = String(refreshToken || '').trim();
  if (!at) {
    throw new Error('Missing access token for MFA prep');
  }
  const res = await fetch(getApiUrl('api/auth/oauth/mfa-prep'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: at,
      refreshToken: rt || undefined,
    }),
  });
  const payload = await parseJson(res);
  if (!res.ok || payload?.success === false) {
    throw new Error(getErrorMessage(payload, 'MFA prep failed'));
  }
  return payload?.data ?? payload;
}

/**
 * Complete login after password or OAuth MFA step — submit TOTP.
 * POST api/auth/login/mfa — body { code, mfaToken } only (no Bearer header with mfaToken).
 */
export async function completeLoginMfa({ code, mfaToken }) {
  const clean = String(code || '').replace(/\D/g, '').slice(0, 6);
  const tokenRaw = String(mfaToken || '').trim();
  if (!tokenRaw) {
    throw new Error('Missing MFA session. Please sign in again.');
  }

  const body = {
    code: clean,
    mfaToken: tokenRaw,
  };

  const url = getApiUrl('api/auth/login/mfa');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await parseJson(res);

  const accessToken = extractTokenFromAuthPayload(payload);
  const refreshToken = extractRefreshTokenFromAuthPayload(payload);

  if (!res.ok) {
    throw new Error(getErrorMessage(payload, 'Invalid verification code'));
  }
  if (payload?.success === false && !accessToken) {
    throw new Error(getErrorMessage(payload, 'Invalid verification code'));
  }
  if (!accessToken) {
    throw new Error('No session token returned after verification');
  }
  return {
    token: accessToken,
    accessToken,
    refreshToken,
    raw: payload,
  };
}
