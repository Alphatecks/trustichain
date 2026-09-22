/**
 * Shared parsing for GET api/wallet/balance and GET api/business-suite/wallet/balance responses.
 */

export function readStoredDashboardAccountType() {
  try {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
  } catch (_) {
    /* ignore */
  }
  return 'Personal';
}

function isCustodialBalanceRlusdCode(currency) {
  const normalized = String(currency || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');
  return normalized === 'rlusd' || normalized === 'rippleusd';
}

export function emptyCustodialWalletBalances() {
  return { RLUSD: 0, XRP: 0, USDT: 0, USDC: 0 };
}

/** Personal / Business Suite wallet balance JSON → per-currency numbers (handles balance object, wallets[], top-level aliases). */
export function parseCustodialWalletBalances(apiJson) {
  const out = emptyCustodialWalletBalances();
  const data = apiJson?.data;

  const assignFromBalanceObj = (b) => {
    if (!b || typeof b !== 'object') return;
    if (b.xrp !== undefined || b.XRP !== undefined) {
      out.XRP = Number(b.xrp ?? b.XRP ?? 0);
    }
    if (
      b.rlusd !== undefined ||
      b.RLUSD !== undefined ||
      b.rippleUsd !== undefined ||
      b.ripple_usd !== undefined ||
      b.xrpusd !== undefined
    ) {
      out.RLUSD = Number(
        b.rlusd ?? b.RLUSD ?? b.rippleUsd ?? b.ripple_usd ?? b.xrpusd ?? 0,
      );
    }
    if (b.usdt !== undefined || b.USDT !== undefined) {
      out.USDT = Number(b.usdt ?? b.USDT ?? 0);
    }
    if (b.usdc !== undefined || b.USDC !== undefined) {
      out.USDC = Number(b.usdc ?? b.USDC ?? 0);
    }
  };

  const readWalletAmount = (w) => {
    if (w == null) return NaN;
    if (typeof w !== 'object') return Number(w);
    const nested = w.balance;
    const candidates = [
      w.availableBalance,
      w.available_balance,
      w.available,
      typeof nested === 'object' && nested != null
        ? nested.available ?? nested.amount ?? nested.value ?? nested.balance
        : nested,
      w.amount,
      w.total,
      w.value,
      w.qty,
    ];
    for (const candidate of candidates) {
      if (candidate == null || candidate === '') continue;
      const n = Number(candidate);
      if (Number.isFinite(n)) return n;
    }
    return NaN;
  };

  if (data?.balance && typeof data.balance === 'object' && !Array.isArray(data.balance)) {
    assignFromBalanceObj(data.balance);
  }
  if (data?.balances && typeof data.balances === 'object' && !Array.isArray(data.balances)) {
    assignFromBalanceObj(data.balances);
  }
  if (data && typeof data === 'object') {
    assignFromBalanceObj(data);
  }

  const walletLists = [data?.wallets, apiJson?.wallets, apiJson?.data?.wallets].filter(Array.isArray);
  walletLists.forEach((list) => {
    list.forEach((w) => {
      const currencyRaw = w?.currency || w?.code || w?.asset || '';
      const c = String(currencyRaw).toLowerCase().replace(/[\s_-]/g, '');
      const balance = readWalletAmount(w);
      if (!Number.isFinite(balance)) return;
      if (c === 'xrp') out.XRP = balance;
      else if (isCustodialBalanceRlusdCode(currencyRaw)) out.RLUSD = balance;
      else if (c === 'usdt') out.USDT = balance;
      else if (c === 'usdc') out.USDC = balance;
    });
  });

  if (apiJson?.balance && typeof apiJson.balance === 'object') {
    assignFromBalanceObj(apiJson.balance);
  }

  return out;
}

export function emptyCustodialWalletIds() {
  return { XRP: '', USDT: '', USDC: '' };
}

/** Wallet UUIDs from GET api/wallet/balance (top-level aliases or wallets[]). */
export function extractCustodialWalletIds(apiJson) {
  const ids = emptyCustodialWalletIds();
  const data = apiJson?.data && typeof apiJson.data === 'object' ? apiJson.data : apiJson;
  if (!data || typeof data !== 'object') return ids;

  const assign = (code, value) => {
    if (value != null && String(value).trim()) ids[code] = String(value);
  };
  assign('XRP', data.xrpWalletId || data.xrp_wallet_id);
  assign('USDT', data.usdtWalletId || data.usdt_wallet_id);
  assign('USDC', data.usdcWalletId || data.usdc_wallet_id);

  if (Array.isArray(data.wallets)) {
    data.wallets.forEach((w) => {
      const c = String(w.currency || w.code || '')
        .toLowerCase()
        .replace(/[\s_-]/g, '');
      const id = w.id || w.walletId || w.wallet_id;
      if (!id) return;
      if (c === 'xrp') ids.XRP = String(id);
      else if (c === 'usdt') ids.USDT = String(id);
      else if (c === 'usdc') ids.USDC = String(id);
    });
  }
  return ids;
}
