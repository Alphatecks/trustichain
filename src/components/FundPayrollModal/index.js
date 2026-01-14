import React, { useState } from 'react';
import { X, ChevronDown, Info, CheckCircle } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import '../LoadingIndicator/index.css';
import './index.css';

const FundPayrollModal = ({ isOpen, onCancel, onSuccess }) => {
  const { account, isConnected, isWalletConnectedViaAPI } = useWeb3();
  const [amount, setAmount] = useState('24,567.89');
  const [selectedWallet, setSelectedWallet] = useState('XRP wallet');
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  const handleCloseModal = () => {
    setAmount('24,567.89');
    setSelectedWallet('XRP wallet');
    setShowWalletDropdown(false);
    onCancel();
  };

  const handleTransfer = () => {
    onSuccess({
      amount,
      wallet: selectedWallet
    });
    handleCloseModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Fund Payroll</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          {/* Wallet Connection Status */}
          {isWalletConnectedViaAPI && isConnected && account && (() => {
            const isXamanConnected = localStorage.getItem('xamanWalletConnected') === 'true';
            const isMetamaskConnected = localStorage.getItem('metamaskWalletConnected') === 'true';
            const walletName = isXamanConnected ? 'XAMAN' : isMetamaskConnected ? 'MetaMask' : 'Wallet';
            
            return (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                background: '#f0f9ff',
                border: '1px solid #2F74FF',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={20} color="#2F74FF" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2F74FF', marginBottom: '0.25rem' }}>
                    {walletName} Connected
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="fund-payroll-section">
            <div className="fund-payroll-header">
              <label className="fund-payroll-label">Amount</label>
              <div className="wallet-selector-wrapper">
                <button 
                  type="button"
                  className="wallet-selector-btn"
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                >
                  <img 
                    src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png" 
                    alt="XRP" 
                    className="wallet-selector-icon"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="wallet-selector-icon-fallback" style={{ display: 'none' }}>XRP</div>
                  <span>{selectedWallet}</span>
                  <ChevronDown size={16} />
                </button>
                {showWalletDropdown && (
                  <div className="wallet-dropdown">
                    <button 
                      type="button"
                      className="wallet-dropdown-item"
                      onClick={() => {
                        setSelectedWallet('XRP wallet');
                        setShowWalletDropdown(false);
                      }}
                    >
                      XRP wallet
                    </button>
                    <button 
                      type="button"
                      className="wallet-dropdown-item"
                      onClick={() => {
                        setSelectedWallet('USDT wallet');
                        setShowWalletDropdown(false);
                      }}
                    >
                      USDT wallet
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="fund-payroll-amount-display">
              <div className="amount-input-wrapper">
                <span className="amount-currency">$</span>
                <input
                  type="text"
                  className="amount-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="24,567.89"
                />
              </div>
              <div className="balance-text">Balance: 24,567.89 USDT</div>
            </div>

            <button 
              type="button"
              className="fund-payroll-transfer-btn"
              onClick={handleTransfer}
            >
              Transfer
            </button>

            <div className="fund-payroll-info">
              <Info size={16} />
              <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundPayrollModal;
