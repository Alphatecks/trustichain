import { isActiveEscrow } from './escrowDisplayStatus';

/**
 * Total number of escrows from GET api/escrow/list `data`.
 * Prefers pagination totals from the API; falls back to array length.
 */
export function totalEscrowCountFromListData(data) {
  if (!data || typeof data !== 'object') return 0;
  const raw =
    data.total ??
    data.count ??
    data.totalCount ??
    data.escrowCount ??
    data.totalEscrows ??
    null;
  if (raw != null && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  if (Array.isArray(data.escrows)) return data.escrows.length;
  if (Array.isArray(data)) return data.length;
  return 0;
}

function escrowArrayFromListData(data) {
  if (Array.isArray(data?.escrows)) return data.escrows;
  if (Array.isArray(data)) return data;
  return [];
}

/** Count of open/active escrows (pending, active, pending release). */
export function activeEscrowCountFromListData(data) {
  if (!data || typeof data !== 'object') return 0;
  return escrowArrayFromListData(data).filter(isActiveEscrow).length;
}

/** Sidebar badge: whole number of escrows. */
export function formatEscrowCountBadge(count) {
  if (!Number.isFinite(count) || count < 0) return '—';
  return String(Math.floor(count));
}
