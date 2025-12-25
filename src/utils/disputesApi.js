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

export async function getDisputeSummary({ token, month } = {}) {
  const url = buildUrl('api/disputes/summary', { month });
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  const payload = await parseJson(response);
  if (!response.ok || payload?.success !== true) {
    throw new Error(getErrorMessage(payload, 'Failed to fetch dispute summary'));
  }
  return payload?.data || null;
}

export async function getDisputes({ token, status = 'all', month, page = 1, pageSize = 10 } = {}) {
  const url = buildUrl('api/disputes', { status, month, page, pageSize });
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  const payload = await parseJson(response);
  if (!response.ok || payload?.success !== true) {
    throw new Error(getErrorMessage(payload, 'Failed to fetch disputes'));
  }
  return payload?.data || null;
}

export async function getDisputeDetail({ token, id } = {}) {
  const url = getApiUrl(`api/disputes/${encodeURIComponent(id)}`);
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  const payload = await parseJson(response);
  if (!response.ok || payload?.success !== true) {
    throw new Error(getErrorMessage(payload, 'Failed to fetch dispute'));
  }
  return payload?.data || null;
}


