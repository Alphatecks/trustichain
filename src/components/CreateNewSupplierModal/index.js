import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Upload, CheckCircle, FileText, ArrowLeft, ArrowRight, Contact2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import '../LoadingIndicator/index.css';
import './index.css';

const STEPS = [
  { key: 1, number: 'Step 1/3', title: 'Type/ Counterparty', icon: Contact2 },
  { key: 2, number: 'Step 2/3', title: 'Terms', icon: FileText },
  { key: 3, number: 'Step 3/3', title: 'Supply Summary', icon: CheckCircle },
];

const DELIVERY_METHODS = [
  { value: 'physical', label: 'Physical Goods' },
  { value: 'digital', label: 'Digital Delivery' },
  { value: 'service', label: 'Service' },
];

const CURRENCY_OPTIONS = ['XRP', 'USDT', 'USDC'];

const RELEASE_CONDITIONS = [
  'Buyer confirms delivery',
  'Automatic release after deadline',
  'Multi-signature approval',
];

const DISPUTE_WINDOW_DAYS = [3, 5, 7];

const ReviewSummaryField = ({ label, value }) => (
  <div className="form-group add-supplier-review-field">
    <span className="add-supplier-review-label">{label}</span>
    <div className="add-supplier-review-value">{value || '—'}</div>
  </div>
);

const PLATFORM_FEE_PERCENT = 0.5;
const NETWORK_FEE_USD = 1;

/** XRPL Ripple Epoch: seconds between Unix epoch (1970-01-01 UTC) and Ripple epoch (2000-01-01 UTC). */
const RIPPLE_EPOCH_OFFSET_SECONDS = 946684800;

/**
 * Convert a date string (YYYY-MM-DD) to XRPL Ripple Epoch Time: seconds since 2000-01-01 00:00:00 UTC.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {number|undefined} Ripple Epoch seconds, or undefined if invalid
 */
function toRippleEpochSeconds(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return undefined;
  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed + 'T00:00:00.000Z');
  if (Number.isNaN(d.getTime())) return undefined;
  const unixSeconds = Math.floor(d.getTime() / 1000);
  return unixSeconds - RIPPLE_EPOCH_OFFSET_SECONDS;
}

const CreateNewSupplierModal = ({ isOpen, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [statusAfterCreate, setStatusAfterCreate] = useState(null); // 'fund_escrow' | 'created'

  // Step 1 — Counterparty
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierWalletAddress, setSupplierWalletAddress] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('physical');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [contractDescription, setContractDescription] = useState('');
  const [disputeWindow, setDisputeWindow] = useState(7);

  // Step 2 — Payment Terms
  const [paymentAmount, setPaymentAmount] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [escrowType, setEscrowType] = useState('full'); // 'full' | 'milestone'
  const [milestones, setMilestones] = useState(['', '', '']);
  const [releaseCondition, setReleaseCondition] = useState(RELEASE_CONDITIONS[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showReleaseDropdown, setShowReleaseDropdown] = useState(false);
  const [showDisputeDropdown, setShowDisputeDropdown] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({ invoice: null, agreement: null, deliveryTerms: null });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLookingUpEmail, setIsLookingUpEmail] = useState(false);
  const [lookupEmailError, setLookupEmailError] = useState('');
  const [lookupMatchedBusinessName, setLookupMatchedBusinessName] = useState('');
  const lookupTimeoutRef = useRef(null);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [isLoadingSupplierSuggestions, setIsLoadingSupplierSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const supplierAutocompleteTimeoutRef = useRef(null);
  const supplierNameFieldRef = useRef(null);

  // Fetch business email when supplier name is entered (debounced)
  useEffect(() => {
    const name = (supplierId || supplierName).trim();
    if (!name || name.length < 2) {
      setLookupEmailError('');
      setLookupMatchedBusinessName('');
      return;
    }
    if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    lookupTimeoutRef.current = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLookupEmailError('');
      setIsLookingUpEmail(true);
      const url = getApiUrl(`api/lookup/business-email?businessName=${encodeURIComponent(name)}`);
      fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then((res) => res.json().catch(() => ({})))
        .then((result) => {
          console.log('[CreateSupplierEscrow] business-email lookup response:', result);
          if (result?.success && result?.data) {
            const businessEmail = result.data.businessEmail;
            const businessXrpAddress = result.data.businessXrpAddress;
            const matchedName = result.data.matchedBusinessName;

            if (businessEmail) setSupplierEmail(businessEmail);
            if (businessXrpAddress) setSupplierWalletAddress(businessXrpAddress);
            setLookupMatchedBusinessName(matchedName || '');
            setLookupEmailError('');
          } else {
            setLookupMatchedBusinessName('');
            setLookupEmailError(result?.message || 'No business email found for this supplier.');
          }
        })
        .catch(() => {
          setLookupMatchedBusinessName('');
          setLookupEmailError('Could not look up business email. Please enter it manually.');
        })
        .finally(() => {
          setIsLookingUpEmail(false);
          lookupTimeoutRef.current = null;
        });
    }, 400);
    return () => {
      if (lookupTimeoutRef.current) clearTimeout(lookupTimeoutRef.current);
    };
  }, [supplierId, supplierName]);

  // Fetch supplier name suggestions (debounced) as user types initials/name
  useEffect(() => {
    const query = supplierId.trim();
    if (query.length < 1) {
      setSupplierSuggestions([]);
      setIsLoadingSupplierSuggestions(false);
      return;
    }

    if (supplierAutocompleteTimeoutRef.current) clearTimeout(supplierAutocompleteTimeoutRef.current);

    supplierAutocompleteTimeoutRef.current = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsLoadingSupplierSuggestions(true);
      const url = getApiUrl(`api/business-suite/suppliers/autocomplete?q=${encodeURIComponent(query)}&limit=10`);

      fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then((res) => res.json().catch(() => ({})))
        .then((result) => {
          console.log('[CreateSupplierEscrow] business name autocomplete response:', result);
          const items = Array.isArray(result?.data?.items) ? result.data.items : [];
          setSupplierSuggestions(items);
          setShowSupplierSuggestions(true);
        })
        .catch(() => {
          setSupplierSuggestions([]);
        })
        .finally(() => {
          setIsLoadingSupplierSuggestions(false);
          supplierAutocompleteTimeoutRef.current = null;
        });
    }, 300);

    return () => {
      if (supplierAutocompleteTimeoutRef.current) clearTimeout(supplierAutocompleteTimeoutRef.current);
    };
  }, [supplierId]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!supplierNameFieldRef.current) return;
      if (!supplierNameFieldRef.current.contains(event.target)) {
        setShowSupplierSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const amountNum = useMemo(() => (paymentAmount ? parseFloat(String(paymentAmount).replace(/,/g, '')) : 0) || 0, [paymentAmount]);
  const platformFee = useMemo(() => (amountNum * PLATFORM_FEE_PERCENT) / 100, [amountNum]);
  const totalDeposit = useMemo(() => amountNum + platformFee + NETWORK_FEE_USD, [amountNum, platformFee]);

  const resetForm = () => {
    setStep(1);
    setShowSuccess(false);
    setStatusAfterCreate(null);
    setSupplierId('');
    setSupplierName('');
    setSupplierWalletAddress('');
    setContractTitle('');
    setDeliveryMethod('physical');
    setSupplierEmail('');
    setDeliveryDeadline('');
    setContractDescription('');
    setDisputeWindow(7);
    setPaymentAmount('');
    setCurrency('USDT');
    setEscrowType('full');
    setMilestones(['', '', '']);
    setReleaseCondition(RELEASE_CONDITIONS[0]);
    setUploadedFiles({ invoice: null, agreement: null, deliveryTerms: null });
    setSubmitError('');
    setLookupEmailError('');
    setLookupMatchedBusinessName('');
    setSupplierSuggestions([]);
    setIsLoadingSupplierSuggestions(false);
    setShowSupplierSuggestions(false);
  };

  const handleClose = () => {
    resetForm();
    onCancel();
  };

  const canProceedStep1 = supplierId.trim() && supplierWalletAddress.trim();
  const canProceedStep2 = contractTitle.trim() && amountNum > 0 && currency;

  const handleNextFromStep1 = (e) => {
    e.preventDefault();
    if (!canProceedStep1) return;
    setSubmitError('');
    setStep(2);
  };

  const handleNextFromStep2 = (e) => {
    e.preventDefault();
    if (!canProceedStep2) return;
    setSubmitError('');
    setStep(3);
  };

  const handleBack = () => {
    setSubmitError('');
    setStep((s) => s - 1);
  };

  const handleFileUpload = (key, file) => {
    if (!file) return;
    setUploadedFiles((prev) => ({ ...prev, [key]: file }));
  };

  const handleCreateEscrow = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to create a contract.');
      setIsSubmitting(false);
      return;
    }
    try {
      // XRPL uses Ripple Epoch Time: seconds since 2000-01-01 00:00:00 UTC
      const deliveryDeadlineRippleEpoch = deliveryDeadline ? toRippleEpochSeconds(deliveryDeadline) : undefined;

      const deliveryMethodLabel = DELIVERY_METHODS.find((x) => x.value === deliveryMethod)?.label ?? deliveryMethod;
      const escrowTypeLabel = escrowType === 'milestone' ? 'Milestone Payment' : 'Full Payment';

      const body = {
        supplierName: supplierName.trim() || supplierId.trim(),
        supplierWalletAddress: supplierWalletAddress.trim(),
        supplierEmail: supplierEmail.trim() || undefined,
        contractTitle: contractTitle.trim(),
        deliveryDeadline: deliveryDeadlineRippleEpoch,
        contractDescription: contractDescription.trim() || undefined,
        deliveryMethod: deliveryMethodLabel,
        disputeWindow: `${disputeWindow} days`,
        paymentAmount: amountNum,
        currency,
        escrowType: escrowTypeLabel,
        releaseCondition,
        contractDocumentUrls: [], // TODO: add file upload to storage and pass URLs
      };

      const response = await fetch(getApiUrl('api/business-suite/supply-contracts'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success) {
        setStatusAfterCreate('fund_escrow');
      } else {
        setSubmitError(result?.message || 'Failed to create contract.');
        toast.error(result?.message || 'Failed to create contract.');
      }
    } catch (err) {
      setSubmitError(err?.message || 'Something went wrong.');
      toast.error(err?.message || 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFundEscrowDone = () => {
    setStatusAfterCreate(null);
    setShowSuccess(true);
  };

  const handleSuccessDone = () => {
    resetForm();
    onSuccess({ supplierName, contractTitle, amount: amountNum, currency });
  };

  if (!isOpen) return null;

  // Success: Escrow Contract Created / Awaiting Supplier Acceptance
  if (showSuccess) {
    return (
      <div className="create-escrow-modal-overlay add-supplier-modal-overlay" onClick={handleSuccessDone}>
        <div className="create-escrow-modal create-new-supplier-modal add-supplier-success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="add-supplier-success-content">
            <div className="add-supplier-success-icon">
              <CheckCircle size={48} style={{ color: 'var(--green-600, #059669)' }} />
            </div>
            <h3 className="add-supplier-success-title">Escrow Contract Created</h3>
            <p className="add-supplier-success-message">Awaiting Supplier Acceptance</p>
            <button type="button" className="create-supplier-submit-btn" onClick={handleSuccessDone}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // After Create: Fund Escrow screen
  if (statusAfterCreate === 'fund_escrow') {
    return (
      <div className="create-escrow-modal-overlay add-supplier-modal-overlay" onClick={() => {}}>
        <div className="create-escrow-modal create-new-supplier-modal add-supplier-fund-escrow" onClick={(e) => e.stopPropagation()}>
          <div className="create-escrow-modal-header">
            <h2>Fund Escrow</h2>
            <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="Close">
              <X size={24} />
            </button>
          </div>
          <div className="add-supplier-fund-escrow-content">
            <p className="add-supplier-fund-escrow-hint">Complete payment to lock funds in escrow.</p>
            <div className="add-supplier-fund-escrow-summary">
              <div className="add-supplier-fund-escrow-row">
                <span>Total to deposit</span>
                <strong>
                  ${totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                </strong>
              </div>
            </div>
            <button type="button" className="create-supplier-submit-btn" onClick={handleFundEscrowDone}>
              I've sent the funds
            </button>
            <button type="button" className="create-supplier-cancel-btn" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-escrow-modal-overlay add-supplier-modal-overlay" onClick={handleClose}>
      <div className="create-escrow-modal add-supplier-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon" />
          <h2>Create Supplier Contract</h2>
          <button type="button" className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Step indicator - mobile */}
        <div className="create-escrow-steps-mobile">
          {STEPS.filter((item) => item.key === step).map((item) => {
            const StepIcon = item.icon;
            return (
              <div key={item.key} className="step-indicator-mobile active">
                <div className="step-icon-mobile">
                  <StepIcon size={20} />
                </div>
                <div className="step-content-mobile">
                  <span className="step-number-mobile">{item.number}</span>
                  <span className="step-title-mobile">{item.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step indicator - desktop */}
        <div className="create-escrow-steps">
          {STEPS.map((item, index) => {
            const StepIcon = item.icon;
            const isActive = step === item.key;
            const isCompleted = step > item.key;
            return (
              <React.Fragment key={item.key}>
                {index > 0 && <div className="step-divider" aria-hidden />}
                <div className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                  <div className="step-icon">
                    {isCompleted ? <CheckCircle size={20} /> : <StepIcon size={20} />}
                  </div>
                  <div className="step-content">
                    {isActive && <span className="step-number">{item.number}</span>}
                    <span className="step-title">{item.title}</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="create-escrow-modal-content">
          {step === 1 && (
            <>
              <form id="create-supplier-step1-form" onSubmit={handleNextFromStep1}>
                <div className="escrow-form-section add-supplier-step1-section">
                  <h3 className="section-title">Supplier Contract Details</h3>
                  <div className="add-supplier-step1-grid">
                    <div className="form-group">
                      <label htmlFor="create-supplier-id">Supplier ID</label>
                      <div className="add-supplier-dropdown-wrapper" ref={supplierNameFieldRef}>
                        <input
                          id="create-supplier-id"
                          type="text"
                          className="add-supplier-soft-input"
                          value={supplierId}
                          onChange={(e) => {
                            setSupplierId(e.target.value);
                            setSupplierName(e.target.value);
                            setShowSupplierSuggestions(true);
                          }}
                          onFocus={() => {
                            if (supplierId.trim().length >= 1) setShowSupplierSuggestions(true);
                          }}
                          placeholder="•••••••••••••••"
                          autoComplete="off"
                        />
                        {showSupplierSuggestions && supplierId.trim().length >= 1 && (
                          <div className="add-supplier-dropdown">
                            {isLoadingSupplierSuggestions ? (
                              <div className="add-supplier-autocomplete-meta">Loading supplier suggestions...</div>
                            ) : supplierSuggestions.length === 0 ? (
                              lookupMatchedBusinessName ? (
                                <button
                                  type="button"
                                  className="add-supplier-dropdown-item"
                                  onClick={() => {
                                    setSupplierId(lookupMatchedBusinessName);
                                    setSupplierName(lookupMatchedBusinessName);
                                    setShowSupplierSuggestions(false);
                                  }}
                                >
                                  {lookupMatchedBusinessName}
                                </button>
                              ) : (
                                <div className="add-supplier-autocomplete-meta">No matching businesses found</div>
                              )
                            ) : (
                              supplierSuggestions.map((item) => (
                                <button
                                  key={item.businessId || item.companyName || item.businessName}
                                  type="button"
                                  className="add-supplier-dropdown-item"
                                  onClick={() => {
                                    const selectedName = item.companyName || item.businessName || '';
                                    setSupplierId(item.businessId || selectedName);
                                    setSupplierName(selectedName);
                                    setShowSupplierSuggestions(false);
                                  }}
                                >
                                  {item.companyName || item.businessName || 'Unnamed business'}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-supplier-email">
                        Supplier email <span className="add-supplier-optional-label">(optional)</span>
                      </label>
                      <input
                        id="create-supplier-email"
                        type="email"
                        className="add-supplier-soft-input"
                        value={supplierEmail}
                        onChange={(e) => setSupplierEmail(e.target.value)}
                        placeholder="Enter supplier email"
                      />
                      {isLookingUpEmail && (
                        <span className="add-supplier-email-lookup-hint">Looking up business email…</span>
                      )}
                      {lookupEmailError && !isLookingUpEmail && (
                        <span className="add-supplier-email-lookup-error">{lookupEmailError}</span>
                      )}
                    </div>
                    <div className="form-group add-supplier-step1-full">
                      <label htmlFor="create-supplier-wallet">Supplier wallet address</label>
                      <input
                        id="create-supplier-wallet"
                        type="text"
                        className="add-supplier-soft-input"
                        value={supplierWalletAddress}
                        onChange={(e) => setSupplierWalletAddress(e.target.value)}
                        placeholder="Enter supplier wallet address"
                      />
                    </div>
                  </div>
                </div>
              </form>
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={(e) => { e.preventDefault(); document.getElementById('create-supplier-step1-form')?.requestSubmit(); }}
                  disabled={!canProceedStep1}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <form id="create-supplier-step2-form" onSubmit={handleNextFromStep2}>
                <div className="escrow-form-section add-supplier-step2-section">
                  <h3 className="section-title">Escrow Payment Details</h3>
                  <div className="add-supplier-step2-grid">
                    <div className="form-group">
                      <label htmlFor="create-supplier-contract-title">Contract title</label>
                      <input
                        id="create-supplier-contract-title"
                        type="text"
                        className="add-supplier-soft-input"
                        value={contractTitle}
                        onChange={(e) => setContractTitle(e.target.value)}
                        placeholder="Enter contract title"
                      />
                    </div>
                    <div className="form-group">
                      <label>Dispute window</label>
                      <div className="add-supplier-dropdown-wrapper">
                        <button
                          type="button"
                          className="add-supplier-dropdown-btn add-supplier-soft-input add-supplier-dropdown-btn--soft"
                          onClick={() => {
                            setShowDisputeDropdown(!showDisputeDropdown);
                            setShowCurrencyDropdown(false);
                            setShowReleaseDropdown(false);
                          }}
                        >
                          <span>{disputeWindow} days</span>
                          <ChevronDown size={16} />
                        </button>
                        {showDisputeDropdown && (
                          <div className="add-supplier-dropdown">
                            {DISPUTE_WINDOW_DAYS.map((d) => (
                              <button
                                key={d}
                                type="button"
                                className="add-supplier-dropdown-item"
                                onClick={() => {
                                  setDisputeWindow(d);
                                  setShowDisputeDropdown(false);
                                }}
                              >
                                {d} days
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="create-supplier-payment-amount">Payment Amount</label>
                      <input
                        id="create-supplier-payment-amount"
                        type="text"
                        className="add-supplier-soft-input"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                        placeholder="••••••••••••"
                        inputMode="decimal"
                      />
                    </div>
                    <div className="form-group date-input-wrapper">
                      <label htmlFor="create-supplier-delivery-deadline">Delivery Deadline</label>
                      <input
                        id="create-supplier-delivery-deadline"
                        type="date"
                        className="add-supplier-soft-input"
                        value={deliveryDeadline}
                        onChange={(e) => setDeliveryDeadline(e.target.value)}
                      />
                    </div>
                    <div className="form-group add-supplier-step2-span-full">
                      <label htmlFor="create-supplier-description">Contract description</label>
                      <textarea
                        id="create-supplier-description"
                        className="add-supplier-soft-input add-supplier-step2-textarea"
                        value={contractDescription}
                        onChange={(e) => setContractDescription(e.target.value)}
                        placeholder="Enter contract description"
                        rows={4}
                      />
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <div className="add-supplier-dropdown-wrapper">
                        <button
                          type="button"
                          className="add-supplier-dropdown-btn add-supplier-soft-input add-supplier-dropdown-btn--soft"
                          onClick={() => {
                            setShowCurrencyDropdown(!showCurrencyDropdown);
                            setShowReleaseDropdown(false);
                            setShowDisputeDropdown(false);
                          }}
                        >
                          <span>{currency}</span>
                          <ChevronDown size={16} />
                        </button>
                        {showCurrencyDropdown && (
                          <div className="add-supplier-dropdown">
                            {CURRENCY_OPTIONS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className="add-supplier-dropdown-item"
                                onClick={() => {
                                  setCurrency(c);
                                  setShowCurrencyDropdown(false);
                                }}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Platform Fee review</label>
                      <div className="add-supplier-step2-fee-box">
                        <p className="add-supplier-step2-fee-value">
                          {PLATFORM_FEE_PERCENT}% fee = ${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="form-group add-supplier-step2-delivery">
                      <label>Delivery Method</label>
                      <div className="radio-group add-supplier-step2-radio-group">
                        {DELIVERY_METHODS.map((opt) => (
                          <label key={opt.value} className="radio-option">
                            <input
                              type="radio"
                              name="deliveryMethod"
                              checked={deliveryMethod === opt.value}
                              onChange={() => setDeliveryMethod(opt.value)}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group add-supplier-step2-upload-field">
                      <label>
                        Dispute Evidence <span className="add-supplier-optional-label">(optional)</span>
                      </label>
                      <div className="add-supplier-upload-zone add-supplier-step2-upload">
                        <Upload size={20} />
                        <span>Drag and drop or click to upload</span>
                        <span className="add-supplier-upload-hint">Invoice · Agreement · Delivery Terms</span>
                        <input
                          type="file"
                          multiple
                          className="add-supplier-file-input"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files?.[0]) handleFileUpload('invoice', files[0]);
                            if (files?.[1]) handleFileUpload('agreement', files[1]);
                            if (files?.[2]) handleFileUpload('deliveryTerms', files[2]);
                            e.target.value = '';
                          }}
                        />
                      </div>
                      {(uploadedFiles.invoice || uploadedFiles.agreement || uploadedFiles.deliveryTerms) && (
                        <div className="add-supplier-uploaded-names">
                          {uploadedFiles.invoice?.name && <span>Invoice: {uploadedFiles.invoice.name}</span>}
                          {uploadedFiles.agreement?.name && <span>Agreement: {uploadedFiles.agreement.name}</span>}
                          {uploadedFiles.deliveryTerms?.name && <span>Delivery: {uploadedFiles.deliveryTerms.name}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
              <div className="create-escrow-modal-footer create-escrow-modal-footer--step-forward">
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={(e) => { e.preventDefault(); document.getElementById('create-supplier-step2-form')?.requestSubmit(); }}
                  disabled={!canProceedStep2}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <form id="create-supplier-step3-form" onSubmit={handleCreateEscrow}>
                <div className="escrow-form-section add-supplier-step3-section">
                  <div className="add-supplier-step3-grid">
                    <div className="add-supplier-step3-column">
                      <h3 className="section-title">Review Contract</h3>
                      <ReviewSummaryField label="Supplier ID" value={supplierId || supplierName} />
                      <ReviewSummaryField label="Contract" value={contractTitle} />
                      <ReviewSummaryField
                        label="Amount"
                        value={`$${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                      <ReviewSummaryField label="Currency" value={currency} />
                      <ReviewSummaryField label="Delivery Deadline" value={deliveryDeadline} />
                      <ReviewSummaryField label="Release Condition" value={releaseCondition} />
                    </div>
                    <div className="add-supplier-step3-column">
                      <h3 className="section-title">Review Contract</h3>
                      <ReviewSummaryField label="Supplier" value={supplierName || supplierId} />
                      <ReviewSummaryField label="Contract" value={contractTitle} />
                      <ReviewSummaryField
                        label="Amount"
                        value={`$${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                      <ReviewSummaryField label="Currency" value={currency} />
                      <ReviewSummaryField label="Delivery Deadline" value={deliveryDeadline} />
                      <ReviewSummaryField label="Release Condition" value={releaseCondition} />
                    </div>
                  </div>
                  <p className="add-supplier-trust-text add-supplier-step3-trust-text">
                    Funds will be locked on XRP Ledger escrow. Supplier will only receive funds after conditions are met.
                  </p>
                </div>
                {submitError && <div className="add-supplier-error" role="alert">{submitError}</div>}
              </form>
              <div className="create-escrow-modal-footer add-supplier-step3-footer">
                <button type="button" className="add-supplier-step3-previous-btn" onClick={handleBack} disabled={isSubmitting}>
                  <div className="submit-btn-icon-circle submit-btn-icon-circle--inverse">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={(e) => { e.preventDefault(); document.getElementById('create-supplier-step3-form')?.requestSubmit(); }}
                  disabled={isSubmitting}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>{isSubmitting ? 'Submitting…' : 'Submit'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateNewSupplierModal;
