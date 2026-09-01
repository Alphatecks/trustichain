import { getApiUrl } from './config';

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    const trimmed = String(value).trim();
    if (trimmed) return trimmed;
  }
  return '';
};

const pickPartyWallet = (party) => {
  if (!party || typeof party !== 'object') return '';
  return firstNonEmpty(
    party.walletAddress,
    party.xrpWalletAddress,
    party.xrplWalletAddress,
    party.xrplAddress,
    party.wallet,
    party.address,
    party.xrpAddress,
  );
};

/** Resolve payer / counterparty XRPL addresses from list, create, or parties payloads. */
export function resolveEscrowWalletAddresses(escrow) {
  if (!escrow || typeof escrow !== 'object') {
    return { payerWallet: '', counterpartyWallet: '' };
  }

  return {
    payerWallet: firstNonEmpty(
      escrow.payerWallet,
      escrow.payerXrpWalletAddress,
      escrow.payerXrplWalletAddress,
      escrow.walletAddress,
      escrow.initiatorWallet,
      escrow.senderWallet,
      pickPartyWallet(escrow.payer),
      pickPartyWallet(escrow.initiator),
      pickPartyWallet(escrow.user),
      pickPartyWallet(escrow.sender),
    ),
    counterpartyWallet: firstNonEmpty(
      escrow.counterpartyWallet,
      escrow.counterpartyXrpWalletAddress,
      escrow.counterpartyXrplWalletAddress,
      escrow.receiverWallet,
      escrow.destination,
      escrow.destinationAccount,
      pickPartyWallet(escrow.counterparty),
      pickPartyWallet(escrow.respondent),
      pickPartyWallet(escrow.receiver),
    ),
  };
}

/**
 * List/create payloads often omit XRPL addresses. GET /api/escrow/:id/parties
 * is the endpoint that returns payer + counterparty wallets.
 */
export async function fetchEscrowPartyWallets(escrowId) {
  const id = String(escrowId || '').trim();
  if (!id) {
    return { payerWallet: '', counterpartyWallet: '', currency: '', denominationAmount: null };
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return { payerWallet: '', counterpartyWallet: '', currency: '', denominationAmount: null };
  }

  const response = await fetch(getApiUrl(`api/escrow/${encodeURIComponent(id)}/parties`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    return { payerWallet: '', counterpartyWallet: '', currency: '', denominationAmount: null };
  }

  const data = result.data || {};
  const nested = resolveEscrowWalletAddresses(data);
  const initiator = data.payer ?? data.initiator ?? null;
  const counterparty = data.counterparty ?? data.respondent ?? null;

  const denominationRaw = data.denominationAmount;
  const denominationAmount =
    denominationRaw != null && denominationRaw !== '' && Number.isFinite(Number(denominationRaw))
      ? Number(denominationRaw)
      : null;

  return {
    payerWallet: firstNonEmpty(
      nested.payerWallet,
      pickPartyWallet(initiator),
      data.payerXrpWalletAddress,
      data.payerWallet,
    ),
    counterpartyWallet: firstNonEmpty(
      nested.counterpartyWallet,
      pickPartyWallet(counterparty),
      data.counterpartyXrpWalletAddress,
      data.counterpartyWallet,
      data.respondentXrpWalletAddress,
    ),
    // Top-level creation currency only — never data.amount.currency (always RLUSD).
    currency: firstNonEmpty(data.currency),
    denominationAmount,
  };
}
