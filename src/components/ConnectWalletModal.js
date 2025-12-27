import React, { useState } from 'react';
import { X, Wallet, ExternalLink } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import './ConnectWalletModal.css';
import metamaskLogo from '../assets/images/icons/wallets/metamask.png';
import walletConnectLogo from '../assets/images/icons/wallets/walletconnect.jpeg';
import coinbaseLogo from '../assets/images/icons/wallets/coinbase.png';

const ConnectWalletModal = ({ isOpen, onClose }) => {
  const { connectWallet } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);

  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: metamaskLogo,
      description: 'Connect using MetaMask browser extension',
      isInstalled: typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask,
      connect: async () => {
        if (!window.ethereum) {
          window.open('https://metamask.io/download/', '_blank');
          return;
        }
        await connectWallet('metamask');
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: walletConnectLogo,
      description: 'Scan QR code with your mobile wallet',
      isInstalled: true,
      connect: async () => {
        await connectWallet('walletconnect');
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: coinbaseLogo,
      description: 'Connect using Coinbase Wallet extension',
      isInstalled: typeof window !== 'undefined' && window.ethereum && window.ethereum.isCoinbaseWallet,
      connect: async () => {
        if (!window.ethereum) {
          window.open('https://www.coinbase.com/wallet', '_blank');
          return;
        }
        await connectWallet('coinbase');
      }
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
      description: 'Connect using Trust Wallet browser extension',
      isInstalled: typeof window !== 'undefined' && window.ethereum && window.ethereum.isTrust,
      connect: async () => {
        if (!window.ethereum) {
          window.open('https://trustwallet.com/browser-extension', '_blank');
          return;
        }
        await connectWallet('trust');
      }
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/ethereum.svg',
      description: 'Connect using your browser wallet',
      isInstalled: typeof window !== 'undefined' && window.ethereum,
      connect: async () => {
        if (!window.ethereum) {
          return;
        }
        await connectWallet('injected');
      }
    }
  ];

  const handleWalletConnect = async (wallet) => {
    setIsConnecting(true);
    setConnectingWallet(wallet.id);
    try {
      await wallet.connect();
      onClose();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  const handleCloseModal = () => {
    if (!isConnecting) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay connect-wallet-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal connect-wallet-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Connect Wallet</h2>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={handleCloseModal}
            disabled={isConnecting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content connect-wallet-content">
          <p className="connect-wallet-description">
            Connect your wallet to continue. If you don't have a wallet, you can select one to get started.
          </p>

          <div className="connect-wallet-list">
            {wallets.map((wallet) => {
              const isConnectingThis = connectingWallet === wallet.id;
              const isDisabled = isConnecting && !isConnectingThis;

              return (
                <button
                  key={wallet.id}
                  type="button"
                  className={`connect-wallet-item ${isConnectingThis ? 'connecting' : ''} ${!wallet.isInstalled ? 'not-installed' : ''}`}
                  onClick={() => handleWalletConnect(wallet)}
                  disabled={isDisabled || isConnectingThis}
                >
                  <div className="connect-wallet-item-content">
                    <div className="connect-wallet-icon">
                      <img 
                        src={wallet.icon} 
                        alt={`${wallet.name} logo`}
                        className="wallet-logo-img"
                      />
                    </div>
                    <div className="connect-wallet-info">
                      <div className="connect-wallet-name">
                        {wallet.name}
                        {!wallet.isInstalled && (
                          <ExternalLink size={14} className="external-link-icon" />
                        )}
                      </div>
                      <div className="connect-wallet-description-text">
                        {wallet.description}
                      </div>
                    </div>
                    {isConnectingThis && (
                      <div className="connect-wallet-spinner">
                        <div className="spinner"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="connect-wallet-footer">
            <p className="connect-wallet-help-text">
              New to Ethereum wallets?{' '}
              <a 
                href="https://ethereum.org/en/wallets/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="connect-wallet-help-link"
              >
                Learn more about wallets
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;

