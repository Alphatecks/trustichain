import { getApiUrl } from './config';

/** POST /api/payments/escrow/{escrowId}/payment-intent — charges escrow amount (+ fee). */
export async function createEscrowStripePaymentIntent(token, escrowId) {
  const id = String(escrowId || '').trim();
  if (!id) {
    throw new Error('Missing escrow ID');
  }

  const response = await fetch(
    getApiUrl(`api/payments/escrow/${encodeURIComponent(id)}/payment-intent`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || result?.error || 'Failed to create payment intent');
  }

  return result;
}

function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Stripe.js requires a browser environment'));
      return;
    }

    if (window.Stripe) {
      resolve(window.Stripe);
      return;
    }

    const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Stripe));
      existing.addEventListener('error', () => reject(new Error('Failed to load Stripe.js')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => resolve(window.Stripe);
    script.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(script);
  });
}

/** Confirm escrow PaymentIntent (Google Pay / Apple Pay / card via Stripe.js). */
export async function confirmEscrowStripePayment({ publishableKey, clientSecret, returnUrl }) {
  const key = String(publishableKey || '').trim();
  const secret = String(clientSecret || '').trim();
  if (!key) {
    throw new Error('Stripe publishable key is not configured');
  }
  if (!secret) {
    throw new Error('PaymentIntent client secret is missing');
  }

  const StripeFactory = await loadStripeJs();
  const stripe = StripeFactory(key);
  return stripe.confirmPayment({
    clientSecret: secret,
    confirmParams: {
      return_url: returnUrl,
    },
  });
}

export function resolveEscrowPaymentReturnUrl() {
  if (typeof window === 'undefined') return '/my-escrow';
  return `${window.location.origin}/my-escrow`;
}
