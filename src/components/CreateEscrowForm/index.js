import React, { useState, useEffect } from 'react';
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
import { useWeb3 } from '../../context/Web3Context';
import toast from 'react-hot-toast';
import '../LoadingIndicator/index.css';
import '../../pages/dashboard/my-escrow/MyEscrow.css';
import './index.css';

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

const formatEscrowBalance = (value) =>
  Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  return '*'.repeat(15);
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
  const { account } = useWeb3();
  const [desktopModalLayout, setDesktopModalLayout] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(CREATE_ESCROW_DESKTOP_MODAL_MQ).matches,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEscrowType, setSelectedEscrowType] = useState('Freelancing');
  /** Step 1: identify counterparty by wallet vs Trustitag. */
  const [counterpartyMethod, setCounterpartyMethod] = useState('wallet');

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
  const [escrowCurrencyBalances, setEscrowCurrencyBalances] = useState(() =>
    emptyEscrowCurrencyBalances(),
  );
  const [escrowFundingWalletsLoading, setEscrowFundingWalletsLoading] = useState(false);
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [escrowCreationStep, setEscrowCreationStep] = useState('idle'); // 'idle' | 'creating'

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
      escrowCurrency: 'RLUSD',
    });
    setEscrowCurrencyBalances(emptyEscrowCurrencyBalances());
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

  // Prefer connected / saved wallet as payer so Wallet Address mode matches minimal Step 1 UI.
  useEffect(() => {
    if (!isOpen) return;
    const resolved = resolvePayerWalletFromContext(account);
    if (!resolved) return;
    setFormData((prev) =>
      prev.payerWallet.trim() ? prev : { ...prev, payerWallet: resolved },
    );
  }, [isOpen, account]);

  // Handle create escrow (adapted from MyEscrow, extended with XUMM/Xaman flow)
  const handleCreateEscrow = async () => {
    try {
      setIsCreatingEscrow(true);
      setEscrowCreationStep('creating');

      const payerWalletResolved =
        formData.payerWallet?.trim() || resolvePayerWalletFromContext(account) || '';

      const escrowCurrencyResolved = normalizeEscrowPayloadCurrency(termsData.escrowCurrency);

      const counterpartyWalletTrimmed = formData.counterpartyWallet?.trim() || '';
      const counterpartyTrustitagTrimmed = formData.counterpartyTrustitag?.trim() || '';

      if (!payerWalletResolved) {
        toast.error('Please fill in all required fields');
        setIsCreatingEscrow(false);
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
      toast.error('An error occurred while creating escrow');
    } finally {
      // Reset flags if not in creating state
      if (escrowCreationStep !== 'creating') {
        setIsCreatingEscrow(false);
        setEscrowCreationStep('idle');
      }
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

  const handleContinueFromStep2 = () => {
    if (termsData.releaseType === 'Time based' && !termsData.timeBasedAutoReleaseAck) {
      toast.error(
        'Please confirm that you understand automatic escrow completion on the set date.',
      );
      return;
    }
    if (termsData.releaseType === 'Time based' && escrowFundingWalletsLoading) {
      toast.error('Still loading your balances. Please wait a moment.');
      return;
    }
    setCurrentStep(3);
  };

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
                    Wallet Address
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={counterpartyMethod === 'trustitag'}
                    className={`counterparty-method-btn ${counterpartyMethod === 'trustitag' ? 'active' : ''}`}
                    onClick={() => setCounterpartyMethod('trustitag')}
                  >
                    Trustitag
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
                        Counterparty Trustitag <span className="required">*</span>
                      </label>
                      <input
                        id="create-escrow-counterparty-trustitag"
                        type="text"
                        className="create-escrow-step1-input"
                        placeholder="Enter Trustitag"
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

                    <div className="form-group">
                      <label>Total Amount</label>
                      <input
                        type="text"
                        placeholder="Enter amount"
                        value={termsData.totalAmount}
                        onChange={(e) =>
                          setTermsData({ ...termsData, totalAmount: e.target.value })
                        }
                      />
                    </div>

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

                      <div className="form-group create-escrow-order-amount">
                        <label>Escrow Amount</label>
                        <div className="create-escrow-amount-row">
                          <input
                            type="text"
                            className="create-escrow-amount-row-input"
                            placeholder={desktopModalLayout ? 'Add amount' : 'Enter amount'}
                            value={termsData.totalAmount}
                            onChange={(e) =>
                              setTermsData({ ...termsData, totalAmount: e.target.value })
                            }
                            inputMode="decimal"
                            autoComplete="off"
                          />
                          <div className="create-escrow-amount-row-meta">
                            <div
                              className="create-escrow-balance-dropdown"
                              aria-live="polite"
                            >
                              <div className="create-escrow-balance-dropdown-inner create-escrow-funding-wallet-trigger">
                                <span className="create-escrow-balance-dropdown-currency-badge">
                                  {normalizeEscrowPayloadCurrency(termsData.escrowCurrency)}
                                </span>
                                <div className="create-escrow-balance-dropdown-info">
                                  <span className="create-escrow-balance-dropdown-label">
                                    Balance
                                  </span>
                                  <span className="create-escrow-balance-dropdown-value">
                                    {escrowFundingWalletsLoading
                                      ? '—'
                                      : formatEscrowBalance(
                                          escrowCurrencyBalances[
                                            normalizeEscrowPayloadCurrency(
                                              termsData.escrowCurrency,
                                            )
                                          ] ?? 0,
                                        )}
                                  </span>
                                </div>
                                <ChevronDown
                                  size={18}
                                  className="create-escrow-balance-dropdown-chevron"
                                  aria-hidden
                                />
                                <select
                                  className="create-escrow-funding-wallet-select"
                                  value={normalizeEscrowPayloadCurrency(termsData.escrowCurrency)}
                                  onChange={(e) => {
                                    const cur = normalizeEscrowPayloadCurrency(e.target.value);
                                    setTermsData({
                                      ...termsData,
                                      escrowCurrency: cur,
                                    });
                                  }}
                                  aria-label="Escrow funding currency"
                                  disabled={escrowFundingWalletsLoading}
                                >
                                  {ESCROW_FUNDING_CURRENCIES.map((cur) => (
                                    <option key={cur} value={cur}>
                                      {cur} · Bal {formatEscrowBalance(escrowCurrencyBalances[cur] ?? 0)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

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
                    <div className="form-group">
                      <label>Total Amount</label>
                      <input
                        type="text"
                        placeholder="Enter amount"
                        value={termsData.totalAmount}
                        onChange={(e) =>
                          setTermsData({ ...termsData, totalAmount: e.target.value })
                        }
                      />
                    </div>

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
                <h3 className="create-escrow-step3-heading">Escrow Counterparty</h3>
                {counterpartyMethod === 'trustitag' ? (
                  <div className="confirmation-field-group">
                    <span className="confirmation-label">
                      Counterparty Trustitag <span className="required">*</span>
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
            {!desktopModalLayout && (
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
            )}
            <button
              type="button"
              className="submit-next-btn"
              onClick={handleCreateEscrow}
              disabled={isCreatingEscrow}
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

