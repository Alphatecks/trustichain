import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search } from 'lucide-react';
import {
  FIAT_CURRENCY_CODES,
  FIAT_CURRENCY_FLAG_BY_CODE,
  normalizeEscrowAmountCurrency,
} from '../../utils/displayCurrencyPreferences';

const EscrowCurrencySelectModal = ({ isOpen, selectedCode, onClose, onConfirm }) => {
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState(selectedCode);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPending(normalizeEscrowAmountCurrency(selectedCode));
      setQuery('');
    }
  }, [isOpen, selectedCode]);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return undefined;
    }
    setEntered(false);
    let id2;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(id1);
      if (id2 != null) cancelAnimationFrame(id2);
    };
  }, [isOpen]);

  const filteredCodes = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return FIAT_CURRENCY_CODES;
    return FIAT_CURRENCY_CODES.filter((code) => code.includes(q));
  }, [query]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`create-escrow-currency-modal-overlay${entered ? ' is-visible' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`create-escrow-currency-modal${entered ? ' is-visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-escrow-currency-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-escrow-currency-modal-header">
          <div className="create-escrow-currency-modal-header-leading">
            <span className="create-escrow-currency-modal-accent" aria-hidden />
            <h2 id="create-escrow-currency-modal-title">Select Currency</h2>
          </div>
          <button
            type="button"
            className="create-escrow-currency-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="create-escrow-currency-modal-search">
          <input
            type="search"
            className="create-escrow-currency-modal-search-input"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="create-escrow-currency-modal-search-btn" aria-label="Search">
            <Search size={18} strokeWidth={2.25} />
          </button>
        </div>

        <div className="create-escrow-currency-modal-list" role="listbox" aria-label="Currencies">
          {filteredCodes.map((code) => {
            const isActive = pending === code;
            const flag = FIAT_CURRENCY_FLAG_BY_CODE[code] || 'us';
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`create-escrow-currency-modal-row${isActive ? ' is-selected' : ''}`}
                onClick={() => setPending(code)}
              >
                <span className="create-escrow-currency-modal-row-leading">
                  <span className="create-escrow-currency-modal-flag">
                    <img src={`https://flagcdn.com/w80/${flag}.png`} alt="" />
                  </span>
                  <span className="create-escrow-currency-modal-code">{code}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="create-escrow-currency-modal-footer">
          <button
            type="button"
            className="create-escrow-currency-modal-select-btn"
            onClick={() => onConfirm(pending)}
          >
            Select
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default EscrowCurrencySelectModal;
