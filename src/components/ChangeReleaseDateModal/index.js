import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import '../LoadingIndicator/index.css';
import './index.css';

const ChangeReleaseDateModal = ({ isOpen, onCancel, onSuccess, currentReleaseDate = '31st Nov', currentReleasePeriod = '30 Days' }) => {
  const [newReleasePeriod, setNewReleasePeriod] = useState('20 Days');
  const [newReleaseDate, setNewReleaseDate] = useState('20th Nov');

  const handleCloseModal = () => {
    setNewReleasePeriod('20 Days');
    setNewReleaseDate('20th Nov');
    onCancel();
  };

  const handleSave = () => {
    onSuccess({
      newReleasePeriod,
      newReleaseDate
    });
    handleCloseModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal change-release-date-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header change-release-date-modal-header">
          <div className="change-release-date-title-row">
            <span className="change-release-date-accent" aria-hidden />
            <h2>Change Release Date</h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          <div className="change-release-date-section">
            {/* Current Information */}
            <div className="form-group">
              <label className="form-label">Current Release Date</label>
              <input
                type="text"
                className="form-input readonly"
                value={currentReleaseDate}
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Release Period</label>
              <input
                type="text"
                className="form-input readonly"
                value={currentReleasePeriod}
                readOnly
              />
            </div>

            {/* New Information */}
            <div className="form-group">
              <label className="form-label new-label">New Release Period</label>
              <input
                type="text"
                className="form-input"
                value={newReleasePeriod}
                onChange={(e) => setNewReleasePeriod(e.target.value)}
                placeholder="20 Days"
              />
            </div>

            <div className="form-group">
              <label className="form-label new-label">New Release Date</label>
              <input
                type="text"
                className="form-input"
                value={newReleaseDate}
                onChange={(e) => setNewReleaseDate(e.target.value)}
                placeholder="20th Nov"
              />
            </div>

            <button 
              type="button"
              className="change-release-date-save-btn"
              onClick={handleSave}
            >
              Save
            </button>

            <div className="change-release-date-info">
              <Info size={16} />
              <span>Your Release Date would be changed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangeReleaseDateModal;
