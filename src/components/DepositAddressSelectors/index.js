import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DEPOSIT_ADDRESS_CURRENCIES,
  DEPOSIT_ADDRESS_CURRENCY_ICON,
  depositAddressCurrencyLabel,
  depositAddressNetworkLabel,
  getDepositNetworksForCurrency,
} from '../../utils/depositAddressFlow';
import './index.css';

const DepositAddressSelectors = ({
  currency,
  network,
  onCurrencyChange,
  onNetworkChange,
  currencySelectId = 'deposit-fund-currency',
  networkSelectId = 'deposit-fund-network',
}) => {
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const networks = getDepositNetworksForCurrency(currency);

  useEffect(() => {
    if (!currencyOpen && !networkOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!event.target.closest('.deposit-dropdown-wrap')) {
        setCurrencyOpen(false);
        setNetworkOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currencyOpen, networkOpen]);

  return (
    <>
      <div className="fund-wallet-transfer-form-group">
        <span className="fund-wallet-transfer-label">Currency</span>
        <div className={`deposit-dropdown-wrap deposit-currency-pill${currencyOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            id={currencySelectId}
            className="deposit-dropdown-trigger deposit-currency-trigger"
            onClick={() => {
              setNetworkOpen(false);
              setCurrencyOpen((open) => !open);
            }}
            aria-expanded={currencyOpen}
            aria-haspopup="listbox"
            aria-label="Currency"
          >
            <div className={`fund-wallet-transfer-currency-badge${currency === 'USDT' || currency === 'USDC' ? ' is-stablecoin' : ''}`}>
              <img
                src={DEPOSIT_ADDRESS_CURRENCY_ICON[currency] || DEPOSIT_ADDRESS_CURRENCY_ICON.XRP}
                alt=""
              />
            </div>
            <span className="deposit-dropdown-value">{depositAddressCurrencyLabel(currency)}</span>
            <ChevronDown size={16} className="deposit-dropdown-chevron" aria-hidden />
          </button>
          {currencyOpen && (
            <div className="deposit-dropdown-menu" role="listbox">
              {DEPOSIT_ADDRESS_CURRENCIES.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="option"
                  aria-selected={currency === code}
                  className={`deposit-dropdown-option${currency === code ? ' is-active' : ''}`}
                  onClick={() => {
                    onCurrencyChange(code);
                    setCurrencyOpen(false);
                  }}
                >
                  <div className={`fund-wallet-transfer-currency-badge${code === 'USDT' || code === 'USDC' ? ' is-stablecoin' : ''}`}>
                    <img
                      src={DEPOSIT_ADDRESS_CURRENCY_ICON[code] || DEPOSIT_ADDRESS_CURRENCY_ICON.XRP}
                      alt=""
                    />
                  </div>
                  <span>{depositAddressCurrencyLabel(code)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fund-wallet-transfer-form-group">
        <span className="fund-wallet-transfer-label">Network</span>
        <div className={`deposit-dropdown-wrap deposit-network-pill${networkOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            id={networkSelectId}
            className="deposit-dropdown-trigger deposit-network-trigger"
            onClick={() => {
              setCurrencyOpen(false);
              setNetworkOpen((open) => !open);
            }}
            aria-expanded={networkOpen}
            aria-haspopup="listbox"
            aria-label="Network"
          >
            <span className="deposit-dropdown-value">{depositAddressNetworkLabel(network)}</span>
            <ChevronDown size={16} className="deposit-dropdown-chevron" aria-hidden />
          </button>
          {networkOpen && (
            <div className="deposit-dropdown-menu" role="listbox">
              {networks.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={network === key}
                  className={`deposit-dropdown-option${network === key ? ' is-active' : ''}`}
                  onClick={() => {
                    onNetworkChange(key);
                    setNetworkOpen(false);
                  }}
                >
                  <span>{depositAddressNetworkLabel(key)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DepositAddressSelectors;
