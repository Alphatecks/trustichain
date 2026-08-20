/** Live Exchange Rate sidebar — show a short curated list, not every API row. */
export const LIVE_EXCHANGE_SIDEBAR_CODES = ['EUR', 'GBP', 'JPY', 'NGN', 'XRP'];

export function filterSidebarExchangeRates(rates) {
  if (!Array.isArray(rates)) return [];
  return LIVE_EXCHANGE_SIDEBAR_CODES.map((code) =>
    rates.find((r) => (r.currency || r.code || '').toUpperCase() === code),
  ).filter(Boolean);
}
