import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  CreditCard,
  Briefcase,
  Settings,
  Search,
  Bell,
  ArrowRight,
  Plus,
  DollarSign,
  Building2,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  X,
  Menu,
  ChevronRight,
  ChevronDown,
  Filter,
  TrendingUp,
  Clock,
  FileText,
  KeyRound,
  Download,
  Pencil,
  Calendar,
  User,
  ArrowLeft,
  Check,
  Wallet,
  Coins,
  Info,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Payroll.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import AddPayrollModal from '../../../components/AddPayrollModal';
import TransactionDetailModal from './TransactionDetailModal';

const INITIAL_ADD_PAYROLL_FORM = {
  name: '',
  currency: '',
  defaultSalaryType: '',
  salaryAmount: '',
  disbursementMode: 'auto',
  allowanceAllocation: false,
  addAmount: '',
  jobTitle: '',
  email: '',
  employmentType: 'fulltime',
  status: '',
  dateJoined: '',
  companyName: 'Angelo Group',
  companyEmail: 'angelogroup@trustichain.org',
  cycleDate: 'Monthly',
  startDate: '3rd Dec 2025',
  endDate: '25 Dec 2026',
};

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings }
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

const extractXrpHashes = (data) => {
  if (!data || typeof data !== 'object') return [];
  return Array.from(new Set([
    ...(Array.isArray(data.xrpHashes) ? data.xrpHashes : []),
    ...(Array.isArray(data.xrpHashesCreated) ? data.xrpHashesCreated : []),
    ...(Array.isArray(data.xrpHashs) ? data.xrpHashs : []),
    data.xrpHash,
    data.xrp_hash,
    data.xrplEscrowId,
    data.xrpl_escrow_id,
  ].filter((value) => typeof value === 'string' && value.trim()))).map((value) => value.trim());
};

const Payroll = () => {
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [businessKycComplete, setBusinessKycComplete] = useState(true);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [monthlyFilter, setMonthlyFilter] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLoadingTransactionHistory, setIsLoadingTransactionHistory] = useState(true);
  const [transactionHistoryPage, setTransactionHistoryPage] = useState(1);
  const [transactionHistoryTotalPages, setTransactionHistoryTotalPages] = useState(1);
  const [transactionHistoryMonth, setTransactionHistoryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrolls, setPayrolls] = useState([]);
  const [isLoadingPayrolls, setIsLoadingPayrolls] = useState(true);
  const [payrollsPage, setPayrollsPage] = useState(1);
  const [payrollsRefreshKey, setPayrollsRefreshKey] = useState(0);
  const [releasingPayrollId, setReleasingPayrollId] = useState(null);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [isLoadingPayrollSummary, setIsLoadingPayrollSummary] = useState(true);
  const [payrollsTotalPages, setPayrollsTotalPages] = useState(1);
  const [payrollToggles, setPayrollToggles] = useState({});
  const [freezeAutoRelease, setFreezeAutoRelease] = useState({});
  const [showAddPayrollModal, setShowAddPayrollModal] = useState(false);
  const [showDeletePayrollModal, setShowDeletePayrollModal] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState(null);
  const [deletingPayrollId, setDeletingPayrollId] = useState(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);
  const [transactionDetailData, setTransactionDetailData] = useState(null);
  const [isLoadingTransactionDetail, setIsLoadingTransactionDetail] = useState(false);
  const [selectedPayrollDetail, setSelectedPayrollDetail] = useState(null);
  const [mobilePayrollDetail, setMobilePayrollDetail] = useState(null);
  const [isLoadingMobilePayrollDetail, setIsLoadingMobilePayrollDetail] = useState(false);
  const [mobilePayrollTransactions, setMobilePayrollTransactions] = useState([]);
  const [isLoadingMobilePayrollTransactions, setIsLoadingMobilePayrollTransactions] = useState(false);
  const [mobileTransactionMonth, setMobileTransactionMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showChangeReleaseDateModal, setShowChangeReleaseDateModal] = useState(false);
  const [showAddPayrollModalMobile, setShowAddPayrollModalMobile] = useState(false);
  const [fundAmount, setFundAmount] = useState('24,567.89');
  const [addPayrollStep, setAddPayrollStep] = useState(1);
  const [addPayrollForm, setAddPayrollForm] = useState(() => ({ ...INITIAL_ADD_PAYROLL_FORM }));
  const [teamMemberStep, setTeamMemberStep] = useState(1);
  const [teamMemberForm, setTeamMemberForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    address: '',
    gender: '',
    jobTitle: '',
    employmentType: 'fulltime',
    status: '',
    dateJoined: '',
    disbursementMode: 'auto',
    defaultSalaryType: '',
    currency: '',
    salaryAmount: '',
    accountType: 'bank',
    walletType: '',
    walletAddress: '',
    network: '',
    currency: '',
    bankName: '',
    accountNumber: ''
  });
  const mobilePayrollXrpHashes = useMemo(() => extractXrpHashes(mobilePayrollDetail), [mobilePayrollDetail]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingPayrolls(false);
      return;
    }
    setIsLoadingPayrolls(true);
    fetch(getApiUrl(`api/business-suite/payrolls?page=${payrollsPage}&pageSize=20`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && Array.isArray(result?.data?.items)) {
          setPayrolls(result.data.items);
          setPayrollsTotalPages(result?.data?.totalPages ?? 1);
          const toggles = {};
          const freeze = {};
          result.data.items.forEach((p) => {
            toggles[p.id] = p.status === 'scheduled' ? 'scheduled' : 'active';
            freeze[p.id] = !!p.freezeAutoRelease;
          });
          setPayrollToggles(toggles);
          setFreezeAutoRelease(freeze);
        } else {
          setPayrolls([]);
        }
      })
      .catch((err) => {
        console.error('Payrolls list error:', err);
        setPayrolls([]);
      })
      .finally(() => setIsLoadingPayrolls(false));
  }, [payrollsPage, payrollsRefreshKey]);

  useEffect(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') {
      setAccountType(stored);
    }
  }, []);

  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    setIsLoadingBusinessKyc(true);
    fetch(getApiUrl('api/business-suite/kyc'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          const kycData = result.data;
          setBusinessCompanyName(kycData.companyName || kycData?.companyName || '');
          setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
          const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
          const status = statusRaw.replace(/_/g, ' ').toLowerCase();
          const verifiedStatuses = ['verified', 'approved', 'complete'];
          setBusinessKycComplete(verifiedStatuses.includes(status));
        }
      })
      .catch(() => { if (!cancelled) { setBusinessCompanyName(''); setBusinessCompanyLogoUrl(''); } })
      .finally(() => { if (!cancelled) setIsLoadingBusinessKyc(false); });
    return () => { cancelled = true; };
  }, [accountType]);

  useEffect(() => {
    if (isSessionExpired) {
      setUserFullName('');
      setUserInitials('');
      setUserRole('');
      setUserAvatar(null);
      setIsLoadingUserProfile(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingUserProfile(false);
      return;
    }
    setIsLoadingUserProfile(true);
    fetch(getApiUrl('api/user/profile'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && result?.data) {
          const data = result.data;
          const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || '';
          if (fullName) setUserFullName(fullName);
          const firstName = data.firstName || '';
          const lastName = data.lastName || '';
          let initials = '';
          if (firstName && lastName) {
            initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
          } else if (fullName) {
            const nameParts = fullName.trim().split(/\s+/);
            if (nameParts.length >= 2) {
              initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
            } else if (nameParts.length === 1) {
              initials = nameParts[0].charAt(0).toUpperCase();
            }
          }
          setUserInitials(initials);
          setUserRole(data.role || data.userType || data.accountType || '');
          setUserAvatar(getProfileAvatarUrl(data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  const formattedToday = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingPayrollSummary(false);
      return;
    }
    setIsLoadingPayrollSummary(true);
    fetch(getApiUrl('api/business-suite/payrolls/summary'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && result?.data) {
          setPayrollSummary(result.data);
        } else {
          setPayrollSummary(null);
        }
      })
      .catch((err) => {
        console.error('Payroll summary error:', err);
        setPayrollSummary(null);
      })
      .finally(() => setIsLoadingPayrollSummary(false));
  }, []);

  const formatSummaryEscrowed = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n)));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingTransactionHistory(false);
      return;
    }
    setIsLoadingTransactionHistory(true);
    const month = transactionHistoryMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    fetch(getApiUrl(`api/business-suite/payrolls/transactions?page=${transactionHistoryPage}&pageSize=20&month=${month}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && Array.isArray(result?.data?.items)) {
          setTransactionHistory(result.data.items);
          setTransactionHistoryTotalPages(result?.data?.totalPages ?? 1);
        } else {
          setTransactionHistory([]);
        }
      })
      .catch((err) => {
        console.error('Transaction history error:', err);
        setTransactionHistory([]);
      })
      .finally(() => setIsLoadingTransactionHistory(false));
  }, [transactionHistoryPage, transactionHistoryMonth]);

  useEffect(() => {
    const id = selectedPayrollDetail?.id;
    if (!id) {
      setMobilePayrollDetail(null);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingMobilePayrollDetail(true);
    setMobilePayrollDetail(null);
    fetch(getApiUrl(`api/business-suite/payrolls/${id}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        console.error('PAYROLL_DETAIL_RESPONSE (list selection):', result);
        if (result?.success && result?.data) {
          setMobilePayrollDetail(result.data);
        } else {
          setMobilePayrollDetail(null);
        }
      })
      .catch((err) => {
        console.error('Mobile payroll detail error:', err);
        setMobilePayrollDetail(null);
      })
      .finally(() => setIsLoadingMobilePayrollDetail(false));
  }, [selectedPayrollDetail?.id]);

  useEffect(() => {
    if (!selectedPayrollDetail?.id) {
      setMobilePayrollTransactions([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoadingMobilePayrollTransactions(true);
    const month = mobileTransactionMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    fetch(getApiUrl(`api/business-suite/payrolls/transactions?page=1&pageSize=20&month=${month}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && Array.isArray(result?.data?.items)) {
          const items = result.data.items;
          const payrollId = selectedPayrollDetail.id;
          const filtered = items.filter((t) => String(t.payrollId || t.payroll_id || '') === String(payrollId));
          setMobilePayrollTransactions(filtered.length ? filtered : items);
        } else {
          setMobilePayrollTransactions([]);
        }
      })
      .catch((err) => {
        console.error('Mobile payroll transactions error:', err);
        setMobilePayrollTransactions([]);
      })
      .finally(() => setIsLoadingMobilePayrollTransactions(false));
  }, [selectedPayrollDetail?.id, mobileTransactionMonth]);

  const formatUsd = (n) =>
    n == null || Number.isNaN(Number(n))
      ? '—'
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(n));

  const formatTransactionDate = (item) => {
    const raw = item?.createdAt ?? item?.transactionDate ?? item?.date ?? item?.created_at;
    if (!raw) return '—';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTransactionAmount = (item) => {
    const hasXrp = item.amountXrp != null && !Number.isNaN(Number(item.amountXrp));
    const usd = item.amountUsd != null && !Number.isNaN(Number(item.amountUsd))
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(item.amountUsd))
      : null;
    if (hasXrp && usd) return `${Number(item.amountXrp)} XRP (${usd})`;
    if (hasXrp) return `${Number(item.amountXrp)} XRP`;
    return usd || '—';
  };

  const handleViewTransaction = (itemId) => {
    if (!itemId) return;
    setTransactionDetailOpen(true);
    setIsLoadingTransactionDetail(true);
    setTransactionDetailData(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingTransactionDetail(false);
      return;
    }
    fetch(getApiUrl(`api/business-suite/payrolls/transactions/${itemId}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        console.error('PAYROLL_TRANSACTION_DETAIL_RESPONSE:', result);
        if (result?.success && result?.data) {
          setTransactionDetailData(result.data);
        } else {
          setTransactionDetailData(null);
        }
      })
      .catch((err) => {
        console.error('Transaction detail error:', err);
        setTransactionDetailData(null);
      })
      .finally(() => setIsLoadingTransactionDetail(false));
  };

  const handleCloseTransactionDetail = () => {
    setTransactionDetailOpen(false);
    setTransactionDetailData(null);
  };

  const handleRequestDeletePayroll = (payroll) => {
    if (!payroll?.id) return;
    setPayrollToDelete(payroll);
    setShowDeletePayrollModal(true);
  };

  const handleConfirmDeletePayroll = async () => {
    const payrollId = payrollToDelete?.id;
    if (!payrollId) return;
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    setDeletingPayrollId(payrollId);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/payrolls/${payrollId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await res.json().catch(() => ({}));
      if (!result?.success) {
        throw new Error(result?.message || 'Failed to delete payroll');
      }
      setPayrolls((prev) => prev.filter((item) => item.id !== payrollId));
      if (selectedPayrollDetail?.id === payrollId) setSelectedPayrollDetail(null);
      if (mobilePayrollDetail?.id === payrollId) setMobilePayrollDetail(null);
      setShowDeletePayrollModal(false);
      setPayrollToDelete(null);
      setPayrollsRefreshKey((k) => k + 1);
      toast.success('Payroll deleted');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete payroll');
    } finally {
      setDeletingPayrollId(null);
    }
  };

  const buildCreatePayrollPayload = (data) => {
    const teamName = data.teamName || data.companyName || '';
    return {
      name: data.name || teamName || 'New Payroll',
      teamName,
      companyName: data.companyName || teamName || '',
      companyEmail: data.companyEmail || '',
      payrollCycle: data.payrollCycle || 'Weekly',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      releaseDate: data.releaseDate || data.endDate || '',
      items: Array.isArray(data.items)
        ? data.items.map((item) => ({
            counterpartyId: item.counterpartyId,
            amountUsd: typeof item.amountUsd === 'number' ? item.amountUsd : parseFloat(item.amountUsd) || 0,
          }))
        : [],
      createEscrows: true,
    };
  };

  const checkEscrowEligibilityForCounterparty = async (token, counterpartyId) => {
    const url = getApiUrl(`api/business-suite/payrolls/escrow-check?counterpartyId=${encodeURIComponent(counterpartyId)}`);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result?.success || !result?.data) {
      throw new Error(result?.message || 'Unable to run deterministic XRPL escrow check.');
    }
    return result.data;
  };

  const runDeterministicEscrowChecks = async (token, payload) => {
    const uniqueCounterpartyIds = Array.from(
      new Set((Array.isArray(payload?.items) ? payload.items : [])
        .map((item) => item?.counterpartyId)
        .filter(Boolean))
    );
    if (uniqueCounterpartyIds.length === 0) return;

    const results = await Promise.all(
      uniqueCounterpartyIds.map(async (counterpartyId) => {
        const data = await checkEscrowEligibilityForCounterparty(token, counterpartyId);
        return { counterpartyId, ...data };
      })
    );

    const blocked = results.find((item) => item?.canCreateEscrow === false);
    if (blocked) {
      const reason = blocked.reason || 'Destination account is not eligible for payroll escrow.';
      const reasonCode = blocked.reasonCode ? ` (${blocked.reasonCode})` : '';
      throw new Error(`${reason}${reasonCode}`);
    }
  };

  const handleCreatePayroll = async (formData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');
    const payload = buildCreatePayrollPayload(formData);
    await runDeterministicEscrowChecks(token, payload);
    const res = await fetch(getApiUrl('api/business-suite/payrolls'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!result?.success) throw new Error(result?.message || 'Failed to create payroll');
    setPayrollsRefreshKey((k) => k + 1);
  };

  const buildMobileAddPayrollPayload = () => ({
    name: addPayrollForm.name.trim() || addPayrollForm.companyName || 'New Payroll',
    companyName: addPayrollForm.companyName,
    companyEmail: addPayrollForm.companyEmail,
    payrollCycle: addPayrollForm.cycleDate || 'Monthly',
    payrollAmount: addPayrollForm.salaryAmount || '0',
    startDate: addPayrollForm.startDate,
    endDate: addPayrollForm.endDate,
    releaseDate: addPayrollForm.endDate,
    items: [],
  });

  const closeAddPayrollModalMobile = () => {
    setShowAddPayrollModalMobile(false);
    setAddPayrollStep(1);
    setAddPayrollForm({ ...INITIAL_ADD_PAYROLL_FORM });
  };

  const handleReleasePayroll = (payrollId) => {
    if (!payrollId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setReleasingPayrollId(payrollId);
    fetch(getApiUrl(`api/business-suite/payrolls/${payrollId}/release`), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        console.log('Payroll release response:', result);
        if (result?.success) {
          const newReleaseHashes = extractXrpHashes(result?.data);
          if (newReleaseHashes.length > 0) {
            setMobilePayrollDetail((prev) => {
              if (!prev || prev.id !== payrollId) return prev;
              const existingHashes = extractXrpHashes(prev);
              const mergedHashes = Array.from(new Set([...existingHashes, ...newReleaseHashes]));
              return {
                ...prev,
                xrpHashes: mergedHashes,
                xrpHashesCreated: mergedHashes,
              };
            });
          }
          setPayrollsRefreshKey((k) => k + 1);
        }
      })
      .catch((err) => console.error('Release payroll error:', err))
      .finally(() => setReleasingPayrollId(null));
  };

  const toggleFreezeAutoRelease = (payrollId) => {
    const nextFreeze = !freezeAutoRelease[payrollId];
    setFreezeAutoRelease(prev => ({ ...prev, [payrollId]: nextFreeze }));
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(getApiUrl(`api/business-suite/payrolls/${payrollId}`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ freezeAutoRelease: nextFreeze }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (!result?.success) {
          setFreezeAutoRelease(prev => ({ ...prev, [payrollId]: !nextFreeze }));
        }
      })
      .catch((err) => {
        console.error('Update payroll error:', err);
        setFreezeAutoRelease(prev => ({ ...prev, [payrollId]: !nextFreeze }));
      });
  };


  return (
    <div className="dashboard payroll-dashboard">
      {/* Mobile Dashboard */}
      <div className="mobile-dashboard">
        {/* Mobile Header */}
        {!selectedPayrollDetail && (
          <div className="mobile-dashboard-header">
          <div className="mobile-header-left">
            <div className="mobile-user-avatar">
              {accountType === 'Business Suite' ? (
                businessCompanyLogoUrl ? (
                  <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} />
                ) : isLoadingBusinessKyc ? (
                  <LoadingIndicator size="sm" />
                ) : (
                  businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—'
                )
              ) : userAvatar ? (
                <img src={userAvatar} alt={userFullName} />
              ) : (
                userInitials
              )}
            </div>
            <div className="mobile-user-info">
              <span className="mobile-user-name">
                {accountType === 'Business Suite' ? (
                  isLoadingBusinessKyc || !businessCompanyName ? <LoadingIndicator size="sm" /> : businessCompanyName
                ) : (
                  isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName
                )}
                <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
              </span>
              <span className="mobile-user-role">
                {accountType === 'Business Suite' ? 'Business' : (isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userRole)}
              </span>
            </div>
          </div>
          <div className="mobile-header-right">
            <button type="button" className="mobile-header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={20} />
            </button>
            <button 
              type="button" 
              className="mobile-header-menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {!selectedPayrollDetail && isMobileMenuOpen && (
          <div 
            className="mobile-sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Notifications Dialog */}
        {showNotificationModal && (
          <>
            <div 
              className="mobile-notifications-overlay"
              onClick={() => setShowNotificationModal(false)}
            />
            <div className="mobile-notifications-dialog">
              <div className="mobile-notifications-header">
                <h2 className="mobile-notifications-title">Notifications</h2>
                <button
                  className="mobile-notifications-close"
                  onClick={() => setShowNotificationModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mobile-notifications-content">
                {/* Sample notifications */}
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">New Payroll Created</div>
                    <div className="mobile-notification-message">Your payroll "Angelo Group" has been successfully created.</div>
                    <div className="mobile-notification-time">2 hours ago</div>
                  </div>
                </div>
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">Payment Received</div>
                    <div className="mobile-notification-message">You received $5,000 in your wallet.</div>
                    <div className="mobile-notification-time">5 hours ago</div>
                  </div>
                </div>
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">Team Member Added</div>
                    <div className="mobile-notification-message">A new team member has been added to your payroll.</div>
                    <div className="mobile-notification-time">1 day ago</div>
                  </div>
                </div>
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">Release Date Updated</div>
                    <div className="mobile-notification-message">The release date for "Angelo Group" has been changed.</div>
                    <div className="mobile-notification-time">2 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Sidebar Drawer */}
        {!selectedPayrollDetail && (
          <div className={`mobile-sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div className="mobile-sidebar-branding">
              <img src={logo} alt="TrustiChain" className="mobile-sidebar-logo" />
              <div className="mobile-sidebar-branding-text">
                <span className="mobile-sidebar-title">TrustiChain</span>
                <span className="mobile-sidebar-tagline">Secure escrow platform</span>
              </div>
            </div>
            <button 
              type="button" 
              className="mobile-sidebar-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="mobile-sidebar-content">
            <div className="mobile-sidebar-section">
              <button
                type="button"
                className="account-chip-mobile"
                onClick={() => {
                  setSwitchMessage('switching to personal');
                  setIsSwitchingAccountType(true);
                  setTimeout(() => {
                    setAccountType('Personal');
                    setIsSwitchingAccountType(false);
                    navigate('/dashboard');
                  }, 1500);
                }}
              >
                <div className="account-chip-text">
                  <span className="account-label">Account</span>
                  <span className="account-type">Business Suite</span>
                </div>
                <span className="account-chip-icon">
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Business Suite</p>
              <nav className="mobile-sidebar-nav">
                {businessSuiteNav.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = !businessKycComplete;
                  const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                   (item.label === 'Payroll' && (location.pathname === '/payroll' || location.pathname.startsWith('/payroll/'))) ||
                                   (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                                   (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')));
                  const handleNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Dashboard') {
                      navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                    } else if (item.label === 'Payroll') {
                      navigate('/payroll');
                    } else if (item.label === 'Supplier Contract') {
                      navigate('/supplier-contract');
                    } else if (item.label === 'Dispute') {
                      navigate('/business-dispute');
                    }
                  };
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={handleNavClick}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {item.badge && <span className="mobile-sidebar-badge">{item.badge}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Developers Tool</p>
              <nav className="mobile-sidebar-nav">
                {developersNav.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = !businessKycComplete;
                  const handleDevelopersNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Api Keys') {
                      navigate('/api-keys');
                    } else if (item.label === 'Sand box enviroment') {
                      navigate('/sandbox-environment');
                    } else if (item.label === 'Web hook') {
                      navigate('/webhook');
                    }
                  };
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`mobile-sidebar-nav-item ${isDisabled ? 'disabled' : ''}`}
                      onClick={handleDevelopersNavClick}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Support</p>
              <nav className="mobile-sidebar-nav">
                {supportNav.map((item) => {
                  const Icon = item.icon;
                  const handleSupportNavClick = () => {
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Settings') {
                      navigate('/settings', { state: { accountType: 'Business Suite' } });
                    }
                  };
                  return (
                    <button 
                      key={item.label} 
                      type="button"
                      className="mobile-sidebar-nav-item"
                      onClick={handleSupportNavClick}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="mobile-sidebar-bottom">
            <div className="mobile-sidebar-trustiscore">
              <span className="mobile-sidebar-trustiscore-label">Active Supplier</span>
              <span className="mobile-sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
            </div>

            <button 
              type="button"
              className="mobile-sidebar-logout"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
        )}

        {/* Mobile Payroll Content - list only when no detail selected */}
        {!selectedPayrollDetail && (
        <div className="payroll-page-mobile">
          {/* Summary Cards - Horizontally Scrollable */}
          {!selectedPayrollDetail && (
            <div className="payroll-summary-cards-wrapper-mobile">
              <div className="payroll-summary-cards-mobile">
            <div className="payroll-summary-card-mobile payroll-summary-card-mobile--value-trend">
              <div className="summary-card-icon-mobile">
                <FileText size={24} />
              </div>
              <div className="summary-card-content-mobile">
                <div className="summary-card-title-mobile">Total Payroll</div>
                <div className="summary-card-value-row-mobile">
                  <div className="summary-card-value-mobile">{isLoadingPayrollSummary ? '...' : (payrollSummary?.totalPayroll ?? '—')}</div>
                  <div className="summary-card-trend-mobile positive">
                    <TrendingUp size={14} />
                    <span>+3.1%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="payroll-summary-card-mobile payroll-summary-card-mobile--value-subtitle">
              <div className="summary-card-icon-mobile">
                <Users size={24} />
              </div>
              <div className="summary-card-content-mobile">
                <div className="summary-card-title-mobile">Total Team members</div>
                <div className="summary-card-value-row-mobile">
                  <div className="summary-card-value-mobile">{isLoadingPayrollSummary ? '...' : (payrollSummary?.totalTeamMembers ?? '—')}</div>
                  <div className="summary-card-subtitle-mobile">Active members</div>
                </div>
              </div>
            </div>

            <div className="payroll-summary-card-mobile">
              <div className="summary-card-icon-mobile">
                <Clock size={24} />
              </div>
              <div className="summary-card-content-mobile">
                <div className="summary-card-title-mobile">Total Payroll Escrowed</div>
                <div className="summary-card-value-row-mobile">
                  <div className="summary-card-value-mobile">{isLoadingPayrollSummary ? '...' : formatSummaryEscrowed(payrollSummary?.totalPayrollEscrowed)}</div>
                </div>
              </div>
            </div>
          </div>
          </div>
          )}

          {/* Mobile Payroll Header */}
          {!selectedPayrollDetail && (
            <>
              <div className="payroll-section-header-mobile">
                <h2 className="payroll-section-title-mobile">Payrolls</h2>
                <button className="add-payroll-btn-mobile" onClick={() => setShowAddPayrollModalMobile(true)}>
                  <Plus size={18} />
                  <span>Add Payroll</span>
                </button>
              </div>

              {/* Payroll List - Simple Mobile View */}
              <div className="payroll-list-mobile">
                {isLoadingPayrolls ? (
                  <div className="payroll-list-item-mobile" style={{ color: 'var(--text-muted)' }}>Loading payrolls...</div>
                ) : payrolls.length === 0 ? (
                  <div className="payroll-list-item-mobile" style={{ color: 'var(--text-muted)' }}>No payrolls yet</div>
                ) : (
                  payrolls.map((payroll) => (
                    <div 
                      key={payroll.id} 
                      className="payroll-list-item-mobile"
                      onClick={() => setSelectedPayrollDetail(payroll)}
                    >
                      <div className="payroll-list-item-content-mobile">
                        <h3 className="payroll-list-item-title-mobile">{payroll.name}</h3>
                        <p className="payroll-list-item-subtitle-mobile">Next release {payroll.releaseDate ?? '—'}</p>
                      </div>
                      <button
                        type="button"
                        className="payroll-delete-btn-mobile"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRequestDeletePayroll(payroll);
                        }}
                        aria-label={`Delete ${payroll.name || 'payroll'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="payroll-list-item-arrow-mobile" aria-hidden="true">
                        <ArrowRight size={20} />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Add New Payroll Modal - Mobile */}
          {showAddPayrollModalMobile && (
            <div className="add-new-payroll-modal-mobile">
              <div className="add-new-payroll-header-mobile">
                <div className="add-new-payroll-title-wrapper-mobile">
                  <div className="add-new-payroll-blue-accent-mobile"></div>
                  <h2 className="add-new-payroll-title-mobile">Add new payroll</h2>
                </div>
                <button
                  type="button"
                  className="add-new-payroll-close-mobile"
                  onClick={closeAddPayrollModalMobile}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="add-new-payroll-step-indicator-mobile">
                <div className="add-new-payroll-step-icon-mobile">
                  {addPayrollStep === 1 ? <Users size={20} /> : addPayrollStep === 2 ? <FileText size={20} /> : <Check size={20} />}
                </div>
                <div className="add-new-payroll-step-content-mobile">
                  <div className="add-new-payroll-step-number-mobile">Step {addPayrollStep}/3</div>
                  <div className="add-new-payroll-step-label-mobile">
                    {addPayrollStep === 1 ? 'Payroll Detail' : addPayrollStep === 2 ? 'Compliance & Documentation' : 'Step 3'}
                  </div>
                </div>
              </div>

              {/* Step 1: Payroll Detail Form */}
              {addPayrollStep === 1 && (
                <div className="add-new-payroll-form-mobile">
                  <h3 className="add-new-payroll-form-title-mobile">Payroll Detail</h3>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Payroll name</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="e.g. Engineering — March 2025"
                      value={addPayrollForm.name}
                      onChange={(e) =>
                        setAddPayrollForm({ ...addPayrollForm, name: e.target.value })
                      }
                      autoComplete="off"
                    />
                  </div>
                  
                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Currency</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Add Date"
                        value={addPayrollForm.currency}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, currency: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Default Salary Type</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.defaultSalaryType}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, defaultSalaryType: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Salary Amount</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Enter phone number"
                      value={addPayrollForm.salaryAmount}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, salaryAmount: e.target.value})}
                    />
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Disbursement Mode</label>
                    <div className="add-new-payroll-radio-group-mobile">
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementMode"
                          value="auto"
                          checked={addPayrollForm.disbursementMode === 'auto'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Auto Release</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementMode"
                          value="manual"
                          checked={addPayrollForm.disbursementMode === 'manual'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Manual Release</span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Allowance Allocation</label>
                    <div className="add-new-payroll-toggle-wrapper-mobile">
                      <span className="add-new-payroll-toggle-text-mobile">Enable Allowances</span>
                      <label className="add-new-payroll-toggle-mobile">
                        <input
                          type="checkbox"
                          checked={addPayrollForm.allowanceAllocation}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, allowanceAllocation: e.target.checked})}
                        />
                        <span className="add-new-payroll-toggle-slider-mobile"></span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Add Amount</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Add amount"
                      value={addPayrollForm.addAmount}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, addAmount: e.target.value})}
                    />
                  </div>

                  <button
                    type="button"
                    className="add-new-payroll-submit-btn-mobile"
                    onClick={() => {
                      if (!addPayrollForm.name.trim()) {
                        toast.error('Please enter a payroll name');
                        return;
                      }
                      setAddPayrollStep(2);
                    }}
                  >
                    <div className="add-new-payroll-submit-icon-mobile">
                      <ArrowRight size={16} />
                    </div>
                    <span>Submit and Next</span>
                  </button>
                </div>
              )}

              {/* Step 2: Compliance & Documentation Form */}
              {addPayrollStep === 2 && (
                <div className="add-new-payroll-form-mobile">
                  <h3 className="add-new-payroll-form-title-mobile">Compliance & Documentation</h3>
                  
                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Job Title:</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Add job title"
                      value={addPayrollForm.jobTitle}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, jobTitle: e.target.value})}
                    />
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Email</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.email}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, email: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Employment Type:</label>
                    <div className="add-new-payroll-radio-group-mobile">
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="employmentType"
                          value="fulltime"
                          checked={addPayrollForm.employmentType === 'fulltime'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, employmentType: e.target.value})}
                        />
                        <span>Full time</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="employmentType"
                          value="parttime"
                          checked={addPayrollForm.employmentType === 'parttime'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, employmentType: e.target.value})}
                        />
                        <span>part time</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="employmentType"
                          value="contract"
                          checked={addPayrollForm.employmentType === 'contract'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, employmentType: e.target.value})}
                        />
                        <span>contract</span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Status</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.status}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, status: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Date Joined</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Enter phone number"
                        value={addPayrollForm.dateJoined}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, dateJoined: e.target.value})}
                      />
                      <Calendar size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Disbursement Mode</label>
                    <div className="add-new-payroll-radio-group-mobile">
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementModeStep2"
                          value="auto"
                          checked={addPayrollForm.disbursementMode === 'auto'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Auto Release</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementModeStep2"
                          value="manual"
                          checked={addPayrollForm.disbursementMode === 'manual'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Manual Release</span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Default Salary Type</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.defaultSalaryType}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, defaultSalaryType: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Currency</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Add Date"
                        value={addPayrollForm.currency}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, currency: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Salary Amount</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Enter Amount"
                      value={addPayrollForm.salaryAmount}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, salaryAmount: e.target.value})}
                    />
                  </div>

                  <div className="form-navigation-buttons-mobile">
                    <button 
                      className="previous-btn-mobile"
                      onClick={() => setAddPayrollStep(1)}
                    >
                      <div className="previous-icon-mobile">
                        <ArrowLeft size={16} />
                      </div>
                      <span>Previous</span>
                    </button>
                    <button 
                      className="submit-next-btn-mobile"
                      onClick={() => setAddPayrollStep(3)}
                    >
                      <div className="submit-next-icon-mobile">
                        <ArrowRight size={16} />
                      </div>
                      <span>Submit and Next</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {addPayrollStep === 3 && (
                <div className="add-new-payroll-form-mobile">
                  <h3 className="add-new-payroll-form-title-mobile">Confirmation</h3>
                  
                  <div className="add-new-payroll-confirmation-section-mobile">
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Payroll name:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">
                        {addPayrollForm.name.trim() || '—'}
                      </span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Company Name:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.companyName}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Company email:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.companyEmail}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Start Date:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.cycleDate}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Start Date:</span>
                      <div className="add-new-payroll-confirmation-value-with-icon-mobile">
                        <span>{addPayrollForm.startDate}</span>
                        <Calendar size={16} />
                      </div>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">End Date:</span>
                      <div className="add-new-payroll-confirmation-value-with-icon-mobile">
                        <span>{addPayrollForm.endDate}</span>
                        <Calendar size={16} />
                      </div>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Currency:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.currency || 'Add Date'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Default Salary Type:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.defaultSalaryType || 'Select'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Salary Amount:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">${addPayrollForm.salaryAmount || '50'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Disbursement Mode:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.disbursementMode === 'auto' ? 'Auto Release' : 'Manual Release'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Allowance Allocation:</span>
                      <span className={`add-new-payroll-confirmation-value-mobile ${addPayrollForm.allowanceAllocation ? 'enabled' : ''}`}>
                        {addPayrollForm.allowanceAllocation ? 'Enable' : 'Disabled'}
                      </span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Add Amount:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">${addPayrollForm.addAmount || '20'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="add-new-payroll-save-lock-btn-mobile"
                    onClick={async () => {
                      if (!addPayrollForm.name.trim()) {
                        toast.error('Please enter a payroll name');
                        return;
                      }
                      try {
                        await handleCreatePayroll(buildMobileAddPayrollPayload());
                        toast.success('Payroll created');
                        closeAddPayrollModalMobile();
                      } catch (err) {
                        toast.error(err?.message || 'Failed to create payroll');
                      }
                    }}
                  >
                    <div className="add-new-payroll-submit-icon-mobile">
                      <ArrowRight size={16} />
                    </div>
                    <span>Save and Lock</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Transaction History Header */}
          {!selectedPayrollDetail && (
            <>
              <div className="transaction-history-header-mobile">
                <h2 className="transaction-history-title-mobile">Transaction History</h2>
                <div className="transaction-history-actions-mobile">
                  <button className="transaction-history-calendar-mobile">
                    <Clock size={20} />
                  </button>
                  <button className="transaction-history-arrow-mobile">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>

              {/* Mobile Transaction History List */}
              <div className="transaction-history-list-mobile">
                {isLoadingTransactionHistory ? (
                  <div className="transaction-item-mobile" style={{ color: 'var(--text-muted)' }}>Loading...</div>
                ) : transactionHistory.length === 0 ? (
                  <div className="transaction-item-mobile" style={{ color: 'var(--text-muted)' }}>No transactions</div>
                ) : (
                  transactionHistory.slice(0, 10).map((tx) => {
                    const statusClass = (tx.status || '').toLowerCase() === 'pending' ? 'pending' : 'successful';
                    return (
                      <div key={tx.id || tx.transactionId} className="transaction-item-mobile" onClick={() => handleViewTransaction(tx.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleViewTransaction(tx.id)}>
                        <div className="transaction-item-content-mobile">
                          <div className="transaction-id-mobile">{tx.transactionId ?? '—'}</div>
                          <div className="transaction-recipient-mobile">{(tx.payrollName || tx.counterpartyName || '—').replace(/ Payroll$/i, '')}</div>
                        </div>
                        <div className="transaction-item-right-mobile">
                          <div className="transaction-amount-mobile">{formatTransactionAmount(tx)}</div>
                          <span className={`transaction-status-mobile ${statusClass}`}>
                            {tx.status ?? '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
        )}

          {/* Mobile Payroll Details Screen */}
          {selectedPayrollDetail && (
            <div className="payroll-details-mobile">
              <div className="payroll-details-header-mobile">
                <div className="payroll-details-title-wrapper-mobile">
                  <h2 className="payroll-details-title-mobile">Payroll Details</h2>
                </div>
                <button 
                  className="payroll-details-close-mobile"
                  onClick={() => setSelectedPayrollDetail(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="payroll-details-grid-mobile">
                {isLoadingMobilePayrollDetail ? (
                  <div className="payroll-detail-card-mobile" style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center' }}>
                    <LoadingIndicator size="sm" />
                  </div>
                ) : !mobilePayrollDetail ? (
                  <div className="payroll-detail-card-mobile" style={{ gridColumn: '1 / -1', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    Failed to load payroll details
                  </div>
                ) : (
                  <>
                    {/* Payroll Name Card */}
                    <div className="payroll-detail-card-mobile">
                      <div className="payroll-detail-card-header-mobile">
                        <h3 className="payroll-detail-card-title-mobile">Payroll name</h3>
                      </div>
                      <div className="payroll-detail-card-value-mobile">{mobilePayrollDetail.name ?? selectedPayrollDetail?.name ?? '—'}</div>
                      <button className="payroll-detail-card-action-mobile">
                        <Download size={16} />
                        <span>Description</span>
                      </button>
                    </div>

                    {/* Team Members Card */}
                    <div className="payroll-detail-card-mobile">
                      <div className="payroll-detail-card-header-mobile">
                        <h3 className="payroll-detail-card-title-mobile">Team members</h3>
                      </div>
                      <div className="payroll-detail-card-value-mobile">
                        {Array.isArray(mobilePayrollDetail.items) ? mobilePayrollDetail.items.length : (mobilePayrollDetail.teamMemberCount ?? mobilePayrollDetail.memberCount ?? '—')}
                      </div>
                      <button 
                        className="payroll-detail-card-action-mobile"
                        onClick={() => setShowAddTeamMember(true)}
                      >
                        <Plus size={16} />
                        <span>Add team member</span>
                      </button>
                    </div>

                    {/* Next Release Date Card */}
                    <div className="payroll-detail-card-mobile">
                      <div className="payroll-detail-card-header-mobile">
                        <h3 className="payroll-detail-card-title-mobile">Next release date</h3>
                      </div>
                      <div className="payroll-detail-card-value-mobile">{mobilePayrollDetail.releaseDate ?? '—'}</div>
                      <button 
                        className="payroll-detail-card-action-mobile"
                        onClick={() => setShowChangeReleaseDateModal(true)}
                      >
                        <Pencil size={16} />
                        <span>Change</span>
                      </button>
                    </div>

                    {/* Payroll Amount Card */}
                    <div className="payroll-detail-card-mobile">
                      <div className="payroll-detail-card-header-mobile">
                        <h3 className="payroll-detail-card-title-mobile">Payroll amount</h3>
                      </div>
                      <div className="payroll-detail-card-amount-wrapper-mobile">
                        <div className="payroll-detail-card-value-mobile">{formatUsd(mobilePayrollDetail.totalAmountUsd)}</div>
                        <div className="payroll-detail-card-amount-secondary-mobile">={formatUsd(mobilePayrollDetail.totalAmountUsd)}</div>
                      </div>
                      <button 
                        className="payroll-detail-card-action-mobile"
                        onClick={() => setShowFundWalletModal(true)}
                      >
                        <Plus size={16} />
                        <span>Fund wallet</span>
                      </button>
                    </div>

                    <div className="payroll-detail-card-mobile payroll-detail-card-mobile-hashes" style={{ gridColumn: '1 / -1' }}>
                      <div className="payroll-detail-card-header-mobile">
                        <h3 className="payroll-detail-card-title-mobile">XRPL Hashes</h3>
                      </div>
                      <div className="payroll-mobile-hash-list">
                        {mobilePayrollXrpHashes.length > 0 ? (
                          mobilePayrollXrpHashes.map((hash) => (
                            <div key={hash} className="payroll-mobile-hash-item">{hash}</div>
                          ))
                        ) : (
                          <div className="payroll-mobile-hash-empty">No XRPL hash yet</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Transaction History Section */}
              <div className="payroll-details-transaction-header-mobile">
                <h2 className="payroll-details-transaction-title-mobile">Transaction History</h2>
                <div className="payroll-details-transaction-actions-mobile">
                  <button className="payroll-details-transaction-calendar-mobile">
                    <Calendar size={20} />
                  </button>
                  <button className="payroll-details-transaction-arrow-mobile">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>

              <div className="payroll-details-transaction-list-mobile">
                {isLoadingMobilePayrollTransactions ? (
                  <div className="payroll-details-transaction-item-mobile" style={{ justifyContent: 'center', padding: '1.5rem' }}>
                    <LoadingIndicator size="sm" />
                  </div>
                ) : mobilePayrollTransactions.length === 0 ? (
                  <div className="payroll-details-transaction-item-mobile" style={{ color: 'var(--text-muted)', padding: '1.5rem' }}>
                    No transactions yet
                  </div>
                ) : (
                  mobilePayrollTransactions.map((tx, index) => (
                    <div key={tx.id ?? tx.transactionId ?? index} className="payroll-details-transaction-item-mobile">
                      <div className="payroll-details-transaction-content-mobile">
                        <div className="payroll-details-transaction-sender-mobile">
                          {(tx.payrollName ?? tx.counterpartyName ?? tx.sender ?? '—').replace(/ Payroll$/i, '')}
                        </div>
                        <div className="payroll-details-transaction-amount-mobile">{formatTransactionAmount(tx)}</div>
                      </div>
                      <div className="payroll-details-transaction-right-mobile">
                        <div className="payroll-details-transaction-date-mobile">{formatTransactionDate(tx)}</div>
                        <button 
                          className="payroll-details-transaction-arrow-btn-mobile"
                          onClick={() => handleViewTransaction(tx.id ?? tx.transactionId)}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Team Member Modal */}
              {showAddTeamMember && (
                <div className="add-team-member-modal-mobile">
                  <div className="add-team-member-header-mobile">
                    <div className="add-team-member-title-wrapper-mobile">
                      <h2 className="add-team-member-title-mobile">Add new team member</h2>
                    </div>
                    <button 
                      className="add-team-member-close-mobile"
                      onClick={() => {
                        setShowAddTeamMember(false);
                        setTeamMemberStep(1);
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Step Indicator */}
                  <div className="step-indicator-mobile">
                    <div className="step-indicator-icon-mobile">
                      {teamMemberStep === 1 ? <User size={20} /> : teamMemberStep === 2 ? <FileText size={20} /> : <Check size={20} />}
                    </div>
                    <div className="step-indicator-content-mobile">
                      <div className="step-indicator-step-mobile">Step {teamMemberStep}/3</div>
                      <div className="step-indicator-label-mobile">
                        {teamMemberStep === 1 ? 'Personal details' : teamMemberStep === 2 ? 'Compliance & Documentation' : 'Payment Details'}
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Personal Details Form */}
                  {teamMemberStep === 1 && (
                  <div className="personal-details-form-mobile">
                    <h3 className="personal-details-title-mobile">Personal Details</h3>
                    
                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Name</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Add Date"
                          value={teamMemberForm.name}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, name: e.target.value})}
                        />
                        <Calendar size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Email</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.email}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, email: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Phone Number:</label>
                      <input
                        type="tel"
                        className="form-input-mobile"
                        placeholder="Enter phone number"
                        value={teamMemberForm.phoneNumber}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, phoneNumber: e.target.value})}
                      />
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Country:</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.country}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, country: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Address:</label>
                      <input
                        type="text"
                        className="form-input-mobile"
                        placeholder="Enter details"
                        value={teamMemberForm.address}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, address: e.target.value})}
                      />
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Gender:</label>
                      <div className="gender-options-mobile">
                        <label className="gender-option-mobile">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={teamMemberForm.gender === 'male'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, gender: e.target.value})}
                          />
                          <span>Male</span>
                        </label>
                        <label className="gender-option-mobile">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={teamMemberForm.gender === 'female'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, gender: e.target.value})}
                          />
                          <span>Female</span>
                        </label>
                        <label className="gender-option-mobile">
                          <input
                            type="radio"
                            name="gender"
                            value="other"
                            checked={teamMemberForm.gender === 'other'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, gender: e.target.value})}
                          />
                          <span>Other</span>
                        </label>
                      </div>
                    </div>

                    <button 
                      className="submit-next-btn-mobile"
                      onClick={() => setTeamMemberStep(2)}
                    >
                      <div className="submit-next-icon-mobile">
                        <ArrowRight size={16} />
                      </div>
                      <span>Submit and Next</span>
                    </button>
                  </div>
                  )}

                  {/* Step 2: Compliance & Documentation Form */}
                  {teamMemberStep === 2 && (
                  <div className="job-details-form-mobile">
                    <h3 className="job-details-title-mobile">Compliance & Documentation</h3>
                    
                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Job Title:</label>
                      <input
                        type="text"
                        className="form-input-mobile"
                        placeholder="Add job title"
                        value={teamMemberForm.jobTitle}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, jobTitle: e.target.value})}
                      />
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Email</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.email}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, email: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Employment Type:</label>
                      <div className="employment-type-options-mobile">
                        <label className="employment-type-option-mobile">
                          <input
                            type="radio"
                            name="employmentType"
                            value="fulltime"
                            checked={teamMemberForm.employmentType === 'fulltime'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, employmentType: e.target.value})}
                          />
                          <span>Full time</span>
                        </label>
                        <label className="employment-type-option-mobile">
                          <input
                            type="radio"
                            name="employmentType"
                            value="parttime"
                            checked={teamMemberForm.employmentType === 'parttime'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, employmentType: e.target.value})}
                          />
                          <span>part time</span>
                        </label>
                        <label className="employment-type-option-mobile">
                          <input
                            type="radio"
                            name="employmentType"
                            value="contract"
                            checked={teamMemberForm.employmentType === 'contract'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, employmentType: e.target.value})}
                          />
                          <span>contract</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Status</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.status}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, status: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Date Joined</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Enter phone number"
                          value={teamMemberForm.dateJoined}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, dateJoined: e.target.value})}
                        />
                        <Calendar size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Disbursement Mode</label>
                      <div className="disbursement-mode-options-mobile">
                        <label className="disbursement-mode-option-mobile">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="auto"
                            checked={teamMemberForm.disbursementMode === 'auto'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, disbursementMode: e.target.value})}
                          />
                          <span>Auto Release</span>
                        </label>
                        <label className="disbursement-mode-option-mobile">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="manual"
                            checked={teamMemberForm.disbursementMode === 'manual'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, disbursementMode: e.target.value})}
                          />
                          <span>Manual Release</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Default Salary Type</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.defaultSalaryType}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, defaultSalaryType: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Currency</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Add Date"
                          value={teamMemberForm.currency}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, currency: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Salary Amount</label>
                      <input
                        type="text"
                        className="form-input-mobile"
                        placeholder="Enter Amount"
                        value={teamMemberForm.salaryAmount}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, salaryAmount: e.target.value})}
                      />
                    </div>

                    <div className="form-navigation-buttons-mobile">
                      <button 
                        className="previous-btn-mobile"
                        onClick={() => setTeamMemberStep(1)}
                      >
                        <div className="previous-icon-mobile">
                          <ArrowLeft size={16} />
                        </div>
                        <span>Previous</span>
                      </button>
                      <button 
                        className="submit-next-btn-mobile"
                        onClick={() => setTeamMemberStep(3)}
                      >
                        <div className="submit-next-icon-mobile">
                          <ArrowRight size={16} />
                        </div>
                        <span>Submit and Next</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Step 3: Payment Details Form */}
                  {teamMemberStep === 3 && (
                  <div className="payment-details-form-mobile">
                    <h3 className="payment-details-section-title-mobile">Account Type</h3>
                    
                    <div className="account-type-options-mobile">
                      <button
                        className={`account-type-option-mobile ${teamMemberForm.accountType === 'bank' ? 'selected' : ''}`}
                        onClick={() => setTeamMemberForm({...teamMemberForm, accountType: 'bank'})}
                      >
                        <Download size={18} />
                        <span>Bank Transfer</span>
                      </button>
                      <button
                        className={`account-type-option-mobile ${teamMemberForm.accountType === 'wallet' ? 'selected' : ''}`}
                        onClick={() => setTeamMemberForm({...teamMemberForm, accountType: 'wallet'})}
                      >
                        <Coins size={18} />
                        <span>Wallet Transfer</span>
                      </button>
                    </div>

                    <h3 className="payment-details-section-title-mobile">Personal Details</h3>
                    
                    {teamMemberForm.accountType === 'bank' ? (
                      <>
                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Currency</label>
                          <div className="form-input-wrapper-mobile">
                            <input
                              type="text"
                              className="form-input-mobile"
                              placeholder="Select"
                              value={teamMemberForm.currency}
                              onChange={(e) => setTeamMemberForm({...teamMemberForm, currency: e.target.value})}
                            />
                            <ChevronDown size={18} className="form-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Bank Name</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Add Date"
                            value={teamMemberForm.bankName}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, bankName: e.target.value})}
                          />
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Account Number</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Enter your name"
                            value={teamMemberForm.accountNumber}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, accountNumber: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Wallet Type</label>
                          <div className="form-input-wrapper-mobile">
                            <input
                              type="text"
                              className="form-input-mobile"
                              placeholder="Select"
                              value={teamMemberForm.walletType}
                              onChange={(e) => setTeamMemberForm({...teamMemberForm, walletType: e.target.value})}
                            />
                            <ChevronDown size={18} className="form-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Wallet Adress</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Add Date"
                            value={teamMemberForm.walletAddress}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, walletAddress: e.target.value})}
                          />
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Network</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Enter your name"
                            value={teamMemberForm.network}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, network: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <button className="add-team-member-final-btn-mobile">
                      <div className="add-team-member-final-icon-mobile">
                        <ArrowRight size={16} />
                      </div>
                      <span>Add Team Member</span>
                    </button>
                  </div>
                  )}
                </div>
              )}

              {/* Fund Wallet Modal */}
              {showFundWalletModal && (
                <div className="fund-wallet-modal-mobile">
                  <div className="fund-wallet-header-mobile">
                    <div className="fund-wallet-title-wrapper-mobile">
                      <div className="fund-wallet-blue-accent-mobile"></div>
                      <h2 className="fund-wallet-title-mobile">Fund Payroll</h2>
                    </div>
                    <button
                      className="fund-wallet-close-mobile"
                      onClick={() => setShowFundWalletModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="fund-wallet-content-mobile">
                    <div className="fund-wallet-amount-section-mobile">
                      <div className="fund-wallet-amount-header-mobile">
                        <label className="fund-wallet-amount-label-mobile">Amount</label>
                        <div className="fund-wallet-currency-selector-mobile">
                          <img 
                            src="https://cryptologos.cc/logos/xrp-xrp-logo.png" 
                            alt="XRP" 
                            className="fund-wallet-currency-logo-mobile"
                          />
                          <span className="fund-wallet-currency-text-mobile">XRP wallet</span>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                      <input
                        type="text"
                        className="fund-wallet-amount-input-mobile"
                        value={`$${fundAmount}`}
                        onChange={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFundAmount(value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              setFundAmount(numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }
                          }
                        }}
                        placeholder="$0.00"
                      />
                      <div className="fund-wallet-balance-mobile">Balance: 24,567.89 USDT</div>
                    </div>

                    <button className="fund-wallet-button-mobile">
                      Fund
                    </button>

                    <div className="fund-wallet-info-mobile">
                      <Info size={16} />
                      <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Release Date Modal */}
              {showChangeReleaseDateModal && (
                <div className="change-release-date-modal-mobile">
                  <div className="change-release-date-header-mobile">
                    <div className="change-release-date-title-wrapper-mobile">
                      <div className="change-release-date-blue-accent-mobile"></div>
                      <h2 className="change-release-date-title-mobile">Change Release Date</h2>
                    </div>
                    <button
                      className="change-release-date-close-mobile"
                      onClick={() => setShowChangeReleaseDateModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="change-release-date-content-mobile">
                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile">Current Release Date</label>
                      <div className="change-release-date-display-mobile">31st Nov</div>
                    </div>

                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile">Current Release Period</label>
                      <div className="change-release-date-display-mobile">30 Days</div>
                    </div>

                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile change-release-date-label-editable-mobile">New Release Period</label>
                      <input
                        type="text"
                        className="change-release-date-input-mobile"
                        placeholder="20 Days"
                        defaultValue="20 Days"
                      />
                    </div>

                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile change-release-date-label-editable-mobile">New Release Date</label>
                      <input
                        type="text"
                        className="change-release-date-input-mobile"
                        placeholder="20th Nov"
                        defaultValue="20th Nov"
                      />
                    </div>

                    <button className="change-release-date-save-btn-mobile">
                      Save
                    </button>

                    <div className="change-release-date-info-mobile">
                      <Info size={16} />
                      <span>Your Release Date would be change</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

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
                               (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')));
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                } else if (item.label === 'Payroll') {
                  navigate('/payroll');
                } else if (item.label === 'Supplier Contract') {
                  navigate('/supplier-contract');
                } else if (item.label === 'Dispute') {
                  navigate('/business-dispute');
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
              const handleSupportClick = () => {
                if (item.label === 'Settings') {
                  navigate('/settings', { state: { accountType: 'Business Suite' } });
                }
              };
              const isActive = item.label === 'Settings' && location.pathname === '/settings';
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleSupportClick}
                >
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
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <div className="user-avatar">
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
              </div>
              <div className="user-info">
                <span className="user-name">
                  {accountType === 'Business Suite' ? (
                    isLoadingBusinessKyc || !businessCompanyName ? <LoadingIndicator size="sm" /> : businessCompanyName
                  ) : (
                    isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName
                  )}
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>{accountType === 'Business Suite' ? 'Business' : (userRole || '')}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="payroll-page">
          <div className="payroll-content">
            {/* Left Section: Payroll Cards */}
            <div className="payroll-cards-section">
              <div className="payroll-section-header">
                <h2 className="payroll-section-title">Payrolls</h2>
                <button className="add-payroll-btn" onClick={() => setShowAddPayrollModal(true)}>
                  <Plus size={18} />
                  Add Payroll
                </button>
              </div>
              {isLoadingPayrolls ? (
                <div className="payroll-card" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Loading payrolls...</div>
              ) : payrolls.length === 0 ? (
                <div className="payroll-card" style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>No payrolls yet</div>
              ) : (
                payrolls.map((payroll) => (
                  <div key={payroll.id} className="payroll-card">
                    <div className="payroll-card-header">
                      <h3 className="payroll-card-title">{payroll.name}</h3>
                      <div className="payroll-card-header-actions">
                        <a 
                          href="#" 
                          className="payroll-view-link"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/payroll/${payroll.id}`);
                          }}
                        >
                          View
                        </a>
                        <button
                          type="button"
                          className="payroll-delete-btn"
                          onClick={() => handleRequestDeletePayroll(payroll)}
                          aria-label={`Delete ${payroll.name || 'payroll'}`}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Segmented toggle for all payrolls */}
                    <div className="payroll-segmented-toggle">
                      <button
                        type="button"
                        className={`segmented-toggle-segment ${(payrollToggles[payroll.id] ?? 'active') === 'active' ? 'active' : ''}`}
                        onClick={() => setPayrollToggles(prev => ({ ...prev, [payroll.id]: 'active' }))}
                      >
                      </button>
                      <button
                        type="button"
                        className={`segmented-toggle-segment ${(payrollToggles[payroll.id] ?? 'active') === 'scheduled' ? 'active' : ''}`}
                        onClick={() => setPayrollToggles(prev => ({ ...prev, [payroll.id]: 'scheduled' }))}
                      >
                      </button>
                    </div>

                    <div className="payroll-release-date">
                      Release date: <span className="payroll-date-value">{payroll.releaseDate ?? '—'}</span>
                    </div>

                    <div className="payroll-freeze-toggle">
                      <span className="freeze-toggle-label">Freeze Auto release</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={!!freezeAutoRelease[payroll.id]}
                          onChange={() => toggleFreezeAutoRelease(payroll.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <button type="button" className="payroll-release-btn" onClick={() => handleReleasePayroll(payroll.id)} disabled={releasingPayrollId === payroll.id}>
                      {releasingPayrollId === payroll.id ? 'Releasing...' : 'Release now'}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Right Section: Summary & Transaction History */}
            <div className="payroll-summary-section">
              {/* Summary Cards */}
              <div className="payroll-summary-cards">
                <div className="payroll-summary-card payroll-summary-card--value-trend">
                  <div className="summary-card-icon">
                    <FileText size={24} />
                  </div>
                  <div className="summary-card-content">
                    <div className="summary-card-title">Total Payroll</div>
                    <div className="summary-card-value-row">
                      <div className="summary-card-value">{isLoadingPayrollSummary ? '...' : (payrollSummary?.totalPayroll ?? '—')}</div>
                      <div className="summary-card-trend positive">
                        <TrendingUp size={14} />
                        <span>+3.1%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="payroll-summary-card payroll-summary-card--value-subtitle">
                  <div className="summary-card-icon">
                    <Users size={24} />
                  </div>
                  <div className="summary-card-content">
                    <div className="summary-card-title">Total Team members</div>
                    <div className="summary-card-value-row">
                      <div className="summary-card-value">{isLoadingPayrollSummary ? '...' : (payrollSummary?.totalTeamMembers ?? '—')}</div>
                      <div className="summary-card-subtitle">Active members</div>
                    </div>
                  </div>
                </div>

                <div className="payroll-summary-card">
                  <div className="summary-card-icon">
                    <Clock size={24} />
                  </div>
                  <div className="summary-card-content">
                    <div className="summary-card-title">Total Payroll Escrowed</div>
                    <div className="summary-card-value-row">
                      <div className="summary-card-value">{isLoadingPayrollSummary ? '...' : formatSummaryEscrowed(payrollSummary?.totalPayrollEscrowed)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="transaction-history-section">
                <div className="transaction-history-header">
                  <h2 className="transaction-history-title">Transaction history</h2>
                </div>

                <div className="transaction-filters">
                  <button className="filter-btn">
                    <Filter size={16} />
                    Filter
                  </button>
                  <button className="monthly-filter-btn">
                    {monthlyFilter}
                    <ChevronDown size={16} />
                  </button>
                  <button className="filter-icon-btn">
                    <Filter size={16} />
                  </button>
                </div>

                <div className="transaction-table-wrapper">
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>Transaction ID</th>
                        <th>Payroll Name</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingTransactionHistory ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '1.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</td>
                        </tr>
                      ) : transactionHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '1.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>No transactions</td>
                        </tr>
                      ) : (
                        transactionHistory.map((tx) => (
                          <tr key={tx.id || tx.transactionId}>
                            <td>
                              <input type="checkbox" />
                            </td>
                            <td className="transaction-id">{tx.transactionId ?? '—'}</td>
                            <td>{tx.payrollName ?? '—'}</td>
                            <td>{formatTransactionAmount(tx)}</td>
                            <td>
                              <span className={`transaction-status ${(tx.status || '').toLowerCase()}`}>{tx.status ?? '—'}</span>
                            </td>
                            <td>{tx.dueDate ?? '—'}</td>
                            <td>
                              <button type="button" className="transaction-action-btn" onClick={() => handleViewTransaction(tx.id)}>
                                <ArrowRight size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="transaction-pagination">
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={transactionHistoryPage <= 1 || isLoadingTransactionHistory}
                    onClick={() => setTransactionHistoryPage((p) => Math.max(1, p - 1))}
                  >
                    ← Prev 10
                  </button>
                  <div className="pagination-numbers">
                    <span className="pagination-number active">{transactionHistoryPage}</span>
                    {transactionHistoryTotalPages > 1 && (
                      <span className="pagination-number">/ {transactionHistoryTotalPages}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="pagination-btn"
                    disabled={transactionHistoryPage >= transactionHistoryTotalPages || isLoadingTransactionHistory}
                    onClick={() => setTransactionHistoryPage((p) => Math.min(transactionHistoryTotalPages, p + 1))}
                  >
                    Next 10 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TransactionDetailModal
        isOpen={transactionDetailOpen}
        onClose={handleCloseTransactionDetail}
        transaction={transactionDetailData}
        loading={isLoadingTransactionDetail}
      />

      {showDeletePayrollModal && payrollToDelete && (
        <div
          className="payroll-delete-modal-overlay"
          onClick={() => {
            if (deletingPayrollId) return;
            setShowDeletePayrollModal(false);
            setPayrollToDelete(null);
          }}
        >
          <div className="payroll-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="payroll-delete-modal-header">
              <div className="payroll-delete-modal-title-wrap">
                <AlertTriangle size={18} />
                <h3 className="payroll-delete-modal-title">Delete payroll</h3>
              </div>
              <button
                type="button"
                className="payroll-delete-modal-close"
                onClick={() => {
                  if (deletingPayrollId) return;
                  setShowDeletePayrollModal(false);
                  setPayrollToDelete(null);
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="payroll-delete-modal-message">
              You are about to delete <strong>{payrollToDelete.name || 'this payroll'}</strong>. This action cannot be undone.
            </p>
            <div className="payroll-delete-modal-actions">
              <button
                type="button"
                className="payroll-delete-cancel-btn"
                onClick={() => {
                  if (deletingPayrollId) return;
                  setShowDeletePayrollModal(false);
                  setPayrollToDelete(null);
                }}
                disabled={!!deletingPayrollId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="payroll-delete-confirm-btn"
                onClick={handleConfirmDeletePayroll}
                disabled={!!deletingPayrollId}
              >
                {deletingPayrollId ? 'Deleting...' : 'Delete payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payroll Modal */}
      <AddPayrollModal
        isOpen={showAddPayrollModal}
        onCancel={() => setShowAddPayrollModal(false)}
        onSuccess={handleCreatePayroll}
      />
    </div>
  );
};

export default Payroll;
