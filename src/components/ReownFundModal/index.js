import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronDown, Loader, CheckCircle, AlertCircle, Wallet, Copy } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  DEPOSIT_ADDRESS_CURRENCIES,
  DEPOSIT_ADDRESS_CURRENCY_ICON,
  depositAddressCurrencyLabel,
  depositAddressNetworkLabel,
  getDepositNetworksForCurrency,
} from '../../utils/depositAddressFlow';
import {
  fetchDepositAddress,
  getInjectedMetaMaskProvider,
  isReownEvmDepositPair,
  runReownEvmDeposit,
} from '../../utils/reownDepositFlow';
import { isWalletConnectUserRejected as isWcRejected } from '../../utils/walletConnectProvider';
import metamaskIcon from '../../assets/images/icons/metamask-fox.svg';
import rlusdLogo from '../../assets/images/icons/rlusd-logo.svg';
import './index.css';

const currencyIcon = (code) =>
  code === 'RLUSD' ? rlusdLogo : DEPOSIT_ADDRESS_CURRENCY_ICON[code];

const FUND_CURRENCIES = DEPOSIT_ADDRESS_CURRENCIES;
const WALLETCONNECT_ICON =
  'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg';

const phaseLabel = (phase, extra = {}) => {
  switch (phase) {
    case 'preparing':
      return 'Preparing custodial wallet…';
    case 'loading_config':
      return 'Loading chain & token config…';
    case 'resolving_address':
      return 'Resolving deposit address…';
    case 'connecting_wallet':
      return 'Connect your wallet and approve the transfer…';
    case 'notifying':
      return `Notifying deposit${extra.txHash ? ` (${String(extra.txHash).slice(0, 10)}…)` : ''}…`;
    case 'notify_failed':
      return 'Notify failed — still checking credit status…';
    case 'polling':
      if (extra.status === 'credited') return 'Deposit credited';
      if (extra.status === 'failed') return 'Deposit failed';
      return extra.txHash
        ? `Waiting for credit… (${String(extra.txHash).slice(0, 10)}…)`
        : 'Waiting for credit…';
    case 'done':
      return extra.status === 'credited'
        ? 'Deposit credited'
        : extra.status === 'failed'
          ? 'Deposit failed'
          : 'Submitted — credit may still be pending';
    default:
      return 'Processing…';
  }
};

const ReownFundModal = ({ isOpen, onClose, onCredited }) => {
  const [currency, setCurrency] = useState('USDT');
  const [network, setNetwork] = useState('ERC20');
  const [amount, setAmount] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [walletSource, setWalletSource] = useState('metamask');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState(null);
  const [phaseExtra, setPhaseExtra] = useState({});
  const [resultStatus, setResultStatus] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const abortRef = useRef(null);

  const networks = getDepositNetworksForCurrency(currency);
  const isEvmTransfer = isReownEvmDepositPair(currency, network);

  useEffect(() => {
    const nextNetworks = getDepositNetworksForCurrency(currency);
    if (!nextNetworks.includes(network)) {
      setNetwork(nextNetworks[0] || 'XRPL');
    }
  }, [currency, network]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const metamaskInstalled = Boolean(getInjectedMetaMaskProvider());
    setHasMetaMask(metamaskInstalled);
    setWalletSource(metamaskInstalled ? 'metamask' : 'walletconnect');

    const handleClickOutside = (event) => {
      if (!event.target.closest('.reown-fund-dropdown-wrap')) {
        setCurrencyOpen(false);
        setNetworkOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isEvmTransfer) {
      setDepositAddress('');
      setIsLoadingAddress(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingAddress(true);
    setDepositAddress('');

    fetchDepositAddress(currency, network)
      .then(({ address }) => {
        if (!cancelled) setDepositAddress(address || '');
      })
      .catch((error) => {
        if (!cancelled) {
          setDepositAddress('');
          toast.error(error?.message || 'Could not load deposit address');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAddress(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isEvmTransfer, currency, network]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const resetForm = () => {
    setAmount('');
    setPhase(null);
    setPhaseExtra({});
    setResultStatus(null);
    setTxHash('');
    setIsSubmitting(false);
    setDepositAddress('');
  };

  const handleClose = () => {
    if (isSubmitting && resultStatus !== 'credited' && resultStatus !== 'failed') {
      return;
    }
    abortRef.current?.abort();
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!isEvmTransfer) {
      if (!depositAddress) {
        toast.error('Deposit address is not ready yet');
        return;
      }
      try {
        await navigator.clipboard.writeText(depositAddress);
        toast.success('Deposit address copied');
      } catch (_) {
        toast.error('Failed to copy address');
      }
      return;
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      toast.error('Enter a valid amount greater than 0');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSubmitting(true);
    setResultStatus(null);
    setTxHash('');
    setPhase('preparing');
    setPhaseExtra({});

    try {
      const result = await runReownEvmDeposit({
        asset: currency,
        network,
        amount: amountNum,
        walletSource,
        signal: controller.signal,
        onPhase: (nextPhase, extra = {}) => {
          setPhase(nextPhase);
          setPhaseExtra(extra);
          if (extra.txHash) setTxHash(extra.txHash);
        },
      });

      setTxHash(result.txHash || '');
      setResultStatus(result.status);
      setPhase('done');
      setPhaseExtra(result);

      if (result.status === 'credited') {
        toast.success(`${currency} deposit credited`);
        if (typeof onCredited === 'function') onCredited(result);
      } else if (result.status === 'failed') {
        toast.error('Deposit failed on-chain or was rejected');
      } else {
        toast('Transfer submitted. Credit is still pending — check balance shortly.');
        if (typeof onCredited === 'function') onCredited(result);
      }
    } catch (error) {
      if (isWcRejected(error) || error?.code === 4001) {
        toast.error('Cancelled in wallet');
      } else if (String(error?.message || '').includes('cancelled')) {
        toast.error('Deposit cancelled');
      } else {
        console.error('[ReownFundModal]', error);
        const msg = String(error?.message || 'Failed to fund with wallet');
        toast.error(msg.length > 180 ? `${msg.slice(0, 180)}…` : msg);
      }
      setResultStatus('error');
      setPhase(null);
    } finally {
      setIsSubmitting(false);
      abortRef.current = null;
    }
  };

  if (!isOpen) return null;

  const showProgress = Boolean(phase) || Boolean(resultStatus);
  const canClose =
    !isSubmitting || resultStatus === 'credited' || resultStatus === 'failed' || resultStatus === 'error';

  return (
    <div className="notification-modal-overlay reown-fund-overlay" onClick={handleClose}>
      <div
        className="notification-modal fund-wallet-modal reown-fund-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-modal-header">
          <div className="notification-header-content">
            <div className="notification-header-accent" />
            <h2>Fund with Wallet</h2>
          </div>
          <button
            type="button"
            className="notification-close-btn"
            onClick={handleClose}
            aria-label="Close"
            disabled={!canClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="fund-wallet-form reown-fund-form">
          <p className="reown-fund-intro">
            {isEvmTransfer
              ? 'Send USDT/USDC from MetaMask or WalletConnect to your TrustiChain deposit address.'
              : `Send ${currency} on ${depositAddressNetworkLabel(network)} to your TrustiChain address. MetaMask cannot send XRPL assets — use this address from XAMAN or another ${currency} wallet.`}
          </p>

          {isEvmTransfer ? (
            <div className="form-group">
              <span className="fund-wallet-transfer-label">Wallet</span>
              <div className="reown-fund-wallet-options">
              <button
                type="button"
                className={`reown-fund-wallet-option${walletSource === 'metamask' ? ' is-active' : ''}`}
                onClick={() => setWalletSource('metamask')}
                disabled={isSubmitting || !hasMetaMask}
                title={
                  hasMetaMask
                    ? 'Connect with MetaMask browser extension'
                    : 'MetaMask extension not detected — install it or use WalletConnect'
                }
              >
                <img src={metamaskIcon} alt="" />
                <span>
                  MetaMask
                  {!hasMetaMask ? <small>Not installed</small> : null}
                </span>
              </button>
              <button
                type="button"
                className={`reown-fund-wallet-option${walletSource === 'walletconnect' ? ' is-active' : ''}`}
                onClick={() => setWalletSource('walletconnect')}
                disabled={isSubmitting}
              >
                <img src={WALLETCONNECT_ICON} alt="" />
                <span>
                  WalletConnect
                  <small>Mobile &amp; other wallets</small>
                </span>
              </button>
              </div>
            </div>
          ) : null}

          {isEvmTransfer ? (
          <div className="form-group">
            <label htmlFor="reown-fund-amount">Amount</label>
            <input
              id="reown-fund-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required={isEvmTransfer}
              disabled={isSubmitting}
            />
          </div>
          ) : null}

          <div className="form-group">
            <span className="fund-wallet-transfer-label" id="reown-fund-currency-label">
              Currency
            </span>
            <div
              className={`reown-fund-dropdown-wrap${currencyOpen ? ' is-open' : ''}`}
            >
              <button
                type="button"
                className="reown-fund-dropdown-trigger"
                onClick={() => {
                  setNetworkOpen(false);
                  setCurrencyOpen((open) => !open);
                }}
                aria-expanded={currencyOpen}
                aria-labelledby="reown-fund-currency-label"
                disabled={isSubmitting}
              >
                <div className="fund-wallet-transfer-currency-badge is-stablecoin">
                  <img
                    src={currencyIcon(currency)}
                    alt=""
                  />
                </div>
                <span>{depositAddressCurrencyLabel(currency)}</span>
                <ChevronDown size={16} aria-hidden />
              </button>
              {currencyOpen && (
                <div className="reown-fund-dropdown-menu" role="listbox">
                  {FUND_CURRENCIES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="option"
                      aria-selected={currency === code}
                      className={`reown-fund-dropdown-option${currency === code ? ' is-active' : ''}`}
                      onClick={() => {
                        setCurrency(code);
                        setCurrencyOpen(false);
                      }}
                    >
                      <div className="fund-wallet-transfer-currency-badge is-stablecoin">
                        <img src={currencyIcon(code)} alt="" />
                      </div>
                      <span>{depositAddressCurrencyLabel(code)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <span className="fund-wallet-transfer-label" id="reown-fund-network-label">
              Network
            </span>
            <div className={`reown-fund-dropdown-wrap${networkOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="reown-fund-dropdown-trigger"
                onClick={() => {
                  setCurrencyOpen(false);
                  setNetworkOpen((open) => !open);
                }}
                aria-expanded={networkOpen}
                aria-labelledby="reown-fund-network-label"
                disabled={isSubmitting}
              >
                <span>{depositAddressNetworkLabel(network)}</span>
                <ChevronDown size={16} aria-hidden />
              </button>
              {networkOpen && (
                <div className="reown-fund-dropdown-menu" role="listbox">
                  {networks.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="option"
                      aria-selected={network === key}
                      className={`reown-fund-dropdown-option${network === key ? ' is-active' : ''}`}
                      onClick={() => {
                        setNetwork(key);
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

          {!isEvmTransfer ? (
            <div className="reown-fund-address-card">
              <div className="reown-fund-qr">
                {isLoadingAddress ? (
                  <Loader size={28} className="reown-fund-spin" />
                ) : depositAddress ? (
                  <QRCode value={depositAddress} size={128} bgColor="#ffffff" fgColor="#111827" />
                ) : (
                  <span className="reown-fund-address-empty">Address unavailable</span>
                )}
              </div>
              <div className="reown-fund-address-copy">
                <p>
                  {isLoadingAddress
                    ? 'Loading deposit address…'
                    : depositAddress || 'Create your TrustiChain wallet first, then try again.'}
                </p>
                <button
                  type="button"
                  className="reown-fund-copy-btn"
                  disabled={!depositAddress || isLoadingAddress}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(depositAddress);
                      toast.success('Address copied');
                    } catch (_) {
                      toast.error('Failed to copy address');
                    }
                  }}
                  aria-label="Copy deposit address"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          ) : null}

          {showProgress && (
            <div
              className={`reown-fund-status reown-fund-status--${
                resultStatus === 'credited'
                  ? 'success'
                  : resultStatus === 'failed' || resultStatus === 'error'
                    ? 'error'
                    : 'pending'
              }`}
            >
              {resultStatus === 'credited' ? (
                <CheckCircle size={18} />
              ) : resultStatus === 'failed' || resultStatus === 'error' ? (
                <AlertCircle size={18} />
              ) : (
                <Loader size={18} className="reown-fund-spin" />
              )}
              <div className="reown-fund-status-text">
                <div>{phaseLabel(phase || 'polling', { ...phaseExtra, status: resultStatus })}</div>
                {txHash ? (
                  <div className="reown-fund-txhash">{txHash}</div>
                ) : null}
              </div>
            </div>
          )}

          <div className="fund-wallet-actions">
            <button
              type="button"
              className="fund-wallet-btn fund-wallet-btn-secondary"
              onClick={handleClose}
              disabled={!canClose}
            >
              {resultStatus === 'credited' || resultStatus === 'pending' ? 'Close' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="fund-wallet-btn fund-wallet-btn-primary"
              disabled={
                isSubmitting ||
                (isEvmTransfer && walletSource === 'metamask' && !hasMetaMask) ||
                (!isEvmTransfer && (isLoadingAddress || !depositAddress))
              }
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="reown-fund-spin" />
                  Processing…
                </>
              ) : !isEvmTransfer ? (
                <>
                  <Copy size={16} />
                  Copy address
                </>
              ) : (
                <>
                  <Wallet size={16} />
                  {walletSource === 'metamask' ? 'Send with MetaMask' : 'Connect & Send'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReownFundModal;
