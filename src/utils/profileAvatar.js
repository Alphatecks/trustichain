/**
 * Profile photo URL from GET /api/user/profile `data` (or nested `user`).
 * Backend returns signed `avatarUrl`; older payloads used `avatar`, etc.
 */
export function getProfileAvatarUrl(data) {
  if (!data || typeof data !== 'object') return null;
  const user = data.user && typeof data.user === 'object' ? data.user : null;
  const raw =
    data.avatarUrl ??
    data.avatar ??
    data.profilePicture ??
    data.image ??
    data.photo ??
    (user &&
      (user.avatarUrl ?? user.avatar ?? user.profilePicture ?? user.image ?? user.photo));
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  return s || null;
}
