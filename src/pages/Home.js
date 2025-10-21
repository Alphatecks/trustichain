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
      </main>
    </div>
  );
};

export default Home;
