import { getApiUrl } from './config';

/** Shared deposit-by-address UI helpers (Transactions + Dashboard). */

/** USDT/USDC networks provisioned via GET /api/wallet/deposit-address */
export const STABLECOIN_DEPOSIT_PROVISIONS = [
  { asset: 'USDT', network: 'ERC20' },
  { asset: 'USDT', network: 'TRC20' },
  { asset: 'USDT', network: 'BEP20' },
  { asset: 'USDC', network: 'BEP20' },
  { asset: 'USDC', network: 'SOLANA' },
];

export const DEPOSIT_ADDRESS_CURRENCIES = ['XRP', 'RLUSD', 'USDT', 'USDC'];

export const DEPOSIT_ADDRESS_CURRENCY_ICON = {
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
  RLUSD: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389',
};

export const depositAddressCurrencyLabel = (code) => {
  const mapping = {
    XRP: 'XRP wallet',
    RLUSD: 'RLUSD wallet',
    USDT: 'USDT wallet',
    USDC: 'USDC wallet',
  };
  return mapping[code] || code;
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

  const map =
    d.stablecoinAddresses ||
    d.stablecoin_addresses ||
    apiResult.stablecoinAddresses ||
    apiResult.stablecoin_addresses ||
    d.depositAddresses ||
    d.deposit_addresses ||
    d.receiveAddresses ||
    d.chainAddresses;
  if (map && typeof map === 'object') {
    const byCur = map[currency] ?? map[String(currency).toLowerCase()] ?? map[String(currency).toUpperCase()];
    if (typeof byCur === 'string' && byCur.trim()) return byCur.trim();
    if (byCur && typeof byCur === 'object' && networkKey) {
      const n =
        byCur[networkKey] ??
        byCur[String(networkKey).toLowerCase()] ??
        byCur[String(networkKey).toUpperCase()];
      if (typeof n === 'string' && n.trim()) return n.trim();
      if (n && typeof n === 'object') {
        const nested =
          n.address || n.depositAddress || n.deposit_address || n.walletAddress;
        if (typeof nested === 'string' && nested.trim()) return nested.trim();
      }
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

/** True when balance/create-wallet payload includes at least one USDT and one USDC deposit address. */
export function hasStablecoinDepositAddresses(apiResult) {
  if (!apiResult || typeof apiResult !== 'object') return false;

  const hasForCurrency = (currency) =>
    getDepositNetworksForCurrency(currency).some((network) =>
      Boolean(resolveDepositAddressFromBalance(apiResult, currency, network)),
    );

  return hasForCurrency('USDT') && hasForCurrency('USDC');
}

/**
 * Build display rows for View wallet modal from balance/create-wallet API payloads.
 * @returns {{ id: string, label: string, address: string }[]}
 */
export function buildWalletAddressRows(apiResult) {
  const rows = [];
  const seen = new Set();

  const addRow = (label, address) => {
    const normalizedLabel = String(label || '').trim();
    const normalizedAddress = String(address || '').trim();
    if (!normalizedLabel || !normalizedAddress) return;
    const dedupeKey = `${normalizedLabel}::${normalizedAddress}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    rows.push({ id: dedupeKey, label: normalizedLabel, address: normalizedAddress });
  };

  if (!apiResult || typeof apiResult !== 'object') return rows;

  const { xrp, rlusd } = extractWalletAddresses(apiResult);

  if (xrp) {
    addRow('XRP Address', xrp);
    addRow('RLUSD Address', rlusd || xrp);
  } else if (rlusd) {
    addRow('RLUSD Address', rlusd);
  }

  for (const currency of ['USDT', 'USDC']) {
    for (const network of getDepositNetworksForCurrency(currency)) {
      const addr = resolveDepositAddressFromBalance(apiResult, currency, network);
      if (addr) {
        addRow(`${currency} — ${depositAddressNetworkLabel(network)}`, addr);
      }
    }
  }

  const d = apiResult.data && typeof apiResult.data === 'object' ? apiResult.data : apiResult;
  const map =
    d.stablecoinAddresses ||
    d.stablecoin_addresses ||
    d.depositAddresses ||
    d.deposit_addresses ||
    d.receiveAddresses ||
    d.chainAddresses;
  if (map && typeof map === 'object' && !Array.isArray(map)) {
    for (const [curRaw, val] of Object.entries(map)) {
      const curUpper = String(curRaw).trim().toUpperCase();
      if (typeof val === 'string' && val.trim()) {
        const label =
          curUpper === 'XRP'
            ? 'XRP Address'
            : curUpper === 'RLUSD'
              ? 'RLUSD Address'
              : `${curUpper} Address`;
        addRow(label, val);
      } else if (val && typeof val === 'object' && !Array.isArray(val)) {
        for (const [netRaw, addr] of Object.entries(val)) {
          if (typeof addr !== 'string' || !addr.trim()) continue;
          const net = String(netRaw).trim().toUpperCase();
          addRow(`${curUpper} — ${depositAddressNetworkLabel(net) || netRaw}`, addr);
        }
      }
    }
  }

  return rows;
}

const isRlusdCurrencyKey = (currency) => {
  const normalized = String(currency || '').trim().toLowerCase();
  return normalized === 'rlusd' || normalized === 'rippleusd';
};

/** Normalize custodial wallet balances from balance/create-wallet API payloads. */
export function parseWalletBalancesFromApi(apiResult) {
  const empty = { xrp: 0, usdt: 0, usdc: 0, rlusd: 0 };
  if (!apiResult || typeof apiResult !== 'object') return empty;

  let balances = null;

  if (apiResult?.success && apiResult?.data?.balance) {
    balances = apiResult.data.balance;
  } else if (apiResult?.success && apiResult?.data) {
    const data = apiResult.data;
    if (
      data.xrp !== undefined ||
      data.usdt !== undefined ||
      data.usdc !== undefined ||
      data.rlusd !== undefined ||
      data.RLUSD !== undefined ||
      data.rippleUsd !== undefined ||
      data.ripple_usd !== undefined
    ) {
      balances = {
        xrp: data.xrp || data.XRP || 0,
        usdt: data.usdt || data.USDT || 0,
        usdc: data.usdc || data.USDC || 0,
        rlusd: data.rlusd ?? data.RLUSD ?? data.rippleUsd ?? data.ripple_usd ?? 0,
      };
    }
  } else if (apiResult?.success && Array.isArray(apiResult?.data?.wallets)) {
    balances = {};
    apiResult.data.wallets.forEach((wallet) => {
      const currency = (wallet.currency || wallet.code || '').toLowerCase();
      const balance = wallet.balance ?? wallet.amount ?? 0;
      if (currency === 'xrp') balances.xrp = Number(balance);
      if (currency === 'usdt') balances.usdt = Number(balance);
      if (currency === 'usdc') balances.usdc = Number(balance);
      if (isRlusdCurrencyKey(currency)) balances.rlusd = Number(balance);
    });
  } else if (apiResult?.balance) {
    balances = apiResult.balance;
  }

  if (!balances) return empty;

  return {
    xrp: balances.xrp !== undefined && balances.xrp !== null ? Number(balances.xrp) : 0,
    usdt: balances.usdt !== undefined && balances.usdt !== null ? Number(balances.usdt) : 0,
    usdc: balances.usdc !== undefined && balances.usdc !== null ? Number(balances.usdc) : 0,
    rlusd:
      balances.rlusd !== undefined && balances.rlusd !== null
        ? Number(balances.rlusd)
        : balances.RLUSD !== undefined && balances.RLUSD !== null
          ? Number(balances.RLUSD)
          : balances.rippleUsd !== undefined && balances.rippleUsd !== null
            ? Number(balances.rippleUsd)
            : balances.ripple_usd !== undefined && balances.ripple_usd !== null
              ? Number(balances.ripple_usd)
              : 0,
  };
}

export const splitDepositAddressLines = (addr) => {
  if (!addr || typeof addr !== 'string') return [];
  if (addr.length <= 18) return [addr];
  const mid = Math.ceil(addr.length / 2);
  return [addr.slice(0, mid), addr.slice(mid)];
};

export function extractDepositAddressFromApiResponse(result) {
  if (!result || typeof result !== 'object') return '';
  const nodes = [result.data, result].filter((n) => n && typeof n === 'object');
  const keys = ['address', 'depositAddress', 'deposit_address', 'walletAddress', 'wallet_address'];
  for (const node of nodes) {
    for (const key of keys) {
      const value = node[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return '';
}

/**
 * Provision USDT + USDC deposit addresses (one GET per asset/network).
 * @param {{ token: string, apiBasePath?: string }} options — default `api/wallet`
 */
export async function provisionUsdtUsdcDepositAddresses({ token, apiBasePath = 'api/wallet' }) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const results = await Promise.all(
    STABLECOIN_DEPOSIT_PROVISIONS.map(async ({ asset, network }) => {
      const url = getApiUrl(
        `${apiBasePath}/deposit-address?asset=${encodeURIComponent(asset)}&network=${encodeURIComponent(network)}`,
      );
      try {
        const res = await fetch(url, { method: 'GET', headers });
        const result = await res.json().catch(() => ({}));
        const address = extractDepositAddressFromApiResponse(result);
        const ok = res.ok && result?.success !== false && Boolean(address);
        return { asset, network, ok, address, result };
      } catch (error) {
        return { asset, network, ok: false, address: '', error };
      }
    }),
  );

  return {
    results,
    succeeded: results.filter((r) => r.ok),
    failed: results.filter((r) => !r.ok),
  };
}
