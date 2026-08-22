import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { maskWalletAddressShort, getPayerWalletIconUrl } from './escrowPayerWallets';

const EscrowPayerWalletSelectModal = ({
  isOpen,
  wallets,
  selectedWalletId,
  onClose,
  onConfirm,
}) => {
  const [pending, setPending] = useState(selectedWalletId);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPending(selectedWalletId || '');
    }
  }, [isOpen, selectedWalletId]);

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

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`create-escrow-payer-wallet-modal-overlay${entered ? ' is-visible' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`create-escrow-payer-wallet-modal${entered ? ' is-visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-escrow-payer-wallet-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-escrow-payer-wallet-modal-header">
          <div className="create-escrow-payer-wallet-modal-header-leading">
            <span className="create-escrow-payer-wallet-modal-accent" aria-hidden />
            <h2 id="create-escrow-payer-wallet-modal-title">Select Wallet</h2>
          </div>
          <button
            type="button"
            className="create-escrow-payer-wallet-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <p className="create-escrow-payer-wallet-modal-subtitle">
          Choose the wallet you want to escrow funds from.
        </p>

        {wallets.length === 0 ? (
          <p className="create-escrow-payer-wallet-modal-empty">
            Create your TrustiChain wallet or connect Xaman/MetaMask to pay with TrustiChain.
          </p>
        ) : (
          <div className="create-escrow-payer-wallet-modal-list" role="listbox" aria-label="Wallets">
            {wallets.map((wallet) => {
              const isActive = pending === wallet.id;
              return (
                <button
                  key={wallet.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`create-escrow-payer-wallet-modal-row${isActive ? ' is-selected' : ''}`}
                  onClick={() => setPending(wallet.id)}
                >
                  <span
                    className={`create-escrow-payer-wallet-modal-icon${
                      wallet.source === 'metamask' ? ' is-metamask' : ''
                    }`}
                  >
                    <img src={getPayerWalletIconUrl(wallet)} alt="" />
                  </span>
                  <span className="create-escrow-payer-wallet-modal-row-body">
                    <span className="create-escrow-payer-wallet-modal-row-title">{wallet.label}</span>
                    <span className="create-escrow-payer-wallet-modal-row-meta">
                      {wallet.network} · {maskWalletAddressShort(wallet.address)}
                    </span>
                  </span>
                  {wallet.balanceLabel ? (
                    <span className="create-escrow-payer-wallet-modal-row-balance">
                      {wallet.balanceLabel}
                    </span>
                  ) : null}
                  {isActive ? (
                    <Check size={18} className="create-escrow-payer-wallet-modal-row-check" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="create-escrow-payer-wallet-modal-footer">
          <button
            type="button"
            className="create-escrow-payer-wallet-modal-select-btn"
            disabled={!pending || wallets.length === 0}
            onClick={() => {
              if (!pending) return;
              onConfirm(pending);
            }}
          >
            Select
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default EscrowPayerWalletSelectModal;
