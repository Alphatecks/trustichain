/** Same 24h-style percents shown on the home Wallet Balance list. */
export const WALLET_BALANCE_CHANGE_PERCENT = {
  XRP: 2.4,
  RLUSD: 0,
  USDT: 0,
  USDC: 0.1,
};

export function getWalletBalanceChangePercent(code, rates) {
  const upper = String(code || '').toUpperCase();
  const list = Array.isArray(rates) ? rates : [];
  const row = list.find((r) => (r.currency || r.code || '').toUpperCase() === upper);
  const live = Number(row?.changePercent ?? row?.change);
  if (Number.isFinite(live)) return live;

  const fallback = WALLET_BALANCE_CHANGE_PERCENT[upper];
  return fallback == null ? null : fallback;
}

export function formatWalletBalanceChangePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0.0%';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}

export function walletBalanceChangeTone(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return 'neutral';
  return n > 0 ? 'positive' : 'negative';
}
