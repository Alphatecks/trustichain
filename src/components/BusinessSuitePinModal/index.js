import React, { useState, useEffect, useRef } from 'react';
import { X, Delete } from 'lucide-react';
import './index.css';

const BusinessSuitePinModal = ({ isOpen, onClose, onVerify, mode = 'verify' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const verifyTimeoutRef = useRef(null);

  const isSetMode = mode === 'set';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
      }
    };
  }, []);

  const handleNumberPress = (number) => {
    if (loading || pin.length >= 6) return;
    const newPin = pin + number;
    setPin(newPin);
    setError('');

    if (verifyTimeoutRef.current) {
      clearTimeout(verifyTimeoutRef.current);
    }

    // Submit when 6 digits entered
    if (newPin.length === 6 && onVerify) {
      verifyTimeoutRef.current = setTimeout(() => {
        setLoading(true);
        Promise.resolve(onVerify(newPin))
          .then((isValid) => {
            if (isValid) {
              setPin('');
              setError('');
            } else {
              setError(isSetMode ? 'Could not set PIN. Please try again.' : 'Invalid PIN. Please try again.');
              setPin('');
            }
          })
          .catch(() => {
            setError('Something went wrong. Please try again.');
            setPin('');
          })
          .finally(() => {
            setLoading(false);
            if (verifyTimeoutRef.current) {
              clearTimeout(verifyTimeoutRef.current);
              verifyTimeoutRef.current = null;
            }
          });
      }, 300);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < 6; i++) {
      dots.push(
        <div
          key={i}
          className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
        />
      );
    }
    return dots;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay business-suite-pin-modal-overlay" onClick={handleClose}>
      <div className="create-escrow-modal business-suite-pin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>{isSetMode ? 'Set Business Suite PIN' : 'Business Suite Access'}</h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={handleClose}
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content business-suite-pin-content">
          <p className="business-suite-pin-description">
            {isSetMode ? 'Set your 6-digit PIN' : 'Enter your Business Suite PIN'}
          </p>

          {/* PIN Dots Display */}
          <div className={`business-suite-pin-dots-container ${loading ? 'loading' : ''}`}>
            {renderPinDots()}
          </div>

          {error && (
            <div className="business-suite-pin-error">
              {error}
            </div>
          )}

          {/* Number Pad */}
          <div className="business-suite-pin-numberpad">
            <div className="pin-numberpad-row">
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('1')}
                disabled={loading}
              >
                1
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('2')}
                disabled={loading}
              >
                2
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('3')}
                disabled={loading}
              >
                3
              </button>
            </div>
            <div className="pin-numberpad-row">
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('4')}
                disabled={loading}
              >
                4
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('5')}
                disabled={loading}
              >
                5
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('6')}
                disabled={loading}
              >
                6
              </button>
            </div>
            <div className="pin-numberpad-row">
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('7')}
                disabled={loading}
              >
                7
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('8')}
                disabled={loading}
              >
                8
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('9')}
                disabled={loading}
              >
                9
              </button>
            </div>
            <div className="pin-numberpad-row">
              <button
                type="button"
                className="pin-numberpad-key pin-numberpad-key-empty"
                disabled
              >
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('0')}
                disabled={loading}
              >
                0
              </button>
              <button
                type="button"
                className="pin-numberpad-key pin-numberpad-key-delete"
                onClick={handleDelete}
                disabled={loading}
              >
                <Delete size={24} />
              </button>
            </div>
          </div>

          <div className="business-suite-pin-actions">
            <button
              type="button"
              className="business-suite-pin-cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSuitePinModal;

