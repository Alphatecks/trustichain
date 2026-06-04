import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingIndicator from '../LoadingIndicator';
import { buildWalletAddressRows } from '../../utils/depositAddressFlow';
import '../../pages/dashboard/dashboard/Dashboard.css';

const PersonalWalletAddressesModal = ({
  isOpen,
  onClose,
  walletAddress,
  rlusdWalletAddress,
  addressRows: addressRowsProp,
  walletBalanceRaw,
  isProvisioningWallets,
  onCreateInitialWallet,
  onProvisionOtherAddresses,
  showProvisionButton = true,
}) => {
  const addressRows = useMemo(() => {
    if (Array.isArray(addressRowsProp) && addressRowsProp.length > 0) {
      return addressRowsProp;
    }
    if (walletBalanceRaw) {
      const fromApi = buildWalletAddressRows(walletBalanceRaw);
      if (fromApi.length > 0) return fromApi;
    }
    const fallback = buildWalletAddressRows({
      success: true,
      data: {
        xrplAddress: walletAddress,
        rlusdAddress: rlusdWalletAddress || walletAddress,
      },
    });
    return fallback;
  }, [addressRowsProp, walletBalanceRaw, walletAddress, rlusdWalletAddress]);

  if (!isOpen) return null;

  const hasXrpAddress = Boolean(walletAddress?.trim());
  const hasAnyAddress = addressRows.length > 0;

  const copyAddress = async (value, label) => {
    const t = String(value || '').trim();
    if (!t) {
      toast.error('No address to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(t);
      toast.success(`${label} copied`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="wallet-modal wallet-modal--all-addresses"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-wallet-modal-title"
      >
        <div className="wallet-modal-header">
          <h2 id="personal-wallet-modal-title">Your Wallet</h2>
          <button type="button" className="wallet-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="wallet-modal-body wallet-modal-body--scroll">
          {!hasAnyAddress ? (
            <p className="wallet-modal-empty-hint">
              No wallet yet. Create your XRP wallet to get started, then provision USDT and USDC deposit addresses.
            </p>
          ) : null}

          {addressRows.map((row) => (
            <div key={row.id} className="wallet-modal-address-group">
              <p className="wallet-modal-label">{row.label}</p>
              <div className="wallet-modal-address-row">
                <div className="wallet-modal-address-box">{row.address}</div>
                <button
                  type="button"
                  className="wallet-modal-copy-btn"
                  onClick={() => copyAddress(row.address, row.label)}
                >
                  Copy
                </button>
              </div>
            </div>
          ))}

          {showProvisionButton ? (
            <div className="wallet-modal-actions">
              {!hasXrpAddress ? (
                <button
                  type="button"
                  className="wallet-modal-copy-btn wallet-modal-action-btn"
                  disabled={isProvisioningWallets}
                  onClick={onCreateInitialWallet}
                >
                  {isProvisioningWallets ? 'Creating…' : 'Create wallet'}
                </button>
              ) : (
                <button
                  type="button"
                  className="wallet-modal-copy-btn wallet-modal-action-btn"
                  disabled={isProvisioningWallets}
                  onClick={onProvisionOtherAddresses}
                >
                  {isProvisioningWallets ? (
                    <span className="wallet-modal-action-loading">
                      <LoadingIndicator size="sm" />
                      Creating addresses…
                    </span>
                  ) : (
                    'Create USDT & USDC addresses'
                  )}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PersonalWalletAddressesModal;
