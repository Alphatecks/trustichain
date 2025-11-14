import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import './Signup.css';
import logo from '../../assets/images/icons/logo.png';
import keyVisual from '../../assets/images/backgrounds/key.png';
import googleLogo from '../../assets/images/icons/google-logo.svg';
import socIcon from '../../assets/images/icons/SOC.png';
import encryptionIcon from '../../assets/images/icons/Encryption.png';
import kycIcon from '../../assets/images/icons/kyc.png';
import auditIcon from '../../assets/images/icons/audit.png';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword || !agreeTerms) {
      return;
    }
    console.log('Signup attempt:', { fullName, email });
    navigate('/otp');
  };

  return (
    <div className="signup-page">
      <div className="signup-content">
        <section className="signup-left">
          <div className="signup-branding">
            <img src={logo} alt="TrustiChain logo" className="signup-brand-logo" />
            <span className="signup-brand-name">TrustiChain</span>
          </div>

          <div className="signup-card">
            <div className="signup-tabs">
              <Link to="/login" className="signup-tab">
                Sign in
              </Link>
              <button className="signup-tab active" type="button">
                Sign Up
              </button>
            </div>

            <button type="button" className="signup-social-btn">
              <img src={googleLogo} alt="Google" />
              Sign in with Google
            </button>

            <div className="signup-divider">
              <span>OR</span>
            </div>

            <div className="signup-welcome">
              <h2>Welcome Back!</h2>
              <p>We are so excited to see you again!</p>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="signup-field">
                <span>Full Name</span>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>

              <label className="signup-field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="signup-field">
                <span>Password</span>
                <div className="signup-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="signup-field">
                <span>Confirm Password</span>
                <div className="signup-password-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="signup-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button type="submit" className="signup-primary-btn" disabled={!agreeTerms}>
                Sign In
              </button>
            </form>

            <label className="signup-terms">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>Agree to terms and condition</span>
            </label>
          </div>
        </section>

        <aside className="signup-hero">
          <div className="signup-hero-inner">
            <p className="signup-hero-eyebrow">Get Instant</p>
            <h1>Your All-in-One Blockchain Escrow Solution</h1>
            <div className="signup-hero-image">
              <img src={keyVisual} alt="Key and shield illustration" />
            </div>
            <div className="signup-hero-badges">
              <div className="signup-hero-badge">
                <img src={socIcon} alt="SOC 2" />
                <div>
                  <h4>SOC 2 Compliant</h4>
                  <p>Independently audited for trust and reliability.</p>
                </div>
              </div>
              <div className="signup-hero-badge">
                <img src={encryptionIcon} alt="Encryption" />
                <div>
                  <h4>256-bit Encryption</h4>
                  <p>Advanced encryption ensuring total transaction privacy.</p>
                </div>
              </div>
              <div className="signup-hero-badge">
                <img src={kycIcon} alt="KYC/AML" />
                <div>
                  <h4>KYC/AML Verified</h4>
                  <p>Every user is identity-verified to prevent fraud.</p>
                </div>
              </div>
              <div className="signup-hero-badge">
                <img src={auditIcon} alt="Audit trail" />
                <div>
                  <h4>Audit Trail</h4>
                  <p>Every transaction recorded for full transparency.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Signup;

