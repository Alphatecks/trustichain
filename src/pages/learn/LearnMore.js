import React from 'react';
import { ShoppingCart, User, Users, PackageSearch, Target, Store } from 'lucide-react';
import './LearnMore.css';

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
      'Slow settlement (takes days)',
      'Bank intermediaries required',
      'Manual compliance workflows',
      'Opaque fees & FX rates',
      'Limited escrow or dispute resolution',
    ],
    trustichain: [
      'Instant, on-chain settlement (takes seconds)',
      'Direct, non-custodial control',
      'Automated compliance & reporting',
      'Transparent pricing. FX-ready.',
      'Escrow-first payments with dispute guardrails',
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
              src={require('../../assets/images/illustrations/explanation.jpg')}
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
    </div>
  );
};

export default LearnMore;

