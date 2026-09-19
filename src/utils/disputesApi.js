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

function toFiniteNumber(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickMetric(source, keys) {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    if (source[key] != null && source[key] !== '') return source[key];
  }
  return null;
}

function isResolvedDisputeStatus(status) {
  const s = String(status || '').toLowerCase();
  return ['resolved', 'closed', 'completed', 'won', 'lost', 'settled'].some((part) => s.includes(part));
}

function isCancelledDisputeStatus(status) {
  const s = String(status || '').toLowerCase();
  return ['cancel', 'withdrawn'].some((part) => s.includes(part));
}

function getDisputeOccurredAt(dispute) {
  return (
    dispute?.createdAt ||
    dispute?.created_at ||
    dispute?.openedAt ||
    dispute?.filedAt ||
    dispute?.date ||
    dispute?.updatedAt ||
    null
  );
}

export function parseDisputeSummaryMetrics(data) {
  const nested = data?.metrics && typeof data.metrics === 'object' ? data.metrics : {};
  const source = { ...(data && typeof data === 'object' ? data : {}), ...nested };
  return {
    totalDisputes: toFiniteNumber(pickMetric(source, ['totalDisputes', 'total', 'count', 'totalCount'])),
    activeDisputes: toFiniteNumber(pickMetric(source, ['activeDisputes', 'active', 'openDisputes', 'pendingDisputes'])),
    resolvedDisputes: toFiniteNumber(pickMetric(source, ['resolvedDisputes', 'resolved', 'closedDisputes'])),
    avgResolutionTimeSeconds: toFiniteNumber(
      pickMetric(source, ['avgResolutionTimeSeconds', 'averageResolutionTimeSeconds', 'avgResolutionTime', 'averageResolutionTime']),
    ),
    totalChangePercent: toFiniteNumber(pickMetric(source, ['totalChangePercent', 'totalDisputesChangePercent'])),
    activeChangePercent: toFiniteNumber(pickMetric(source, ['activeChangePercent', 'activeDisputesChangePercent'])),
    resolvedChangePercent: toFiniteNumber(pickMetric(source, ['resolvedChangePercent', 'resolvedDisputesChangePercent'])),
    avgResolutionTimeChangePercent: toFiniteNumber(
      pickMetric(source, ['avgResolutionTimeChangePercent', 'averageResolutionTimeChangePercent']),
    ),
  };
}

export function filterDisputesForMonth(disputes, monthYYYYMM) {
  const list = Array.isArray(disputes) ? disputes : [];
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthYYYYMM || ''));
  if (!match) return list;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const dated = list.filter((dispute) => getDisputeOccurredAt(dispute));
  const pool = dated.length > 0 ? dated : list;
  return pool.filter((dispute) => {
    const raw = getDisputeOccurredAt(dispute);
    if (!raw) return dated.length === 0;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return false;
    return date.getFullYear() === year && date.getMonth() === monthIndex;
  });
}

export function computeDisputeMetricsFromList(disputes) {
  const list = Array.isArray(disputes) ? disputes : [];
  const resolved = list.filter((d) => isResolvedDisputeStatus(d?.status));
  const active = list.filter((d) => !isResolvedDisputeStatus(d?.status) && !isCancelledDisputeStatus(d?.status));
  const durations = resolved
    .map((d) => toFiniteNumber(d?.durationSeconds ?? d?.resolutionTimeSeconds ?? d?.duration))
    .filter((n) => n != null && n >= 0);
  const avg = durations.length ? durations.reduce((sum, n) => sum + n, 0) / durations.length : 0;
  return {
    totalDisputes: list.length,
    activeDisputes: active.length,
    resolvedDisputes: resolved.length,
    avgResolutionTimeSeconds: durations.length ? avg : 0,
  };
}

export async function getDisputeSummary({ token, month, monthNumber, monthLabel } = {}) {
  const url = buildUrl('api/disputes/summary', { month, monthNumber, monthLabel });
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

export async function getAllDisputesForMonth({ token, month, monthNumber, pageSize = 50, maxPages = 20 } = {}) {
  const all = [];
  let reportedTotal = null;
  for (let page = 1; page <= maxPages; page += 1) {
    const data = await getDisputes({ token, status: 'all', month, monthNumber, page, pageSize });
    const list = Array.isArray(data?.disputes) ? data.disputes : Array.isArray(data) ? data : [];
    all.push(...list);
    const total = toFiniteNumber(data?.total ?? data?.totalCount ?? data?.count ?? data?.pagination?.total);
    if (total != null) reportedTotal = total;
    if (list.length < pageSize) break;
    if (reportedTotal != null && all.length >= reportedTotal) break;
  }
  return { disputes: all, total: reportedTotal };
}

export async function loadDisputeMonthOverview({ token, month, monthNumber, monthLabel } = {}) {
  const [summaryResult, listResult] = await Promise.allSettled([
    getDisputeSummary({ token, month, monthNumber, monthLabel }),
    getAllDisputesForMonth({ token, month, monthNumber }),
  ]);

  const summaryData = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
  const fromApi = parseDisputeSummaryMetrics(summaryData);
  let fetched = listResult.status === 'fulfilled' ? listResult.value : { disputes: [], total: null };
  let monthDisputes = filterDisputesForMonth(fetched.disputes, month);

  if (month && fetched.disputes.length > 0 && monthDisputes.length === 0) {
    try {
      fetched = await getAllDisputesForMonth({ token });
      monthDisputes = filterDisputesForMonth(fetched.disputes, month);
    } catch {
      monthDisputes = [];
    }
  }

  const fromList = computeDisputeMetricsFromList(monthDisputes);

  return {
    totalDisputes: fromList.totalDisputes,
    activeDisputes: fromList.activeDisputes,
    resolvedDisputes: fromList.resolvedDisputes,
    avgResolutionTimeSeconds: fromList.avgResolutionTimeSeconds,
    totalChangePercent: fromApi.totalChangePercent,
    activeChangePercent: fromApi.activeChangePercent,
    resolvedChangePercent: fromApi.resolvedChangePercent,
    avgResolutionTimeChangePercent: fromApi.avgResolutionTimeChangePercent,
  };
}

export async function getDisputes({ token, status = 'all', month, monthNumber, page = 1, pageSize = 10 } = {}) {
  const url = buildUrl('api/disputes', { status, month, monthNumber, page, pageSize });
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


