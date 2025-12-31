import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './index.css';

const LandingNavbar = () => {
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Hide navbar on dashboard pages (dashboard, my-escrow, transactions)
  const isDashboardPage = location.pathname === '/dashboard' || 
                          location.pathname === '/my-escrow' || 
                          location.pathname === '/transactions' ||
                          location.pathname.startsWith('/escrow/');

  if (isDashboardPage) {
    return null;
  }

  return (
    <nav className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="landing-navbar-container">
        <Link to="/" className="landing-navbar-brand">
          <img src={require('../../assets/images/logo/logo.png')} alt="TrustiChain" className="brand-logo" />
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
          <Link to="/login" className="login-button">
            Login
          </Link>
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <Link 
            to="/" 
            className={`mobile-menu-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Home
          </Link>
          <Link 
            to="/features" 
            className={`mobile-menu-link ${location.pathname === '/features' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Features
          </Link>
          <Link 
            to="/pricing" 
            className={`mobile-menu-link ${location.pathname === '/pricing' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Plans & Pricing
          </Link>
          <Link to="/login" className="mobile-login-button" onClick={closeMobileMenu}>
            Login
          </Link>
          <button 
            onClick={toggleTheme}
            className="mobile-theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
            <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
