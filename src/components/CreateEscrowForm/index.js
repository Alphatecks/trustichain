import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  FileText,
  CheckCircle,
  Plus,
  Download,
  Clock,
  Coins,
  Calendar,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  X,
  Trash2,
} from 'lucide-react';
import { getApiUrl } from '../../utils/config';
import { useWeb3 } from '../../context/Web3Context';
import { useDisplayCurrency } from '../../context/DisplayCurrencyContext';
import {
  convertFiatAmountToRlusd,
  convertFiatAmountToUsd,
  formatConvertedFiatAmount,
  formatRlusdAmount,
  formatUsdAmount,
} from '../../utils/displayCurrencyFormat';
import { normalizeEscrowAmountCurrency } from '../../utils/displayCurrencyPreferences';
import toast from 'react-hot-toast';
import googleLogo from '../../assets/images/icons/google-logo.svg';
import '../LoadingIndicator/index.css';
import '../../pages/dashboard/my-escrow/MyEscrow.css';
import './index.css';
import EscrowFundingCurrencyDropdown from './EscrowFundingCurrencyDropdown';
import EscrowDisputePeriodSelect from './EscrowDisputePeriodSelect';
import EscrowPayerWalletSelectModal from './EscrowPayerWalletSelectModal';
import {
  buildPayerWalletOptions,
  fetchCustodialWalletBalance,
  getPayerWalletIconUrl,
  maskWalletAddressShort,
  resolveDefaultPayerWalletAddress,
} from './escrowPayerWallets';
import { readStoredDashboardAccountType } from '../../utils/custodialWalletBalances';
import {
  fetchEscrowCreationFeeQuote,
  resolveEscrowCreationFeeDisplayAmounts,
} from '../../utils/escrowCreationFeeQuote';
import {
  confirmEscrowStripePayment,
  createEscrowStripePaymentIntent,
  resolveEscrowPaymentReturnUrl,
} from '../../utils/stripeEscrowPayment';
import LoadingIndicator from '../LoadingIndicator';

/** Matches MyEscrow.css desktop breakpoint (`min-width: 769px`). */
const CREATE_ESCROW_DESKTOP_MODAL_MQ = '(min-width: 769px)';

/** Normalize stored date strings for `<input type="date" />`. */
const toDateInputValue = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [day, month, year] = s.split('/');
    return `${year}-${month}-${day}`;
  }
  if (s.includes('T')) return s.slice(0, 10);
  return s;
};

/** Backend milestone create expects DD/MM/YYYY. */
const formatDateToDDMMYYYY = (raw) => {
  const iso = toDateInputValue(raw);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
};

const COUNTERPARTY_METHOD_META = {
  wallet: {
    tabLabel: 'Wallet Address',
    inputLabel: 'Counterparty XRP Wallet Address',
    placeholder: '••••••••••••••••',
  },
  trustitag: {
    tabLabel: 'Trustitag',
    inputLabel: 'Counterparty Trustitag',
    placeholder: 'Enter Trustitag',
  },
};

const GooglePayLogo = () => (
  <span className="create-escrow-step3-payment-mark create-escrow-step3-payment-mark--google" aria-hidden>
    <img src={googleLogo} alt="" className="create-escrow-step3-payment-logo" />
    <span className="create-escrow-step3-payment-logo-text create-escrow-step3-payment-logo-text--google">
      Pay
    </span>
  </span>
);

const ApplePayLogo = () => (
  <span className="create-escrow-step3-payment-mark create-escrow-step3-payment-mark--apple" aria-hidden>
    <svg className="create-escrow-step3-payment-logo" viewBox="0 0 24 24">
      <path
        d="M17.05 12.06c.01 2.56 2.24 3.41 2.26 3.42-.02.06-.36 1.23-1.19 2.43-.72 1.04-1.47 2.07-2.65 2.09-1.16.02-1.53-.69-2.86-.69-1.33 0-1.74.67-2.84.71-1.14.04-2.01-1.14-2.74-2.17-1.5-2.16-2.65-6.09-1.11-8.77.76-1.33 2.12-2.18 3.6-2.2 1.12-.02 2.18.75 2.86.75.68 0 1.95-.93 3.29-.79.56.02 2.14.23 3.16 1.72-.08.05-1.89 1.1-1.88 3.5zm-2.58-6.15c.6-.73 1.01-1.74.9-2.75-.86.03-1.91.57-2.53 1.3-.56.65-1.05 1.69-.92 2.68.96.08 1.95-.48 2.55-1.23z"
        fill="currentColor"
      />
    </svg>
    <span className="create-escrow-step3-payment-logo-text create-escrow-step3-payment-logo-text--apple">
      Pay
    </span>
  </span>
);

const TrustichainPayBadge = () => (
  <span className="create-escrow-step3-payment-mark create-escrow-step3-payment-mark--trustichain">
    Trustichain
  </span>
);

const STRIPE_METHODS = new Set(['googlepay', 'applepay']);

/** Map create-escrow API escrow object for success callbacks (fiat display + settlement). */
const normalizeCreatedEscrowFromApi = ({
  escrowSource,
  responseData,
  fallbackDisplayAmount,
  fallbackDisplayCurrency,
  fallbackAmountUsd,
}) => {
  const base = escrowSource || {};
  const amountNode = base.amount;
  const display =
    amountNode?.display ??
    (base.displayAmount != null
      ? {
          value: Number(base.displayAmount),
          currency: String(base.displayCurrency || fallbackDisplayCurrency || 'USD').toUpperCase(),
        }
      : null);

  const amountUsdRaw =
    amountNode?.usd ??
    base.amountUsd ??
    (fallbackAmountUsd != null && Number.isFinite(Number(fallbackAmountUsd))
      ? Number(fallbackAmountUsd)
      : null);

  const amount =
    amountNode && typeof amountNode === 'object'
      ? {
          ...amountNode,
          display:
            display ||
            (fallbackDisplayAmount != null
              ? {
                  value: Number(fallbackDisplayAmount),
                  currency: fallbackDisplayCurrency,
                }
              : amountNode.display),
          usd: amountUsdRaw ?? amountNode.usd,
        }
      : {
          xrp: base.settlementAmount ?? base.amountXrp,
          usd: amountUsdRaw,
          display:
            display ||
            (fallbackDisplayAmount != null
              ? {
                  value: Number(fallbackDisplayAmount),
                  currency: fallbackDisplayCurrency,
                }
              : undefined),
        };

  return {
    ...base,
    // Top-level creation currency only — never amount.currency (always RLUSD settlement).
    currency: base.currency || fallbackDisplayCurrency,
    denominationAmount:
      base.denominationAmount != null && Number.isFinite(Number(base.denominationAmount))
        ? Number(base.denominationAmount)
        : fallbackDisplayAmount,
    id: base.id || base.escrowId || responseData?.escrowId,
    escrowId: base.escrowId || base.id || responseData?.escrowId,
    xrplEscrowId:
      base.xrplEscrowId ||
      base.xrpl_escrow_id ||
      responseData?.xrplEscrowId ||
      responseData?.xrpl_escrow_id,
    xrpHash:
      base.xrpHash ||
      base.xrplTxHash ||
      base.txHash ||
      responseData?.xrpHash ||
      responseData?.xrplTxHash,
    status: base.status || responseData?.status,
    amount,
    ...(amountUsdRaw != null
      ? { amountUsd: Number(amountUsdRaw).toFixed(2) }
      : {}),
  };
};

const resolveEscrowCreateStatus = (data) =>
  String(data?.status ?? data?.escrow?.status ?? '').toLowerCase();

const resolveEscrowLedgerTxHash = (data) =>
  data?.xrplTxHash ||
  data?.xrpHash ||
  data?.xrp_hash ||
  data?.txHash ||
  data?.transactionHash ||
  null;

/** XRPL escrow already created — no XUMM / Stripe follow-up required. */
const isImmediateLedgerEscrowSuccess = (data) => {
  if (!data || typeof data !== 'object') return false;
  const status = resolveEscrowCreateStatus(data);
  const txHash = resolveEscrowLedgerTxHash(data);
  const ledgerId = data.xrplEscrowId || data.xrpl_escrow_id;
  if (!txHash && !ledgerId) return false;
  if (status === 'active' || status === 'completed' || status === 'funded') return true;
  return !!(data.escrowId && (txHash || ledgerId));
};

/** Connected/saved wallet used as payer when the Step 1 field is empty. */
const resolvePayerWalletFromContext = (account) => {
  if (typeof account === 'string' && account.trim()) return account.trim();
  try {
    const x = localStorage.getItem('xamanWalletAddress');
    const m = localStorage.getItem('metamaskWalletAddress');
    return (x && x.trim()) || (m && m.trim()) || '';
  } catch (_) {
    return '';
  }
};

/** Step 3 confirmation — DD-MM-YYYY like desktop reference. */
const formatConfirmationDisplayDate = (raw) => {
  const v = toDateInputValue(raw);
  if (!v) return '—';
  const [y, m, d] = v.split('-');
  if (!y || !m || !d) return '—';
  return `${d}-${m}-${y}`;
};

const maskCounterpartyWalletForConfirmation = (addr) => {
  const s = String(addr || '').trim();
  if (!s) return '—';
  return '*'.repeat(15);
};

const estimateUsdForConfirmationAmount = (
  amountNum,
  currency,
  exchangeRates,
  quoteDirection,
) =>
  convertFiatAmountToUsd(
    normalizeEscrowAmountCurrency(currency),
    amountNum,
    exchangeRates,
    quoteDirection,
  );

const parsePositiveAmount = (raw) => {
  const amount = parseFloat(String(raw || '').trim().replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const commitDraftMilestone = (data) => {
  const details = String(data?.milestoneDetails || '').trim();
  const amountRaw = String(data?.milestoneAmount || '').trim();
  if (!details && !amountRaw) {
    return { next: data, added: false, error: null };
  }
  if (!details || !amountRaw) {
    return {
      next: data,
      added: false,
      error: 'Enter both milestone details and amount',
    };
  }
  const amount = parsePositiveAmount(amountRaw);
  if (amount == null) {
    return { next: data, added: false, error: 'Enter a valid milestone amount' };
  }
  return {
    next: {
      ...data,
      milestones: [
        ...(Array.isArray(data.milestones) ? data.milestones : []),
        { details, amount: String(amount) },
      ],
      milestoneDetails: '',
      milestoneAmount: '',
    },
    added: true,
    error: null,
  };
};

const sumMilestoneAmounts = (milestones) =>
  (Array.isArray(milestones) ? milestones : []).reduce((sum, milestone) => {
    const amount = parsePositiveAmount(milestone?.amount);
    return sum + (amount || 0);
  }, 0);

/** Short hint under amount inputs — selected fiat converted to RLUSD. */
const formatAmountExchangeHint = (amountStr, currency, exchangeRates, quoteDirection) => {
  const raw = String(amountStr || '').trim().replace(/,/g, '');
  if (!raw) return null;
  const amountNum = parseFloat(raw);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;

  const cur = normalizeEscrowAmountCurrency(currency);
  const rlusdAmount = convertFiatAmountToRlusd(
    cur,
    amountNum,
    exchangeRates,
    quoteDirection,
  );
  if (rlusdAmount == null || !Number.isFinite(rlusdAmount)) return null;

  const rlusdLabel = formatRlusdAmount(rlusdAmount);
  if (cur === 'USD') {
    return `≈ ${rlusdLabel}`;
  }

  return `${formatConvertedFiatAmount(cur, amountNum)} ≈ ${rlusdLabel}`;
};

/** e.g. `₦500,000.00 ( $325.50 USD )` */
const formatConfirmationMoneyLine = (
  amountNum,
  currency,
  exchangeRates,
  quoteDirection,
) => {
  const cur = normalizeEscrowAmountCurrency(currency);
  if (!Number.isFinite(amountNum)) return '—';
  const main = formatConvertedFiatAmount(cur, amountNum);
  if (cur === 'USD') return main;
  const usd = estimateUsdForConfirmationAmount(
    amountNum,
    cur,
    exchangeRates,
    quoteDirection,
  );
  if (usd == null || !Number.isFinite(usd)) return main;
  return `${main} (${formatUsdAmount(usd)} USD)`;
};

/**
 * Reusable Create Escrow multi-step flow: full-screen on mobile, centered modal on desktop (Dashboard + My Escrow).
 *
 * Props:
 * - isOpen: boolean – controls visibility
 * - onCancel: () => void – called when user closes the modal
 * - onSuccess: (data) => void – called after successful escrow creation
 */
const CreateEscrowForm = ({ isOpen, onCancel, onSuccess }) => {
  const { account, isConnected } = useWeb3();
  const { exchangeRates, exchangeQuoteDirection } = useDisplayCurrency();
  const [desktopModalLayout, setDesktopModalLayout] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(CREATE_ESCROW_DESKTOP_MODAL_MQ).matches,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEscrowType, setSelectedEscrowType] = useState('Freelancing');
  const [selectedConfirmationPaymentMethod, setSelectedConfirmationPaymentMethod] =
    useState('');
  const [custodialWalletBalanceRaw, setCustodialWalletBalanceRaw] = useState(null);
  const [selectedPayerWalletId, setSelectedPayerWalletId] = useState('');
  const [showPayerWalletModal, setShowPayerWalletModal] = useState(false);
  /** Step 1: identify counterparty by wallet vs Trustitag. */
  const [counterpartyMethod, setCounterpartyMethod] = useState('wallet');
  const selectedCounterpartyMethodMeta =
    COUNTERPARTY_METHOD_META[counterpartyMethod] || COUNTERPARTY_METHOD_META.trustitag;

  const [formData, setFormData] = useState({
    payerWallet: '',
    payerEmail: '',
    payerName: '',
    payerPhone: '',
    counterpartyWallet: '',
    counterpartyTrustitag: '',
    counterpartyEmail: '',
    counterpartyName: '',
    counterpartyPhone: '',
  });

  const [termsData, setTermsData] = useState({
    releaseType: 'Manual Release',
    expectedCompletionDate: '',
    expectedReleaseDate: '',
    disputeResolutionPeriod: '',
    totalAmount: '',
    escrowFee: '',
    releaseConditions: '',
    milestoneDetails: '',
    milestoneAmount: '',
    milestones: [],
    timeBasedAutoReleaseAck: false,
    escrowCurrency: 'USD',
  });

  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [escrowCreationStep, setEscrowCreationStep] = useState('idle'); // 'idle' | 'creating'
  const [stripePaymentStatus, setStripePaymentStatus] = useState(null);
  const [creationFeeQuote, setCreationFeeQuote] = useState(null);
  const [isLoadingCreationFeeQuote, setIsLoadingCreationFeeQuote] = useState(false);

  const parsedEscrowAmount = useMemo(() => {
    const fromTotal = parseFloat(String(termsData.totalAmount || '').trim().replace(/,/g, ''));
    if (Number.isFinite(fromTotal) && fromTotal > 0) return fromTotal;
    if (termsData.releaseType === 'Milestones') {
      const milestoneTotal = sumMilestoneAmounts(termsData.milestones);
      return milestoneTotal > 0 ? milestoneTotal : null;
    }
    return null;
  }, [termsData.totalAmount, termsData.releaseType, termsData.milestones]);

  const escrowCreationFeeDisplay = useMemo(() => {
    const fromQuote = resolveEscrowCreationFeeDisplayAmounts(
      creationFeeQuote,
      termsData.escrowCurrency,
      exchangeRates,
      exchangeQuoteDirection,
    );
    const fee =
      fromQuote.fee != null
        ? fromQuote.fee
        : fromQuote.percentage != null && parsedEscrowAmount != null
          ? parsedEscrowAmount * (fromQuote.percentage / 100)
          : null;
    const total =
      fromQuote.total != null
        ? fromQuote.total
        : parsedEscrowAmount != null && fee != null
          ? parsedEscrowAmount + fee
          : parsedEscrowAmount;
    return {
      fee,
      total,
      percentage: fromQuote.percentage,
    };
  }, [
    creationFeeQuote,
    termsData.escrowCurrency,
    exchangeRates,
    exchangeQuoteDirection,
    parsedEscrowAmount,
  ]);

  const amountExchangeHint = formatAmountExchangeHint(
    termsData.totalAmount,
    termsData.escrowCurrency,
    exchangeRates,
    exchangeQuoteDirection,
  );

  const milestoneAmountExchangeHint = formatAmountExchangeHint(
    termsData.milestoneAmount,
    termsData.escrowCurrency,
    exchangeRates,
    exchangeQuoteDirection,
  );

  // Map escrow type to industry for API
  const getEscrowTypeMapping = (escrowType) => {
    const mapping = {
      Freelancing: 'Technology',
      'Real Estate': 'Real Estate',
      'Real estate': 'Real Estate',
      'Product purchase': 'Retail',
      Custom: 'Other',
    };
    return mapping[escrowType] || 'Other';
  };

  // Helper function to format date to ISO format
  const formatDateToYYYYMMDD = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;

    try {
      // If it's already in YYYY-MM-DD format, return it
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // If it's an ISO string, extract YYYY-MM-DD
      if (typeof dateString === 'string' && dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      
      // Otherwise, try to parse and format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Format as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  // Helper function to format dispute resolution period
  const formatDisputePeriod = (value) => {
    if (!value || value.trim() === '') return null;
    return `${value} days`;
  };

  // Map escrow type to transaction type for API
  const mapEscrowTypeToTransactionType = (escrowType) => {
    const mapping = {
      Freelancing: 'freelance',
      'Real Estate': 'real_estate',
      'Real estate': 'real_estate',
      'Product purchase': 'product_purchase',
      Custom: 'custom',
    };
    return mapping[escrowType] || 'custom';
  };

  const payerWalletOptions = useMemo(
    () =>
      buildPayerWalletOptions({
        custodialBalanceRaw: custodialWalletBalanceRaw,
        account,
        isConnected,
      }),
    [custodialWalletBalanceRaw, account, isConnected],
  );

  const selectedPayerWallet = payerWalletOptions.find((w) => w.id === selectedPayerWalletId);

  const resetFormState = () => {
    setEscrowCreationStep('idle');
    setIsCreatingEscrow(false);
    setCurrentStep(1);
    setSelectedEscrowType('Freelancing');
    setSelectedConfirmationPaymentMethod('');
    setCustodialWalletBalanceRaw(null);
    setSelectedPayerWalletId('');
    setShowPayerWalletModal(false);
    setStripePaymentStatus(null);
    setCreationFeeQuote(null);
    setIsLoadingCreationFeeQuote(false);
    setCounterpartyMethod('wallet');
    setFormData({
      payerWallet: '',
      payerEmail: '',
      payerName: '',
      payerPhone: '',
      counterpartyWallet: '',
      counterpartyTrustitag: '',
      counterpartyEmail: '',
      counterpartyName: '',
      counterpartyPhone: '',
    });
    setTermsData({
      releaseType: 'Manual Release',
      expectedCompletionDate: '',
      expectedReleaseDate: '',
      disputeResolutionPeriod: '',
      totalAmount: '',
      escrowFee: '',
      releaseConditions: '',
      milestoneDetails: '',
      milestoneAmount: '',
      milestones: [],
      timeBasedAutoReleaseAck: false,
      escrowCurrency: 'USD',
    });
  };

  // Cleanup when modal closes or component unmounts
  useEffect(() => {
    if (!isOpen) {
      setEscrowCreationStep('idle');
      setIsCreatingEscrow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(CREATE_ESCROW_DESKTOP_MODAL_MQ);
    const sync = () => setDesktopModalLayout(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Prefer connected / saved wallet as payer so Wallet Address mode matches minimal Step 1 UI.
  useEffect(() => {
    if (!isOpen) return;
    const resolved = resolvePayerWalletFromContext(account);
    if (!resolved) return;
    setFormData((prev) =>
      prev.payerWallet.trim() ? prev : { ...prev, payerWallet: resolved },
    );
  }, [isOpen, account]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const ac = new AbortController();
    (async () => {
      try {
        const balanceRaw = await fetchCustodialWalletBalance(ac.signal);
        if (ac.signal.aborted) return;
        setCustodialWalletBalanceRaw(balanceRaw);
      } catch (_) {
        /* ignore */
      }
    })();
    return () => ac.abort();
  }, [isOpen]);

  useEffect(() => {
    if (!showPayerWalletModal) return undefined;
    const ac = new AbortController();
    (async () => {
      try {
        const balanceRaw = await fetchCustodialWalletBalance(ac.signal);
        if (ac.signal.aborted) return;
        setCustodialWalletBalanceRaw(balanceRaw);
      } catch (_) {
        /* ignore */
      }
    })();
    return () => ac.abort();
  }, [showPayerWalletModal]);

  useEffect(() => {
    if (!isOpen || currentStep !== 3 || parsedEscrowAmount == null) {
      if (!isOpen || currentStep !== 3) {
        setCreationFeeQuote(null);
        setIsLoadingCreationFeeQuote(false);
      }
      return undefined;
    }

    const ac = new AbortController();
    setIsLoadingCreationFeeQuote(true);

    (async () => {
      try {
        const quote = await fetchEscrowCreationFeeQuote({
          amount: parsedEscrowAmount,
          currency: normalizeEscrowAmountCurrency(termsData.escrowCurrency),
          transactionType: mapEscrowTypeToTransactionType(selectedEscrowType),
          releaseType: termsData.releaseType,
          suiteContext:
            readStoredDashboardAccountType() === 'Business Suite' ? 'business' : undefined,
          signal: ac.signal,
        });
        if (!ac.signal.aborted) {
          setCreationFeeQuote(quote);
        }
      } catch (error) {
        if (!ac.signal.aborted) {
          setCreationFeeQuote(null);
          console.warn('Escrow creation fee quote failed:', error);
        }
      } finally {
        if (!ac.signal.aborted) {
          setIsLoadingCreationFeeQuote(false);
        }
      }
    })();

    return () => ac.abort();
  }, [
    isOpen,
    currentStep,
    parsedEscrowAmount,
    termsData.escrowCurrency,
    termsData.releaseType,
    selectedEscrowType,
  ]);

  useEffect(() => {
    if (selectedConfirmationPaymentMethod !== 'trustichain') return;
    if (!selectedPayerWalletId) return;
    if (!payerWalletOptions.some((w) => w.id === selectedPayerWalletId)) {
      setSelectedPayerWalletId('');
      setFormData((prev) => ({ ...prev, payerWallet: '' }));
    }
  }, [selectedConfirmationPaymentMethod, selectedPayerWalletId, payerWalletOptions]);

  const handleSelectTrustichainPayment = () => {
    setSelectedConfirmationPaymentMethod('trustichain');
    setShowPayerWalletModal(true);
  };

  const handlePayerWalletConfirm = (walletId) => {
    setSelectedPayerWalletId(walletId);
    const wallet = payerWalletOptions.find((w) => w.id === walletId);
    if (wallet) {
      setFormData((prev) => ({ ...prev, payerWallet: wallet.address }));
    }
    setShowPayerWalletModal(false);
  };

  // Handle create escrow (adapted from MyEscrow, extended with XUMM/Xaman flow)
  const handleCreateEscrow = async () => {
    try {
      setIsCreatingEscrow(true);
      setEscrowCreationStep('creating');
      setStripePaymentStatus(null);

      let payerWalletResolved =
        formData.payerWallet?.trim() || resolvePayerWalletFromContext(account) || '';

      const escrowCurrencyResolved = normalizeEscrowAmountCurrency(termsData.escrowCurrency);

      const counterpartyWalletTrimmed = formData.counterpartyWallet?.trim() || '';
      const counterpartyTrustitagTrimmed = formData.counterpartyTrustitag?.trim() || '';

      if (selectedConfirmationPaymentMethod === 'trustichain') {
        if (!selectedPayerWalletId) {
          toast.error('Please select a wallet to pay from');
          setIsCreatingEscrow(false);
          setEscrowCreationStep('idle');
          return;
        }
        const selectedWallet = payerWalletOptions.find((w) => w.id === selectedPayerWalletId);
        if (!selectedWallet?.address) {
          toast.error('Please select a wallet to pay from');
          setIsCreatingEscrow(false);
          setEscrowCreationStep('idle');
          return;
        }
        payerWalletResolved = selectedWallet.address;
      } else if (!payerWalletResolved) {
        try {
          const balanceRaw = custodialWalletBalanceRaw || (await fetchCustodialWalletBalance());
          payerWalletResolved = resolveDefaultPayerWalletAddress(balanceRaw);
          if (payerWalletResolved) {
            setFormData((prev) => ({ ...prev, payerWallet: payerWalletResolved }));
          }
        } catch (_) {
          /* ignore */
        }
      }

      if (!payerWalletResolved) {
        toast.error('Please fill in all required fields');
        setIsCreatingEscrow(false);
        setEscrowCreationStep('idle');
        return;
      }

      if (counterpartyMethod === 'wallet' && !counterpartyWalletTrimmed) {
        toast.error('Please fill in all required fields');
        setIsCreatingEscrow(false);
        return;
      }

      if (counterpartyMethod === 'trustitag' && !counterpartyTrustitagTrimmed) {
        toast.error('Please fill in all required fields');
        setIsCreatingEscrow(false);
        return;
      }

      if (!termsData.totalAmount) {
        toast.error('Please enter the total amount');
        setIsCreatingEscrow(false);
        return;
      }

      if (!selectedConfirmationPaymentMethod) {
        toast.error('Please select a payment method');
        setIsCreatingEscrow(false);
        return;
      }

      // Validate milestones if release type is Milestones
      if (termsData.releaseType === 'Milestones') {
        if (!termsData.milestones || termsData.milestones.length === 0) {
          toast.error('Please add at least one milestone');
          setIsCreatingEscrow(false);
          return;
        }
        if (!toDateInputValue(termsData.expectedCompletionDate)) {
          toast.error('Please select an expected completion date');
          setIsCreatingEscrow(false);
          return;
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        setIsCreatingEscrow(false);
        setEscrowCreationStep('idle');
        return;
      }

      // Map escrow type to transaction type and industry
      const transactionType = mapEscrowTypeToTransactionType(selectedEscrowType);
      const industry = getEscrowTypeMapping(selectedEscrowType);

      // Format dates to YYYY-MM-DD format (milestone create uses DD/MM/YYYY)
      const expectedCompletionDateISO = formatDateToYYYYMMDD(termsData.expectedCompletionDate);
      const expectedReleaseDateISO = formatDateToYYYYMMDD(termsData.expectedReleaseDate);
      const expectedCompletionDateMilestone = formatDateToDDMMYYYY(
        termsData.expectedCompletionDate,
      );

      // Format dispute resolution period
      const disputeResolutionPeriodFormatted = formatDisputePeriod(
        termsData.disputeResolutionPeriod,
      );

      // Determine description - use first milestone, releaseConditions, or fallback
      const description =
        (Array.isArray(termsData.milestones) && termsData.milestones[0]?.details) ||
        termsData.milestoneDetails ||
        termsData.releaseConditions ||
        `Escrow for ${selectedEscrowType}`;

      const totalAmountNumber = parseFloat(termsData.totalAmount);
      const amountUsdEstimate = estimateUsdForConfirmationAmount(
        totalAmountNumber,
        termsData.escrowCurrency,
        exchangeRates,
        exchangeQuoteDirection,
      );
      const amountUsdForPayload =
        amountUsdEstimate != null && Number.isFinite(amountUsdEstimate)
          ? Number(amountUsdEstimate.toFixed(2))
          : undefined;

      // Build base payload with common fields
      const payload = {
        payerXrpWalletAddress: payerWalletResolved,
        ...(counterpartyMethod === 'trustitag'
          ? { counterpartyTrustitag: counterpartyTrustitagTrimmed }
          : { counterpartyXrpWalletAddress: counterpartyWalletTrimmed }),
        amount: totalAmountNumber,
        currency: escrowCurrencyResolved,
        displayAmount: totalAmountNumber,
        displayCurrency: escrowCurrencyResolved,
        ...(amountUsdForPayload != null ? { amountUsd: amountUsdForPayload } : {}),
        transactionType: transactionType,
        industry: industry,
        description: description,
        payerEmail: formData.payerEmail || '',
        payerName: formData.payerName || '',
        counterpartyEmail: formData.counterpartyEmail || '',
        counterpartyName: formData.counterpartyName || '',
        releaseType: termsData.releaseType,
        totalAmount: totalAmountNumber,
        paymentMethod: selectedConfirmationPaymentMethod,
      };

      if (
        selectedConfirmationPaymentMethod === 'trustichain' &&
        selectedPayerWallet?.currency
      ) {
        payload.payerWalletCurrency = selectedPayerWallet.currency;
      }

      // Add date fields if provided
      if (termsData.releaseType === 'Milestones') {
        if (expectedCompletionDateMilestone) {
          payload.expectedCompletionDate = expectedCompletionDateMilestone;
        }
      } else if (expectedCompletionDateISO) {
        payload.expectedCompletionDate = expectedCompletionDateISO;
      }

      if (disputeResolutionPeriodFormatted) {
        payload.disputeResolutionPeriod = disputeResolutionPeriodFormatted;
      }

      // Add release type specific fields
      if (termsData.releaseType === 'Time based') {
        if (expectedReleaseDateISO) {
          payload.expectedReleaseDate = expectedReleaseDateISO;
        }
        if (termsData.releaseConditions) {
          payload.releaseConditions = termsData.releaseConditions;
        }
      } else if (termsData.releaseType === 'Manual Release') {
        if (termsData.releaseConditions) {
          payload.releaseConditions = termsData.releaseConditions;
        }
      } else if (termsData.releaseType === 'Milestones') {
        const milestones = Array.isArray(termsData.milestones) ? termsData.milestones : [];
        payload.milestones = milestones
          .map((milestone) => {
            const milestoneAmount = parsePositiveAmount(milestone?.amount);
            const milestoneDetails = String(milestone?.details || '').trim();
            if (milestoneAmount == null || !milestoneDetails) return null;
            return { milestoneAmount, milestoneDetails };
          })
          .filter(Boolean);
        if (payload.milestones.length === 0) {
          toast.error('Please add at least one milestone');
          setIsCreatingEscrow(false);
          return;
        }
      }

      // Make API call
      const apiUrl = getApiUrl('api/escrow/create');
      console.log('Creating escrow:', apiUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('API Response data:', result);

        if (result?.success) {
          const responseData = result.data || {};
          const {
            xummUrl,
            xummUuid,
            escrowId,
            xrplTxHash,
            escrow,
            xrplEscrowId,
            cancelled,
            expired,
          } = responseData;

          // Snapshot amount & rate at creation time so UI doesn't drift during polling
          const effectiveRate =
            totalAmountNumber > 0 &&
            amountUsdEstimate != null &&
            Number.isFinite(amountUsdEstimate)
              ? amountUsdEstimate / totalAmountNumber
              : 1;

          const buildCreatedEscrow = (escrowSource) =>
            normalizeCreatedEscrowFromApi({
              escrowSource,
              responseData,
              fallbackDisplayAmount: totalAmountNumber,
              fallbackDisplayCurrency: escrowCurrencyResolved,
              fallbackAmountUsd:
                amountUsdEstimate != null && Number.isFinite(amountUsdEstimate)
                  ? Number(amountUsdEstimate.toFixed(2))
                  : totalAmountNumber * effectiveRate,
            });

          // Case 1: Backend already created and activated XRPL escrow (no XUMM needed)
          if (isImmediateLedgerEscrowSuccess(responseData)) {
            const createdEscrow = buildCreatedEscrow({
              ...responseData,
              id: responseData.escrowId || responseData.id,
              xrplTxHash: resolveEscrowLedgerTxHash(responseData),
            });

            toast.success(result?.message || 'Escrow created successfully!');

            try {
              if (onSuccess) {
                onSuccess(createdEscrow);
              }
            } catch (callbackError) {
              console.error('CreateEscrowForm onSuccess callback failed:', callbackError);
            }

            // Reset form and close
            resetFormState();
            if (onCancel) {
              onCancel();
            }
            return;
          }

          // Case 2: XUMM/Xaman signing flow - open URL if provided (backend handles the rest)
          if (STRIPE_METHODS.has(selectedConfirmationPaymentMethod)) {
            const resolvedEscrowId = escrowId || escrow?.id || responseData?.id;
            if (!resolvedEscrowId) {
              toast.error('Escrow created but missing escrow ID for payment initialization.');
              setEscrowCreationStep('idle');
              setIsCreatingEscrow(false);
              return;
            }

            const methodLabel =
              selectedConfirmationPaymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay';

            toast.loading(`Preparing ${methodLabel} payment…`, { id: 'escrow-stripe-pay' });

            const paymentIntentResult = await createEscrowStripePaymentIntent(
              token,
              resolvedEscrowId,
            );
            const paymentData = paymentIntentResult?.data || {};
            setStripePaymentStatus(paymentData);

            const clientSecret = paymentData.clientSecret;
            const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.trim();

            if (clientSecret && publishableKey) {
              const confirmResult = await confirmEscrowStripePayment({
                publishableKey,
                clientSecret,
                returnUrl: resolveEscrowPaymentReturnUrl(),
              });

              if (confirmResult?.error) {
                throw new Error(
                  confirmResult.error.message || `${methodLabel} payment could not be completed`,
                );
              }

              toast.success(
                paymentIntentResult?.message ||
                  `${methodLabel} payment submitted. Your escrow will finalize once payment succeeds.`,
                { id: 'escrow-stripe-pay' },
              );
            } else if (!clientSecret) {
              throw new Error('PaymentIntent response is missing clientSecret');
            } else {
              toast.success(
                `PaymentIntent created ($${Number(paymentData.payableAmountUsd ?? paymentData.amountUsd ?? 0).toFixed(2)} payable). Set REACT_APP_STRIPE_PUBLISHABLE_KEY to complete ${methodLabel} in-app.`,
                { id: 'escrow-stripe-pay' },
              );
            }

            const createdEscrow = buildCreatedEscrow({
              ...responseData,
              id: resolvedEscrowId,
              escrowId: resolvedEscrowId,
              paymentIntent: paymentData,
            });

            try {
              if (onSuccess) {
                onSuccess(createdEscrow);
              }
            } catch (callbackError) {
              console.error('CreateEscrowForm onSuccess callback failed:', callbackError);
            }

            resetFormState();
            if (onCancel) {
              onCancel();
            }
            setEscrowCreationStep('idle');
            setIsCreatingEscrow(false);
            return;
          }

          // Case 2: XUMM/Xaman signing flow - open URL if provided (backend handles the rest)
          if (xummUrl && escrowId) {
            console.log('Xaman signing URL provided. Escrow ID:', escrowId);

            // Open XUMM/Xaman signing URL
            window.open(xummUrl, '_blank');

            // Backend handles the rest, so we can treat this as success
            // The escrow will be created once signed in Xaman
            toast.success('Escrow creation initiated. Please sign in your Xaman wallet.', {
              id: 'create-escrow',
            });

            // If escrow data is already available, use it
            if (escrow) {
              const createdEscrow = buildCreatedEscrow(escrow);
              try {
                if (onSuccess) {
                  onSuccess(createdEscrow);
                }
              } catch (callbackError) {
                console.error('CreateEscrowForm onSuccess callback failed:', callbackError);
              }
            }

            resetFormState();
            if (onCancel) {
              onCancel();
            }
            return;
          }

          // Case 3: Unexpected response shape
          console.error(
            'Unexpected escrow create response. Missing ledger hash / active status, xummUrl, or Stripe escrowId.',
            responseData,
          );
          toast.error(
            'Failed to start escrow creation signing flow. Please try again.',
          );
        } else {
          toast.error(result?.message || 'Failed to create escrow');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error response:', errorData);
        console.error('Response status:', response.status);
        toast.error(errorData?.message || errorData?.error || 'Failed to create escrow');
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error(error?.message || 'An error occurred while creating escrow', {
        id: 'escrow-stripe-pay',
      });
    } finally {
      setIsCreatingEscrow(false);
      setEscrowCreationStep('idle');
    }
  };

  const handleCloseModal = () => {
    resetFormState();
    if (onCancel) {
      onCancel();
    }
  };

  const handleContinueFromStep1 = () => {
    if (counterpartyMethod === 'wallet') {
      if (!formData.counterpartyWallet?.trim()) {
        toast.error('Please enter the counterparty XRP wallet address');
        return;
      }
    } else if (!formData.counterpartyTrustitag?.trim()) {
      toast.error("Please enter the counterparty's Trustitag");
      return;
    }
    setCurrentStep(2);
  };

  const handleAddMilestone = () => {
    const { next, added, error } = commitDraftMilestone(termsData);
    if (error) {
      toast.error(error);
      return;
    }
    if (!added) {
      toast.error('Enter milestone details and amount');
      return;
    }
    setTermsData(next);
  };

  const handleRemoveMilestone = (index) => {
    setTermsData((prev) => ({
      ...prev,
      milestones: (prev.milestones || []).filter((_, i) => i !== index),
    }));
  };

  const handleContinueFromStep2 = () => {
    if (termsData.releaseType === 'Time based' && !termsData.timeBasedAutoReleaseAck) {
      toast.error(
        'Please confirm that you understand automatic escrow completion on the set date.',
      );
      return;
    }

    if (termsData.releaseType === 'Milestones') {
      const { next, error } = commitDraftMilestone(termsData);
      if (error) {
        toast.error(error);
        return;
      }
      if (!next.milestones || next.milestones.length === 0) {
        toast.error('Please add at least one milestone');
        return;
      }
      if (!toDateInputValue(next.expectedCompletionDate)) {
        toast.error('Please select an expected completion date');
        return;
      }
      const milestoneTotal = sumMilestoneAmounts(next.milestones);
      const resolvedTotal = next.totalAmount?.trim()
        ? next
        : { ...next, totalAmount: String(milestoneTotal) };
      if (!resolvedTotal.totalAmount?.trim()) {
        toast.error('Please enter the total amount');
        return;
      }
      setTermsData(resolvedTotal);
      setCurrentStep(3);
      return;
    }

    if (!termsData.totalAmount?.trim()) {
      toast.error('Please enter the total amount');
      return;
    }
    setCurrentStep(3);
  };

  const renderDisputePeriodField = (formGroupClass = '') => (
    <div className={`form-group ${formGroupClass}`.trim()}>
      <label>Dispute Resolution Period</label>
      <EscrowDisputePeriodSelect
        value={termsData.disputeResolutionPeriod}
        onChange={(value) =>
          setTermsData({
            ...termsData,
            disputeResolutionPeriod: value,
          })
        }
      />
    </div>
  );

  const renderEscrowAmountField = ({
    label = 'Total Amount',
    formGroupClass = '',
    showCurrencySelector = true,
  }) => (
    <div className={`form-group ${formGroupClass}`.trim()}>
      <label>{label}</label>
      <div className="create-escrow-amount-row">
        <input
          type="text"
          className="create-escrow-amount-row-input"
          placeholder={desktopModalLayout ? 'Add amount' : 'Enter amount'}
          value={termsData.totalAmount}
          onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
          inputMode="decimal"
          autoComplete="off"
        />
        {showCurrencySelector && (
          <div className="create-escrow-amount-row-meta">
            <EscrowFundingCurrencyDropdown
              currency={normalizeEscrowAmountCurrency(termsData.escrowCurrency)}
              onChange={(cur) =>
                setTermsData({
                  ...termsData,
                  escrowCurrency: normalizeEscrowAmountCurrency(cur),
                })
              }
            />
          </div>
        )}
      </div>
      {amountExchangeHint ? (
        <p className="create-escrow-amount-exchange-hint" aria-live="polite">
          {amountExchangeHint}
        </p>
      ) : null}
    </div>
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`create-escrow-flow-root ${
        desktopModalLayout
          ? 'create-escrow-flow-root--desktop-modal'
          : 'create-escrow-flow-root--mobile-fullscreen'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-escrow-flow-title"
      onClick={desktopModalLayout ? handleCloseModal : undefined}
    >
      <div
        className="create-escrow-modal create-escrow-flow-panel"
        onClick={desktopModalLayout ? (e) => e.stopPropagation() : undefined}
      >
        {/* Modal Header - Mobile with back icon */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-leading">
            <span className="modal-header-accent-bar" aria-hidden />
            <h2 id="create-escrow-flow-title">Create Escrow</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator - Mobile Card Style */}
        <div className="create-escrow-steps-mobile">
          {currentStep === 1 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <CreditCard size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 1/3</span>
                <span className="step-title-mobile">Type/ Counterparty</span>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <FileText size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 2/3</span>
                <span className="step-title-mobile">Terms</span>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <CheckCircle size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 3/3</span>
                <span className="step-title-mobile">Confirmation</span>
              </div>
            </div>
          )}
        </div>

        {/* Step Indicator - Desktop with vertical divider */}
        <div className="create-escrow-steps">
          <div
            className={`step-indicator ${
              currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''
            }`}
          >
            <div className="step-icon">
              {currentStep > 1 ? <CheckCircle size={20} /> : <CreditCard size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 1/3</span>
              <span className="step-title">Type/ Counterparty</span>
            </div>
          </div>
          <div className="step-divider"></div>
          <div
            className={`step-indicator ${
              currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''
            }`}
          >
            <div className="step-icon">
              {currentStep > 2 ? <CheckCircle size={20} /> : <FileText size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 2/3</span>
              <span className="step-title">Terms</span>
            </div>
          </div>
          <div className="step-divider"></div>
          <div className={`step-indicator ${currentStep === 3 ? 'active' : ''}`}>
            <div className="step-icon">
              <CheckCircle size={20} />
            </div>
            <div className="step-content">
              <span className="step-number">Step 3/3</span>
              <span className="step-title">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content">
          {currentStep === 1 && (
            <>
              <div className="escrow-form-section create-escrow-step1-type-block">
                <h3 className="section-title create-escrow-step1-section-label">Escrow Type</h3>
                <div className="escrow-type-buttons create-escrow-step1-type-buttons">
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Freelancing' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Freelancing')}
                  >
                    {selectedEscrowType === 'Freelancing' ? (
                      <CheckCircle size={18} strokeWidth={2.25} />
                    ) : (
                      <Plus size={18} strokeWidth={2.25} />
                    )}
                    <span>Freelancing</span>
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Real Estate' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Real Estate')}
                  >
                    {selectedEscrowType === 'Real Estate' ? (
                      <CheckCircle size={18} strokeWidth={2.25} />
                    ) : (
                      <Plus size={18} strokeWidth={2.25} />
                    )}
                    <span>Real Estate</span>
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Product purchase' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Product purchase')}
                  >
                    {selectedEscrowType === 'Product purchase' ? (
                      <CheckCircle size={18} strokeWidth={2.25} />
                    ) : (
                      <Plus size={18} strokeWidth={2.25} />
                    )}
                    <span>Product purchase</span>
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Custom' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Custom')}
                  >
                    {selectedEscrowType === 'Custom' ? (
                      <CheckCircle size={18} strokeWidth={2.25} />
                    ) : (
                      <Plus size={18} strokeWidth={2.25} />
                    )}
                    <span>Custom</span>
                  </button>
                </div>
              </div>

              <div className="escrow-form-section create-escrow-step1-counterparty-block">
                <h3 className="section-title create-escrow-step1-section-label">Escrow Counterparty</h3>
                <div
                  className="counterparty-method-toggle"
                  role="tablist"
                  aria-label="Counterparty identification"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={counterpartyMethod === 'wallet'}
                    className={`counterparty-method-btn ${counterpartyMethod === 'wallet' ? 'active' : ''}`}
                    onClick={() => setCounterpartyMethod('wallet')}
                  >
                    {COUNTERPARTY_METHOD_META.wallet.tabLabel}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={counterpartyMethod === 'trustitag'}
                    className={`counterparty-method-btn ${counterpartyMethod === 'trustitag' ? 'active' : ''}`}
                    onClick={() => setCounterpartyMethod('trustitag')}
                  >
                    {COUNTERPARTY_METHOD_META.trustitag.tabLabel}
                  </button>
                </div>

                {counterpartyMethod === 'wallet' ? (
                  <div className="create-escrow-step1-wallet-fields">
                    <div className="form-group">
                      <label>
                        Counterparty XRP Wallet Address <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        className="create-escrow-step1-input"
                        placeholder="••••••••••••••••"
                        value={formData.counterpartyWallet}
                        onChange={(e) =>
                          setFormData({ ...formData, counterpartyWallet: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="create-escrow-step1-wallet-fields">
                    <div className="form-group">
                      <label htmlFor="create-escrow-counterparty-trustitag">
                        {selectedCounterpartyMethodMeta.inputLabel} <span className="required">*</span>
                      </label>
                      <input
                        id="create-escrow-counterparty-trustitag"
                        type="text"
                        className="create-escrow-step1-input"
                        placeholder={selectedCounterpartyMethodMeta.placeholder}
                        autoComplete="off"
                        value={formData.counterpartyTrustitag}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            counterpartyTrustitag: e.target.value.trimStart(),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="create-escrow-step2">
              {/* Escrow Terms Section */}
              <div className="escrow-form-section">
                <h3 className="section-title">Escrow Terms</h3>

                {/* Release Type Buttons */}
                <div className="release-type-buttons create-escrow-release-type-buttons">
                  <button
                    type="button"
                    className={`release-type-btn ${
                      termsData.releaseType === 'Manual Release' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setTermsData({
                        ...termsData,
                        releaseType: 'Manual Release',
                        timeBasedAutoReleaseAck: false,
                      })
                    }
                  >
                    <Download size={18} />
                    Manual Release
                  </button>
                  <button
                    type="button"
                    className={`release-type-btn ${
                      termsData.releaseType === 'Time based' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setTermsData({
                        ...termsData,
                        releaseType: 'Time based',
                        timeBasedAutoReleaseAck: false,
                      })
                    }
                  >
                    <Clock size={18} />
                    Time based
                  </button>
                  <button
                    type="button"
                    className={`release-type-btn ${
                      termsData.releaseType === 'Milestones' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setTermsData({
                        ...termsData,
                        releaseType: 'Milestones',
                        timeBasedAutoReleaseAck: false,
                      })
                    }
                  >
                    <Coins size={18} />
                    Milestones
                  </button>
                </div>

                {/* Form Fields - Manual Release */}
                {termsData.releaseType === 'Manual Release' && (
                  <div className="terms-form-grid">
                    {renderDisputePeriodField()}

                    {renderEscrowAmountField({ label: 'Total Amount' })}

                    <div className="form-group form-group-full">
                      <label>Release Conditions</label>
                      <textarea
                        className="create-escrow-step2-textarea"
                        placeholder="Enter details"
                        value={termsData.releaseConditions}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            releaseConditions: e.target.value,
                          })
                        }
                        rows={4}
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* Form Fields - Time based */}
                {termsData.releaseType === 'Time based' && (
                  <>
                    <div className="create-escrow-time-based-banner">
                      <label className="create-escrow-time-based-banner-label">
                        <input
                          type="checkbox"
                          checked={termsData.timeBasedAutoReleaseAck}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              timeBasedAutoReleaseAck: e.target.checked,
                            })
                          }
                        />
                        <span>
                          I understand that escrow will complete automatically on the set date and
                          cannot be disputed after completion.
                        </span>
                      </label>
                    </div>
                    <h4 className="create-escrow-step2-counterparty-heading">Escrow Counterparty</h4>
                    <div className="terms-form-grid create-escrow-step2-terms-grid create-escrow-step2-time-terms">
                      <div className="form-group create-escrow-order-completion">
                        <label>Expected Completion Date</label>
                        <div className="date-input-wrapper create-escrow-step2-date-wrap">
                          <Calendar size={18} className="create-escrow-step2-date-icon" aria-hidden />
                          <input
                            type="date"
                            className="create-escrow-step2-date-input"
                            value={toDateInputValue(termsData.expectedCompletionDate)}
                            onChange={(e) => {
                              const dateValue = e.target.value;
                              setTermsData({
                                ...termsData,
                                expectedCompletionDate: dateValue || '',
                              });
                            }}
                            onMouseDown={(e) => {
                              if (e.target.showPicker) {
                                try {
                                  e.target.showPicker();
                                  e.preventDefault();
                                } catch (err) {
                                  /* ignore */
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-group create-escrow-order-release">
                        <label>Expected Release Date</label>
                        <div className="date-input-wrapper create-escrow-step2-date-wrap">
                          <Calendar size={18} className="create-escrow-step2-date-icon" aria-hidden />
                          <input
                            type="date"
                            className="create-escrow-step2-date-input"
                            value={toDateInputValue(termsData.expectedReleaseDate)}
                            onChange={(e) => {
                              const dateValue = e.target.value;
                              setTermsData({
                                ...termsData,
                                expectedReleaseDate: dateValue || '',
                              });
                            }}
                            onMouseDown={(e) => {
                              if (e.target.showPicker) {
                                try {
                                  e.target.showPicker();
                                  e.preventDefault();
                                } catch (err) {
                                  /* ignore */
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {renderDisputePeriodField('create-escrow-order-dispute')}

                      {renderEscrowAmountField({
                        label: 'Escrow Amount',
                        formGroupClass: 'create-escrow-order-amount',
                      })}

                      <div className="form-group form-group-full">
                        <label>Release Conditions</label>
                        <textarea
                          className="create-escrow-step2-textarea"
                          placeholder="Enter details"
                          value={termsData.releaseConditions}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              releaseConditions: e.target.value,
                            })
                          }
                          rows={4}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Form Fields - Milestones */}
                {termsData.releaseType === 'Milestones' && (
                  <div className="terms-form-grid create-escrow-milestone-terms">
                    {renderEscrowAmountField({ label: 'Total Amount' })}

                    <div className="form-group">
                      <label htmlFor="create-escrow-milestone-amount">Milestone amount</label>
                      <input
                        id="create-escrow-milestone-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="Enter amount"
                        value={termsData.milestoneAmount}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            milestoneAmount: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMilestone();
                          }
                        }}
                      />
                      {milestoneAmountExchangeHint ? (
                        <p className="create-escrow-amount-exchange-hint" aria-live="polite">
                          {milestoneAmountExchangeHint}
                        </p>
                      ) : null}
                    </div>

                    <div className="form-group">
                      <label htmlFor="create-escrow-milestone-details">Milestone details</label>
                      <input
                        id="create-escrow-milestone-details"
                        type="text"
                        placeholder="Enter milestone details"
                        value={termsData.milestoneDetails}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            milestoneDetails: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMilestone();
                          }
                        }}
                      />
                    </div>

                    {renderDisputePeriodField()}

                    <div className="form-group">
                      <label>Expected Completion Date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="date"
                          placeholder="Add Date"
                          value={toDateInputValue(termsData.expectedCompletionDate)}
                          onChange={(e) => {
                            const dateValue = e.target.value;
                            setTermsData({
                              ...termsData,
                              expectedCompletionDate: dateValue || '',
                            });
                          }}
                          onMouseDown={(e) => {
                            if (e.target.showPicker) {
                              try {
                                e.target.showPicker();
                                e.preventDefault();
                              } catch (err) {
                                /* ignore */
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {Array.isArray(termsData.milestones) && termsData.milestones.length > 0 && (
                      <div className="form-group form-group-full">
                        <ul className="create-escrow-milestone-list" aria-label="Added milestones">
                          {termsData.milestones.map((milestone, index) => {
                            const milestoneExchangeHint = formatAmountExchangeHint(
                              milestone.amount,
                              termsData.escrowCurrency,
                              exchangeRates,
                              exchangeQuoteDirection,
                            );
                            return (
                            <li key={`${milestone.details}-${index}`} className="create-escrow-milestone-item">
                              <div className="create-escrow-milestone-item-copy">
                                <span className="create-escrow-milestone-item-title">
                                  Milestone {index + 1}
                                </span>
                                <span className="create-escrow-milestone-item-details">
                                  {milestone.details}
                                </span>
                              </div>
                              <span className="create-escrow-milestone-item-amount">
                                {milestone.amount}
                                {milestoneExchangeHint ? (
                                  <span className="create-escrow-milestone-item-exchange">
                                    {milestoneExchangeHint}
                                  </span>
                                ) : null}
                              </span>
                              <button
                                type="button"
                                className="create-escrow-milestone-remove"
                                onClick={() => handleRemoveMilestone(index)}
                                aria-label={`Remove milestone ${index + 1}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className="form-group form-group-full">
                      <button
                        type="button"
                        className="add-milestone-btn"
                        onClick={handleAddMilestone}
                      >
                        <Plus size={18} />
                        <span>Add milestone</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="create-escrow-step3 confirmation-step">
              <div className="confirmation-details-section">
                <h3 className="create-escrow-step3-heading">Escrow Type & Escrow Terms</h3>
                <div className="create-escrow-step3-type-grid">
                  <div className="create-escrow-step3-type-cell">
                    <span className="create-escrow-step3-muted-label">Escrow Type</span>
                    <span className="confirmation-type-btn">
                      <CheckCircle size={16} aria-hidden />
                      {selectedEscrowType}
                    </span>
                  </div>
                  <div className="create-escrow-step3-type-cell">
                    <span className="create-escrow-step3-muted-label">Escrow Terms</span>
                    <span className="confirmation-type-btn">
                      {termsData.releaseType === 'Time based' && <Clock size={16} aria-hidden />}
                      {termsData.releaseType === 'Milestones' && <Coins size={16} aria-hidden />}
                      {termsData.releaseType === 'Manual Release' && (
                        <Download size={16} aria-hidden />
                      )}
                      {termsData.releaseType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="confirmation-details-section">
                <h3 className="create-escrow-step3-heading">Payment Method</h3>
                <div className="create-escrow-step3-payment-toggle" role="tablist" aria-label="Payment method">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedConfirmationPaymentMethod === 'googlepay'}
                    aria-label="Google Pay"
                    className={`create-escrow-step3-payment-btn ${
                      selectedConfirmationPaymentMethod === 'googlepay' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedConfirmationPaymentMethod('googlepay');
                      setShowPayerWalletModal(false);
                    }}
                  >
                    <GooglePayLogo />
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedConfirmationPaymentMethod === 'applepay'}
                    aria-label="Apple Pay"
                    className={`create-escrow-step3-payment-btn ${
                      selectedConfirmationPaymentMethod === 'applepay' ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedConfirmationPaymentMethod('applepay');
                      setShowPayerWalletModal(false);
                    }}
                  >
                    <ApplePayLogo />
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedConfirmationPaymentMethod === 'trustichain'}
                    aria-label="Pay with Trustichain"
                    className={`create-escrow-step3-payment-btn ${
                      selectedConfirmationPaymentMethod === 'trustichain' ? 'active' : ''
                    }`}
                    onClick={handleSelectTrustichainPayment}
                  >
                    <TrustichainPayBadge />
                  </button>
                </div>
                {selectedConfirmationPaymentMethod === 'trustichain' && (
                  <div className="create-escrow-step3-payer-wallet">
                    <span className="create-escrow-step3-payer-wallet-label">Escrow from wallet</span>
                    <button
                      type="button"
                      className={`create-escrow-payer-wallet-summary${
                        selectedPayerWallet ? '' : ' create-escrow-payer-wallet-summary--empty'
                      }`}
                      onClick={() => setShowPayerWalletModal(true)}
                    >
                      {selectedPayerWallet ? (
                        <>
                          <span
                            className={`create-escrow-step3-payer-wallet-icon${
                              selectedPayerWallet.source === 'metamask' ? ' is-metamask' : ''
                            }`}
                          >
                            <img src={getPayerWalletIconUrl(selectedPayerWallet)} alt="" />
                          </span>
                          <span className="create-escrow-payer-wallet-summary-body">
                            <span className="create-escrow-step3-payer-wallet-option-title">
                              {selectedPayerWallet.label}
                            </span>
                            <span className="create-escrow-step3-payer-wallet-option-meta">
                              {selectedPayerWallet.network} ·{' '}
                              {maskWalletAddressShort(selectedPayerWallet.address)}
                            </span>
                          </span>
                          <ChevronDown size={18} aria-hidden />
                        </>
                      ) : (
                        <>
                          <span>Select wallet to pay from</span>
                          <ChevronDown size={18} aria-hidden />
                        </>
                      )}
                    </button>
                  </div>
                )}
                {stripePaymentStatus && (
                  <p className="create-escrow-step3-payment-status">
                    Payment status: {stripePaymentStatus?.status || 'initialized'}
                    {stripePaymentStatus?.payableAmountUsd != null
                      ? ` · Payable $${Number(stripePaymentStatus.payableAmountUsd).toFixed(2)}`
                      : ''}
                    {stripePaymentStatus?.creationFeeUsd != null
                      ? ` (fee $${Number(stripePaymentStatus.creationFeeUsd).toFixed(2)})`
                      : ''}
                  </p>
                )}
              </div>

              <div className="confirmation-details-section">
                <h3 className="create-escrow-step3-heading">Escrow Counterparty</h3>
                {counterpartyMethod !== 'wallet' ? (
                  <div className="confirmation-field-group">
                    <span className="confirmation-label">
                      {selectedCounterpartyMethodMeta.inputLabel} <span className="required">*</span>
                    </span>
                    <div className="confirmation-masked-input confirmation-masked-input--plain">
                      {formData.counterpartyTrustitag.trim() || '—'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="confirmation-field-group">
                      <span className="confirmation-label">
                        Counterparty XRP Wallet Address <span className="required">*</span>
                      </span>
                      <div className="confirmation-masked-input">
                        {maskCounterpartyWalletForConfirmation(formData.counterpartyWallet)}
                      </div>
                    </div>
                    <div className="create-escrow-step3-counterparty-extra counterparty-form-grid">
                      <div className="form-column">
                        <div className="form-group">
                          <label>Email</label>
                          <div
                            style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                          >
                            {formData.counterpartyEmail || '—'}
                          </div>
                        </div>
                      </div>
                      <div className="form-column">
                        <div className="form-group">
                          <label>Name</label>
                          <div
                            style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                          >
                            {formData.counterpartyName || '—'}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <div
                            style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                          >
                            {formData.counterpartyPhone || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="confirmation-details-section">
                <h3 className="create-escrow-step3-heading">Escrow Details</h3>
                <div className="confirmation-details-list">
                  {termsData.releaseType !== 'Manual Release' && (
                    <div className="confirmation-detail-item">
                      <span className="confirmation-detail-label">Expected Completion Date</span>
                      <span className="confirmation-detail-value">
                        {formatConfirmationDisplayDate(termsData.expectedCompletionDate)}
                        <Calendar size={16} aria-hidden />
                      </span>
                    </div>
                  )}
                  {termsData.releaseType === 'Time based' &&
                    Boolean(toDateInputValue(termsData.expectedReleaseDate)) && (
                      <div className="confirmation-detail-item">
                        <span className="confirmation-detail-label">Expected Release Date</span>
                        <span className="confirmation-detail-value">
                          {formatConfirmationDisplayDate(termsData.expectedReleaseDate)}
                          <Calendar size={16} aria-hidden />
                        </span>
                      </div>
                    )}
                  <div className="confirmation-detail-item">
                    <span className="confirmation-detail-label">Dispute Resolution Period</span>
                    <span className="confirmation-detail-value">
                      {termsData.disputeResolutionPeriod
                        ? `${termsData.disputeResolutionPeriod} days`
                        : '—'}
                    </span>
                  </div>
                  {termsData.releaseType === 'Milestones' &&
                    Array.isArray(termsData.milestones) &&
                    termsData.milestones.length > 0 && (
                      <div className="confirmation-detail-item create-escrow-step3-milestones">
                        <span className="confirmation-detail-label">Milestones</span>
                        <ul className="create-escrow-step3-milestone-list">
                          {termsData.milestones.map((milestone, index) => {
                            const milestoneExchangeHint = formatAmountExchangeHint(
                              milestone.amount,
                              termsData.escrowCurrency,
                              exchangeRates,
                              exchangeQuoteDirection,
                            );
                            return (
                            <li key={`${milestone.details}-${index}`}>
                              <span>
                                {index + 1}. {milestone.details}
                              </span>
                              <span className="create-escrow-step3-milestone-amount">
                                {milestone.amount}
                                {milestoneExchangeHint ? (
                                  <span className="create-escrow-milestone-item-exchange">
                                    {milestoneExchangeHint}
                                  </span>
                                ) : null}
                              </span>
                            </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  <div className="create-escrow-step3-amount-fee-grid">
                    <div className="confirmation-detail-item create-escrow-step3-amount-fee-item">
                      <span className="confirmation-detail-label">Escrow Amount</span>
                      <span className="confirmation-detail-value">
                        {formatConfirmationMoneyLine(
                          parsedEscrowAmount,
                          termsData.escrowCurrency,
                          exchangeRates,
                          exchangeQuoteDirection,
                        )}
                      </span>
                    </div>
                    <div className="confirmation-detail-item create-escrow-step3-amount-fee-item">
                      <span className="confirmation-detail-label create-escrow-step3-fee-label">
                        Escrow Fee
                        {Number.isFinite(escrowCreationFeeDisplay.percentage)
                          ? ` (${escrowCreationFeeDisplay.percentage}%)`
                          : ''}
                      </span>
                      <span className="confirmation-detail-value">
                        {isLoadingCreationFeeQuote ? (
                          <LoadingIndicator size="sm" />
                        ) : (
                          formatConfirmationMoneyLine(
                            escrowCreationFeeDisplay.fee,
                            termsData.escrowCurrency,
                            exchangeRates,
                            exchangeQuoteDirection,
                          )
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="confirmation-detail-item">
                    <span className="confirmation-detail-label">Total Escrowed Payment</span>
                    <span className="confirmation-detail-value">
                      {isLoadingCreationFeeQuote ? (
                        <LoadingIndicator size="sm" />
                      ) : (
                        formatConfirmationMoneyLine(
                          escrowCreationFeeDisplay.total,
                          termsData.escrowCurrency,
                          exchangeRates,
                          exchangeQuoteDirection,
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {currentStep === 1 && (
          <div className="create-escrow-modal-footer">
            <button
              type="button"
              className="submit-next-btn"
              onClick={handleContinueFromStep1}
            >
              <div className="submit-btn-icon-circle">
                <ArrowRight size={16} />
              </div>
              <span>Submit and Next</span>
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="create-escrow-modal-footer">
            <button
              type="button"
              className="previous-btn"
              onClick={() => setCurrentStep(1)}
            >
              <div className="previous-btn-icon-circle">
                <ArrowLeft size={16} />
              </div>
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="submit-next-btn"
              onClick={handleContinueFromStep2}
            >
              <div className="submit-btn-icon-circle">
                <ArrowRight size={16} />
              </div>
              <span>Submit and Next</span>
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div
            className={`create-escrow-modal-footer${
              desktopModalLayout ? ' create-escrow-step3-footer-desktop' : ''
            }`}
          >
            <button
              type="button"
              className="previous-btn"
              onClick={() => setCurrentStep(2)}
            >
              <div className="previous-btn-icon-circle">
                <ArrowLeft size={16} />
              </div>
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="submit-next-btn"
              onClick={handleCreateEscrow}
              disabled={
                isCreatingEscrow ||
                !selectedConfirmationPaymentMethod ||
                (selectedConfirmationPaymentMethod === 'trustichain' &&
                  (!selectedPayerWalletId || payerWalletOptions.length === 0))
              }
            >
              <div className="submit-btn-icon-circle">
                {isCreatingEscrow ? (
                  <div
                    className="loading-spinner"
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                    }}
                  ></div>
                ) : (
                  <CheckCircle size={16} />
                )}
              </div>
              <span>{isCreatingEscrow ? 'Creating...' : 'Confirm'}</span>
            </button>
          </div>
        )}
      </div>

      <EscrowPayerWalletSelectModal
        isOpen={showPayerWalletModal}
        wallets={payerWalletOptions}
        selectedWalletId={selectedPayerWalletId}
        onClose={() => setShowPayerWalletModal(false)}
        onConfirm={handlePayerWalletConfirm}
      />
    </div>
  );
};

export default CreateEscrowForm;

