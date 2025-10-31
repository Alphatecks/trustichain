import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import './ForgotPassword.css';
import logoWhite from '../../assets/images/logo/logo_white.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle forgot password logic here
    console.log('Password reset requested for:', email);
    setIsSubmitted(true);
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-logo-container">
        <img src={logoWhite} alt="TrustiChain Logo" className="forgot-password-logo" />
        <div className="forgot-password-brand-text">
          <h2 className="forgot-password-brand-name">TrustiChain</h2>
          <p className="forgot-password-tagline">XRP Ledger Escrow</p>
        </div>
      </div>

      <div className="forgot-password-card">
        <h1 className="forgot-password-header">Reset your password</h1>
        
        {!isSubmitted ? (
          <>
            <p className="forgot-password-description">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="forgot-password-input-group">
                <label htmlFor="email" className="forgot-password-label">Email</label>
                <div className="forgot-password-input-wrapper">
                  <Mail className="forgot-password-input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="forgot-password-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="forgot-password-primary-button">
                Continue
              </button>
            </form>
          </>
        ) : (
          <div className="forgot-password-success">
            <div className="forgot-password-success-icon">
              <Mail size={40} />
            </div>
            <h2 className="forgot-password-success-title">Check your email</h2>
            <p className="forgot-password-success-message">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
        )}

        <div className="forgot-password-footer">
          <Link to="/login" className="forgot-password-footer-link">Return to sign in</Link>
          <span className="forgot-password-footer-separator">•</span>
          <Link to="/signup" className="forgot-password-footer-link">New to TrustiChain? Create account</Link>
        </div>
      </div>

      <div className="forgot-password-security-warning">
        <Lock size={16} className="forgot-password-security-icon" />
        <p className="forgot-password-security-text">
          Only install browser extensions from companies you trust. Malicious browser extensions can compromise your security by reading your passwords.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

