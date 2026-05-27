import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  DollarSign,
  Building2,
  CreditCard,
  Users,
  FileCheck,
  FileText,
  Code,
  Box,
  Link,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Repeat
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import SupplierContract from './SupplierContract';
import FundSupplyAccountModal from '../../../components/FundSupplyAccountModal';
import WithdrawModal from '../../../components/WithdrawModal';
import CreateNewSupplierModal from '../../../components/CreateNewSupplierModal';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import '../dashboard/Dashboard.css';
import logo from '../../../assets/images/icons/logo.png';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Invoice', icon: FileText, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck }
];

const normalizeCompanyLogoUrl = (data) => {
  const raw = data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

const extractBusinessSupplierId = (kycData) => {
  if (!kycData || typeof kycData !== 'object') return '';
  const candidates = [
    kycData.supplierId,
    kycData.supplier_id,
    kycData.supplierReferenceId,
    kycData.supplierReference,
    kycData.referenceId,
    kycData.businessSupplierId,
  ];
  const found = candidates.find((value) => typeof value === 'string' && value.trim());
  return found ? found.trim() : '';
};

const SupplierContractPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);

  const [accountType, setAccountType] = useState(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Business Suite';
  });
  const [showBalance, setShowBalance] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [walletBalances, setWalletBalances] = useState(null);
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [totalEscrowedAmount, setTotalEscrowedAmount] = useState(45280.00);
  const [isLoadingTotalEscrowed, setIsLoadingTotalEscrowed] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);
  const [isLoadingWalletAddress, setIsLoadingWalletAddress] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showFundSupplyAccountModal, setShowFundSupplyAccountModal] = useState(false);
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateNewSupplierModal, setShowCreateNewSupplierModal] = useState(false);
  const [businessKycComplete, setBusinessKycComplete] = useState(() => {
    const stored = localStorage.getItem('businessKycComplete');
    return stored ? JSON.parse(stored) : false;
  });
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [businessSupplierId, setBusinessSupplierId] = useState('');
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
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

  const formattedToday = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    setIsLoadingBusinessKyc(true);
    fetch(getApiUrl('api/business-suite/kyc'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          const kycData = result.data;
          setBusinessCompanyName(kycData.companyName || kycData?.companyName || '');
          setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
          setBusinessSupplierId(extractBusinessSupplierId(kycData));
          const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
          const status = statusRaw.replace(/_/g, ' ').toLowerCase();
          const verifiedStatuses = ['verified', 'approved', 'complete'];
          setBusinessKycComplete(verifiedStatuses.includes(status));
        }
      })
      .catch(() => { if (!cancelled) { setBusinessCompanyName(''); setBusinessCompanyLogoUrl(''); setBusinessSupplierId(''); } })
      .finally(() => { if (!cancelled) setIsLoadingBusinessKyc(false); });
    return () => { cancelled = true; };
  }, [accountType]);

  // Fetch supplier details (api/business-suite/suppliers/details)
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

  // Map API supplier details to UI shape: { id, escrowId?, contractId?, progress, dueDate?, percentage?, amount } (prefer escrowId for APIs that expect UUID)
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

  // Helper function to extract balance from different API response structures
  const getBalanceValue = (data, currency = 'usd') => {
    if (!data) return null;
    
    const currencyKey = currency.toLowerCase();
    const currencyUpper = currency.toUpperCase();
    
    if (data.balance && typeof data.balance === 'object') {
      const value = data.balance[currencyKey] || data.balance[currencyUpper] || null;
      if (value !== null) return Number(value);
    }
    
    const balanceObj = data.totalBalance || data.balanceData || data.balances || {};
    if (balanceObj && typeof balanceObj === 'object') {
      const value = balanceObj[currencyKey] || balanceObj[currencyUpper] || null;
      if (value !== null) return Number(value);
    }
    
    const value = data[`total${currencyUpper}`] || 
                  data[`balance${currencyUpper}`] ||
                  data[`${currencyKey}Balance`] ||
                  null;
    
    return value !== null ? Number(value) : null;
  };

  // Helper function to get exchange rate between two currencies
  const getExchangeRate = (fromCurrency, toCurrency) => {
    if (!exchangeRates || !Array.isArray(exchangeRates)) return null;
    if (fromCurrency === toCurrency) return 1;
    
    const directRate = exchangeRates.find(rate => 
      rate.from === fromCurrency && rate.to === toCurrency
    );
    if (directRate) return directRate.rate;

    const reverseRate = exchangeRates.find(rate => 
      rate.from === toCurrency && rate.to === fromCurrency
    );
    if (reverseRate) return 1 / reverseRate.rate;

    return null;
  };

  const handleCreateWallet = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      const apiUrl = getApiUrl('api/wallet/create');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Create Wallet API response:', data);
      if (response.ok && data.success) {
        setHasWallet(true);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  // On load, check if user has a wallet so we show View wallet vs Create wallet correctly
  useEffect(() => {
    const fetchWallets = async () => {
      setIsLoadingWalletAddress(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasWallet(false);
          setIsLoadingWalletAddress(false);
          return;
        }
        const res = await fetch(`${getApiUrl('api/wallet/all')}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await res.json();
        if (Array.isArray(result.data) && result.data.length > 0 && result.data[0].xrpl_address) {
          setHasWallet(true);
        } else {
          setHasWallet(false);
        }
      } catch (err) {
        setHasWallet(false);
      } finally {
        setIsLoadingWalletAddress(false);
      }
    };
    fetchWallets();
  }, []);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        if (isSessionExpired) {
          setDashboardData(null);
          setIsLoadingDashboard(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingDashboard(false);
          return;
        }

        const apiUrl = getApiUrl('api/dashboard/summary');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const normalizedData = { ...result.data };
            // Balance for this page comes from business-suite wallet (see effect below).
            // Preserve existing balance when applying summary so we don't overwrite it
            // when this request completes after the wallet/balance request (race fix).
            delete normalizedData.balance;
            setDashboardData((prev) => ({
              ...normalizedData,
              balance: prev?.balance,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboardSummary();
  }, [isSessionExpired]);

  // Supplier contract page balance = business suite wallet balance
  useEffect(() => {
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    fetch(getApiUrl('api/business-suite/wallet/balance'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        let balances = null;
        if (result?.success && result?.data?.balance) {
          balances = result.data.balance;
        } else if (result?.success && result?.data) {
          const d = result.data;
          if (d.xrp !== undefined || d.usdt !== undefined || d.usdc !== undefined || d.usd !== undefined) {
            balances = {
              xrp: d.xrp ?? d.XRP ?? 0,
              usd: d.usd ?? d.USD ?? 0,
              usdt: d.usdt ?? d.USDT ?? 0,
              usdc: d.usdc ?? d.USDC ?? 0,
              rippleUsd: d.rippleUsd ?? d.xrpusd ?? 0,
            };
          }
        } else if (result?.success && Array.isArray(result?.data?.wallets)) {
          balances = { xrp: 0, usdt: 0, usdc: 0, rippleUsd: 0 };
          result.data.wallets.forEach((w) => {
            const cur = (w.currency || w.code || '').toLowerCase();
            const bal = Number(w.balance ?? w.amount ?? 0);
            if (cur === 'xrp') balances.xrp = bal;
            if (cur === 'usdt') balances.usdt = bal;
            if (cur === 'usdc') balances.usdc = bal;
          });
        } else if (result?.balance) {
          balances = result.balance;
        }
        if (balances) {
          const usd =
            Number(balances.usd ?? balances.USD ?? 0) ||
            Number(balances.rippleUsd ?? balances.xrpusd ?? 0) ||
            Number(balances.usdt ?? balances.USDT ?? 0) ||
            Number(balances.usdc ?? balances.USDC ?? 0);
          const xrp = Number(balances.xrp ?? balances.XRP ?? 0);
          setDashboardData((prev) => ({
            ...(prev || {}),
            balance: { usd, xrp },
          }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSessionExpired]);

  // View New Supply Contract (supplier): GET for-supplier
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

  // View Supply Status (contractor): GET for-contractor
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

  // Supplier transaction history
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('');
        setUserInitials('');
        setUserRole('');
        setUserAvatar(null);
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data) {
            const data = result.data;
            const fullName =
              data.fullName ||
              [data.firstName, data.lastName].filter(Boolean).join(' ') ||
              data.name ||
              '';

            if (fullName && typeof fullName === 'string') {
              setUserFullName(fullName);
            }

            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = '';
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
              } else if (nameParts.length === 1) {
                initials = nameParts[0].charAt(0).toUpperCase();
              }
            }
            
            setUserInitials(initials);
            const role = data.role || data.userType || data.accountType || '';
            setUserRole(role);
            setUserAvatar(getProfileAvatarUrl(data));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingUserProfile(false);
      }
    };

    fetchUserProfile();
  }, [isSessionExpired]);

  // Update totalEscrowedAmount from dashboard data if available
  useEffect(() => {
    if (!isLoadingDashboard && dashboardData) {
      // You can update this from actual dashboard data if available
      // For now, keeping the default value
      setIsLoadingTotalEscrowed(false);
    }
  }, [dashboardData, isLoadingDashboard]);

  return (
    <div className="dashboard supplier-contract-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Business Suite</p>
          <nav className="sidebar-nav">
            {businessSuiteNav.map((item) => {
              const Icon = item.icon;
              const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                               (item.label === 'Payroll' && (location.pathname === '/payroll' || location.pathname.startsWith('/payroll/'))) ||
                               (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                               (item.label === 'Invoice' && location.pathname === '/invoice') ||
                               (item.label === 'Transactions' && location.pathname === '/transactions') ||
                               (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')));
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                } else if (item.label === 'Payroll') {
                  navigate('/payroll');
                } else if (item.label === 'Supplier Contract') {
                  navigate('/supplier-contract');
                } else if (item.label === 'Invoice') {
                  navigate('/invoice');
                } else if (item.label === 'Transactions') {
                  navigate('/transactions', { state: { accountType: 'Business Suite' } });
                } else if (item.label === 'Dispute') {
                  navigate('/business-dispute');
                } else if (item.label === 'Compliance') {
                  toast('Compliance workspace coming soon');
                }
              };
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Developers Tool</p>
          <nav className="sidebar-nav">
            {developersNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === 'Api Keys' && location.pathname === '/api-keys';
              const handleDevelopersNavClick = () => {
                if (item.label === 'Api Keys') {
                  navigate('/api-keys');
                }
              };
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleDevelopersNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} type="button" className="sidebar-nav-item">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-bottom-section">
          <div className="sidebar-help-card">
            <div className="help-icon-large">
              <HelpCircle size={24} />
            </div>
            <h3>Help Center</h3>
            <p>Having trouble in Trustichain? Please contact us</p>
            <button type="button" className="help-cta">
              Contact us
            </button>
          </div>

          <div className="sidebar-trustiscore">
            <span className="trustiscore-label">Trustiscore</span>
            <span className="trustiscore-badge">{trustiscoreBadgeText}</span>
          </div>

          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-info">
            <p className="header-date">{formattedToday}</p>
            <h1>Welcome Back !</h1>
          </div>

          <div className="header-search-group">
            <label className="header-search">
              <input type="text" placeholder="Search" />
            </label>
            <span className="search-divider" aria-hidden="true" />
            <button type="button" className="search-icon-btn">
              <Search size={18} />
            </button>
          </div>

          <div className="header-actions">
            <div className="account-type-buttons">
              <button
                type="button"
                className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('Personal');
                  localStorage.setItem('dashboard_account_type', 'Personal');
                  navigate('/dashboard');
                }}
              >
                Personal
              </button>
              <button
                type="button"
                className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('Business Suite');
                  localStorage.setItem('dashboard_account_type', 'Business Suite');
                }}
              >
                Business Suite
              </button>
            </div>
            {businessKycComplete && (
              <button
                type="button"
                className="create-wallet-btn"
                onClick={() => {
                  if (isLoadingWalletAddress) return;
                  if (hasWallet) setShowWalletModal(true);
                  else handleCreateWallet();
                }}
                disabled={isLoadingWalletAddress}
              >
                {isLoadingWalletAddress ? 'Loading...' : hasWallet ? 'View wallet' : 'Create wallet'}
              </button>
            )}
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <HeaderProfileAvatarNav>
                {accountType === 'Business Suite' ? (
                  businessCompanyLogoUrl ? (
                    <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} className="user-avatar-img" />
                  ) : isLoadingBusinessKyc ? (
                    <LoadingIndicator size="sm" />
                  ) : (
                    businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—'
                  )
                ) : userAvatar ? (
                  <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
                ) : (
                  userInitials
                )}
                <HeaderProfileVerifyBadge show={accountType === 'Business Suite' ? businessKycComplete : true} />
              </HeaderProfileAvatarNav>
            </div>
          </div>
        </header>

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
          supplierDetails={supplierDetailsForUI}
          isLoadingSupplierDetails={isLoadingSupplierDetails}
          supplyContractsForSupplier={supplyContractsForSupplier}
          isLoadingSupplyContractsForSupplier={isLoadingSupplyContractsForSupplier}
          supplyContractsForContractor={supplyContractsForContractor}
          isLoadingSupplyContractsForContractor={isLoadingSupplyContractsForContractor}
          onRefetchSupplyContractsForSupplier={() => {
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
          }}
          onRefetchSupplyContractsForContractor={() => {
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
          }}
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
        />
      </main>

      <FundSupplyAccountModal
        isOpen={showFundSupplyAccountModal}
        onCancel={() => setShowFundSupplyAccountModal(false)}
        onSuccess={(data) => {
          console.log('Fund supply account:', data);
          // Handle the transfer logic here
          setShowFundSupplyAccountModal(false);
        }}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onCancel={() => setShowWithdrawModal(false)}
        onSuccess={(data) => {
          console.log('Withdraw:', data);
          // Handle the withdraw logic here
          setShowWithdrawModal(false);
        }}
      />

      <CreateNewSupplierModal
        isOpen={showCreateNewSupplierModal}
        onCancel={() => setShowCreateNewSupplierModal(false)}
        onSuccess={(data) => {
          console.log('Add supplier contract:', data);
          setShowCreateNewSupplierModal(false);
          // Refetch supplier details so the new supplier appears in the list
          const token = localStorage.getItem('token');
          if (token) {
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
          }
        }}
      />

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="supplier-contract-notifications-title"
      />
    </div>
  );
};

export default SupplierContractPage;
