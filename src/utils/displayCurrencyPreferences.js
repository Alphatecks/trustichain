import { getApiUrl } from './config';

export const DISPLAY_CURRENCY_STORAGE_KEY = 'trustichain_display_currency';

/** Values accepted by PATCH /api/dashboard/display-currency */
export const API_DISPLAY_CURRENCY_CODES = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'HKD',
  'SGD',
  'INR',
  'NGN',
  'ZAR',
  'BRL',
  'MXN',
  'AED',
  'SAR',
  'TRY',
  'KRW',
  'RLUSD',
]);

/** Fiat codes for escrow amount denomination (not crypto wallets/tokens). */
export const FIAT_CURRENCY_CODES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'HKD',
  'SGD',
  'INR',
  'NGN',
  'ZAR',
  'BRL',
  'MXN',
  'AED',
  'SAR',
  'TRY',
  'KRW',
];

export const FIAT_CURRENCY_FLAG_BY_CODE = {
  USD: 'us',
  EUR: 'eu',
  GBP: 'gb',
  JPY: 'jp',
  CAD: 'ca',
  AUD: 'au',
  CHF: 'ch',
  CNY: 'cn',
  HKD: 'hk',
  SGD: 'sg',
  INR: 'in',
  NGN: 'ng',
  ZAR: 'za',
  BRL: 'br',
  MXN: 'mx',
  AED: 'ae',
  SAR: 'sa',
  TRY: 'tr',
  KRW: 'kr',
};

export function normalizeEscrowAmountCurrency(code) {
  const c = String(code || 'USD').toUpperCase();
  if (FIAT_CURRENCY_CODES.includes(c)) return c;
  return 'USD';
}

export function readStoredDisplayCurrency() {
  try {
    const stored = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
    if (stored) return normalizeDisplayCurrency(stored);
  } catch (_) {
    /* ignore */
  }
  return 'USD';
}

export function writeStoredDisplayCurrency(code) {
  try {
    localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, normalizeDisplayCurrency(code));
  } catch (_) {
    /* ignore */
  }
}

/** Map API / stored codes to UI picker codes (RLUSD → USD; XRP stays XRP). */
export function normalizeDisplayCurrency(code) {
  const c = String(code || 'USD').toUpperCase();
  if (c === 'RLUSD') return 'USD';
  if (c === 'XRP') return 'XRP';
  if (API_DISPLAY_CURRENCY_CODES.has(c)) return c;
  return 'USD';
}

/** Returns API payload code, or null when preference cannot be persisted (e.g. XRP). */
export function toApiDisplayCurrency(code) {
  const c = String(code || 'USD').toUpperCase();
  if (c === 'XRP') return null;
  if (c === 'USD') return 'USD';
  if (API_DISPLAY_CURRENCY_CODES.has(c)) return c;
  return null;
}

function parseDisplayCurrencyFromApiPayload(json) {
  const data = json?.data;
  if (!data || typeof data !== 'object') return null;
  return data.displayCurrency ?? data.display_currency ?? null;
}

export async function fetchDisplayCurrencyPreference(token) {
  if (!token) return null;

  try {
    const res = await fetch(getApiUrl('api/dashboard/display-currency'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      const fromDashboard = parseDisplayCurrencyFromApiPayload(json);
      if (fromDashboard) return fromDashboard;
    }
  } catch (_) {
    /* ignore */
  }

  try {
    const res = await fetch(getApiUrl('api/user/preferences'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      const fromPrefs = json?.data?.displayCurrency ?? json?.data?.display_currency;
      if (fromPrefs) return fromPrefs;
    }
  } catch (_) {
    /* ignore */
  }

  try {
    const res = await fetch(getApiUrl('api/user/profile'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      const data = json?.data;
      return data?.displayCurrency ?? data?.display_currency ?? data?.preferences?.displayCurrency ?? null;
    }
  } catch (_) {
    /* ignore */
  }

  return null;
}

export async function patchDisplayCurrencyPreference(token, displayCurrency) {
  const apiCode = toApiDisplayCurrency(displayCurrency);
  if (!token || !apiCode) {
    return { success: true, skipped: true };
  }

  const response = await fetch(getApiUrl('api/dashboard/display-currency'), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ displayCurrency: apiCode, display_currency: apiCode }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || 'Failed to update display currency preference');
  }

  const saved =
    parseDisplayCurrencyFromApiPayload(result) ??
    result?.data?.displayCurrency ??
    result?.data?.display_currency ??
    apiCode;
  writeStoredDisplayCurrency(saved);
  return result;
}
