import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import './index.css';

const CancelReasonModal = ({ isOpen, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } catch (error) {
      console.error('Error in cancel confirmation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="cancel-reason-modal-overlay" onClick={handleClose}>
      <div className="cancel-reason-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cancel-reason-modal-header">
          <div className="cancel-reason-modal-icon">
            <AlertCircle size={24} />
          </div>
          <h2>Cancel Escrow</h2>
          <button 
            type="button" 
            className="cancel-reason-modal-close" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="cancel-reason-modal-content">
          <p className="cancel-reason-modal-description">
            Please provide a reason for cancelling this escrow. This information will be recorded and shared with all parties involved.
          </p>

          <div className="cancel-reason-form-field">
            <label htmlFor="cancel-reason" className="cancel-reason-label">
              Cancellation Reason <span className="required-asterisk">*</span>
            </label>
            <textarea
              id="cancel-reason"
              className="cancel-reason-textarea"
              placeholder="e.g., Project cancelled by mutual agreement, Requirements changed, etc."
              value={reason}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setReason(e.target.value);
                }
              }}
              disabled={isSubmitting}
              rows={4}
              maxLength={500}
            />
            <div className="cancel-reason-char-count">
              {reason.length} / 500 characters
            </div>
          </div>
        </div>

        <div className="cancel-reason-modal-footer">
          <button 
            type="button" 
            className="cancel-reason-cancel-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Go Back
          </button>
          <button 
            type="button" 
            className="cancel-reason-confirm-btn"
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
          >
            {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelReasonModal;
