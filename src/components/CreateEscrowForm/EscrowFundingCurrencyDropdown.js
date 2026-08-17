import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  DEPOSIT_ADDRESS_CURRENCY_ICON,
  depositAddressCurrencyLabel,
} from '../../utils/depositAddressFlow';

const formatBalance = (value) =>
  Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EscrowFundingCurrencyDropdown = ({
  currencies,
  currency,
  balances,
  loading = false,
  disabled = false,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = currency || currencies[0];

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectedBalance = balances?.[selected] ?? 0;
  const isDisabled = disabled || loading;

  return (
    <div
      ref={wrapRef}
      className={`create-escrow-funding-currency-dropdown${open ? ' is-open' : ''}${
        isDisabled ? ' is-disabled' : ''
      }`}
    >
      <button
        type="button"
        className="create-escrow-funding-currency-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Escrow funding currency"
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) return;
          setOpen((prev) => !prev);
        }}
      >
        <span
          className={`create-escrow-funding-currency-icon${
            selected === 'USDT' || selected === 'USDC' ? ' is-stablecoin' : ''
          }`}
        >
          <img
            src={DEPOSIT_ADDRESS_CURRENCY_ICON[selected] || DEPOSIT_ADDRESS_CURRENCY_ICON.XRP}
            alt=""
          />
        </span>
        <span className="create-escrow-funding-currency-trigger-text">
          <span className="create-escrow-funding-currency-trigger-label">
            {depositAddressCurrencyLabel(selected)}
          </span>
          <span className="create-escrow-funding-currency-trigger-balance">
            Bal {loading ? '—' : formatBalance(selectedBalance)}
          </span>
        </span>
        <ChevronDown size={16} className="create-escrow-funding-currency-chevron" aria-hidden />
      </button>

      {open && !isDisabled && (
        <div className="create-escrow-funding-currency-menu" role="listbox" aria-label="Currencies">
          {currencies.map((code) => {
            const isActive = code === selected;
            const balance = balances?.[code] ?? 0;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`create-escrow-funding-currency-option${isActive ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
              >
                <span
                  className={`create-escrow-funding-currency-icon${
                    code === 'USDT' || code === 'USDC' ? ' is-stablecoin' : ''
                  }`}
                >
                  <img
                    src={DEPOSIT_ADDRESS_CURRENCY_ICON[code] || DEPOSIT_ADDRESS_CURRENCY_ICON.XRP}
                    alt=""
                  />
                </span>
                <span className="create-escrow-funding-currency-option-body">
                  <span className="create-escrow-funding-currency-option-label">
                    {depositAddressCurrencyLabel(code)}
                  </span>
                  <span className="create-escrow-funding-currency-option-meta">
                    {code} · Bal {formatBalance(balance)}
                  </span>
                </span>
                {isActive ? (
                  <Check size={16} className="create-escrow-funding-currency-option-check" aria-hidden />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EscrowFundingCurrencyDropdown;
