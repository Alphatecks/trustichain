import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

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

  const connectWallet = async (walletType = 'metamask') => {
    try {
      let ethereumProvider = null;
      let walletName = 'Wallet';

      // Determine which provider to use based on wallet type
      if (walletType === 'walletconnect') {
        // WalletConnect would require additional setup
        // For now, fall back to injected if available
        if (window.ethereum) {
          ethereumProvider = window.ethereum;
          walletName = 'WalletConnect';
        } else {
          toast.error('WalletConnect requires a browser wallet. Please install a wallet extension.');
          return;
        }
      } else if (walletType === 'coinbase') {
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
        if (window.ethereum && window.ethereum.isMetaMask) {
          ethereumProvider = window.ethereum;
          walletName = 'MetaMask';
        } else if (window.ethereum) {
          // Fallback to generic injected if MetaMask not detected but ethereum exists
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

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    toast.success('Wallet disconnected');
  };

  const switchNetwork = async (targetChainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const value = {
    account,
    provider,
    signer,
    isConnected,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
