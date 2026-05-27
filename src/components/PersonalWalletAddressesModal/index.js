import React from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingIndicator from '../LoadingIndicator';
import '../../pages/dashboard/dashboard/Dashboard.css';

const PersonalWalletAddressesModal = ({
  isOpen,
  onClose,
  walletAddress,
  rlusdWalletAddress,
  isProvisioningWallets,
  onCreateInitialWallet,
  onProvisionOtherAddresses,
}) => {
  if (!isOpen) return null;

  const rlusdDisplay = rlusdWalletAddress || walletAddress;
  const hasXrpAddress = Boolean(walletAddress?.trim());

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
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="personal-wallet-modal-title">
        <div className="wallet-modal-header">
          <h2 id="personal-wallet-modal-title">Your Wallet</h2>
          <button type="button" className="wallet-modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="wallet-modal-body">
          {!hasXrpAddress ? (
            <p className="wallet-modal-empty-hint" style={{ marginBottom: '1rem', color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
              No wallet yet. Create your XRP wallet to get started, then provision USDT and USDC deposit addresses.
            </p>
          ) : null}

          <p className="wallet-modal-label">XRP Address</p>
          <div className="wallet-modal-address-row">
            <div className="wallet-modal-address-box">
              {walletAddress || '—'}
            </div>
            <button
              type="button"
              className="wallet-modal-copy-btn"
              disabled={!hasXrpAddress}
              onClick={() => copyAddress(walletAddress, 'XRP address')}
            >
              Copy
            </button>
          </div>

          <p className="wallet-modal-label" style={{ marginTop: '1rem' }}>RLUSD Address</p>
          <div className="wallet-modal-address-row">
            <div className="wallet-modal-address-box">
              {rlusdDisplay || '—'}
            </div>
            <button
              type="button"
              className="wallet-modal-copy-btn"
              disabled={!rlusdDisplay}
              onClick={() => copyAddress(rlusdDisplay, 'RLUSD address')}
            >
              Copy
            </button>
          </div>

          <div className="wallet-modal-actions" style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {!hasXrpAddress ? (
              <button
                type="button"
                className="wallet-modal-copy-btn"
                style={{ width: '100%', minHeight: '44px' }}
                disabled={isProvisioningWallets}
                onClick={onCreateInitialWallet}
              >
                {isProvisioningWallets ? 'Creating…' : 'Create wallet'}
              </button>
            ) : (
              <button
                type="button"
                className="wallet-modal-copy-btn"
                style={{ width: '100%', minHeight: '44px' }}
                disabled={isProvisioningWallets}
                onClick={onProvisionOtherAddresses}
              >
                {isProvisioningWallets ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LoadingIndicator size="sm" />
                    Creating addresses…
                  </span>
                ) : (
                  'Create USDT & USDC addresses'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalWalletAddressesModal;
