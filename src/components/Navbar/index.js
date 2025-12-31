import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Wallet, User, LogOut, Sun, Moon } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { useTheme } from '../../context/ThemeContext';
import ConnectWalletModal from '../ConnectWalletModal';
import './index.css';

const Navbar = () => {
  const { account, isConnected, disconnectWallet } = useWeb3();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Shield className="brand-icon" />
          <span>TrustiChain</span>
        </Link>

        <div className="navbar-menu">
          <Link 
            to="/" 
            className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </div>

        <div className="navbar-actions">
          {isConnected ? (
            <div className="wallet-info">
              <div className="wallet-address">
                <User className="user-icon" />
                <span>{formatAddress(account)}</span>
              </div>
              <button 
                onClick={disconnectWallet}
                className="disconnect-btn"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowWalletModal(true)}
              className="connect-wallet-btn"
            >
              <Wallet className="wallet-icon" />
              Connect Wallet
            </button>
          )}
          <button 
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {isDark ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
      <ConnectWalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />
    </nav>
  );
};

export default Navbar;
