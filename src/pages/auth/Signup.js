import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Globe, Shield } from 'lucide-react';
import './Signup.css';
import logoWhite from '../../assets/images/logo/logo_white.png';
import googleLogo from '../../assets/images/icons/google-logo.svg';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('US');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle signup logic here
    console.log('Signup attempt:', { email, fullName, password, confirmPassword, country, emailOptIn });
    navigate('/otp');
  };

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
  ];

  return (
    <div className="signup-page">
      <div className="signup-logo-container">
        <img src={logoWhite} alt="TrustiChain Logo" className="signup-logo" />
        <div className="signup-brand-text">
          <h2 className="signup-brand-name">TrustiChain</h2>
          <p className="signup-tagline">XRP Ledger Escrow</p>
        </div>
      </div>

      <div className="signup-container">
        {/* Left Column - Informational */}
        <div className="signup-info-column">
          <div className="signup-info-section">
            <div className="signup-trail-marker"></div>
            <h3 className="signup-info-heading">Get started quickly</h3>
            <p className="signup-info-description">
              Integrate with developer-friendly APIs or choose low-code or pre-built solutions.
            </p>
          </div>
          
          <div className="signup-trail-connector"></div>
          
          <div className="signup-info-section">
            <div className="signup-trail-marker"></div>
            <h3 className="signup-info-heading">Secure blockchain escrow</h3>
            <p className="signup-info-description">
              Ecommerce, subscriptions, and more—all secured on the XRP Ledger with instant settlements.
            </p>
          </div>
          
          <div className="signup-trail-connector"></div>
          
          <div className="signup-info-section">
            <div className="signup-trail-marker"></div>
            <h3 className="signup-info-heading">Trusted by innovators</h3>
            <p className="signup-info-description">
              TrustiChain is trusted by ambitious startups and enterprises of every size.
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="signup-form-column">
          <div className="signup-card">
            <h1 className="signup-header">Create your TrustiChain account</h1>

            <form onSubmit={handleSubmit} className="signup-form">
              <div className="signup-input-group">
                <label htmlFor="email" className="signup-label">Email</label>
                <div className="signup-input-wrapper">
                  <Mail className="signup-input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="signup-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="fullName" className="signup-label">Full name</label>
                <div className="signup-input-wrapper">
                  <User className="signup-input-icon" size={20} />
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="signup-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="password" className="signup-label">Password</label>
                <div className="signup-input-wrapper">
                  <Lock className="signup-input-icon" size={20} />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="signup-input"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="confirmPassword" className="signup-label">Confirm password</label>
                <div className="signup-input-wrapper">
                  <Lock className="signup-input-icon" size={20} />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="signup-input"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div className="signup-input-group">
                <label htmlFor="country" className="signup-label">Country</label>
                <div className="signup-input-wrapper">
                  <Globe className="signup-input-icon" size={20} />
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="signup-select"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="signup-checkbox-group">
                <label className="signup-checkbox-label">
                  <input
                    type="checkbox"
                    checked={emailOptIn}
                    onChange={(e) => setEmailOptIn(e.target.checked)}
                    className="signup-checkbox"
                  />
                  <span className="signup-checkbox-text">
                    Get emails from TrustiChain about product updates, industry news, and events. You can unsubscribe at any time. 
                    <Link to="/privacy" className="signup-checkbox-link"> Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button type="submit" className="signup-primary-button">
                Create account
              </button>
            </form>

            <div className="signup-divider">
              <div className="signup-divider-line"></div>
              <span className="signup-divider-text">OR</span>
              <div className="signup-divider-line"></div>
            </div>

            <div className="signup-secondary-buttons">
              <button className="signup-secondary-button">
                <img src={googleLogo} alt="Google" className="google-logo-icon" />
                Sign up with Google
              </button>
            </div>

            <div className="signup-footer">
              <span className="signup-footer-text">Already have an account?</span>
              <Link to="/login" className="signup-footer-link">Sign in</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="signup-security-warning">
        <Shield size={16} className="signup-security-icon" />
        <p className="signup-security-text">
          Only install browser extensions from companies you trust. Malicious browser extensions can compromise your security by reading your passwords.
        </p>
      </div>
    </div>
  );
};

export default Signup;

