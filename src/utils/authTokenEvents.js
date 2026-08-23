export const AUTH_TOKEN_CHANGED_EVENT = 'trustichain-auth-token-changed';

/** Same-tab localStorage writes do not fire `storage`; dispatch after login/logout. */
export function notifyAuthTokenChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
  }
}
