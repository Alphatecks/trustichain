import React from 'react';
import { Copy, ExternalLink, Info } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Shared escrow detail sheet (rows, explorer/dispute, optional XRPL release/cancel, footnote).
 */
export default function EscrowDetailModalBody({
  escrow,
  exchangeRate,
  onDispute,
  onReleaseEscrow,
  onRequestCancelEscrow,
}) {
  const escrowId = escrow.id || escrow.escrowId || escrow.xrplEscrowId || '';
  const formattedId = escrowId || '#ESC-N/A';
  const displayId = String(formattedId).replace(/^#/, '').toUpperCase();
  const status = escrow.status || 'Unknown';
  const statusLower = (status || '').toLowerCase();
  const createdDate = escrow.createdAt || escrow.created || '';
  const createdTimestamp = createdDate ? new Date(createdDate).getTime() : null;
  const timeSinceCreation = createdTimestamp ? (Date.now() - createdTimestamp) / 1000 : null;
  const RELEASE_DELAY_SECONDS = 40;
  const timeRemaining =
    timeSinceCreation != null ? Math.max(0, RELEASE_DELAY_SECONDS - timeSinceCreation) : 0;
  const canReleaseNow = timeRemaining === 0;
  const hasXrplEscrowId = !!(escrow.xrplEscrowId || escrow.xrpl_escrow_id);
  const canRelease =
    hasXrplEscrowId &&
    (statusLower === 'active' || statusLower === 'pending release') &&
    canReleaseNow;

  const xrpHashes = Array.from(
    new Set(
      [
        escrow.xrpHash,
        escrow.xrp_hash,
        escrow.xrplEscrowId,
        escrow.xrpl_escrow_id,
        ...(Array.isArray(escrow.xrpHashes) ? escrow.xrpHashes : []),
        ...(Array.isArray(escrow.xrpHashs) ? escrow.xrpHashs : []),
      ]
        .filter((value) => typeof value === 'string' && value.trim())
        .map((value) => value.trim()),
    ),
  );

  const walletAddress =
    escrow.payerWallet ||
    escrow.payerXrpWalletAddress ||
    escrow.walletAddress ||
    escrow.initiatorWallet ||
    escrow.senderWallet ||
    '—';
  const counterpartyAddress =
    escrow.counterpartyWallet ||
    escrow.counterpartyXrpWalletAddress ||
    escrow.receiverWallet ||
    escrow.counterparty?.wallet ||
    '—';

  const asset = String(escrow.currency || escrow.asset || 'XRP').toUpperCase();
  const rawAmt =
    escrow.amount?.xrp ??
    escrow.amount?.XRP ??
    escrow.amount?.rlusd ??
    escrow.amount?.RLUSD ??
    escrow.totalAmount ??
    escrow.amount;
  const amtNum =
    rawAmt != null && rawAmt !== '' && !Number.isNaN(Number(rawAmt)) ? Number(rawAmt) : NaN;
  const xrpFallback =
    escrow.amount?.xrp != null
      ? Number(escrow.amount.xrp).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })
      : '0.00';
  const amountFormatted = Number.isFinite(amtNum)
    ? amtNum.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })
    : xrpFallback;
  const escrowAmountLabel = `${amountFormatted} ${asset}`;

  let principalUsd =
    escrow.amount?.usd != null && escrow.amount?.usd !== '' ? Number(escrow.amount.usd) : NaN;
  if (!Number.isFinite(principalUsd) && asset === 'XRP' && Number.isFinite(amtNum) && exchangeRate) {
    principalUsd = amtNum * exchangeRate;
  }
  if (!Number.isFinite(principalUsd)) {
    principalUsd = escrow.amount?.usd != null ? Number(escrow.amount.usd) : 0;
  }

  const xrpUsdRate =
    asset === 'XRP' && Number.isFinite(amtNum) && amtNum > 0 && Number.isFinite(principalUsd)
      ? principalUsd / amtNum
      : exchangeRate || 0;
  const exchangeRateLabel =
    asset === 'XRP' && Number(xrpUsdRate) > 0
      ? `1 ${asset} = $${Number(xrpUsdRate).toLocaleString('en-US', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })}`
      : ['RLUSD', 'USDT', 'USDC'].includes(asset)
        ? `1 ${asset} ≈ $1.00 USD`
        : '—';

  const feePercent =
    escrow.feePercent != null && escrow.feePercent !== ''
      ? Number(escrow.feePercent)
      : escrow.escrowFeePercent != null && escrow.escrowFeePercent !== ''
        ? Number(escrow.escrowFeePercent)
        : 5;
  const feeUsd = Number.isFinite(principalUsd) ? principalUsd * (feePercent / 100) : 0;
  const feeLabel = `$${feeUsd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} (${Number.isFinite(feePercent) ? feePercent : 5}%)`;

  const recipientUsd = Math.max(0, principalUsd - feeUsd);
  const recipientLabel = `$${recipientUsd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;

  const netFeeDisplay =
    escrow.networkFee != null && escrow.networkFee !== ''
      ? `${Number(escrow.networkFee).toLocaleString('en-US', {
          minimumFractionDigits: 5,
          maximumFractionDigits: 8,
        })} ${asset}`
      : `0.00001 ${asset}`;

  const explorerHash =
    xrpHashes.find((h) => typeof h === 'string' && /^[0-9A-Fa-f]{64}$/.test(h)) || xrpHashes[0];
  const xrplAcct = escrow.xrplEscrowId || escrow.xrpl_escrow_id;
  const explorerUrl = explorerHash
    ? `https://xrpscan.com/tx/${explorerHash}`
    : xrplAcct
      ? `https://xrpscan.com/account/${xrplAcct}`
      : null;

  const statusBadgeVariant =
    statusLower.includes('pending') || statusLower.includes('wait')
      ? 'pending'
      : statusLower.includes('complete') ||
          statusLower.includes('released') ||
          statusLower.includes('done')
        ? 'complete'
        : 'neutral';

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(displayId);
      toast.success('Escrow ID copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const openExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No explorer link available yet');
    }
  };

  const disclaimerAsset = asset === 'XRP' ? 'XRP' : asset;
  const disclaimerApprox = Number.isFinite(recipientUsd)
    ? recipientUsd.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  const showSecondaryXRPL =
    typeof onReleaseEscrow === 'function' &&
    typeof onRequestCancelEscrow === 'function' &&
    hasXrplEscrowId &&
    (statusLower === 'active' || statusLower === 'pending release');

  return (
    <>
      <div className="escrow-detail-sheet-rows">
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Escrow Id</span>
          <span className="escrow-detail-value escrow-detail-value--row">
            <span className="escrow-detail-id-link">{displayId}</span>
            <button
              type="button"
              className="escrow-detail-icon-btn"
              onClick={handleCopyId}
              aria-label="Copy escrow ID"
            >
              <Copy size={16} />
            </button>
          </span>
        </div>
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Wallet Address</span>
          <span className="escrow-detail-value escrow-detail-value--truncate">{walletAddress}</span>
        </div>
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Counterparty Address</span>
          <span className="escrow-detail-value escrow-detail-value--truncate">
            {counterpartyAddress}
          </span>
        </div>
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Escrow Status</span>
          <span className="escrow-detail-value">
            <span
              className={`escrow-detail-status-badge escrow-detail-status-badge--${statusBadgeVariant}`}
            >
              {status}
            </span>
          </span>
        </div>
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Escrow Amount</span>
          <span className="escrow-detail-value">{escrowAmountLabel}</span>
        </div>
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Exchange Rate</span>
          <span className="escrow-detail-value">{exchangeRateLabel}</span>
        </div>
        <div className="escrow-detail-row">
          <span className="escrow-detail-label">Network Fee</span>
          <span className="escrow-detail-value">{netFeeDisplay}</span>
        </div>
        <div className="escrow-detail-row escrow-detail-row--fee-sep">
          <span className="escrow-detail-label">Escrow Fee</span>
          <span className="escrow-detail-value">{feeLabel}</span>
        </div>
        <div className="escrow-detail-row escrow-detail-row--recipient">
          <span className="escrow-detail-label">Recipient Gets</span>
          <span className="escrow-detail-value escrow-detail-value--strong">{recipientLabel}</span>
        </div>
        <div className="escrow-detail-row escrow-detail-row--last">
          <span className="escrow-detail-label">Estimated Arrival</span>
          <span className="escrow-detail-value">3–5 seconds</span>
        </div>
      </div>

      <div className="escrow-detail-modal-actions">
        <button
          type="button"
          className="escrow-detail-btn escrow-detail-btn--outline"
          onClick={openExplorer}
          disabled={!explorerUrl}
        >
          <ExternalLink size={16} aria-hidden />
          View on block Explorer
        </button>
        <button type="button" className="escrow-detail-btn escrow-detail-btn--primary" onClick={onDispute}>
          Dispute
        </button>
      </div>

      {showSecondaryXRPL && (
        <div className="escrow-detail-actions escrow-detail-actions--secondary">
          <button
            type="button"
            className="release-btn"
            onClick={() => {
              if (canReleaseNow) {
                onReleaseEscrow(escrowId);
              }
            }}
            disabled={!canReleaseNow}
            style={{
              opacity: canReleaseNow ? 1 : 0.6,
              cursor: canReleaseNow ? 'pointer' : 'not-allowed',
            }}
          >
            {canRelease
              ? 'Release'
              : timeRemaining > 0
                ? `Release (${Math.ceil(timeRemaining)}s)`
                : 'Release'}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => onRequestCancelEscrow(escrowId)}
          >
            Cancel escrow
          </button>
        </div>
      )}

      <p className="escrow-detail-modal-footnote">
        <Info size={14} className="escrow-detail-modal-footnote-icon" aria-hidden />
        Recipient will receive at least {disclaimerApprox} USD equivalent in {disclaimerAsset} or the
        transaction will be refunded.
      </p>
    </>
  );
}
