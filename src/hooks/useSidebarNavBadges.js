import { useCallback } from 'react';
import { useEscrowNavBadge } from '../context/EscrowMetricsContext';
import { useDisputeNavBadge } from '../context/DisputeMetricsContext';

/**
 * Sidebar badges: live counts for My Escrow and Dispute; static item.badge for other items.
 */
export function useSidebarNavBadges() {
  const getEscrowBadge = useEscrowNavBadge();
  const getDisputeBadge = useDisputeNavBadge();
  return useCallback(
    (item) => {
      if (item?.label === 'Dispute') return getDisputeBadge(item);
      return getEscrowBadge(item);
    },
    [getEscrowBadge, getDisputeBadge]
  );
}
