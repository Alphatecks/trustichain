import React, { useState } from 'react';
import { X, ArrowRight, Calendar } from 'lucide-react';
import './LoadingIndicator.css';
import './CreateWebhookModal.css';

const CreateWebhookModal = ({ isOpen, onCancel, onSuccess }) => {
  const [webhookName, setWebhookName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [expiration, setExpiration] = useState('3rd Dec 2025');
  const [endpointUrl, setEndpointUrl] = useState('https://myserver.com/trustichain-webhook');
  const [retryPolicy, setRetryPolicy] = useState('Immediate Retry');
  const [showRetryDropdown, setShowRetryDropdown] = useState(false);
  const [status] = useState('Active');
  const [eventTypes, setEventTypes] = useState({
    'Escrow Created': false,
    'Escrow Released': false,
    'Escrow Cancelled': true,
    'Payment Completed': true,
    'Dispute Opened': true,
    'Wallet Created / Updated': true,
    'Transaction Failed / Succeeded': true
  });

  const handleCloseModal = () => {
    setWebhookName('');
    setSecretKey('');
    setExpiration('3rd Dec 2025');
    setEndpointUrl('https://myserver.com/trustichain-webhook');
    setRetryPolicy('Immediate Retry');
    setShowRetryDropdown(false);
    setEventTypes({
      'Escrow Created': false,
      'Escrow Released': false,
      'Escrow Cancelled': true,
      'Payment Completed': true,
      'Dispute Opened': true,
      'Wallet Created / Updated': true,
      'Transaction Failed / Succeeded': true
    });
    onCancel();
  };

  const handleEventTypeChange = (event) => {
    setEventTypes(prev => ({
      ...prev,
      [event]: !prev[event]
    }));
  };

  const handleSave = () => {
    onSuccess({
      webhookName,
      secretKey,
      expiration,
      endpointUrl,
      retryPolicy,
      eventTypes
    });
    handleCloseModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal create-webhook-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Create New Webhook</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          <div className="create-webhook-section">
            {/* Left Column */}
            <div className="create-webhook-row">
              <div className="create-webhook-field create-webhook-field-half">
                <label className="create-webhook-label">Webhook Name</label>
                <input
                  type="text"
                  className="create-webhook-input"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="Escrow Events Listener"
                />
              </div>
              <div className="create-webhook-field create-webhook-field-half">
                <label className="create-webhook-label">Endpoint URL</label>
                <input
                  type="text"
                  className="create-webhook-input"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  placeholder="https://myserver.com/trustichain-webhook"
                />
              </div>
            </div>

            {/* Second Row */}
            <div className="create-webhook-row">
              <div className="create-webhook-field create-webhook-field-half">
                <label className="create-webhook-label">Secret Key</label>
                <input
                  type="text"
                  className="create-webhook-input"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Escrow Events Listener"
                />
              </div>
              <div className="create-webhook-field create-webhook-field-half">
                <label className="create-webhook-label">Retry Policy</label>
                <div className="create-webhook-dropdown-wrapper">
                  <button
                    type="button"
                    className="create-webhook-dropdown-btn"
                    onClick={() => {
                      setShowRetryDropdown(!showRetryDropdown);
                    }}
                  >
                    <span>{retryPolicy}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {showRetryDropdown && (
                    <div className="create-webhook-dropdown">
                      <button
                        type="button"
                        className="create-webhook-dropdown-item"
                        onClick={() => {
                          setRetryPolicy('Immediate Retry');
                          setShowRetryDropdown(false);
                        }}
                      >
                        Immediate Retry
                      </button>
                      <button
                        type="button"
                        className="create-webhook-dropdown-item"
                        onClick={() => {
                          setRetryPolicy('Exponential Backoff');
                          setShowRetryDropdown(false);
                        }}
                      >
                        Exponential Backoff
                      </button>
                      <button
                        type="button"
                        className="create-webhook-dropdown-item"
                        onClick={() => {
                          setRetryPolicy('Fixed Interval');
                          setShowRetryDropdown(false);
                        }}
                      >
                        Fixed Interval
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Third Row */}
            <div className="create-webhook-row">
              <div className="create-webhook-field create-webhook-field-half">
                <label className="create-webhook-label">Expiration</label>
                <div className="create-webhook-date-wrapper">
                  <input
                    type="text"
                    className="create-webhook-date-input"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    placeholder="3rd Dec 2025"
                  />
                  <Calendar size={18} className="create-webhook-calendar-icon" />
                </div>
              </div>
              <div className="create-webhook-field create-webhook-field-half">
                <label className="create-webhook-label">Status</label>
                <div className="create-webhook-status">
                  <span className={`create-webhook-status-text ${status.toLowerCase()}`}>
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Type Section */}
            <div className="create-webhook-field">
              <label className="create-webhook-label">Event Type</label>
              <div className="create-webhook-event-types-group">
                {Object.keys(eventTypes).map((event) => (
                  <label key={event} className="create-webhook-event-type">
                    <input
                      type="checkbox"
                      checked={eventTypes[event]}
                      onChange={() => handleEventTypeChange(event)}
                    />
                    <span className="radio-custom"></span>
                    <span className="radio-label">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="create-webhook-footer">
          <button 
            type="button"
            className="create-webhook-footer-btn create-webhook-footer-btn-primary"
            onClick={handleSave}
          >
            Save Webhook
            <span className="create-webhook-arrow-circle">
              <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWebhookModal;

