import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock, X, Check } from 'lucide-react';

export const DISPUTE_PERIOD_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
];

const getDisputePeriodLabel = (value) =>
  DISPUTE_PERIOD_OPTIONS.find((opt) => opt.value === value)?.label || '';

const EscrowDisputePeriodSelectModal = ({ isOpen, selectedValue, onClose, onConfirm }) => {
  const [pending, setPending] = useState(selectedValue);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPending(selectedValue || '');
    }
  }, [isOpen, selectedValue]);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return undefined;
    }
    setEntered(false);
    let id2;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      if (id2 != null) cancelAnimationFrame(id2);
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`create-escrow-dispute-modal-overlay${entered ? ' is-visible' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`create-escrow-dispute-modal${entered ? ' is-visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-escrow-dispute-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-escrow-dispute-modal-header">
          <div className="create-escrow-dispute-modal-header-leading">
            <span className="create-escrow-dispute-modal-accent" aria-hidden />
            <h2 id="create-escrow-dispute-modal-title">Dispute Resolution Period</h2>
          </div>
          <button
            type="button"
            className="create-escrow-dispute-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <p className="create-escrow-dispute-modal-subtitle">
          Choose how long disputes can be raised after completion.
        </p>

        <div className="create-escrow-dispute-modal-list" role="listbox" aria-label="Dispute period">
          {DISPUTE_PERIOD_OPTIONS.map((option) => {
            const isActive = pending === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`create-escrow-dispute-modal-row${isActive ? ' is-selected' : ''}`}
                onClick={() => setPending(option.value)}
              >
                <span className="create-escrow-dispute-modal-row-leading">
                  <span className="create-escrow-dispute-modal-row-icon" aria-hidden>
                    <Clock size={18} />
                  </span>
                  <span className="create-escrow-dispute-modal-row-label">{option.label}</span>
                </span>
                {isActive ? (
                  <Check size={18} className="create-escrow-dispute-modal-row-check" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="create-escrow-dispute-modal-footer">
          <button
            type="button"
            className="create-escrow-dispute-modal-select-btn"
            disabled={!pending}
            onClick={() => {
              if (!pending) return;
              onConfirm(pending);
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const EscrowDisputePeriodSelect = ({ value, onChange, disabled = false }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const selectedLabel = getDisputePeriodLabel(value);

  return (
    <>
      <button
        type="button"
        className={`create-escrow-dispute-period-trigger${modalOpen ? ' is-open' : ''}${
          disabled ? ' is-disabled' : ''
        }`}
        aria-expanded={modalOpen}
        aria-haspopup="dialog"
        aria-label="Dispute resolution period"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setModalOpen(true);
        }}
      >
        <Clock size={18} className="create-escrow-dispute-period-trigger-icon" aria-hidden />
        <span
          className={`create-escrow-dispute-period-trigger-label${
            selectedLabel ? '' : ' is-placeholder'
          }`}
        >
          {selectedLabel || 'Select period'}
        </span>
        <ChevronDown size={16} className="create-escrow-dispute-period-trigger-chevron" aria-hidden />
      </button>

      <EscrowDisputePeriodSelectModal
        isOpen={modalOpen}
        selectedValue={value}
        onClose={() => setModalOpen(false)}
        onConfirm={(nextValue) => {
          onChange(nextValue);
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default EscrowDisputePeriodSelect;
