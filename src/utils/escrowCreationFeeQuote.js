import { getApiUrl } from './config';
import { convertUsdTotalToFiatDisplayAmount } from './displayCurrencyFormat';

/**
 * GET api/escrow/creation-fee/quote — fee for a specific escrow amount while creating.
 * @see amount vs totalAmount: use totalAmount for time-based / milestone escrows.
 */
export async function fetchEscrowCreationFeeQuote({
  amount,
  currency,
  transactionType,
  releaseType,
  suiteContext,
  signal,
}) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid escrow amount');
  }

  const params = new URLSearchParams();
  const useTotalAmount =
    releaseType === 'Time based' || releaseType === 'Milestones';
  if (useTotalAmount) {
    params.set('totalAmount', String(numericAmount));
  } else {
    params.set('amount', String(numericAmount));
  }
  params.set('currency', String(currency || 'USD').toUpperCase());
  params.set('transactionType', String(transactionType || 'custom'));

  if (suiteContext) {
    params.set('suiteContext', suiteContext);
  }

  const response = await fetch(
    `${getApiUrl('api/escrow/creation-fee/quote')}?${params.toString()}`,
    {
      method: 'GET',
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || 'Failed to load escrow fee quote');
  }

  return result.data || {};
}

/** Convert USD quote fields into the user's selected escrow currency for display. */
export function resolveEscrowCreationFeeDisplayAmounts(
  quote,
  currency,
  exchangeRates,
  quoteDirection,
) {
  if (!quote || typeof quote !== 'object') {
    return { fee: null, total: null, percentage: null };
  }

  const cur = String(currency || 'USD').toUpperCase();
  const toDisplay = (usdValue) => {
    const usd = Number(usdValue);
    if (!Number.isFinite(usd)) return null;
    if (cur === 'USD') return usd;

    const converted = convertUsdTotalToFiatDisplayAmount(
      cur,
      usd,
      exchangeRates,
      quoteDirection,
    );
    return converted != null && Number.isFinite(Number(converted)) ? Number(converted) : usd;
  };

  return {
    fee: toDisplay(quote.creationFeeUsd),
    total: toDisplay(quote.payableAmountUsd),
    percentage:
      quote.creationFeePercentage != null
        ? Number(quote.creationFeePercentage)
        : null,
  };
}
