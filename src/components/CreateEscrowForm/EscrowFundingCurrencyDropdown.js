import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  FIAT_CURRENCY_FLAG_BY_CODE,
  normalizeEscrowAmountCurrency,
} from '../../utils/displayCurrencyPreferences';
import EscrowCurrencySelectModal from './EscrowCurrencySelectModal';

const EscrowFundingCurrencyDropdown = ({ currency, disabled = false, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const selected = normalizeEscrowAmountCurrency(currency);

  const renderFlag = (code) => {
    const flag = FIAT_CURRENCY_FLAG_BY_CODE[code] || 'us';
    return (
      <span className="create-escrow-funding-currency-flag" aria-hidden>
        <img src={`https://flagcdn.com/w40/${flag}.png`} alt="" />
      </span>
    );
  };

  return (
    <>
      <div
        className={`create-escrow-funding-currency-dropdown${modalOpen ? ' is-open' : ''}${
          disabled ? ' is-disabled' : ''
        }`}
      >
        <button
          type="button"
          className="create-escrow-funding-currency-trigger"
          aria-expanded={modalOpen}
          aria-haspopup="dialog"
          aria-label="Currency"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setModalOpen(true);
          }}
        >
          {renderFlag(selected)}
          <span className="create-escrow-funding-currency-trigger-label">{selected}</span>
          <ChevronDown size={16} className="create-escrow-funding-currency-chevron" aria-hidden />
        </button>
      </div>

      <EscrowCurrencySelectModal
        isOpen={modalOpen}
        selectedCode={selected}
        onClose={() => setModalOpen(false)}
        onConfirm={(code) => {
          onChange(code);
          setModalOpen(false);
        }}
      />
    </>
  );
};

export default EscrowFundingCurrencyDropdown;
