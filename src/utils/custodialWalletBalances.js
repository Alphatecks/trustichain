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

  if (data?.balance && typeof data.balance === 'object') {
    assignFromBalanceObj(data.balance);
  } else if (data && typeof data === 'object') {
    assignFromBalanceObj(data);
  }

  if (Array.isArray(data?.wallets) && data.wallets.length > 0) {
    data.wallets.forEach((w) => {
      const currencyRaw = w.currency || w.code || '';
      const c = String(currencyRaw).toLowerCase().replace(/[\s_-]/g, '');
      const balance = Number(w.balance ?? w.amount ?? 0);
      if (c === 'xrp') out.XRP = balance;
      else if (isCustodialBalanceRlusdCode(currencyRaw)) out.RLUSD = balance;
      else if (c === 'usdt') out.USDT = balance;
      else if (c === 'usdc') out.USDC = balance;
    });
  }

  if (apiJson?.balance && typeof apiJson.balance === 'object') {
    assignFromBalanceObj(apiJson.balance);
  }

  return out;
}
