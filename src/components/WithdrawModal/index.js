import React, { useState } from 'react';
import { X, ChevronDown, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import './index.css';

const WithdrawModal = ({ isOpen, onCancel, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('USD wallet');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleCloseModal = () => {
    setAmount('');
    setSelectedWallet('USD wallet');
    setDestinationAddress('');
    setShowWalletDropdown(false);
    setIsWithdrawing(false);
    onCancel();
  };

  const handleWithdraw = async () => {
    // Remove commas from amount and validate
    const cleanAmount = amount.replace(/,/g, '');
    const numericAmount = parseFloat(cleanAmount);

    if (!cleanAmount || numericAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!destinationAddress || destinationAddress.trim().length < 10) {
      toast.error('Please enter a valid destination address');
      return;
    }

    setIsWithdrawing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to withdraw from your wallet');
        setIsWithdrawing(false);
        return;
      }

      // Map wallet selection to currency
      const currency = selectedWallet === 'XRP wallet' ? 'XRP' : 'USD';

      const apiUrl = getApiUrl('api/wallet/withdraw');
      console.log('Calling withdraw API:', apiUrl, {
        amount: numericAmount,
        currency,
        destinationAddress: destinationAddress.trim(),
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericAmount,
          currency,
          destinationAddress: destinationAddress.trim(),
        }),
      });

      console.log('Withdraw API response status:', response.status);

      const result = await response.json().catch(() => ({}));
      console.log('Withdraw API response body:', result);

      if (response.ok && result.success) {
        toast.success(result.message || 'Withdrawal request submitted successfully!');
        handleCloseModal();
        if (onSuccess) {
          onSuccess({
            amount: numericAmount,
            currency,
            destinationAddress: destinationAddress.trim()
          });
        }
      } else {
        toast.error(result.message || 'Failed to withdraw. Please try again.');
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('An error occurred while processing your withdrawal. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
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
              <label className="withdraw-label">Amount <span style={{ color: 'red' }}>*</span></label>
              <div className="withdraw-amount-display">
                <div className="amount-input-wrapper">
                  <span className="amount-currency">{selectedWallet === 'XRP wallet' ? 'XRP' : '$'}</span>
                  <input
                    type="text"
                    className="amount-input"
                    value={amount}
                    onChange={(e) => {
                      // Allow only numbers and one decimal point
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      // Ensure only one decimal point
                      const parts = value.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      setAmount(value);
                    }}
                    placeholder="0.00"
                    disabled={isWithdrawing}
                  />
                </div>
              </div>
            </div>

            <div className="withdraw-wallet-section">
              <label className="withdraw-label">Wallet name</label>
              <div className="wallet-selector-wrapper">
                <button 
                  type="button"
                  className="wallet-selector-btn"
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  disabled={isWithdrawing}
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

            <div className="withdraw-wallet-section">
              <label className="withdraw-label">Destination Address <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="withdraw-input"
                placeholder="Enter destination wallet address"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                disabled={isWithdrawing}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontFamily: 'Satoshi, Inter, sans-serif',
                  background: isWithdrawing ? '#f5f5f5' : 'var(--white)',
                  cursor: isWithdrawing ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <button 
              type="button"
              className="withdraw-btn"
              onClick={handleWithdraw}
              disabled={isWithdrawing || !amount || !destinationAddress.trim()}
              style={{
                opacity: (isWithdrawing || !amount || !destinationAddress.trim()) ? 0.6 : 1,
                cursor: (isWithdrawing || !amount || !destinationAddress.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isWithdrawing ? (
                <>
                  <LoadingIndicator size="sm" />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
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
