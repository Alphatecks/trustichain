import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronDown, Upload, CheckCircle, FileText, DollarSign, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import '../LoadingIndicator/index.css';
import './index.css';

const STEPS = [
  { key: 1, label: 'Contract Info' },
  { key: 2, label: 'Payment Terms' },
  { key: 3, label: 'Escrow Summary' },
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

  // Step 1 — Contract Info
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
  const lookupTimeoutRef = useRef(null);
  const [supplierSuggestions, setSupplierSuggestions] = useState([]);
  const [isLoadingSupplierSuggestions, setIsLoadingSupplierSuggestions] = useState(false);
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const supplierAutocompleteTimeoutRef = useRef(null);
  const supplierNameFieldRef = useRef(null);

  // Fetch business email when supplier name is entered (debounced)
  useEffect(() => {
    const name = supplierName.trim();
    if (!name || name.length < 2) {
      setLookupEmailError('');
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
          if (result?.success && result?.data) {
            const businessEmail = result.data.businessEmail;
            const businessXrpAddress = result.data.businessXrpAddress;

            if (businessEmail) setSupplierEmail(businessEmail);
            if (businessXrpAddress) setSupplierWalletAddress(businessXrpAddress);
            setLookupEmailError('');
          } else {
            setLookupEmailError(result?.message || 'No business email found for this supplier.');
          }
        })
        .catch(() => {
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
  }, [supplierName]);

  // Fetch supplier name suggestions (debounced) as user types initials/name
  useEffect(() => {
    const query = supplierName.trim();
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
  }, [supplierName]);

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
    setSupplierSuggestions([]);
    setIsLoadingSupplierSuggestions(false);
    setShowSupplierSuggestions(false);
  };

  const handleClose = () => {
    resetForm();
    onCancel();
  };

  const canProceedStep1 = supplierName.trim() && supplierWalletAddress.trim() && contractTitle.trim();
  const canProceedStep2 = amountNum > 0 && currency;

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
        supplierName: supplierName.trim(),
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
          {step === 1 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile"><FileText size={20} /></div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 1/3</span>
                <span className="step-title-mobile">Contract Info</span>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile"><DollarSign size={20} /></div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 2/3</span>
                <span className="step-title-mobile">Payment Terms</span>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile"><CheckCircle size={20} /></div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 3/3</span>
                <span className="step-title-mobile">Escrow Summary</span>
              </div>
            </div>
          )}
        </div>

        {/* Step indicator - desktop */}
        <div className="create-escrow-steps">
          <div className={`step-indicator ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-icon">{step > 1 ? <CheckCircle size={20} /> : <FileText size={20} />}</div>
            <div className="step-content">
              <span className="step-number">Step 1/3</span>
              <span className="step-title">Contract Info</span>
            </div>
          </div>
          <div className="step-divider" />
          <div className={`step-indicator ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="step-icon">{step > 2 ? <CheckCircle size={20} /> : <DollarSign size={20} />}</div>
            <div className="step-content">
              <span className="step-number">Step 2/3</span>
              <span className="step-title">Payment Terms</span>
            </div>
          </div>
          <div className="step-divider" />
          <div className={`step-indicator ${step === 3 ? 'active' : ''}`}>
            <div className="step-icon"><CheckCircle size={20} /></div>
            <div className="step-content">
              <span className="step-number">Step 3/3</span>
              <span className="step-title">Escrow Summary</span>
            </div>
          </div>
        </div>

        <div className="create-escrow-modal-content">
          {step === 1 && (
            <>
              <form id="create-supplier-step1-form" onSubmit={handleNextFromStep1}>
                <div className="escrow-form-section">
                  <h3 className="section-title">Supplier Contract Detail</h3>
                  <div className="counterparty-form-grid">
                    <div className="form-column">
                      <div className="form-group">
                        <label>
                          Supplier name <span className="add-supplier-label-hint">(Must be a Registered business on Trustichain)</span>
                        </label>
                        <div className="add-supplier-dropdown-wrapper" ref={supplierNameFieldRef}>
                          <input
                            type="text"
                            value={supplierName}
                            onChange={(e) => {
                              setSupplierName(e.target.value);
                              setShowSupplierSuggestions(true);
                            }}
                            onFocus={() => {
                              if (supplierName.trim().length >= 1) setShowSupplierSuggestions(true);
                            }}
                            placeholder="e.g. Nova Electronics Ltd"
                          />
                          {showSupplierSuggestions && supplierName.trim().length >= 1 && (
                            <div className="add-supplier-dropdown">
                              {isLoadingSupplierSuggestions ? (
                                <div className="add-supplier-autocomplete-meta">Loading supplier suggestions...</div>
                              ) : supplierSuggestions.length === 0 ? (
                                <div className="add-supplier-autocomplete-meta">No matching businesses found</div>
                              ) : (
                                supplierSuggestions.map((item) => (
                                  <button
                                    key={item.businessId || item.businessName}
                                    type="button"
                                    className="add-supplier-dropdown-item"
                                    onClick={() => {
                                      setSupplierName(item.businessName || '');
                                      setShowSupplierSuggestions(false);
                                    }}
                                  >
                                    {item.businessName}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Supplier wallet address</label>
                        <input
                          type="text"
                          value={supplierWalletAddress}
                          onChange={(e) => setSupplierWalletAddress(e.target.value)}
                          placeholder="XRPL wallet address"
                        />
                      </div>
                      <div className="form-group">
                        <label>Contract title</label>
                        <input
                          type="text"
                          value={contractTitle}
                          onChange={(e) => setContractTitle(e.target.value)}
                          placeholder="e.g. Smartphone Parts Shipment"
                        />
                      </div>
                      <div className="form-group">
                        <label>Delivery method</label>
                        <div className="radio-group">
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
                    </div>
                    <div className="form-column">
                      <div className="form-group">
                        <label>Supplier email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                        <input
                          type="email"
                          value={supplierEmail}
                          onChange={(e) => setSupplierEmail(e.target.value)}
                          placeholder="supplier@email.com"
                        />
                        {isLookingUpEmail && (
                          <span className="add-supplier-email-lookup-hint">Looking up business email…</span>
                        )}
                        {lookupEmailError && !isLookingUpEmail && (
                          <span className="add-supplier-email-lookup-error">{lookupEmailError}</span>
                        )}
                      </div>
                      <div className="form-group date-input-wrapper">
                        <label>Delivery deadline</label>
                        <input
                          type="date"
                          value={deliveryDeadline}
                          onChange={(e) => setDeliveryDeadline(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Contract description</label>
                        <textarea
                          value={contractDescription}
                          onChange={(e) => setContractDescription(e.target.value)}
                          placeholder="Supply of 2,000 smartphone camera modules."
                          rows={3}
                        />
                      </div>
                      <div className="form-group">
                        <label>Dispute window</label>
                        <div className="add-supplier-dropdown-wrapper">
                          <button
                            type="button"
                            className="add-supplier-dropdown-btn"
                            onClick={() => { setShowDisputeDropdown(!showDisputeDropdown); setShowCurrencyDropdown(false); setShowReleaseDropdown(false); }}
                          >
                            <span>{disputeWindow} days</span>
                            <ChevronDown size={16} />
                          </button>
                          {showDisputeDropdown && (
                            <div className="add-supplier-dropdown">
                              {DISPUTE_WINDOW_DAYS.map((d) => (
                                <button key={d} type="button" className="add-supplier-dropdown-item" onClick={() => { setDisputeWindow(d); setShowDisputeDropdown(false); }}>
                                  {d} days
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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
                <div className="escrow-form-section">
                  <h3 className="section-title">Escrow Payment Details</h3>
                  <div className="counterparty-form-grid">
                    <div className="form-column">
                      <div className="form-group">
                        <label>Payment amount</label>
                        <input
                          type="text"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="form-group">
                        <label>Currency</label>
                        <div className="add-supplier-dropdown-wrapper">
                          <button
                            type="button"
                            className="add-supplier-dropdown-btn"
                            onClick={() => { setShowCurrencyDropdown(!showCurrencyDropdown); setShowReleaseDropdown(false); setShowDisputeDropdown(false); }}
                          >
                            <span>{currency}</span>
                            <ChevronDown size={16} />
                          </button>
                          {showCurrencyDropdown && (
                            <div className="add-supplier-dropdown">
                              {CURRENCY_OPTIONS.map((c) => (
                                <button key={c} type="button" className="add-supplier-dropdown-item" onClick={() => { setCurrency(c); setShowCurrencyDropdown(false); }}>
                                  {c}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Escrow type</label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input type="radio" name="escrowType" checked={escrowType === 'full'} onChange={() => setEscrowType('full')} />
                            <span>Full Payment</span>
                          </label>
                          <label className="radio-option">
                            <input type="radio" name="escrowType" checked={escrowType === 'milestone'} onChange={() => setEscrowType('milestone')} />
                            <span>Milestone Payment</span>
                          </label>
                        </div>
                      </div>
                      {escrowType === 'milestone' && (
                        <div className="add-supplier-milestones">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="form-group">
                              <label>Milestone {i + 1}</label>
                              <input
                                type="text"
                                value={milestones[i] || ''}
                                onChange={(e) => {
                                  const next = [...milestones];
                                  next[i] = e.target.value;
                                  setMilestones(next);
                                }}
                                placeholder="Amount or description"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-column">
                      <div className="form-group">
                        <label>Release condition</label>
                        <div className="add-supplier-dropdown-wrapper">
                          <button
                            type="button"
                            className="add-supplier-dropdown-btn"
                            onClick={() => { setShowReleaseDropdown(!showReleaseDropdown); setShowCurrencyDropdown(false); setShowDisputeDropdown(false); }}
                          >
                            <span>{releaseCondition}</span>
                            <ChevronDown size={16} />
                          </button>
                          {showReleaseDropdown && (
                            <div className="add-supplier-dropdown">
                              {RELEASE_CONDITIONS.map((r) => (
                                <button key={r} type="button" className="add-supplier-dropdown-item" onClick={() => { setReleaseCondition(r); setShowReleaseDropdown(false); }}>
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Platform fee preview</label>
                        <p className="add-supplier-fee-preview">{PLATFORM_FEE_PERCENT}% fee = ${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="form-group">
                        <label>Upload contract documents</label>
                        <div className="add-supplier-upload-zone">
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
                </div>
              </form>
              <div className="create-escrow-modal-footer">
                <button type="button" className="previous-btn" onClick={handleBack}>
                  <ArrowLeft size={16} />
                  <span>Previous</span>
                </button>
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
                <div className="escrow-form-section">
                  <h3 className="section-title">Review Contract</h3>
                  <div className="payment-summary-grid">
                    <div className="payment-summary-block">
                      <h4 className="payment-summary-block-title">Contract & Payment</h4>
                      <div className="payment-summary-rows">
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Supplier</span>
                          <span className="payment-summary-value">{supplierName || '—'}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Contract</span>
                          <span className="payment-summary-value">{contractTitle || '—'}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Amount</span>
                          <span className="payment-summary-value">${amountNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Currency</span>
                          <span className="payment-summary-value">{currency}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Delivery Deadline</span>
                          <span className="payment-summary-value">{deliveryDeadline || '—'}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Release Condition</span>
                          <span className="payment-summary-value">{releaseCondition}</span>
                        </div>
                      </div>
                    </div>
                    <div className="payment-summary-block">
                      <h4 className="payment-summary-block-title">Fees & Total</h4>
                      <div className="payment-summary-rows">
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Platform Fee</span>
                          <span className="payment-summary-value">${platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Network Fee</span>
                          <span className="payment-summary-value">${NETWORK_FEE_USD.toFixed(2)}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span className="payment-summary-label">Total Escrow Deposit</span>
                          <span className="payment-summary-value">${totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="add-supplier-trust-text">Funds will be locked on XRP Ledger escrow. Supplier will only receive funds after conditions are met.</p>
                </div>
                {submitError && <div className="add-supplier-error" role="alert">{submitError}</div>}
              </form>
              <div className="create-escrow-modal-footer">
                <button type="button" className="previous-btn" onClick={handleBack} disabled={isSubmitting}>
                  <ArrowLeft size={16} />
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
                  <span>{isSubmitting ? 'Creating…' : 'Create Escrow Contract'}</span>
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
