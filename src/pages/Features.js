import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Features.css';
import logoWhite from '../assets/images/logo/logo_white.png';

const Features = () => {
  return (
    <div className="features-page">
      <main className="features-content">
        {/* Hero Section */}
        <section className="features-hero-section">
          <div className="features-hero-container">
            <h1 className="features-hero-title">
              Powerful Feature Built for<br />
              <span className="features-hero-title-blue">Secure Digital payment</span>
            </h1>
            <p className="features-hero-description">
              Explore how TrustiChain combines blockchain security, speed, and compliance to simplify every transaction.
            </p>
            <div className="features-hero-actions">
              <Link to="/create" className="features-cta-button primary">
                Get started
                <ArrowRight className="features-button-icon" />
              </Link>
              <button className="features-cta-button secondary">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="features-stats-section">
          <div className="features-stats-container">
            <div className="features-stats-grid">
              <div className="features-stat-card">
                <div className="features-stat-number blue">$50M+</div>
                <div className="features-stat-label">Total Volume Secured</div>
              </div>
              <div className="features-stat-card">
                <div className="features-stat-number green">99.8%</div>
                <div className="features-stat-label">Success Rate</div>
              </div>
              <div className="features-stat-card">
                <div className="features-stat-number purple">25K+</div>
                <div className="features-stat-label">Active Users</div>
              </div>
              <div className="features-stat-card">
                <div className="features-stat-number cyan">4.2s</div>
                <div className="features-stat-label">Avg Settlement Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Section - Enterprise Protection */}
        <section className="features-protection-section">
          <div className="features-protection-container">
            <div className="features-protection-header">
              <h3 className="features-protection-subtitle">Why</h3>
              <h2 className="features-protection-title">Enterprise-Grade Protection for Every Transaction</h2>
              <p className="features-protection-description">
                Your transactions are protected by advanced encryption, multi-sig wallets, and audited smart contracts — ensuring bank-level security with blockchain transparency.
              </p>
            </div>

            <div className="features-protection-cards">
              <div className="features-protection-card">
                <img src={require('../assets/images/icons/SOC.png')} alt="SOC 2" className="features-protection-icon" />
                <h3 className="features-protection-card-title">SOC 2 Compliant</h3>
                <p className="features-protection-card-description">Independently audited for trust and reliability.</p>
              </div>

              <div className="features-protection-card">
                <img src={require('../assets/images/icons/Encryption.png')} alt="256-bit Encryption" className="features-protection-icon" />
                <h3 className="features-protection-card-title">256-bit Encryption</h3>
                <p className="features-protection-card-description">Advanced encryption ensuring total transaction privacy.</p>
              </div>

              <div className="features-protection-card">
                <img src={require('../assets/images/icons/kyc.png')} alt="KYC/AML" className="features-protection-icon" />
                <h3 className="features-protection-card-title">KYC/AML Verified</h3>
                <p className="features-protection-card-description">Every user is identity-verified to prevent fraud and ensure compliance.</p>
              </div>

              <div className="features-protection-card">
                <img src={require('../assets/images/icons/audit.png')} alt="Audit Trail" className="features-protection-icon" />
                <h3 className="features-protection-card-title">Audit Trail</h3>
                <p className="features-protection-card-description">Every transaction recorded for full transparency.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="features-how-it-works-section">
          <div className="features-how-it-works-container">
            <div className="features-how-header">
              <h3 className="features-how-subtitle">How it works</h3>
              <h2 className="features-how-main-title">See how Trustichain works</h2>
            </div>
            
            <div className="features-steps-grid-container">
              <div className="features-steps-grid">
                <div className="features-step-item">
                  <div className="features-step-number">1</div>
                  <h3 className="features-step-title">Create an Escrow</h3>
                  <p className="features-step-description">Start by setting up a secure escrow for your transaction, choose amount, duration, and recipient.</p>
                </div>
                
                <div className="features-step-item">
                  <div className="features-step-number">2</div>
                  <h3 className="features-step-title">Deposit Funds</h3>
                  <p className="features-step-description">Transfer funds into the escrow wallet. Your money stays locked and protected until delivery is confirmed.</p>
                </div>
                
                <div className="features-step-item">
                  <div className="features-step-number">3</div>
                  <h3 className="features-step-title">Deliver & Confirm</h3>
                  <p className="features-step-description">Once the service or goods are delivered, the buyer confirms completion directly in-app.</p>
                </div>
                
                <div className="features-step-item">
                  <div className="features-step-number">4</div>
                  <h3 className="features-step-title">Release or Resolve</h3>
                  <p className="features-step-description">Funds are instantly released to the seller or, if there's an issue, a dispute can be opened for fair resolution.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="features-about-section">
          <div className="features-about-container">
            <div className="features-about-header">
              <h2 className="features-about-title">About</h2>
              <div className="features-about-description">
                <p>TrustiChain is a Web3 escrow and remittance platform built on the XRP Ledger, designed to make global payments secure, instant, and transparent.</p>
                <p>We empower freelancers, businesses, and traders to transact confidently, protected by blockchain technology, smart contracts, and verified compliance standards.</p>
              </div>
            </div>

            <div className="features-about-stats">
              <div className="features-stat-card">
                <div className="features-stat-number blue">$50M+</div>
                <div className="features-stat-label">Total Volume Secured</div>
              </div>
              <div className="features-stat-card">
                <div className="features-stat-number green">99.8%</div>
                <div className="features-stat-label">Success Rate</div>
              </div>
              <div className="features-stat-card">
                <div className="features-stat-number purple">25K+</div>
                <div className="features-stat-label">Active Users</div>
              </div>
              <div className="features-stat-card">
                <div className="features-stat-number cyan">4.2s</div>
                <div className="features-stat-label">Avg Settlement Time</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial/Trust Section */}
        <section className="features-testimonial-section">
          <div className="features-testimonial-container">
            <div className="features-testimonial-content">
              <div className="features-testimonial-cards">
                <div className="features-testimonial-card soc-card">
                  <img src={require('../assets/images/icons/SOC.png')} alt="SOC 2" className="features-testimonial-icon" />
                  <h3 className="features-testimonial-card-title">SOC 2 Compliant</h3>
                  <p className="features-testimonial-card-description">Independently audited for trust and reliability.</p>
                </div>

                <div className="features-testimonial-card encryption-card">
                  <img src={require('../assets/images/icons/Encryption.png')} alt="256-bit Encryption" className="features-testimonial-icon" />
                  <h3 className="features-testimonial-card-title">256-bit Encryption</h3>
                  <p className="features-testimonial-card-description">Advanced encryption ensuring total transaction privacy.</p>
                </div>
              </div>

              <div className="features-testimonial-image-wrapper">
                <div className="features-testimonial-background-text">TrustiChain</div>
                <img src={require('../assets/images/backgrounds/woman.png')} alt="Trusted by users" className="features-testimonial-image" />
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="features-final-cta-section">
          <div className="features-final-cta-container">
            <h3 className="features-final-cta-subtitle">Features</h3>
            <h1 className="features-final-cta-title">
              Your All-in-One Blockchain Escrow<br />
              <span className="features-final-cta-title-blue">Solution</span>
            </h1>
            <p className="features-final-cta-description">
              TrustiChain provides secure, transparent, and instant escrow services powered by blockchain technology. 
              Protect your transactions with smart contracts, verified compliance, and bank-level security for every payment.
            </p>
          </div>
        </section>

        {/* Remittance Section */}
        <section className="features-remittance-section">
          <div className="features-remittance-container">
            <div className="features-remittance-content">
              <div className="features-remittance-left">
                <h2 className="features-remittance-title">Remittance Reinvented, Powered by the XRP Ledger</h2>
                <p className="features-remittance-description">
                  Experience instant, low-cost international transfers powered by the XRP Ledger, secure, transparent, and built for global users.
                </p>
                <div className="features-remittance-features">
                  <div className="features-remittance-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-remittance-check" />
                    <span>Near-Instant Settlements</span>
                  </div>
                  <div className="features-remittance-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-remittance-check" />
                    <span>Low Fees</span>
                  </div>
                </div>
              </div>

              <div className="features-remittance-right">
                <div className="features-remittance-image-container">
                  <img src={require('../assets/images/backgrounds/remittance.png')} alt="Remittance" className="features-remittance-image" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B2B Payments Section */}
        <section className="features-b2b-section">
          <div className="features-b2b-container">
            <div className="features-b2b-content">
              <div className="features-b2b-left">
                <div className="features-b2b-image-container">
                  <img src={require('../assets/images/backgrounds/b2b.png')} alt="B2B Payments" className="features-b2b-image" />
                </div>
              </div>

              <div className="features-b2b-right">
                <h2 className="features-b2b-title">Simplify B2B Payments with Smart Escrow</h2>
                <p className="features-b2b-description">
                  Automate contracts, protect business funds, and ensure every supplier or partner gets paid only when terms are met powered by blockchain smart contracts.
                </p>
                <div className="features-b2b-features">
                  <div className="features-b2b-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-b2b-check" />
                    <span>Automated Settlements</span>
                  </div>
                  <div className="features-b2b-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-b2b-check" />
                    <span>Global Trade Confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* P2P Transactions Section */}
        <section className="features-p2p-section">
          <div className="features-p2p-container">
            <div className="features-p2p-content">
              <div className="features-p2p-left">
                <h2 className="features-p2p-title">Peer-to-Peer Transactions, Secured by Blockchain</h2>
                <p className="features-p2p-description">
                  Transact directly with anyone, anywhere, your funds stay protected in escrow until both parties meet the agreed terms.
                </p>
                <div className="features-p2p-features">
                  <div className="features-p2p-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-p2p-check" />
                    <span>No Middlemen</span>
                  </div>
                  <div className="features-p2p-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-p2p-check" />
                    <span>Guaranteed Trust</span>
                  </div>
                </div>
              </div>

              <div className="features-p2p-right">
                <div className="features-p2p-image-container">
                  <img src={require('../assets/images/backgrounds/cryptos.png')} alt="P2P Transactions" className="features-p2p-image" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conflict Resolution Section */}
        <section className="features-resolution-section">
          <div className="features-resolution-container">
            <div className="features-resolution-content">
              <div className="features-resolution-left">
                <div className="features-resolution-image-container">
                  <img src={require('../assets/images/backgrounds/review.png')} alt="Conflict Resolution" className="features-resolution-image" />
                </div>
              </div>

              <div className="features-resolution-right">
                <h2 className="features-resolution-title">
                  <span className="features-resolution-title-dark">Fair. Fast. Transparent </span>
                  <span className="features-resolution-title-blue">Conflict Resolution.</span>
                </h2>
                <p className="features-resolution-description">
                  Disputes happen, but with TrustiChain's on-chain resolution system, every case is handled quickly, fairly, and with complete transparency.
                </p>
                <div className="features-resolution-features">
                  <div className="features-resolution-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-resolution-check" />
                    <span>Multi-Tier Resolution</span>
                  </div>
                  <div className="features-resolution-feature">
                    <img src={require('../assets/images/icons/checkmark.png')} alt="Check" className="features-resolution-check" />
                    <span>Impartial Decisions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

                {/* Why Choose Section */}
        <section className="features-why-section">
          <div className="features-why-container">
            <div className="features-why-header">
              <h3 className="features-why-subheading">Why</h3>
              <h2 className="features-why-main-title">
                Why Thousands Choose <span className="features-trustichain-highlight">TrustiChain</span> for Secure Payments
              </h2>
              <p className="features-why-tagline">From freelancers to enterprises, we protect what matters most</p>
            </div>

            <div className="features-why-showcase">
              <div className="features-showcase-left">
                <div className="features-why-list">
                  <div className="features-why-item primary">
                    <h3 className="features-why-item-title primary">Transparent & Tamper-Proof</h3>
                    <p className="features-why-item-description">Every transaction is verified on the XRP Ledger ensuring full visibility and zero hidden actions.</p>
                  </div>
                  <div className="features-why-item">
                    <h3 className="features-why-item-title">Instant Settlements</h3>
                    <p className="features-why-item-description">Experience lightning-fast payments with near-instant escrow releases, no matter where you are.</p>
                  </div>
                  <div className="features-why-item">
                    <h3 className="features-why-item-title">Dispute Protection</h3>
                    <p className="features-why-item-description">Your funds stay safe until both parties are satisfied, with a fair, on-chain resolution process.</p>
                  </div>
                  <div className="features-why-item">
                    <h3 className="features-why-item-title">Global & Compliant</h3>
                    <p className="features-why-item-description">Designed for individuals and businesses worldwide, fully aligned with international payment standards.</p>
                  </div>
                </div>
              </div>
              <div className="features-showcase-right">
                <div className="features-ui-preview">
                  <img 
                    src={require('../assets/images/backgrounds/interface.png')} 
                    alt="Trust Score & Analytics Dashboard" 
                    className="features-dashboard-screenshot"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="features-cta-section">
          <div className="features-cta-container">
            <div className="features-cta-card">
              <h3 className="features-cta-subheading">Secure your finances with Trustifund</h3>
              <h2 className="features-cta-heading-line1">Funds Held in Trust.</h2>
              <h2 className="features-cta-heading-line2">Released with Confidence.</h2>
              
              <div className="features-cta-buttons">
                <Link to="/create" className="features-cta-button features-cta-button-primary">
                  Get started
                  <ArrowRight className="features-cta-button-icon" />
                </Link>
                <button className="features-cta-button features-cta-button-secondary">Learn more</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="features-footer-section">
        <div className="features-footer-background-text">Trustichain</div>
        <div className="features-footer-container">
          <div className="features-footer-content">
            <div className="features-footer-left">
              <div className="features-footer-brand">
                <img src={logoWhite} alt="TrustiChain Logo" className="features-footer-logo" />
                <div className="features-footer-brand-text">
                  <h2 className="features-footer-brand-name">TrustiChain</h2>
                  <p className="features-footer-tagline">XRP Ledger Escrow</p>
                </div>
              </div>
              <p className="features-footer-description">
                Built on the XRP Ledger, TrustiChain delivers fast, secure, and fully compliant escrow solutions for remittance, freelance, and B2B payments.
              </p>
              
              <div className="features-footer-social">
                <a href="#" className="features-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="features-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="features-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="features-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="features-footer-right">
              <div className="features-footer-column">
                <h3 className="features-footer-column-title">Company</h3>
                <ul className="features-footer-links">
                  <li><a href="#" className="features-footer-link">Home</a></li>
                  <li><a href="#" className="features-footer-link">Service</a></li>
                  <li><a href="#" className="features-footer-link">why</a></li>
                  <li><a href="#" className="features-footer-link">How it works</a></li>
                  <li><a href="#" className="features-footer-link">Testimonials</a></li>
                </ul>
              </div>
              
              <div className="features-footer-column">
                <h3 className="features-footer-column-title">Legal Links</h3>
                <ul className="features-footer-links">
                  <li><a href="#" className="features-footer-link">Privacy Policy</a></li>
                  <li><a href="#" className="features-footer-link">Cookie Policy</a></li>
                  <li><a href="#" className="features-footer-link">Disclaimer</a></li>
                  <li><a href="#" className="features-footer-link">Copyright</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="features-footer-divider"></div>
          
          <div className="features-footer-bottom">
            <p className="features-footer-copyright">© Trustichain All Rights Reserved.</p>
            <button className="features-footer-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top
              <div className="features-footer-arrow-icon">
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

export default Features;
