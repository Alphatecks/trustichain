import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Info } from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import './index.css';

const XRP_ICON =
  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731';

/**
 * @typedef {{ id: string, label: string }} SavingsAddMoneyAccountOption
 */

/**
 * Add Money → savings (mobile sheet + desktop dialog styling).
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.amount
 * @param {(next: string) => void} props.onAmountChange
 * @param {SavingsAddMoneyAccountOption[]} props.accounts
 * @param {string} props.selectedAccountId
 * @param {(id: string) => void} props.onSelectAccount
 * @param {() => void} props.onTransfer
 * @param {boolean} [props.isSubmitting]
 * @param {boolean} [props.isLoadingBalance]
 * @param {string} [props.balanceLine] — e.g. "24,567.89 USDT" (without "Balance: ")
 * @param {string} [props.sourceWalletLabel='XRP wallet']
 * @param {string} [props.sourceTicker='XRP']
 * @param {string} [props.sourceIconUrl] — wallet/token logo URL (shown in a circle)
 * @param {boolean} [props.useSourceCoinIcon=true]
 * @param {string} [props.amountPrefix='']
 * @param {string} [props.amountSuffix='XRP']
 * @param {string} [props.transferButtonLabel='Transfer']
 */
const SavingsAddMoneyModal = ({
  isOpen,
  onClose,
  amount,
  onAmountChange,
  accounts = [],
  selectedAccountId,
  onSelectAccount,
  onTransfer,
  isSubmitting = false,
  isLoadingBalance = false,
  balanceLine = '',
  sourceWalletLabel = 'XRP wallet',
  sourceTicker = 'XRP',
  sourceIconUrl = XRP_ICON,
  useSourceCoinIcon = true,
  amountPrefix = '',
  amountSuffix = 'XRP',
  transferButtonLabel = 'Transfer',
}) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setAccountOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const onDoc = (e) => {
      if (accountWrapRef.current && !accountWrapRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [accountOpen]);

  const selectedLabel =
    accounts.find((a) => a.id === selectedAccountId)?.label ??
    accounts[0]?.label ??
    'My Goals';

  const handleAmountInput = (e) => {
    let value = e.target.value;
    value = value.replace(/[^0-9.,]/g, '');
    onAmountChange(value);
  };

  if (!isOpen) return null;

  const titleId = 'savings-add-money-modal-title';

  return (
    <div className="savings-am-overlay" onClick={onClose} role="presentation">
      <div
        className="savings-am-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="savings-am-head">
          <h2 id={titleId} className="savings-am-title">
            Add Money
          </h2>
          <button type="button" className="savings-am-close" onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={2} />
          </button>
        </header>

        <div className="savings-am-amount-card">
          <div className="savings-am-amount-card-top">
            <span className="savings-am-label-muted">Amount</span>
            <div className="savings-am-wallet-pill" aria-hidden={false}>
              {useSourceCoinIcon ? (
                <span className="savings-am-wallet-pill-icon">
                  <img src={sourceIconUrl || XRP_ICON} alt="" />
                </span>
              ) : (
                <span className="savings-am-wallet-pill-badge">{sourceTicker}</span>
              )}
              <span className="savings-am-wallet-pill-text">{sourceWalletLabel}</span>
              <ChevronDown size={16} strokeWidth={2.25} className="savings-am-wallet-pill-chevron" aria-hidden />
            </div>
          </div>

          <div className="savings-am-amount-hero">
            {amountPrefix ? <span className="savings-am-amount-prefix">{amountPrefix}</span> : null}
            <input
              type="text"
              className="savings-am-amount-input"
              value={amount}
              onChange={handleAmountInput}
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              disabled={isSubmitting}
              aria-label="Amount"
            />
            {amountSuffix ? <span className="savings-am-amount-suffix">{amountSuffix}</span> : null}
          </div>

          <p className="savings-am-balance-line">
            <span className="savings-am-balance-label">Balance:</span>{' '}
            {isLoadingBalance ? (
              <LoadingIndicator size="sm" />
            ) : (
              <span className="savings-am-balance-value">{balanceLine || '—'}</span>
            )}
          </p>
        </div>

        <div className="savings-am-accounts">
          <p className="savings-am-accounts-heading">Saving accounts</p>
          <div className="savings-am-account-wrap" ref={accountWrapRef}>
            <button
              type="button"
              className={`savings-am-account-trigger ${accountOpen ? 'is-open' : ''}`}
              onClick={() => setAccountOpen((o) => !o)}
              aria-expanded={accountOpen}
              aria-haspopup="listbox"
              disabled={isSubmitting || accounts.length === 0}
            >
              <span className="savings-am-account-trigger-value">{selectedLabel}</span>
              <ChevronDown size={18} strokeWidth={2} className="savings-am-account-chevron" aria-hidden />
            </button>
            {accountOpen && accounts.length > 0 ? (
              <ul className="savings-am-account-menu" role="listbox">
                {accounts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      role="option"
                      className={`savings-am-account-option ${a.id === selectedAccountId ? 'is-selected' : ''}`}
                      onClick={() => {
                        onSelectAccount(a.id);
                        setAccountOpen(false);
                      }}
                    >
                      {a.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="savings-am-transfer"
          onClick={onTransfer}
          disabled={isSubmitting || accounts.length === 0}
        >
          {isSubmitting ? 'Transferring…' : transferButtonLabel}
        </button>

        <div className="savings-am-footnote">
          <Info size={16} strokeWidth={2} className="savings-am-footnote-icon" aria-hidden />
          <span>Your funds will be added to your account within seconds or refunded if there&apos;s an issue.</span>
        </div>
      </div>
    </div>
  );
};

export default SavingsAddMoneyModal;
