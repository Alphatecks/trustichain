const firstFiniteNumber = (...values) => {
  for (const value of values) {
    if (value == null || value === '') continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
};

/**
 * Currency chosen at escrow creation (NGN, EUR, RLUSD, XRP, …).
 * Never use amount.currency — that is always the RLUSD settlement code.
 */
export function resolveEscrowCreationCurrency(escrow) {
  if (!escrow || typeof escrow !== 'object') return '';
  const top = escrow.currency ?? escrow.asset ?? escrow.displayCurrency ?? escrow.denominationCurrency;
  if (top == null) return '';
  const code = String(top).trim().toUpperCase();
  return code;
}

/** Original amount in the creation currency. */
export function resolveEscrowDenominationAmount(escrow) {
  if (!escrow || typeof escrow !== 'object') return null;
  const explicit = firstFiniteNumber(
    escrow.denominationAmount,
    escrow.displayAmount,
    escrow.amount?.display?.value,
  );
  if (explicit != null) return explicit;

  const currency = resolveEscrowCreationCurrency(escrow);
  if (currency === 'XRP') {
    return firstFiniteNumber(escrow.amount?.xrp, escrow.amount?.XRP);
  }
  if (currency === 'RLUSD') {
    return firstFiniteNumber(escrow.amount?.rlusd, escrow.amount?.RLUSD, escrow.amount?.usd);
  }
  if (currency === 'USD') {
    return firstFiniteNumber(escrow.amount?.usd, escrow.amount?.rlusd, escrow.amount?.RLUSD);
  }
  return null;
}

export function formatAmountWithCurrency(amount, currency) {
  if (amount == null || !Number.isFinite(Number(amount)) || !currency) return '';
  const code = String(currency).trim().toUpperCase();
  const num = Number(amount);
  const isXrp = code === 'XRP';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: isXrp ? 2 : Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: isXrp ? 6 : 2,
  });
  return `${formatted} ${code}`;
}

export function formatEscrowDenominationLabel(escrow) {
  const currency = resolveEscrowCreationCurrency(escrow);
  const amount = resolveEscrowDenominationAmount(escrow);
  const fromDenom = formatAmountWithCurrency(amount, currency);
  if (fromDenom) return fromDenom;

  const xrp = firstFiniteNumber(escrow?.amount?.xrp, escrow?.amount?.XRP);
  if (xrp != null) return formatAmountWithCurrency(xrp, 'XRP');
  const rlusd = firstFiniteNumber(escrow?.amount?.rlusd, escrow?.amount?.RLUSD, escrow?.amount?.usd);
  if (rlusd != null) return formatAmountWithCurrency(rlusd, 'RLUSD');
  return '—';
}

export function resolveEscrowSettlementUsd(escrow) {
  return firstFiniteNumber(escrow?.amount?.usd, escrow?.amountUsd, escrow?.amount?.USD);
}

export function formatEscrowListAmountParts(escrow) {
  const currency = resolveEscrowCreationCurrency(escrow);
  const primaryLabel = formatEscrowDenominationLabel(escrow);
  const usd = resolveEscrowSettlementUsd(escrow);
  const usdLabel =
    usd != null
      ? usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : null;
  const showUsdApprox = usdLabel != null && currency !== 'USD';
  return { primaryLabel, usdLabel, showUsdApprox };
}
