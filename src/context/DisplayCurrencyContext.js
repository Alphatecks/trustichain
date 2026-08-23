import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { useSession } from './SessionContext';
import { getApiUrl } from '../utils/config';
import { formatDisplayAmountFromUsd, normalizeExchangeQuoteDirection } from '../utils/displayCurrencyFormat';
import {
  fetchDisplayCurrencyPreference,
  normalizeDisplayCurrency,
  patchDisplayCurrencyPreference,
  readStoredDisplayCurrency,
  writeStoredDisplayCurrency,
} from '../utils/displayCurrencyPreferences';
import { AUTH_TOKEN_CHANGED_EVENT } from '../utils/authTokenEvents';

const DisplayCurrencyContext = createContext(null);

export const useDisplayCurrency = () => {
  const context = useContext(DisplayCurrencyContext);
  if (!context) {
    throw new Error('useDisplayCurrency must be used within a DisplayCurrencyProvider');
  }
  return context;
};

export const DisplayCurrencyProvider = ({ children }) => {
  const { isSessionExpired } = useSession();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('token'));
  const [displayCurrency, setDisplayCurrencyState] = useState(() => readStoredDisplayCurrency());
  const [displayCurrencyRevision, setDisplayCurrencyRevision] = useState(0);
  const [isLoadingDisplayCurrency, setIsLoadingDisplayCurrency] = useState(true);
  const [isSavingDisplayCurrency, setIsSavingDisplayCurrency] = useState(false);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [exchangeQuoteDirection, setExchangeQuoteDirection] = useState('unitsPerUsd');
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState(true);
  const pendingCurrencySaveRef = useRef(null);
  const prevAuthTokenRef = useRef(authToken);

  useEffect(() => {
    const syncAuthToken = () => {
      setAuthToken(localStorage.getItem('token'));
    };

    syncAuthToken();
    window.addEventListener('storage', syncAuthToken);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAuthToken);
    const interval = setInterval(syncAuthToken, 1000);

    return () => {
      window.removeEventListener('storage', syncAuthToken);
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAuthToken);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (authToken && !prevAuthTokenRef.current) {
      setDisplayCurrencyRevision((revision) => revision + 1);
    }
    prevAuthTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    let cancelled = false;

    const loadPreference = async () => {
      if (!authToken || isSessionExpired) {
        if (!cancelled) {
          setDisplayCurrencyState(readStoredDisplayCurrency());
          setIsLoadingDisplayCurrency(false);
        }
        return;
      }

      if (!cancelled) setIsLoadingDisplayCurrency(true);

      try {
        const remote = await fetchDisplayCurrencyPreference(authToken);
        if (!cancelled && remote) {
          const normalized = normalizeDisplayCurrency(remote);
          setDisplayCurrencyState(normalized);
          writeStoredDisplayCurrency(normalized);
        }
      } catch (error) {
        console.warn('Could not load display currency preference:', error);
      } finally {
        if (!cancelled) setIsLoadingDisplayCurrency(false);
      }
    };

    loadPreference();
    return () => {
      cancelled = true;
    };
  }, [isSessionExpired, authToken]);

  useEffect(() => {
    let cancelled = false;

    const loadExchangeRates = async () => {
      if (!authToken || isSessionExpired) {
        if (!cancelled) {
          setExchangeRates([]);
          setIsLoadingExchangeRates(false);
        }
        return;
      }

      if (!cancelled) setIsLoadingExchangeRates(true);

      try {
        const response = await fetch(getApiUrl('api/exchange/rates'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          if (!cancelled && result?.success && Array.isArray(result?.data?.rates)) {
            setExchangeRates(result.data.rates);
            setExchangeQuoteDirection(
              normalizeExchangeQuoteDirection(result?.data?.quoteDirection),
            );
          } else if (!cancelled) {
            setExchangeRates([]);
          }
        } else if (!cancelled) {
          setExchangeRates([]);
        }
      } catch (error) {
        console.warn('Could not load exchange rates for display currency:', error);
        if (!cancelled) setExchangeRates([]);
      } finally {
        if (!cancelled) setIsLoadingExchangeRates(false);
      }
    };

    loadExchangeRates();
    return () => {
      cancelled = true;
    };
  }, [isSessionExpired, authToken]);

  const setDisplayCurrency = useCallback(async (code) => {
    const normalized = normalizeDisplayCurrency(code);
    const previous = readStoredDisplayCurrency();
    if (normalized === previous && !pendingCurrencySaveRef.current) {
      return { success: true, unchanged: true };
    }

    pendingCurrencySaveRef.current = normalized;
    setDisplayCurrencyState(normalized);
    writeStoredDisplayCurrency(normalized);

    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      pendingCurrencySaveRef.current = null;
      setDisplayCurrencyRevision((revision) => revision + 1);
      return { success: true, localOnly: true };
    }

    setIsSavingDisplayCurrency(true);
    try {
      await patchDisplayCurrencyPreference(token, normalized);
      const synced = readStoredDisplayCurrency();
      setDisplayCurrencyState(synced);
      setDisplayCurrencyRevision((revision) => revision + 1);
      pendingCurrencySaveRef.current = null;
      return { success: true, displayCurrency: synced };
    } catch (error) {
      console.warn('Failed to persist display currency preference:', error);
      setDisplayCurrencyState(previous);
      writeStoredDisplayCurrency(previous);
      pendingCurrencySaveRef.current = null;
      toast.error(error?.message || 'Could not save display currency. Please try again.');
      return { success: false, error };
    } finally {
      setIsSavingDisplayCurrency(false);
    }
  }, [isSessionExpired]);

  const formatFromUsd = useCallback(
    (usdAmount, options = {}) =>
      formatDisplayAmountFromUsd(usdAmount, displayCurrency, exchangeRates, {
        ...options,
        quoteDirection: options.quoteDirection ?? exchangeQuoteDirection,
        isLoadingRates: options.isLoadingRates ?? isLoadingExchangeRates,
      }),
    [displayCurrency, exchangeRates, exchangeQuoteDirection, isLoadingExchangeRates],
  );

  const value = {
    displayCurrency,
    setDisplayCurrency,
    displayCurrencyRevision,
    isLoadingDisplayCurrency,
    isSavingDisplayCurrency,
    exchangeRates,
    exchangeQuoteDirection,
    isLoadingExchangeRates,
    formatFromUsd,
  };

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
};
