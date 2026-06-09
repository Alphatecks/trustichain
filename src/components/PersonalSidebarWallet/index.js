import React, { createContext, useContext } from 'react';
import { usePersonalSidebarWallet } from '../../hooks/usePersonalSidebarWallet';
import SidebarWalletSection from '../SidebarWalletNav';
import PersonalWalletAddressesModal from '../PersonalWalletAddressesModal';

const PersonalSidebarWalletContext = createContext(null);

export function PersonalSidebarWalletProvider({
  isSessionExpired = false,
  enabled = true,
  children,
}) {
  const wallet = usePersonalSidebarWallet({ isSessionExpired, enabled });

  return (
    <PersonalSidebarWalletContext.Provider value={enabled ? wallet : null}>
      {children}
      {enabled ? <PersonalSidebarWalletModal wallet={wallet} /> : null}
    </PersonalSidebarWalletContext.Provider>
  );
}

export function PersonalSidebarWalletNav({
  wallet: walletProp,
  variant = 'desktop',
  onBeforeViewWallet,
  disabled = false,
}) {
  const walletFromContext = useContext(PersonalSidebarWalletContext);
  const wallet = walletProp ?? walletFromContext;
  if (!wallet) return null;

  return (
    <SidebarWalletSection
      variant={variant}
      isLoading={wallet.isLoadingWalletAddress}
      disabled={disabled}
      onViewWallet={() => {
        onBeforeViewWallet?.();
        wallet.handleViewWalletClick();
      }}
    />
  );
}

export function PersonalSidebarWalletModal({ wallet }) {
  if (!wallet) return null;

  return (
    <PersonalWalletAddressesModal
      isOpen={wallet.showWalletModal}
      onClose={() => wallet.setShowWalletModal(false)}
      walletAddress={wallet.walletAddress}
      rlusdWalletAddress={wallet.rlusdWalletAddress}
      addressRows={wallet.walletAddressRows}
      walletBalanceRaw={wallet.walletBalanceRaw}
      isProvisioningWallets={wallet.isProvisioningWallets}
      onCreateInitialWallet={async () => {
        const ok = await wallet.handleCreateInitialWallet();
        if (ok) wallet.setShowWalletModal(true);
      }}
      onProvisionOtherAddresses={wallet.handleProvisionOtherWalletAddresses}
    />
  );
}
