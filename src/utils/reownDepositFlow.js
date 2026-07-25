import { ethers } from 'ethers';
import { getApiUrl } from './config';
import {
  extractDepositAddressFromApiResponse,
  resolveDepositAddressFromBalance,
} from './depositAddressFlow';
import {
  connectWalletConnect,
  getWalletConnectProvider,
  isWalletConnectUserRejected,
  switchWalletConnectChain,
} from './walletConnectProvider';

/** EVM pairs supported by Reown Fund with Wallet (v1). */
export const REOWN_EVM_DEPOSIT_PAIRS = {
  USDT: ['ERC20', 'BEP20'],
  USDC: ['BEP20'],
};

export const REOWN_EVM_CURRENCIES = Object.keys(REOWN_EVM_DEPOSIT_PAIRS);

export const getReownNetworksForCurrency = (currency) =>
  REOWN_EVM_DEPOSIT_PAIRS[currency] || REOWN_EVM_DEPOSIT_PAIRS.USDT;

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
];

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

const getToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Please login to fund your wallet');
  }
  return token;
};

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  return data;
}

function pairKey(asset, network) {
  return `${String(asset).toUpperCase()}:${String(network).toUpperCase()}`;
}

function coerceChainId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith('0x') || raw.startsWith('0X')) {
    const n = Number.parseInt(raw, 16);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeFundingEntry(raw, assetHint, networkHint) {
  if (!raw || typeof raw !== 'object') return null;

  const asset = String(raw.asset || raw.currency || raw.token || assetHint || '')
    .trim()
    .toUpperCase();
  const network = String(raw.network || raw.chain || raw.standard || networkHint || '')
    .trim()
    .toUpperCase();
  if (!asset || !network) return null;

  const chainId = coerceChainId(
    raw.chainId ?? raw.chain_id ?? raw.evmChainId ?? raw.evm_chain_id,
  );
  const tokenAddress = String(
    raw.tokenAddress ||
      raw.token_address ||
      raw.contractAddress ||
      raw.contract_address ||
      raw.address ||
      '',
  ).trim();
  const decimalsRaw = raw.decimals ?? raw.tokenDecimals ?? raw.token_decimals;
  const decimals =
    decimalsRaw == null || decimalsRaw === ''
      ? 6
      : Number(decimalsRaw);
  const rpcUrl = String(
    raw.rpcUrl || raw.rpc_url || raw.rpc || raw.httpRpcUrl || '',
  ).trim();
  const env = String(raw.env || raw.environment || raw.networkEnv || '').trim();
  const chainName = String(raw.chainName || raw.chain_name || raw.name || network).trim();
  const nativeCurrency = raw.nativeCurrency || raw.native_currency || null;
  const blockExplorerUrl = String(
    raw.blockExplorerUrl ||
      raw.block_explorer_url ||
      raw.explorerUrl ||
      raw.explorer_url ||
      '',
  ).trim();

  if (!chainId || !tokenAddress) return null;

  return {
    asset,
    network,
    chainId,
    tokenAddress,
    decimals: Number.isFinite(decimals) ? decimals : 6,
    rpcUrl,
    env,
    chainName,
    nativeCurrency,
    blockExplorerUrl,
  };
}

/**
 * Flatten funding-config payloads into asset:network → config map.
 */
export function parseFundingConfig(payload) {
  const lookup = {};
  const root =
    payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  if (!root || typeof root !== 'object') return lookup;

  const ingest = (entry, assetHint, networkHint) => {
    const normalized = normalizeFundingEntry(entry, assetHint, networkHint);
    if (!normalized) return;
    lookup[pairKey(normalized.asset, normalized.network)] = normalized;
  };

  const candidates = [
    root.pairs,
    root.networks,
    root.tokens,
    root.assets,
    root.config,
    root.fundingPairs,
    root.supportedPairs,
  ];

  for (const list of candidates) {
    if (Array.isArray(list)) {
      list.forEach((item) => ingest(item));
    }
  }

  // Nested map: { USDT: { ERC20: {...} } } or { ERC20: { USDT: {...} } }
  const nestedRoots = [root.byAsset, root.byNetwork, root.stablecoins, root];
  for (const nested of nestedRoots) {
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) continue;
    for (const [keyA, valA] of Object.entries(nested)) {
      if (!valA || typeof valA !== 'object' || Array.isArray(valA)) continue;
      // Skip non-map bags
      if (
        ['pairs', 'networks', 'tokens', 'assets', 'config', 'multichainNetwork'].includes(
          keyA,
        )
      ) {
        continue;
      }
      const upperA = String(keyA).toUpperCase();
      if (typeof valA.chainId !== 'undefined' || valA.tokenAddress || valA.contractAddress) {
        ingest(valA, upperA.includes('USD') ? upperA : undefined, upperA);
        continue;
      }
      for (const [keyB, valB] of Object.entries(valA)) {
        if (!valB || typeof valB !== 'object') continue;
        const upperB = String(keyB).toUpperCase();
        if (upperA === 'USDT' || upperA === 'USDC') {
          ingest(valB, upperA, upperB);
        } else if (upperB === 'USDT' || upperB === 'USDC') {
          ingest(valB, upperB, upperA);
        } else {
          ingest(valB, upperA, upperB);
        }
      }
    }
  }

  if (Array.isArray(root)) {
    root.forEach((item) => ingest(item));
  }

  return lookup;
}

export function getFundingPairConfig(fundingLookup, asset, network) {
  const key = pairKey(asset, network);
  const config = fundingLookup?.[key];
  if (!config) {
    throw new Error(
      `Funding config missing for ${String(asset).toUpperCase()} / ${String(network).toUpperCase()}.`,
    );
  }
  return config;
}

export async function ensureCustodialWallet(token = getToken()) {
  const response = await fetch(getApiUrl('api/wallet/create'), {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await parseJsonResponse(response);
  // Already-exists is fine for this step.
  if (!response.ok && data?.success === false) {
    const msg = String(data?.message || '').toLowerCase();
    if (!msg.includes('already') && !msg.includes('exist')) {
      throw new Error(data?.message || 'Failed to create custodial wallet');
    }
  }
  return data;
}

export async function fetchFundingConfig(token = getToken()) {
  const response = await fetch(getApiUrl('api/wallet/funding-config'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || 'Failed to load funding config');
  }
  const lookup = parseFundingConfig(data);
  if (!Object.keys(lookup).length) {
    throw new Error('Funding config returned no EVM token pairs');
  }
  return { raw: data, lookup };
}

export async function fetchDepositAddress(asset, network, token = getToken()) {
  const url = getApiUrl(
    `api/wallet/deposit-address?asset=${encodeURIComponent(asset)}&network=${encodeURIComponent(network)}`,
  );
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });
  const data = await parseJsonResponse(response);
  let address = extractDepositAddressFromApiResponse(data);

  if ((!response.ok || !address) && response.ok) {
    address = resolveDepositAddressFromBalance(data, asset, network);
  }

  if (!address) {
    // Fallback: balance.stablecoinAddresses
    const balanceRes = await fetch(getApiUrl('api/wallet/balance'), {
      method: 'GET',
      headers: authHeaders(token),
    });
    const balanceData = await parseJsonResponse(balanceRes);
    address = resolveDepositAddressFromBalance(balanceData, asset, network);
  }

  if (!address) {
    throw new Error(
      data?.message ||
        `No deposit address for ${asset} on ${network}. Try Fund with Address or create your wallet first.`,
    );
  }

  return { address, raw: data };
}

export async function notifyDeposit({ asset, network, txHash }, token = getToken()) {
  const response = await fetch(getApiUrl('api/wallet/deposits/notify'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      asset: String(asset).toUpperCase(),
      network: String(network).toUpperCase(),
      txHash,
    }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || 'Failed to notify deposit');
  }
  return data;
}

export function normalizeDepositStatus(payload) {
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const statusRaw = String(
    root?.status || root?.depositStatus || root?.state || payload?.status || '',
  )
    .trim()
    .toLowerCase();

  if (
    statusRaw.includes('credit') ||
    statusRaw === 'completed' ||
    statusRaw === 'complete' ||
    statusRaw === 'success' ||
    statusRaw === 'confirmed'
  ) {
    return 'credited';
  }
  if (
    statusRaw.includes('fail') ||
    statusRaw.includes('reject') ||
    statusRaw.includes('error') ||
    statusRaw === 'expired'
  ) {
    return 'failed';
  }
  if (statusRaw) return 'pending';
  if (payload?.success === true && !statusRaw) return 'pending';
  return 'pending';
}

export async function fetchDepositStatus(txHash, network, token = getToken()) {
  const url = getApiUrl(
    `api/wallet/deposits/status?txHash=${encodeURIComponent(txHash)}&network=${encodeURIComponent(network)}`,
  );
  const response = await fetch(url, {
    method: 'GET',
    headers: authHeaders(token),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || 'Failed to fetch deposit status');
  }
  return {
    raw: data,
    status: normalizeDepositStatus(data),
  };
}

/**
 * Poll deposit status until credited/failed or timeout.
 */
export async function pollDepositStatus(
  txHash,
  network,
  {
    token = getToken(),
    intervalMs = 3000,
    timeoutMs = 180000,
    onTick,
    signal,
  } = {},
) {
  const started = Date.now();
  let last = null;

  while (Date.now() - started < timeoutMs) {
    if (signal?.aborted) {
      throw new Error('Deposit status polling cancelled');
    }
    last = await fetchDepositStatus(txHash, network, token);
    if (typeof onTick === 'function') onTick(last);
    if (last.status === 'credited' || last.status === 'failed') {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return last || { status: 'pending', raw: null };
}

const toHexChainId = (chainId) => `0x${Number(chainId).toString(16)}`;

/** Wallets that spoof `isMetaMask` — never treat these as MetaMask. */
const isSpoofedMetaMaskProvider = (provider) => {
  if (!provider) return true;
  return Boolean(
    provider.isTrust ||
      provider.isTrustWallet ||
      provider.isCoinbaseWallet ||
      provider.isBraveWallet ||
      provider.isRabby ||
      provider.isOkxWallet ||
      provider.isOkx ||
      provider.isTokenPocket ||
      provider.isMathWallet ||
      provider.isExodus ||
      provider.isFrame ||
      provider.isPhantom ||
      provider.isAvalanche ||
      provider.isKuCoinWallet ||
      provider.isBitKeep ||
      provider.isBitget ||
      provider.isOpera ||
      provider.isRainbow,
  );
};

/** Real MetaMask exposes `_metamask` and is not another branded injected wallet. */
const isGenuineMetaMaskProvider = (provider) => {
  if (!provider || isSpoofedMetaMaskProvider(provider)) return false;
  // Official MetaMask marker (Trust/Rainbow/etc. usually lack this).
  if (provider._metamask && typeof provider._metamask === 'object') return true;
  return Boolean(provider.isMetaMask && !isSpoofedMetaMaskProvider(provider));
};

/** EIP-6963 discovery — most reliable way to pick MetaMask among multi-injected wallets. */
function discoverEip6963MetaMaskProvider() {
  if (typeof window === 'undefined' || typeof Event === 'undefined') return null;

  const providers = [];
  const onAnnounce = (event) => {
    if (event?.detail?.info && event?.detail?.provider) {
      providers.push(event.detail);
    }
  };

  window.addEventListener('eip6963:announceProvider', onAnnounce);
  try {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  } finally {
    window.removeEventListener('eip6963:announceProvider', onAnnounce);
  }

  const metamask = providers.find((entry) => {
    const rdns = String(entry?.info?.rdns || '').toLowerCase();
    const name = String(entry?.info?.name || '').toLowerCase();
    return (
      rdns === 'io.metamask' ||
      rdns === 'io.metamask.flask' ||
      name === 'metamask' ||
      name === 'metamask flask'
    );
  });

  return metamask?.provider || null;
}

/** Prefer the genuine MetaMask provider when multiple extensions are injected. */
export function getInjectedMetaMaskProvider() {
  if (typeof window === 'undefined') return null;

  const fromEip6963 = discoverEip6963MetaMaskProvider();
  if (fromEip6963 && isGenuineMetaMaskProvider(fromEip6963)) {
    return fromEip6963;
  }
  if (fromEip6963 && !isSpoofedMetaMaskProvider(fromEip6963)) {
    return fromEip6963;
  }

  const { ethereum } = window;
  if (!ethereum) return null;

  if (Array.isArray(ethereum.providers) && ethereum.providers.length) {
    const metamask = ethereum.providers.find(isGenuineMetaMaskProvider);
    if (metamask) return metamask;
  }

  if (isGenuineMetaMaskProvider(ethereum)) {
    return ethereum;
  }

  return null;
}

export async function connectInjectedMetaMask() {
  const ethereum = getInjectedMetaMaskProvider();
  if (!ethereum) {
    throw new Error(
      'MetaMask extension not found. Install MetaMask for Chrome/Firefox, or use WalletConnect with MetaMask mobile.',
    );
  }

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const account = Array.isArray(accounts) ? accounts[0] : null;
  if (!account) {
    throw new Error('No MetaMask account returned. Unlock MetaMask and try again.');
  }

  return { provider: ethereum, account };
}

async function switchInjectedChain(
  ethereum,
  { chainId, chainName, rpcUrl, nativeCurrency, blockExplorerUrl } = {},
) {
  if (!ethereum || !chainId) {
    throw new Error('Injected provider and chain id are required');
  }

  const hexChainId = toHexChainId(chainId);

  try {
    await ethereum.request({
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

  await ethereum.request({
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
}

/**
 * Connect wallet (MetaMask injected or WalletConnect), switch chain, transfer ERC-20.
 * @param {'metamask'|'walletconnect'} [walletSource='walletconnect']
 */
export async function sendReownErc20Deposit({
  asset,
  network,
  amount,
  depositAddress,
  fundingConfig,
  walletSource = 'walletconnect',
}) {
  if (!depositAddress || !ethers.utils.isAddress(depositAddress)) {
    throw new Error('Invalid deposit address');
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw new Error('Enter a valid amount greater than 0');
  }

  if (!fundingConfig) {
    throw new Error(`Funding config required for ${asset}/${network}`);
  }
  const { chainId, tokenAddress, decimals, rpcUrl, chainName, nativeCurrency, blockExplorerUrl } =
    fundingConfig;

  if (!ethers.utils.isAddress(tokenAddress)) {
    throw new Error(`Invalid token contract for ${asset}/${network}`);
  }

  let ethereumProvider;
  let account;

  if (walletSource === 'metamask') {
    const connected = await connectInjectedMetaMask();
    ethereumProvider = connected.provider;
    account = connected.account;
    await switchInjectedChain(ethereumProvider, {
      chainId,
      chainName: chainName || network,
      rpcUrl,
      nativeCurrency,
      blockExplorerUrl,
    });
  } else {
    const connected = await connectWalletConnect();
    ethereumProvider = connected.provider;
    account = connected.account;
    await switchWalletConnectChain(ethereumProvider, {
      chainId,
      chainName: chainName || network,
      rpcUrl,
      nativeCurrency,
      blockExplorerUrl,
    });
  }

  const ethersProvider = new ethers.providers.Web3Provider(ethereumProvider);
  // Re-bind after chain switch so reads/writes hit the selected network.
  await ethersProvider.send('eth_chainId', []).catch(() => null);
  const signer = ethersProvider.getSigner();
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);

  let tokenDecimals = decimals;
  try {
    const onChainDecimals = await token.decimals();
    if (onChainDecimals != null) tokenDecimals = Number(onChainDecimals);
  } catch (error) {
    console.warn('[ReownDeposit] token.decimals() failed; using funding-config decimals', error);
  }

  const value = ethers.utils.parseUnits(String(amount), tokenDecimals);

  try {
    const balance = await token.balanceOf(account);
    if (balance.lt(value)) {
      const available = ethers.utils.formatUnits(balance, tokenDecimals);
      throw new Error(
        `Insufficient ${String(asset).toUpperCase()} in this wallet on the selected network. ` +
          `Trying to send ${amount}, wallet has ${available}. ` +
          `Fund MetaMask with that token (contract ${tokenAddress}) first.`,
      );
    }
  } catch (error) {
    if (String(error?.message || '').startsWith('Insufficient')) throw error;
    console.warn('[ReownDeposit] balanceOf check failed; continuing to transfer', error);
  }

  try {
    const tx = await token.transfer(depositAddress, value);
    const receipt = await tx.wait();
    const txHash = receipt?.transactionHash || tx.hash;
    if (!txHash) {
      throw new Error('Transfer submitted but no transaction hash was returned');
    }
    return {
      txHash,
      account,
      chainId,
      provider:
        walletSource === 'walletconnect'
          ? getWalletConnectProvider() || ethereumProvider
          : ethereumProvider,
      walletSource,
    };
  } catch (error) {
    if (isWalletConnectUserRejected(error)) {
      const err = new Error('Transfer cancelled in wallet');
      err.code = 4001;
      throw err;
    }
    throw new Error(humanizeEvmTransferError(error, asset));
  }
}

export function humanizeEvmTransferError(error, asset = 'token') {
  const nested =
    error?.error?.message ||
    error?.reason ||
    error?.data?.message ||
    error?.message ||
    '';
  const text = String(nested);

  if (/transfer amount exceeds balance/i.test(text)) {
    return (
      `Insufficient ${String(asset).toUpperCase()} balance in your wallet for this network/token. ` +
      'Lower the amount or add tokens to MetaMask first.'
    );
  }
  if (/UNPREDICTABLE_GAS_LIMIT/i.test(text) || /cannot estimate gas/i.test(text)) {
    return (
      `Transfer would fail on-chain (often insufficient ${String(asset).toUpperCase()} balance). ` +
      'Check wallet balance on the selected network and try a smaller amount.'
    );
  }
  if (text && text.length < 220) return text;
  return 'Transfer failed. Check wallet balance, network, and amount, then try again.';
}

/**
 * Full Reown deposit orchestration used by the Dashboard modal.
 */
export async function runReownEvmDeposit({
  asset,
  network,
  amount,
  walletSource = 'walletconnect',
  onPhase,
  signal,
}) {
  const token = getToken();
  const emit = (phase, extra = {}) => {
    if (typeof onPhase === 'function') onPhase(phase, extra);
  };

  emit('preparing');
  await ensureCustodialWallet(token);

  emit('loading_config');
  const { lookup } = await fetchFundingConfig(token);
  const fundingConfig = getFundingPairConfig(lookup, asset, network);

  emit('resolving_address');
  const { address: depositAddress } = await fetchDepositAddress(asset, network, token);

  emit('connecting_wallet', { depositAddress, fundingConfig, walletSource });
  const { txHash, account } = await sendReownErc20Deposit({
    asset,
    network,
    amount,
    depositAddress,
    fundingConfig,
    walletSource,
  });

  emit('notifying', { txHash, account, depositAddress });
  try {
    await notifyDeposit({ asset, network, txHash }, token);
  } catch (error) {
    // Still poll — cron may credit even if notify fails.
    console.warn('[ReownDeposit] notify failed:', error);
    emit('notify_failed', { txHash, error });
  }

  emit('polling', { txHash });
  const result = await pollDepositStatus(txHash, network, {
    token,
    signal,
    onTick: (tick) => emit('polling', { txHash, ...tick }),
  });

  emit('done', { txHash, account, depositAddress, ...result });
  return {
    txHash,
    account,
    depositAddress,
    status: result.status,
    raw: result.raw,
  };
}
