import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './SavingsAddMoneyModal.css';

const XRP_ICON =
  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png';
const USDT_ICON = 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png';
const USDC_ICON =
  'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389';

const FALLBACK_SOURCES = [
  { id: 'XRP', code: 'XRP', label: 'XRP wallet', ticker: 'XRP', iconUrl: XRP_ICON },
  { id: 'USDT', code: 'USDT', label: 'USDT wallet', ticker: 'USDT', iconUrl: USDT_ICON },
  { id: 'USDC', code: 'USDC', label: 'USDC wallet', ticker: 'USDC', iconUrl: USDC_ICON },
];

function iconForCode(code, iconUrl) {
  if (iconUrl) return iconUrl;
  const c = String(code || '').toUpperCase();
  if (c === 'USDT') return USDT_ICON;
  if (c === 'USDC') return USDC_ICON;
  return XRP_ICON;
}

function SourceCoinIcon({ ticker, iconUrl }) {
  const code = String(ticker || 'XRP').toUpperCase();
  return (
    <span className={`savings-am-wallet-pill-icon ${code === 'XRP' ? 'is-xrp' : ''}`}>
      <img src={iconForCode(code, iconUrl)} alt="" />
    </span>
  );
}

function usesCoinIcon(ticker) {
  const t = String(ticker || '').toUpperCase();
  return t === 'XRP' || t === 'USDT' || t === 'USDC';
}

const SavingsAddMoneyModal = ({
  isOpen,
  onClose,
  amount,
  onAmountChange,
  accounts = [],
  selectedAccountId,
  onSelectAccount,
  sourceWallets = [],
  selectedSourceId,
  onSelectSource,
  onTransfer,
  isSubmitting = false,
  isLoadingBalance = false,
  balanceLine = '0.00',
  amountPrefix = '',
  amountSuffix,
}) => {
  const overlayRef = useRef(null);
  const accountWrapRef = useRef(null);
  const sourceWrapRef = useRef(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [internalSourceId, setInternalSourceId] = useState(selectedSourceId || 'XRP');

  const resolvedSources = useMemo(() => {
    if (Array.isArray(sourceWallets) && sourceWallets.length > 0) {
      return sourceWallets.map((w) => ({
        ...w,
        id: String(w.id || w.code || ''),
        ticker: w.ticker || w.code || 'XRP',
        label: w.label || `${w.code || 'XRP'} wallet`,
        iconUrl: iconForCode(w.code || w.ticker, w.iconUrl),
      }));
    }
    return FALLBACK_SOURCES;
  }, [sourceWallets]);

  const activeSourceId = selectedSourceId || internalSourceId;
  const selectedSource =
    resolvedSources.find((w) => String(w.id) === String(activeSourceId)) ||
    resolvedSources[0];
  const sourceTicker = selectedSource?.ticker || 'XRP';
  const sourceLabel = selectedSource?.label || 'XRP wallet';
  const sourceIconUrl = selectedSource?.iconUrl;
  const displaySuffix = amountSuffix != null && amountSuffix !== '' ? amountSuffix : sourceTicker;
  const useSourceCoinIcon = usesCoinIcon(sourceTicker);

  const selectedAccount =
    accounts.find((a) => String(a.id) === String(selectedAccountId)) || accounts[0];
  const selectedLabel = selectedAccount?.label || 'Select account';

  useEffect(() => {
    if (!isOpen) {
      setAccountOpen(false);
      setSourceOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (sourceOpen) {
          setSourceOpen(false);
          return;
        }
        if (accountOpen) {
          setAccountOpen(false);
          return;
        }
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, accountOpen, sourceOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDoc = (event) => {
      if (accountWrapRef.current && !accountWrapRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
      if (sourceWrapRef.current && !sourceWrapRef.current.contains(event.target)) {
        setSourceOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAmountInput = (event) => {
    const next = event.target.value.replace(/[^0-9.]/g, '');
    const parts = next.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : next;
    onAmountChange?.(sanitized);
  };

  return createPortal(
    <div
      className="savings-am-overlay"
      ref={overlayRef}
      onClick={(event) => {
        if (event.target === overlayRef.current) onClose?.();
      }}
    >
      <div
        className="savings-am-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="savings-am-title"
      >
        <div className="savings-am-top">
          <h2 id="savings-am-title" className="savings-am-title">
            Add Money
          </h2>
          <button type="button" className="savings-am-close" onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={2.25} />
          </button>
        </div>

        <div className="savings-am-amount-card">
          <div className="savings-am-amount-card-top">
            <span className="savings-am-label-muted">Amount</span>
            <div className="savings-am-wallet-wrap" ref={sourceWrapRef}>
              <button
                type="button"
                className={`savings-am-wallet-pill ${sourceOpen ? 'is-open' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={sourceOpen}
                aria-label="Source wallet"
                disabled={isSubmitting}
                onClick={() => {
                  setSourceOpen((open) => !open);
                  setAccountOpen(false);
                }}
              >
                {useSourceCoinIcon ? (
                  <SourceCoinIcon ticker={sourceTicker} iconUrl={sourceIconUrl} />
                ) : (
                  <span className="savings-am-wallet-pill-badge">{sourceTicker}</span>
                )}
                <span className="savings-am-wallet-pill-text">{sourceLabel}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.25}
                  className="savings-am-wallet-pill-chevron"
                  aria-hidden
                />
              </button>
              {sourceOpen ? (
                <ul className="savings-am-wallet-menu" role="listbox">
                  {resolvedSources.map((wallet) => {
                    const selected = String(wallet.id) === String(selectedSource?.id);
                    const ticker = wallet.ticker || wallet.code || 'XRP';
                    return (
                      <li key={wallet.id} role="none">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className={`savings-am-wallet-option ${selected ? 'is-selected' : ''}`}
                          onClick={() => {
                            if (onSelectSource) onSelectSource(wallet.id);
                            else setInternalSourceId(wallet.id);
                            setSourceOpen(false);
                          }}
                        >
                          <span className="savings-am-wallet-option-main">
                            {usesCoinIcon(ticker) ? (
                              <SourceCoinIcon ticker={ticker} iconUrl={wallet.iconUrl} />
                            ) : (
                              <span className="savings-am-wallet-pill-badge">{ticker}</span>
                            )}
                            <span>{wallet.label}</span>
                          </span>
                          {wallet.balanceLabel ? (
                            <span className="savings-am-wallet-option-bal">{wallet.balanceLabel}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
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
              disabled={isSubmitting}
              aria-label="Amount to add"
            />
            <span className="savings-am-amount-suffix">{displaySuffix}</span>
          </div>
        </div>

        <p className="savings-am-balance">
          {isLoadingBalance ? 'Loading balance…' : `Available Balance: ${balanceLine}`}
        </p>

        <div className="savings-am-field">
          <span className="savings-am-field-label" id="savings-am-account-label">
            Saving accounts
          </span>
          <div className="savings-am-account-wrap" ref={accountWrapRef}>
            <button
              type="button"
              className={`savings-am-account-trigger ${accountOpen ? 'is-open' : ''}`}
              aria-haspopup="listbox"
              aria-expanded={accountOpen}
              aria-labelledby="savings-am-account-label"
              disabled={isSubmitting || accounts.length === 0}
              onClick={() => {
                setAccountOpen((open) => !open);
                setSourceOpen(false);
              }}
            >
              <span className="savings-am-account-value">{selectedLabel}</span>
              <ChevronDown size={18} strokeWidth={2.25} className="savings-am-account-chevron" />
            </button>
            {accountOpen && accounts.length > 0 ? (
              <ul className="savings-am-account-menu" role="listbox">
                {accounts.map((account) => {
                  const selected = String(account.id) === String(selectedAccount?.id);
                  return (
                    <li key={account.id} role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`savings-am-account-option ${selected ? 'is-selected' : ''}`}
                        onClick={() => {
                          onSelectAccount?.(account.id);
                          setAccountOpen(false);
                        }}
                      >
                        {account.label}
                      </button>
                    </li>
                  );
                })}
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
          {isSubmitting ? 'Transferring…' : 'Transfer'}
        </button>
      </div>
    </div>,
    document.body,
  );
};

export default SavingsAddMoneyModal;
