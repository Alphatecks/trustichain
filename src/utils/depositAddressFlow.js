/** Shared deposit-by-address UI helpers (Transactions + Dashboard). */

export const DEPOSIT_ADDRESS_CURRENCY_ICON = {
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
  RLUSD: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389',
};

export const DEPOSIT_ADDRESS_NETWORK_KEYS = {
  XRP: ['XRPL'],
  RLUSD: ['XRPL'],
  USDT: ['ERC20', 'TRC20', 'BEP20'],
  USDC: ['BEP20', 'SOLANA'],
};

export const getDepositNetworksForCurrency = (currency) =>
  DEPOSIT_ADDRESS_NETWORK_KEYS[currency] ?? DEPOSIT_ADDRESS_NETWORK_KEYS.XRP;

export const depositAddressNetworkLabel = (key) => {
  if (key === 'XRPL') return 'XRP Ledger';
  if (key === 'ERC20') return 'ERC 20';
  if (key === 'TRC20') return 'TRC 20';
  if (key === 'BEP20') return 'BEP 20';
  if (key === 'SOLANA') return 'Solana';
  return key;
};

export const extractWalletAddresses = (payload, fallbackAddress = '') => {
  const sources = [payload, payload?.data, payload?.result, payload?.wallet].filter(
    (node) => node && typeof node === 'object'
  );
  const pick = (keys) => {
    for (const src of sources) {
      for (const key of keys) {
        const value = src?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
    }
    return '';
  };
  const xrpAddress = pick([
    'xrplAddress',
    'xrpl_address',
    'walletAddress',
    'address',
    'xrpAddress',
    'xrp_address',
  ]);
  const rlusdAddress = pick([
    'rlusdAddress',
    'rlusd_address',
    'rippleUsdAddress',
    'ripple_usd_address',
    'rippleAddress',
    'ripple_address',
  ]);

  const normalizedXrp = String(xrpAddress || fallbackAddress || '').trim();
  const normalizedRlusd = String(rlusdAddress || normalizedXrp).trim();
  return { xrp: normalizedXrp, rlusd: normalizedRlusd };
};

export const resolveDepositAddressFromBalance = (apiResult, currency, networkKey) => {
  if (!apiResult || typeof apiResult !== 'object') return '';
  const d = apiResult.data && typeof apiResult.data === 'object' ? apiResult.data : {};

  const map = d.depositAddresses || d.deposit_addresses || d.receiveAddresses || d.chainAddresses;
  if (map && typeof map === 'object') {
    const byCur = map[currency] ?? map[String(currency).toLowerCase()];
    if (typeof byCur === 'string' && byCur.trim()) return byCur.trim();
    if (byCur && typeof byCur === 'object' && networkKey) {
      const n = byCur[networkKey] ?? byCur[String(networkKey).toLowerCase()];
      if (typeof n === 'string' && n.trim()) return n.trim();
    }
  }

  const fallback =
    d.xrplAddress ||
    d.xrpl_address ||
    d.walletAddress ||
    d.address ||
    apiResult.xrplAddress ||
    '';

  const { xrp, rlusd } = extractWalletAddresses(apiResult, typeof fallback === 'string' ? fallback : '');

  if (currency === 'RLUSD') {
    return (rlusd || xrp || '').trim();
  }

  if (networkKey === 'SOLANA') {
    const sol = d.solanaAddress || d.solana_address || d.solDepositAddress;
    if (typeof sol === 'string' && sol.trim()) return sol.trim();
  }

  if (networkKey === 'TRC20') {
    const tron = d.tronAddress || d.tron_address || d.trxAddress || d.trx_address;
    if (typeof tron === 'string' && tron.trim()) return tron.trim();
  }

  if (networkKey === 'XRPL' || currency === 'XRP') {
    return (xrp || '').trim();
  }

  const evm =
    d.evmAddress ||
    d.evm_address ||
    d.ethereumAddress ||
    d.ethAddress ||
    (networkKey === 'BEP20' ? d.bscAddress || d.bsc_address || d.bnbAddress : null) ||
    d.defaultEvmAddress;

  if (typeof evm === 'string' && evm.trim()) {
    return evm.trim();
  }

  return (xrp || '').trim();
};

export const splitDepositAddressLines = (addr) => {
  if (!addr || typeof addr !== 'string') return [];
  if (addr.length <= 18) return [addr];
  const mid = Math.ceil(addr.length / 2);
  return [addr.slice(0, mid), addr.slice(mid)];
};
