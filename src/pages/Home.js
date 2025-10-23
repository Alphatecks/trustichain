import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <main className="home-content">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              The Future of Global<br />
              Payments and Financial<br />
              <span className="highlight-text">Infrastructure</span>
            </h1>
            <p className="hero-description">
              Built on the XRP Ledger, TrustiChain delivers fast, secure, and fully compliant 
              escrow solutions for remittance, freelance, and B2B payments.
            </p>
            <div className="hero-actions">
              <Link to="/create" className="cta-button primary">
                Get started
                <ArrowRight className="button-icon" />
              </Link>
              <button className="cta-button secondary">
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <img 
              src={require('../assets/images/backgrounds/interface.png')} 
              alt="TrustiChain Dashboard Preview" 
              className="dashboard-image"
            />
          </div>
        </div>

        {/* Statistics Section */}
        <section className="stats-section">
          <div className="stats-container">
            <h2 className="stats-heading">Trusted by Thousands Worldwide</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number blue">$50M+</div>
                <div className="stat-label">Total Volume Secured</div>
              </div>
              <div className="stat-card">
                <div className="stat-number green">99.8%</div>
                <div className="stat-label">Success Rate</div>
              </div>
              <div className="stat-card">
                <div className="stat-number purple">25K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number blue-green">4.2s</div>
                <div className="stat-label">Avg Settlement Time</div>
              </div>
            </div>

            <div className="decorative-graphic"></div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-intro">
          <div className="features-container">
            <h2 className="features-main-title">Your All-in-One Blockchain Escrow Solution</h2>
            <p className="features-description">
              TrustiChain brings together secure escrow, fast remittance, saving tools, and blockchain finance — empowering both individuals and businesses to transact safely, transparently, and instantly.
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-card-image" style={{backgroundImage: `url(${require('../assets/images/backgrounds/remittance.png')})`}}></div>
                <div className="feature-card-content">
                  <h3 className="feature-title">Remittance Services</h3>
                  <p className="feature-description">Enjoy near-zero fees and lightning-fast transfers powered by the XRP Ledger - no intermediaries, no delays.</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-card-image" style={{backgroundImage: `url(${require('../assets/images/backgrounds/b2b.png')})`}}></div>
                <div className="feature-card-content">
                  <h3 className="feature-title">Simplify B2B Payments with Smart Escrow</h3>
                  <p className="feature-description">Automate contract-based transactions and ensure compliance, transparency, and speed across your business network.</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-card-image" style={{backgroundImage: `url(${require('../assets/images/backgrounds/cryptos.png')})`}}></div>
                <div className="feature-card-content">
                  <h3 className="feature-title">Secure Every Transaction, Peer-to-Peer</h3>
                  <p className="feature-description">Protect your funds and build trust with a decentralized escrow system designed for freelancers, buyers, and individuals.</p>
                </div>
              </div>
              
              <div className="feature-card">
                <div className="feature-card-image" style={{backgroundImage: `url(${require('../assets/images/backgrounds/review.png')})`}}></div>
                <div className="feature-card-content">
                  <h3 className="feature-title">Fair. Fast. Transparent Conflict Resolution.</h3>
                  <p className="feature-description">Resolve disputes seamlessly through blockchain-verified arbitration and community-backed trust mechanisms.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="security-section">
          <div className="security-container">
            {/* Enterprise Security Standards */}
            <div className="security-standards">
              <h2 className="security-heading">Enterprise Security Standards</h2>
              <div className="security-badges">
                <div className="security-badge">
                  <img src={require('../assets/images/icons/SOC.png')} alt="SOC 2" className="security-badge-icon" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="security-badge">
                  <img src={require('../assets/images/icons/Encryption.png')} alt="Encryption" className="security-badge-icon" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="security-badge">
                  <img src={require('../assets/images/icons/kyc.png')} alt="KYC/AML" className="security-badge-icon" />
                  <span>KYC/AML Verified</span>
                </div>
                <div className="security-badge">
                  <img src={require('../assets/images/icons/audit.png')} alt="Audit Trail" className="security-badge-icon" />
                  <span>Audit Trail</span>
                </div>
              </div>
            </div>

            {/* Why Choose Section */}
            <div className="why-section">
              <h3 className="why-subheading">Why</h3>
              <h2 className="why-main-title">
                Why Thousands Choose <span className="trustichain-highlight">TrustiChain</span> for Secure Payments
              </h2>
              <p className="why-tagline">From freelancers to enterprises, we protect what matters most</p>
            </div>

            {/* Features Showcase */}
            <div className="features-showcase">
              <div className="showcase-left">
                <div className="features-list">
                  <div className="feature-item primary">
                    <h3 className="feature-item-title primary">Transparent & Tamper-Proof</h3>
                    <p className="feature-item-description">Every transaction is verified on the XRP Ledger ensuring full visibility and zero hidden actions.</p>
                  </div>
                  <div className="feature-item">
                    <h3 className="feature-item-title">Instant Settlements</h3>
                    <p className="feature-item-description">Experience lightning-fast payments with near-instant escrow releases, no matter where you are.</p>
                  </div>
                  <div className="feature-item">
                    <h3 className="feature-item-title">Dispute Protection</h3>
                    <p className="feature-item-description">Your funds stay safe until both parties are satisfied, with a fair, on-chain resolution process.</p>
                  </div>
                  <div className="feature-item">
                    <h3 className="feature-item-title">Global & Compliant</h3>
                    <p className="feature-item-description">Designed for individuals and businesses worldwide, fully aligned with international payment standards.</p>
                  </div>
                </div>
              </div>
              <div className="showcase-right">
                <div className="ui-preview">
                  <img 
                    src={require('../assets/images/backgrounds/interface.png')} 
                    alt="Trust Score & Analytics Dashboard" 
                    className="dashboard-screenshot"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="how-it-works-container">
            <div className="how-header">
              <h3 className="how-subtitle">How it works</h3>
              <h2 className="how-main-title">See how Trustichain works</h2>
            </div>
            
            <div className="steps-grid-container">
              <div className="steps-grid">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <h3 className="step-title">Create an Escrow</h3>
                  <p className="step-description">Start by setting up a secure escrow for your transaction, choose amount, duration, and recipient.</p>
                </div>
                
                <div className="step-item">
                  <div className="step-number">2</div>
                  <h3 className="step-title">Deposit Funds</h3>
                  <p className="step-description">Transfer funds into the escrow wallet. Your money stays locked and protected until delivery is confirmed.</p>
                </div>
                
                <div className="step-item">
                  <div className="step-number">3</div>
                  <h3 className="step-title">Deliver & Confirm</h3>
                  <p className="step-description">Once the service or goods are delivered, the buyer confirms completion directly in-app.</p>
                </div>
                
                <div className="step-item">
                  <div className="step-number">4</div>
                  <h3 className="step-title">Release or Resolve</h3>
                  <p className="step-description">Funds are instantly released to the seller or, if there's an issue, a dispute can be opened for fair resolution.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="testimonials-container">
            <div className="testimonials-header">
              <h3 className="testimonials-subtitle">Why</h3>
              <h2 className="testimonials-main-title">Explore What Our Clients say about us</h2>
              <p className="testimonials-tagline">Trusted by freelancers, businesses, and innovators worldwide</p>
            </div>
            
            <div className="testimonials-cards">
              <div className="testimonial-card">
                <p className="testimonial-text">"I've used TrustiChain for multiple freelance projects, and every transaction felt secure and transparent. No stress, no delays."</p>
                <div className="testimonial-footer">
                  <div className="testimonial-profile-pic">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Harry Maguire" />
                  </div>
                  <div className="testimonial-profile-info">
                    <h4 className="testimonial-name">Harry Maguire</h4>
                    <p className="testimonial-role">freelancer</p>
                    <div className="testimonial-rating">
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star outlined">☆</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <p className="testimonial-text">"Sending money to my suppliers abroad is now instant and low-cost. The escrow feature gives me peace of mind every time."</p>
                <div className="testimonial-footer">
                  <div className="testimonial-profile-pic">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" alt="John Walker" />
                  </div>
                  <div className="testimonial-profile-info">
                    <h4 className="testimonial-name">John Walker</h4>
                    <p className="testimonial-role">CEO, company</p>
                    <div className="testimonial-rating">
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star outlined">☆</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="testimonial-card">
                <p className="testimonial-text">"The dispute resolution process is incredibly fair and transparent. I've never felt more confident in my business transactions."</p>
                <div className="testimonial-footer">
                  <div className="testimonial-profile-pic">
                    <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face" alt="Sarah Johnson" />
                  </div>
                  <div className="testimonial-profile-info">
                    <h4 className="testimonial-name">Sarah Johnson</h4>
                    <p className="testimonial-role">Business Owner</p>
                    <div className="testimonial-rating">
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star filled">★</span>
                      <span className="star outlined">☆</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
