import React, { useState } from 'react';
import { X, ArrowRight, Copy } from 'lucide-react';
import './LoadingIndicator.css';
import './ApiKeyDetailsModal.css';

const ApiKeyDetailsModal = ({ isOpen, onClose, keyData }) => {
  // Placeholder state - matching the design
  const [keyLabel, setKeyLabel] = useState('Payroll Automation Key');
  const [status] = useState('Active');
  const [apiKey] = useState('pk_live_87GH2KD9JKL990ASDF23');
  const [permissions, setPermissions] = useState(['Admin Access', 'Custom Scopes']);
  const [allowedIPs, setAllowedIPs] = useState('102.89.22.1, 102.89.22.15');
  const [rotateKey, setRotateKey] = useState(false);

  const handleCloseModal = () => {
    onClose();
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
    navigator.clipboard.writeText(apiKey).then(() => {
      console.log('API Key copied to clipboard');
    });
  };

  const handleUpdatePermissions = () => {
    console.log('Update Permissions clicked', permissions);
    // Placeholder - no actual API call
  };

  const handleAddIP = () => {
    console.log('Add IP clicked');
    // Placeholder - no actual API call
  };

  const handleRemoveIP = () => {
    console.log('Remove IP clicked');
    // Placeholder - no actual API call
  };

  const handleDone = () => {
    handleCloseModal();
  };

  const handleDisableKey = () => {
    console.log('Disable Key clicked');
    // Placeholder - no actual API call
  };

  const handleDeleteKey = () => {
    console.log('Delete Key clicked');
    // Placeholder - no actual API call
  };

  if (!isOpen) {
    return null;
  }

  const maskedKey = '•'.repeat(32);

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal api-key-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        {/* Modal Header */}
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

        {/* Modal Content */}
        <div className="create-escrow-modal-content api-key-details-content" style={{ padding: '2rem' }}>
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
                  <span className={`api-key-details-status-text ${status.toLowerCase()}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* API Key */}
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
                >
                  Regenerate Key
                </button>
                <button 
                  type="button"
                  className="api-key-details-btn api-key-details-btn-secondary"
                  onClick={handleCopyKey}
                >
                  <Copy size={16} />
                  Copy Key
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div className="api-key-details-field">
              <label className="api-key-details-label">Permissions</label>
              <div className="api-key-details-radio-group">
                <label className="api-key-details-radio">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Read Access')}
                    onChange={() => handlePermissionChange('Read Access')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Read Access</span>
                </label>
                <label className="api-key-details-radio">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Write Access')}
                    onChange={() => handlePermissionChange('Write Access')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Write Access</span>
                </label>
                <label className="api-key-details-radio">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Admin Access')}
                    onChange={() => handlePermissionChange('Admin Access')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Admin Access</span>
                </label>
                <label className="api-key-details-radio">
                  <input
                    type="checkbox"
                    checked={permissions.includes('Custom Scopes')}
                    onChange={() => handlePermissionChange('Custom Scopes')}
                  />
                  <span className="radio-custom"></span>
                  <span className="radio-label">Custom Scopes</span>
                </label>
              </div>
              <button 
                type="button"
                className="api-key-details-btn api-key-details-btn-primary api-key-details-update-btn"
                onClick={handleUpdatePermissions}
              >
                Update Permissions
              </button>
            </div>

            {/* Security Restrictions */}
            <a href="#" className="api-key-details-link" onClick={(e) => e.preventDefault()}>
              Security Restrictions
            </a>
            <div className="api-key-details-field">
              <label className="api-key-details-label">Allowed IPs</label>
              <input
                type="text"
                className="api-key-details-input"
                value={allowedIPs}
                onChange={(e) => setAllowedIPs(e.target.value)}
                placeholder="102.89.22.1, 102.89.22.15"
              />
              <div className="api-key-details-key-actions">
                <button 
                  type="button"
                  className="api-key-details-btn api-key-details-btn-primary"
                  onClick={handleAddIP}
                >
                  Add IP
                </button>
                <button 
                  type="button"
                  className="api-key-details-btn api-key-details-btn-secondary"
                  onClick={handleRemoveIP}
                >
                  Remove IP
                </button>
              </div>
            </div>

            {/* Rotate Key */}
            <div className="api-key-details-field">
              <div className="api-key-details-toggle-wrapper">
                <div>
                  <label className="api-key-details-label">Rotate Key</label>
                  <div className="api-key-details-toggle-subtitle">Rotate Key Automatically</div>
                </div>
                <label className="api-key-details-toggle">
                  <input
                    type="checkbox"
                    checked={rotateKey}
                    onChange={(e) => setRotateKey(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="api-key-details-footer">
          <button 
            type="button"
            className="api-key-details-footer-btn api-key-details-footer-btn-primary"
            onClick={handleDone}
          >
            Done
            <ArrowRight size={18} />
          </button>
          <button 
            type="button"
            className="api-key-details-footer-btn api-key-details-footer-btn-secondary"
            onClick={handleDisableKey}
          >
            Disable Key
            <ArrowRight size={18} />
          </button>
          <button 
            type="button"
            className="api-key-details-footer-btn api-key-details-footer-btn-danger"
            onClick={handleDeleteKey}
          >
            Delete Key
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDetailsModal;

