import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from './SessionContext';
import { getDisputeSummary } from '../utils/disputesApi';

const DisputeMetricsContext = createContext(null);

function totalDisputesFromSummaryData(data) {
  if (!data || typeof data !== 'object') return null;
  const metrics = data.metrics;
  const raw =
    metrics?.totalDisputes ??
    data.totalDisputes ??
    data.total ??
    null;
  if (raw === undefined || raw === null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export function DisputeMetricsProvider({ children }) {
  const { isSessionExpired } = useSession();
  const [totalDisputes, setTotalDisputes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTotalDisputes = useCallback(async () => {
    if (isSessionExpired) {
      setTotalDisputes(null);
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setTotalDisputes(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getDisputeSummary({ token });
      const n = totalDisputesFromSummaryData(data);
      setTotalDisputes(n);
    } catch {
      setTotalDisputes(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    fetchTotalDisputes();
  }, [fetchTotalDisputes]);

  useEffect(() => {
    const onFocus = () => {
      if (!localStorage.getItem('token') || isSessionExpired) return;
      fetchTotalDisputes();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchTotalDisputes, isSessionExpired]);

  const badgeText = useMemo(() => {
    if (isLoading) return null;
    if (totalDisputes == null) return '—';
    return String(totalDisputes);
  }, [isLoading, totalDisputes]);

  const value = useMemo(
    () => ({
      totalDisputes,
      isLoading,
      badgeText,
      refetch: fetchTotalDisputes,
    }),
    [totalDisputes, isLoading, badgeText, fetchTotalDisputes]
  );

  return <DisputeMetricsContext.Provider value={value}>{children}</DisputeMetricsContext.Provider>;
}

export function useDisputeMetrics() {
  const ctx = useContext(DisputeMetricsContext);
  if (!ctx) {
    throw new Error('useDisputeMetrics must be used within DisputeMetricsProvider');
  }
  return ctx;
}

/**
 * Badge for sidebar "Dispute": total count from GET api/disputes/summary (no month = all-time / server default).
 */
export function useDisputeNavBadge() {
  const { badgeText, isLoading } = useDisputeMetrics();
  return useCallback(
    (item) => {
      if (!item || item.label !== 'Dispute') return item?.badge ?? null;
      if (isLoading) return '…';
      return badgeText;
    },
    [badgeText, isLoading]
  );
}
