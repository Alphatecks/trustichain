export const normalizeEscrowStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const isCompletedEscrowStatus = (value) => {
  const normalized = normalizeEscrowStatus(value);
  return (
    normalized === 'completed' ||
    normalized === 'complete' ||
    normalized === 'released' ||
    normalized === 'escrow released' ||
    normalized === 'release completed' ||
    normalized === 'release complete' ||
    normalized === 'funds released' ||
    normalized === 'closed'
  );
};

export const isDisputedEscrowStatus = (value) => {
  const normalized = normalizeEscrowStatus(value);
  return (
    normalized === 'disputed' ||
    normalized === 'in dispute' ||
    normalized === 'under dispute' ||
    normalized === 'dispute' ||
    normalized.includes('disput')
  );
};

/** True when escrow has finished — even if API status still says "disputed". */
export const isEscrowCompleted = (escrow) => {
  if (!escrow || typeof escrow !== 'object') return false;

  const rawStatus = escrow.status || escrow.escrowStatus || escrow.state || '';
  if (isCompletedEscrowStatus(rawStatus)) return true;
  if (escrow.isCompleted === true || escrow.completed === true) return true;
  if (escrow.completedAt || escrow.releasedAt) return true;
  if (escrow.timeline?.paymentRelease) return true;
  if (escrow.paymentReleased === true || escrow.fundsReleased === true) return true;

  const disputeResolved =
    escrow.disputeResolved === true ||
    normalizeEscrowStatus(escrow.disputeStatus) === 'resolved' ||
    normalizeEscrowStatus(escrow.dispute?.status) === 'resolved';

  if (disputeResolved && (escrow.timeline?.paymentRelease || escrow.releasedAt || escrow.completedAt)) {
    return true;
  }

  return false;
};

/** Open escrows counted as Active (pending, in progress, pending release). */
export const isActiveEscrow = (escrow) => {
  if (!escrow || typeof escrow !== 'object') return false;
  if (isEscrowCompleted(escrow)) return false;
  const status = normalizeEscrowStatus(
    escrow.status || escrow.escrowStatus || escrow.state || '',
  );
  return status === 'pending' || status === 'active' || status === 'pending release';
};

/** Display label + CSS class for escrow list rows. Completed escrows never show as disputed. */
export const getEscrowDisplayStatus = (escrow) => {
  const raw = escrow?.status || escrow?.escrowStatus || 'Unknown';

  if (isEscrowCompleted(escrow)) {
    return {
      label: 'Completed',
      className: 'completed',
      isCompleted: true,
    };
  }

  const normalized = normalizeEscrowStatus(raw);
  const className = normalized.replace(/\s+/g, '_');

  return {
    label: raw,
    className: className || 'unknown',
    isCompleted: false,
  };
};

/** Canonical escrow id for dispute creation / parties API. */
export function resolveEscrowDisputeId(escrow) {
  if (!escrow || typeof escrow !== 'object') return '';
  return String(
    escrow.id ||
      escrow.escrowId ||
      escrow.xrplEscrowId ||
      escrow.xrpl_escrow_id ||
      '',
  ).trim();
}
