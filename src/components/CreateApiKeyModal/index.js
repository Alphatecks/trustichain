import React, { useState } from 'react';
import { X, Calendar, ArrowRight } from 'lucide-react';
import '../LoadingIndicator/index.css';
import './index.css';

const CreateApiKeyModal = ({ isOpen, onCancel, onSuccess }) => {
  const [keyLabel, setKeyLabel] = useState('Angelo Group');
  const [environment, setEnvironment] = useState('');
  const [showEnvironmentDropdown, setShowEnvironmentDropdown] = useState(false);
  const [permission, setPermission] = useState('Admin Access');
  const [allowedIPs, setAllowedIPs] = useState('3rd Dec 2025');
  const [expirationDate, setExpirationDate] = useState('25 Dec 2026');
  const [rotateKey, setRotateKey] = useState(false);
  const [restrictServices, setRestrictServices] = useState('');

  const handleCloseModal = () => {
    setKeyLabel('Angelo Group');
    setEnvironment('');
    setPermission('Admin Access');
    setAllowedIPs('3rd Dec 2025');
    setExpirationDate('25 Dec 2026');
    setRotateKey(false);
    setRestrictServices('');
    setShowEnvironmentDropdown(false);
    onCancel();
  };

  const handleGenerate = () => {
    onSuccess({
      keyLabel,
      environment,
      permission,
      allowedIPs,
      expirationDate,
      rotateKey,
      restrictServices
    });
    handleCloseModal();
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
                    <span>{environment || 'Select'}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                  {showEnvironmentDropdown && (
                  <div className="create-api-key-dropdown">
                    <button
                      type="button"
                      className="create-api-key-dropdown-item"
                      onClick={() => {
                          setEnvironment('Development');
                          setShowEnvironmentDropdown(false);
                      }}
                    >
                        Development
                    </button>
                    <button
                      type="button"
                      className="create-api-key-dropdown-item"
                      onClick={() => {
                          setEnvironment('Staging');
                          setShowEnvironmentDropdown(false);
                      }}
                    >
                        Staging
                    </button>
                    <button
                      type="button"
                      className="create-api-key-dropdown-item"
                      onClick={() => {
                          setEnvironment('Production');
                          setShowEnvironmentDropdown(false);
                      }}
                    >
                        Production
                    </button>
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
                  value={allowedIPs}
                  onChange={(e) => setAllowedIPs(e.target.value)}
                  placeholder="3rd Dec 2025"
                />
              </div>
              <div className="create-api-key-field create-api-key-field-half">
                <label className="create-api-key-label">Expiration Date</label>
                <div className="create-api-key-date-wrapper">
                  <input
                    type="text"
                    className="create-api-key-date-input"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    placeholder="25 Dec 2026"
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
                  value={restrictServices}
                  onChange={(e) => setRestrictServices(e.target.value)}
                  placeholder="Add amount"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button 
              type="button"
              className="create-api-key-generate-btn"
              onClick={handleGenerate}
            >
              Generate
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateApiKeyModal;
