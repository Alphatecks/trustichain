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

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const network = await provider.getNetwork();

        setAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setIsConnected(true);
        setChainId(network.chainId);

        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
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
