import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Tag, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import '../LoadingIndicator/index.css';
import './index.css';

const CHECK_DEBOUNCE_MS = 400;

const COUNTRY_OPTIONS = [
  'United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Nigeria',
  'South Africa', 'Kenya', 'Ghana', 'India', 'Australia', 'Netherlands', 'Other'
];

const CONTRACT_TYPE_OPTIONS = [
  'One-time', 'Recurring', 'Framework', 'Master', 'Spot', 'Other'
];

const SUPPLIER_TAGS = [
  'Local', 'International', 'Logistics', 'Digital', 'Manufacturing',
  'Services', 'Wholesale', 'Retail', 'Preferred', 'Trial'
];

const CreateNewSupplierModal = ({ isOpen, onCancel, onSuccess }) => {
  const [name, setName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [country, setCountry] = useState('');
  const [contractType, setContractType] = useState('');
  const [tags, setTags] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showContractDropdown, setShowContractDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isCheckingSupplier, setIsCheckingSupplier] = useState(false);
  const [supplierCheckResult, setSupplierCheckResult] = useState(null); // null | { registered: boolean, message?: string }
  const checkTimeoutRef = useRef(null);
  const checkAbortRef = useRef(null);

  const handleCloseModal = () => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkAbortRef.current?.abort();
    setName('');
    setWalletAddress('');
    setCountry('');
    setContractType('');
    setTags([]);
    setShowCountryDropdown(false);
    setShowContractDropdown(false);
    setSubmitError('');
    setSupplierCheckResult(null);
    setIsCheckingSupplier(false);
    setShowSuccessModal(false);
    setSuccessMessage('');
    setSuccessData(null);
    onCancel();
  };

  // Debounced check if supplier is registered when name changes
  useEffect(() => {
    const trimmed = name?.trim() ?? '';
    if (!trimmed) {
      setSupplierCheckResult(null);
      setIsCheckingSupplier(false);
      return;
    }
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkAbortRef.current?.abort();
    checkTimeoutRef.current = setTimeout(() => {
      checkTimeoutRef.current = null;
      const token = localStorage.getItem('token');
      if (!token) {
        setSupplierCheckResult(null);
        setIsCheckingSupplier(false);
        return;
      }
      setIsCheckingSupplier(true);
      setSupplierCheckResult(null);
      const controller = new AbortController();
      checkAbortRef.current = controller;
      fetch(getApiUrl('api/business-suite/suppliers/check'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: trimmed }),
        signal: controller.signal
      })
        .then((res) => res.json().catch(() => ({})))
        .then((result) => {
          if (checkAbortRef.current !== controller) return;
          setSupplierCheckResult({
            registered: result?.registered === true,
            message: result?.message ?? (result?.success ? (result?.registered ? 'Supplier is registered' : 'Supplier not registered') : '')
          });
        })
        .catch((err) => {
          if (err?.name === 'AbortError' || checkAbortRef.current !== controller) return;
          setSupplierCheckResult({ registered: false, message: '' });
        })
        .finally(() => {
          if (checkAbortRef.current === controller) setIsCheckingSupplier(false);
        });
    }, CHECK_DEBOUNCE_MS);
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      checkAbortRef.current?.abort();
    };
  }, [name]);

  const toggleTag = (tag) => {
    setTags(prev => prev.includes(tag)
      ? prev.filter(t => t !== tag)
      : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to add a supplier.');
      return;
    }

    const body = {
      name: name.trim() || undefined,
      walletAddress: walletAddress.trim() || undefined,
      country: country || undefined,
      contractType: contractType || undefined,
      tags: Array.isArray(tags) ? tags : []
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(getApiUrl('api/business-suite/suppliers'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success) {
        setSuccessMessage(result?.message ?? 'Supplier added successfully.');
        setSuccessData(result?.data ?? result);
        setShowSuccessModal(true);
      } else {
        const msg = result?.message ?? (response.status === 401 ? 'Please sign in again.' : 'Failed to add supplier.');
        setSubmitError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('Add supplier error:', err);
      const msg = err?.message ?? 'Failed to add supplier. Please try again.';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    const data = successData;
    setSuccessData(null);
    handleCloseModal();
    onSuccess(data);
  };

  if (!isOpen) {
    return null;
  }

  if (showSuccessModal) {
    return (
      <div className="create-escrow-modal-overlay add-supplier-modal-overlay" onClick={handleSuccessDone}>
        <div className="create-escrow-modal create-new-supplier-modal add-supplier-success-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <div className="add-supplier-success-content">
            <div className="add-supplier-success-icon">
              <CheckCircle size={48} style={{ color: 'var(--green-600, #059669)' }} />
            </div>
            <h3 className="add-supplier-success-title">Success</h3>
            <p className="add-supplier-success-message">{successMessage}</p>
            <button type="button" className="create-supplier-submit-btn" onClick={handleSuccessDone} style={{ marginTop: '1rem' }}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-escrow-modal-overlay add-supplier-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal create-new-supplier-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon" />
          <h2>Add supplier</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <form className="create-supplier-form" onSubmit={handleSubmit}>
          <div className="create-escrow-modal-content create-supplier-form-content">
            <div className="create-supplier-section">
              <div className="create-supplier-field">
                <label className="create-supplier-label">Name</label>
                <input
                  type="text"
                  className="create-supplier-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Supplier or business name"
                />
                {isCheckingSupplier && (
                  <p className="create-supplier-check-status create-supplier-check-loading" role="status">
                    Checking…
                  </p>
                )}
                {!isCheckingSupplier && supplierCheckResult && (
                  <p
                    className={`create-supplier-check-status ${supplierCheckResult.registered ? 'create-supplier-check-registered' : 'create-supplier-check-not-registered'}`}
                    role="status"
                  >
                    {supplierCheckResult.registered ? (
                      <>
                        <CheckCircle size={14} />
                        {supplierCheckResult.message || 'Supplier is registered'}
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} />
                        {supplierCheckResult.message || 'Supplier not registered'}
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="create-supplier-field">
                <label className="create-supplier-label">Wallet address</label>
                <input
                  type="text"
                  className="create-supplier-input create-supplier-input-mono"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="e.g. rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                />
              </div>

              <div className="create-supplier-field">
                <label className="create-supplier-label">Country</label>
                <div className="create-supplier-dropdown-wrapper">
                  <button
                    type="button"
                    className="create-supplier-dropdown-btn"
                    onClick={() => {
                      setShowCountryDropdown(!showCountryDropdown);
                      setShowContractDropdown(false);
                    }}
                  >
                    <span>{country || 'Select country'}</span>
                    <ChevronDown size={16} />
                  </button>
                  {showCountryDropdown && (
                    <div className="create-supplier-dropdown">
                      {COUNTRY_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="create-supplier-dropdown-item"
                          onClick={() => {
                            setCountry(c);
                            setShowCountryDropdown(false);
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="create-supplier-field">
                <label className="create-supplier-label">Contract type</label>
                <div className="create-supplier-dropdown-wrapper">
                  <button
                    type="button"
                    className="create-supplier-dropdown-btn"
                    onClick={() => {
                      setShowContractDropdown(!showContractDropdown);
                      setShowCountryDropdown(false);
                    }}
                  >
                    <span>{contractType || 'Select type'}</span>
                    <ChevronDown size={16} />
                  </button>
                  {showContractDropdown && (
                    <div className="create-supplier-dropdown">
                      {CONTRACT_TYPE_OPTIONS.map((ct) => (
                        <button
                          key={ct}
                          type="button"
                          className="create-supplier-dropdown-item"
                          onClick={() => {
                            setContractType(ct);
                            setShowContractDropdown(false);
                          }}
                        >
                          {ct}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="create-supplier-field">
                <label className="create-supplier-label">
                  <Tag size={14} />
                  Tags
                </label>
                <p className="create-supplier-hint">Tag suppliers (e.g. local, international, logistics, digital)</p>
                <div className="create-supplier-tags">
                  {SUPPLIER_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`create-supplier-tag ${tags.includes(tag) ? 'active' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="create-supplier-error" role="alert">
              {submitError}
            </div>
          )}

          <div className="create-escrow-modal-footer create-supplier-footer">
            <button type="button" className="create-supplier-cancel-btn" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="create-supplier-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Adding…' : 'Add supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNewSupplierModal;
