import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
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
import { extractTrustitagFromLoginResponse, queueTrustitagWelcomeModal } from '../../utils/trustitag';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
      console.log('Login response:', data);
      console.log('Login response keys:', Object.keys(data));
      console.log('Login response JSON:', JSON.stringify(data, null, 2));

      const requiresMfa =
        data.requiresMfa === true ||
        data.requires_mfa === true ||
        data.requiresTwoFactor === true ||
        data.requires_two_factor === true ||
        data.mfaRequired === true ||
        data.requireMfa === true ||
        data.data?.requiresMfa === true ||
        data.data?.requires_mfa === true ||
        data.data?.requiresTwoFactor === true;

      const nested = data.data && typeof data.data === 'object' ? data.data : {};
      const mfaToken =
        data.mfaToken ||
        data.twoFactorToken ||
        data.tempToken ||
        data.mfa_token ||
        data.two_factor_token ||
        nested.mfaToken ||
        nested.twoFactorToken ||
        nested.mfa_token ||
        nested.tempToken ||
        nested.two_factor_token ||
        data.data?.mfaToken ||
        data.data?.twoFactorToken ||
        data.data?.tempToken ||
        data.data?.mfa_token;

      if (requiresMfa) {
        if (!mfaToken) {
          toast.error(data.message || 'Two-factor sign-in is required but the server did not send a verification token.');
          return;
        }
        try {
          sessionStorage.setItem('mfa_login_token', String(mfaToken).trim());
          sessionStorage.setItem('mfa_login_email', String(email || '').trim());
        } catch (_) {
          /* ignore quota / private mode */
        }
        navigate('/two-factor', { state: { mfaToken: String(mfaToken).trim(), email } });
        return;
      }

      if (!response.ok || !data.success) {
        toast.error(data.message || data.error || 'Login failed');
        return;
      }

      // Store access + refresh (backend: data.accessToken / data.refreshToken)
      let tokenFound = false;

      const storePair = (access, refresh) => {
        if (!access) return false;
        localStorage.setItem('token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
        else localStorage.removeItem('refresh_token');
        return true;
      };

      if (data.data?.accessToken) {
        tokenFound = storePair(data.data.accessToken, data.data.refreshToken);
        if (tokenFound) console.log('Token stored from data.data.accessToken');
      } else if (data.data?.access_token) {
        tokenFound = storePair(data.data.access_token, data.data.refresh_token);
        if (tokenFound) console.log('Token stored from data.data.access_token');
      } else if (data.accessToken) {
        tokenFound = storePair(data.accessToken, data.refreshToken);
        if (tokenFound) console.log('Token stored from data.accessToken');
      } else if (data.access_token) {
        tokenFound = storePair(data.access_token, data.refresh_token);
        if (tokenFound) console.log('Token stored from data.access_token');
      } else if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Token stored from data.token');
        tokenFound = true;
      } else if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        console.log('Token stored from data.data.token');
        tokenFound = true;
      } else if (data.user?.token) {
        localStorage.setItem('token', data.user.token);
        console.log('Token stored from data.user.token');
        tokenFound = true;
      } else if (data.auth?.token) {
        localStorage.setItem('token', data.auth.token);
        console.log('Token stored from data.auth.token');
        tokenFound = true;
      } else if (data.result?.token) {
        localStorage.setItem('token', data.result.token);
        console.log('Token stored from data.result.token');
        tokenFound = true;
      } else if (data.user?.accessToken) {
        localStorage.setItem('token', data.user.accessToken);
        console.log('Token stored from data.user.accessToken');
        tokenFound = true;
      } else if (data.user?.access_token) {
        localStorage.setItem('token', data.user.access_token);
        console.log('Token stored from data.user.access_token');
        tokenFound = true;
      }

      if (!tokenFound) {
        console.warn('No token found in login response. Full response structure:');
        console.warn('Response keys:', Object.keys(data));
        if (data.data) {
          console.warn('data.data keys:', Object.keys(data.data));
        }
        if (data.user) {
          console.warn('data.user keys:', Object.keys(data.user));
        }
        console.warn('Full response object:', JSON.stringify(data, null, 2));
      }

      const trustitag = extractTrustitagFromLoginResponse(data);
      if (trustitag) {
        try {
          localStorage.setItem('trustitag', trustitag);
        } catch (_) {
          /* ignore */
        }
        queueTrustitagWelcomeModal(trustitag);
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

  const handleGoogleSignIn = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple clicks
    if (isGoogleLoading) {
      return;
    }
    
    setIsGoogleLoading(true);
    
    try {
      // Include redirect_uri so backend knows where to send user after OAuth
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const googleAuthUrl = `${getApiUrl('api/auth/google')}?redirect_uri=${encodeURIComponent(redirectUri)}`;
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error('Error initiating Google sign in:', error);
      toast.error('Failed to initiate Google sign in');
      setIsGoogleLoading(false);
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

            <div className="login-divider">
              <span>OR</span>
            </div>

            <div className="login-social-buttons">
              <button 
                type="button" 
                className="login-social-btn" 
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                <img src={googleLogo} alt="Google" />
                {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
              </button>
              <button type="button" className="login-social-btn">
                <img
                  className="login-apple-logo"
                  src="https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png"
                  alt="Apple"
                />
                Sign in with Apple
              </button>
              <button type="button" className="login-social-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/X-Logo-Round-Color.png" alt="X" />
                Sign in with X
              </button>
            </div>

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

