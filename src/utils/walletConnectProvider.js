import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WALLETCONNECT_PROJECT_ID } from './config';

let walletConnectProvider = null;

const getAppOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://trustichain.com';
};

export function getWalletConnectProvider() {
  return walletConnectProvider;
}

export async function initWalletConnectProvider() {
  if (!WALLETCONNECT_PROJECT_ID) {
    throw new Error('WalletConnect project ID is not configured');
  }

  if (walletConnectProvider) {
    return walletConnectProvider;
  }

  const origin = getAppOrigin();

  walletConnectProvider = await EthereumProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    optionalChains: [1, 137, 56, 42161, 10, 8453],
    showQrModal: true,
    qrModalOptions: {
      themeVariables: {
        '--wcm-z-index': '15000',
      },
    },
    metadata: {
      name: 'TrustiChain',
      description: 'TrustiChain Escrow Platform',
      url: origin,
      icons: [`${origin}/trustichain-logo.png`],
    },
  });

  return walletConnectProvider;
}

export async function connectWalletConnect() {
  const provider = await initWalletConnectProvider();

  if (!provider.connected) {
    await provider.connect();
  }

  const accounts = provider.accounts;
  if (!accounts?.length) {
    throw new Error('No accounts returned from WalletConnect');
  }

  return {
    provider,
    accounts,
    account: accounts[0],
  };
}

export async function disconnectWalletConnect() {
  if (walletConnectProvider?.connected) {
    try {
      await walletConnectProvider.disconnect();
    } catch (error) {
      console.error('Error disconnecting WalletConnect provider:', error);
    }
  }
  walletConnectProvider = null;
}

export function isWalletConnectUserRejected(error) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    error?.code === 4001 ||
    message.includes('user closed') ||
    message.includes('user rejected') ||
    message.includes('connection request reset')
  );
}
