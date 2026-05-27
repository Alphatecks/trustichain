import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../../../context/SessionContext';
import { getApiUrl } from '../../../utils/config';
import SupplierContract from './SupplierContract';
import FundSupplyAccountModal from '../../../components/FundSupplyAccountModal';
import WithdrawModal from '../../../components/WithdrawModal';
import CreateNewSupplierModal from '../../../components/CreateNewSupplierModal';

/**
 * Content-only view for Supplier Contract. Rendered inside Dashboard layout
 * when pathname is /supplier-contract. Receives layout props from Dashboard
 * (same as BusinessDashboard); manages supplier-specific state and fetches.
 */
const SupplierContractContent = ({
  dashboardData,
  isLoadingDashboard,
  exchangeRates,
  isLoadingRates,
  walletBalances,
  isLoadingWalletBalances,
  userFullName,
  userInitials,
  userRole,
  userAvatar,
  isLoadingUserProfile,
  showBalance,
  setShowBalance,
  showNotificationModal,
  setShowNotificationModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  hasWallet,
  isLoadingWalletAddress,
  setShowWalletModal,
  handleCreateWallet,
  setShowFundWalletModal,
  setShowWithdrawWalletModal,
  accountType,
  setAccountType,
  setIsSwitchingAccountType,
  setSwitchMessage,
  businessKycComplete,
  businessCompanyName,
  businessCompanyLogoUrl,
  businessSupplierId = '',
  isLoadingBusinessKyc,
  navigate,
  location,
  getBalanceValue,
  getExchangeRate,
  totalEscrowedAmount = 0,
  isLoadingTotalEscrowed = false,
}) => {
  const { isSessionExpired } = useSession();

  const [showCreateNewSupplierModal, setShowCreateNewSupplierModal] = useState(false);
  const [showFundSupplyAccountModal, setShowFundSupplyAccountModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [supplierDetailsItems, setSupplierDetailsItems] = useState([]);
  const [isLoadingSupplierDetails, setIsLoadingSupplierDetails] = useState(true);
  const [supplyContractsForSupplier, setSupplyContractsForSupplier] = useState([]);
  const [isLoadingSupplyContractsForSupplier, setIsLoadingSupplyContractsForSupplier] = useState(false);
  const [supplyContractsForContractor, setSupplyContractsForContractor] = useState([]);
  const [isLoadingSupplyContractsForContractor, setIsLoadingSupplyContractsForContractor] = useState(false);
  const [supplierTransactionItems, setSupplierTransactionItems] = useState([]);
  const [supplierTransactionTotal, setSupplierTransactionTotal] = useState(0);
  const [supplierTransactionPage, setSupplierTransactionPage] = useState(1);
  const [supplierTransactionPageSize] = useState(20);
  const [supplierTransactionTotalPages, setSupplierTransactionTotalPages] = useState(0);
  const [isLoadingSupplierTransactions, setIsLoadingSupplierTransactions] = useState(true);
  const [transactionHistoryMonth, setTransactionHistoryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transactionHistoryStatus, setTransactionHistoryStatus] = useState('');
  const [supplyContractOverview, setSupplyContractOverview] = useState(null);
  const [isLoadingSupplyContractOverview, setIsLoadingSupplyContractOverview] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setSupplyContractOverview(null);
      setIsLoadingSupplyContractOverview(false);
      return;
    }
    let cancelled = false;
    setIsLoadingSupplyContractOverview(true);
    fetch(getApiUrl('api/business-suite/supply-contracts/overview'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          setSupplyContractOverview(result.data);
        } else {
          setSupplyContractOverview(null);
        }
      })
      .catch(() => { if (!cancelled) setSupplyContractOverview(null); })
      .finally(() => { if (!cancelled) setIsLoadingSupplyContractOverview(false); });
    return () => { cancelled = true; };
  }, [isSessionExpired]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setSupplierDetailsItems([]);
      setIsLoadingSupplierDetails(false);
      return;
    }
    let cancelled = false;
    setIsLoadingSupplierDetails(true);
    fetch(getApiUrl('api/business-suite/suppliers/details'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        setSupplierDetailsItems(items);
      })
      .catch(() => { if (!cancelled) setSupplierDetailsItems([]); })
      .finally(() => { if (!cancelled) setIsLoadingSupplierDetails(false); });
    return () => { cancelled = true; };
  }, [isSessionExpired]);

  const supplierDetailsForUI = useMemo(() => {
    return supplierDetailsItems.map((item) => {
      const id = item.contractId || item.escrowId || item.supplierId || item.id || '—';
      const progress = item.progressPercentage != null ? Number(item.progressPercentage) : 0;
      let dueDate = null;
      let percentage = null;
      const statusDetail = item.statusDetail || '';
      if (item.dueDate) {
        try {
          const d = new Date(item.dueDate);
          const day = d.getDate();
          const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
          const month = d.toLocaleDateString('en-GB', { month: 'short' });
          const year = String(d.getFullYear()).slice(-2);
          dueDate = `${day}${suffix} ${month} ${year}`;
        } catch (_) {
          dueDate = statusDetail.includes('Due date') ? statusDetail.replace(/^Due date:\s*/i, '').trim() : null;
        }
      } else if (statusDetail.includes('Due date')) {
        dueDate = statusDetail.replace(/^Due date:\s*/i, '').trim();
      } else if (/^\d+%$/.test(statusDetail.trim())) {
        percentage = statusDetail.trim();
      }
      const amount = item.amount != null
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(item.amount))
        : '—';
      const contractName = item.contractName ?? item.contractTitle ?? item.supplierName ?? `Contract #${id}`;
      const supplierBusinessName =
        item.supplierName ?? item.businessName ?? item.companyName ?? item.contractorName ?? '—';
      const buyer = item.buyerName ?? item.buyer ?? '—';
      const currency = item.currency ?? 'USDT';
      const escrowStatus = item.escrowStatus ?? item.status ?? 'Funds Locked in Escrow';
      const evidence = item.evidence ?? item.supplierEvidence ?? item.documents ?? [];
      return {
        id,
        escrowId: item.escrowId,
        contractId: item.contractId,
        progress,
        dueDate,
        percentage,
        amount,
        contractName,
        supplierBusinessName,
        buyer,
        currency,
        escrowStatus,
        evidence,
      };
    });
  }, [supplierDetailsItems]);

  useEffect(() => {
    if (isSessionExpired) {
      setSupplyContractsForSupplier([]);
      setIsLoadingSupplyContractsForSupplier(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingSupplyContractsForSupplier(false);
      return;
    }
    let cancelled = false;
    setIsLoadingSupplyContractsForSupplier(true);
    fetch(getApiUrl('api/business-suite/supply-contracts/for-supplier'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        setSupplyContractsForSupplier(items);
      })
      .catch(() => { if (!cancelled) setSupplyContractsForSupplier([]); })
      .finally(() => { if (!cancelled) setIsLoadingSupplyContractsForSupplier(false); });
    return () => { cancelled = true; };
  }, [isSessionExpired]);

  useEffect(() => {
    if (isSessionExpired) {
      setSupplyContractsForContractor([]);
      setIsLoadingSupplyContractsForContractor(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingSupplyContractsForContractor(false);
      return;
    }
    let cancelled = false;
    setIsLoadingSupplyContractsForContractor(true);
    fetch(getApiUrl('api/business-suite/supply-contracts/for-contractor'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        setSupplyContractsForContractor(items);
      })
      .catch(() => { if (!cancelled) setSupplyContractsForContractor([]); })
      .finally(() => { if (!cancelled) setIsLoadingSupplyContractsForContractor(false); });
    return () => { cancelled = true; };
  }, [isSessionExpired]);

  useEffect(() => {
    if (isSessionExpired) {
      setSupplierTransactionItems([]);
      setIsLoadingSupplierTransactions(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingSupplierTransactions(false);
      return;
    }
    let cancelled = false;
    setIsLoadingSupplierTransactions(true);
    const params = new URLSearchParams({
      page: String(supplierTransactionPage),
      pageSize: String(supplierTransactionPageSize),
      month: transactionHistoryMonth,
    });
    if (transactionHistoryStatus) params.set('status', transactionHistoryStatus);
    fetch(getApiUrl(`api/business-suite/suppliers/transactions?${params}`), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          const { items = [], total = 0, totalPages = 0 } = result.data;
          setSupplierTransactionItems(items);
          setSupplierTransactionTotal(total);
          setSupplierTransactionTotalPages(totalPages);
        } else {
          setSupplierTransactionItems([]);
          setSupplierTransactionTotal(0);
          setSupplierTransactionTotalPages(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSupplierTransactionItems([]);
          setSupplierTransactionTotal(0);
          setSupplierTransactionTotalPages(0);
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingSupplierTransactions(false); });
    return () => { cancelled = true; };
  }, [isSessionExpired, supplierTransactionPage, supplierTransactionPageSize, transactionHistoryMonth, transactionHistoryStatus]);

  const refetchSupplyContractsForSupplier = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingSupplyContractsForSupplier(true);
    fetch(getApiUrl('api/business-suite/supply-contracts/for-supplier'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        setSupplyContractsForSupplier(items);
      })
      .catch(() => setSupplyContractsForSupplier([]))
      .finally(() => setIsLoadingSupplyContractsForSupplier(false));
  };

  const refetchSupplyContractsForContractor = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingSupplyContractsForContractor(true);
    fetch(getApiUrl('api/business-suite/supply-contracts/for-contractor'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        setSupplyContractsForContractor(items);
      })
      .catch(() => setSupplyContractsForContractor([]))
      .finally(() => setIsLoadingSupplyContractsForContractor(false));
  };

  const refetchSupplierDetails = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(getApiUrl('api/business-suite/suppliers/details'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        setSupplierDetailsItems(items);
      })
      .catch(() => {});
    refetchSupplyContractsForSupplier();
    refetchSupplyContractsForContractor();
    fetch(getApiUrl('api/business-suite/supply-contracts/overview'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && result?.data) setSupplyContractOverview(result.data);
      })
      .catch(() => {});
  };

  return (
    <>
      <SupplierContract
        dashboardData={dashboardData}
        isLoadingDashboard={isLoadingDashboard}
        exchangeRates={exchangeRates}
        isLoadingRates={isLoadingRates}
        walletBalances={walletBalances}
        isLoadingWalletBalances={isLoadingWalletBalances}
        userFullName={userFullName}
        userInitials={userInitials}
        userRole={userRole}
        userAvatar={userAvatar}
        isLoadingUserProfile={isLoadingUserProfile}
        showBalance={showBalance}
        setShowBalance={setShowBalance}
        showNotificationModal={showNotificationModal}
        setShowNotificationModal={setShowNotificationModal}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        hasWallet={hasWallet}
        isLoadingWalletAddress={isLoadingWalletAddress}
        setShowWalletModal={setShowWalletModal}
        handleCreateWallet={handleCreateWallet}
        setShowFundWalletModal={setShowFundWalletModal}
        setShowFundSupplyAccountModal={setShowFundSupplyAccountModal}
        setShowWithdrawWalletModal={setShowWithdrawWalletModal}
        setShowWithdrawModal={setShowWithdrawModal}
        setShowCreateNewSupplierModal={setShowCreateNewSupplierModal}
        accountType={accountType}
        setAccountType={setAccountType}
        setIsSwitchingAccountType={setIsSwitchingAccountType}
        setSwitchMessage={setSwitchMessage}
        businessKycComplete={businessKycComplete}
        businessCompanyName={businessCompanyName}
        businessCompanyLogoUrl={businessCompanyLogoUrl}
        businessSupplierId={businessSupplierId}
        isLoadingBusinessKyc={isLoadingBusinessKyc}
        navigate={navigate}
        location={location}
        getBalanceValue={getBalanceValue}
        getExchangeRate={getExchangeRate}
        totalEscrowedAmount={totalEscrowedAmount}
        isLoadingTotalEscrowed={isLoadingTotalEscrowed}
        supplyContractOverview={supplyContractOverview}
        isLoadingSupplyContractOverview={isLoadingSupplyContractOverview}
        supplierDetails={supplierDetailsForUI}
        isLoadingSupplierDetails={isLoadingSupplierDetails}
        supplyContractsForSupplier={supplyContractsForSupplier}
        isLoadingSupplyContractsForSupplier={isLoadingSupplyContractsForSupplier}
        supplyContractsForContractor={supplyContractsForContractor}
        isLoadingSupplyContractsForContractor={isLoadingSupplyContractsForContractor}
        supplierTransactions={supplierTransactionItems}
        isLoadingSupplierTransactions={isLoadingSupplierTransactions}
        supplierTransactionsPagination={{
          total: supplierTransactionTotal,
          page: supplierTransactionPage,
          pageSize: supplierTransactionPageSize,
          totalPages: supplierTransactionTotalPages,
        }}
        onTransactionPageChange={setSupplierTransactionPage}
        transactionHistoryMonth={transactionHistoryMonth}
        onTransactionMonthChange={setTransactionHistoryMonth}
        transactionHistoryStatus={transactionHistoryStatus}
        onTransactionStatusChange={setTransactionHistoryStatus}
        onRefetchSupplyContractsForSupplier={refetchSupplyContractsForSupplier}
        onRefetchSupplyContractsForContractor={refetchSupplyContractsForContractor}
      />

      <FundSupplyAccountModal
        isOpen={showFundSupplyAccountModal}
        onCancel={() => setShowFundSupplyAccountModal(false)}
        onSuccess={() => setShowFundSupplyAccountModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onCancel={() => setShowWithdrawModal(false)}
        onSuccess={() => setShowWithdrawModal(false)}
      />

      <CreateNewSupplierModal
        isOpen={showCreateNewSupplierModal}
        onCancel={() => setShowCreateNewSupplierModal(false)}
        onSuccess={() => {
          setShowCreateNewSupplierModal(false);
          refetchSupplierDetails();
        }}
      />
    </>
  );
};

export default SupplierContractContent;
