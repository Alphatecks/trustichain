import React from 'react';
import { X, FileText, Calendar, Mail, User, DollarSign } from 'lucide-react';
import './TransactionDetailModal.css';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const formatUsd = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(n)));

const TransactionDetailModal = ({ isOpen, onClose, transaction, loading }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const amountStr = () => {
    if (!transaction) return '—';
    const hasXrp = transaction.amountXrp != null && !Number.isNaN(Number(transaction.amountXrp));
    const usd = formatUsd(transaction.amountUsd);
    if (hasXrp && transaction.amountUsd != null) return `${Number(transaction.amountXrp)} XRP (${usd})`;
    if (hasXrp) return `${Number(transaction.amountXrp)} XRP`;
    return usd;
  };

  const xrpHashes = Array.from(new Set([
    ...(Array.isArray(transaction?.xrpHashes) ? transaction.xrpHashes : []),
    ...(Array.isArray(transaction?.xrpHashesCreated) ? transaction.xrpHashesCreated : []),
    ...(Array.isArray(transaction?.xrpHashs) ? transaction.xrpHashs : []),
    transaction?.xrpHash,
    transaction?.xrp_hash,
    transaction?.xrplEscrowId,
    transaction?.xrpl_escrow_id,
  ].filter((value) => typeof value === 'string' && value.trim()))).map((value) => value.trim());

  return (
    <div className="transaction-detail-modal-overlay" onClick={handleOverlayClick}>
      <div className="transaction-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="transaction-detail-modal-header">
          <h2 className="transaction-detail-modal-title">Transaction details</h2>
          <button type="button" className="transaction-detail-modal-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="transaction-detail-modal-body">
          {loading ? (
            <div className="transaction-detail-loading">Loading...</div>
          ) : !transaction ? (
            <div className="transaction-detail-empty">No transaction data</div>
          ) : (
            <>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label"><FileText size={16} /> Transaction ID</span>
                <span className="transaction-detail-value">{transaction.transactionId ?? '—'}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label">Payroll</span>
                <span className="transaction-detail-value">{transaction.payrollName ?? '—'}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label"><DollarSign size={16} /> Amount</span>
                <span className="transaction-detail-value">{amountStr()}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label">Status</span>
                <span className={`transaction-detail-status ${(transaction.status || '').toLowerCase()}`}>{transaction.status ?? '—'}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label"><Calendar size={16} /> Due date</span>
                <span className="transaction-detail-value">{transaction.dueDate ?? '—'}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label"><User size={16} /> Counterparty</span>
                <span className="transaction-detail-value">{transaction.counterpartyName ?? '—'}</span>
              </div>
              {transaction.counterpartyEmail && (
                <div className="transaction-detail-row">
                  <span className="transaction-detail-label"><Mail size={16} /> Email</span>
                  <span className="transaction-detail-value">{transaction.counterpartyEmail}</span>
                </div>
              )}
              <div className="transaction-detail-row">
                <span className="transaction-detail-label">Created</span>
                <span className="transaction-detail-value">{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="transaction-detail-row transaction-detail-row-hashes">
                <span className="transaction-detail-label">XRPL Hashes</span>
                <span className="transaction-detail-value transaction-detail-hash-list">
                  {xrpHashes.length > 0 ? (
                    xrpHashes.map((hash) => (
                      <span key={hash} className="transaction-detail-hash-item">{hash}</span>
                    ))
                  ) : (
                    <span className="transaction-detail-hash-empty">—</span>
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
