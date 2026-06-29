import React, { useEffect, useRef, useState } from 'react';
import { X, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import './index.css';

const CODE_LENGTH = 4;
const RESEND_SECONDS = 30;

function ChangePasscodeModal({ isOpen, onClose, step = 'email', defaultEmail = '' }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(() => Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!isOpen) return undefined;

    setEmail(defaultEmail || '');
    setCode(Array(CODE_LENGTH).fill(''));
    setFocusedIndex(0);
    setResendSeconds(RESEND_SECONDS);

    const timer = window.setTimeout(() => {
      inputsRef.current[0]?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, defaultEmail, step]);

  useEffect(() => {
    if (!isOpen || step !== 'code') return undefined;

    const interval = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email');
      return;
    }
    toast('Passcode change coming soon');
    onClose();
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!code.every((digit) => digit !== '')) {
      toast.error('Please enter the full code');
      return;
    }
    toast('PIN change coming soon');
    onClose();
  };

  const handleResend = () => {
    if (resendSeconds > 0) return;
    setResendSeconds(RESEND_SECONDS);
    setCode(Array(CODE_LENGTH).fill(''));
    inputsRef.current[0]?.focus();
    setFocusedIndex(0);
    toast.success('Verification code resent');
  };

  return (
    <div
      className="change-passcode-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="change-passcode-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-passcode-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="change-passcode-header">
          <h2 id="change-passcode-title">Change Passcode</h2>
          <button
            type="button"
            className="change-passcode-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <div className="change-passcode-body">
          {step === 'email' ? (
            <form className="change-passcode-form" onSubmit={handleEmailSubmit}>
              <label className="change-passcode-label" htmlFor="change-passcode-email">
                Email
              </label>
              <input
                id="change-passcode-email"
                type="email"
                className="change-passcode-input"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button type="submit" className="change-passcode-submit">
                Create
              </button>
            </form>
          ) : (
            <form className="change-passcode-form change-passcode-form--code" onSubmit={handleCodeSubmit}>
              <p className="change-passcode-subtitle">Enter code sent to your email</p>

              <div className="change-passcode-otp-row" role="group" aria-label="Verification code">
                {code.map((digit, index) => (
                  <div
                    key={index}
                    className={`change-passcode-otp-cell${focusedIndex === index ? ' is-focused' : ''}${digit ? ' is-filled' : ''}`}
                  >
                    <span className="change-passcode-otp-dash" aria-hidden>
                      {digit || '—'}
                    </span>
                    <input
                      ref={(el) => {
                        inputsRef.current[index] = el;
                      }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      className="change-passcode-otp-input"
                      value={digit}
                      aria-label={`Digit ${index + 1}`}
                      onFocus={() => setFocusedIndex(index)}
                      onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    />
                  </div>
                ))}
              </div>

              <p className="change-passcode-resend">
                <button
                  type="button"
                  className="change-passcode-resend-btn"
                  onClick={handleResend}
                  disabled={resendSeconds > 0}
                >
                  Resend,
                  {resendSeconds > 0 ? (
                    <span className="change-passcode-resend-timer"> {resendSeconds}s</span>
                  ) : null}
                </button>
              </p>

              <button type="submit" className="change-passcode-submit">
                Next
              </button>
            </form>
          )}

          <p className="change-passcode-info">
            <Info size={16} aria-hidden />
            <span>You wont be able to make changes in 30days</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChangePasscodeModal;
