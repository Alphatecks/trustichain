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
  queueTrustitagWelcomeModal(tag);
}

const WELCOME_KEY = 'trustitag_welcome_pending';
const NEW_USER_WELCOME_ELIGIBLE_KEY = 'trustitag_welcome_new_user_eligible';

function toBooleanFlag(v) {
  if (v === true || v === 1) return true;
  if (typeof v !== 'string') return false;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

function readNewUserWelcomeEligibility() {
  try {
    const raw = sessionStorage.getItem(NEW_USER_WELCOME_ELIGIBLE_KEY);
    return toBooleanFlag(raw);
  } catch (_) {
    return false;
  }
}

function clearNewUserWelcomeEligibility() {
  try {
    sessionStorage.removeItem(NEW_USER_WELCOME_ELIGIBLE_KEY);
  } catch (_) {
    /* ignore */
  }
}

/** Mark current browser session as eligible to show welcome once trustitag is available. */
export function markTrustitagWelcomeEligibleForNewUser() {
  try {
    sessionStorage.setItem(NEW_USER_WELCOME_ELIGIBLE_KEY, '1');
  } catch (_) {
    /* quota / private mode */
  }
}

/** Best-effort check for "newly registered" across varying auth payload shapes. */
export function isNewlyRegisteredAuthResponse(data) {
  if (!data || typeof data !== 'object') return false;
  const nodes = [data, data.data, data.user, data.data?.user].filter(
    (node) => node && typeof node === 'object'
  );
  const flagKeys = [
    'isNewUser',
    'newUser',
    'isNewlyRegistered',
    'newlyRegistered',
    'justRegistered',
    'accountCreated',
    'new_user',
    'is_new_user',
  ];

  for (const node of nodes) {
    for (const key of flagKeys) {
      if (toBooleanFlag(node[key])) return true;
    }
  }
  return false;
}

/** Queue one-time welcome modal on next Dashboard visit (sessionStorage), only for new users. */
export function queueTrustitagWelcomeModal(trustitag, options = {}) {
  if (!trustitag || typeof trustitag !== 'string') return;
  const allowByResponse = options.newlyRegistered === true;
  const allowBySignupSession = readNewUserWelcomeEligibility();
  if (!allowByResponse && !allowBySignupSession) return;

  clearNewUserWelcomeEligibility();
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
