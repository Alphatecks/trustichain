import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, KeyRound } from 'lucide-react';
import './Login.css';
import logoWhite from '../../assets/images/logo/logo_white.png';
import googleLogo from '../../assets/images/icons/google-logo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
    console.log('Login attempt:', { email, password, rememberMe });
    // Navigate to two-factor screen after entering credentials
    navigate('/two-factor');
  };

  return (
    <div className="login-page">
      <div className="login-logo-container">
        <img src={logoWhite} alt="TrustiChain Logo" className="login-logo" />
        <div className="login-brand-text">
          <h2 className="login-brand-name">TrustiChain</h2>
          <p className="login-tagline">XRP Ledger Escrow</p>
        </div>
      </div>

      <div className="login-card">
        <h1 className="login-header">Sign in to your account</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label htmlFor="email" className="login-label">Email</label>
            <div className="login-input-wrapper">
              <Mail className="login-input-icon" size={20} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="login-input-group">
            <div className="login-password-header">
              <label htmlFor="password" className="login-label">Password</label>
              <Link to="/forgot-password" className="login-forgot-link">Forgot your password?</Link>
            </div>
            <div className="login-input-wrapper">
              <Lock className="login-input-icon" size={20} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="login-checkbox-group">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-checkbox"
              />
              <span className="login-checkbox-text">Remember me on this device</span>
            </label>
          </div>

          <button type="submit" className="login-primary-button">
            Sign in
          </button>
        </form>

        <div className="login-divider">
          <div className="login-divider-line"></div>
          <span className="login-divider-text">OR</span>
          <div className="login-divider-line"></div>
        </div>

        <div className="login-secondary-buttons">
          <button className="login-secondary-button">
            <img src={googleLogo} alt="Google" className="google-logo-icon" />
            Sign in with Google
          </button>
          <button className="login-secondary-button">
            <KeyRound size={20} />
            Sign in with passkey
          </button>
          <button className="login-secondary-button">
            <Shield size={20} />
            Sign in with SSO
          </button>
        </div>

        <div className="login-footer">
          <span className="login-footer-text">New to TrustiChain?</span>
          <Link to="/signup" className="login-footer-link">Create account</Link>
        </div>
      </div>

      <div className="login-security-warning">
        <Lock size={16} className="login-security-icon" />
        <p className="login-security-text">
          Only install browser extensions from companies you trust. Malicious browser extensions can compromise your security by reading your passwords.
        </p>
      </div>
    </div>
  );
};

export default Login;

