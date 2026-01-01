import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import toast from 'react-hot-toast';
import './index.css';

const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const ConnectedWalletModal = ({ isOpen, onClose }) => {
  const { account, isConnected, disconnectWallet } = useWeb3();
  const [confirming, setConfirming] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="notification-modal-overlay" onClick={onClose}>
      <div className="notification-modal connected-wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <div className="notification-header-content">
            <div className="notification-header-accent"></div>
            <h2>Connected Wallet</h2>
          </div>
          <button type="button" className="notification-close-btn" onClick={onClose}>
            <LogOut size={20} />
          </button>
        </div>

        <div className="connected-wallet-content">
          {isConnected && account ? (
            <div className="connected-wallet-row">
              <div className="connected-wallet-identity">
                <User size={20} className="connected-wallet-icon" />
                <div>
                  <div className="connected-wallet-address">{formatAddress(account)}</div>
                  <div className="connected-wallet-sub">{account}</div>
                </div>
              </div>

              {!confirming ? (
                <button
                  className="connected-wallet-disconnect"
                  onClick={() => setConfirming(true)}
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              ) : (
                <div className="connected-wallet-confirm">
                  <p>Disconnect wallet?</p>
                  <div className="connected-wallet-confirm-actions">
                    <button className="btn" onClick={() => setConfirming(false)}>Cancel</button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        disconnectWallet();
                        toast.success('Wallet disconnected');
                        setConfirming(false);
                        onClose();
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              <p className="connected-wallet-empty">No wallet connected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectedWalletModal;
