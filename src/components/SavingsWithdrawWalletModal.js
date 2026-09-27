import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import './SavingsWithdrawWalletModal.css';

/**
 * @typedef {object} SavingsWithdrawWalletOption
 * @property {string} id
 * @property {string} title
 * @property {number} progressPct
 * @property {string} ringColor
 * @property {import('react').ElementType} Icon
 * @property {string} balanceLabel — list row (right side)
 * @property {string} confirmBalanceLabel — step 2 available balance
 * @property {number} [savedUsd] — available balance used to prefill and cap the withdrawal amount
 * @property {'blue'|'green'} [accent]
 * @property {'completed'|'active'} planStatus
 */

/**
 * Savings withdraw: step 1 = select wallet, step 2 = edit amount and confirm.
 * @param {{ isOpen: boolean, onClose: () => void, onNext?: (w: object) => void, onConfirmWithdraw?: (w: object, amount: number) => void|Promise<void>, isSubmitting?: boolean, wallets: SavingsWithdrawWalletOption[] }} props
 */
const SavingsWithdrawWalletModal = ({
  isOpen,
  onClose,
  onNext,
  onConfirmWithdraw,
  isSubmitting = false,
  wallets = [],
}) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => wallets[0]?.id ?? '');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const amountInputRef = useRef(null);

  const formatEditableAmount = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return '';
    return n.toFixed(2);
  };

  const sanitizeAmountInput = (raw) => {
    let v = String(raw ?? '').replace(/[$,]/g, '');
    v = v.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) return `${parts[0]}.${parts.slice(1).join('')}`;
    if (parts[1] != null) return `${parts[0]}.${parts[1].slice(0, 2)}`;
    return v;
  };

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setQuery('');
    setWithdrawAmount('');
    if (wallets.length === 0) return;
    setSelectedId((prev) => (wallets.some((w) => w.id === prev) ? prev : wallets[0].id));
  }, [isOpen, wallets]);

  useEffect(() => {
    if (!isOpen || step !== 2) return;
    amountInputRef.current?.focus();
    amountInputRef.current?.select();
  }, [isOpen, step]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wallets;
    return wallets.filter((w) => w.title.toLowerCase().includes(q));
  }, [wallets, query]);

  const selected = useMemo(() => wallets.find((w) => w.id === selectedId) ?? null, [wallets, selectedId]);

  const parsedWithdrawAmount = useMemo(() => {
    const raw = String(withdrawAmount ?? '').replace(/[$,]/g, '').trim();
    if (!raw) return null;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [withdrawAmount]);

  const handleClose = () => {
    setStep(1);
    setQuery('');
    setWithdrawAmount('');
    setSelectedId(wallets[0]?.id ?? '');
    onClose();
  };

  const handleNext = () => {
    if (!selected) {
      toast.error('Select a wallet');
      return;
    }
    setWithdrawAmount(formatEditableAmount(selected.savedUsd));
    setStep(2);
    if (onNext) {
      onNext(selected);
    }
  };

  const handleWithdrawAll = () => {
    const formatted = formatEditableAmount(selected?.savedUsd);
    if (!formatted) {
      toast.error('Nothing available to withdraw');
      return;
    }
    setWithdrawAmount(formatted);
  };

  const handleConfirmWithdraw = async () => {
    if (!selected) {
      toast.error('Select a wallet');
      return;
    }
    if (parsedWithdrawAmount == null) {
      toast.error('Enter a valid amount');
      return;
    }
    const available = Number(selected.savedUsd);
    if (Number.isFinite(available) && parsedWithdrawAmount > available + 1e-8) {
      toast.error('Amount exceeds available balance');
      return;
    }
    if (typeof onConfirmWithdraw === 'function') {
      await onConfirmWithdraw(selected, parsedWithdrawAmount);
      return;
    }
    toast.success('Withdrawal — coming soon');
    handleClose();
  };

  if (!isOpen) return null;

  const titleId = 'savings-withdraw-wallet-title';
  const SelectedIconComponent = selected?.Icon;

  return (
    <div className="savings-withdraw-wallet-overlay" onClick={handleClose}>
      <div
        className={`savings-withdraw-wallet-sheet ${step === 2 ? 'is-confirm-step' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="savings-withdraw-wallet-head">
          <h2 id={titleId} className="savings-withdraw-wallet-title">
            Withdraw
          </h2>
          <button type="button" className="savings-withdraw-wallet-close" onClick={handleClose} aria-label="Close">
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <p className="savings-withdraw-wallet-subtitle">Select Wallet</p>

            <div className="savings-withdraw-wallet-search">
              <label className="savings-withdraw-wallet-search-label" htmlFor="savings-withdraw-search-input">
                <span className="savings-withdraw-wallet-sr-only">Search wallets</span>
                <input
                  id="savings-withdraw-search-input"
                  type="search"
                  className="savings-withdraw-wallet-search-input"
                  placeholder="Search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button type="button" className="savings-withdraw-wallet-search-btn" aria-label="Search">
                <Search size={18} strokeWidth={2.25} />
              </button>
            </div>

            <ul className="savings-withdraw-wallet-list" role="listbox" aria-label="Wallets">
              {filtered.map((w) => {
                const Pi = w.Icon;
                const isSel = w.id === selectedId;
                const accent = w.accent ?? 'blue';
                return (
                  <li key={w.id} className="savings-withdraw-wallet-list-item">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      className={`savings-withdraw-wallet-row ${isSel ? 'is-selected' : ''} accent-${accent}`}
                      onClick={() => setSelectedId(w.id)}
                    >
                      <div className="savings-withdraw-wallet-row-left">
                        <div
                          className="savings-withdraw-wallet-ring"
                          style={{ '--sw-ring-color': w.ringColor, '--sw-pct': w.progressPct }}
                        >
                          <div className="savings-withdraw-wallet-ring-inner">
                            <Pi size={18} strokeWidth={2} aria-hidden />
                          </div>
                        </div>
                        <span className="savings-withdraw-wallet-name">{w.title}</span>
                      </div>
                      <span className="savings-withdraw-wallet-balance">{w.balanceLabel}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button type="button" className="savings-withdraw-wallet-next" onClick={handleNext}>
              Next
            </button>
          </>
        ) : (
          selected && (
            <div className="savings-withdraw-confirm">
              <div className="savings-withdraw-confirm-summary">
                <div className="savings-withdraw-confirm-left">
                  <div
                    className="savings-withdraw-wallet-ring savings-withdraw-confirm-ring"
                    style={{ '--sw-ring-color': selected.ringColor, '--sw-pct': selected.progressPct }}
                  >
                    <div className="savings-withdraw-wallet-ring-inner">
                      {SelectedIconComponent ? <SelectedIconComponent size={22} strokeWidth={2} aria-hidden /> : null}
                    </div>
                  </div>
                  <div className="savings-withdraw-confirm-names">
                    <p className="savings-withdraw-confirm-plan-title">{selected.title}</p>
                    <span
                      className={`savings-withdraw-confirm-badge ${
                        selected.planStatus === 'completed' ? 'savings-withdraw-confirm-badge--completed' : 'savings-withdraw-confirm-badge--active'
                      }`}
                    >
                      {selected.planStatus === 'completed' ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="savings-withdraw-confirm-balance-block">
                  <label className="savings-withdraw-confirm-balance-label" htmlFor="savings-withdraw-amount">
                    Amount
                  </label>
                  <div className="savings-withdraw-confirm-amount-field">
                    <span className="savings-withdraw-confirm-amount-prefix" aria-hidden>
                      $
                    </span>
                    <input
                      ref={amountInputRef}
                      id="savings-withdraw-amount"
                      className="savings-withdraw-confirm-amount-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={withdrawAmount}
                      disabled={isSubmitting}
                      onChange={(e) => setWithdrawAmount(sanitizeAmountInput(e.target.value))}
                    />
                  </div>
                  <span className="savings-withdraw-confirm-available">
                    Available {selected.confirmBalanceLabel ?? selected.balanceLabel}
                  </span>
                  <button
                    type="button"
                    className="savings-withdraw-all-btn"
                    onClick={handleWithdrawAll}
                    disabled={isSubmitting || !formatEditableAmount(selected.savedUsd)}
                  >
                    Withdraw all
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="savings-withdraw-confirm-submit"
                onClick={handleConfirmWithdraw}
                disabled={isSubmitting || parsedWithdrawAmount == null}
              >
                {isSubmitting ? 'Withdrawing…' : 'Withdraw'}
              </button>
            </div>
          )
        )}

        <div className="savings-withdraw-wallet-footnote">
          <Info size={16} strokeWidth={2} className="savings-withdraw-wallet-footnote-icon" aria-hidden />
          <span>Your funds will be added to your account within seconds or refunded if there&apos;s an issue.</span>
        </div>
      </div>
    </div>
  );
};

export default SavingsWithdrawWalletModal;
