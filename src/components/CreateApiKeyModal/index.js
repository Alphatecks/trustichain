import React, { useState } from 'react';
import { X, Calendar, ArrowRight, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import './index.css';

const PERMISSION_TO_API = { 'Read Access': 'read', 'Write Access': 'write', 'Admin Access': 'admin', 'Custom Scopes': 'custom' };
const ENVIRONMENT_OPTIONS = [
  { label: 'Development', value: 'development' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' }
];

const CreateApiKeyModal = ({ isOpen, onCancel, onSuccess }) => {
  const [keyLabel, setKeyLabel] = useState('');
  const [environment, setEnvironment] = useState('');
  const [showEnvironmentDropdown, setShowEnvironmentDropdown] = useState(false);
  const [permission, setPermission] = useState('Read Access');
  const [allowedIPsText, setAllowedIPsText] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [rotateKey, setRotateKey] = useState(false);
  const [restrictServicesText, setRestrictServicesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const resetForm = () => {
    setKeyLabel('');
    setEnvironment('');
    setPermission('Read Access');
    setAllowedIPsText('');
    setExpirationDate('');
    setRotateKey(false);
    setRestrictServicesText('');
    setShowEnvironmentDropdown(false);
    setSubmitError('');
    setCreatedKeyData(null);
    setCopiedSecret(false);
  };

  const handleCloseModal = () => {
    resetForm();
    onCancel();
  };

  const parseList = (text) =>
    text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleGenerate = async () => {
    const label = keyLabel?.trim();
    if (!label) {
      setSubmitError('Key label is required.');
      return;
    }
    if (!environment) {
      setSubmitError('Environment is required.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    const allowedIpAddresses = parseList(allowedIPsText);
    const restrictToServices = parseList(restrictServicesText);
    const payload = {
      keyLabel: label,
      environment: environment.toLowerCase(),
      permission: PERMISSION_TO_API[permission] || 'read',
      rotateKeyAutomatically: rotateKey
    };
    if (allowedIpAddresses.length > 0) payload.allowedIpAddresses = allowedIpAddresses;
    if (expirationDate) payload.expirationDate = expirationDate;
    if (restrictToServices.length > 0) payload.restrictToServices = restrictToServices;

    const token = localStorage.getItem('token');
    if (!token) {
      setSubmitError('Please sign in to create an API key.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(getApiUrl('api/business-suite/api-keys'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));

      if (res.ok && result?.success && result?.data) {
        setCreatedKeyData(result.data);
        return;
      }
      setSubmitError(result?.message || result?.error || 'Failed to create API key.');
    } catch (e) {
      setSubmitError('Failed to create API key. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySecret = () => {
    if (!createdKeyData?.keySecret) return;
    navigator.clipboard.writeText(createdKeyData.keySecret).then(() => {
      setCopiedSecret(true);
      toast.success('Key secret copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2000);
    });
  };

  const handleDone = () => {
    const data = createdKeyData;
    resetForm();
    onSuccess(data);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal create-api-key-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Create New API Key</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          {createdKeyData ? (
            <div className="create-api-key-success-section">
              <p className="create-api-key-success-message">
                Store the key secret securely; it will not be shown again.
              </p>
              <div className="create-api-key-success-row">
                <label className="create-api-key-label">Key Secret</label>
                <div className="create-api-key-secret-row">
                  <code className="create-api-key-secret-value">{createdKeyData.keySecret || '—'}</code>
                  <button type="button" className="create-api-key-copy-btn" onClick={handleCopySecret} title="Copy">
                    {copiedSecret ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              {createdKeyData.keyPrefix && (
                <div className="create-api-key-success-row">
                  <label className="create-api-key-label">Key Prefix</label>
                  <code className="create-api-key-prefix-value">{createdKeyData.keyPrefix}</code>
                </div>
              )}
              <button type="button" className="create-api-key-generate-btn" onClick={handleDone}>
                Done
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
          <div className="create-api-key-section">
            {/* Compliance Link */}
            <a href="#" className="create-api-key-link" onClick={(e) => e.preventDefault()}>
              Compliance & Documentation
            </a>

            {/* Key Label & Environment - Two Columns */}
            <div className="create-api-key-row">
              <div className="create-api-key-field create-api-key-field-half">
                <label className="create-api-key-label">Key Label</label>
              <input
                type="text"
                className="create-api-key-input"
                  value={keyLabel}
                  onChange={(e) => setKeyLabel(e.target.value)}
                  placeholder="Angelo Group"
              />
            </div>
              <div className="create-api-key-field create-api-key-field-half">
                <label className="create-api-key-label">Environment</label>
              <div className="create-api-key-dropdown-wrapper">
                <button
                  type="button"
                  className="create-api-key-dropdown-btn"
                  onClick={() => {
                      setShowEnvironmentDropdown(!showEnvironmentDropdown);
                  }}
                >
                    <span>{ENVIRONMENT_OPTIONS.find((o) => o.value === environment)?.label || 'Select'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                  {showEnvironmentDropdown && (
                  <div className="create-api-key-dropdown">
                    {ENVIRONMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className="create-api-key-dropdown-item"
                        onClick={() => {
                          setEnvironment(opt.value);
                          setShowEnvironmentDropdown(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="create-api-key-field">
              <label className="create-api-key-label">Permissions</label>
              <div className="create-api-key-radio-group">
                <label className="create-api-key-radio">
                  <input
                    type="radio"
                    name="permission"
                    value="Read Access"
                    checked={permission === 'Read Access'}
                    onChange={(e) => setPermission(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Read Access</span>
                </label>
                <label className="create-api-key-radio">
                  <input
                    type="radio"
                    name="permission"
                    value="Write Access"
                    checked={permission === 'Write Access'}
                    onChange={(e) => setPermission(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Write Access</span>
                </label>
                <label className="create-api-key-radio">
                  <input
                    type="radio"
                    name="permission"
                    value="Admin Access"
                    checked={permission === 'Admin Access'}
                    onChange={(e) => setPermission(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Admin Access</span>
                </label>
                <label className="create-api-key-radio">
                  <input
                    type="radio"
                    name="permission"
                    value="Custom Scopes"
                    checked={permission === 'Custom Scopes'}
                    onChange={(e) => setPermission(e.target.value)}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Custom Scopes</span>
                </label>
              </div>
            </div>

            {/* Security Restrictions Link */}
            <a href="#" className="create-api-key-link" onClick={(e) => e.preventDefault()}>
              Security Restrictions
            </a>

            {/* Allowed IP Addresses & Expiration Date - Two Columns */}
            <div className="create-api-key-row">
              <div className="create-api-key-field create-api-key-field-half">
                <label className="create-api-key-label">Allowed IP Addresses</label>
                <input
                  type="text"
                  className="create-api-key-input"
                  value={allowedIPsText}
                  onChange={(e) => setAllowedIPsText(e.target.value)}
                  placeholder="192.168.1.1, 10.0.0.0/24"
                />
              </div>
              <div className="create-api-key-field create-api-key-field-half">
                <label className="create-api-key-label">Expiration Date</label>
                <div className="create-api-key-date-wrapper">
                  <input
                    type="date"
                    className="create-api-key-date-input"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                  <Calendar size={18} className="create-api-key-calendar-icon" />
                </div>
              </div>
            </div>

            {/* Rotate Key & Restrict to Specific Services - Two Columns */}
            <div className="create-api-key-row">
              <div className="create-api-key-field create-api-key-field-half">
                <div className="create-api-key-toggle-wrapper">
                  <div>
                    <label className="create-api-key-label">Rotate Key</label>
                    <div className="create-api-key-toggle-subtitle">Rotate Key Automatically</div>
                  </div>
                  <label className="create-api-key-toggle">
                    <input
                      type="checkbox"
                      checked={rotateKey}
                      onChange={(e) => setRotateKey(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div className="create-api-key-field create-api-key-field-half">
                <label className="create-api-key-label">Restrict to Specific Services</label>
                <input
                  type="text"
                  className="create-api-key-input"
                  value={restrictServicesText}
                  onChange={(e) => setRestrictServicesText(e.target.value)}
                  placeholder="payroll, escrow"
                />
              </div>
            </div>

            {submitError && (
              <div className="create-api-key-error" role="alert">
                {submitError}
              </div>
            )}

            {/* Generate Button */}
            <button
              type="button"
              className="create-api-key-generate-btn"
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              {isSubmitting && <LoadingIndicator size="sm" />}
              <span>{isSubmitting ? 'Creating…' : 'Generate'}</span>
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateApiKeyModal;
