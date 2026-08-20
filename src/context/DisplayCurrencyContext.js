import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
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
  const [displayCurrency, setDisplayCurrencyState] = useState(() => readStoredDisplayCurrency());
  const [isLoadingDisplayCurrency, setIsLoadingDisplayCurrency] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [exchangeQuoteDirection, setExchangeQuoteDirection] = useState('unitsPerUsd');
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadPreference = async () => {
      const token = localStorage.getItem('token');
      if (!token || isSessionExpired) {
        if (!cancelled) {
          setDisplayCurrencyState(readStoredDisplayCurrency());
          setIsLoadingDisplayCurrency(false);
        }
        return;
      }

      try {
        const remote = await fetchDisplayCurrencyPreference(token);
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
  }, [isSessionExpired]);

  useEffect(() => {
    let cancelled = false;

    const loadExchangeRates = async () => {
      const token = localStorage.getItem('token');
      if (!token || isSessionExpired) {
        if (!cancelled) {
          setExchangeRates([]);
          setIsLoadingExchangeRates(false);
        }
        return;
      }

      try {
        const response = await fetch(getApiUrl('api/exchange/rates'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
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
  }, [isSessionExpired]);

  const setDisplayCurrency = useCallback(async (code) => {
    const normalized = normalizeDisplayCurrency(code);
    setDisplayCurrencyState(normalized);
    writeStoredDisplayCurrency(normalized);

    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) return;

    try {
      await patchDisplayCurrencyPreference(token, normalized);
    } catch (error) {
      console.warn('Failed to persist display currency preference:', error);
    }
  }, [isSessionExpired]);

  const formatFromUsd = useCallback(
    (usdAmount, options = {}) =>
      formatDisplayAmountFromUsd(usdAmount, displayCurrency, exchangeRates, {
        ...options,
        quoteDirection: options.quoteDirection ?? exchangeQuoteDirection,
      }),
    [displayCurrency, exchangeRates, exchangeQuoteDirection],
  );

  const value = {
    displayCurrency,
    setDisplayCurrency,
    isLoadingDisplayCurrency,
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
