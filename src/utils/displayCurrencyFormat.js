/** TrustiChain API default: rate = target currency units per 1 USD/RLUSD. */
export const DEFAULT_EXCHANGE_QUOTE_DIRECTION = 'unitsPerUsd';

export function normalizeExchangeQuoteDirection(value) {
  const normalized = String(value || DEFAULT_EXCHANGE_QUOTE_DIRECTION).trim();
  if (/^usd\s*per\s*unit$/i.test(normalized) || normalized === 'usdPerUnit') {
    return 'usdPerUnit';
  }
  return DEFAULT_EXCHANGE_QUOTE_DIRECTION;
}

/** Convert a USD/RLUSD total into another fiat using api/exchange/rates rows. */
export function convertUsdTotalToFiatDisplayAmount(
  code,
  usdTotal,
  exchangeRates,
  quoteDirection = DEFAULT_EXCHANGE_QUOTE_DIRECTION,
) {
  if (!Array.isArray(exchangeRates)) return null;
  const row = exchangeRates.find((r) => (r.currency || r.code || '').toUpperCase() === code);
  const quote = Number(row?.rate ?? row?.value ?? 0);
  if (!Number.isFinite(quote) || quote <= 0) return null;

  const base = Number(usdTotal) || 0;
  if (normalizeExchangeQuoteDirection(quoteDirection) === 'usdPerUnit') {
    return base / quote;
  }
  // unitsPerUsd — e.g. GBP 0.739 means $1 = £0.739
  return base * quote;
}

/** Convert an amount entered in fiat into USD using api/exchange/rates rows. */
export function convertFiatAmountToUsd(
  code,
  fiatAmount,
  exchangeRates,
  quoteDirection = DEFAULT_EXCHANGE_QUOTE_DIRECTION,
) {
  const amount = Number(fiatAmount);
  if (!Number.isFinite(amount)) return null;
  if (code === 'USD') return amount;
  if (!Array.isArray(exchangeRates)) return null;

  const row = exchangeRates.find((r) => (r.currency || r.code || '').toUpperCase() === code);
  const quote = Number(row?.rate ?? row?.value ?? 0);
  if (!Number.isFinite(quote) || quote <= 0) return null;

  if (normalizeExchangeQuoteDirection(quoteDirection) === 'usdPerUnit') {
    return amount * quote;
  }
  return amount / quote;
}

/** RLUSD is pegged 1:1 to USD on TrustiChain. */
export function convertFiatAmountToRlusd(
  code,
  fiatAmount,
  exchangeRates,
  quoteDirection = DEFAULT_EXCHANGE_QUOTE_DIRECTION,
) {
  return convertFiatAmountToUsd(code, fiatAmount, exchangeRates, quoteDirection);
}

export function formatRlusdAmount(amount, options = {}) {
  const minDigits = options.minimumFractionDigits ?? 2;
  const maxDigits = options.maximumFractionDigits ?? 6;
  return `${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  })} RLUSD`;
}

export function formatConvertedFiatAmount(code, amount, fractionDigitsOverride) {
  const fractionDigits =
    fractionDigitsOverride ??
    (code === 'JPY' || code === 'KRW' ? 0 : 2);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch (_) {
    return `${code} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  }
}

export function formatUsdAmount(usdTotal) {
  return `$${Number(usdTotal || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function resolveSummaryXrpBalance(dashboardData, getBalanceValue) {
  if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null) {
    return Number(dashboardData.balance.xrp);
  }
  if (typeof getBalanceValue === 'function') {
    const v = getBalanceValue(dashboardData, 'xrp');
    if (v !== null && v !== undefined) return Number(v);
  }
  return 0;
}

export function resolveSummaryUsdBalance(dashboardData, getBalanceValue) {
  if (typeof getBalanceValue === 'function') {
    const v = getBalanceValue(dashboardData, 'usd');
    if (v !== null && v !== undefined) return Number(v);
  }
  if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
    return Number(dashboardData.balance.usd);
  }
  return 0;
}

export function computePortfolioUsdTotalFromSummary({
  dashboardData,
  exchangeRates,
  getExchangeRate,
  getBalanceValue,
}) {
  const xrpBalance = resolveSummaryXrpBalance(dashboardData, getBalanceValue);

  if (
    Number(xrpBalance) > 0 &&
    Array.isArray(exchangeRates) &&
    exchangeRates.length > 0 &&
    typeof getExchangeRate === 'function'
  ) {
    const xrpToUsdRate = getExchangeRate('XRP', 'USD');
    if (xrpToUsdRate) return Number(xrpBalance) * Number(xrpToUsdRate);

    const usdRate = exchangeRates.find(
      (r) =>
        (r.from === 'XRP' && r.to === 'USD') ||
        r.currency === 'USD' ||
        r.code === 'USD',
    );
    if (usdRate?.rate) return Number(xrpBalance) * Number(usdRate.rate);
  }

  return resolveSummaryUsdBalance(dashboardData, getBalanceValue);
}

export function formatPortfolioPrimaryDisplay(
  currency,
  usdTotal,
  xrpAmount,
  exchangeRates,
  quoteDirection = DEFAULT_EXCHANGE_QUOTE_DIRECTION,
) {
  const code = currency || 'USD';
  if (code === 'USD') return formatUsdAmount(usdTotal);
  if (code === 'XRP') {
    return `${Number(xrpAmount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })} XRP`;
  }
  const amt = convertUsdTotalToFiatDisplayAmount(
    code,
    usdTotal,
    exchangeRates,
    quoteDirection,
  );
  if (amt == null) return '—';
  return formatConvertedFiatAmount(code, amt);
}

/** Format a USD-denominated API amount in the user's display currency. */
export function formatDisplayAmountFromUsd(
  usdAmount,
  displayCurrency,
  exchangeRates,
  options = {},
) {
  const usdTotal = Number(usdAmount) || 0;
  const code = displayCurrency || 'USD';
  const minDigits = options.minimumFractionDigits;
  const maxDigits = options.maximumFractionDigits;

  if (code === 'USD') {
    return `$${usdTotal.toLocaleString('en-US', {
      minimumFractionDigits: minDigits ?? 2,
      maximumFractionDigits: maxDigits ?? 2,
    })}`;
  }

  if (code === 'XRP') {
    if (options.xrpAmount != null) {
      return `${Number(options.xrpAmount).toLocaleString('en-US', {
        minimumFractionDigits: minDigits ?? 2,
        maximumFractionDigits: maxDigits ?? 6,
      })} XRP`;
    }
    if (options.isLoadingRates) return '…';
    return formatUsdAmount(usdTotal);
  }

  if (options.isLoadingRates) return '…';

  const amt = convertUsdTotalToFiatDisplayAmount(
    code,
    usdTotal,
    exchangeRates,
    options.quoteDirection,
  );
  if (amt == null) return '—';

  const fractionDigits =
    maxDigits ?? (code === 'JPY' || code === 'KRW' ? 0 : 2);
  return formatConvertedFiatAmount(code, amt, fractionDigits);
}

export function formatPortfolioSecondaryDisplay(currency, usdTotal, xrpAmount) {
  const code = currency || 'USD';
  if (code === 'USD') {
    return `${Number(xrpAmount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })} XRP`;
  }
  return formatUsdAmount(usdTotal);
}
