import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';
import logo from '../../assets/images/icons/logo.png';
import keyVisual from '../../assets/images/backgrounds/key.png';
import googleLogo from '../../assets/images/icons/google-logo.svg';
import socIcon from '../../assets/images/icons/SOC.png';
import encryptionIcon from '../../assets/images/icons/Encryption.png';
import kycIcon from '../../assets/images/icons/kyc.png';
import auditIcon from '../../assets/images/icons/audit.png';
import { getApiUrl } from '../../utils/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || data.error || 'Login failed');
        return;
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <section className="login-left">
          <div className="login-branding">
            <img src={logo} alt="TrustiChain logo" className="login-brand-logo" />
            <span className="login-brand-name">TrustiChain</span>
          </div>

          <div className="login-card">
            <div className="login-tabs">
              <button className="login-tab active" type="button">
                Sign in
              </button>
              <Link to="/signup" className="login-tab">
                Sign Up
              </Link>
            </div>

            <div className="login-social-buttons">
              <button type="button" className="login-social-btn">
                <img src={googleLogo} alt="Google" />
                Sign in with Google
              </button>
              <button type="button" className="login-social-btn">
                <KeyRound size={18} />
                Sign in with passkey
              </button>
              <button type="button" className="login-social-btn">
                <Shield size={18} />
                Sign in with SSO
              </button>
            </div>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <div className="login-welcome">
              <h2>Welcome Back!</h2>
              <p>We are so excited to see you again!</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="login-field">
                <div className="login-field-header">
                  <span>Password</span>
                  <Link to="/forgot-password">Forgotten Password?</Link>
                </div>
                <div className="login-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <button type="submit" className="login-primary-btn" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <label className="login-security-note">
              <input type="checkbox" defaultChecked readOnly />
              <p>
                Only install browser extensions from companies you trust. Malicious browser extensions can
                compromise your security by reading your passwords.
              </p>
            </label>
          </div>
        </section>

        <aside className="login-hero">
          <div className="login-hero-inner">
            <p className="login-hero-eyebrow">Get Instant</p>
            <h1>Your All-in-One Blockchain Escrow Solution</h1>
            <div className="login-hero-image">
              <img src={keyVisual} alt="Key and shield illustration" />
            </div>
            <div className="login-hero-badges">
              <div className="login-hero-badge">
                <img src={socIcon} alt="SOC 2" />
                <div>
                  <h4>SOC 2 Compliant</h4>
                  <p>Independently audited for trust and reliability.</p>
                </div>
              </div>
              <div className="login-hero-badge">
                <img src={encryptionIcon} alt="Encryption" />
                <div>
                  <h4>256-bit Encryption</h4>
                  <p>Advanced encryption ensuring total transaction privacy.</p>
                </div>
              </div>
              <div className="login-hero-badge">
                <img src={kycIcon} alt="KYC/AML" />
                <div>
                  <h4>KYC/AML Verified</h4>
                  <p>Every user is identity-verified to prevent fraud.</p>
                </div>
              </div>
              <div className="login-hero-badge">
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

export default Login;

