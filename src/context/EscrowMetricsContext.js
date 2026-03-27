import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from './SessionContext';
import { getApiUrl } from '../utils/config';
import { formatEscrowCountBadge, totalEscrowCountFromListData } from '../utils/escrowListMetrics';

const EscrowMetricsContext = createContext(null);

export function EscrowMetricsProvider({ children }) {
  const { isSessionExpired } = useSession();
  const [escrowCount, setEscrowCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEscrowCount = useCallback(async () => {
    if (isSessionExpired) {
      setEscrowCount(null);
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setEscrowCount(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('api/escrow/list?limit=1000&offset=0'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        setEscrowCount(null);
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setEscrowCount(totalEscrowCountFromListData(result.data));
      } else {
        setEscrowCount(0);
      }
    } catch {
      setEscrowCount(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    fetchEscrowCount();
  }, [fetchEscrowCount]);

  useEffect(() => {
    const onFocus = () => {
      if (!localStorage.getItem('token') || isSessionExpired) return;
      fetchEscrowCount();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchEscrowCount, isSessionExpired]);

  const badgeText = useMemo(() => {
    if (isLoading) return null;
    if (escrowCount == null) return '—';
    return formatEscrowCountBadge(escrowCount);
  }, [isLoading, escrowCount]);

  const value = useMemo(
    () => ({
      escrowCount,
      isLoading,
      badgeText,
      refetch: fetchEscrowCount,
    }),
    [escrowCount, isLoading, badgeText, fetchEscrowCount]
  );

  return <EscrowMetricsContext.Provider value={value}>{children}</EscrowMetricsContext.Provider>;
}

export function useEscrowMetrics() {
  const ctx = useContext(EscrowMetricsContext);
  if (!ctx) {
    throw new Error('useEscrowMetrics must be used within EscrowMetricsProvider');
  }
  return ctx;
}

/**
 * Badge string for a sidebar item: live escrow count for "My Escrow", else static item.badge.
 */
export function useEscrowNavBadge() {
  const { badgeText, isLoading } = useEscrowMetrics();
  return useCallback(
    (item) => {
      if (!item || item.label !== 'My Escrow') return item?.badge ?? null;
      if (isLoading) return '…';
      return badgeText;
    },
    [badgeText, isLoading]
  );
}
