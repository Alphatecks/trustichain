import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/config';
import {
  connectWalletConnect,
  disconnectWalletConnect,
  getWalletConnectProvider,
  isWalletConnectUserRejected,
  switchWalletConnectChain,
} from '../utils/walletConnectProvider';
import { getInjectedMetaMaskProvider } from '../utils/reownDepositFlow';

const CONNECTED_WALLET_LABELS = {
  xaman: 'XAMAN',
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
};

function readConnectedWalletKind(account) {
  try {
    const addr = String(account || '').trim();
    const metamask = localStorage.getItem('metamaskWalletConnected') === 'true';
    const walletconnect = localStorage.getItem('walletconnectWalletConnected') === 'true';
    const xaman = localStorage.getItem('xamanWalletConnected') === 'true';

    if (addr.startsWith('0x')) {
      if (walletconnect && !metamask) return 'walletconnect';
      return 'metamask';
    }
    if (xaman) return 'xaman';
    if (metamask) return 'metamask';
    if (walletconnect) return 'walletconnect';
  } catch (_) {
    /* ignore */
  }
  return null;
}

function clearStoredWalletSession(exceptKind = null) {
  try {
    if (exceptKind !== 'metamask') {
      localStorage.removeItem('metamaskWalletConnected');
      localStorage.removeItem('metamaskWalletAddress');
    }
    if (exceptKind !== 'walletconnect') {
      localStorage.removeItem('walletconnectWalletConnected');
      localStorage.removeItem('walletconnectWalletAddress');
    }
    if (exceptKind !== 'xaman') {
      localStorage.removeItem('xamanWalletConnected');
      localStorage.removeItem('xamanWalletAddress');
      localStorage.removeItem('xamanXummUuid');
    }
  } catch (_) {
    /* ignore */
  }
}

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [isWalletConnectedViaAPI, setIsWalletConnectedViaAPI] = useState(false);
  const [xamanConnectionData, setXamanConnectionData] = useState(null);
  const [xamanPollingInterval, setXamanPollingInterval] = useState(null);

  const validateWalletAddress = async (walletAddress) => {
    try {
      if (!walletAddress) {
        return {
          isValid: false,
          message: 'Address is empty',
          data: {
            isValid: false,
            addressType: 'invalid',
            suggestions: ['Please provide a wallet address']
          }
        };
      }

      const response = await fetch(getApiUrl('api/wallet/validate-address'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });

      const data = await response.json();

      // Handle server errors (500)
      if (!response.ok || !data.success) {
        return {
          isValid: false,
          message: data.message || 'Failed to validate address',
          error: data.error || 'Unknown error',
          data: data.data || null
        };
      }

      // All validation responses return 200 OK, check data.isValid
      return {
        isValid: data.data?.isValid === true,
        message: data.message || 'Address validation completed',
        data: data.data || null
      };
    } catch (error) {
      console.error('Error validating wallet address:', error);
      return {
        isValid: false,
        message: 'Failed to validate address',
        error: error.message || 'Network error',
        data: null
      };
    }
  };

  const connectXamanWallet = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to connect your wallet');
        return null;
      }

      const response = await fetch(getApiUrl('api/wallet/connect/xumm'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          xummUrl: data.data.xummUrl,
          xummUuid: data.data.xummUuid,
          qrCode: data.data.qrCode,
          qrUri: data.data.qrUri,
          instructions: data.data.instructions,
        };
      } else {
        if (response.status === 400) {
          toast.error(data.message || 'XUMM API credentials not configured');
        } else if (response.status === 401) {
          toast.error('Authorization token required. Please login again.');
        } else {
          toast.error(data.message || 'Failed to initiate XAMAN connection');
        }
        return null;
      }
    } catch (error) {
      console.error('Error initiating XAMAN connection:', error);
      toast.error('Failed to initiate XAMAN connection');
      return null;
    }
  };

  const checkXamanConnectionStatus = async (xummUuid) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const response = await fetch(
        getApiUrl(`api/wallet/connect/xumm/status?xummUuid=${xummUuid}`),
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          signed: data.data.signed,
          status: data.data.status,
          walletAddress: data.data.walletAddress,
          xummUuid: data.data.xummUuid,
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error checking XAMAN connection status:', error);
      return null;
    }
  };

  const connectWalletToAPI = async (walletAddress, walletType = 'metamask') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to connect your wallet');
        return;
      }

      const response = await fetch(getApiUrl('api/wallet/connect'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsWalletConnectedViaAPI(true);
        if (walletType === 'metamask') {
          localStorage.setItem('metamaskWalletConnected', 'true');
          localStorage.setItem('metamaskWalletAddress', walletAddress);
          toast.success('MetaMask wallet connected successfully');
        } else if (walletType === 'walletconnect') {
          localStorage.setItem('walletconnectWalletConnected', 'true');
          localStorage.setItem('walletconnectWalletAddress', walletAddress);
          toast.success('WalletConnect connected successfully');
        } else if (walletType === 'xaman') {
          localStorage.setItem('xamanWalletConnected', 'true');
          localStorage.setItem('xamanWalletAddress', walletAddress);
          toast.success('XAMAN wallet connected successfully');
        }
      } else {
        // API call failed, don't mark as connected
        setIsWalletConnectedViaAPI(false);
        if (walletType === 'metamask') {
          localStorage.removeItem('metamaskWalletConnected');
          localStorage.removeItem('metamaskWalletAddress');
        } else if (walletType === 'walletconnect') {
          localStorage.removeItem('walletconnectWalletConnected');
          localStorage.removeItem('walletconnectWalletAddress');
        } else if (walletType === 'xaman') {
          localStorage.removeItem('xamanWalletConnected');
          localStorage.removeItem('xamanWalletAddress');
        }
        toast.error(data.message || 'Failed to connect wallet to backend');
        // Disconnect the wallet since API failed
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setIsConnected(false);
        setChainId(null);
      }
    } catch (error) {
      console.error('Error connecting wallet to API:', error);
      setIsWalletConnectedViaAPI(false);
      if (walletType === 'metamask') {
        localStorage.removeItem('metamaskWalletConnected');
        localStorage.removeItem('metamaskWalletAddress');
      } else if (walletType === 'walletconnect') {
        localStorage.removeItem('walletconnectWalletConnected');
        localStorage.removeItem('walletconnectWalletAddress');
      } else if (walletType === 'xaman') {
        localStorage.removeItem('xamanWalletConnected');
        localStorage.removeItem('xamanWalletAddress');
      }
      toast.error('Failed to connect wallet to backend');
      // Disconnect the wallet since API failed
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setIsConnected(false);
      setChainId(null);
    }
  };

  const connectWallet = async (walletType = 'xaman') => {
    try {
      let ethereumProvider = null;
      let walletName = 'Wallet';

      // Handle XAMAN wallet connection via backend API
      if (walletType === 'xaman') {
        const connectionData = await connectXamanWallet();
        if (connectionData && connectionData.success) {
          // Return connection data to be handled by the modal
          return {
            type: 'xaman',
            connectionData: connectionData,
          };
        }
        return null;
      }

      if (walletType === 'walletconnect') {
        try {
          // Reown/WalletConnect is frontend-session only for EVM funding.
          // Do NOT POST 0x addresses to /api/wallet/connect (XRPL r… only).
          const { provider: wcProvider, account: wcAccount } = await connectWalletConnect();
          const ethersProvider = new ethers.providers.Web3Provider(wcProvider);
          const wcSigner = ethersProvider.getSigner();
          const network = await ethersProvider.getNetwork();

          setAccount(wcAccount);
          setProvider(ethersProvider);
          setSigner(wcSigner);
          setIsConnected(true);
          setChainId(network.chainId);
          localStorage.setItem('walletconnectWalletConnected', 'true');
          localStorage.setItem('walletconnectWalletAddress', wcAccount);
          clearStoredWalletSession('walletconnect');
          toast.success('WalletConnect connected');
          return { type: 'walletconnect', account: wcAccount };
        } catch (error) {
          if (isWalletConnectUserRejected(error)) {
            return null;
          }
          console.error('Error connecting WalletConnect:', error);
          if (error?.message?.includes('project ID')) {
            toast.error('WalletConnect is not configured. Add REACT_APP_WALLETCONNECT_PROJECT_ID to your environment.');
          } else {
            toast.error(error?.message || 'Failed to connect with WalletConnect');
          }
          return null;
        }
      }

      // Determine which provider to use based on wallet type
      if (walletType === 'coinbase') {
        if (window.ethereum && window.ethereum.isCoinbaseWallet) {
          ethereumProvider = window.ethereum;
          walletName = 'Coinbase Wallet';
        } else if (window.coinbaseWalletExtension) {
          ethereumProvider = window.coinbaseWalletExtension;
          walletName = 'Coinbase Wallet';
        } else {
          toast.error('Please install Coinbase Wallet extension!');
          return;
        }
      } else if (walletType === 'trust') {
        if (window.ethereum && window.ethereum.isTrust) {
          ethereumProvider = window.ethereum;
          walletName = 'Trust Wallet';
        } else {
          toast.error('Please install Trust Wallet extension!');
          return;
        }
      } else if (walletType === 'metamask') {
        const injected = getInjectedMetaMaskProvider();
        if (injected) {
          ethereumProvider = injected;
          walletName = 'MetaMask';
        } else if (window.ethereum) {
          ethereumProvider = window.ethereum;
          walletName = 'Browser Wallet';
        } else {
          toast.error('Please install MetaMask!');
          return;
        }
      } else if (walletType === 'injected') {
        // Generic injected wallet
        if (window.ethereum) {
          ethereumProvider = window.ethereum;
          walletName = 'Browser Wallet';
        } else {
          toast.error('No wallet extension detected!');
          return;
        }
      }

      if (!ethereumProvider) {
        toast.error('No wallet provider found!');
        return;
      }

      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const provider = new ethers.providers.Web3Provider(ethereumProvider);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();

        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        setChainId(network.chainId);

        if (walletType === 'metamask') {
          // EVM session only — same as WalletConnect. Do not POST 0x addresses
          // to /api/wallet/connect (XRPL r… only) or require the XRPL Snap.
          localStorage.setItem('metamaskWalletConnected', 'true');
          localStorage.setItem('metamaskWalletAddress', accounts[0]);
          clearStoredWalletSession('metamask');
          toast.success('MetaMask connected');
          return { type: 'metamask', account: accounts[0] };
        }

        toast.success(`${walletName} connected successfully!`);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
    }
  };

  const startXamanPolling = (xummUuid, onConnected, onCancelled) => {
    // Clear any existing polling
    if (xamanPollingInterval) {
      clearInterval(xamanPollingInterval);
    }

    const poll = async () => {
      const status = await checkXamanConnectionStatus(xummUuid);
      
      if (status && status.success) {
        if (status.status === 'connected' && status.signed && status.walletAddress) {
          // Stop polling
          if (xamanPollingInterval) {
            clearInterval(xamanPollingInterval);
            setXamanPollingInterval(null);
          }
          
          // Validate XRPL address
          const validationResult = await validateWalletAddress(status.walletAddress);
          
          if (!validationResult.isValid) {
            toast.error(validationResult.message || 'Invalid XRPL wallet address');
            onCancelled?.();
            return;
          }
          
          // Connect to API
          await connectWalletToAPI(status.walletAddress, 'xaman');
          
          // Update state
          setAccount(status.walletAddress);
          setIsConnected(true);
          setIsWalletConnectedViaAPI(true);
          localStorage.setItem('xamanWalletAddress', status.walletAddress);
          localStorage.setItem('xamanWalletConnected', 'true');
          clearStoredWalletSession('xaman');
          
          // Clear connection data
          setXamanConnectionData(null);
          
          // Callback
          onConnected?.(status.walletAddress);
        } else if (status.status === 'cancelled') {
          // Stop polling
          if (xamanPollingInterval) {
            clearInterval(xamanPollingInterval);
            setXamanPollingInterval(null);
          }
          
          toast.error('XAMAN connection cancelled');
          setXamanConnectionData(null);
          onCancelled?.();
        }
        // If status is 'pending', continue polling
      }
    };

    // Poll immediately, then every 2 seconds
    poll();
    const interval = setInterval(poll, 2000);
    setXamanPollingInterval(interval);
  };

  const stopXamanPolling = () => {
    if (xamanPollingInterval) {
      clearInterval(xamanPollingInterval);
      setXamanPollingInterval(null);
    }
    setXamanConnectionData(null);
  };

  const disconnectWallet = (options = {}) => {
    const { suppressToast } = options || {};

    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setIsWalletConnectedViaAPI(false);
    
    // Clear MetaMask data
    localStorage.removeItem('metamaskWalletConnected');
    localStorage.removeItem('metamaskWalletAddress');

    // Clear WalletConnect data
    localStorage.removeItem('walletconnectWalletConnected');
    localStorage.removeItem('walletconnectWalletAddress');
    
    // Clear XAMAN data
    localStorage.removeItem('xamanWalletConnected');
    localStorage.removeItem('xamanWalletAddress');
    localStorage.removeItem('xamanXummUuid');
    
    // Stop any active polling
    stopXamanPolling();

    disconnectWalletConnect().catch((error) => {
      console.error('Error disconnecting WalletConnect session:', error);
    });
    
    if (!suppressToast) {
      toast.success('Wallet disconnected');
    }
  };

  const switchNetwork = async (targetChainId, chainMeta = {}) => {
    try {
      const wcProvider = getWalletConnectProvider();
      if (wcProvider) {
        await switchWalletConnectChain(wcProvider, {
          chainId: targetChainId,
          ...chainMeta,
        });
        setChainId(Number(targetChainId));
        return;
      }

      if (!window.ethereum) {
        toast.error('No wallet provider available');
        return;
      }

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${Number(targetChainId).toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    }
  };

  // Restore wallet connection status from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Check for MetaMask connection
    const isMetamaskConnected = localStorage.getItem('metamaskWalletConnected') === 'true';
    const metamaskAddress = localStorage.getItem('metamaskWalletAddress');

    if (token && isMetamaskConnected && metamaskAddress) {
      setIsWalletConnectedViaAPI(true);
      // Note: We don't automatically reconnect the wallet extension here
      // User needs to manually connect via the UI
    }

    // WalletConnect is session-only (not via /api/wallet/connect); do not set API flag.

    // Check for XAMAN connection
    const isXamanConnected = localStorage.getItem('xamanWalletConnected') === 'true';
    const xamanAddress = localStorage.getItem('xamanWalletAddress');

    if (token && isXamanConnected && xamanAddress) {
      setIsWalletConnectedViaAPI(true);
      setAccount(xamanAddress);
      setIsConnected(true);
    }
  }, []);

  useEffect(() => {
    const ethereum = window.ethereum;
    if (!ethereum?.on) return undefined;

    const handleAccountsChanged = (accounts) => {
      try {
        if (!Array.isArray(accounts) || accounts.length === 0) {
          if (localStorage.getItem('metamaskWalletConnected') === 'true') {
            disconnectWallet({ suppressToast: true });
          }
          return;
        }

        const next = String(accounts[0] || '').trim();
        if (!next) return;
        if (localStorage.getItem('metamaskWalletConnected') === 'true') {
          setAccount(next);
          localStorage.setItem('metamaskWalletAddress', next);
        }
      } catch (error) {
        console.warn('accountsChanged handler failed:', error);
      }
    };

    const handleChainChanged = (nextChainId) => {
      try {
        const parsed = Number.parseInt(String(nextChainId), 16);
        if (Number.isFinite(parsed)) setChainId(parsed);
      } catch (_) {
        /* ignore */
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectedWalletKind = isConnected && account ? readConnectedWalletKind(account) : null;
  const isExternalWalletConnected = Boolean(
    isConnected && account && (isWalletConnectedViaAPI || connectedWalletKind),
  );
  const connectedWalletLabel = connectedWalletKind
    ? CONNECTED_WALLET_LABELS[connectedWalletKind]
    : isExternalWalletConnected
      ? 'Wallet'
      : null;

  const value = {
    account,
    provider,
    signer,
    isConnected,
    chainId,
    isWalletConnectedViaAPI,
    isExternalWalletConnected,
    connectedWalletKind,
    connectedWalletLabel,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    connectXamanWallet,
    checkXamanConnectionStatus,
    startXamanPolling,
    stopXamanPolling,
    xamanConnectionData,
    setXamanConnectionData,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
