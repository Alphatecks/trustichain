import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Info } from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import './index.css';

const XRP_IMG =
  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731';

const DEFAULT_PLANS = ['Fixed', 'Flex Savings', 'Auto Savings', 'Goal'];

/** Plans that collect an upfront goal amount (XRP → USD via exchange line). */
export function planRequiresGoalAmount(plan) {
  return plan === 'Fixed' || plan === 'Auto Savings';
}

export function planIsAutoSavings(plan) {
  return plan === 'Auto Savings';
}

const DEFAULT_AUTOSAVE_FREQUENCIES = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'];

const DEFAULT_NOTE_FIXED =
  "In fixed savings once created money can't be withdrawn till financial goal is reached";

const DEFAULT_NOTE_FLEX_GOAL =
  'You can add money anytime after creating this plan. Contributions are flexible—no upfront goal amount is required.';

/**
 * Add savings plan modal (slide-up sheet + desktop dialog).
 */
const AddSavingsPlanModal = ({
  isOpen,
  onClose,
  name,
  onNameChange,
  planOptions = DEFAULT_PLANS,
  selectedPlan,
  onSelectPlan,
  amount,
  onAmountChange,
  walletLabel = 'XRP wallet',
  walletTicker = 'XRP',
  useCoinIconInPill = true,
  exchangeRateLine = '1 XRP = 1.05 USD',
  onCreate,
  isSubmitting = false,
  /** Overrides automatic footnote (fixed/auto vs flex/goal). */
  footnote,
  autoSaveAmount = '',
  onAutoSaveAmountChange = () => {},
  autoSaveFrequency = '',
  onAutoSaveFrequencyChange = () => {},
  autosaveFrequencyOptions = DEFAULT_AUTOSAVE_FREQUENCIES,
}) => {
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const [freqMenuOpen, setFreqMenuOpen] = useState(false);
  const planWrapRef = useRef(null);
  const freqWrapRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setPlanMenuOpen(false);
      setFreqMenuOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!planMenuOpen) return undefined;
    const close = (e) => {
      if (planWrapRef.current && !planWrapRef.current.contains(e.target)) {
        setPlanMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [planMenuOpen]);

  useEffect(() => {
    if (!freqMenuOpen) return undefined;
    const close = (e) => {
      if (freqWrapRef.current && !freqWrapRef.current.contains(e.target)) {
        setFreqMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [freqMenuOpen]);

  const onAmountRowInput = (e) => {
    let v = e.target.value.replace(/[^0-9.,]/g, '');
    onAmountChange(v);
  };

  const resolvedPlan =
    (selectedPlan && planOptions.includes(selectedPlan) ? selectedPlan : null) || planOptions[0] || 'Fixed';
  const showGoalAmount = planRequiresGoalAmount(resolvedPlan);
  const showAutoFields = planIsAutoSavings(resolvedPlan);
  const infoNote =
    footnote ?? (showGoalAmount ? DEFAULT_NOTE_FIXED : DEFAULT_NOTE_FLEX_GOAL);

  useEffect(() => {
    if (!isOpen || showGoalAmount) return;
    onAmountChange('');
  }, [isOpen, showGoalAmount, onAmountChange]);

  useEffect(() => {
    if (!isOpen || showAutoFields) return;
    onAutoSaveAmountChange('');
    onAutoSaveFrequencyChange('');
  }, [isOpen, showAutoFields, onAutoSaveAmountChange, onAutoSaveFrequencyChange]);

  const onAutosaveAmountInput = (e) => {
    let v = e.target.value.replace(/[^0-9.,]/g, '');
    onAutoSaveAmountChange(v);
  };

  if (!isOpen) return null;

  const titleId = 'add-savings-plans-modal-title';

  return (
    <div className="savings-asp-overlay" onClick={onClose} role="presentation">
      <div
        className="savings-asp-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="savings-asp-head">
          <h2 id={titleId} className="savings-asp-title">
            Add Savings Plans
          </h2>
          <button type="button" className="savings-asp-close" onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={2} />
          </button>
        </header>

        <div className="savings-asp-field">
          <label className="savings-asp-label" htmlFor="savings-asp-name-input">
            Name
          </label>
          <input
            id="savings-asp-name-input"
            type="text"
            className="savings-asp-input"
            placeholder="Enter name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            disabled={isSubmitting}
            autoComplete="off"
          />
        </div>

        <div className="savings-asp-field">
          <span className="savings-asp-label" id="savings-asp-plan-label">
            Plan
          </span>
          <div className="savings-asp-menu-wrap" ref={planWrapRef}>
            <button
              type="button"
              className={`savings-asp-trigger ${planMenuOpen ? 'is-open' : ''}`}
              aria-expanded={planMenuOpen}
              aria-haspopup="listbox"
              aria-labelledby="savings-asp-plan-label"
                  onClick={() => {
                    setPlanMenuOpen((o) => !o);
                    setFreqMenuOpen(false);
                  }}
              disabled={isSubmitting}
            >
              <span className="savings-asp-trigger-value">{resolvedPlan}</span>
              <ChevronDown size={18} strokeWidth={2} className="savings-asp-trigger-chevron" aria-hidden />
            </button>
            {planMenuOpen ? (
              <ul className="savings-asp-plan-menu" role="listbox">
                {planOptions.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      role="option"
                      className={`savings-asp-plan-option ${opt === selectedPlan ? 'is-selected' : ''}`}
                      onClick={() => {
                        onSelectPlan(opt);
                        setPlanMenuOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {showGoalAmount ? (
          <div className="savings-asp-amount-card">
            <div className="savings-asp-amount-top">
              <span className="savings-asp-set-amount-label">Set Amount</span>
              <div className="savings-asp-wallet-pill" aria-hidden={false}>
                {useCoinIconInPill ? (
                  <span className="savings-asp-wallet-badge is-icon">
                    <img src={XRP_IMG} alt="" />
                  </span>
                ) : (
                  <span className="savings-asp-wallet-badge">{walletTicker}</span>
                )}
                <span className="savings-asp-wallet-pill-label">{walletLabel}</span>
                <ChevronDown size={16} strokeWidth={2} className="savings-asp-wallet-chevron" aria-hidden />
              </div>
            </div>
            <div className="savings-asp-amount-hero">
              <input
                type="text"
                className="savings-asp-amount-input"
                placeholder="24,000"
                value={amount}
                onChange={onAmountRowInput}
                inputMode="decimal"
                disabled={isSubmitting}
                aria-label="Savings goal amount"
              />
              <span className="savings-asp-amount-suffix">{walletTicker}</span>
            </div>
            <p className="savings-asp-rate-line">{exchangeRateLine}</p>
          </div>
        ) : null}

        {showAutoFields ? (
          <>
            <div className="savings-asp-field">
              <label className="savings-asp-label" htmlFor="savings-asp-autosave-amt">
                AutoSave amount
              </label>
              <input
                id="savings-asp-autosave-amt"
                type="text"
                className="savings-asp-input"
                placeholder="Add"
                value={autoSaveAmount}
                onChange={onAutosaveAmountInput}
                inputMode="decimal"
                disabled={isSubmitting}
                autoComplete="off"
              />
            </div>
            <div className="savings-asp-field">
              <span className="savings-asp-label" id="savings-asp-freq-label">
                Autosave frequency
              </span>
              <div className="savings-asp-menu-wrap" ref={freqWrapRef}>
                <button
                  type="button"
                  className={`savings-asp-trigger ${freqMenuOpen ? 'is-open' : ''}`}
                  aria-expanded={freqMenuOpen}
                  aria-haspopup="listbox"
                  aria-labelledby="savings-asp-freq-label"
                  onClick={() => {
                    setFreqMenuOpen((o) => !o);
                    setPlanMenuOpen(false);
                  }}
                  disabled={isSubmitting}
                >
                  <span
                    className={`savings-asp-trigger-value ${
                      !autoSaveFrequency ? 'savings-asp-trigger-value--placeholder' : ''
                    }`}
                  >
                    {autoSaveFrequency || 'Add'}
                  </span>
                  <ChevronDown size={18} strokeWidth={2} className="savings-asp-trigger-chevron" aria-hidden />
                </button>
                {freqMenuOpen ? (
                  <ul className="savings-asp-plan-menu" role="listbox">
                    {autosaveFrequencyOptions.map((opt) => (
                      <li key={opt}>
                        <button
                          type="button"
                          role="option"
                          className={`savings-asp-plan-option ${
                            opt === autoSaveFrequency ? 'is-selected' : ''
                          }`}
                          onClick={() => {
                            onAutoSaveFrequencyChange(opt);
                            setFreqMenuOpen(false);
                          }}
                        >
                          {opt}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        <button type="button" className="savings-asp-submit" onClick={onCreate} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoadingIndicator size="sm" />
              <span>Creating…</span>
            </>
          ) : (
            'Create'
          )}
        </button>

        <div className="savings-asp-footnote">
          <Info size={16} strokeWidth={2} aria-hidden />
          <span>{infoNote}</span>
        </div>
      </div>
    </div>
  );
};

export default AddSavingsPlanModal;
export { DEFAULT_PLANS, DEFAULT_AUTOSAVE_FREQUENCIES };
