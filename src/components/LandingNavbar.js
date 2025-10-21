import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './LandingNavbar.css';

const LandingNavbar = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="landing-navbar-container">
        <Link to="/" className="landing-navbar-brand">
          <img src={require('../assets/images/logo/logo.png')} alt="TrustiChain" className="brand-logo" />
        </Link>

        <div className="landing-navbar-menu">
          <Link 
            to="/" 
            className={`landing-navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/features" 
            className={`landing-navbar-link ${location.pathname === '/features' ? 'active' : ''}`}
          >
            Features
          </Link>
          <Link 
            to="/pricing" 
            className={`landing-navbar-link ${location.pathname === '/pricing' ? 'active' : ''}`}
          >
            Plans & Pricing
          </Link>
        </div>

        <div className="landing-navbar-actions">
          <button className="login-button">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
