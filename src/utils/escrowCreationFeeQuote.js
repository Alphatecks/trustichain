import { getApiUrl } from './config';
import { convertUsdTotalToFiatDisplayAmount } from './displayCurrencyFormat';

/**
 * GET api/escrow/creation-fee/quote — fee for a specific escrow amount while creating.
 * Always send `amount`. Time-based / milestone quotes also send `totalAmount` + `releaseType`.
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

  const baseParams = () => {
    const params = new URLSearchParams();
    params.set('amount', String(numericAmount));
    params.set('currency', String(currency || 'USD').toUpperCase());
    params.set('transactionType', String(transactionType || 'custom'));
    if (suiteContext) params.set('suiteContext', suiteContext);
    return params;
  };

  const isMilestoneOrTimeBased =
    releaseType === 'Time based' || releaseType === 'Milestones';

  const requestQuote = async (search) => {
    const response = await fetch(
      `${getApiUrl('api/escrow/creation-fee/quote')}?${search}`,
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
    return { response, result };
  };

  const attempts = [];
  if (isMilestoneOrTimeBased) {
    const withTotalAndType = baseParams();
    withTotalAndType.set('totalAmount', String(numericAmount));
    if (releaseType) withTotalAndType.set('releaseType', releaseType);
    attempts.push(withTotalAndType);

    const withTotal = baseParams();
    withTotal.set('totalAmount', String(numericAmount));
    attempts.push(withTotal);
  }

  const withReleaseType = baseParams();
  if (releaseType) withReleaseType.set('releaseType', releaseType);
  attempts.push(withReleaseType);
  attempts.push(baseParams());

  let response;
  let result = {};
  for (const params of attempts) {
    ({ response, result } = await requestQuote(params.toString()));
    if (response.ok && result?.success) break;
  }

  if (!response?.ok || !result?.success) {
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

  const pickNumeric = (...values) => {
    for (const value of values) {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
    return null;
  };

  const percentage = pickNumeric(
    quote.creationFeePercentage,
    quote.feePercentage,
    quote.percentage,
  );
  const feeUsd = pickNumeric(
    quote.creationFeeUsd,
    quote.creationFee,
    quote.feeUsd,
    quote.fee,
  );
  const totalUsd = pickNumeric(
    quote.payableAmountUsd,
    quote.payableAmount,
    quote.totalAmountUsd,
    quote.totalUsd,
    quote.totalEscrowedUsd,
  );

  return {
    fee: toDisplay(feeUsd),
    total: toDisplay(totalUsd),
    percentage,
  };
}
