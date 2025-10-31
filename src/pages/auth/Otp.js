import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Otp.css';
import logoWhite from '../../assets/images/logo/logo_white.png';

const Otp = () => {
  const inputsRef = useRef([]);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();

  const onChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prev = inputsRef.current[index - 1];
      prev?.focus();
    }
  };

  const isComplete = code.every(c => c !== '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isComplete) return;
    console.log('OTP code:', code.join(''));
    navigate('/dashboard');
  };

  return (
    <div className="otp-page">
      <div className="otp-logo-container">
        <img src={logoWhite} alt="TrustiChain Logo" className="otp-logo" />
        <div className="otp-brand-text">
          <h2 className="otp-brand-name">TrustiChain</h2>
          <p className="otp-tagline">XRP Ledger Escrow</p>
        </div>
      </div>

      <div className="otp-card">
        <h1 className="otp-header">Verify your email</h1>
        <p className="otp-description">
          Enter the 6-digit verification code sent to your email address.
        </p>

        <form onSubmit={handleSubmit} className="otp-form">
          <div className="otp-inputs">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => inputsRef.current[i] = el}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${i === 3 ? 'spaced' : ''}`}
                value={digit}
                onChange={(e) => onChange(i, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => onKeyDown(i, e)}
                required
              />
            ))}
          </div>

          <button type="submit" className="otp-primary-button" disabled={!isComplete}>
            Continue
          </button>
        </form>

        <div className="otp-footer">
          <Link to="/signup" className="otp-footer-link">Back to sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default Otp;

