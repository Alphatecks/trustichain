import React, { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useDisplayCurrency } from '../../context/DisplayCurrencyContext';
import { getApiUrl } from '../../utils/config';
import { getEscrowDisplayStatus, isActiveEscrow } from '../../utils/escrowDisplayStatus';
import { DashboardEscrowListSkeleton } from '../DashboardSkeletons';
import './index.css';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return String(name).substring(0, 2).toUpperCase();
};

const statusBadgeClass = (displayStatus) => {
  const className = displayStatus?.className || 'unknown';
  if (className === 'pending_release' || className === 'pending') return 'pending-release';
  if (className === 'under_review' || className === 'review') return 'review';
  return className;
};

export default function ActiveEscrowsModal({
  open,
  onClose,
  onSelectEscrow,
  getExchangeRate,
}) {
  const { isSessionExpired } = useSession();
  const { formatFromUsd } = useDisplayCurrency();
  const [escrows, setEscrows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;

    const fetchActiveEscrows = async () => {
      if (isSessionExpired) {
        setEscrows([]);
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setEscrows([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(getApiUrl('api/escrow/list?limit=1000&offset=0'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;

        const list = Array.isArray(result?.data?.escrows) ? result.data.escrows : [];
        setEscrows(list.filter(isActiveEscrow));
      } catch (error) {
        console.error('Error fetching active escrows:', error);
        if (!cancelled) setEscrows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchActiveEscrows();
    return () => {
      cancelled = true;
    };
  }, [open, isSessionExpired]);

  if (!open) return null;

  const formatEscrowAmounts = (escrow) => {
    const xrpRaw = escrow.amount?.xrp ?? escrow.amount?.XRP ?? escrow.xrpAmount;
    const usdRaw = escrow.amount?.usd ?? escrow.amount?.USD ?? escrow.usdAmount ?? escrow.totalAmount;
    const xrpAmount = xrpRaw != null && xrpRaw !== '' ? Number(xrpRaw) : null;
    let usdAmount = usdRaw != null && usdRaw !== '' ? Number(usdRaw) : null;

    if ((usdAmount == null || !Number.isFinite(usdAmount)) && xrpAmount != null && typeof getExchangeRate === 'function') {
      const xrpToUsd = getExchangeRate('XRP', 'USD');
      if (xrpToUsd != null && Number(xrpToUsd) > 0) {
        usdAmount = xrpAmount * Number(xrpToUsd);
      }
    }

    return {
      xrpLabel:
        xrpAmount != null && Number.isFinite(xrpAmount)
          ? `${xrpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`
          : '0.00 XRP',
      fiatLabel:
        usdAmount != null && Number.isFinite(usdAmount) ? formatFromUsd(usdAmount) : null,
    };
  };

  return (
    <div
      className="create-escrow-modal-overlay active-escrows-modal-overlay"
      onClick={onClose}
    >
      <div
        className="create-escrow-modal escrow-detail-modal active-escrows-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="active-escrows-modal-title"
        aria-modal="true"
      >
        <div className="create-escrow-modal-header escrow-detail-modal-header">
          <div className="modal-header-leading">
            <span className="modal-header-accent-bar" aria-hidden />
            <h2 id="active-escrows-modal-title" className="escrow-detail-modal-title">
              Active Escrows
            </h2>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className="create-escrow-modal-content escrow-detail-modal-content active-escrows-modal-content">
          {isLoading ? (
            <DashboardEscrowListSkeleton count={5} mobile />
          ) : escrows.length === 0 ? (
            <div className="active-escrows-empty">No active escrows</div>
          ) : (
            <ul className="active-escrows-list">
              {escrows.map((escrow, index) => {
                const rawId = escrow.id || escrow.escrowId || escrow._id || escrow.xrplEscrowId;
                const escrowId = rawId
                  ? `#${String(rawId).substring(0, 8).toUpperCase()}`
                  : `#ESC-${String(index + 1).padStart(3, '0')}`;
                const initiatorName =
                  escrow.initiatorName ||
                  escrow.payerName ||
                  escrow.payer?.name ||
                  escrow.senderName ||
                  'You';
                const counterpartyName =
                  escrow.counterpartyName ||
                  escrow.counterparty?.name ||
                  escrow.receiverName ||
                  'Unknown';
                const initiatorAvatar =
                  escrow.initiatorAvatarUrl || escrow.payerAvatar || escrow.payer?.avatar || null;
                const counterpartyAvatar =
                  escrow.counterpartyAvatarUrl ||
                  escrow.counterpartyAvatar ||
                  escrow.counterparty?.avatar ||
                  null;
                const displayStatus = getEscrowDisplayStatus(escrow);
                const { xrpLabel, fiatLabel } = formatEscrowAmounts(escrow);

                return (
                  <li key={rawId || index}>
                    <button
                      type="button"
                      className="active-escrows-item"
                      onClick={() => onSelectEscrow?.(escrow)}
                    >
                      <div className="active-escrows-item-top">
                        <span className="active-escrows-id">{escrowId}</span>
                        <span className={`status-badge ${statusBadgeClass(displayStatus)}`}>
                          {displayStatus.label}
                        </span>
                      </div>
                      <div className="active-escrows-parties">
                        <span className="active-escrows-party">
                          {counterpartyAvatar ? (
                            <img src={counterpartyAvatar} alt="" className="active-escrows-avatar" />
                          ) : (
                            <span className="active-escrows-avatar active-escrows-avatar--initials">
                              {getInitials(counterpartyName)}
                            </span>
                          )}
                          <span className="active-escrows-party-name">{counterpartyName}</span>
                        </span>
                        <ArrowRight size={14} className="active-escrows-arrow" aria-hidden />
                        <span className="active-escrows-party">
                          {initiatorAvatar ? (
                            <img src={initiatorAvatar} alt="" className="active-escrows-avatar" />
                          ) : (
                            <span className="active-escrows-avatar active-escrows-avatar--initials">
                              {getInitials(initiatorName)}
                            </span>
                          )}
                          <span className="active-escrows-party-name">{initiatorName}</span>
                        </span>
                      </div>
                      <div className="active-escrows-amounts">
                        <span className="active-escrows-xrp">{xrpLabel}</span>
                        {fiatLabel ? <span className="active-escrows-fiat">≈ {fiatLabel}</span> : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
