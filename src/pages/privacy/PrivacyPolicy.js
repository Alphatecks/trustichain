import React from 'react';
import { Link } from 'react-router-dom';
import './PrivacyPolicy.css';
import logoWhite from '../../assets/images/logo/logo_white.png';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-page">
      <main className="privacy-content">
        {/* Header Section */}
        <section className="privacy-header">
          <div className="privacy-header-container">
            <h1 className="privacy-title">Privacy Policy</h1>
            <p className="privacy-last-updated">Last Updated: January 26, 2026</p>
          </div>
        </section>

        {/* Content Section */}
        <section className="privacy-main-content">
          <div className="privacy-container">
            <div className="privacy-intro">
              <p className="privacy-intro-text">
                TrustiChain ("TrustiChain," "we," "our," or "us") is committed to protecting the privacy and personal information of its users ("you" or "Users"). This Privacy Policy explains how we collect, use, disclose, and safeguard information when you access or use the TrustiChain platform, including our website, mobile applications, and related services (collectively, the "Services").
              </p>
              <p className="privacy-intro-text">
                By accessing or using TrustiChain, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>

            {/* Section 1 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">1. Information We Collect</h2>
              <p className="privacy-section-intro">
                We collect only the information necessary to operate our Services effectively and lawfully.
              </p>
              
              <h3 className="privacy-subsection-title">a. Information You Provide Directly</h3>
              <p className="privacy-text">This may include:</p>
              <ul className="privacy-list">
                <li>Name or business name</li>
                <li>Email address</li>
                <li>Wallet addresses</li>
                <li>Transaction-related metadata</li>
                <li>Communications with customer support</li>
                <li>Any information you voluntarily submit through forms or correspondence</li>
              </ul>
              <p className="privacy-text">
                TrustiChain does not intentionally collect sensitive personal data unless required by law or explicitly provided by you.
              </p>

              <h3 className="privacy-subsection-title">b. Automatically Collected Information</h3>
              <p className="privacy-text">When you use our Services, we may collect:</p>
              <ul className="privacy-list">
                <li>Device type and browser information</li>
                <li>IP address</li>
                <li>Usage logs and interaction data</li>
                <li>Date and time of access</li>
                <li>Basic analytics data</li>
              </ul>
              <p className="privacy-text">
                This information is used strictly for system performance, security monitoring, and service improvement.
              </p>

              <h3 className="privacy-subsection-title">c. Blockchain Data</h3>
              <p className="privacy-text">
                Transactions executed on public blockchains (including the XRP Ledger) are inherently public and immutable. TrustiChain does not control blockchain networks and is not responsible for the privacy practices of those networks.
              </p>
              <p className="privacy-text">Users understand and agree that:</p>
              <ul className="privacy-list">
                <li>Blockchain transactions are publicly visible</li>
                <li>TrustiChain cannot modify or delete blockchain records</li>
                <li>Wallet addresses may be traceable through third-party blockchain explorers</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">2. How We Use Information</h2>
              <p className="privacy-text">We use collected information for the following purposes:</p>
              <ul className="privacy-list">
                <li>To provide and operate the Services</li>
                <li>To facilitate escrow and remittance transactions</li>
                <li>To verify user identity where required by law</li>
                <li>To respond to user inquiries and provide support</li>
                <li>To improve system functionality and user experience</li>
                <li>To detect fraud, abuse, or security threats</li>
                <li>To comply with applicable laws and legal obligations</li>
              </ul>
              <p className="privacy-text">
                TrustiChain does not sell personal data to third parties.
              </p>
            </div>

            {/* Section 3 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">3. Legal Basis for Processing (Where Applicable)</h2>
              <p className="privacy-text">Where required by law, TrustiChain processes personal data based on:</p>
              <ul className="privacy-list">
                <li>User consent</li>
                <li>Performance of a contract (providing Services)</li>
                <li>Compliance with legal obligations</li>
                <li>Legitimate business interests such as security and fraud prevention</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">4. Sharing and Disclosure of Information</h2>
              <p className="privacy-text">
                TrustiChain may share information only in limited circumstances:
              </p>

              <h3 className="privacy-subsection-title">a. Service Providers</h3>
              <p className="privacy-text">We may share data with trusted third-party vendors who assist with:</p>
              <ul className="privacy-list">
                <li>Hosting and infrastructure</li>
                <li>Security monitoring</li>
                <li>Analytics</li>
                <li>Compliance services</li>
              </ul>
              <p className="privacy-text">
                These providers are contractually required to protect user data and use it only for authorized purposes.
              </p>

              <h3 className="privacy-subsection-title">b. Legal and Regulatory Requirements</h3>
              <p className="privacy-text">
                We may disclose information if required to do so by law, court order, or governmental authority.
              </p>

              <h3 className="privacy-subsection-title">c. Business Transfers</h3>
              <p className="privacy-text">
                In the event of a merger, acquisition, or asset sale, user information may be transferred as part of the transaction, subject to this Privacy Policy.
              </p>
            </div>

            {/* Section 5 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">5. User Responsibilities</h2>
              <p className="privacy-text">Users are solely responsible for:</p>
              <ul className="privacy-list">
                <li>Protecting their private keys and wallet credentials</li>
                <li>Ensuring the accuracy of information they submit</li>
                <li>Complying with all applicable laws related to their transactions</li>
              </ul>
              <p className="privacy-text">
                TrustiChain does not control user transactions and does not guarantee outcomes of escrow agreements between users.
              </p>
            </div>

            {/* Section 6 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">6. Data Retention</h2>
              <p className="privacy-text">
                TrustiChain retains personal information only for as long as necessary to:
              </p>
              <ul className="privacy-list">
                <li>Provide Services</li>
                <li>Meet legal and regulatory obligations</li>
                <li>Resolve disputes</li>
                <li>Enforce agreements</li>
              </ul>
              <p className="privacy-text">
                Blockchain data cannot be deleted due to the nature of distributed ledger technology.
              </p>
            </div>

            {/* Section 7 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">7. Data Security</h2>
              <p className="privacy-text">
                TrustiChain implements commercially reasonable technical and organizational measures to safeguard personal information, including encryption and access controls.
              </p>
              <p className="privacy-text">However, no system is completely secure. Users acknowledge that:</p>
              <ul className="privacy-list">
                <li>Transmission of information over the internet involves inherent risks</li>
                <li>TrustiChain cannot guarantee absolute security</li>
              </ul>
            </div>

            {/* Section 8 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">8. International Transfers</h2>
              <p className="privacy-text">
                Your information may be processed in countries other than your country of residence. By using the Services, you consent to such transfers in accordance with this Privacy Policy and applicable laws.
              </p>
            </div>

            {/* Section 9 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">9. Children's Privacy</h2>
              <p className="privacy-text">
                TrustiChain does not knowingly collect information from individuals under the age of 18. If we discover such data has been collected, it will be deleted promptly.
              </p>
            </div>

            {/* Section 10 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">10. Third-Party Links and Services</h2>
              <p className="privacy-text">
                The Services may contain links to third-party platforms or wallets. TrustiChain is not responsible for the privacy practices of such third parties. Users are encouraged to review their policies independently.
              </p>
            </div>

            {/* Section 11 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">11. Limitation of Liability</h2>
              <p className="privacy-text">
                TrustiChain acts solely as a technology service provider and does not act as a financial institution, bank, or escrow agent under traditional legal definitions.
              </p>
              <p className="privacy-text">TrustiChain is not responsible for:</p>
              <ul className="privacy-list">
                <li>User misconduct</li>
                <li>Fraud committed by other users</li>
                <li>Losses resulting from blockchain network failures</li>
                <li>Errors arising from user-provided information</li>
              </ul>
            </div>

            {/* Section 12 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">12. Your Rights</h2>
              <p className="privacy-text">
                Depending on your jurisdiction, you may have the right to:
              </p>
              <ul className="privacy-list">
                <li>Access your personal data</li>
                <li>Request correction or deletion</li>
                <li>Withdraw consent</li>
                <li>Object to certain processing activities</li>
              </ul>
              <p className="privacy-text">
                Requests may be submitted to: <a href="mailto:info@trustichain.com" className="privacy-link">info@trustichain.com</a>
              </p>
            </div>

            {/* Section 13 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">13. Changes to This Privacy Policy</h2>
              <p className="privacy-text">
                TrustiChain reserves the right to modify this Privacy Policy at any time. Updates will be posted on the platform with a revised January 26, 2026 date. Continued use of the Services constitutes acceptance of the updated policy.
              </p>
            </div>

            {/* Section 14 */}
            <div className="privacy-section">
              <h2 className="privacy-section-title">14. Contact Information</h2>
              <p className="privacy-text">
                For questions or concerns about this Privacy Policy, contact:
              </p>
              <div className="privacy-contact">
                <p className="privacy-contact-label">TrustiChain Legal & Compliance Team</p>
                <p className="privacy-contact-email">
                  Email: <a href="mailto:info@trustichain.com" className="privacy-link">info@trustichain.com</a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="privacy-footer-section">
        <div className="privacy-footer-background-text">Trustichain</div>
        <div className="privacy-footer-container">
          <div className="privacy-footer-content">
            <div className="privacy-footer-left">
              <div className="privacy-footer-brand">
                <img src={logoWhite} alt="TrustiChain Logo" className="privacy-footer-logo" />
                <div className="privacy-footer-brand-text">
                  <h2 className="privacy-footer-brand-name">TrustiChain</h2>
                  <p className="privacy-footer-tagline">XRP Ledger Escrow</p>
                </div>
              </div>
              <p className="privacy-footer-description">
                Built on the XRP Ledger, TrustiChain delivers fast, secure, and fully compliant escrow solutions for remittance, freelance, and B2B payments.
              </p>
              
              <div className="privacy-footer-social">
                <a href="#" className="privacy-footer-social-icon" aria-label="X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="privacy-footer-social-icon" aria-label="Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="privacy-footer-social-icon" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="privacy-footer-social-icon" aria-label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="privacy-footer-right">
              <div className="privacy-footer-column">
                <h3 className="privacy-footer-column-title">Company</h3>
                <ul className="privacy-footer-links">
                  <li><a href="/" className="privacy-footer-link">Home</a></li>
                  <li><a href="/features" className="privacy-footer-link">Service</a></li>
                  <li><a href="/learn-more" className="privacy-footer-link">Why</a></li>
                  <li><a href="/features" className="privacy-footer-link">How it works</a></li>
                  <li><a href="/" className="privacy-footer-link">Testimonials</a></li>
                </ul>
              </div>
              
              <div className="privacy-footer-column">
                <h3 className="privacy-footer-column-title">Legal Links</h3>
                <ul className="privacy-footer-links">
                  <li><Link to="/privacy-policy" className="privacy-footer-link">Privacy Policy</Link></li>
                  <li><a href="#" className="privacy-footer-link">Cookie Policy</a></li>
                  <li><a href="#" className="privacy-footer-link">Disclaimer</a></li>
                  <li><a href="#" className="privacy-footer-link">Copyright</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="privacy-footer-divider"></div>
          
          <div className="privacy-footer-bottom">
            <p className="privacy-footer-copyright">© Trustichain All Rights Reserved.</p>
            <button className="privacy-footer-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top
              <div className="privacy-footer-arrow-icon">
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

export default PrivacyPolicy;
