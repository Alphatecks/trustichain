import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import { getApiUrl } from '../../utils/config';
import {
  emptyCustodialWalletBalances as emptyEscrowCurrencyBalances,
  parseCustodialWalletBalances as parseEscrowCurrencyBalancesMap,
  readStoredDashboardAccountType as readDashboardAccountType,
} from '../../utils/custodialWalletBalances';
import { extractWalletAddresses } from '../../utils/depositAddressFlow';
import { useWeb3 } from '../../context/Web3Context';
import toast from 'react-hot-toast';
import googleLogo from '../../assets/images/icons/google-logo.svg';
import '../LoadingIndicator/index.css';
import '../../pages/dashboard/my-escrow/MyEscrow.css';
import EscrowFundingCurrencyDropdown from './EscrowFundingCurrencyDropdown';
import './index.css';

const PAYER_WALLET_ICONS = {
  custodial: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
  xaman:
    'https://cdn.prod.website-files.com/66ffb9c73bc7e83a1e0e1006/67028cc20682f3c6f7ec6161_Xaman%20Logo.svg',
  metamask: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  connected: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
};

/** Matches MyEscrow.css desktop breakpoint (`min-width: 769px`). */
const CREATE_ESCROW_DESKTOP_MODAL_MQ = '(min-width: 769px)';

/** Normalize stored date strings for `<input type="date" />`. */
const toDateInputValue = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.includes('T')) return s.slice(0, 10);
  return s;
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

/** Custodial TrustiChain XRP address from wallet balance API. */
const fetchCustodialPayerWallet = async (signal) => {
  const token = localStorage.getItem('token');
  if (!token) return '';
  const accountType = readDashboardAccountType();
  const balanceUrl =
    accountType === 'Business Suite'
      ? getApiUrl('api/business-suite/wallet/balance')
      : getApiUrl('api/wallet/balance');
  const response = await fetch(balanceUrl, {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return '';
  const result = await response.json();
  return extractWalletAddresses(result).xrp || '';
};

/** Time-based escrow funding assets shown in the balance dropdown (API-driven balances). */
const ESCROW_FUNDING_CURRENCIES = ['RLUSD', 'XRP', 'USDT', 'USDC'];

const normalizeEscrowPayloadCurrency = (raw) => {
  const c = String(raw || '').toUpperCase();
  return ESCROW_FUNDING_CURRENCIES.includes(c) ? c : 'XRP';
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
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
};

const estimateUsdForConfirmationAmount = (amountNum, currency, xrpToUsdRate) => {
  const cur = normalizeEscrowPayloadCurrency(currency);
  if (!Number.isFinite(amountNum)) return null;
  if (cur === 'XRP' && Number.isFinite(xrpToUsdRate) && xrpToUsdRate > 0) {
    return amountNum * xrpToUsdRate;
  }
  if (cur === 'RLUSD' || cur === 'USDT' || cur === 'USDC') {
    return amountNum * 1;
  }
  return null;
};

/** Short hint under amount inputs — e.g. `≈ $125.50 USD` or `≈ 45.23 XRP`. */
const formatAmountExchangeHint = (amountStr, currency, xrpToUsdRate) => {
  const raw = String(amountStr || '').trim().replace(/,/g, '');
  if (!raw) return null;
  const amountNum = parseFloat(raw);
  if (!Number.isFinite(amountNum) || amountNum <= 0) return null;

  const cur = normalizeEscrowPayloadCurrency(currency);
  const usd = estimateUsdForConfirmationAmount(amountNum, cur, xrpToUsdRate);

  if (cur === 'XRP' && usd != null && Number.isFinite(usd)) {
    return `≈ $${usd.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }

  if (['RLUSD', 'USDT', 'USDC'].includes(cur) && usd != null && Number.isFinite(usd)) {
    const xrpRate = Number(xrpToUsdRate);
    if (Number.isFinite(xrpRate) && xrpRate > 0) {
      const xrpEquivalent = usd / xrpRate;
      return `≈ $${usd.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD · ${xrpEquivalent.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })} XRP`;
    }
    return `≈ $${usd.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }

  if (usd != null && Number.isFinite(usd)) {
    return `≈ $${usd.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  }

  return null;
};

const maskWalletAddressShort = (addr) => {
  const s = String(addr || '').trim();
  if (!s) return '—';
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
};

/** Payer wallets available when paying with TrustiChain. */
const buildPayerWalletOptions = ({ custodialAddress, account, isConnected }) => {
  const options = [];
  const hasWindow = typeof window !== 'undefined';

  if (custodialAddress?.trim()) {
    options.push({
      id: 'custodial',
      label: 'TrustiChain Wallet',
      network: 'XRPL',
      address: custodialAddress.trim(),
    });
  }

  const xamanConnected = hasWindow && localStorage.getItem('xamanWalletConnected') === 'true';
  const xamanAddress = hasWindow ? localStorage.getItem('xamanWalletAddress') : '';
  if (xamanConnected && xamanAddress?.trim()) {
    options.push({
      id: 'xaman',
      label: 'XAMAN',
      network: 'XRPL',
      address: xamanAddress.trim(),
    });
  }

  const metamaskConnected =
    hasWindow && localStorage.getItem('metamaskWalletConnected') === 'true';
  if (metamaskConnected && isConnected && account?.trim()) {
    options.push({
      id: 'metamask',
      label: 'MetaMask',
      network: 'Connected',
      address: account.trim(),
    });
  } else if (isConnected && account?.trim() && !xamanConnected) {
    options.push({
      id: 'connected',
      label: 'Connected Wallet',
      network: 'Connected',
      address: account.trim(),
    });
  }

  return options;
};

/** e.g. `0.50 RLUSD ($0.50 USD)` */
const formatConfirmationMoneyLine = (amountNum, currency, xrpToUsdRate) => {
  const cur = normalizeEscrowPayloadCurrency(currency);
  if (!Number.isFinite(amountNum)) return '—';
  const main = `${Number(amountNum).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })} ${cur}`;
  const usd = estimateUsdForConfirmationAmount(amountNum, cur, xrpToUsdRate);
  if (usd == null || !Number.isFinite(usd)) return main;
  return `${main} ($${usd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD)`;
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
  const [desktopModalLayout, setDesktopModalLayout] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(CREATE_ESCROW_DESKTOP_MODAL_MQ).matches,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEscrowType, setSelectedEscrowType] = useState('Freelancing');
  const [selectedConfirmationPaymentMethod, setSelectedConfirmationPaymentMethod] =
    useState('');
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
    escrowCurrency: 'RLUSD',
  });

  const [exchangeRate, setExchangeRate] = useState(null); // XRP to USD rate
  const [custodialWalletAddress, setCustodialWalletAddress] = useState('');
  const [selectedPayerWalletId, setSelectedPayerWalletId] = useState('');
  const [escrowCurrencyBalances, setEscrowCurrencyBalances] = useState(() =>
    emptyEscrowCurrencyBalances(),
  );
  const [escrowFundingWalletsLoading, setEscrowFundingWalletsLoading] = useState(false);
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [escrowCreationStep, setEscrowCreationStep] = useState('idle'); // 'idle' | 'creating'
  const [stripePaymentStatus, setStripePaymentStatus] = useState(null);
  const counterpartyWalletRef = useRef('');
  const counterpartyTrustitagRef = useRef('');
  const wasOpenRef = useRef(false);

  const getCounterpartyWalletValue = () =>
    (counterpartyWalletRef.current || formData.counterpartyWallet || '').trim();

  const getCounterpartyTrustitagValue = () =>
    (counterpartyTrustitagRef.current || formData.counterpartyTrustitag || '').trim();

  const payerWalletOptions = useMemo(
    () =>
      buildPayerWalletOptions({
        custodialAddress: custodialWalletAddress,
        account,
        isConnected,
      }),
    [custodialWalletAddress, account, isConnected],
  );

  const amountExchangeHint = formatAmountExchangeHint(
    termsData.totalAmount,
    termsData.escrowCurrency,
    exchangeRate,
  );

  // Fetch exchange rate for XRP to USD conversion (copied from MyEscrow)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const apiUrl = getApiUrl('api/exchange/rates');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data?.rates) {
            // Find XRP to USD rate
            const xrpRate = result.data.rates.find(
              (rate) =>
                (rate.from === 'XRP' && rate.to === 'USD') ||
                (rate.fromCurrency === 'XRP' && rate.toCurrency === 'USD'),
            );
            if (xrpRate) {
              setExchangeRate(xrpRate.rate || xrpRate.exchangeRate || 1);
            } else {
              // Fallback to 1 if not found
              setExchangeRate(1);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to 1 if error
        setExchangeRate(1);
      }
    };

    if (isOpen) {
      fetchExchangeRate();
    }
  }, [isOpen]);

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

  const resetFormState = () => {
    setEscrowCreationStep('idle');
    setIsCreatingEscrow(false);
    setCurrentStep(1);
    setSelectedEscrowType('Freelancing');
    setSelectedConfirmationPaymentMethod('');
    setStripePaymentStatus(null);
    setCounterpartyMethod('wallet');
    counterpartyWalletRef.current = '';
    counterpartyTrustitagRef.current = '';
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
      escrowCurrency: 'RLUSD',
    });
    setEscrowCurrencyBalances(emptyEscrowCurrencyBalances());
    setCustodialWalletAddress('');
    setSelectedPayerWalletId('');
  };

  // Fresh form each time the modal opens; clear in-flight state when it closes.
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      resetFormState();
    }
    wasOpenRef.current = isOpen;
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

  useEffect(() => {
    if (!isOpen || currentStep !== 2) return undefined;
    const ac = new AbortController();
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setEscrowCurrencyBalances(emptyEscrowCurrencyBalances());
          return;
        }
        setEscrowFundingWalletsLoading(true);
        const accountType = readDashboardAccountType();
        const balanceUrl =
          accountType === 'Business Suite'
            ? getApiUrl('api/business-suite/wallet/balance')
            : getApiUrl('api/wallet/balance');
        const response = await fetch(balanceUrl, {
          method: 'GET',
          signal: ac.signal,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          setEscrowCurrencyBalances(emptyEscrowCurrencyBalances());
          return;
        }
        const result = await response.json();
        setEscrowCurrencyBalances(parseEscrowCurrencyBalancesMap(result));
      } catch (e) {
        if (e?.name !== 'AbortError') {
          setEscrowCurrencyBalances(emptyEscrowCurrencyBalances());
        }
      } finally {
        setEscrowFundingWalletsLoading(false);
      }
    };
    load();
    return () => ac.abort();
  }, [isOpen, currentStep]);

  // Load custodial wallet address and default payer wallet for escrow creation.
  useEffect(() => {
    if (!isOpen) return undefined;
    const ac = new AbortController();
    const loadPayerWallet = async () => {
      let custodial = '';
      try {
        custodial = await fetchCustodialPayerWallet(ac.signal);
        if (custodial) {
          setCustodialWalletAddress(custodial);
        }
      } catch (e) {
        if (e?.name !== 'AbortError') {
          /* ignore — validation will surface a clear message later */
        }
      }

      const fromContext = resolvePayerWalletFromContext(account);
      const defaultWallet = fromContext || custodial || '';
      if (defaultWallet) {
        setFormData((prev) =>
          prev.payerWallet.trim() ? prev : { ...prev, payerWallet: defaultWallet },
        );
      }
    };
    loadPayerWallet();
    return () => ac.abort();
  }, [isOpen, account]);

  // Default TrustiChain payer wallet when options load or payment method changes.
  useEffect(() => {
    if (selectedConfirmationPaymentMethod !== 'trustichain') return;
    if (payerWalletOptions.length === 0) {
      setSelectedPayerWalletId('');
      return;
    }
    setSelectedPayerWalletId((prev) =>
      prev && payerWalletOptions.some((w) => w.id === prev) ? prev : payerWalletOptions[0].id,
    );
  }, [selectedConfirmationPaymentMethod, payerWalletOptions]);

  useEffect(() => {
    if (selectedConfirmationPaymentMethod !== 'trustichain' || !selectedPayerWalletId) return;
    const selected = payerWalletOptions.find((w) => w.id === selectedPayerWalletId);
    if (selected?.address) {
      setFormData((prev) => ({ ...prev, payerWallet: selected.address }));
    }
  }, [selectedConfirmationPaymentMethod, selectedPayerWalletId, payerWalletOptions]);

  // Handle create escrow (adapted from MyEscrow, extended with XUMM/Xaman flow)
  const handleCreateEscrow = async () => {
    try {
      setIsCreatingEscrow(true);
      setEscrowCreationStep('creating');
      setStripePaymentStatus(null);

      let payerWalletResolved =
        formData.payerWallet?.trim() || resolvePayerWalletFromContext(account) || '';

      if (selectedConfirmationPaymentMethod === 'trustichain') {
        if (!selectedPayerWalletId) {
          toast.error('Please select which wallet to pay from');
          setIsCreatingEscrow(false);
          return;
        }
        const selectedWallet = payerWalletOptions.find((w) => w.id === selectedPayerWalletId);
        if (!selectedWallet?.address) {
          toast.error('Please select a valid payer wallet');
          setIsCreatingEscrow(false);
          return;
        }
        payerWalletResolved = selectedWallet.address;
      } else if (!payerWalletResolved) {
        try {
          payerWalletResolved = await fetchCustodialPayerWallet();
          if (payerWalletResolved) {
            setFormData((prev) => ({ ...prev, payerWallet: payerWalletResolved }));
          }
        } catch (_) {
          /* ignore */
        }
      }

      if (!payerWalletResolved) {
        toast.error(
          'Create your TrustiChain wallet or connect Xaman/MetaMask before creating an escrow.',
        );
        setIsCreatingEscrow(false);
        return;
      }

      const escrowCurrencyResolved = normalizeEscrowPayloadCurrency(termsData.escrowCurrency);

      const counterpartyWalletTrimmed = getCounterpartyWalletValue();
      const counterpartyTrustitagTrimmed = getCounterpartyTrustitagValue();

      if (counterpartyMethod === 'wallet' && !counterpartyWalletTrimmed) {
        toast.error('Please enter the counterparty XRP wallet address');
        setIsCreatingEscrow(false);
        return;
      }

      if (counterpartyMethod === 'trustitag' && !counterpartyTrustitagTrimmed) {
        toast.error("Please enter the counterparty's Trustitag");
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
      if (
        termsData.releaseType === 'Milestones' &&
        (!termsData.milestones || termsData.milestones.length === 0)
      ) {
        toast.error('Please add at least one milestone');
        setIsCreatingEscrow(false);
        return;
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

      // Format dates to YYYY-MM-DD format
      const expectedCompletionDateISO = formatDateToYYYYMMDD(termsData.expectedCompletionDate);
      const expectedReleaseDateISO = formatDateToYYYYMMDD(termsData.expectedReleaseDate);

      // Format dispute resolution period
      const disputeResolutionPeriodFormatted = formatDisputePeriod(
        termsData.disputeResolutionPeriod,
      );

      // Determine description - use milestoneDetails, releaseConditions, or fallback
      const description =
        termsData.milestoneDetails ||
        termsData.releaseConditions ||
        `Escrow for ${selectedEscrowType}`;

      // Build base payload with common fields
      const payload = {
        payerXrpWalletAddress: payerWalletResolved,
        ...(counterpartyMethod === 'trustitag'
          ? { counterpartyTrustitag: counterpartyTrustitagTrimmed }
          : { counterpartyXrpWalletAddress: counterpartyWalletTrimmed }),
        amount: parseFloat(termsData.totalAmount),
        currency: escrowCurrencyResolved,
        transactionType: transactionType,
        industry: industry,
        description: description,
        payerEmail: formData.payerEmail || '',
        payerName: formData.payerName || '',
        counterpartyEmail: formData.counterpartyEmail || '',
        counterpartyName: formData.counterpartyName || '',
        releaseType: termsData.releaseType,
        totalAmount: parseFloat(termsData.totalAmount),
        paymentMethod: selectedConfirmationPaymentMethod,
      };

      // Add date fields if provided
      if (expectedCompletionDateISO) {
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
        // Format milestones array
        if (termsData.milestones && termsData.milestones.length > 0) {
          payload.milestones = termsData.milestones.map((milestone) => ({
            milestoneDetails: milestone.details,
            milestoneAmount: parseFloat(milestone.amount),
          }));
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
          const totalAmountNumber = parseFloat(termsData.totalAmount);
          const effectiveRate = exchangeRate || 1;

          // Helper to build createdEscrow object in a consistent way
          const buildCreatedEscrow = (escrowSource) => {
            const base = escrowSource || {};
            return {
              ...base,
              // Ensure xrplEscrowId is preserved even if nested differently
              xrplEscrowId:
                base.xrplEscrowId ||
                base.xrpl_escrow_id ||
                xrplEscrowId ||
                responseData.xrpl_escrow_id,
              amount: termsData.totalAmount,
              amountUsd: (totalAmountNumber * effectiveRate).toFixed(2),
            };
          };

          // Case 1: Backend already created and activated XRPL escrow (no XUMM needed)
          if (
            xrplTxHash &&
            (escrow?.status === 'active' || escrow?.status === 'ACTIVE')
          ) {
            const createdEscrow = buildCreatedEscrow(escrow || responseData);

            toast.success('Escrow created successfully!');

            if (onSuccess) {
              onSuccess(createdEscrow);
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

            const amountNumber = parseFloat(termsData.totalAmount);
            const amountUsdEstimate = estimateUsdForConfirmationAmount(
              amountNumber,
              termsData.escrowCurrency,
              exchangeRate,
            );
            const amountUsd = Number.isFinite(amountUsdEstimate)
              ? Number(amountUsdEstimate.toFixed(2))
              : Number(amountNumber.toFixed(2));

            const piResponse = await fetch(getApiUrl('api/payments/payment-intent'), {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                escrowId: resolvedEscrowId,
                amountUsd,
                currency: 'usd',
                idempotencyKey: `pi-${resolvedEscrowId}-${Date.now()}`,
              }),
            });
            const piData = await piResponse.json().catch(() => ({}));
            if (!piResponse.ok) {
              throw new Error(piData?.message || piData?.error || 'Failed to create payment intent');
            }

            const siResponse = await fetch(getApiUrl('api/payments/setup-intent'), {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                escrowId: resolvedEscrowId,
                customerEmail: formData.payerEmail?.trim() || 'unknown@trustichain.app',
                idempotencyKey: `si-${resolvedEscrowId}-${Date.now()}`,
              }),
            });
            const siData = await siResponse.json().catch(() => ({}));
            if (!siResponse.ok) {
              throw new Error(siData?.message || siData?.error || 'Failed to create setup intent');
            }

            const statusResponse = await fetch(
              getApiUrl(`api/payments/escrow/${resolvedEscrowId}/status`),
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            const statusData = await statusResponse.json().catch(() => null);
            if (statusResponse.ok) {
              setStripePaymentStatus(statusData?.data || statusData || null);
            } else {
              setStripePaymentStatus(null);
            }

            toast.success(
              `${selectedConfirmationPaymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay'} initialized. Continue payment using returned Stripe client secret.`,
            );
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
              if (onSuccess) {
                onSuccess(createdEscrow);
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
            'Unexpected escrow create response. Missing xrplTxHash or xummUrl/escrowId.',
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
      toast.error(error?.message || 'An error occurred while creating escrow');
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
      const counterpartyWallet = getCounterpartyWalletValue();
      if (!counterpartyWallet) {
        toast.error('Please enter the counterparty XRP wallet address');
        return;
      }
      setFormData((prev) => ({ ...prev, counterpartyWallet }));
    } else {
      const counterpartyTrustitag = getCounterpartyTrustitagValue();
      if (!counterpartyTrustitag) {
        toast.error("Please enter the counterparty's Trustitag");
        return;
      }
      setFormData((prev) => ({ ...prev, counterpartyTrustitag }));
    }
    setCurrentStep(2);
  };

  const handleContinueFromStep2 = () => {
    if (termsData.releaseType === 'Time based' && !termsData.timeBasedAutoReleaseAck) {
      toast.error(
        'Please confirm that you understand automatic escrow completion on the set date.',
      );
      return;
    }
    if (!termsData.totalAmount?.trim()) {
      toast.error('Please enter the total amount');
      return;
    }
    if (escrowFundingWalletsLoading) {
      toast.error('Still loading your balances. Please wait a moment.');
      return;
    }
    setCurrentStep(3);
  };

  if (!isOpen) {
    return null;
  }

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
              currencies={ESCROW_FUNDING_CURRENCIES}
              currency={normalizeEscrowPayloadCurrency(termsData.escrowCurrency)}
              balances={escrowCurrencyBalances}
              loading={escrowFundingWalletsLoading}
              disabled={escrowFundingWalletsLoading}
              onChange={(cur) =>
                setTermsData({
                  ...termsData,
                  escrowCurrency: normalizeEscrowPayloadCurrency(cur),
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
      {Number.isFinite(exchangeRate) &&
      exchangeRate > 0 &&
      normalizeEscrowPayloadCurrency(termsData.escrowCurrency) === 'XRP' ? (
        <p className="create-escrow-amount-exchange-rate">
          1 XRP = $
          {Number(exchangeRate).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          })}{' '}
          USD
        </p>
      ) : null}
    </div>
  );

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
                      <label htmlFor="create-escrow-counterparty-wallet">
                        Counterparty XRP Wallet Address <span className="required">*</span>
                      </label>
                      <input
                        id="create-escrow-counterparty-wallet"
                        type="text"
                        className="create-escrow-step1-input"
                        placeholder="rXXXXXXXXXXXXXXXXXXXXXXXX"
                        autoComplete="off"
                        spellCheck={false}
                        value={formData.counterpartyWallet}
                        onChange={(e) => {
                          const value = e.target.value;
                          counterpartyWalletRef.current = value;
                          setFormData((prev) => ({
                            ...prev,
                            counterpartyWallet: value,
                          }));
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value.trimStart();
                          counterpartyTrustitagRef.current = value;
                          setFormData((prev) => ({
                            ...prev,
                            counterpartyTrustitag: value,
                          }));
                        }}
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
                    <div className="form-group">
                      <label>Dispute Resolution Period</label>
                      <div className="select-input-wrapper">
                        <select
                          value={termsData.disputeResolutionPeriod}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              disputeResolutionPeriod: e.target.value,
                            })
                          }
                        >
                          <option value="">Select</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                        <ChevronDown size={16} className="input-icon" />
                      </div>
                    </div>

                    {renderEscrowAmountField({ label: 'Total Amount' })}

                    <div className="form-group form-group-full">
                      <label>Release Conditions</label>
                      <textarea
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

                      <div className="form-group create-escrow-order-dispute">
                        <label>Dispute Resolution Period</label>
                        <div className="select-input-wrapper create-escrow-step2-select-wrap">
                          <select
                            className="create-escrow-step2-select"
                            value={termsData.disputeResolutionPeriod}
                            onChange={(e) =>
                              setTermsData({
                                ...termsData,
                                disputeResolutionPeriod: e.target.value,
                              })
                            }
                          >
                            <option value="">Select</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                            <option value="30">30 days</option>
                          </select>
                          <ChevronDown size={16} className="input-icon" />
                        </div>
                      </div>

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
                  <div className="terms-form-grid">
                    {renderEscrowAmountField({ label: 'Total Amount' })}

                    <div className="form-group">
                      <label>Milestone amount</label>
                      <input
                        type="text"
                        placeholder="Enter amount"
                        value={termsData.milestoneAmount}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            milestoneAmount: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Milestone details</label>
                      <input
                        type="text"
                        placeholder="Enter milestone details"
                        value={termsData.milestoneDetails}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            milestoneDetails: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Dispute Resolution Period</label>
                      <div className="select-input-wrapper">
                        <select
                          value={termsData.disputeResolutionPeriod}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              disputeResolutionPeriod: e.target.value,
                            })
                          }
                        >
                          <option value="">select</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                        <ChevronDown size={16} className="input-icon" />
                      </div>
                    </div>

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
                            // Open picker on mousedown (before default behavior)
                            if (e.target.showPicker) {
                              try {
                                e.target.showPicker();
                                e.preventDefault(); // Prevent default browser behavior
                              } catch (err) {
                                // Silently fail if showPicker is not available
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <button
                        type="button"
                        className="add-milestone-btn"
                        onClick={() => {
                          if (termsData.milestoneDetails && termsData.milestoneAmount) {
                            const newMilestone = {
                              details: termsData.milestoneDetails,
                              amount: termsData.milestoneAmount,
                            };
                            setTermsData({
                              ...termsData,
                              milestones: [...termsData.milestones, newMilestone],
                              milestoneDetails: '',
                              milestoneAmount: '',
                            });
                          }
                        }}
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
                    onClick={() => setSelectedConfirmationPaymentMethod('googlepay')}
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
                    onClick={() => setSelectedConfirmationPaymentMethod('applepay')}
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
                    onClick={() => setSelectedConfirmationPaymentMethod('trustichain')}
                  >
                    <TrustichainPayBadge />
                  </button>
                </div>
                {selectedConfirmationPaymentMethod === 'trustichain' && (
                  <div className="create-escrow-step3-payer-wallet">
                    <span className="create-escrow-step3-payer-wallet-label">
                      Pay from wallet <span className="required">*</span>
                    </span>
                    {payerWalletOptions.length === 0 ? (
                      <p className="create-escrow-step3-payer-wallet-empty">
                        Create your TrustiChain wallet or connect Xaman/MetaMask to pay with
                        TrustiChain.
                      </p>
                    ) : (
                      <div
                        className="create-escrow-step3-payer-wallet-list"
                        role="radiogroup"
                        aria-label="Payer wallet"
                      >
                        {payerWalletOptions.map((wallet) => (
                          <label
                            key={wallet.id}
                            className={`create-escrow-step3-payer-wallet-option${
                              selectedPayerWalletId === wallet.id ? ' is-selected' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="create-escrow-payer-wallet"
                              value={wallet.id}
                              checked={selectedPayerWalletId === wallet.id}
                              onChange={() => setSelectedPayerWalletId(wallet.id)}
                            />
                            <span
                              className={`create-escrow-step3-payer-wallet-icon${
                                wallet.id === 'metamask' ? ' is-metamask' : ''
                              }`}
                            >
                              <img
                                src={PAYER_WALLET_ICONS[wallet.id] || PAYER_WALLET_ICONS.connected}
                                alt=""
                              />
                            </span>
                            <span className="create-escrow-step3-payer-wallet-option-body">
                              <span className="create-escrow-step3-payer-wallet-option-title">
                                {wallet.label}
                              </span>
                              <span className="create-escrow-step3-payer-wallet-option-meta">
                                {wallet.network} · {maskWalletAddressShort(wallet.address)}
                              </span>
                            </span>
                            {selectedPayerWalletId === wallet.id ? (
                              <CheckCircle
                                size={18}
                                className="create-escrow-step3-payer-wallet-check"
                                aria-hidden
                              />
                            ) : null}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {stripePaymentStatus && (
                  <p className="create-escrow-step3-payment-status">
                    Payment status: {stripePaymentStatus?.status || 'initialized'}
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
                      {getCounterpartyTrustitagValue() || '—'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="confirmation-field-group">
                      <span className="confirmation-label">
                        Counterparty XRP Wallet Address <span className="required">*</span>
                      </span>
                      <div className="confirmation-masked-input">
                        {maskCounterpartyWalletForConfirmation(getCounterpartyWalletValue())}
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
                  <div className="create-escrow-step3-amount-fee-grid">
                    <div className="confirmation-detail-item create-escrow-step3-amount-fee-item">
                      <span className="confirmation-detail-label">Escrow Amount</span>
                      <span className="confirmation-detail-value">
                        {formatConfirmationMoneyLine(
                          parseFloat(termsData.totalAmount),
                          termsData.escrowCurrency,
                          exchangeRate,
                        )}
                      </span>
                    </div>
                    <div className="confirmation-detail-item create-escrow-step3-amount-fee-item">
                      <span className="confirmation-detail-label create-escrow-step3-fee-label">
                        Escrow Fee
                      </span>
                      <span className="confirmation-detail-value">
                        {formatConfirmationMoneyLine(
                          parseFloat(termsData.totalAmount) * 0.05,
                          termsData.escrowCurrency,
                          exchangeRate,
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="confirmation-detail-item">
                    <span className="confirmation-detail-label">Total Escrowed Payment</span>
                    <span className="confirmation-detail-value">
                      {formatConfirmationMoneyLine(
                        parseFloat(termsData.totalAmount),
                        termsData.escrowCurrency,
                        exchangeRate,
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
    </div>
  );
};

export default CreateEscrowForm;

