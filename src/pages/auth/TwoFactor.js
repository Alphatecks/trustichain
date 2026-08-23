import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './TwoFactor.css';
import logoWhite from '../../assets/images/logo/logo_white.png';
import { completeLoginMfa } from '../../utils/mfaApi';
import { notifyAuthTokenChanged } from '../../utils/authTokenEvents';
import {
  extractTrustitagFromLoginResponse,
  isNewlyRegisteredAuthResponse,
  queueTrustitagWelcomeModal,
} from '../../utils/trustitag';

const MFA_TOKEN_KEY = 'mfa_login_token';
const MFA_EMAIL_KEY = 'mfa_login_email';

const TwoFactor = () => {
  const inputsRef = useRef([]);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer sessionStorage (set before navigate) so the MFA challenge token is never truncated vs history state.
  const mfaToken =
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(MFA_TOKEN_KEY) : '') ||
    location.state?.mfaToken ||
    '';

  useEffect(() => {
    if (location.state?.mfaToken && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(MFA_TOKEN_KEY, location.state.mfaToken);
      if (location.state.email) sessionStorage.setItem(MFA_EMAIL_KEY, location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (!mfaToken) {
      toast.error('Session expired. Please sign in again.');
      navigate('/login', { replace: true });
    }
  }, [mfaToken, navigate]);

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

  const isComplete = code.every((c) => c !== '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isComplete || !mfaToken) return;
    setIsSubmitting(true);
    try {
      const joined = code.join('');
      const mfaResult = await completeLoginMfa({
        code: joined,
        mfaToken,
      });
      const { token, refreshToken } = mfaResult;
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      } else {
        localStorage.removeItem('refresh_token');
      }
      notifyAuthTokenChanged();
      sessionStorage.removeItem(MFA_TOKEN_KEY);
      sessionStorage.removeItem(MFA_EMAIL_KEY);
      const trustitag = extractTrustitagFromLoginResponse(mfaResult.raw || {});
      if (trustitag) {
        try {
          localStorage.setItem('trustitag', trustitag);
        } catch (_) {
          /* ignore */
        }
        queueTrustitagWelcomeModal(trustitag, {
          newlyRegistered: isNewlyRegisteredAuthResponse(mfaResult.raw || {}),
        });
      }
      toast.success('Signed in');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Verification failed');
      setCode(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="twofactor-page">
      <div className="twofactor-logo-container">
        <img src={logoWhite} alt="TrustiChain Logo" className="twofactor-logo" />
        <div className="twofactor-brand-text">
          <h2 className="twofactor-brand-name">TrustiChain</h2>
          <p className="twofactor-tagline">XRP Ledger Escrow</p>
        </div>
      </div>

      <div className="twofactor-card">
        <h1 className="twofactor-header">Sign in with Google Authenticator</h1>
        <p className="twofactor-description">
          Enter the 6-digit code from <strong>Google Authenticator</strong> (time-based / TOTP).
        </p>

        <form onSubmit={handleSubmit} className="twofactor-form">
          <div className="twofactor-inputs">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                className="twofactor-input"
                value={digit}
                onChange={(e) => onChange(i, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => onKeyDown(i, e)}
                required
                disabled={isSubmitting}
              />
            ))}
          </div>

          <button
            type="submit"
            className="twofactor-primary-button"
            disabled={!isComplete || isSubmitting}
          >
            {isSubmitting ? 'Verifying…' : 'Continue'}
          </button>
        </form>

        <div className="twofactor-footer">
          <Link to="/login" className="twofactor-footer-link">
            Sign in another way
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TwoFactor;
