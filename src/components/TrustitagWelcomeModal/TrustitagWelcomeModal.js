import React, { useCallback } from 'react';
import { Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../assets/images/icons/logo.png';
import './TrustitagWelcomeModal.css';

const TrustitagWelcomeModal = ({ isOpen, trustitag, onClose }) => {
  const handleCopy = useCallback(() => {
    if (!trustitag) return;
    const run = async () => {
      try {
        await navigator.clipboard.writeText(trustitag);
        toast.success('Trustitag copied');
      } catch {
        toast.error('Could not copy');
      }
    };
    run();
  }, [trustitag]);

  if (!isOpen || !trustitag) return null;

  return (
    <div
      className="trustitag-welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trustitag-welcome-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="trustitag-welcome-shell">
        <div className="trustitag-welcome-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="trustitag-welcome-close" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={1.75} />
          </button>

          <div className="trustitag-welcome-header" aria-hidden />
          <div className="trustitag-welcome-body">
            <div className="trustitag-welcome-hero-icon" aria-hidden>
              <img src={logo} alt="" className="trustitag-welcome-logo" />
            </div>

            <h2 id="trustitag-welcome-title" className="trustitag-welcome-title">
              Your TrustiTag Has Been Created
            </h2>
            <p className="trustitag-welcome-lead">
              Your TrustiTag has been created. This is your secure identity for sending, receiving, and managing trusted transactions.
            </p>

            <div className="trustitag-welcome-tag-section">
              <div className="trustitag-welcome-tag-row">
                <code className="trustitag-welcome-tag-text">{trustitag}</code>
                <button
                  type="button"
                  className="trustitag-welcome-copy"
                  onClick={handleCopy}
                  aria-label="Copy Trustitag"
                >
                  <Copy size={22} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustitagWelcomeModal;
