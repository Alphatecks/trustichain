import React, { useState } from 'react';
import { Check, Rocket, Shield, Zap, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import './Waitlist.css';
import logoWhite from '../assets/images/logo/logo_white.png';

const Waitlist = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store email in localStorage
      const existingEmails = JSON.parse(localStorage.getItem('waitlistEmails') || '[]');
      if (!existingEmails.includes(email)) {
        existingEmails.push(email);
        localStorage.setItem('waitlistEmails', JSON.stringify(existingEmails));
      }
      
      setIsSuccess(true);
      toast.success('Successfully joined the waitlist!');
      setEmail('');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="waitlist-page">
      <main className="waitlist-content">
        {/* Hero Section */}
        <section className="waitlist-hero-section">
          <div className="waitlist-hero-container">
            <div className="waitlist-hero-content">
              <h1 className="waitlist-hero-title">
                Join the Future of<br />
                <span className="waitlist-hero-title-blue">Secure Payments</span>
              </h1>
              <p className="waitlist-hero-description">
                Be among the first to experience TrustiChain's revolutionary escrow platform. 
                Get early access to secure, instant, and transparent blockchain-powered transactions.
              </p>

              {/* Email Form */}
              <div className="waitlist-form-container">
                {!isSuccess ? (
                  <form onSubmit={handleSubmit} className="waitlist-form">
                    <div className="waitlist-input-group">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="waitlist-input"
                        disabled={isSubmitting}
                      />
                      <button 
                        type="submit" 
                        className="waitlist-submit-button"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="waitlist-success">
                    <div className="waitlist-success-icon">
                      <Check size={32} />
                    </div>
                    <h3 className="waitlist-success-title">You're on the list!</h3>
                    <p className="waitlist-success-message">
                      We'll notify you as soon as TrustiChain launches. Get ready for secure, instant payments.
                    </p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="waitlist-another-email"
                    >
                      Join with another email
                    </button>
                  </div>
                )}
              </div>

              {/* Feature Highlights */}
              <div className="waitlist-features">
                <div className="waitlist-feature-item">
                  <div className="waitlist-feature-icon">
                    <Rocket size={40} />
                  </div>
                  <h3 className="waitlist-feature-title">Early Access</h3>
                  <p className="waitlist-feature-description">Be among the first to explore our platform</p>
                </div>
                <div className="waitlist-feature-item">
                  <div className="waitlist-feature-icon">
                    <Shield size={40} />
                  </div>
                  <h3 className="waitlist-feature-title">Secure & Safe</h3>
                  <p className="waitlist-feature-description">Blockchain-powered escrow protection</p>
                </div>
                <div className="waitlist-feature-item">
                  <div className="waitlist-feature-icon">
                    <Zap size={40} />
                  </div>
                  <h3 className="waitlist-feature-title">Instant Payments</h3>
                  <p className="waitlist-feature-description">Lightning-fast transaction processing</p>
                </div>
                <div className="waitlist-feature-item">
                  <div className="waitlist-feature-icon">
                    <Globe size={40} />
                  </div>
                  <h3 className="waitlist-feature-title">Global Reach</h3>
                  <p className="waitlist-feature-description">Transact securely anywhere in the world</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="waitlist-footer-section">
        <div className="waitlist-footer-background-text">Trustichain</div>
        <div className="waitlist-footer-container">
          <div className="waitlist-footer-content">
            <div className="waitlist-footer-left">
              <div className="waitlist-footer-brand">
                <img src={logoWhite} alt="TrustiChain Logo" className="waitlist-footer-logo" />
                <div className="waitlist-footer-brand-text">
                  <h2 className="waitlist-footer-brand-name">TrustiChain</h2>
                  <p className="waitlist-footer-tagline">XRP Ledger Escrow</p>
                </div>
              </div>
              <p className="waitlist-footer-description">
                Built on the XRP Ledger, TrustiChain delivers fast, secure, and fully compliant escrow solutions for remittance, freelance, and B2B payments.
              </p>
              
              <div className="waitlist-footer-social">
                <a href="#" className="waitlist-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="waitlist-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="waitlist-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="waitlist-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="waitlist-footer-right">
              <div className="waitlist-footer-column">
                <h3 className="waitlist-footer-column-title">Company</h3>
                <ul className="waitlist-footer-links">
                  <li><a href="#" className="waitlist-footer-link">Home</a></li>
                  <li><a href="#" className="waitlist-footer-link">Service</a></li>
                  <li><a href="#" className="waitlist-footer-link">why</a></li>
                  <li><a href="#" className="waitlist-footer-link">How it works</a></li>
                  <li><a href="#" className="waitlist-footer-link">Testimonials</a></li>
                </ul>
              </div>
              
              <div className="waitlist-footer-column">
                <h3 className="waitlist-footer-column-title">Legal Links</h3>
                <ul className="waitlist-footer-links">
                  <li><a href="#" className="waitlist-footer-link">Privacy Policy</a></li>
                  <li><a href="#" className="waitlist-footer-link">Cookie Policy</a></li>
                  <li><a href="#" className="waitlist-footer-link">Disclaimer</a></li>
                  <li><a href="#" className="waitlist-footer-link">Copyright</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="waitlist-footer-divider"></div>
          
          <div className="waitlist-footer-bottom">
            <p className="waitlist-footer-copyright">© Trustichain All Rights Reserved.</p>
            <button className="waitlist-footer-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top
              <div className="waitlist-footer-arrow-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
