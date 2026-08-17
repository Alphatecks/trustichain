import { loadStripe } from '@stripe/stripe-js';
import { getApiUrl } from './config';

export const STRIPE_PUBLISHABLE_KEY = String(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
).trim();

let stripePromise = null;

export function getStripePromise() {
  if (!STRIPE_PUBLISHABLE_KEY) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export function assertStripePublishableKey() {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error(
      'Stripe is not configured. Add REACT_APP_STRIPE_PUBLISHABLE_KEY to your .env file.',
    );
  }
}

/** personal | business — matches backend suiteContext */
export function resolveStripeSuiteContext(accountType) {
  return accountType === 'Business Suite' ? 'business' : 'personal';
}

export async function createStripeFundingIntent({
  token,
  amountUsd,
  asset = 'USDC',
  suiteContext = 'personal',
}) {
  const response = await fetch(getApiUrl('api/wallet/fund/stripe-intent'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amountUsd,
      suiteContext,
      asset,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.message || result?.error || 'Failed to create Stripe funding intent',
    );
  }
  const data = result?.data || result;
  if (!data?.clientSecret) {
    throw new Error('Stripe client secret missing from server response');
  }
  return data;
}

export async function fetchStripeFundingStatus({ token, fundingAttemptId, intentId }) {
  const params = new URLSearchParams();
  if (fundingAttemptId) params.set('fundingAttemptId', fundingAttemptId);
  else if (intentId) params.set('intentId', intentId);
  else throw new Error('Missing fundingAttemptId or intentId');

  const response = await fetch(
    getApiUrl(`api/wallet/fund/stripe/status?${params.toString()}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || result?.error || 'Failed to check funding status');
  }
  return result?.data || result;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll until Stripe payment succeeded and wallet credited (or timeout). */
export async function pollStripeFundingUntilCredited(
  { token, fundingAttemptId, intentId },
  { maxAttempts = 30, intervalMs = 2000 } = {},
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await fetchStripeFundingStatus({ token, fundingAttemptId, intentId });
    const paymentStatus = String(status?.status || '').toLowerCase();
    if (status?.credited === true || (paymentStatus === 'succeeded' && status?.credited !== false)) {
      return status;
    }
    if (paymentStatus === 'canceled' || paymentStatus === 'failed') {
      throw new Error(status?.message || 'Payment failed or was canceled');
    }
    await sleep(intervalMs);
  }
  throw new Error('Payment is still processing. Check your wallet balance in a moment.');
}
