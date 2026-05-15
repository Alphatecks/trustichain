import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import logo from '../../assets/images/icons/logo.png';
import './index.css';

const BusinessSuitePinModal = ({ isOpen, onClose, onVerify, mode = 'verify' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const isSetMode = mode === 'set';

  useEffect(() => {
    if (!isOpen) return;
    setPin('');
    setError('');
    const t = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [isOpen]);

  const handlePinChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(v);
    setError('');
  };

  const handleOverlayClick = () => {
    if (loading) return;
    setPin('');
    setError('');
    onClose();
  };

  const handleNext = () => {
    if (loading || pin.length !== 6 || !onVerify) return;
    setLoading(true);
    Promise.resolve(onVerify(pin))
      .then((isValid) => {
        if (isValid) {
          setPin('');
          setError('');
        } else {
          setError(isSetMode ? 'Could not set PIN. Please try again.' : 'Invalid PIN. Please try again.');
          setPin('');
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      })
      .catch(() => {
        setError('Something went wrong. Please try again.');
        setPin('');
        requestAnimationFrame(() => inputRef.current?.focus());
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!isOpen) {
    return null;
  }

  const title = isSetMode ? 'Create Passcode' : 'Enter Passcode';

  return (
    <div className="bs-pin-passcode-overlay" onClick={handleOverlayClick} role="presentation">
      <div
        className="bs-pin-passcode-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bs-pin-passcode-title"
      >
        <div className="bs-pin-passcode-brand">
          <div className="bs-pin-passcode-logo-tile">
            <img src={logo} alt="" className="bs-pin-passcode-logo" />
          </div>
          <h2 id="bs-pin-passcode-title" className="bs-pin-passcode-title">
            {title}
          </h2>
          <p className="bs-pin-passcode-subtitle">Enter your pin</p>
        </div>

        <div className="bs-pin-passcode-pin-area">
          <div className="bs-pin-passcode-dots" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span
                key={i}
                className={`bs-pin-passcode-dot ${i < pin.length ? 'bs-pin-passcode-dot--filled' : ''}`}
              />
            ))}
          </div>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            className="bs-pin-passcode-overlay-input"
            value={pin}
            onChange={handlePinChange}
            disabled={loading}
            aria-label="Six digit PIN"
          />
        </div>

        {error ? <p className="bs-pin-passcode-error">{error}</p> : <div className="bs-pin-passcode-error-spacer" />}

        <button
          type="button"
          className="bs-pin-passcode-next"
          onClick={handleNext}
          disabled={pin.length !== 6 || loading}
        >
          {loading ? 'Please wait…' : 'Next'}
        </button>

        <div className="bs-pin-passcode-footnote-wrap">
          {isSetMode ? (
            <div className="bs-pin-passcode-footnote">
              <span className="bs-pin-passcode-footnote-icon" aria-hidden="true">
                <Info size={16} strokeWidth={2} />
              </span>
              <span>You won&apos;t be able to make changes for 30 days.</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BusinessSuitePinModal;
