import {
  buildTransactionDetailPath,
  extractNotificationLookupId,
  extractNotificationTransactionId,
  extractTransactionIdFromUrl,
  isEscrowNotificationPath,
  isTransactionNotification,
  isTransactionsPagePath,
  TRANSACTIONS_PAGE_PATH,
} from './transactionDeepLink';

const strip = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');

const COLLAPSED_MAX = 90;

const DEFAULT_CTA_LABEL = 'Review Transaction';

function isPlainObject(x) {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}

/**
 * Merged `metadata` + `details` (details win). Used for CTA inference only — we do not render this as a list in the UI.
 */
function getMergedDetails(n) {
  const meta = isPlainObject(n?.metadata) ? n.metadata : {};
  const det = isPlainObject(n?.details) ? n.details : {};
  if (Object.keys(meta).length === 0 && Object.keys(det).length === 0) return null;
  return { ...meta, ...det };
}

function firstUrl(...candidates) {
  for (const c of candidates) {
    if (c == null) continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return null;
}

function getCtaLabel(n, merged) {
  return strip(
    n?.actionLabel
    || n?.action_label
    || n?.ctaLabel
    || n?.ctaText
    || n?.buttonText
    || merged?.actionLabel
    || merged?.action_label
    || merged?.ctaLabel
    || merged?.buttonText,
  ) || DEFAULT_CTA_LABEL;
}

function normalizeInAppPath(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return null;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function resolveTransactionDetailCta(n, label = DEFAULT_CTA_LABEL) {
  const lookupId = extractNotificationLookupId(n);
  if (lookupId) {
    const url = buildTransactionDetailPath(lookupId);
    if (url) return { url, label };
  }
  return null;
}

function resolveTransactionListCta(label = DEFAULT_CTA_LABEL) {
  return { url: TRANSACTIONS_PAGE_PATH, label };
}

/**
 * Explicit URL from the notification or nested `details` / `metadata` (not raw field dumps in the list).
 */
export function getNotificationCta(n) {
  const merged = getMergedDetails(n) || {};
  const label = getCtaLabel(n, merged);
  const transactionIntent = isTransactionNotification(n) || label.toLowerCase().includes('transaction');

  if (transactionIntent) {
    const direct = resolveTransactionDetailCta(n, label);
    if (direct) return direct;

    const explicitUrl = firstUrl(
      n?.actionUrl,
      n?.action_url,
      n?.link,
      n?.url,
      n?.href,
      merged.actionUrl,
      merged.action_url,
      merged.link,
      merged.url,
      merged.href,
      merged.deeplink,
    );
    if (explicitUrl) {
      const txFromUrl = extractTransactionIdFromUrl(explicitUrl);
      if (txFromUrl) {
        const url = buildTransactionDetailPath(txFromUrl);
        if (url) return { url, label };
      }
      if (!isEscrowNotificationPath(explicitUrl) && isTransactionsPagePath(explicitUrl)) {
        return { url: normalizeInAppPath(explicitUrl), label };
      }
    }

    // Always show Review Transaction for wallet/transaction alerts — open Transactions, never Escrow History.
    return resolveTransactionListCta(label);
  }

  const url = firstUrl(
    n?.actionUrl,
    n?.action_url,
    n?.link,
    n?.url,
    n?.href,
    merged.actionUrl,
    merged.action_url,
    merged.link,
    merged.url,
    merged.href,
    merged.deeplink,
  );
  if (url) {
    if (isEscrowNotificationPath(url)) {
      return { url, label };
    }
    return { url, label };
  }

  const txCta = resolveTransactionDetailCta(n, label);
  if (txCta) return txCta;

  const esc = merged.escrowId || merged.xrplEscrowId || merged.escrow_id;
  if (esc != null && String(esc).trim() !== '') {
    const id = String(esc).trim();
    return {
      url: `/my-escrow?escrowId=${encodeURIComponent(id)}`,
      label: DEFAULT_CTA_LABEL,
    };
  }

  return null;
}

/**
 * Stable id for expand/collapse state.
 */
export function getNotificationId(n, index) {
  if (n?.id != null && String(n.id) !== '') return String(n.id);
  return `nf-${index}`;
}

/**
 * Full body text (detail) for a notification.
 */
export function getNotificationBodyText(n) {
  return strip(n?.message || n?.body || n?.content || n?.description || '') || 'N/A';
}

/**
 * Single line shown when collapsed: explicit title, else truncated message.
 */
export function getNotificationSummaryLine(n) {
  const title = strip(n?.title || n?.subject || n?.headline);
  if (title) return title;
  const m = getNotificationBodyText(n);
  if (m === 'N/A') return 'N/A';
  if (m.length <= COLLAPSED_MAX) return m;
  return `${m.slice(0, COLLAPSED_MAX).trimEnd()}…`;
}

/**
 * Secondary text when expanded: main message (not a dump of `details` / `metadata`).
 */
export function getNotificationDetailText(n) {
  const title = strip(n?.title || n?.subject || n?.headline);
  const msg = strip(n?.message || n?.body || n?.content || n?.description || '');
  if (title && msg) return msg;
  if (msg) return msg;
  if (title) return '';
  return 'N/A';
}

/**
 * When false, the row is read-only (still marks as read) with no chevron/expand.
 */
export function hasExpandableContent(n) {
  if (getNotificationCta(n)) return true;
  const title = strip(n?.title || n?.subject || n?.headline);
  const full = getNotificationBodyText(n);
  if (title) return full !== 'N/A' && full.length > 0 && full !== title;
  return (full || '').length > COLLAPSED_MAX;
}
