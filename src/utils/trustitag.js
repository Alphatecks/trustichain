/**
 * Trustitag from login / MFA / OAuth / GET api/user/profile payloads
 * (e.g. data.user.trustitag or data.trustitag on result.data).
 */
export function extractTrustitagFromLoginResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const u = data.data?.user ?? data.user ?? data.data;
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const t = u.trustitag ?? u.trustiTag ?? u.trust_itag;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  return null;
}

/** Store trustitag from GET /api/user/profile JSON (`success` + `data.trustitag`). */
export function persistTrustitagFromProfileResponse(result) {
  const tag = extractTrustitagFromLoginResponse(result);
  if (!tag) return;
  try {
    localStorage.setItem('trustitag', tag);
  } catch (_) {
    /* quota / private mode */
  }
}

const WELCOME_KEY = 'trustitag_welcome_pending';

/** Queue one-time welcome modal on next Dashboard visit (sessionStorage). */
export function queueTrustitagWelcomeModal(trustitag) {
  if (!trustitag || typeof trustitag !== 'string') return;
  try {
    sessionStorage.setItem(WELCOME_KEY, trustitag.trim());
  } catch (_) {
    /* quota / private mode */
  }
}

export function peekTrustitagWelcomePending() {
  try {
    const v = sessionStorage.getItem(WELCOME_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch (_) {
    return null;
  }
}

/** Clear pending welcome (call when user dismisses the modal). */
export function clearTrustitagWelcomePending() {
  try {
    sessionStorage.removeItem(WELCOME_KEY);
  } catch (_) {
    /* ignore */
  }
}
