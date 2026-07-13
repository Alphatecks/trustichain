import React, { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle, Loader } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import './index.css';

const WALLETCONNECT_ICON =
  'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg';

const ConnectWalletModal = ({ isOpen, onClose }) => {
  const { 
    connectWallet, 
    account, 
    isConnected, 
    startXamanPolling,
    stopXamanPolling,
    xamanConnectionData,
    setXamanConnectionData,
  } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);
  const [xamanStatus, setXamanStatus] = useState('pending'); // pending, connected, cancelled
  const hasWindow = typeof window !== 'undefined';
  const isXamanConnected =
    hasWindow &&
    localStorage.getItem('xamanWalletConnected') === 'true' &&
    isConnected &&
    Boolean(account);
  const isWalletConnectConnected =
    hasWindow &&
    localStorage.getItem('walletconnectWalletConnected') === 'true' &&
    isConnected &&
    Boolean(account);

  const wallets = [
    {
      id: 'xaman',
      name: 'XAMAN',
      icon: 'https://cdn.prod.website-files.com/66ffb9c73bc7e83a1e0e1006/67028cc20682f3c6f7ec6161_Xaman%20Logo.svg',
      description: isXamanConnected
        ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        : 'Connect using XAMAN mobile wallet',
      isInstalled: true,
      comingSoon: false,
      isConnected: isXamanConnected,
      connect: async () => {
        await connectWallet('xaman');
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: WALLETCONNECT_ICON,
      description: isWalletConnectConnected
        ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
        : 'Scan QR code or choose your wallet',
      isInstalled: true,
      comingSoon: false,
      isConnected: isWalletConnectConnected,
      connect: async () => {
        await connectWallet('walletconnect');
      },
    }
  ];

  const handleWalletConnect = async (wallet) => {
    if (wallet.id === 'xaman') {
      setIsConnecting(true);
      setConnectingWallet(wallet.id);
      setXamanStatus('pending');
      
      try {
        const result = await connectWallet('xaman');
        console.log('ConnectWalletModal: connectWallet API response:', result);
        if (result && result.type === 'xaman' && result.connectionData) {
          // Store connection data
          setXamanConnectionData(result.connectionData);
          
          // Start polling for connection status
          startXamanPolling(
            result.connectionData.xummUuid,
            (walletAddress) => {
              // Connected successfully
              setXamanStatus('connected');
              setIsConnecting(false);
              setConnectingWallet(null);
              setTimeout(() => {
                onClose();
                setXamanConnectionData(null);
                setXamanStatus('pending');
              }, 1500);
            },
            () => {
              // Cancelled
              setXamanStatus('cancelled');
              setIsConnecting(false);
              setConnectingWallet(null);
            }
          );
        } else {
          setIsConnecting(false);
          setConnectingWallet(null);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        setIsConnecting(false);
        setConnectingWallet(null);
        setXamanConnectionData(null);
      }
    } else if (wallet.id === 'walletconnect') {
      setIsConnecting(true);
      setConnectingWallet(wallet.id);
      try {
        const result = await connectWallet('walletconnect');
        if (result?.type === 'walletconnect' && result?.account) {
          onClose();
        }
      } catch (error) {
        console.error('Error connecting WalletConnect:', error);
      } finally {
        setIsConnecting(false);
        setConnectingWallet(null);
      }
    } else {
      setIsConnecting(true);
      setConnectingWallet(wallet.id);
      try {
        const result = await wallet.connect();
        console.log('ConnectWalletModal: wallet.connect() API response:', result);
        onClose();
      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        setIsConnecting(false);
        setConnectingWallet(null);
      }
    }
  };

  const handleCloseModal = () => {
    if (!isConnecting) {
      // Stop polling if active
      if (xamanConnectionData) {
        stopXamanPolling();
        setXamanConnectionData(null);
        setXamanStatus('pending');
      }
      onClose();
    }
  };

  const handleCancelXaman = () => {
    stopXamanPolling();
    setXamanConnectionData(null);
    setXamanStatus('pending');
    setIsConnecting(false);
    setConnectingWallet(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (xamanConnectionData) {
        stopXamanPolling();
      }
    };
  }, [xamanConnectionData, stopXamanPolling]);

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
          {xamanConnectionData ? (
            // Show QR code and connection status
            <div className="xaman-connection-view">
              <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Connect with XAMAN</h3>
              
              {xamanConnectionData.instructions && (
                <p className="connect-wallet-description" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  {xamanConnectionData.instructions}
                </p>
              )}
              
              {xamanConnectionData.qrCode && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <img 
                    src={xamanConnectionData.qrCode} 
                    alt="XAMAN QR Code" 
                    style={{ 
                      maxWidth: '300px', 
                      width: '100%', 
                      height: 'auto',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '1rem',
                      backgroundColor: '#fff'
                    }} 
                  />
                </div>
              )}
              
              {xamanConnectionData.xummUrl && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <a 
                    href={xamanConnectionData.xummUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#2F74FF', 
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    Open in XAMAN <ExternalLink size={14} />
                  </a>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0.5rem',
                marginBottom: '1.5rem',
                color: xamanStatus === 'connected' ? '#10b981' : xamanStatus === 'cancelled' ? '#ef4444' : '#6b7280'
              }}>
                {xamanStatus === 'pending' && (
                  <>
                    <Loader size={16} className="spinning" />
                    <span>Waiting for connection...</span>
                  </>
                )}
                {xamanStatus === 'connected' && (
                  <>
                    <CheckCircle size={16} />
                    <span>Connected successfully!</span>
                  </>
                )}
                {xamanStatus === 'cancelled' && (
                  <span>Connection cancelled</span>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCancelXaman}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
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
                  className={`connect-wallet-item ${isConnectingThis ? 'connecting' : ''} ${!wallet.isInstalled ? 'not-installed' : ''} ${wallet.comingSoon ? 'coming-soon' : ''} ${wallet.isConnected ? 'connected' : ''}`}
                  onClick={() => !wallet.comingSoon && !wallet.isConnected && handleWalletConnect(wallet)}
                  disabled={isDisabled || isConnectingThis || wallet.comingSoon || wallet.isConnected}
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
                        {wallet.isConnected && (
                          <CheckCircle size={16} color="#2F74FF" style={{ marginLeft: '0.5rem' }} />
                        )}
                        {wallet.comingSoon && (
                          <span className="coming-soon-badge">Coming Soon</span>
                        )}
                        {!wallet.isInstalled && !wallet.comingSoon && !wallet.isConnected && (
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
              New to XAMAN wallet?{' '}
              <a 
                href="https://xaman.app/" 
                target="_blank"
                rel="noopener noreferrer"
                className="connect-wallet-help-link"
              >
                Learn more about XAMAN
              </a>
            </p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;

