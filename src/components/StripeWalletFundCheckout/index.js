import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import {
  getStripePromise,
  pollStripeFundingUntilCredited,
} from '../../utils/stripeWalletFunding';
import './index.css';

function StripeFundPaymentForm({
  fundingAttemptId,
  intentId,
  methodLabel,
  onSuccess,
  onCancel,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    const token = localStorage.getItem('token');
    try {
      toast.loading(`Confirming ${methodLabel} payment…`, { id: 'stripe-fund' });
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });
      if (error) {
        throw new Error(error.message || 'Payment could not be completed');
      }

      toast.loading('Waiting for wallet credit…', { id: 'stripe-fund' });
      await pollStripeFundingUntilCredited({
        token,
        fundingAttemptId,
        intentId,
      });

      toast.success('Wallet funded successfully', { id: 'stripe-fund' });
      onSuccess?.();
    } catch (err) {
      console.error('Stripe wallet fund error:', err);
      toast.error(err?.message || 'Payment failed', { id: 'stripe-fund' });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <form className="stripe-wallet-fund-checkout" onSubmit={handlePay}>
      <PaymentElement
        options={{
          wallets: {
            applePay: 'auto',
            googlePay: 'auto',
          },
        }}
      />
      <div className="stripe-wallet-fund-actions">
        <button
          type="button"
          className="fund-wallet-btn cancel"
          onClick={onCancel}
          disabled={isPaying}
        >
          Cancel
        </button>
        <button type="submit" className="fund-wallet-btn primary fund-wallet-btn--stripe-pay" disabled={!stripe || isPaying}>
          {isPaying ? 'Processing…' : `Pay with ${methodLabel}`}
        </button>
      </div>
    </form>
  );
}

export default function StripeWalletFundCheckout({
  clientSecret,
  fundingAttemptId,
  intentId,
  methodLabel = 'Google Pay',
  onSuccess,
  onCancel,
}) {
  const stripePromise = getStripePromise();
  if (!stripePromise || !clientSecret) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <StripeFundPaymentForm
        fundingAttemptId={fundingAttemptId}
        intentId={intentId}
        methodLabel={methodLabel}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
