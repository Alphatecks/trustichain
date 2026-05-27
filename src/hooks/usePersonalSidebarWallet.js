import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/config';
import { extractWalletAddresses, provisionUsdtUsdcDepositAddresses, STABLECOIN_DEPOSIT_PROVISIONS } from '../utils/depositAddressFlow';

/**
 * Personal custodial wallet — sidebar "View wallet", XRP/RLUSD modal, multichain provisioning.
 */
export function usePersonalSidebarWallet({ isSessionExpired = false, enabled = true } = {}) {
  const [walletAddress, setWalletAddress] = useState('');
  const [rlusdWalletAddress, setRlusdWalletAddress] = useState('');
  const [hasWallet, setHasWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isLoadingWalletAddress, setIsLoadingWalletAddress] = useState(false);
  const [isProvisioningWallets, setIsProvisioningWallets] = useState(false);

  const applyWalletFromBalanceResult = useCallback((result) => {
    const addresses = extractWalletAddresses(result);
    if (result?.success && addresses.xrp) {
      setWalletAddress(addresses.xrp);
      setRlusdWalletAddress(addresses.rlusd);
      setHasWallet(true);
      return true;
    }
    setWalletAddress('');
    setRlusdWalletAddress('');
    setHasWallet(false);
    return false;
  }, []);

  const refreshWalletFromBalance = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setHasWallet(false);
      setWalletAddress('');
      setRlusdWalletAddress('');
      return null;
    }
    const res = await fetch(getApiUrl('api/wallet/balance'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await res.json().catch(() => ({}));
    applyWalletFromBalanceResult(result);
    return result;
  }, [applyWalletFromBalanceResult, isSessionExpired]);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const load = async () => {
      setIsLoadingWalletAddress(true);
      try {
        if (cancelled) return;
        await refreshWalletFromBalance();
      } catch (_) {
        if (!cancelled) {
          setHasWallet(false);
          setWalletAddress('');
          setRlusdWalletAddress('');
        }
      } finally {
        if (!cancelled) setIsLoadingWalletAddress(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshWalletFromBalance, isSessionExpired]);

  const handleViewWalletClick = useCallback(async () => {
    if (isLoadingWalletAddress) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to view your wallet.');
      return;
    }
    if (walletAddress) {
      setShowWalletModal(true);
      return;
    }
    setIsLoadingWalletAddress(true);
    try {
      await refreshWalletFromBalance();
      setShowWalletModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load wallet.');
    } finally {
      setIsLoadingWalletAddress(false);
    }
  }, [isLoadingWalletAddress, refreshWalletFromBalance, walletAddress]);

  const handleCreateInitialWallet = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to create a wallet.');
      return false;
    }
    setIsProvisioningWallets(true);
    try {
      const response = await fetch(getApiUrl('api/wallet/create'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success) {
        const addresses = extractWalletAddresses(result);
        if (addresses.xrp) {
          setWalletAddress(addresses.xrp);
          setRlusdWalletAddress(addresses.rlusd);
          setHasWallet(true);
          toast.success(result?.message || 'Wallet created successfully');
          return true;
        }
        toast.error('Wallet was created but address is missing in the response.');
        return false;
      }
      toast.error(result?.message || 'Failed to create wallet.');
      return false;
    } catch (err) {
      console.error(err);
      toast.error('Failed to create wallet.');
      return false;
    } finally {
      setIsProvisioningWallets(false);
    }
  }, []);

  /** Provisions USDT/USDC deposit addresses via GET /api/wallet/deposit-address per network. */
  const handleProvisionOtherWalletAddresses = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to continue.');
      return;
    }
    if (!walletAddress?.trim()) {
      toast.error('Create your XRP wallet first.');
      return;
    }
    setIsProvisioningWallets(true);
    try {
      const { results, succeeded, failed } = await provisionUsdtUsdcDepositAddresses({ token });
      console.log('[Wallet] USDT/USDC deposit-address provisioning:', { results, succeeded, failed });
      await refreshWalletFromBalance();
      if (succeeded.length === STABLECOIN_DEPOSIT_PROVISIONS.length) {
        toast.success('USDT and USDC deposit addresses are ready');
        return;
      }
      if (succeeded.length > 0) {
        toast.success(`Created ${succeeded.length} of ${STABLECOIN_DEPOSIT_PROVISIONS.length} deposit addresses`);
        return;
      }
      const firstMsg =
        failed[0]?.result?.message || failed[0]?.result?.error || 'Could not create USDT/USDC deposit addresses.';
      toast.error(firstMsg);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create wallet addresses.');
    } finally {
      setIsProvisioningWallets(false);
    }
  }, [refreshWalletFromBalance, walletAddress]);

  return {
    walletAddress,
    rlusdWalletAddress,
    hasWallet,
    showWalletModal,
    setShowWalletModal,
    isLoadingWalletAddress,
    isProvisioningWallets,
    handleViewWalletClick,
    handleCreateInitialWallet,
    handleProvisionOtherWalletAddresses,
    refreshWalletFromBalance,
    setWalletAddress,
    setRlusdWalletAddress,
    setHasWallet,
  };
}
