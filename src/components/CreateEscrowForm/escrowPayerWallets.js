import { getApiUrl } from '../../utils/config';
import {
  buildWalletAddressRows,
  DEPOSIT_ADDRESS_CURRENCY_ICON,
  depositAddressCurrencyLabel,
  depositAddressNetworkLabel,
  extractWalletAddresses,
  getDepositNetworksForCurrency,
  resolveDepositAddressFromBalance,
} from '../../utils/depositAddressFlow';
import { readStoredDashboardAccountType } from '../../utils/custodialWalletBalances';

export const PAYER_WALLET_ICONS = {
  custodial: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
  xaman:
    'https://cdn.prod.website-files.com/66ffb9c73bc7e83a1e0e1006/67028cc20682f3c6f7ec6161_Xaman%20Logo.svg',
  metamask: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
  connected: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
};

export const maskWalletAddressShort = (addr) => {
  const s = String(addr || '').trim();
  if (!s) return '—';
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
};

export const getPayerWalletIconUrl = (wallet) => {
  if (wallet?.iconUrl) return wallet.iconUrl;
  if (wallet?.currency && DEPOSIT_ADDRESS_CURRENCY_ICON[wallet.currency]) {
    return DEPOSIT_ADDRESS_CURRENCY_ICON[wallet.currency];
  }
  if (wallet?.id && PAYER_WALLET_ICONS[wallet.id]) {
    return PAYER_WALLET_ICONS[wallet.id];
  }
  return PAYER_WALLET_ICONS.connected;
};

/** Map View-wallet row labels → escrow payer option fields. */
const parseWalletRowLabel = (rowLabel) => {
  const label = String(rowLabel || '').trim();
  if (label.includes(' — ')) {
    const [currency, networkRaw] = label.split(' — ').map((part) => part.trim());
    return {
      currency: currency.toUpperCase(),
      label: depositAddressCurrencyLabel(currency),
      network: networkRaw,
    };
  }
  if (label === 'XRP Address') {
    return { currency: 'XRP', label: 'XRP wallet', network: 'XRP Ledger' };
  }
  if (label === 'RLUSD Address') {
    return { currency: 'RLUSD', label: 'Ripple USD wallet', network: 'XRP Ledger' };
  }
  const currency = label.replace(/\s+Address$/i, '').trim().toUpperCase();
  return {
    currency,
    label: depositAddressCurrencyLabel(currency) || `${currency} wallet`,
    network: 'TrustiChain',
  };
};

/** TrustiChain custodial wallets from balance API (XRP, RLUSD, USDT, USDC + networks). */
export const buildCustodialPayerWalletOptions = (apiResult) => {
  if (!apiResult || typeof apiResult !== 'object') return [];

  const rows = buildWalletAddressRows(apiResult);
  if (rows.length > 0) {
    return rows.map((row) => {
      const parsed = parseWalletRowLabel(row.label);
      const currency = parsed.currency || 'XRP';
      return {
        id: `custodial-${row.id}`,
        label: parsed.label,
        network: parsed.network,
        currency,
        address: row.address,
        iconUrl: DEPOSIT_ADDRESS_CURRENCY_ICON[currency] || DEPOSIT_ADDRESS_CURRENCY_ICON.XRP,
        source: 'custodial',
      };
    });
  }

  const options = [];
  const seen = new Set();

  const addOption = (code, networkKey, address) => {
    const normalizedAddress = String(address || '').trim();
    if (!normalizedAddress) return;
    const currency = String(code || '').toUpperCase();
    const network = depositAddressNetworkLabel(networkKey);
    const dedupeKey = `${currency}::${network}::${normalizedAddress}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    options.push({
      id: `custodial-${currency}-${networkKey}`,
      label: depositAddressCurrencyLabel(currency),
      network,
      currency,
      address: normalizedAddress,
      iconUrl: DEPOSIT_ADDRESS_CURRENCY_ICON[currency] || DEPOSIT_ADDRESS_CURRENCY_ICON.XRP,
      source: 'custodial',
    });
  };

  for (const code of ['XRP', 'RLUSD', 'USDT', 'USDC']) {
    for (const networkKey of getDepositNetworksForCurrency(code)) {
      const addr = resolveDepositAddressFromBalance(apiResult, code, networkKey);
      addOption(code, networkKey, addr);
    }
  }

  return options;
};

/** Payer wallets available when paying with TrustiChain. */
export const buildPayerWalletOptions = ({ custodialBalanceRaw, account, isConnected }) => {
  const options = [...buildCustodialPayerWalletOptions(custodialBalanceRaw)];
  const hasWindow = typeof window !== 'undefined';

  const xamanConnected = hasWindow && localStorage.getItem('xamanWalletConnected') === 'true';
  const xamanAddress = hasWindow ? localStorage.getItem('xamanWalletAddress') : '';
  if (xamanConnected && xamanAddress?.trim()) {
    options.push({
      id: 'xaman',
      label: 'XAMAN',
      network: 'XRP Ledger',
      currency: 'XRP',
      address: xamanAddress.trim(),
      iconUrl: PAYER_WALLET_ICONS.xaman,
      source: 'xaman',
    });
  }

  const metamaskConnected =
    hasWindow && localStorage.getItem('metamaskWalletConnected') === 'true';
  if (metamaskConnected && isConnected && account?.trim()) {
    options.push({
      id: 'metamask',
      label: 'MetaMask',
      network: 'EVM',
      currency: 'ETH',
      address: account.trim(),
      iconUrl: PAYER_WALLET_ICONS.metamask,
      source: 'metamask',
    });
  } else if (isConnected && account?.trim() && !xamanConnected) {
    options.push({
      id: 'connected',
      label: 'Connected Wallet',
      network: 'Connected',
      currency: 'XRP',
      address: account.trim(),
      iconUrl: PAYER_WALLET_ICONS.connected,
      source: 'connected',
    });
  }

  return options;
};

/** Full GET wallet/balance payload for custodial wallet resolution. */
export const fetchCustodialWalletBalance = async (signal) => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const accountType = readStoredDashboardAccountType();
  const balanceUrl =
    accountType === 'Business Suite'
      ? getApiUrl('api/business-suite/wallet/balance')
      : getApiUrl('api/wallet/balance');
  const response = await fetch(balanceUrl, {
    method: 'GET',
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return null;
  return response.json();
};

/** First usable on-ledger address (legacy fallback for non–TrustiChain payment paths). */
export const resolveDefaultPayerWalletAddress = (apiResult) => {
  const custodial = buildCustodialPayerWalletOptions(apiResult);
  if (custodial.length > 0) return custodial[0].address;
  if (!apiResult) return '';
  return extractWalletAddresses(apiResult).xrp || extractWalletAddresses(apiResult).rlusd || '';
};
