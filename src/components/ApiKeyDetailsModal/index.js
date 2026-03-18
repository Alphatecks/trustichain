import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import './index.css';

const PERMISSION_DISPLAY_TO_API = { 'Read Access': 'read', 'Write Access': 'write', 'Admin Access': 'admin' };
const API_TO_PERMISSION_DISPLAY = { read: 'Read Access', write: 'Write Access', admin: 'Admin Access' };

const parseList = (text) =>
  text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const ApiKeyDetailsModal = ({ isOpen, onClose, keyData, onUpdated, onDeleted }) => {
  const keyId = keyData?.id;

  const [keyLabel, setKeyLabel] = useState('');
  const [status, setStatus] = useState('');
  const [keyPrefix, setKeyPrefix] = useState('');
  const [permission, setPermission] = useState('Read Access');
  const [serviceScopesText, setServiceScopesText] = useState('');
  const [allowedIPsText, setAllowedIPsText] = useState('');
  const [rotateKey, setRotateKey] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [regeneratedSecret, setRegeneratedSecret] = useState(null);
  const [regeneratedPrefix, setRegeneratedPrefix] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // GET key detail when modal opens with a key id
  useEffect(() => {
    if (!isOpen || !keyId) {
      setDetailError('');
      setRegeneratedSecret(null);
      setRegeneratedPrefix('');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setDetailError('Unauthorized');
      return;
    }
    let cancelled = false;
    setDetailError('');
    setIsLoadingDetail(true);
    fetch(getApiUrl(`api/business-suite/api-keys/${keyId}`), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          const d = result.data;
          setKeyLabel(d.name || '');
          setStatus(d.status || '');
          setKeyPrefix(d.publicKey || d.keyPrefix || '');
          setPermission(API_TO_PERMISSION_DISPLAY[d.permission] || 'Read Access');
          setServiceScopesText(Array.isArray(d.serviceScopes) ? d.serviceScopes.join(', ') : '');
          setAllowedIPsText(Array.isArray(d.allowedIps) ? d.allowedIps.join(', ') : '');
          setRotateKey(Boolean(d.rotateAutomatically));
        } else {
          setDetailError(result?.message || result?.error || 'API key not found');
        }
      })
      .catch(() => {
        if (!cancelled) setDetailError('Failed to load API key');
      })
      .finally(() => { if (!cancelled) setIsLoadingDetail(false); });
    return () => { cancelled = true; };
  }, [isOpen, keyId]);

  const handleCloseModal = () => {
    setRegeneratedSecret(null);
    setUpdateError('');
    onClose();
  };

  const handleUpdatePermissions = async () => {
    if (!keyId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const allowedIps = parseList(allowedIPsText);
    const serviceScopes = parseList(serviceScopesText);
    setUpdateError('');
    setIsUpdating(true);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/api-keys/${keyId}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyLabel?.trim() || undefined,
          permission: PERMISSION_DISPLAY_TO_API[permission] || 'read',
          serviceScopes: serviceScopes.length ? serviceScopes : undefined,
          allowedIps: allowedIps.length ? allowedIps : undefined,
          rotateAutomatically: rotateKey,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success && result?.data) {
        const d = result.data;
        setKeyLabel(d.name || '');
        setStatus(d.status || '');
        setPermission(API_TO_PERMISSION_DISPLAY[d.permission] || permission);
        setServiceScopesText(Array.isArray(d.serviceScopes) ? d.serviceScopes.join(', ') : '');
        setAllowedIPsText(Array.isArray(d.allowedIps) ? d.allowedIps.join(', ') : '');
        setRotateKey(Boolean(d.rotateAutomatically));
        toast.success('API key updated');
        onUpdated?.();
      } else {
        setUpdateError(result?.message || result?.error || 'Update failed');
      }
    } catch {
      setUpdateError('Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!keyId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/api-keys/${keyId}/regenerate`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success && result?.data) {
        setRegeneratedSecret(result.data.keySecret || '');
        setRegeneratedPrefix(result.data.keyPrefix || '');
        setUpdateError('');
        toast.success('Key regenerated. Copy and store it securely.');
        onUpdated?.();
      } else {
        setUpdateError(result?.message || result?.error || 'Regenerate failed');
      }
    } catch {
      setUpdateError('Regenerate failed. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyKey = () => {
    const toCopy = regeneratedSecret || keyPrefix;
    if (!toCopy) return;
    navigator.clipboard.writeText(toCopy).then(() => {
      setCopiedSecret(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedSecret(false), 2000);
    });
  };

  const handleDisableKey = async () => {
    if (!keyId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsDisabling(true);
    setUpdateError('');
    try {
      const res = await fetch(getApiUrl(`api/business-suite/api-keys/${keyId}`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success) {
        setStatus('inactive');
        toast.success('Key disabled');
        onUpdated?.();
      } else {
        setUpdateError(result?.message || result?.error || 'Disable failed');
      }
    } catch {
      setUpdateError('Disable failed. Please try again.');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!keyId) return;
    if (!window.confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsDeleting(true);
    setUpdateError('');
    try {
      const res = await fetch(getApiUrl(`api/business-suite/api-keys/${keyId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success) {
        toast.success('API key deleted');
        onDeleted?.();
      } else {
        setUpdateError(result?.message || result?.error || 'Delete failed');
      }
    } catch {
      setUpdateError('Delete failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDone = () => {
    if (regeneratedSecret) {
      setRegeneratedSecret(null);
      setRegeneratedPrefix('');
    }
    handleCloseModal();
  };

  if (!isOpen) {
    return null;
  }

  const displayKey = regeneratedSecret || keyPrefix;
  const maskedKey = displayKey ? (displayKey.length > 12 ? `${displayKey.slice(0, 12)}${'•'.repeat(24)}` : '•'.repeat(32)) : '•'.repeat(32);

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal api-key-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <div className="api-key-details-header-content">
            <h2>Details</h2>
            <a href="#" className="api-key-details-link" onClick={(e) => e.preventDefault()}>
              Compliance & Documentation
            </a>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        <div className="create-escrow-modal-content api-key-details-content" style={{ padding: '2rem' }}>
          {detailError && (
            <div className="api-key-details-error" role="alert">
              {detailError}
            </div>
          )}
          {updateError && (
            <div className="api-key-details-error" role="alert">
              {updateError}
            </div>
          )}

          {isLoadingDetail ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <LoadingIndicator size="sm" />
            </div>
          ) : (
            <div className="api-key-details-section">
              {/* Key Label & Status */}
              <div className="api-key-details-row">
                <div className="api-key-details-field api-key-details-field-half">
                  <label className="api-key-details-label">Key Label</label>
                  <input
                    type="text"
                    className="api-key-details-input"
                    value={keyLabel}
                    onChange={(e) => setKeyLabel(e.target.value)}
                    placeholder="Payroll Automation Key"
                  />
                </div>
                <div className="api-key-details-field api-key-details-field-half">
                  <label className="api-key-details-label">Status</label>
                  <div className="api-key-details-status">
                    <span className={`api-key-details-status-text ${(status || '').toLowerCase()}`}>
                      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* API Key + Regenerate success state */}
              {regeneratedSecret ? (
                <div className="api-key-details-field">
                  <p className="create-api-key-success-message" style={{ marginBottom: '0.75rem' }}>
                    Store the new key secret securely; it will not be shown again.
                  </p>
                  <label className="api-key-details-label">Key Secret</label>
                  <div className="api-key-details-key-display" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code className="create-api-key-secret-value" style={{ flex: 1 }}>{regeneratedSecret}</code>
                    <button type="button" className="api-key-details-btn api-key-details-btn-secondary" onClick={handleCopyKey}>
                      {copiedSecret ? <Check size={16} /> : <Copy size={16} />}
                      {copiedSecret ? ' Copied' : ' Copy'}
                    </button>
                  </div>
                  {regeneratedPrefix && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="api-key-details-label">Key Prefix</label>
                      <code>{regeneratedPrefix}</code>
                    </div>
                  )}
                  <button type="button" className="api-key-details-btn api-key-details-btn-primary" onClick={handleDone} style={{ marginTop: '1rem' }}>
                    Done
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="api-key-details-field">
                    <label className="api-key-details-label">API KEY:</label>
                    <div className="api-key-details-key-display">
                      <span className="api-key-details-masked-key">{maskedKey}</span>
                    </div>
                    <div className="api-key-details-key-actions">
                      <button
                        type="button"
                        className="api-key-details-btn api-key-details-btn-primary"
                        onClick={handleRegenerateKey}
                        disabled={isRegenerating}
                      >
                        {isRegenerating ? <LoadingIndicator size="sm" /> : null}
                        Regenerate Key
                      </button>
                      <button
                        type="button"
                        className="api-key-details-btn api-key-details-btn-secondary"
                        onClick={handleCopyKey}
                        disabled={!keyPrefix}
                      >
                        <Copy size={16} />
                        Copy Key
                      </button>
                    </div>
                  </div>

                  {/* Permissions - single select + service scopes */}
                  <div className="api-key-details-field">
                    <label className="api-key-details-label">Permissions</label>
                    <div className="api-key-details-radio-group">
                      {['Read Access', 'Write Access', 'Admin Access'].map((p) => (
                        <label key={p} className="api-key-details-radio">
                          <input
                            type="radio"
                            name="permission"
                            checked={permission === p}
                            onChange={() => setPermission(p)}
                          />
                          <span className="radio-custom"></span>
                          <span className="radio-label">{p}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="api-key-details-label">Service scopes (e.g. payroll, escrow)</label>
                      <input
                        type="text"
                        className="api-key-details-input"
                        value={serviceScopesText}
                        onChange={(e) => setServiceScopesText(e.target.value)}
                        placeholder="payroll, escrow"
                      />
                    </div>
                    <button
                      type="button"
                      className="api-key-details-btn api-key-details-btn-primary api-key-details-update-btn"
                      onClick={handleUpdatePermissions}
                      disabled={isUpdating}
                    >
                      {isUpdating ? <LoadingIndicator size="sm" /> : null}
                      Update Permissions
                    </button>
                  </div>

                  <a href="#" className="api-key-details-link" onClick={(e) => e.preventDefault()}>
                    Security Restrictions
                  </a>
                  <div className="api-key-details-field">
                    <label className="api-key-details-label">Allowed IPs</label>
                    <input
                      type="text"
                      className="api-key-details-input"
                      value={allowedIPsText}
                      onChange={(e) => setAllowedIPsText(e.target.value)}
                      placeholder="102.89.22.1, 102.89.22.15"
                    />
                    <div className="api-key-details-key-actions">
                      <button type="button" className="api-key-details-btn api-key-details-btn-primary" onClick={handleUpdatePermissions} disabled={isUpdating}>
                        Save IPs
                      </button>
                    </div>
                  </div>

                  <div className="api-key-details-field">
                    <div className="api-key-details-toggle-wrapper">
                      <div>
                        <label className="api-key-details-label">Rotate Key</label>
                        <div className="api-key-details-toggle-subtitle">Rotate Key Automatically</div>
                      </div>
                      <label className="api-key-details-toggle">
                        <input type="checkbox" checked={rotateKey} onChange={(e) => setRotateKey(e.target.checked)} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!isLoadingDetail && !regeneratedSecret && (
          <div className="api-key-details-footer">
            <button type="button" className="api-key-details-footer-btn api-key-details-footer-btn-primary" onClick={handleDone}>
              Done
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="api-key-details-footer-btn api-key-details-footer-btn-secondary"
              onClick={handleDisableKey}
              disabled={status === 'inactive' || isDisabling}
            >
              {isDisabling ? <LoadingIndicator size="sm" /> : null}
              Disable Key
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="api-key-details-footer-btn api-key-details-footer-btn-danger"
              onClick={handleDeleteKey}
              disabled={isDeleting}
            >
              {isDeleting ? <LoadingIndicator size="sm" /> : null}
              Delete Key
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeyDetailsModal;
