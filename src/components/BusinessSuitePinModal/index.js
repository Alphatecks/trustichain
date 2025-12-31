import React, { useState, useEffect, useRef } from 'react';
import { X, Delete } from 'lucide-react';
import './index.css';

const BusinessSuitePinModal = ({ isOpen, onClose, onVerify }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const verifyTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
      }
    };
  }, []);

  const handleNumberPress = (number) => {
    if (pin.length < 6) {
      const newPin = pin + number;
      setPin(newPin);
      setError('');
      
      // Clear any pending verification
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
      }

      // Auto-verify when PIN reaches 4 digits (minimum) or 6 digits (max length)
      // Wait a bit to see if user continues typing
      if (newPin.length >= 4 && onVerify) {
        verifyTimeoutRef.current = setTimeout(() => {
          const isValid = onVerify(newPin);
          if (isValid) {
            // PIN is valid - the parent component will close the modal
            setPin('');
            setError('');
          } else if (newPin.length === 6) {
            // Only show error if we've reached max length and it's still invalid
            setError('Invalid PIN. Please try again.');
            setPin('');
          }
        }, newPin.length === 6 ? 300 : 800); // Shorter delay for 6 digits, longer for 4-5 to allow typing
      }
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
          <h2>Business Suite Access</h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={handleClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content business-suite-pin-content">
          <p className="business-suite-pin-description">
            Enter your Business Suite PIN
          </p>

          {/* PIN Dots Display */}
          <div className="business-suite-pin-dots-container">
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
              >
                1
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('2')}
              >
                2
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('3')}
              >
                3
              </button>
            </div>
            <div className="pin-numberpad-row">
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('4')}
              >
                4
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('5')}
              >
                5
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('6')}
              >
                6
              </button>
            </div>
            <div className="pin-numberpad-row">
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('7')}
              >
                7
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('8')}
              >
                8
              </button>
              <button
                type="button"
                className="pin-numberpad-key"
                onClick={() => handleNumberPress('9')}
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
              >
                0
              </button>
              <button
                type="button"
                className="pin-numberpad-key pin-numberpad-key-delete"
                onClick={handleDelete}
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

