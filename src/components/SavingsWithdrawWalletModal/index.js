import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import './index.css';

/**
 * @typedef {object} SavingsWithdrawWalletOption
 * @property {string} id
 * @property {string} title
 * @property {number} progressPct
 * @property {string} ringColor
 * @property {import('react').ElementType} Icon
 * @property {string} balanceLabel — list row (right side)
 * @property {string} confirmBalanceLabel — step 2 “Balance” amount
 * @property {'blue'|'green'} [accent]
 * @property {'completed'|'active'} planStatus
 */

/**
 * Savings withdraw: step 1 = select wallet, step 2 = confirm (balance + Withdraw).
 * @param {{ isOpen: boolean, onClose: () => void, onNext?: (w: object) => void, wallets: SavingsWithdrawWalletOption[] }} props
 */
const SavingsWithdrawWalletModal = ({ isOpen, onClose, onNext, wallets = [] }) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => wallets[0]?.id ?? '');

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setQuery('');
    if (wallets.length === 0) return;
    setSelectedId((prev) => (wallets.some((w) => w.id === prev) ? prev : wallets[0].id));
  }, [isOpen, wallets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wallets;
    return wallets.filter((w) => w.title.toLowerCase().includes(q));
  }, [wallets, query]);

  const selected = useMemo(() => wallets.find((w) => w.id === selectedId) ?? null, [wallets, selectedId]);

  const handleClose = () => {
    setStep(1);
    setQuery('');
    setSelectedId(wallets[0]?.id ?? '');
    onClose();
  };

  const handleNext = () => {
    if (!selected) {
      toast.error('Select a wallet');
      return;
    }
    setStep(2);
    if (onNext) {
      onNext(selected);
    }
  };

  const handleConfirmWithdraw = () => {
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
                  <span className="savings-withdraw-confirm-balance-label">Balance</span>
                  <span className="savings-withdraw-confirm-balance-amount">{selected.confirmBalanceLabel ?? selected.balanceLabel}</span>
                </div>
              </div>

              <button type="button" className="savings-withdraw-confirm-submit" onClick={handleConfirmWithdraw}>
                Withdraw
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
