import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from './SessionContext';
import { getApiUrl } from '../utils/config';

const TrustiscoreContext = createContext(null);

export function TrustiscoreProvider({ children }) {
  const { isSessionExpired } = useSession();
  const location = useLocation();
  const [score, setScore] = useState(null);
  const [level, setLevel] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrustiscore = useCallback(async () => {
    if (isSessionExpired) {
      setScore(null);
      setLevel('');
      setIsLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setScore(null);
      setLevel('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('api/dashboard/summary'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        setScore(null);
        setLevel('');
        return;
      }
      const result = await response.json().catch(() => ({}));
      const data = result?.data;
      const raw =
        data?.trustiscore ??
        data?.trustiScore ??
        data?.trust_score ??
        data?.user?.trustiscore ??
        data?.summary?.trustiscore;

      // API may return a number, string, or { score, level, total, value }
      if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
        const s = raw.score ?? raw.total ?? raw.value;
        if (s !== undefined && s !== null && s !== '') {
          const num = Number(s);
          setScore(Number.isFinite(num) ? num : null);
        } else {
          setScore(null);
        }
        setLevel(raw.level != null ? String(raw.level) : '');
      } else if (raw != null && raw !== '') {
        const num = Number(raw);
        setScore(Number.isFinite(num) ? num : null);
        setLevel('');
      } else {
        setScore(null);
        setLevel('');
      }
    } catch {
      setScore(null);
      setLevel('');
    } finally {
      setIsLoading(false);
    }
  }, [isSessionExpired]);

  // Refetch on route change so after login (navigate to /dashboard) we load with a token.
  // Initial mount also runs with current path; isSessionExpired changes still refresh via fetchTrustiscore identity.
  useEffect(() => {
    fetchTrustiscore();
  }, [fetchTrustiscore, location.pathname]);

  useEffect(() => {
    const onFocus = () => {
      if (!localStorage.getItem('token') || isSessionExpired) return;
      fetchTrustiscore();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchTrustiscore, isSessionExpired]);

  const value = useMemo(
    () => ({
      score,
      level,
      isLoading,
      refetch: fetchTrustiscore,
    }),
    [score, level, isLoading, fetchTrustiscore]
  );

  return <TrustiscoreContext.Provider value={value}>{children}</TrustiscoreContext.Provider>;
}

export function useTrustiscore() {
  const ctx = useContext(TrustiscoreContext);
  if (!ctx) {
    throw new Error('useTrustiscore must be used within TrustiscoreProvider');
  }
  return ctx;
}

/** Sidebar / mobile badge string (matches Dashboard fallbacks). */
export function formatTrustiscoreBadgeText(score, isLoading) {
  if (isLoading) return '...';
  if (score != null && Number.isFinite(Number(score))) return String(score);
  return '—';
}
