import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import { X, ChevronDown, Copy, TrendingUp, TrendingDown } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import LoadingIndicator from '../LoadingIndicator';
import ConnectWalletModal from '../ConnectWalletModal';
import { DashboardSkeletonBlock } from '../DashboardSkeletons';
import {
  hasStablecoinDepositAddresses,
  DEPOSIT_ADDRESS_CURRENCY_ICON,
  DEPOSIT_ADDRESS_NETWORK_KEYS,
  depositAddressNetworkLabel,
  extractWalletAddresses,
  extractDepositAddressFromApiResponse,
  resolveDepositAddressFromBalance,
} from '../../utils/depositAddressFlow';
import { getApiUrl } from '../../utils/config';
import {
  parseCustodialWalletBalances,
  readStoredDashboardAccountType,
} from '../../utils/custodialWalletBalances';
import { getUsdPerXrpFromExchangeRates, readXrpUsdRateFromExchangePayload } from '../../utils/displayCurrencyFormat';
import { getWalletBalanceChangePercent } from '../../utils/walletBalanceChange';
import { useDisplayCurrency } from '../../context/DisplayCurrencyContext';
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

const coerceTokenBalances = (input) => {
  if (!input || typeof input !== 'object') return null;
  const read = (...keys) => {
    for (const key of keys) {
      if (input[key] === undefined || input[key] === null || input[key] === '') continue;
      const n = Number(input[key]);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };
  return {
    xrp: read('xrp', 'XRP'),
    usdt: read('usdt', 'USDT'),
    usdc: read('usdc', 'USDC'),
    rlusd: read('rlusd', 'RLUSD', 'rippleUsd', 'ripple_usd'),
  };
};

const hasAnyTokenBalance = (balances) =>
  Boolean(
    balances &&
      [balances.xrp, balances.usdt, balances.usdc, balances.rlusd].some((n) => Number(n) > 0),
  );

const DETAILS_WALLET_NAMES = {
  XRP: 'XRP wallet',
  RLUSD: 'Ripple USD wallet',
  USDT: 'USDT wallet',
  USDC: 'USDC wallet',
};

const formatDetailsAddressShort = (addr) => {
  if (!addr || typeof addr !== 'string') return 'N/A';
  const t = addr.trim();
  if (!t.length) return 'N/A';
  if (t.length <= 16) return t;
  return `${t.slice(0, 12)}…${t.slice(-6)}`;
};

const defaultNetworkForCode = (code) => {
  const networks = DEPOSIT_ADDRESS_NETWORK_KEYS[code] || ['XRPL'];
  return networks[0] || 'XRPL';
};

const getChangePercentForCurrency = (rates, code) => getWalletBalanceChangePercent(code, rates);

/** USD value for a wallet row. `null` means the FX rate is missing — do not treat as $0. */
const computeWalletUsdValue = (code, amount, exchangeRates, quoteDirection, xrpUsdRate) => {
  const qty = Number(amount) || 0;
  if (code === 'XRP') {
    if (qty === 0) return 0;
    const usdPerXrp = getUsdPerXrpFromExchangeRates(exchangeRates, quoteDirection, xrpUsdRate);
    return usdPerXrp != null && usdPerXrp > 0 ? qty * usdPerXrp : null;
  }
  if (code === 'RLUSD' || code === 'USDT' || code === 'USDC') {
    return qty;
  }
  return qty;
};

const formatWalletAssetFiatLabel = ({
  code,
  amount,
  usdValue,
  displayCurrency,
  formatFromUsd,
  isLoadingRates,
}) => {
  if (usdValue != null && Number.isFinite(Number(usdValue))) {
    return formatFromUsd(usdValue, {
      xrpAmount: code === 'XRP' ? amount : undefined,
      isLoadingRates,
    });
  }
  if (displayCurrency === 'XRP' && code === 'XRP') {
    return formatFromUsd(0, { xrpAmount: amount, isLoadingRates });
  }
  return isLoadingRates ? '…' : '—';
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
  walletBalances: walletBalancesProp,
  isLoadingWalletAddress = false,
  isProvisioningWallets,
  onCreateInitialWallet,
  onProvisionOtherAddresses,
  showProvisionButton = true,
}) => {
  const { account, isConnected, chainId } = useWeb3();
  const {
    displayCurrency,
    formatFromUsd,
    exchangeRates: displayExchangeRates,
    xrpUsdRate: contextXrpUsdRate,
    exchangeQuoteDirection,
    isLoadingExchangeRates,
  } = useDisplayCurrency();
  const [connectedPickerOpen, setConnectedPickerOpen] = useState(false);
  const [selectedConnectedId, setSelectedConnectedId] = useState('');
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [fetchedXrpUsdRate, setFetchedXrpUsdRate] = useState(null);
  const [isFetchingLocalRates, setIsFetchingLocalRates] = useState(false);
  const [fetchedBalances, setFetchedBalances] = useState(null);
  const [fetchedBalanceRaw, setFetchedBalanceRaw] = useState(null);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);
  const connectedPickerRef = useRef(null);
  const detailsPickerRef = useRef(null);
  const [selectedDetailsCode, setSelectedDetailsCode] = useState('');
  const [detailsNetwork, setDetailsNetwork] = useState('XRPL');
  const [detailsDepositAddress, setDetailsDepositAddress] = useState('');
  const [isLoadingDetailsAddress, setIsLoadingDetailsAddress] = useState(false);
  const [detailsPickerOpen, setDetailsPickerOpen] = useState(false);

  const connectedWallets = useMemo(
    () => buildConnectedWallets({ account, isConnected, chainId }),
    [account, isConnected, chainId],
  );

  useEffect(() => {
    if (!isOpen) {
      setConnectedPickerOpen(false);
      setShowConnectWalletModal(false);
      setSelectedDetailsCode('');
      setDetailsPickerOpen(false);
      setDetailsDepositAddress('');
      setFetchedBalances(null);
      setFetchedBalanceRaw(null);
      setFetchedXrpUsdRate(null);
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
    if (!detailsPickerOpen) return undefined;
    const handleClickOutside = (event) => {
      if (detailsPickerRef.current && !detailsPickerRef.current.contains(event.target)) {
        setDetailsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [detailsPickerOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    const fetchExchangeRates = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsFetchingLocalRates(false);
        return;
      }
      setIsFetchingLocalRates(true);
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
        const liveXrpUsd = readXrpUsdRateFromExchangePayload(result);
        if (liveXrpUsd != null) setFetchedXrpUsdRate(liveXrpUsd);
      } catch (_) {
        if (!cancelled) setExchangeRates([]);
      } finally {
        if (!cancelled) setIsFetchingLocalRates(false);
      }
    };

    fetchExchangeRates();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    const loadBalances = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      setIsFetchingBalances(true);
      try {
        const isBusinessSuite = readStoredDashboardAccountType() === 'Business Suite';
        const endpoint = isBusinessSuite
          ? 'api/business-suite/wallet/balance'
          : 'api/wallet/balance';
        const response = await fetch(getApiUrl(endpoint), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;
        setFetchedBalanceRaw(result && typeof result === 'object' ? result : null);
        const parsed = parseCustodialWalletBalances(result);
        setFetchedBalances({
          xrp: Number(parsed.XRP) || 0,
          usdt: Number(parsed.USDT) || 0,
          usdc: Number(parsed.USDC) || 0,
          rlusd: Number(parsed.RLUSD) || 0,
        });
      } catch (_) {
        if (!cancelled) {
          setFetchedBalances(null);
          setFetchedBalanceRaw(null);
        }
      } finally {
        if (!cancelled) setIsFetchingBalances(false);
      }
    };

    loadBalances();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const resolvedBalanceRaw = fetchedBalanceRaw || walletBalanceRaw;
  const ratesForDisplay =
    Array.isArray(displayExchangeRates) && displayExchangeRates.length > 0
      ? displayExchangeRates
      : exchangeRates;
  const xrpUsdRate = contextXrpUsdRate ?? fetchedXrpUsdRate;
  const hasDisplayRates =
    (Array.isArray(ratesForDisplay) && ratesForDisplay.length > 0) ||
    (xrpUsdRate != null && Number(xrpUsdRate) > 0);
  const isWaitingForRates =
    !hasDisplayRates && (isLoadingExchangeRates || isFetchingLocalRates);

  const balances = useMemo(() => {
    const fromFetch = coerceTokenBalances(fetchedBalances);
    const fromProp = coerceTokenBalances(walletBalancesProp);
    const parsed = parseCustodialWalletBalances(resolvedBalanceRaw);
    const fromRaw = {
      xrp: Number(parsed.XRP) || 0,
      usdt: Number(parsed.USDT) || 0,
      usdc: Number(parsed.USDC) || 0,
      rlusd: Number(parsed.RLUSD) || 0,
    };
    if (hasAnyTokenBalance(fromFetch)) return fromFetch;
    if (hasAnyTokenBalance(fromProp)) return fromProp;
    if (hasAnyTokenBalance(fromRaw)) return fromRaw;
    return fromFetch || fromProp || fromRaw;
  }, [fetchedBalances, walletBalancesProp, resolvedBalanceRaw]);

  const trustichainAssets = useMemo(
    () =>
      TRUSTICHAIN_WALLETS.map((wallet) => {
        const amount = Number(balances[wallet.balanceKey] ?? 0);
        const usdValue = computeWalletUsdValue(
          wallet.code,
          amount,
          ratesForDisplay,
          exchangeQuoteDirection,
          xrpUsdRate,
        );
        return {
          ...wallet,
          amount,
          usdValue,
          fiatLabel: formatWalletAssetFiatLabel({
            code: wallet.code,
            amount,
            usdValue,
            displayCurrency,
            formatFromUsd,
            isLoadingRates: isWaitingForRates,
          }),
          changePercent: getChangePercentForCurrency(ratesForDisplay, wallet.code),
        };
      }),
    [
      balances,
      ratesForDisplay,
      exchangeQuoteDirection,
      xrpUsdRate,
      formatFromUsd,
      isWaitingForRates,
      displayCurrency,
    ],
  );

  const custodialAddresses = useMemo(
    () => extractWalletAddresses(resolvedBalanceRaw, walletAddress),
    [resolvedBalanceRaw, walletAddress],
  );
  const resolvedWalletAddress = custodialAddresses.xrp || String(walletAddress || '').trim();
  const hasCustodialWallet = Boolean(
    resolvedWalletAddress ||
      hasAnyTokenBalance(balances) ||
      (Array.isArray(resolvedBalanceRaw?.data?.wallets) && resolvedBalanceRaw.data.wallets.length > 0) ||
      (Array.isArray(resolvedBalanceRaw?.wallets) && resolvedBalanceRaw.wallets.length > 0),
  );

  const selectedDetailsAsset =
    trustichainAssets.find((asset) => asset.code === selectedDetailsCode) || null;

  const detailsNetworks = DEPOSIT_ADDRESS_NETWORK_KEYS[selectedDetailsCode] || [];
  const showDetailsNetworkPicker =
    selectedDetailsCode === 'USDT' || selectedDetailsCode === 'USDC';

  const detailsAddress = useMemo(() => {
    if (!selectedDetailsCode) return '';
    if (selectedDetailsCode === 'RLUSD') {
      return (custodialAddresses.rlusd || resolvedWalletAddress || '').trim();
    }
    if (selectedDetailsCode === 'XRP') {
      return resolvedWalletAddress;
    }
    const fetched = String(detailsDepositAddress || '').trim();
    if (fetched) return fetched;
    return resolveDepositAddressFromBalance(
      resolvedBalanceRaw,
      selectedDetailsCode,
      detailsNetwork,
    ).trim();
  }, [
    selectedDetailsCode,
    custodialAddresses,
    walletAddress,
    detailsDepositAddress,
    resolvedBalanceRaw,
    detailsNetwork,
  ]);

  const detailsRateLabel = useMemo(() => {
    if (!selectedDetailsCode) return '—';
    if (selectedDetailsCode === 'XRP') {
      const usdPerXrp = getUsdPerXrpFromExchangeRates(
        ratesForDisplay,
        exchangeQuoteDirection,
        xrpUsdRate,
      );
      if (usdPerXrp != null && usdPerXrp > 0) {
        return `1 XRP = ${formatFromUsd(usdPerXrp, { isLoadingRates: isWaitingForRates })}`;
      }
      return isWaitingForRates ? '1 XRP …' : '1 XRP — rate unavailable';
    }
    return `1 ${selectedDetailsCode} = ${formatFromUsd(1, { isLoadingRates: isWaitingForRates })}`;
  }, [
    selectedDetailsCode,
    ratesForDisplay,
    exchangeQuoteDirection,
    xrpUsdRate,
    formatFromUsd,
    isWaitingForRates,
  ]);

  const openWalletDetails = (code) => {
    const next = String(code || '').toUpperCase();
    if (!TRUSTICHAIN_WALLETS.some((wallet) => wallet.code === next)) return;
    setDetailsPickerOpen(false);
    setSelectedDetailsCode(next);
    setDetailsNetwork(defaultNetworkForCode(next));
  };

  const closeWalletDetails = () => {
    setDetailsPickerOpen(false);
    setSelectedDetailsCode('');
    setDetailsDepositAddress('');
    setIsLoadingDetailsAddress(false);
  };

  useEffect(() => {
    if (!isOpen || !selectedDetailsCode) {
      setDetailsDepositAddress('');
      setIsLoadingDetailsAddress(false);
      return undefined;
    }

    const code = selectedDetailsCode;
    if (code !== 'USDT' && code !== 'USDC') {
      setDetailsDepositAddress('');
      setIsLoadingDetailsAddress(false);
      return undefined;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setDetailsDepositAddress('');
      setIsLoadingDetailsAddress(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingDetailsAddress(true);
    setDetailsDepositAddress('');

    const depositUrl = getApiUrl(
      `api/wallet/deposit-address?asset=${encodeURIComponent(code)}&network=${encodeURIComponent(detailsNetwork)}`,
    );

    fetch(depositUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        const address = extractDepositAddressFromApiResponse(result);
        if (address) {
          setDetailsDepositAddress(address);
          return;
        }
        setDetailsDepositAddress(
          resolveDepositAddressFromBalance(resolvedBalanceRaw, code, detailsNetwork) || '',
        );
      })
      .catch(() => {
        if (cancelled) return;
        setDetailsDepositAddress(
          resolveDepositAddressFromBalance(resolvedBalanceRaw, code, detailsNetwork) || '',
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetailsAddress(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedDetailsCode, detailsNetwork, resolvedBalanceRaw]);

  const selectedConnected =
    connectedWallets.find((w) => w.id === selectedConnectedId) ?? connectedWallets[0] ?? null;

  const stablecoinAddressesReady = useMemo(
    () => hasStablecoinDepositAddresses(resolvedBalanceRaw),
    [resolvedBalanceRaw],
  );
  const showProvisionStablecoinButton = showProvisionButton && !stablecoinAddressesReady;
  const showLoadingAssets =
    (isLoadingWalletAddress || isFetchingBalances) && !hasAnyTokenBalance(balances);

  if (!isOpen) return null;

  const renderChange = (changePercent) => {
    if (changePercent == null || !Number.isFinite(Number(changePercent))) {
      return (
        <span className="wallets-modal-asset-change is-unavailable">
          {isWaitingForRates ? '…' : '—'}
        </span>
      );
    }
    const value = Number(changePercent);
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
                  <li key={asset.code}>
                    <button
                      type="button"
                      className="wallets-modal-asset-row"
                      onClick={() => openWalletDetails(asset.code)}
                      aria-label={`View ${asset.name} wallet details`}
                    >
                      <span className="wallets-modal-asset-icon" aria-hidden>
                        <img src={asset.iconUrl} alt="" />
                      </span>
                      <span className="wallets-modal-asset-main">
                        <span className="wallets-modal-asset-name">{asset.name}</span>
                        <span className="wallets-modal-asset-amount">
                          {formatAssetAmount(asset.amount, asset.code, asset.maxDecimals)}
                        </span>
                      </span>
                      <span className="wallets-modal-asset-value-col">
                        <span
                          className={`wallets-modal-asset-usd${
                            asset.usdValue == null &&
                            !(displayCurrency === 'XRP' && asset.code === 'XRP')
                              ? ' is-unavailable'
                              : ''
                          }`}
                        >
                          {asset.fiatLabel}
                        </span>
                        {renderChange(asset.changePercent)}
                      </span>
                    </button>
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

      {selectedDetailsAsset && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="wallet-details-modal-overlay wallets-modal-details-stack"
              onClick={closeWalletDetails}
              role="presentation"
            >
              <div
                className="wallet-details-modal"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="wallets-details-title"
              >
                <div className="wallet-details-modal-header">
                  <h2 id="wallets-details-title" className="wallet-details-modal-title">
                    Wallet Details
                  </h2>
                  <button
                    type="button"
                    className="wallet-details-close-btn"
                    onClick={closeWalletDetails}
                    aria-label="Close wallet details"
                  >
                    <X size={22} strokeWidth={2} />
                  </button>
                </div>

                <div className="wallet-details-top-card">
                  <div className="wallet-details-selector-wrap" ref={detailsPickerRef}>
                    <button
                      type="button"
                      className="wallet-details-wallet-selector"
                      onClick={() => setDetailsPickerOpen((open) => !open)}
                      aria-expanded={detailsPickerOpen}
                      aria-haspopup="listbox"
                    >
                      <div className="wallet-details-icon-wrap">
                        <img src={selectedDetailsAsset.iconUrl} alt="" />
                      </div>
                      <span className="wallet-details-selector-label">
                        {DETAILS_WALLET_NAMES[selectedDetailsAsset.code] || selectedDetailsAsset.name}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`wallet-details-selector-chevron${detailsPickerOpen ? ' is-open' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {detailsPickerOpen ? (
                      <ul className="wallet-details-wallet-picker" role="listbox">
                        {trustichainAssets.map((wallet) => {
                          const isActive = wallet.code === selectedDetailsAsset.code;
                          return (
                            <li key={wallet.code}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={isActive ? 'is-current' : undefined}
                                onClick={() => openWalletDetails(wallet.code)}
                              >
                                <span className="wallet-details-picker-icon-wrap">
                                  <img src={wallet.iconUrl} alt="" />
                                </span>
                                {DETAILS_WALLET_NAMES[wallet.code] || wallet.name}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>

                  <p
                    className={`wallet-details-total${
                      selectedDetailsAsset.usdValue == null &&
                      !(displayCurrency === 'XRP' && selectedDetailsAsset.code === 'XRP')
                        ? ' is-unavailable'
                        : ''
                    }`}
                  >
                    {formatWalletAssetFiatLabel({
                      code: selectedDetailsAsset.code,
                      amount: selectedDetailsAsset.amount,
                      usdValue: selectedDetailsAsset.usdValue,
                      displayCurrency,
                      formatFromUsd,
                      isLoadingRates: isWaitingForRates,
                    })}
                  </p>
                  <p className="wallet-details-fiat-amount">
                    {formatAssetAmount(
                      selectedDetailsAsset.amount,
                      selectedDetailsAsset.code,
                      selectedDetailsAsset.maxDecimals,
                    )}
                  </p>
                  <p className="wallet-details-exchange-caption">Exchange rate: {detailsRateLabel}</p>
                </div>

                {showDetailsNetworkPicker ? (
                  <div className="wallet-details-network-block">
                    <p className="wallet-details-network-label">Wallet Network</p>
                    <div className="wallet-details-network-segments" role="tablist">
                      {detailsNetworks.map((key) => (
                        <button
                          key={key}
                          type="button"
                          role="tab"
                          aria-selected={detailsNetwork === key}
                          className={detailsNetwork === key ? 'is-active' : undefined}
                          onClick={() => setDetailsNetwork(key)}
                        >
                          {depositAddressNetworkLabel(key)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div
                  className={`wallet-details-address-card${
                    isLoadingDetailsAddress ? ' wallet-details-address-card--pending' : ''
                  }`}
                  aria-busy={isLoadingDetailsAddress || undefined}
                >
                  <div className="wallet-details-qr-wrap">
                    {isLoadingDetailsAddress ? (
                      <div className="wallet-details-qr-skeleton" aria-hidden />
                    ) : (
                      <QRCode
                        value={detailsAddress || 'N/A'}
                        size={128}
                        bgColor="#ffffff"
                        fgColor="#111827"
                      />
                    )}
                  </div>
                  <div className="wallet-details-address-info">
                    {isLoadingDetailsAddress ? (
                      <div className="wallet-details-address-skeleton" aria-live="polite">
                        <span className="wallet-details-address-skeleton-line wallet-details-address-skeleton-line--long" />
                        <span className="wallet-details-address-skeleton-line wallet-details-address-skeleton-line--short" />
                      </div>
                    ) : (
                      <p>{detailsAddress || 'Address not available yet'}</p>
                    )}
                    <button
                      type="button"
                      className="wallet-details-copy-icon-btn"
                      onClick={async () => {
                        try {
                          if (!detailsAddress) {
                            toast.error('No wallet address available');
                            return;
                          }
                          await navigator.clipboard.writeText(detailsAddress);
                          toast.success('Address copied');
                        } catch (err) {
                          toast.error('Failed to copy address');
                        }
                      }}
                      aria-label="Copy wallet address"
                      disabled={!detailsAddress || isLoadingDetailsAddress}
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                </div>

                <div className="wallet-details-meta-list">
                  <div className="wallet-details-meta-row">
                    <span>Rate</span>
                    <strong>{detailsRateLabel}</strong>
                  </div>
                  <div className="wallet-details-meta-row">
                    <span>Wallet Address</span>
                    <strong className="wallet-details-meta-address-strong">
                      {isLoadingDetailsAddress ? '…' : formatDetailsAddressShort(detailsAddress)}
                    </strong>
                  </div>
                </div>

                <button type="button" className="wallet-details-done-btn" onClick={closeWalletDetails}>
                  Done
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </React.Fragment>
  );
};

export default PersonalWalletAddressesModal;
