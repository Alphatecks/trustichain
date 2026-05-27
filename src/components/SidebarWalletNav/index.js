import React from 'react';
import LoadingIndicator from '../LoadingIndicator';

const SidebarWalletUserIcon = () => (
  <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.5 21.5c-1.834-2.5-5.333-4-8.5-4s-6.666 1.5-8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Desktop sidebar wallet row — always "View wallet" for personal accounts. */
export const SidebarWalletSection = ({
  isLoading,
  disabled,
  onViewWallet,
  variant = 'desktop',
}) => {
  if (variant === 'mobile') {
    return (
      <div className="mobile-sidebar-section">
        <p className="mobile-sidebar-section-label">Wallet</p>
        <nav className="mobile-sidebar-nav">
          <button
            type="button"
            className={`mobile-sidebar-nav-item ${disabled ? 'disabled' : ''}`}
            onClick={onViewWallet}
            disabled={disabled || isLoading}
          >
            <span>{isLoading ? 'Loading...' : 'View wallet'}</span>
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <p className="sidebar-section-label">Wallet</p>
      <div className="sidebar-wallet" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isLoading ? (
          <div className="sidebar-wallet-btn" style={{ opacity: 0.8, cursor: 'default' }} aria-label="Loading wallet">
            <LoadingIndicator size="sm" />
            <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
          </div>
        ) : (
          <button
            type="button"
            className={`sidebar-wallet-btn${disabled ? ' disabled' : ''}`}
            onClick={onViewWallet}
            disabled={disabled}
            aria-label="View wallet"
          >
            <SidebarWalletUserIcon />
            <span style={{ marginLeft: '0.5rem' }}>View wallet</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarWalletSection;
