import React, { useState } from 'react';
import { X, ArrowRight, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import './index.css';

const PERMISSION_OPTIONS = [
  { value: 'create_escrow', label: 'Create Escrow' },
  { value: 'release_escrow', label: 'Release Escrow' },
  { value: 'cancel_escrow', label: 'Cancel Escrow' },
  { value: 'create_wallet', label: 'Create Wallet' },
  { value: 'read_wallet', label: 'Read Wallet' },
  { value: 'transaction_logs', label: 'Transaction Logs' },
  { value: 'webhook_test_events', label: 'Webhook Test Events' },
];

const DEFAULT_PERMISSIONS = ['cancel_escrow', 'create_wallet', 'read_wallet', 'transaction_logs', 'webhook_test_events'];

const CreateSandboxKeyModal = ({ isOpen, onCancel, onSuccess }) => {
  const [environmentName, setEnvironmentName] = useState('Angelo Group');
  const [environmentPurpose, setEnvironmentPurpose] = useState('Testing');
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [ipAllowlist, setIpAllowlist] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdKeyData, setCreatedKeyData] = useState(null);

  const resetForm = () => {
    setEnvironmentName('Angelo Group');
    setEnvironmentPurpose('Testing');
    setAutoGenerate(true);
    setIpAllowlist('');
    setPermissions([...DEFAULT_PERMISSIONS]);
    setCreateError('');
    setCreatedKeyData(null);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowPurposeDropdown(false);
    onCancel();
  };

  const handlePermissionChange = (value) => {
    if (permissions.includes(value)) {
      setPermissions(permissions.filter((p) => p !== value));
    } else {
      setPermissions([...permissions, value]);
    }
  };

  const handleCopyKey = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
  };

  const handleGenerate = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    setCreateError('');
    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/sandbox/keys'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environmentName: environmentName.trim() || 'Angelo Group',
          environmentPurpose: environmentPurpose || 'Testing',
          autoGenerateKeys: autoGenerate,
          ipAllowlist: ipAllowlist.trim() || '',
          permissions: permissions.length ? permissions : DEFAULT_PERMISSIONS,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setCreatedKeyData(result.data);
        toast.success(result?.message || 'Sandbox key created.');
      } else {
        const msg = result?.message || result?.error || 'Failed to create sandbox key';
        setCreateError(msg);
        toast.error(msg);
      }
    } catch (e) {
      console.error('Create sandbox key error:', e);
      setCreateError('Failed to create sandbox key');
      toast.error('Failed to create sandbox key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    if (createdKeyData) onSuccess(createdKeyData);
    handleCloseModal();
  };

  const handleTestWebhook = () => {
    // Placeholder - no actual API call
  };

  if (!isOpen) {
    return null;
  }

  const keySecret = createdKeyData?.keySecret ?? createdKeyData?.secretKey ?? '';
  const keyDisplay = createdKeyData?.keyPrefix ?? createdKeyData?.secretKey ?? keySecret;

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal create-sandbox-key-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Create New Sandbox Key</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          {createdKeyData ? (
            <div className="create-sandbox-key-success">
              <div className="create-sandbox-key-success-icon">
                <CheckCircle size={48} />
              </div>
              <p className="create-sandbox-key-success-message">
                Store the key secret securely; it will not be shown again.
              </p>
              <div className="create-sandbox-key-field">
                <label className="create-sandbox-key-label">Key Secret</label>
                <div className="create-sandbox-key-secret-row">
                  <input
                    type="text"
                    className="create-sandbox-key-input"
                    value={keySecret}
                    readOnly
                  />
                  <button
                    type="button"
                    className="create-sandbox-key-btn create-sandbox-key-btn-secondary"
                    onClick={() => handleCopyKey(keySecret)}
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
              </div>
              {keyDisplay && keyDisplay !== keySecret && (
                <div className="create-sandbox-key-field">
                  <label className="create-sandbox-key-label">Key Prefix</label>
                  <div className="create-sandbox-key-secret-row">
                    <input
                      type="text"
                      className="create-sandbox-key-input"
                      value={keyDisplay}
                      readOnly
                    />
                    <button
                      type="button"
                      className="create-sandbox-key-btn create-sandbox-key-btn-secondary"
                      onClick={() => handleCopyKey(keyDisplay)}
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="create-sandbox-key-section">
              {createError && (
                <div className="create-sandbox-key-error" role="alert">
                  {createError}
                </div>
              )}
              <div className="create-sandbox-key-row">
                <div className="create-sandbox-key-field create-sandbox-key-field-half">
                  <label className="create-sandbox-key-label">Environment Name</label>
                  <input
                    type="text"
                    className="create-sandbox-key-input"
                    value={environmentName}
                    onChange={(e) => setEnvironmentName(e.target.value)}
                    placeholder="Angelo Group"
                  />
                </div>
                <div className="create-sandbox-key-field create-sandbox-key-field-half">
                  <label className="create-sandbox-key-label">Environment Purpose</label>
                  <div className="create-sandbox-key-dropdown-wrapper">
                    <button
                      type="button"
                      className="create-sandbox-key-dropdown-btn"
                      onClick={() => setShowPurposeDropdown(!showPurposeDropdown)}
                    >
                      <span>{environmentPurpose || 'Select'}</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {showPurposeDropdown && (
                      <div className="create-sandbox-key-dropdown">
                        {['Development', 'Testing', 'Staging'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="create-sandbox-key-dropdown-item"
                            onClick={() => {
                              setEnvironmentPurpose(p);
                              setShowPurposeDropdown(false);
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="create-sandbox-key-field">
                <div className="create-sandbox-key-toggle-wrapper">
                  <div>
                    <label className="create-sandbox-key-label">Auto-Generate Sandbox API Keys</label>
                  </div>
                  <label className="create-sandbox-key-toggle">
                    <input
                      type="checkbox"
                      checked={autoGenerate}
                      onChange={(e) => setAutoGenerate(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="create-sandbox-key-field">
                <label className="create-sandbox-key-label">IP Allowlist</label>
                <input
                  type="text"
                  className="create-sandbox-key-input"
                  value={ipAllowlist}
                  onChange={(e) => setIpAllowlist(e.target.value)}
                  placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
                />
              </div>

              <div className="create-sandbox-key-field">
                <label className="create-sandbox-key-label">Permissions</label>
                <div className="create-sandbox-key-permissions-group">
                  {PERMISSION_OPTIONS.map(({ value, label }) => (
                    <label key={value} className="create-sandbox-key-permission">
                      <input
                        type="checkbox"
                        checked={permissions.includes(value)}
                        onChange={() => handlePermissionChange(value)}
                      />
                      <span className="radio-custom"></span>
                      <span className="radio-label">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="create-sandbox-key-footer">
          {createdKeyData ? (
            <button
              type="button"
              className="create-sandbox-key-footer-btn create-sandbox-key-footer-btn-primary"
              onClick={handleDone}
            >
              Done
              <span className="create-sandbox-key-arrow-circle">
                <ArrowRight size={18} />
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="create-sandbox-key-footer-btn create-sandbox-key-footer-btn-primary"
                onClick={handleGenerate}
                disabled={isSubmitting}
              >
                {isSubmitting ? <LoadingIndicator size="sm" /> : 'Generate'}
                {!isSubmitting && (
                  <span className="create-sandbox-key-arrow-circle">
                    <ArrowRight size={18} />
                  </span>
                )}
              </button>
              <button
                type="button"
                className="create-sandbox-key-footer-btn create-sandbox-key-footer-btn-secondary"
                onClick={handleTestWebhook}
              >
                Test Webhook
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSandboxKeyModal;

