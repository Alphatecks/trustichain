function isPlainObject(x) {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}

export function getNotificationMergedPayload(notification) {
  const meta = isPlainObject(notification?.metadata) ? notification.metadata : {};
  const det = isPlainObject(notification?.details) ? notification.details : {};
  const data = isPlainObject(notification?.data) ? notification.data : {};
  return { ...meta, ...det, ...data };
}

export const TRANSACTIONS_PAGE_PATH = '/transactions';

export function buildTransactionDetailPath(transactionId) {
  const id = String(transactionId ?? '').trim();
  if (!id) return null;
  return `${TRANSACTIONS_PAGE_PATH}?transactionId=${encodeURIComponent(id)}`;
}

export function isTransactionsPagePath(url) {
  const raw = String(url ?? '').trim().toLowerCase();
  return raw === TRANSACTIONS_PAGE_PATH || raw.startsWith(`${TRANSACTIONS_PAGE_PATH}?`) || raw.startsWith(`${TRANSACTIONS_PAGE_PATH}/`);
}

export function normalizeTransactionIdForMatch(id) {
  return String(id ?? '')
    .trim()
    .toLowerCase()
    .replace(/^(txn-|tx-|#)+/g, '');
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    const s = String(value).trim();
    if (s) return s;
  }
  return null;
}

export function extractNotificationEscrowId(notification) {
  const merged = getNotificationMergedPayload(notification);
  return firstNonEmpty(
    notification?.escrowId,
    notification?.escrow_id,
    merged.escrowId,
    merged.xrplEscrowId,
    merged.escrow_id,
    merged.xrpl_escrow_id,
  );
}

export function extractNotificationTransactionId(notification) {
  const merged = getNotificationMergedPayload(notification);
  const entityType = String(merged.entityType ?? merged.entity_type ?? merged.resourceType ?? merged.resource_type ?? '')
    .trim()
    .toLowerCase();
  const entityLooksTransactional =
    entityType.includes('transaction')
    || entityType.includes('payment')
    || entityType.includes('wallet');

  const entityIds = entityLooksTransactional
    ? [merged.entityId, merged.entity_id, merged.resourceId, merged.resource_id, merged.relatedId, merged.related_id]
    : [];

  const escrowId = extractNotificationEscrowId(notification);
  const rawId = firstNonEmpty(merged.id, merged._id);
  const genericId =
    rawId && escrowId && normalizeTransactionIdForMatch(rawId) === normalizeTransactionIdForMatch(escrowId)
      ? null
      : rawId;

  return firstNonEmpty(
    notification?.transactionId,
    notification?.transaction_id,
    ...entityIds,
    merged.transactionId,
    merged.transaction_id,
    merged.txId,
    merged.tx_id,
    merged.walletTransactionId,
    merged.wallet_transaction_id,
    merged.paymentId,
    merged.payment_id,
    merged.referenceId,
    merged.reference_id,
    merged.releaseTransactionId,
    merged.release_transaction_id,
    merged.settlementTransactionId,
    merged.settlement_transaction_id,
    merged.linkedTransactionId,
    merged.linked_transaction_id,
    merged.reference,
    merged.txHash,
    merged.tx_hash,
    merged.transactionHash,
    merged.transaction_hash,
    genericId,
  );
}

export function extractNotificationLookupId(notification) {
  return extractNotificationTransactionId(notification) || extractNotificationEscrowId(notification);
}

export function transactionRecordMatchesId(tx, targetId) {
  if (!tx || targetId == null || String(targetId).trim() === '') return false;
  const norm = normalizeTransactionIdForMatch(targetId);
  if (!norm) return false;
  const fields = [tx.id, tx.transactionId, tx.txId, tx.reference, tx.hash, tx.txHash];
  return fields.some((field) => {
    const candidate = normalizeTransactionIdForMatch(field);
    if (!candidate) return false;
    return candidate === norm || candidate.endsWith(norm) || norm.endsWith(candidate);
  });
}

export function transactionRecordMatchesEscrowId(tx, escrowId) {
  if (!tx || escrowId == null || String(escrowId).trim() === '') return false;
  const norm = normalizeTransactionIdForMatch(escrowId);
  if (!norm) return false;
  const fields = [
    tx.escrowId,
    tx.escrow_id,
    tx.relatedEscrowId,
    tx.related_escrow_id,
    tx.reference,
    tx.description,
    tx.note,
    tx.reason,
  ];
  return fields.some((field) => {
    const candidate = normalizeTransactionIdForMatch(field);
    if (candidate && (candidate === norm || candidate.includes(norm) || norm.includes(candidate))) {
      return true;
    }
    const raw = String(field ?? '');
    return raw.toLowerCase().includes(norm);
  });
}

export function findTransactionForNotification(notification, transactions = []) {
  const txId = extractNotificationTransactionId(notification);
  if (txId) {
    const direct = transactions.find((tx) => transactionRecordMatchesId(tx, txId));
    if (direct) return { transaction: direct, lookupId: txId };
  }

  const escrowId = extractNotificationEscrowId(notification);
  if (escrowId) {
    const viaEscrow = transactions.find((tx) => transactionRecordMatchesEscrowId(tx, escrowId));
    if (viaEscrow) {
      return {
        transaction: viaEscrow,
        lookupId: viaEscrow.id || viaEscrow.transactionId || txId || escrowId,
      };
    }
  }

  return null;
}

export function extractTransactionIdFromUrl(url) {
  const raw = String(url ?? '').trim();
  if (!raw) return null;

  try {
    const parsed = raw.startsWith('http')
      ? new URL(raw)
      : new URL(raw, 'https://app.trustichain.local');
    const fromQuery = firstNonEmpty(
      parsed.searchParams.get('transactionId'),
      parsed.searchParams.get('transaction_id'),
      parsed.searchParams.get('txId'),
      parsed.searchParams.get('tx_id'),
    );
    if (fromQuery) return fromQuery;
  } catch {
    // fall through to regex
  }

  const queryMatch = raw.match(/[?&](?:transactionId|transaction_id|txId|tx_id)=([^&]+)/i);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]).trim();
    } catch {
      return queryMatch[1].trim();
    }
  }

  const pathMatch = raw.match(/\/transactions\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    try {
      return decodeURIComponent(pathMatch[1]).trim();
    } catch {
      return pathMatch[1].trim();
    }
  }

  return null;
}

export function isEscrowNotificationPath(url) {
  const raw = String(url ?? '').trim().toLowerCase();
  return raw.includes('/my-escrow') || raw.includes('/escrow');
}

const TRANSACTION_NOTIFICATION_TYPES = new Set([
  'wallet_deposit',
  'wallet_withdraw',
  'wallet_swap',
  'wallet_transfer',
  'wallet_send',
  'wallet_receive',
  'swap',
  'transaction',
  'payment',
  'deposit',
  'withdraw',
  'transfer',
  'send',
  'receive',
  'savings_funded',
  'savings_fund',
  'savings_deposit',
]);

const ESCROW_SETTLEMENT_NOTIFICATION_TYPES = new Set([
  'escrow_completed',
  'escrow_released',
  'escrow_complete',
  'escrow_release',
]);

export function isEscrowSettlementNotification(notification) {
  const type = String(notification?.type ?? '').trim().toLowerCase();
  if (ESCROW_SETTLEMENT_NOTIFICATION_TYPES.has(type)) return true;
  return type.includes('escrow_complete') || type.includes('escrow_release') || type.includes('escrow_completed');
}

export function isTransactionNotification(notification) {
  const type = String(notification?.type ?? '').trim().toLowerCase();
  if (TRANSACTION_NOTIFICATION_TYPES.has(type)) return true;
  if (isEscrowSettlementNotification(notification)) return true;
  if (
    type.includes('wallet')
    || type.includes('transaction')
    || type.includes('deposit')
    || type.includes('withdraw')
    || type.includes('swap')
    || type.includes('transfer')
    || type.includes('payment')
    || type.includes('savings')
  ) {
    return true;
  }

  const merged = getNotificationMergedPayload(notification);
  if (extractNotificationTransactionId(notification)) return true;
  if (merged.amount != null || merged.amountUsd != null || merged.amount_usd != null) return true;

  const label = String(
    notification?.actionLabel
    || notification?.action_label
    || notification?.ctaLabel
    || notification?.ctaText
    || notification?.buttonText
    || merged.actionLabel
    || merged.action_label
    || merged.ctaLabel
    || merged.buttonText
    || '',
  ).toLowerCase();
  return label.includes('transaction');
}

export function buildTransactionFromNotification(notification, preferredId) {
  const merged = getNotificationMergedPayload(notification);
  const id = firstNonEmpty(preferredId, extractNotificationTransactionId(notification), extractNotificationEscrowId(notification));
  if (!id) return null;

  const amountUsd = merged.amountUsd ?? merged.amount_usd ?? merged.usdAmount ?? merged.amount ?? 0;
  const amountXrp = merged.amountXrp ?? merged.amount_xrp ?? merged.xrpAmount ?? 0;
  const notificationType = String(notification?.type ?? '').trim().toLowerCase();
  const type = isEscrowSettlementNotification(notification)
    ? 'Escrow Completed'
    : (merged.type ?? merged.transactionType ?? notification?.type ?? 'Transaction');
  const escrowId = extractNotificationEscrowId(notification);

  return {
    id,
    transactionId: extractNotificationTransactionId(notification) || id,
    type,
    amountXrp: Number(amountXrp) || 0,
    amountUsd: Number(amountUsd) || 0,
    amount: isPlainObject(merged.amount) ? merged.amount : { xrp: amountXrp, usd: amountUsd },
    status: merged.status ?? merged.transactionStatus ?? (notificationType.includes('complete') ? 'Completed' : 'Successful'),
    date: merged.date ?? merged.createdAt ?? merged.timestamp ?? merged.completedAt ?? notification?.createdAt,
    description:
      notification?.message
      ?? notification?.body
      ?? notification?.title
      ?? (escrowId ? `Escrow ${escrowId}` : ''),
    from: merged.from ?? merged.fromAddress ?? merged.sender,
    to: merged.to ?? merged.toAddress ?? merged.recipient,
    hash: merged.hash ?? merged.txHash ?? merged.transactionHash,
    network: merged.network ?? merged.blockchain ?? 'XRP Ledger',
    direction: merged.direction ?? (notificationType.includes('deposit') || notificationType.includes('fund') ? 'received' : undefined),
    escrowId,
  };
}
