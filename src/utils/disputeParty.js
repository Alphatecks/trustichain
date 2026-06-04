/** Pick first non-empty string from candidates. */
export const pickDisputePartyString = (...values) => {
  for (const value of values) {
    if (value == null) continue;
    const trimmed = String(value).trim();
    if (trimmed !== '') return trimmed;
  }
  return '';
};

/**
 * Build display profile for initiator (party 1) or respondent (party 2) from dispute detail API.
 * Global description/reason is attributed to the initiator only (dispute filer).
 */
export const resolveDisputePartyProfile = (detail, role) => {
  if (!detail || typeof detail !== 'object') {
    return {
      name: '',
      roleLabel: role === 'initiator' ? 'Buyer' : 'Seller',
      claimsText: '',
      claimsDisplay: '—',
      email: '',
      phone: '',
    };
  }

  const isInitiator = role === 'initiator';
  const partyObj = isInitiator
    ? detail.initiator ?? detail.payer ?? detail.party1 ?? null
    : detail.respondent ?? detail.counterparty ?? detail.party2 ?? null;

  const name = pickDisputePartyString(
    isInitiator ? detail.initiatorName : detail.respondentName,
    partyObj?.name,
    isInitiator ? detail.payerName : detail.respondentName,
    isInitiator ? null : detail.counterpartyName,
  );

  const partyClaims = pickDisputePartyString(
    isInitiator ? detail.initiatorClaims : detail.respondentClaims,
    isInitiator ? detail.initiatorClaim : detail.respondentClaim,
    partyObj?.claims,
    partyObj?.claim,
    isInitiator ? detail.initiatorDescription : detail.respondentDescription,
    isInitiator ? null : detail.respondentResponse,
    isInitiator ? null : detail.counterpartyResponse,
    isInitiator ? null : detail.counterpartyDescription,
    partyObj?.description,
    partyObj?.response,
  );

  const globalDisputeClaim = pickDisputePartyString(
    detail.description,
    detail.disputeDescription,
    detail.reason,
    detail.disputeReason,
  );

  const claimsText = isInitiator ? partyClaims || globalDisputeClaim : partyClaims;
  const claimsDisplay = claimsText || (isInitiator ? '—' : 'No claims submitted yet.');

  const email = pickDisputePartyString(
    isInitiator ? detail.initiatorEmail : detail.respondentEmail,
    partyObj?.email,
    isInitiator ? detail.payerEmail : detail.respondentEmail,
  );

  const phone = pickDisputePartyString(
    isInitiator ? detail.initiatorPhone : detail.respondentPhone,
    partyObj?.phoneNumber,
    partyObj?.phone,
    isInitiator ? detail.payerPhone : detail.respondentPhone,
  );

  const viewerIsInitiator =
    detail.currentUserParty === 'initiator' ||
    detail.viewerParty === 'initiator' ||
    detail.isInitiator === true ||
    detail.role === 'initiator' ||
    detail.userRole === 'initiator';

  const roleLabel = isInitiator
    ? viewerIsInitiator
      ? 'Buyer (me)'
      : 'Buyer'
    : viewerIsInitiator
      ? 'Seller (me)'
      : 'Seller';

  return {
    name,
    roleLabel,
    claimsText,
    claimsDisplay,
    email,
    phone,
  };
};
