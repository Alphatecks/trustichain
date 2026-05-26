import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import './index.css';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD', flag: 'us' },
  { value: 'EUR', label: 'EUR', flag: 'eu' },
  { value: 'GBP', label: 'GBP', flag: 'gb' },
  { value: 'NGN', label: 'NGN', flag: 'ng' },
];

const FREQUENCY_OPTIONS = [
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Bi-weekly', label: 'Bi-weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
];

const INITIAL_FORM = {
  currency: 'USD',
  salaryAmount: '',
  disbursementMode: 'Auto Release',
  autoReleaseFrequency: '',
  allowanceAllocation: false,
  addAmount: '',
};

const AddPayrollModal = ({ isOpen, onCancel, onSuccess }) => {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const currencyFieldRef = useRef(null);
  const frequencyFieldRef = useRef(null);

  const selectedCurrency = CURRENCY_OPTIONS.find((c) => c.value === form.currency) || CURRENCY_OPTIONS[0];
  const selectedFrequency = FREQUENCY_OPTIONS.find((opt) => opt.value === form.autoReleaseFrequency);

  useEffect(() => {
    if (!activePicker) return undefined;

    const fieldRefs = {
      currency: currencyFieldRef,
      frequency: frequencyFieldRef,
    };

    const handlePointerDown = (event) => {
      const activeRef = fieldRefs[activePicker];
      if (!activeRef?.current?.contains(event.target)) {
        setActivePicker(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActivePicker(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePicker]);

  useEffect(() => {
    if (!isOpen) setActivePicker(null);
  }, [isOpen]);

  const handleCloseModal = () => {
    setForm({ ...INITIAL_FORM });
    setSubmitError('');
    setSubmitting(false);
    setActivePicker(null);
    onCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!form.salaryAmount?.trim()) {
      setSubmitError('Salary amount is required');
      return;
    }

    if (form.disbursementMode === 'Auto Release' && !form.autoReleaseFrequency) {
      setSubmitError('Please select an auto release frequency');
      return;
    }

    const merged = {
      name: `Payroll — ${selectedCurrency.label} ${form.salaryAmount.trim()}`,
      payrollAmount: form.salaryAmount.trim(),
      payrollCycle: form.autoReleaseFrequency || 'Monthly',
      currency: form.currency,
      disbursementMode: form.disbursementMode,
      autoReleaseFrequency: form.autoReleaseFrequency,
      allowanceAllocation: form.allowanceAllocation,
      addAmount: form.addAmount,
      items: [],
      startDate: '',
      endDate: '',
      releaseDate: '',
      companyName: '',
    };

    setSubmitting(true);
    try {
      if (onSuccess) {
        const result = await Promise.resolve(onSuccess(merged));
        if (result !== false) handleCloseModal();
      } else {
        handleCloseModal();
      }
    } catch (err) {
      setSubmitError(err?.message || 'Failed to create payroll');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="add-payroll-overlay" onClick={handleCloseModal} role="presentation">
      <div
        className="add-payroll-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-payroll-modal-title"
      >
        <div className="add-payroll-header">
          <div className="add-payroll-title-row">
            <span className="add-payroll-accent" aria-hidden />
            <h2 id="add-payroll-modal-title">Add New Payroll</h2>
          </div>
          <button
            type="button"
            className="add-payroll-close"
            onClick={handleCloseModal}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form className="add-payroll-body" onSubmit={handleSubmit}>
          <h3 className="add-payroll-section-title">Payroll Detail</h3>

          <label className="add-payroll-label" id="add-payroll-currency-label">
            Currency
          </label>
          <div
            className={`add-payroll-picker-field${activePicker === 'currency' ? ' is-open' : ''}`}
            ref={currencyFieldRef}
          >
            <button
              type="button"
              id="add-payroll-currency"
              className="add-payroll-picker-trigger"
              aria-labelledby="add-payroll-currency-label"
              aria-haspopup="listbox"
              aria-expanded={activePicker === 'currency'}
              onClick={() => setActivePicker((current) => (current === 'currency' ? null : 'currency'))}
            >
              <span className="add-payroll-picker-trigger-leading">
                <span className="add-payroll-currency-flag" aria-hidden>
                  <img
                    src={`https://flagcdn.com/w40/${selectedCurrency.flag}.png`}
                    alt=""
                    width={24}
                    height={24}
                  />
                </span>
                <span className="add-payroll-picker-value add-payroll-picker-value--selected">{selectedCurrency.label}</span>
              </span>
              <ChevronDown
                size={18}
                className="add-payroll-picker-chevron"
                aria-hidden
                data-open={activePicker === 'currency' ? 'true' : 'false'}
              />
            </button>

            {activePicker === 'currency' ? (
              <>
                <div
                  className="add-payroll-picker-menu-backdrop"
                  aria-hidden
                  onClick={() => setActivePicker(null)}
                />
                <ul className="add-payroll-picker-menu" role="listbox" aria-label="Currency">
                  {CURRENCY_OPTIONS.map((opt) => {
                    const isActive = opt.value === form.currency;
                    return (
                      <li key={opt.value} role="option" aria-selected={isActive}>
                        <button
                          type="button"
                          className={`add-payroll-picker-option${isActive ? ' is-active' : ''}`}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, currency: opt.value }));
                            setActivePicker(null);
                          }}
                        >
                          <span className="add-payroll-picker-option-leading">
                            <span className="add-payroll-currency-flag" aria-hidden>
                              <img
                                src={`https://flagcdn.com/w40/${opt.flag}.png`}
                                alt=""
                                width={24}
                                height={24}
                              />
                            </span>
                            <span className="add-payroll-picker-option-label">{opt.label}</span>
                          </span>
                          {isActive ? <Check size={18} className="add-payroll-picker-check" aria-hidden /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </div>

          <label className="add-payroll-label" htmlFor="add-payroll-salary">
            Salary Amount
          </label>
          <input
            id="add-payroll-salary"
            type="text"
            inputMode="decimal"
            className="add-payroll-input"
            placeholder="Enter amount"
            value={form.salaryAmount}
            onChange={(e) => setForm((prev) => ({ ...prev, salaryAmount: e.target.value }))}
          />

          <span className="add-payroll-label">Disbursement Mode</span>
          <div className="add-payroll-radio-group" role="radiogroup" aria-label="Disbursement mode">
            <label className="add-payroll-radio">
              <input
                type="radio"
                name="disbursementMode"
                value="Auto Release"
                checked={form.disbursementMode === 'Auto Release'}
                onChange={(e) => setForm((prev) => ({ ...prev, disbursementMode: e.target.value }))}
              />
              <span className="add-payroll-radio-ring" aria-hidden />
              <span>Auto Release</span>
            </label>
            <label className="add-payroll-radio">
              <input
                type="radio"
                name="disbursementMode"
                value="Manual Release"
                checked={form.disbursementMode === 'Manual Release'}
                onChange={(e) => setForm((prev) => ({ ...prev, disbursementMode: e.target.value }))}
              />
              <span className="add-payroll-radio-ring" aria-hidden />
              <span>Manual Release</span>
            </label>
          </div>

          <label className="add-payroll-label" id="add-payroll-frequency-label">
            Auto Release Frequency
          </label>
          <div
            className={`add-payroll-picker-field${activePicker === 'frequency' ? ' is-open' : ''}`}
            ref={frequencyFieldRef}
          >
            <button
              type="button"
              id="add-payroll-frequency"
              className="add-payroll-picker-trigger"
              aria-labelledby="add-payroll-frequency-label"
              aria-haspopup="listbox"
              aria-expanded={activePicker === 'frequency'}
              onClick={() => setActivePicker((current) => (current === 'frequency' ? null : 'frequency'))}
            >
              <span
                className={`add-payroll-picker-value${selectedFrequency ? ' add-payroll-picker-value--selected' : ' add-payroll-picker-value--placeholder'}`}
              >
                {selectedFrequency?.label || 'Select'}
              </span>
              <ChevronDown
                size={18}
                className="add-payroll-picker-chevron"
                aria-hidden
                data-open={activePicker === 'frequency' ? 'true' : 'false'}
              />
            </button>

            {activePicker === 'frequency' ? (
              <>
                <div
                  className="add-payroll-picker-menu-backdrop"
                  aria-hidden
                  onClick={() => setActivePicker(null)}
                />
                <ul className="add-payroll-picker-menu" role="listbox" aria-label="Auto release frequency">
                  {FREQUENCY_OPTIONS.map((opt) => {
                    const isActive = opt.value === form.autoReleaseFrequency;
                    return (
                      <li key={opt.value} role="option" aria-selected={isActive}>
                        <button
                          type="button"
                          className={`add-payroll-picker-option${isActive ? ' is-active' : ''}`}
                          onClick={() => {
                            setForm((prev) => ({ ...prev, autoReleaseFrequency: opt.value }));
                            setActivePicker(null);
                          }}
                        >
                          <span className="add-payroll-picker-option-label">{opt.label}</span>
                          {isActive ? <Check size={18} className="add-payroll-picker-check" aria-hidden /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}
          </div>

          <div className="add-payroll-allowance-card">
            <h4 className="add-payroll-allowance-title">Allowance Allocation</h4>

            <div className="add-payroll-toggle-row">
              <span className="add-payroll-toggle-label">Enable Allowances</span>
              <label className="add-payroll-toggle">
                <input
                  type="checkbox"
                  checked={form.allowanceAllocation}
                  onChange={(e) => setForm((prev) => ({ ...prev, allowanceAllocation: e.target.checked }))}
                />
                <span className="add-payroll-toggle-slider" aria-hidden />
              </label>
            </div>

            <label className="add-payroll-label add-payroll-label--in-card" htmlFor="add-payroll-add-amount">
              Add Amount
            </label>
            <input
              id="add-payroll-add-amount"
              type="text"
              inputMode="decimal"
              className="add-payroll-input add-payroll-input--in-card"
              placeholder="Add amount"
              value={form.addAmount}
              disabled={!form.allowanceAllocation}
              onChange={(e) => setForm((prev) => ({ ...prev, addAmount: e.target.value }))}
            />

            <div className="add-payroll-fee-row">
              <span className="add-payroll-label add-payroll-label--in-card">Payroll Free</span>
              <span className="add-payroll-fee-value">0.5 % * Team members</span>
            </div>
          </div>

          {submitError ? <p className="add-payroll-error">{submitError}</p> : null}

          <button type="submit" className="add-payroll-submit" disabled={submitting}>
            {submitting ? (
              <>
                <LoadingIndicator size="sm" />
                Creating...
              </>
            ) : (
              'Done'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPayrollModal;
