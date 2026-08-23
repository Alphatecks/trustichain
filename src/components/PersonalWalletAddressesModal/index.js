import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import LoadingIndicator from '../LoadingIndicator';
import ConnectWalletModal from '../ConnectWalletModal';
import { DashboardSkeletonBlock } from '../DashboardSkeletons';
import {
  hasStablecoinDepositAddresses,
  parseWalletBalancesFromApi,
  DEPOSIT_ADDRESS_CURRENCY_ICON,
} from '../../utils/depositAddressFlow';
import { getApiUrl } from '../../utils/config';
import rlusdLogo from '../../assets/images/icons/rlusd-logo.svg';
import './index.css';

const METAMASK_ICON = 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg';
const XAMAN_ICON =
  'https://cdn.prod.website-files.com/66ffb9c73bc7e83a1e0e1006/67028cc20682f3c6f7ec6161_Xaman%20Logo.svg';

const TRUSTICHAIN_WALLETS = [
  {
    code: 'XRP',
    name: 'XRP',
    balanceKey: 'xrp',
    iconUrl: DEPOSIT_ADDRESS_CURRENCY_ICON.XRP,
    maxDecimals: 6,
  },
  {
    code: 'RLUSD',
    name: 'RLUSD',
    balanceKey: 'rlusd',
    iconUrl: rlusdLogo,
    maxDecimals: 2,
  },
  {
    code: 'USDT',
    name: 'Tether USD',
    balanceKey: 'usdt',
    iconUrl: DEPOSIT_ADDRESS_CURRENCY_ICON.USDT,
    maxDecimals: 2,
  },
  {
    code: 'USDC',
    name: 'USD Coin',
    balanceKey: 'usdc',
    iconUrl: DEPOSIT_ADDRESS_CURRENCY_ICON.USDC,
    maxDecimals: 2,
  },
];

const CHAIN_LABELS = {
  1: 'Ethereum',
  5: 'Goerli',
  11155111: 'Sepolia',
  56: 'BNB Chain',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  1440002: 'XRPL EVM',
};

const formatAddressShort = (address) => {
  if (!address || typeof address !== 'string') return '—';
  const trimmed = address.trim();
  if (trimmed.length <= 18) return trimmed;
  return `${trimmed.slice(0, 12)}…`;
};

const formatAssetAmount = (amount, symbol, maxDecimals = 2) =>
  `${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  })} ${symbol}`;

const formatUsd = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getExchangeRateFromRates = (rates, fromCurrency, toCurrency) => {
  if (!fromCurrency || !toCurrency) return null;
  if (fromCurrency === toCurrency) return 1;
  const list = Array.isArray(rates) ? rates : [];
  if (list.length === 0) return null;

  const direct = list.find((r) => r.from === fromCurrency && r.to === toCurrency);
  if (direct?.rate != null) {
    const v = Number(direct.rate);
    if (Number.isFinite(v) && v > 0) return v;
  }

  const reverse = list.find((r) => r.from === toCurrency && r.to === fromCurrency);
  if (reverse?.rate != null) {
    const v = Number(reverse.rate);
    if (Number.isFinite(v) && v > 0) return 1 / v;
  }

  if (fromCurrency === 'XRP' && toCurrency === 'USD') {
    const xrpRow = list.find((r) => (r.currency || r.code || '').toUpperCase() === 'XRP');
    const n = Number(xrpRow?.rate ?? xrpRow?.value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  if (fromCurrency === 'USD' && toCurrency === 'XRP') {
    const xrpRow = list.find((r) => (r.currency || r.code || '').toUpperCase() === 'XRP');
    const n = Number(xrpRow?.rate ?? xrpRow?.value);
    if (Number.isFinite(n) && n > 0) return 1 / n;
  }

  return null;
};

const getChangePercentForCurrency = (rates, code) => {
  const list = Array.isArray(rates) ? rates : [];
  const row = list.find((r) => (r.currency || r.code || '').toUpperCase() === code.toUpperCase());
  const change = Number(row?.changePercent ?? row?.change);
  return Number.isFinite(change) ? change : 0;
};

const computeWalletUsdValue = (code, amount, rates) => {
  const qty = Number(amount) || 0;
  if (code === 'XRP') {
    const rate = getExchangeRateFromRates(rates, 'XRP', 'USD');
    return rate != null && rate > 0 ? qty * rate : 0;
  }
  if (code === 'RLUSD' || code === 'USDT' || code === 'USDC') {
    return qty;
  }
  return qty;
};

const getChainLabel = (chainId) => {
  if (chainId == null) return 'Ethereum';
  return CHAIN_LABELS[Number(chainId)] || 'Ethereum';
};

const buildConnectedWallets = ({ account, isConnected, chainId }) => {
  const wallets = [];
  const hasWindow = typeof window !== 'undefined';

  const isMetaMaskConnected =
    hasWindow &&
    localStorage.getItem('metamaskWalletConnected') === 'true' &&
    isConnected &&
    Boolean(account);

  if (isMetaMaskConnected || (isConnected && account && hasWindow && window.ethereum?.isMetaMask)) {
    wallets.push({
      id: 'metamask',
      name: 'MetaMask',
      network: getChainLabel(chainId),
      address: account,
      iconUrl: METAMASK_ICON,
    });
  } else if (isConnected && account) {
    wallets.push({
      id: 'injected',
      name: 'Wallet',
      network: getChainLabel(chainId),
      address: account,
      iconUrl: null,
    });
  }

  const xamanConnected = hasWindow && localStorage.getItem('xamanWalletConnected') === 'true';
  const xamanAddress = hasWindow ? localStorage.getItem('xamanWalletAddress') : '';
  if (xamanConnected && xamanAddress?.trim()) {
    wallets.push({
      id: 'xaman',
      name: 'XAMAN',
      network: 'XRPL',
      address: xamanAddress.trim(),
      iconUrl: XAMAN_ICON,
    });
  }

  return wallets;
};

function WalletsModalAssetsSkeleton({ count = 3 }) {
  return (
    <div className="wallets-modal-assets-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`wallets-asset-skeleton-${index}`} className="wallets-modal-asset-skeleton-row">
          <DashboardSkeletonBlock
            className="wallets-modal-asset-icon"
            style={{ animationDelay: `${index * 0.05}s`, borderRadius: '50%' }}
          />
          <div className="wallets-modal-asset-main">
            <DashboardSkeletonBlock style={{ width: '5rem', height: '0.85rem', borderRadius: '999px' }} />
            <DashboardSkeletonBlock
              style={{ width: '7.5rem', height: '0.75rem', borderRadius: '999px', marginTop: '0.35rem' }}
            />
          </div>
          <div className="wallets-modal-asset-value-col">
            <DashboardSkeletonBlock style={{ width: '4.5rem', height: '0.85rem', borderRadius: '999px' }} />
            <DashboardSkeletonBlock style={{ width: '3rem', height: '0.7rem', borderRadius: '999px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const PersonalWalletAddressesModal = ({
  isOpen,
  onClose,
  walletAddress,
  walletBalanceRaw,
  isLoadingWalletAddress = false,
  isProvisioningWallets,
  onCreateInitialWallet,
  onProvisionOtherAddresses,
  showProvisionButton = true,
}) => {
  const { account, isConnected, chainId } = useWeb3();
  const [connectedPickerOpen, setConnectedPickerOpen] = useState(false);
  const [selectedConnectedId, setSelectedConnectedId] = useState('');
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);
  const [exchangeRates, setExchangeRates] = useState([]);
  const connectedPickerRef = useRef(null);

  const connectedWallets = useMemo(
    () => buildConnectedWallets({ account, isConnected, chainId }),
    [account, isConnected, chainId],
  );

  useEffect(() => {
    if (!isOpen) {
      setConnectedPickerOpen(false);
      setShowConnectWalletModal(false);
      return;
    }
    if (connectedWallets.length === 0) {
      setSelectedConnectedId('');
      return;
    }
    setSelectedConnectedId((prev) =>
      connectedWallets.some((w) => w.id === prev) ? prev : connectedWallets[0].id,
    );
  }, [isOpen, connectedWallets]);

  useEffect(() => {
    if (!connectedPickerOpen) return undefined;
    const handleClickOutside = (event) => {
      if (connectedPickerRef.current && !connectedPickerRef.current.contains(event.target)) {
        setConnectedPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [connectedPickerOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    const fetchExchangeRates = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await fetch(getApiUrl('api/exchange/rates'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok || cancelled) return;
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (result?.success && Array.isArray(result?.data?.rates)) {
          setExchangeRates(result.data.rates);
        }
      } catch (_) {
        if (!cancelled) setExchangeRates([]);
      }
    };

    fetchExchangeRates();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const balances = useMemo(() => parseWalletBalancesFromApi(walletBalanceRaw), [walletBalanceRaw]);

  const trustichainAssets = useMemo(
    () =>
      TRUSTICHAIN_WALLETS.map((wallet) => {
        const amount = Number(balances[wallet.balanceKey] ?? 0);
        const usdValue = computeWalletUsdValue(wallet.code, amount, exchangeRates);
        return {
          ...wallet,
          amount,
          usdValue,
          changePercent: getChangePercentForCurrency(exchangeRates, wallet.code),
        };
      }),
    [balances, exchangeRates],
  );

  const selectedConnected =
    connectedWallets.find((w) => w.id === selectedConnectedId) ?? connectedWallets[0] ?? null;

  const hasCustodialWallet = Boolean(walletAddress?.trim());
  const stablecoinAddressesReady = useMemo(
    () => hasStablecoinDepositAddresses(walletBalanceRaw),
    [walletBalanceRaw],
  );
  const showProvisionStablecoinButton = showProvisionButton && !stablecoinAddressesReady;
  const showLoadingAssets = isLoadingWalletAddress && !walletBalanceRaw;

  if (!isOpen) return null;

  const renderChange = (changePercent) => {
    const value = Number(changePercent) || 0;
    if (value > 0) {
      return (
        <span className="wallets-modal-asset-change is-positive">
          <TrendingUp size={12} strokeWidth={2.5} aria-hidden />
          +{value.toFixed(1)}%
        </span>
      );
    }
    if (value < 0) {
      return (
        <span className="wallets-modal-asset-change is-negative">
          <TrendingDown size={12} strokeWidth={2.5} aria-hidden />
          {value.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="wallets-modal-asset-change is-neutral">
        <Minus size={12} strokeWidth={2.5} aria-hidden />
        0.0%
      </span>
    );
  };

  return (
    <React.Fragment>
      <div className="wallets-modal-overlay" onClick={onClose} role="presentation">
        <div
          className="wallets-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallets-modal-title"
        >
        <div className="wallets-modal-header">
          <h2 id="wallets-modal-title" className="wallets-modal-title">
            Wallets
          </h2>
          <button type="button" className="wallets-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <section className="wallets-modal-section wallets-modal-section--connected" aria-labelledby="wallets-connected-heading">
          <h3 id="wallets-connected-heading" className="wallets-modal-section-title">
            My Connected wallet
          </h3>
          <div className="wallets-modal-connected-card" ref={connectedPickerRef}>
            {selectedConnected ? (
              <>
                <button
                  type="button"
                  className="wallets-modal-connected-select"
                  onClick={() => setConnectedPickerOpen((open) => !open)}
                  aria-expanded={connectedPickerOpen}
                  aria-haspopup="listbox"
                >
                  <span
                    className={`wallets-modal-connected-icon${
                      !selectedConnected.iconUrl ? ' wallets-modal-connected-icon--fallback' : ''
                    }`}
                  >
                    {selectedConnected.iconUrl ? (
                      <img src={selectedConnected.iconUrl} alt="" />
                    ) : (
                      <span aria-hidden>W</span>
                    )}
                  </span>
                  <span className="wallets-modal-connected-copy">
                    <span className="wallets-modal-connected-name">
                      {selectedConnected.name} • {selectedConnected.network}
                    </span>
                    <span className="wallets-modal-connected-address">
                      {formatAddressShort(selectedConnected.address)}
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`wallets-modal-connected-chevron${connectedPickerOpen ? ' is-open' : ''}`}
                    aria-hidden
                  />
                </button>
                {connectedPickerOpen && connectedWallets.length > 1 ? (
                  <ul className="wallets-modal-connected-picker" role="listbox">
                    {connectedWallets.map((wallet) => (
                      <li key={wallet.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={wallet.id === selectedConnected.id}
                          className={wallet.id === selectedConnected.id ? 'is-current' : undefined}
                          onClick={() => {
                            setSelectedConnectedId(wallet.id);
                            setConnectedPickerOpen(false);
                          }}
                        >
                          <span
                            className={`wallets-modal-connected-icon${
                              !wallet.iconUrl ? ' wallets-modal-connected-icon--fallback' : ''
                            }`}
                          >
                            {wallet.iconUrl ? (
                              <img src={wallet.iconUrl} alt="" />
                            ) : (
                              <span aria-hidden>W</span>
                            )}
                          </span>
                          <span className="wallets-modal-connected-copy">
                            <span className="wallets-modal-connected-name">
                              {wallet.name} • {wallet.network}
                            </span>
                            <span className="wallets-modal-connected-address">
                              {formatAddressShort(wallet.address)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div className="wallets-modal-connected-empty-wrap">
                <p className="wallets-modal-connected-empty">No external wallet connected.</p>
                <button
                  type="button"
                  className="wallets-modal-action-btn wallets-modal-connect-wallet-btn"
                  onClick={() => setShowConnectWalletModal(true)}
                >
                  Connect a wallet
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="wallets-modal-section" aria-labelledby="wallets-trustichain-heading">
          <h3 id="wallets-trustichain-heading" className="wallets-modal-section-title">
            My Trustichain Wallet
          </h3>

          {showLoadingAssets ? (
            <WalletsModalAssetsSkeleton count={4} />
          ) : !hasCustodialWallet ? (
            <>
              <p className="wallets-modal-empty-hint">
                No Trustichain wallet yet. Create your wallet to hold XRP, RLUSD, USDT, and USDC.
              </p>
              {showProvisionButton ? (
                <div className="wallets-modal-actions">
                  <button
                    type="button"
                    className="wallets-modal-action-btn"
                    disabled={isProvisioningWallets}
                    onClick={onCreateInitialWallet}
                  >
                    {isProvisioningWallets ? (
                      <span className="wallets-modal-action-loading">
                        <LoadingIndicator size="sm" />
                        Creating…
                      </span>
                    ) : (
                      'Create wallet'
                    )}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <ul className="wallets-modal-assets">
                {trustichainAssets.map((asset) => (
                  <li key={asset.code} className="wallets-modal-asset-row">
                    <span className="wallets-modal-asset-icon" aria-hidden>
                      <img src={asset.iconUrl} alt="" />
                    </span>
                    <div className="wallets-modal-asset-main">
                      <p className="wallets-modal-asset-name">{asset.name}</p>
                      <p className="wallets-modal-asset-amount">
                        {formatAssetAmount(asset.amount, asset.code, asset.maxDecimals)}
                      </p>
                    </div>
                    <div className="wallets-modal-asset-value-col">
                      <span className="wallets-modal-asset-usd">{formatUsd(asset.usdValue)}</span>
                      {renderChange(asset.changePercent)}
                    </div>
                  </li>
                ))}
              </ul>

              {showProvisionStablecoinButton ? (
                <div className="wallets-modal-actions">
                  <button
                    type="button"
                    className="wallets-modal-action-btn"
                    disabled={isProvisioningWallets}
                    onClick={onProvisionOtherAddresses}
                  >
                    {isProvisioningWallets ? (
                      <span className="wallets-modal-action-loading">
                        <LoadingIndicator size="sm" />
                        Creating addresses…
                      </span>
                    ) : (
                      'Create USDT & USDC addresses'
                    )}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <button type="button" className="wallets-modal-done-btn" onClick={onClose}>
          Done
        </button>
        </div>
      </div>

      <ConnectWalletModal
        isOpen={showConnectWalletModal}
        onClose={() => setShowConnectWalletModal(false)}
        overlayClassName="wallets-modal-connect-stack"
      />
    </React.Fragment>
  );
};

export default PersonalWalletAddressesModal;
