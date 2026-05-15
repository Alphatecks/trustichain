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

function buildUrl(endpoint, query) {
  const url = getApiUrl(endpoint);
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

function getErrorMessage(payload, fallback) {
  return payload?.message || payload?.error || fallback;
}

/**
 * Maps varied API shapes to `{ notifications, total, unreadCount }` for the UI layer.
 */
export function normalizeNotificationsPayload(raw) {
  if (raw == null) return { notifications: [], total: 0, unreadCount: 0 };
  if (Array.isArray(raw)) {
    const notifications = raw;
    const unreadCount = notifications.filter((n) => n && !n.isRead && !n.read).length;
    return { notifications, total: notifications.length, unreadCount };
  }
  if (typeof raw !== 'object') return { notifications: [], total: 0, unreadCount: 0 };

  const notifications =
    (Array.isArray(raw.notifications) && raw.notifications) ||
    (Array.isArray(raw.items) && raw.items) ||
    (Array.isArray(raw.results) && raw.results) ||
    (Array.isArray(raw.records) && raw.records) ||
    (Array.isArray(raw.list) && raw.list) ||
    (Array.isArray(raw.data) && raw.data) ||
    [];

  const total =
    Number(raw.total ?? raw.totalCount ?? raw.count ?? notifications.length) || notifications.length;

  const explicitUnread = raw.unreadCount ?? raw.unread ?? raw.unread_total;
  const unreadCount = Number.isFinite(Number(explicitUnread))
    ? Number(explicitUnread)
    : notifications.filter((n) => n && !n.isRead && !n.read).length;

  return { notifications, total, unreadCount };
}

export async function getNotifications({ token, filter = 'all', page = 1, pageSize = 10 } = {}) {
  const url = buildUrl('api/notifications', { filter, page, pageSize });
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  const payload = await parseJson(response);
  if (!response.ok || payload?.success !== true) {
    throw new Error(getErrorMessage(payload, 'Failed to fetch notifications'));
  }
  const raw = payload?.data != null ? payload.data : payload;
  return normalizeNotificationsPayload(raw);
}

export async function markNotificationRead({ token, id } = {}) {
  const url = getApiUrl(`api/notifications/${encodeURIComponent(id)}/read`);
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  const payload = await parseJson(response);
  if (!response.ok || payload?.success !== true) {
    throw new Error(getErrorMessage(payload, 'Failed to mark notification as read'));
  }
  return true;
}

export async function markAllNotificationsRead({ token } = {}) {
  const url = getApiUrl('api/notifications/read-all');
  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  const payload = await parseJson(response);
  if (!response.ok || payload?.success !== true) {
    throw new Error(getErrorMessage(payload, 'Failed to mark all notifications as read'));
  }
  return true;
}



