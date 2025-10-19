import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Users, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import './Home.css';

const Home = () => {
  const { isConnected } = useWeb3();

  const features = [
    {
      icon: <Shield className="feature-icon" />,
      title: 'Secure Escrow',
      description: 'Your funds are protected by smart contracts until all conditions are met.'
    },
    {
      icon: <Lock className="feature-icon" />,
      title: 'Decentralized',
      description: 'No central authority. Transactions are secured by blockchain technology.'
    },
    {
      icon: <Users className="feature-icon" />,
      title: 'Multi-party',
      description: 'Support for buyers, sellers, and arbitrators in complex transactions.'
    },
    {
      icon: <Zap className="feature-icon" />,
      title: 'Fast Settlement',
      description: 'Automated settlement when conditions are met, reducing delays.'
    }
  ];

  const stats = [
    { label: 'Total Escrows', value: '1,234', icon: <Shield /> },
    { label: 'Total Volume', value: '$2.5M', icon: <Zap /> },
    { label: 'Active Users', value: '456', icon: <Users /> },
    { label: 'Success Rate', value: '98.5%', icon: <CheckCircle /> }
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Secure Blockchain Escrow
            <span className="gradient-text"> Platform</span>
          </h1>
          <p className="hero-description">
            TrustiChain provides secure, decentralized escrow services powered by smart contracts. 
            Protect your transactions with blockchain technology.
          </p>
          <div className="hero-actions">
            {isConnected ? (
              <Link to="/create" className="cta-button primary">
                Create New Escrow
                <ArrowRight className="button-icon" />
              </Link>
            ) : (
              <div className="cta-group">
                <p className="cta-text">Connect your wallet to get started</p>
                <Link to="/create" className="cta-button primary">
                  Get Started
                  <ArrowRight className="button-icon" />
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card">
            <div className="card-header">
              <Shield className="card-icon" />
              <span>Secure Escrow</span>
            </div>
            <div className="card-content">
              <div className="transaction-flow">
                <div className="flow-step">
                  <div className="step-number">1</div>
                  <span>Fund Escrow</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">2</div>
                  <span>Verify</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <div className="step-number">3</div>
                  <span>Release</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <div className="section-header">
          <h2 className="section-title">Why Choose TrustiChain?</h2>
          <p className="section-description">
            Built on blockchain technology for maximum security and transparency
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-container">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Secure Your Transactions?</h2>
          <p className="cta-description">
            Join thousands of users who trust TrustiChain for their escrow needs.
          </p>
          <Link to="/create" className="cta-button secondary">
            Start Creating Escrows
            <ArrowRight className="button-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
