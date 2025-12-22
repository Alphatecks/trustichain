import React, { useState } from 'react';
import { X, ArrowRight, Copy } from 'lucide-react';
import './LoadingIndicator.css';
import './CreateSandboxKeyModal.css';

const CreateSandboxKeyModal = ({ isOpen, onCancel, onSuccess }) => {
  const [environmentName, setEnvironmentName] = useState('Angelo Group');
  const [environmentPurpose, setEnvironmentPurpose] = useState('');
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [ipAllowlist, setIpAllowlist] = useState('');
  const [secretKey] = useState('sk_live_placeholder_key_1234567890abcdef');
  const [status] = useState('Active');
  const [permissions, setPermissions] = useState([
    'Cancel Escrow',
    'Create Wallet',
    'Read Wallet',
    'Transaction Logs',
    'Webhook Test Events'
  ]);

  const handleCloseModal = () => {
    setEnvironmentName('Angelo Group');
    setEnvironmentPurpose('');
    setAutoGenerate(true);
    setIpAllowlist('');
    setShowPurposeDropdown(false);
    setPermissions([
      'Cancel Escrow',
      'Create Wallet',
      'Read Wallet',
      'Transaction Logs',
      'Webhook Test Events'
    ]);
    onCancel();
  };

  const handlePermissionChange = (permission) => {
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };

  const handleRegenerateKey = () => {
    console.log('Regenerate Key clicked');
    // Placeholder - no actual API call
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey).then(() => {
      console.log('Secret Key copied to clipboard');
    });
  };

  const handleGenerate = () => {
    onSuccess({
      environmentName,
      environmentPurpose,
      autoGenerate,
      ipAllowlist,
      permissions
    });
    handleCloseModal();
  };

  const handleTestWebhook = () => {
    console.log('Test Webhook clicked');
    // Placeholder - no actual API call
  };

  if (!isOpen) {
    return null;
  }

  const maskedKey = 'sk_live_' + '•'.repeat(28);

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
          <div className="create-sandbox-key-section">
            {/* Environment Details */}
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
                    onClick={() => {
                      setShowPurposeDropdown(!showPurposeDropdown);
                    }}
                  >
                    <span>{environmentPurpose || 'Select'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showPurposeDropdown && (
                    <div className="create-sandbox-key-dropdown">
                      <button
                        type="button"
                        className="create-sandbox-key-dropdown-item"
                        onClick={() => {
                          setEnvironmentPurpose('Development');
                          setShowPurposeDropdown(false);
                        }}
                      >
                        Development
                      </button>
                      <button
                        type="button"
                        className="create-sandbox-key-dropdown-item"
                        onClick={() => {
                          setEnvironmentPurpose('Testing');
                          setShowPurposeDropdown(false);
                        }}
                      >
                        Testing
                      </button>
                      <button
                        type="button"
                        className="create-sandbox-key-dropdown-item"
                        onClick={() => {
                          setEnvironmentPurpose('Staging');
                          setShowPurposeDropdown(false);
                        }}
                      >
                        Staging
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Auto Generate Sandbox */}
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

            {/* IP Allowlist */}
            <div className="create-sandbox-key-field">
              <label className="create-sandbox-key-label">IP Allowlist</label>
              <input
                type="text"
                className="create-sandbox-key-input"
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
                placeholder="Add amount"
              />
            </div>

            {/* Secret Key & Status */}
            <div className="create-sandbox-key-row">
              <div className="create-sandbox-key-field create-sandbox-key-field-half">
                <label className="create-sandbox-key-label">Secret Key</label>
                <input
                  type="text"
                  className="create-sandbox-key-input"
                  value={maskedKey}
                  readOnly
                />
                <div className="create-sandbox-key-key-actions">
                  <button 
                    type="button"
                    className="create-sandbox-key-btn create-sandbox-key-btn-primary"
                    onClick={handleRegenerateKey}
                  >
                    Regenerate Key
                  </button>
                  <button 
                    type="button"
                    className="create-sandbox-key-btn create-sandbox-key-btn-secondary"
                    onClick={handleCopyKey}
                  >
                    <Copy size={16} />
                    Copy Key
                  </button>
                </div>
              </div>
              <div className="create-sandbox-key-field create-sandbox-key-field-half">
                <label className="create-sandbox-key-label">Status</label>
                <div className="create-sandbox-key-status">
                  <span className={`create-sandbox-key-status-text ${status.toLowerCase()}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="create-sandbox-key-field">
              <label className="create-sandbox-key-label">Permissions</label>
              <div className="create-sandbox-key-permissions-group">
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Create Escrow')}
                    onChange={() => handlePermissionChange('Create Escrow')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Create Escrow</span>
                </label>
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Release Escrow')}
                    onChange={() => handlePermissionChange('Release Escrow')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Release Escrow</span>
                </label>
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Cancel Escrow')}
                    onChange={() => handlePermissionChange('Cancel Escrow')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Cancel Escrow</span>
                </label>
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Create Wallet')}
                    onChange={() => handlePermissionChange('Create Wallet')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Create Wallet</span>
                </label>
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Read Wallet')}
                    onChange={() => handlePermissionChange('Read Wallet')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Read Wallet</span>
                </label>
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Transaction Logs')}
                    onChange={() => handlePermissionChange('Transaction Logs')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Transaction Logs</span>
                </label>
                <label className="create-sandbox-key-permission">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Webhook Test Events')}
                    onChange={() => handlePermissionChange('Webhook Test Events')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Webhook Test Events</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="create-sandbox-key-footer">
          <button 
            type="button"
            className="create-sandbox-key-footer-btn create-sandbox-key-footer-btn-primary"
            onClick={handleGenerate}
          >
            Generate
            <span className="create-sandbox-key-arrow-circle">
              <ArrowRight size={18} />
            </span>
          </button>
          <button 
            type="button"
            className="create-sandbox-key-footer-btn create-sandbox-key-footer-btn-secondary"
            onClick={handleTestWebhook}
          >
            Test Webhook
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSandboxKeyModal;

