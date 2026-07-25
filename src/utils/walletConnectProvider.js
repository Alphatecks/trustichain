import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { WALLETCONNECT_PROJECT_ID } from './config';

let walletConnectProvider = null;

/** Ethereum + BSC required for Reown USDT/USDC EVM deposits; others optional. */
const REQUIRED_CHAIN = 1;
const OPTIONAL_CHAINS = [56, 137, 42161, 10, 8453];

const toHexChainId = (chainId) => {
  const n = Number(chainId);
  if (!Number.isFinite(n)) {
    throw new Error('Invalid chain id');
  }
  return `0x${n.toString(16)}`;
};

const getAppOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://trustichain.com';
};

const parseSessionAccounts = (provider) => {
  const sessionAccounts = provider?.session?.namespaces?.eip155?.accounts;
  if (!Array.isArray(sessionAccounts) || sessionAccounts.length === 0) {
    return [];
  }

  return sessionAccounts
    .map((entry) => {
      const parts = String(entry).split(':');
      return parts[parts.length - 1];
    })
    .filter(Boolean);
};

const normalizeAccounts = (accounts) => {
  if (!Array.isArray(accounts)) return [];
  return accounts.map((entry) => String(entry).trim()).filter(Boolean);
};

async function resolveWalletConnectAccounts(provider) {
  const cached = normalizeAccounts(provider.accounts);
  if (cached.length) return cached;

  const fromSession = parseSessionAccounts(provider);
  if (fromSession.length) return fromSession;

  try {
    const requested = normalizeAccounts(
      await provider.request({ method: 'eth_requestAccounts' }),
    );
    if (requested.length) return requested;
  } catch (error) {
    if (isWalletConnectUserRejected(error)) throw error;
    console.warn('[WalletConnect] eth_requestAccounts failed:', error);
  }

  try {
    const existing = normalizeAccounts(await provider.request({ method: 'eth_accounts' }));
    if (existing.length) return existing;
  } catch (error) {
    console.warn('[WalletConnect] eth_accounts failed:', error);
  }

  return [];
}

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

  // Do not override `methods` / `events` — the SDK defaults include
  // eth_requestAccounts and eth_accounts, which are required to receive addresses.
  walletConnectProvider = await EthereumProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [REQUIRED_CHAIN],
    optionalChains: OPTIONAL_CHAINS,
    showQrModal: true,
    qrModalOptions: {
      themeVariables: {
        '--wcm-z-index': '15000',
      },
      // Desktop MetaMask uses the injected extension button in ReownFundModal.
      // Keep mobile MetaMask featured; do not put Trust first (it steals focus).
      explorerRecommendedWalletIds: [
        'c57ca17b541851d341bb23445af5ef4bb6beb82acf4bd3476d8304cea4aaa', // MetaMask
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      ],
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
  let provider = await initWalletConnectProvider();

  // Drop stale sessions that connected without granting accounts.
  if (provider.connected) {
    const existingAccounts = await resolveWalletConnectAccounts(provider);
    if (!existingAccounts.length) {
      await disconnectWalletConnect();
      provider = await initWalletConnectProvider();
    }
  }

  let accounts = [];

  if (!provider.connected) {
    // enable() runs connect + eth_requestAccounts (recommended WalletConnect flow).
    try {
      accounts = normalizeAccounts(await provider.enable());
    } catch (error) {
      if (isWalletConnectUserRejected(error)) throw error;
      console.warn('[WalletConnect] enable() failed:', error);
    }
  }

  if (!accounts.length) {
    accounts = await resolveWalletConnectAccounts(provider);
  }

  if (!accounts.length) {
    throw new Error(
      'No accounts returned from WalletConnect. Use an EVM wallet (MetaMask, Trust Wallet, Rainbow, etc.) and approve account sharing. For XRPL, connect with XAMAN instead.',
    );
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

/**
 * Switch the active WalletConnect chain; add the chain when the wallet doesn't know it.
 */
export async function switchWalletConnectChain(
  provider,
  { chainId, chainName, rpcUrl, nativeCurrency, blockExplorerUrl } = {},
) {
  const wc = provider || walletConnectProvider;
  if (!wc) {
    throw new Error('WalletConnect provider is not initialized');
  }
  if (!chainId) {
    throw new Error('Target chain id is required');
  }

  const hexChainId = toHexChainId(chainId);

  try {
    await wc.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return;
  } catch (switchError) {
    if (isWalletConnectUserRejected(switchError)) throw switchError;

    const needsAdd =
      switchError?.code === 4902 ||
      String(switchError?.message || '')
        .toLowerCase()
        .includes('unrecognized chain');

    if (!needsAdd) throw switchError;
  }

  if (!rpcUrl) {
    throw new Error(
      `Wallet does not support chain ${chainId} and no RPC URL was provided to add it.`,
    );
  }

  const currency =
    nativeCurrency && typeof nativeCurrency === 'object'
      ? {
          name: nativeCurrency.name || 'Ether',
          symbol: nativeCurrency.symbol || 'ETH',
          decimals:
            nativeCurrency.decimals != null ? Number(nativeCurrency.decimals) : 18,
        }
      : Number(chainId) === 56
        ? { name: 'BNB', symbol: 'BNB', decimals: 18 }
        : { name: 'Ether', symbol: 'ETH', decimals: 18 };

  await wc.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: hexChainId,
        chainName: chainName || `Chain ${chainId}`,
        nativeCurrency: currency,
        rpcUrls: [rpcUrl],
        blockExplorerUrls: blockExplorerUrl ? [blockExplorerUrl] : undefined,
      },
    ],
  });

  await wc.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: hexChainId }],
  });
}
