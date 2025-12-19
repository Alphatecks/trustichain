import React, { useState } from 'react';
import { X, ChevronDown, Info } from 'lucide-react';
import './LoadingIndicator.css';
import './WithdrawModal.css';

const WithdrawModal = ({ isOpen, onCancel, onSuccess }) => {
  const [amount, setAmount] = useState('24,567.89');
  const [selectedWallet, setSelectedWallet] = useState('USD wallet');
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  const handleCloseModal = () => {
    setAmount('24,567.89');
    setSelectedWallet('USD wallet');
    setShowWalletDropdown(false);
    onCancel();
  };

  const handleWithdraw = () => {
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
          <h2>Withdraw</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          <div className="withdraw-section">
            <div className="withdraw-amount-section">
              <label className="withdraw-label">Amount</label>
              <div className="withdraw-amount-display">
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
                <div className="balance-text">Balance: 24,567.89</div>
              </div>
            </div>

            <div className="withdraw-wallet-section">
              <label className="withdraw-label">Wallet name</label>
              <div className="wallet-selector-wrapper">
                <button 
                  type="button"
                  className="wallet-selector-btn"
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                >
                  <span>{selectedWallet}</span>
                  <ChevronDown size={16} />
                </button>
                {showWalletDropdown && (
                  <div className="wallet-dropdown">
                    <button 
                      type="button"
                      className="wallet-dropdown-item"
                      onClick={() => {
                        setSelectedWallet('USD wallet');
                        setShowWalletDropdown(false);
                      }}
                    >
                      USD wallet
                    </button>
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
                  </div>
                )}
              </div>
            </div>

            <button 
              type="button"
              className="withdraw-btn"
              onClick={handleWithdraw}
            >
              Withdraw
            </button>

            <div className="withdraw-info">
              <Info size={16} />
              <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
