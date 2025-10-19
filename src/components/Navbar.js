import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Wallet, User, LogOut } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import './Navbar.css';

const Navbar = () => {
  const { account, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const location = useLocation();

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

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
            to="/create" 
            className={`navbar-link ${location.pathname === '/create' ? 'active' : ''}`}
          >
            Create Escrow
          </Link>
          <Link 
            to="/my-escrows" 
            className={`navbar-link ${location.pathname === '/my-escrows' ? 'active' : ''}`}
          >
            My Escrows
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
              onClick={connectWallet}
              className="connect-wallet-btn"
            >
              <Wallet className="wallet-icon" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
