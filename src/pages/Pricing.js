import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import './Pricing.css';
import logoWhite from '../assets/images/logo/logo_white.png';

const Pricing = () => {
  const [activeFaq, setActiveFaq] = useState(0);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? -1 : index);
  };

  const profileImages = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=12',
    'https://i.pravatar.cc/150?img=32',
    'https://i.pravatar.cc/150?img=45',
    'https://i.pravatar.cc/150?img=68'
  ];

  return (
    <div className="pricing-page">
      <main className="pricing-content">
        {/* Hero Section */}
        <section className="pricing-hero-section">
          <div className="pricing-hero-container">
            <div className="pricing-hero-content">
              <h1 className="pricing-hero-title">
                Fair, Predictable Pricing for Every<br />
                <span>Transaction No Surprises, No Hidden Fees</span>
              </h1>
              <p className="pricing-hero-description">
                From individuals securing freelance payments to businesses automating supplier settlements, 
                our pricing model makes trust accessible to everyone.
              </p>

              {/* Social Proof Section */}
              <div className="pricing-social-proof">
                <div className="pricing-profile-pictures">
                  {profileImages.map((image, index) => (
                    <img 
                      key={index}
                      src={image} 
                      alt={`Review ${index + 1}`}
                      className="pricing-profile-pic"
                      style={{ zIndex: profileImages.length - index }}
                    />
                  ))}
                </div>
                <div className="pricing-rating">
                  <div className="pricing-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={20} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                  <span className="pricing-reviews-text">From 3k reviews</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="pricing-cards-section">
          <div className="pricing-cards-container">
            <div className="pricing-cards-grid">
              {/* Personal Card */}
              <div className="pricing-plans-card pricing-plans-card-personal">
                <h3 className="pricing-plans-card-title">Personal</h3>
                <p className="pricing-plans-card-description">
                  Perfect for freelancers, online sellers, and individuals who need secure escrow services.
                </p>
                
                <div className="pricing-plans-features">
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon"></span>
                    <span className="pricing-plans-feature-text">Personal escrow management</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon"></span>
                    <span className="pricing-plans-feature-text">Dispute resolution support</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon"></span>
                    <span className="pricing-plans-feature-text">Mobile-friendly interface</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon"></span>
                    <span className="pricing-plans-feature-text">Instant Remittance</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon"></span>
                    <span className="pricing-plans-feature-text">Multi-Currency Support</span>
                  </div>
                </div>
                
                <button className="pricing-plans-card-button pricing-button-personal">Get Started</button>
              </div>
              
              {/* Business Suite Card */}
              <div className="pricing-plans-card pricing-plans-card-business">
                <h3 className="pricing-plans-card-title">Business Suite</h3>
                <p className="pricing-plans-card-description">
                  Enterprise-grade tools for businesses, suppliers, and organizations managing multiple escrows.
                </p>
                
                <div className="pricing-plans-features">
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon active"></span>
                    <span className="pricing-plans-feature-text">Bulk escrow management</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon active"></span>
                    <span className="pricing-plans-feature-text">API integration & automation</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon active"></span>
                    <span className="pricing-plans-feature-text">Advanced analytics & reporting</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon active"></span>
                    <span className="pricing-plans-feature-text">Team Access & Role Control</span>
                  </div>
                  <div className="pricing-plans-feature-item">
                    <span className="pricing-plans-feature-icon active"></span>
                    <span className="pricing-plans-feature-text">Transaction Analytics Dashboard</span>
                  </div>
                </div>
                
                <button className="pricing-plans-card-button pricing-button-business">Start Now</button>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="how-it-works-stats-section">
          <div className="pricing-cards-container">
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
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="pricing-cards-container">
            <p className="how-it-works-intro">How it works</p>
            <h2 className="how-it-works-title">See how <strong>Trustichain</strong> works</h2>
            <div className="steps-grid">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">Create an Escrow</h3>
                  <p className="step-description">Start by setting up a secure escrow for your transaction, choose amount, duration, and recipient.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">Deposit Funds</h3>
                  <p className="step-description">Transfer funds into the escrow wallet. Your money stays locked and protected until delivery is confirmed.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">Deliver & Confirm</h3>
                  <p className="step-description">Once goods or services are delivered, the recipient confirms completion on the platform.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3 className="step-title">Release or Resolve</h3>
                  <p className="step-description">Funds are automatically released upon confirmation. If disputes arise, our arbitration system steps in.</p>
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

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="faq-container">
            <div className="faq-content">
              <div className="faq-left">
                <h3 className="faq-subtitle">FAQ</h3>
                <h2 className="faq-heading-line1">Got Questions?</h2>
                <h2 className="faq-heading-line2">We've the Answers</h2>
                <p className="faq-description">Learn how TrustiChain keeps your transactions secure.</p>
                <button className="faq-cta-button">Ask Your Questions</button>
              </div>
              
              <div className="faq-right">
                <div className="faq-accordion">
                  <div className={`faq-item ${activeFaq === 0 ? 'active' : ''}`}>
                    <div className="faq-question" onClick={() => toggleFaq(0)}>
                      <span className="faq-question-text">How does the escrow system work?</span>
                      <span className="faq-icon">{activeFaq === 0 ? '▲' : '▼'}</span>
                    </div>
                    {activeFaq === 0 && (
                      <div className="faq-answer">
                        <div className="faq-answer-box">
                          <p className="faq-answer-text">When you start a transaction, the funds are securely held in escrow until both parties meet their agreed terms. Once the buyer confirms delivery, the payment is automatically released to the seller. If there's an issue, a dispute can be opened and resolved through TrustiChain's verification process.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`faq-item ${activeFaq === 1 ? 'active' : ''}`}>
                    <div className="faq-question" onClick={() => toggleFaq(1)}>
                      <span className="faq-question-text">What is TrustiChain?</span>
                      <span className="faq-icon">{activeFaq === 1 ? '▲' : '▼'}</span>
                    </div>
                    {activeFaq === 1 && (
                      <div className="faq-answer">
                        <div className="faq-answer-box">
                          <p className="faq-answer-text">TrustiChain is a blockchain-based escrow platform that provides secure, transparent, and instant payment solutions for freelancers, businesses, and individuals worldwide.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`faq-item ${activeFaq === 2 ? 'active' : ''}`}>
                    <div className="faq-question" onClick={() => toggleFaq(2)}>
                      <span className="faq-question-text">Is TrustiChain safe for international payments?</span>
                      <span className="faq-icon">{activeFaq === 2 ? '▲' : '▼'}</span>
                    </div>
                    {activeFaq === 2 && (
                      <div className="faq-answer">
                        <div className="faq-answer-box">
                          <p className="faq-answer-text">Yes, TrustiChain uses enterprise-grade security standards including SOC 2 compliance, 256-bit encryption, KYC/AML verification, and comprehensive audit trails to ensure all international payments are secure and compliant.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`faq-item ${activeFaq === 3 ? 'active' : ''}`}>
                    <div className="faq-question" onClick={() => toggleFaq(3)}>
                      <span className="faq-question-text">What happens if there's a dispute?</span>
                      <span className="faq-icon">{activeFaq === 3 ? '▲' : '▼'}</span>
                    </div>
                    {activeFaq === 3 && (
                      <div className="faq-answer">
                        <div className="faq-answer-box">
                          <p className="faq-answer-text">TrustiChain provides a fair, fast, and transparent dispute resolution process. When a dispute is opened, our verification system reviews the transaction details and both parties' evidence to reach a fair resolution through blockchain-verified arbitration.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className={`faq-item ${activeFaq === 4 ? 'active' : ''}`}>
                    <div className="faq-question" onClick={() => toggleFaq(4)}>
                      <span className="faq-question-text">Do I need crypto to use TrustiChain?</span>
                      <span className="faq-icon">{activeFaq === 4 ? '▲' : '▼'}</span>
                    </div>
                    {activeFaq === 4 && (
                      <div className="faq-answer">
                        <div className="faq-answer-box">
                          <p className="faq-answer-text">No, you don't need to own cryptocurrency to use TrustiChain. Our platform supports traditional payment methods and automatically handles the blockchain transactions behind the scenes, making it accessible to everyone.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="contact-section">
          <div className="contact-container">
            <div className="contact-header">
              <h3 className="contact-subtitle">Contact Us</h3>
              <h2 className="contact-main-title">Get In contact with Our Team</h2>
            </div>
            
            <form className="contact-form">
              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="name" className="contact-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="contact-input"
                    placeholder="Enter name"
                  />
                </div>
                
                <div className="contact-form-group">
                  <label htmlFor="email" className="contact-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="contact-input"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              
              <div className="contact-form-group contact-form-group-full">
                <label htmlFor="description" className="contact-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="contact-textarea"
                  placeholder="Enter description"
                  rows="6"
                ></textarea>
              </div>
            </form>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-card">
              <h3 className="cta-subheading">Secure your finances with Trustifund</h3>
              <h2 className="cta-heading-line1">Funds Held in Trust.</h2>
              <h2 className="cta-heading-line2">Released with Confidence.</h2>
              
              <div className="cta-buttons">
                <Link to="/waitlist" className="cta-button cta-button-primary">
                  Get started
                  <div className="cta-button-icon">
                    <ArrowRight size={16} />
                  </div>
                </Link>
                <button className="cta-button cta-button-secondary">Learn more</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="pricing-footer-section">
        <div className="pricing-footer-background-text">Trustichain</div>
        <div className="pricing-footer-container">
          <div className="pricing-footer-content">
            <div className="pricing-footer-left">
              <div className="pricing-footer-brand">
                <img src={logoWhite} alt="TrustiChain Logo" className="pricing-footer-logo" />
                <div className="pricing-footer-brand-text">
                  <h2 className="pricing-footer-brand-name">TrustiChain</h2>
                  <p className="pricing-footer-tagline">XRP Ledger Escrow</p>
                </div>
              </div>
              <p className="pricing-footer-description">
                Built on the XRP Ledger, TrustiChain delivers fast, secure, and fully compliant escrow solutions for remittance, freelance, and B2B payments.
              </p>
              
              <div className="pricing-footer-social">
                <a href="#" className="pricing-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="pricing-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="pricing-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="pricing-footer-social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="pricing-footer-right">
              <div className="pricing-footer-column">
                <h3 className="pricing-footer-column-title">Company</h3>
                <ul className="pricing-footer-links">
                  <li><a href="#" className="pricing-footer-link">Home</a></li>
                  <li><a href="#" className="pricing-footer-link">Service</a></li>
                  <li><a href="#" className="pricing-footer-link">why</a></li>
                  <li><a href="#" className="pricing-footer-link">How it works</a></li>
                  <li><a href="#" className="pricing-footer-link">Testimonials</a></li>
                </ul>
              </div>
              
              <div className="pricing-footer-column">
                <h3 className="pricing-footer-column-title">Legal Links</h3>
                <ul className="pricing-footer-links">
                  <li><a href="#" className="pricing-footer-link">Privacy Policy</a></li>
                  <li><a href="#" className="pricing-footer-link">Cookie Policy</a></li>
                  <li><a href="#" className="pricing-footer-link">Disclaimer</a></li>
                  <li><a href="#" className="pricing-footer-link">Copyright</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pricing-footer-divider"></div>
          
          <div className="pricing-footer-bottom">
            <p className="pricing-footer-copyright">© Trustichain All Rights Reserved.</p>
            <button className="pricing-footer-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top
              <div className="pricing-footer-arrow-icon">
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

export default Pricing;
