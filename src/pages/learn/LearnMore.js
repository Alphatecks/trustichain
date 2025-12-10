import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart, User, Users, PackageSearch, Target, Store } from 'lucide-react';
import './LearnMore.css';
import '../features/Features.css';
import logoWhite from '../../assets/images/logo/logo_white.png';

const LearnMore = () => {
  const whyReasons = [
    'Smart escrow for buyers & sellers',
    'Real-time global payments & payouts',
    'Business Suite for invoicing, compliance & financial ops',
    'Non-custodial — you control your funds 100%',
    'Low-cost international payments',
    'Dispute-resistant, transparent settlement',
  ];

  const suiteTools = [
    'Smart invoicing & payment links',
    'Virtual payment automation',
    'Compliance & settlement flows',
    'Merchant tools & payout dashboard',
    'Cross-border treasury controls',
  ];

  const capabilities = [
    {
      title: 'Get paid instantly — worldwide',
      description: 'Accept payments across borders without banks, delays, or hidden fees.',
      bullets: [
        'Virtual payment automation',
        'Multi-currency/on-chain settlement',
        'Near-zero fees',
        'Instant confirmation & release',
      ],
      footer: 'Money arrives in seconds, not days.',
    },
    {
      title: 'Manage global vendors & clients',
      description: 'Pay contractors, vendors, and partners globally — instantly.',
      bullets: [
        'Bulk payouts',
        'Invoice approval logic',
        'Token-powered settlement routing',
        'Real-time expense control',
      ],
      footer: 'Cross-border workforce, unlocked.',
    },
    {
      title: 'Protect deals with smart escrow',
      description: 'Secure high-value transactions with automated trust logic.',
      bullets: [
        'Buyer & seller protection',
        'Conditional release',
        'Milestone-based payments',
        'Dispute-resistant flows',
      ],
      footer: 'No middleman holding funds — no risk of non-payment.',
    },
    {
      title: 'Smart invoicing & billing',
      description: 'Invoicing built for Web3 and global business.',
      bullets: [
        'Blockchain-verified invoices',
        'Automated reminders',
        'On-chain payment proof',
        'Escrow-optional requests',
      ],
      footer: 'Send invoices that can’t be ignored or disputed.',
    },
    {
      title: 'Compliance & security',
      description: 'Modern finance demands transparency — without slowing you down.',
      bullets: [
        'KYC / business verification',
        'Ledger-based audit trails',
        'On-chain proof of settlement',
        'Secure escrow vault logic',
      ],
      footer: 'Transparency that builds trust, not friction.',
    },
    {
      title: 'Treasury & business controls',
      description: 'Operate like a global fintech.',
      bullets: [
        'Multi-wallet treasury',
        'Team permissions & approvals',
        'Real-time balances & reconciliation',
        'Automated settlement rules',
      ],
      footer: 'Finance workflows, automated.',
    },
  ];

  const whoItems = [
    {
      title: 'E-commerce & merchants',
      description: 'Instant payout & fraud-proof settlement',
      icon: ShoppingCart,
    },
    {
      title: 'Freelancers & creators',
      description: 'Instant payout & fraud-proof settlement',
      icon: User,
    },
    {
      title: 'Remote teams',
      description: 'Cross-border payroll and payouts',
      icon: Users,
    },
    {
      title: 'Export & logistics firms',
      description: 'Trade settlement without banking delays',
      icon: PackageSearch,
    },
    {
      title: 'Digital agencies',
      description: 'Secure milestone-based client billing',
      icon: Target,
    },
    {
      title: 'Marketplace operators',
      description: 'Escrow-enabled buyer/seller protection',
      icon: Store,
    },
  ];

  const comparisons = {
    legacy: [
      'High fees',
      'Chargeback risk',
      'Banks hold your funds',
      'Slow settlement (take days)',
    ],
    trustichain: [
      'Low payment fees',
      'You hold your funds',
      'Dispute-resistant escrow',
      'Instant, on-chain settlement (takes seconds)',
    ],
  };

  return (
    <div className="learnmore-page">
      <section className="learnmore-hero">
        <div className="learnmore-hero-content">
          <h1 className="learnmore-title">
            <span className="learnmore-title-line">Money, Trust &amp; Global Payments,</span>
            <span className="learnmore-title-highlight">Rebuilt for the Digital Age</span>
          </h1>
          <p className="learnmore-subtitle">
            Secure and instant cross-border payments powered by blockchain technology.
          </p>
        </div>

        <div className="learnmore-hero-image">
          <div className="learnmore-image-frame">
            <img
              src={require('../../assets/images/illustrations/explanation.png')}
              alt="Team collaborating with TrustiChain"
            />
          </div>
        </div>
      </section>

      <section className="learnmore-about">
        <div className="learnmore-about-meta">
          <span className="learnmore-about-label">About</span>
          <p className="learnmore-about-copy">
            TrustiChain gives individuals, merchants, and global businesses the power to send, receive, and secure payments
            worldwide with blockchain-verified trust and non-custodial financial control, on-chain, powered by the XRP Ledger.
            Whether you're a creator, vendor, enterprise, or digital commerce brand, TrustiChain delivers borderless payments,
            trustless settlement, low transaction fees, light speed confirmations, and business-grade automations — all without
            handing your funds to intermediaries.
            <span className="learnmore-about-highlight"> No banks. No brokers. No middlemen — you stay in full control of your money.</span>
          </p>
        </div>

        <h2 className="learnmore-about-heading">
          Trust without third-party custody. Speed without compromise. Business finance without gatekeepers.
        </h2>

        <div className="learnmore-about-visual">
          <img
            src={require('../../assets/images/illustrations/laptop.png')}
            alt="TrustiChain dashboard on laptop"
          />
        </div>
      </section>

      <section className="learnmore-why">
        <div className="learnmore-why-header">
          <h2 className="learnmore-why-title">Why TrustiChain?</h2>
          <p className="learnmore-why-intro">
            TrustiChain brings confidence to every transaction with a foundation built for speed, transparency, and total control.
          </p>
        </div>

        <div className="learnmore-why-grid">
          {whyReasons.map((reason, index) => (
            <div className="learnmore-why-card" key={reason}>
              <div className="learnmore-why-badge">{index + 1}</div>
              <p>{reason}</p>
            </div>
          ))}
        </div>

        <p className="learnmore-why-statement">
          Global finance should be fast, fair, and borderless — and now it is.
        </p>

        <div className="learnmore-suite">
          <h3>Business Suite Included</h3>
          <p className="learnmore-suite-subheading">
            Run your global operation with built-in tools:
          </p>

          <div className="learnmore-suite-grid">
            {suiteTools.map((tool, index) => (
              <div className="learnmore-suite-card" key={tool}>
                <div className="learnmore-suite-number">{index + 1}</div>
                <p>{tool}</p>
              </div>
            ))}
          </div>

          <p className="learnmore-suite-footer">
            Your business. Your money. Your flow. — supercharged by blockchain.
          </p>
        </div>
      </section>

      <section className="learnmore-suite-feature">
        <h2 className="learnmore-suite-feature-title">TrustiChain Business Suite</h2>
        <div className="learnmore-suite-feature-content">
          <div className="learnmore-suite-feature-image">
            <img
              src={require('../../assets/images/illustrations/coffee.png')}
              alt="Professional using TrustiChain Business Suite"
            />
          </div>
          <div className="learnmore-suite-feature-copy">
            <h3>The next generation of global business finance</h3>
            <p>
              Run your business on a trustless, real-time financial layer — built for merchants, startups, exporters,
              remote teams, and global digital companies. From payments to compliance to escrow-powered deal automation:
              one system. Zero banking friction. Full fund control.
            </p>
            <p className="learnmore-suite-feature-highlight">
              Built for global commerce — powered by blockchain trust.
            </p>
          </div>
        </div>
      </section>

      <section className="learnmore-actions">
        <h2 className="learnmore-actions-title">What You Can Do</h2>
        <div className="learnmore-actions-image">
          <img
            src={require('../../assets/images/illustrations/people.png')}
            alt="Teams collaborating with TrustiChain"
          />
        </div>
      </section>

      <section className="learnmore-capabilities">
        <div className="learnmore-capabilities-grid">
          {capabilities.map((capability) => (
            <div className="learnmore-capability-card" key={capability.title}>
              <h3>{capability.title}</h3>
              <p className="learnmore-capability-description">{capability.description}</p>
              <ul>
                {capability.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="learnmore-capability-footer">{capability.footer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="learnmore-who">
        <h2 className="learnmore-who-title">Who It&apos;s For</h2>
        <p className="learnmore-who-subtitle">
          We keep things lean, clear, and collaborative — from idea to launch.
        </p>

        <div className="learnmore-who-grid">
          {whoItems.map(({ title, description, icon: Icon }) => (
            <div className="learnmore-who-card" key={title}>
              <div className="learnmore-who-icon">
                <Icon size={40} strokeWidth={1.5} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="learnmore-compare">
        <h2 className="learnmore-compare-heading">Why TrustiChain Business Suite Wins</h2>

        <div className="learnmore-compare-grid">
          <div className="learnmore-compare-card legacy">
            <h3>Legacy Platforms</h3>
            <ul>
              {comparisons.legacy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="learnmore-compare-card trustichain">
            <h3>TrustiChain</h3>
            <ul>
              {comparisons.trustichain.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="features-cta-section">
        <div className="features-cta-container">
          <div className="features-cta-card">
            <h3 className="features-cta-subheading">Secure your finances with Trustichain</h3>
            <h2 className="features-cta-heading-line1">Funds Held in Trust.</h2>
            <h2 className="features-cta-heading-line2">Released with Confidence.</h2>
            
            <div className="features-cta-buttons">
              <Link to="/create" className="features-cta-button features-cta-button-primary">
                Signup
                <ArrowRight className="features-cta-button-icon" />
              </Link>
              <Link to="/learn-more" className="features-cta-button features-cta-button-secondary">Learn more</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="learnmore-footer-section">
        <div className="learnmore-footer-background-text">Trustichain</div>
        <div className="learnmore-footer-container">
          <div className="learnmore-footer-content">
            <div className="learnmore-footer-left">
              <div className="learnmore-footer-brand">
                <img src={logoWhite} alt="TrustiChain Logo" className="learnmore-footer-logo" />
                <div className="learnmore-footer-brand-text">
                  <h2 className="learnmore-footer-brand-name">TrustiChain</h2>
                  <p className="learnmore-footer-tagline">XRP Ledger Escrow</p>
                </div>
              </div>
              <p className="learnmore-footer-description">
                Built on the XRP Ledger, TrustiChain delivers fast, secure, and fully compliant escrow solutions for remittance, freelance, and B2B payments.
              </p>

              <div className="learnmore-footer-social">
                <a href="#" className="learnmore-footer-social-icon" aria-label="X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="learnmore-footer-social-icon" aria-label="Facebook">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="learnmore-footer-social-icon" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="learnmore-footer-social-icon" aria-label="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="learnmore-footer-right">
              <div className="learnmore-footer-column">
                <h3 className="learnmore-footer-column-title">Company</h3>
                <ul className="learnmore-footer-links">
                  <li><a href="#" className="learnmore-footer-link">Home</a></li>
                  <li><a href="#" className="learnmore-footer-link">Service</a></li>
                  <li><a href="#" className="learnmore-footer-link">Why</a></li>
                  <li><a href="#" className="learnmore-footer-link">How it works</a></li>
                  <li><a href="#" className="learnmore-footer-link">Testimonials</a></li>
                </ul>
              </div>
              <div className="learnmore-footer-column">
                <h3 className="learnmore-footer-column-title">Legal Links</h3>
                <ul className="learnmore-footer-links">
                  <li><a href="#" className="learnmore-footer-link">Privacy Policy</a></li>
                  <li><a href="#" className="learnmore-footer-link">Cookie Policy</a></li>
                  <li><a href="#" className="learnmore-footer-link">Disclaimer</a></li>
                  <li><a href="#" className="learnmore-footer-link">Copyright</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="learnmore-footer-divider"></div>

          <div className="learnmore-footer-bottom">
            <p className="learnmore-footer-copyright">© Trustichain All Rights Reserved.</p>
            <button
              className="learnmore-footer-back-to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top
              <div className="learnmore-footer-arrow-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMore;

