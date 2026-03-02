import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import '../WithdrawModal/index.css';
import './index.css';

const AddTeamModal = ({ isOpen, onCancel, onSuccess }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseModal = () => {
    setName('');
    setIsSubmitting(false);
    onCancel();
  };

  const handleSubmit = async () => {
    const trimmedName = name?.trim();
    if (!trimmedName) {
      toast.error('Please enter a team name');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to add a team');
        setIsSubmitting(false);
        return;
      }

      const payload = { name: trimmedName };

      const response = await fetch(getApiUrl('api/business-suite/teams'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success) {
        toast.success(result.message || 'Team created successfully');
        handleCloseModal();
        onSuccess?.();
      } else {
        toast.error(result?.message || 'Failed to create team. Please try again.');
      }
    } catch (error) {
      console.error('Add team error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal add-team-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon" />
          <h2>Add a team</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          <div className="withdraw-section">
            <div className="withdraw-wallet-section">
              <label className="withdraw-label">Name <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="add-team-input"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button
              type="button"
              className="withdraw-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !name?.trim()}
              style={{
                opacity: isSubmitting || !name?.trim() ? 0.6 : 1,
                cursor: isSubmitting || !name?.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {isSubmitting ? (
                <>
                  <LoadingIndicator size="sm" />
                  Creating...
                </>
              ) : (
                'Add team'
              )}
            </button>

            <div className="withdraw-info">
              <Info size={16} />
              <span>Your team will appear in My Teams once created.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTeamModal;
