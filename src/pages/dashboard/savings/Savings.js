import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings,
  HelpCircle,
  Home,
  Search,
  Bell,
  KeyRound,
  LogOut,
  Wallet,
  FileCheck,
  X,
  Plus,
  PiggyBank,
  Receipt,
  RefreshCw,
  Trophy,
  Package,
  ArrowDownToLine,
  TrendingUp,
  ChevronDown,
  SlidersHorizontal,
  ArrowDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Savings.css';
import logo from '../../../assets/images/icons/logo.png';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { handleLogout } from '../../../utils/logout';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import PersonalSuiteMobileHeader from '../../../components/PersonalSuiteMobileHeader';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import SavingsWithdrawWalletModal from '../../../components/SavingsWithdrawWalletModal';
import SavingsAddMoneyModal from '../../../components/SavingsAddMoneyModal';
import AddSavingsPlanModal, { planRequiresGoalAmount, planIsAutoSavings } from '../../../components/AddSavingsPlanModal';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { PersonalSidebarWalletProvider, PersonalSidebarWalletNav } from '../../../components/PersonalSidebarWallet';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' },
];

const supportNav = [{ label: 'Settings', icon: Settings }];

const MOBILE_SAVINGS_ALLOCATION_BUCKETS = [
  { id: 'mb1', label: 'My Goals', pct: 50, color: '#2563eb' },
  { id: 'mb2', label: 'House Rent', pct: 15, color: '#22c55e' },
  { id: 'mb3', label: 'Expenses', pct: 15, color: '#a855f7' },
  { id: 'mb4', label: 'Set up', pct: 20, color: '#f97316' },
];

const HISTORY_PAGE_CHUNK = 10;

/** Pagination strip aligned with Saving history mock: `1 … 11–18` when there are many pages. */
const getSavingHistoryPaginationStrip = (totalPages) => {
  if (totalPages <= 10) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const tailStart = Math.max(2, totalPages - 7);
  const strip = [1];
  if (tailStart > 2) strip.push(null);
  for (let p = tailStart; p <= totalPages; p += 1) strip.push(p);
  return strip;
};

const fmtUsdWhole = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtUsdDecimals = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtUsdNoCents = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Number.isFinite(Number(n)) ? Number(n) : 0,
  );

const toNumeric = (value, fallback = 0) => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toYyyyMmDd = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const SAVINGS_WALLET_STYLE_PRESETS = [
  { ringColor: '#2563eb', Icon: Trophy },
  { ringColor: '#22c55e', Icon: Home },
  { ringColor: '#ec4899', Icon: Receipt },
  { ringColor: '#f97316', Icon: Package },
  { ringColor: '#06b6d4', Icon: RefreshCw },
];

const hashStringToIndex = (value, modulo) => {
  if (!value || !modulo) return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
};

const mapSavingsWalletApiToUi = (wallet, fallbackIndex = 0) => {
  const idRaw = String(wallet?.id || '').trim();
  const styleIndex = idRaw
    ? hashStringToIndex(idRaw, SAVINGS_WALLET_STYLE_PRESETS.length)
    : fallbackIndex % SAVINGS_WALLET_STYLE_PRESETS.length;
  const style = SAVINGS_WALLET_STYLE_PRESETS[styleIndex] || SAVINGS_WALLET_STYLE_PRESETS[0];
  const amountUsd = toNumeric(wallet?.amountUsd);
  const targetAmountUsd = toNumeric(wallet?.targetAmountUsd);
  const percentageNumRaw = toNumeric(wallet?.percentage, NaN);
  const progressPct = Number.isFinite(percentageNumRaw)
    ? Math.max(0, Math.min(100, percentageNumRaw))
    : targetAmountUsd > 0
      ? Math.max(0, Math.min(100, (amountUsd / targetAmountUsd) * 100))
      : 0;

  return {
    id: idRaw || `wallet-${fallbackIndex + 1}`,
    title: String(wallet?.name || `Wallet ${fallbackIndex + 1}`),
    progressPct: Math.round(progressPct),
    typeLabel: String(wallet?.planType || 'Savings'),
    savedUsd: amountUsd,
    ringColor: style.ringColor,
    Icon: style.Icon,
    status: String(wallet?.status || '').toLowerCase() === 'completed' ? 'completed' : 'active',
    targetAmountUsd,
  };
};

const mapSavingsTransactionApiToUi = (tx, idx) => {
  const txHash = String(tx?.txHash || tx?.id || '').trim();
  const txShort = txHash ? txHash.slice(0, 6) : `TX${String(idx + 1).padStart(4, '0')}`;
  const txEnd = txHash ? txHash.slice(-6) : '—';
  const amountUsd = toNumeric(tx?.amountUsd);
  const walletName = String(tx?.walletName || tx?.wallet || tx?.planName || 'Savings');
  const status = String(tx?.status || 'Successful');
  const direction = String(tx?.direction || 'in').toLowerCase();
  const dateRaw = tx?.date || tx?.createdAt;
  const date = dateRaw ? toYyyyMmDd(dateRaw) : '—';
  return {
    id: txHash || `${txShort}-${idx}`,
    txShort,
    txEnd,
    amount: amountUsd,
    plan: walletName,
    date,
    status,
    direction,
    txLabel: String(tx?.txLabel || (direction === 'out' ? 'Sent' : 'Received')),
  };
};

const Savings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading, openTrustiscoreModal } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();

  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formattedToday, setFormattedToday] = useState('');
  const [savingHistoryPage, setSavingHistoryPage] = useState(1);
  const [savingHistoryTotalPages, setSavingHistoryTotalPages] = useState(1);
  const [savingHistoryDirection, setSavingHistoryDirection] = useState('all');
  const [savingHistoryRange, setSavingHistoryRange] = useState('monthly');
  const [showHistoryFilterMenu, setShowHistoryFilterMenu] = useState(false);
  const [showHistoryRangeMenu, setShowHistoryRangeMenu] = useState(false);
  const [savingHistorySelectedIds, setSavingHistorySelectedIds] = useState(() => ({}));
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showAddSavingsPlanModal, setShowAddSavingsPlanModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [savingsPlans, setSavingsPlans] = useState([]);
  const [addMoneyAccountId, setAddMoneyAccountId] = useState('');
  const [savingsTotalUsd, setSavingsTotalUsd] = useState(0);
  const [savingsGrowthPct, setSavingsGrowthPct] = useState(0);
  const [savingsAllocationBuckets, setSavingsAllocationBuckets] = useState([]);
  const [savingHistoryRows, setSavingHistoryRows] = useState([]);
  const [savingsMobileTxFeed, setSavingsMobileTxFeed] = useState([]);
  const [hasLoadedSavingsData, setHasLoadedSavingsData] = useState(false);
  const [savingsReloadTick, setSavingsReloadTick] = useState(0);
  const [isLoadingSavingsData, setIsLoadingSavingsData] = useState(false);
  const [isCreatingSavingsWallet, setIsCreatingSavingsWallet] = useState(false);
  const [isSubmittingSavingsTransfer, setIsSubmittingSavingsTransfer] = useState(false);
  const [isSubmittingSavingsWithdraw, setIsSubmittingSavingsWithdraw] = useState(false);
  const [deletingSavingsWalletId, setDeletingSavingsWalletId] = useState('');
  const [addSavingsPlanForm, setAddSavingsPlanForm] = useState({
    name: '',
    category: 'Fixed',
    amount: '',
    autoSaveAmount: '',
    autoSaveFrequency: '',
  });
  const [savingsMobileMq, setSavingsMobileMq] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  );
  const historyFilterMenuRef = useRef(null);
  const historyRangeMenuRef = useRef(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem('dashboard_account_type');
      if (t && typeof t === 'string') setAccountType(t);
    } catch (_) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString(undefined, { month: 'long' });
      const suf = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      setFormattedToday(`${weekday}, ${day}${suf} ${month}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserAvatar(null);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserAvatar(null);
          return;
        }
        const response = await fetch(getApiUrl('api/user/profile'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data) {
            persistTrustitagFromProfileResponse(result);
            const data = result.data;
            const fullName =
              data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || 'Sarah Chen';
            setUserFullName(fullName);
            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = 'SC';
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              const parts = fullName.trim().split(/\s+/);
              if (parts.length >= 2) {
                initials = `${parts[0].charAt(0).toUpperCase()}${parts[parts.length - 1].charAt(0).toUpperCase()}`;
              } else if (parts.length === 1) initials = parts[0].charAt(0).toUpperCase();
            }
            setUserInitials(initials);
            setUserAvatar(getProfileAvatarUrl(data));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserProfile();
  }, [isSessionExpired]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setSavingsMobileMq(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const onDocClick = (event) => {
      if (
        historyFilterMenuRef.current &&
        !historyFilterMenuRef.current.contains(event.target)
      ) {
        setShowHistoryFilterMenu(false);
      }
      if (
        historyRangeMenuRef.current &&
        !historyRangeMenuRef.current.contains(event.target)
      ) {
        setShowHistoryRangeMenu(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const fetchSavingsWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      const msg =
        (typeof payload?.message === 'string' && payload.message) ||
        (typeof payload?.error === 'string' && payload.error) ||
        'Savings request failed';
      throw new Error(msg);
    }
    return payload;
  };

  useEffect(() => {
    if (isSessionExpired) {
      setHasLoadedSavingsData(true);
      return;
    }
    let cancelled = false;

    const fetchSavingsDashboardData = async () => {
      setIsLoadingSavingsData(true);
      try {
        const [summaryRes, cashflowRes, totalRes, walletsRes, txRes] = await Promise.all([
          fetchSavingsWithAuth('api/savings/summary?range=this_month'),
          fetchSavingsWithAuth('api/savings/cashflow?interval=monthly&range=this_month'),
          fetchSavingsWithAuth('api/savings/wallets/total'),
          fetchSavingsWithAuth('api/savings/wallets'),
          fetchSavingsWithAuth(
            `api/savings/transactions?direction=${encodeURIComponent(
              savingHistoryDirection,
            )}&range=${encodeURIComponent(savingHistoryRange)}&page=${savingHistoryPage}&pageSize=${HISTORY_PAGE_CHUNK}`,
          ),
        ]);
        if (cancelled) return;

        const summaryData = summaryRes?.data || {};
        const walletsRaw = Array.isArray(walletsRes?.data?.wallets) ? walletsRes.data.wallets : [];
        const mappedWallets = walletsRaw.map((wallet, idx) => mapSavingsWalletApiToUi(wallet, idx));
        const cashflowData = cashflowRes?.data || {};
        const txRaw = Array.isArray(txRes?.data?.transactions) ? txRes.data.transactions : [];
        const mappedTxRows = txRaw.map((tx, idx) => mapSavingsTransactionApiToUi(tx, idx));

        setSavingsPlans(mappedWallets);
        setAddMoneyAccountId((prev) => {
          if (mappedWallets.length === 0) return '';
          return mappedWallets.some((w) => w.id === prev) ? prev : mappedWallets[0].id;
        });

        const walletsTotalUsd = toNumeric(totalRes?.data?.totalUsd, NaN);
        const summaryTotalUsd = toNumeric(summaryData?.totalUsd, NaN);
        const resolvedTotalUsd = Number.isFinite(walletsTotalUsd)
          ? walletsTotalUsd
          : Number.isFinite(summaryTotalUsd)
            ? summaryTotalUsd
            : 0;
        setSavingsTotalUsd(resolvedTotalUsd);

        const growthCandidates = [
          summaryData?.monthGrowthPct,
          summaryData?.growthPct,
          summaryData?.changePercent,
        ];
        const resolvedGrowth =
          growthCandidates.map((v) => toNumeric(v, NaN)).find((v) => Number.isFinite(v)) ?? 0;
        setSavingsGrowthPct(resolvedGrowth);

        const bucketsFromApi = Array.isArray(cashflowData?.buckets)
          ? cashflowData.buckets
          : Array.isArray(summaryData?.allocation)
            ? summaryData.allocation
            : [];
        if (bucketsFromApi.length > 0) {
          const mappedBuckets = bucketsFromApi
            .map((bucket, idx) => ({
              id: String(bucket?.id || bucket?.name || bucket?.label || `bucket-${idx + 1}`),
              label: String(bucket?.label || bucket?.name || `Bucket ${idx + 1}`),
              pct: Math.max(0, toNumeric(bucket?.pct ?? bucket?.percentage, 0)),
              color: String(
                bucket?.color || MOBILE_SAVINGS_ALLOCATION_BUCKETS[idx % MOBILE_SAVINGS_ALLOCATION_BUCKETS.length]?.color || '#2563eb',
              ),
            }))
            .filter((b) => b.pct > 0);
          setSavingsAllocationBuckets(mappedBuckets);
        } else {
          const total = mappedWallets.reduce((acc, w) => acc + toNumeric(w.savedUsd), 0);
          if (total > 0) {
            setSavingsAllocationBuckets(
              mappedWallets.map((w, idx) => ({
                id: w.id,
                label: w.title,
                pct: Math.max(0, Math.round((toNumeric(w.savedUsd) / total) * 100)),
                color:
                  w.ringColor ||
                  MOBILE_SAVINGS_ALLOCATION_BUCKETS[idx % MOBILE_SAVINGS_ALLOCATION_BUCKETS.length]?.color ||
                  '#2563eb',
              })),
            );
          } else {
            setSavingsAllocationBuckets([]);
          }
        }

        setSavingHistoryRows(mappedTxRows);
        setSavingsMobileTxFeed(
          mappedTxRows.slice(0, 3).map((row) => ({
            id: row.id,
            title: row.txLabel,
            subtitle: `${row.txLabel} ${fmtUsdNoCents(row.amount)} in ${row.plan}.`,
            status: row.status || 'Successful',
            date: row.date || '—',
          })),
        );
        const totalTx = toNumeric(txRes?.data?.total, mappedTxRows.length);
        setSavingHistoryTotalPages(Math.max(1, Math.ceil(totalTx / HISTORY_PAGE_CHUNK)));
      } catch (error) {
        console.error('Error fetching savings dashboard data:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingSavingsData(false);
          setHasLoadedSavingsData(true);
        }
      }
    };

    fetchSavingsDashboardData();
    return () => {
      cancelled = true;
    };
  }, [
    isSessionExpired,
    savingHistoryPage,
    savingHistoryDirection,
    savingHistoryRange,
    savingsReloadTick,
  ]);

  const isNavActive = (label) =>
    (label === 'Dashboard' && location.pathname === '/dashboard') ||
    (label === 'My Escrow' && location.pathname === '/my-escrow') ||
    (label === 'Transactions' && location.pathname === '/transactions') ||
    (label === 'Dispute' && location.pathname.startsWith('/dispute')) ||
    (label === 'Savings' && location.pathname === '/savings') ||
    (label === 'Trusticard' && location.pathname === '/trusticard');

  const navigateForLabel = (label) => {
    if (label === 'Dashboard') navigate('/dashboard');
    else if (label === 'My Escrow') navigate('/my-escrow');
    else if (label === 'Transactions') navigate('/transactions');
    else if (label === 'Dispute') navigate('/dispute');
    else if (label === 'Savings') navigate('/savings');
    else if (label === 'Trusticard') navigate('/trusticard');
  };

  const savingHistoryPaginationStrip = getSavingHistoryPaginationStrip(savingHistoryTotalPages);
  const savingHistoryRowIds = savingHistoryRows.map((r) => r.id);
  const savingHistoryAllChecked =
    savingHistoryRowIds.length > 0 && savingHistoryRowIds.every((id) => savingHistorySelectedIds[id]);

  const toggleSavingHistorySelectAll = () => {
    setSavingHistorySelectedIds((prev) => {
      const all = savingHistoryRowIds.every((id) => prev[id]);
      if (all) return {};
      const next = { ...prev };
      savingHistoryRowIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  };

  const toggleSavingHistoryRow = (id) => {
    setSavingHistorySelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const effectiveSavingsAllocationBuckets = savingsMobileMq
    ? MOBILE_SAVINGS_ALLOCATION_BUCKETS
    : savingsAllocationBuckets;
  const showSavingsLazyLoader = isLoadingSavingsData && !hasLoadedSavingsData;
  const savingHistoryRangeLabel =
    savingHistoryRange === 'daily'
      ? 'Daily'
      : savingHistoryRange === 'weekly'
        ? 'Weekly'
        : 'Monthly';
  const savingHistoryDirectionLabel =
    savingHistoryDirection === 'in'
      ? 'Received'
      : savingHistoryDirection === 'out'
        ? 'Sent'
        : 'All';
  const savingHistoryDirectionOptions = [
    { value: 'all', label: 'All' },
    { value: 'in', label: 'Received' },
    { value: 'out', label: 'Sent' },
  ];
  const savingHistoryRangeOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' },
  ];

  const savingsAddMoneyAccounts = useMemo(
    () => savingsPlans.map((p) => ({ id: p.id, label: p.title })),
    [savingsPlans],
  );

  useEffect(() => {
    if (savingsPlans.length === 0) return;
    if (!savingsPlans.some((p) => p.id === addMoneyAccountId)) {
      setAddMoneyAccountId(savingsPlans[0].id);
    }
  }, [savingsPlans, addMoneyAccountId]);

  const deleteSavingsPlanCard = async (plan) => {
    if (!plan?.id || String(plan.id).startsWith('wallet-')) {
      toast.error('Invalid savings wallet');
      return;
    }
    if (!window.confirm(`Remove "${plan.title}" from your savings wallets?`)) return;
    try {
      setDeletingSavingsWalletId(String(plan.id));
      const queryTargetWalletId = '';
      await fetchSavingsWithAuth(
        `api/savings/wallets/${encodeURIComponent(String(plan.id))}${
          queryTargetWalletId ? `?targetWalletId=${encodeURIComponent(queryTargetWalletId)}` : ''
        }`,
        { method: 'DELETE' },
      );
      toast.success('Savings wallet removed');
      setSavingsPlans((prev) => prev.filter((p) => p.id !== plan.id));
      setSavingsReloadTick((v) => v + 1);
    } catch (error) {
      toast.error(error?.message || 'Could not delete savings wallet');
    } finally {
      setDeletingSavingsWalletId('');
    }
  };

  const savingsWithdrawWallets = useMemo(
    () =>
      savingsPlans.map((plan) => ({
        id: plan.id,
        title: plan.title,
        progressPct: plan.progressPct,
        ringColor: plan.ringColor,
        Icon: plan.Icon,
        balanceLabel: fmtUsdDecimals(plan.savedUsd),
        confirmBalanceLabel: fmtUsdDecimals(plan.savedUsd),
        planStatus: plan.status === 'completed' ? 'completed' : 'active',
        accent: plan.status === 'completed' ? 'blue' : 'green',
      })),
    [savingsPlans],
  );

  const submitSavingsTransfer = async () => {
    const savingsWalletId = String(addMoneyAccountId || '').trim();
    const amountXrp = parseFloat(String(addMoneyAmount || '').replace(/,/g, '').trim());
    if (!savingsWalletId) {
      toast.error('Select a savings wallet');
      return;
    }
    if (!Number.isFinite(amountXrp) || amountXrp <= 0) {
      toast.error('Enter a valid XRP amount');
      return;
    }
    try {
      setIsSubmittingSavingsTransfer(true);
      const payload = await fetchSavingsWithAuth('api/savings/transfer', {
        method: 'POST',
        body: JSON.stringify({
          savingsWalletId,
          amountXrp,
        }),
      });
      toast.success(payload?.message || 'Funds moved to savings');
      setShowAddMoneyModal(false);
      setAddMoneyAmount('');
      setSavingsReloadTick((v) => v + 1);
      setSavingHistoryPage(1);
    } catch (error) {
      toast.error(error?.message || 'Transfer failed');
    } finally {
      setIsSubmittingSavingsTransfer(false);
    }
  };

  const submitSavingsWithdraw = async (wallet) => {
    const savingsWalletId = String(wallet?.id || '').trim();
    if (!savingsWalletId) {
      toast.error('Select a savings wallet');
      return;
    }
    try {
      setIsSubmittingSavingsWithdraw(true);
      const payload = await fetchSavingsWithAuth('api/savings/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          savingsWalletId,
          withdrawAll: true,
        }),
      });
      toast.success(payload?.message || 'Withdrawal submitted');
      setShowWithdrawWalletModal(false);
      setSavingsReloadTick((v) => v + 1);
      setSavingHistoryPage(1);
    } catch (error) {
      toast.error(error?.message || 'Withdrawal failed');
    } finally {
      setIsSubmittingSavingsWithdraw(false);
    }
  };

  return (
    <PersonalSidebarWalletProvider
      isSessionExpired={isSessionExpired}
      enabled={accountType !== 'Business Suite'}
    >
    <>
      <PersonalSuiteMobileHeader
        variant="personal"
        className="transactions-mobile-header"
        centerMode="profile"
        profileSubtitle="Freelancer"
        personalVerificationComplete={kycComplete}
        userAvatar={userAvatar}
        userInitials={userInitials}
        userFullName={userFullName}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
      />

      {isMobileMenuOpen ? (
        <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} role="presentation" />
      ) : null}

      <div className={`mobile-sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-branding">
            <img src={logo} alt="TrustiChain" className="mobile-sidebar-logo" />
            <div className="mobile-sidebar-branding-text">
              <span className="mobile-sidebar-title">TrustiChain</span>
              <span className="mobile-sidebar-tagline">Secure escrow platform</span>
            </div>
          </div>
          <button type="button" className="mobile-sidebar-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
            <nav className="mobile-sidebar-nav">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const navBadge = getNavBadge(item);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item ${isNavActive(item.label) ? 'active' : ''}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigateForLabel(item.label);
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {navBadge != null && navBadge !== '' ? <span className="mobile-sidebar-badge">{navBadge}</span> : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {accountType !== 'Business Suite' && (
            <PersonalSidebarWalletNav
              variant="mobile"
              onBeforeViewWallet={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">Support</p>
            <nav className="mobile-sidebar-nav">
              {supportNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" className="mobile-sidebar-nav-item" onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mobile-sidebar-bottom">
            <div className="mobile-sidebar-help-card">
              <div className="mobile-sidebar-help-icon">
                <HelpCircle size={24} />
              </div>
              <h3>Help Center</h3>
              <p>Having trouble in Trustichain? Please contact us</p>
              <button type="button" className="mobile-sidebar-help-cta">
                Contact us
              </button>
            </div>

            <div className="mobile-sidebar-trustiscore">
              <span className="mobile-sidebar-trustiscore-label">Trustiscore</span>
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
      </div>

      <div className="dashboard">
        <aside className="dashboard-sidebar">
          <div className="sidebar-branding">
            <img src={logo} alt="TrustiChain" className="sidebar-logo" />
            <div className="sidebar-branding-text">
              <span className="sidebar-title">TrustiChain</span>
              <span className="sidebar-tagline">Secure escrow platform</span>
            </div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-section-label">Main Menu</p>
            <nav className="sidebar-nav">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const navBadge = getNavBadge(item);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`sidebar-nav-item ${isNavActive(item.label) ? 'active' : ''}`}
                    onClick={() => navigateForLabel(item.label)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {navBadge != null && navBadge !== '' ? <span className="sidebar-badge">{navBadge}</span> : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {accountType !== 'Business Suite' && <PersonalSidebarWalletNav />}

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

        <main className="dashboard-main savings-dashboard-main">
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
              {kycComplete ? (
                <>
                  <button
                    type="button"
                    className="header-trustiscore-box"
                    role="status"
                    aria-label={`TrustiScore ${trustiscoreBadgeText}`}
                    onClick={openTrustiscoreModal}
                  >
                    <span className="header-trustiscore-label">TrustiScore</span>
                    <span className="header-trustiscore-value">{trustiscoreBadgeText}</span>
                  </button>
                  <div className="account-type-display">
                    <span className="account-type-label">{accountType}</span>
                  </div>
                </>
              ) : (
                <button type="button" className="kyc-status">
                  <KeyRound size={16} />
                  <span>KYC</span>
                  <span>Unverified</span>
                </button>
              )}
              <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
                <Bell size={18} />
              </button>
              <div className="header-user">
                <HeaderProfileAvatarNav>
                  {userAvatar ? <img src={userAvatar} alt={userFullName} className="user-avatar-img" /> : userInitials}
                  <HeaderProfileVerifyBadge show={kycComplete} />
                </HeaderProfileAvatarNav>
              </div>
            </div>
          </header>

          <div className="savings-page">
            <div className="card-breadcrumb">
              <span className="breadcrumb-root">General</span>
              <span className="breadcrumb-divider">›</span>
              <span className="breadcrumb-current">My Savings</span>
            </div>

            <section className="savings-wallet-panel" aria-labelledby="savings-wallet-heading">
              <div className="savings-wallet-head">
                <div className="savings-wallet-title-row">
                  <span className="savings-wallet-accent" aria-hidden />
                  <h2 id="savings-wallet-heading" className="savings-wallet-title">
                    Savings wallet
                  </h2>
                </div>
                <button type="button" className="savings-wallet-add-plan" onClick={() => setShowAddSavingsPlanModal(true)}>
                  <Plus size={18} strokeWidth={2.5} aria-hidden />
                  <span className="savings-wallet-add-plan-text savings-wallet-add-plan-text--desktop">Add Savings plan</span>
                  <span className="savings-wallet-add-plan-text savings-wallet-add-plan-text--mobile">Add wallet</span>
                </button>
              </div>

              <div className="savings-wallet-track" role="list">
                {showSavingsLazyLoader ? (
                  <div className="savings-lazy-loader">
                    <LoadingIndicator size="md" />
                    <span>Loading savings wallets…</span>
                  </div>
                ) : savingsPlans.length === 0 ? (
                  <div className="savings-empty-state">No savings wallet yet.</div>
                ) : (
                  savingsPlans.map((plan) => {
                    const Pi = plan.Icon;
                    return (
                      <article key={plan.id} className="savings-plan-card" role="listitem">
                        <button
                          type="button"
                          className="savings-plan-delete-btn"
                          onClick={() => deleteSavingsPlanCard(plan)}
                          disabled={deletingSavingsWalletId === plan.id}
                          aria-label={`Remove ${plan.title}`}
                        >
                          <Trash2 size={16} strokeWidth={2} aria-hidden />
                        </button>
                        <div className="savings-plan-top">
                          <div
                            className="savings-plan-ring"
                            style={{ '--sv-pct': plan.progressPct, '--sv-ring-color': plan.ringColor }}
                          >
                            <div className="savings-plan-ring-inner">
                              <Pi size={20} strokeWidth={2} aria-hidden />
                            </div>
                          </div>
                          <div className="savings-plan-meta">
                            <p className="savings-plan-name">{plan.title}</p>
                            <p className="savings-plan-pct">{plan.progressPct}%</p>
                          </div>
                        </div>
                        <p className="savings-plan-type">{plan.typeLabel}</p>
                        <div className="savings-plan-saved-row">
                          <span className="savings-plan-saved-label">Saved:</span>
                          <span className="savings-plan-saved-amt">{fmtUsdWhole(plan.savedUsd)}</span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              <div className="savings-wallet-footer">
                <button type="button" className="savings-wallet-add-money" onClick={() => setShowAddMoneyModal(true)}>
                  <Plus size={17} strokeWidth={2.5} aria-hidden />
                  Add money
                </button>
                <button
                  type="button"
                  className="savings-wallet-withdraw"
                  onClick={() => setShowWithdrawWalletModal(true)}
                  disabled={savingsPlans.length === 0}
                >
                  <Wallet size={17} aria-hidden strokeWidth={2} />
                  <ArrowDownToLine size={17} aria-hidden strokeWidth={2} />
                  Withdraw
                </button>
              </div>
            </section>

            <section className="savings-allocation-panel" aria-labelledby="savings-allocation-heading">
              <div className="savings-allocation-title-row">
                <span className="savings-wallet-accent" aria-hidden />
                <div>
                  <h2 id="savings-allocation-heading" className="savings-wallet-title">
                    Savings Allocation
                  </h2>
                  <p className="savings-allocation-subtitle">Total amount you have in your savings</p>
                </div>
              </div>

              <div className="savings-allocation-summary" role="group" aria-label="Total savings summary">
                <span className="savings-allocation-total">
                  {showSavingsLazyLoader ? <LoadingIndicator size="sm" /> : fmtUsdDecimals(savingsTotalUsd)}
                </span>
                <span className="savings-allocation-growth">
                  {showSavingsLazyLoader ? null : (
                    <>
                      <TrendingUp size={14} strokeWidth={2.25} aria-hidden />
                      {savingsGrowthPct >= 0 ? '+' : ''}
                      {Number(savingsGrowthPct).toFixed(1)}%
                    </>
                  )}
                </span>
                <span className="savings-allocation-period">This Month</span>
              </div>

              <div
                className="savings-allocation-bar"
                role="img"
                aria-label={effectiveSavingsAllocationBuckets.map((b) => `${b.label} ${b.pct}%`).join(', ')}
              >
                {effectiveSavingsAllocationBuckets.map((b) => (
                  <div
                    key={b.id}
                    className="savings-allocation-bar-segment"
                    style={{ flexGrow: b.pct, flexBasis: 0, backgroundColor: b.color }}
                  />
                ))}
              </div>

              <ul className="savings-allocation-legend" aria-label="Allocation categories">
                {effectiveSavingsAllocationBuckets.map((b) => (
                  <li key={b.id} className="savings-allocation-legend-item">
                    <span className="savings-allocation-legend-dot" style={{ backgroundColor: b.color }} aria-hidden />
                    <span>{b.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="savings-history-panel" aria-labelledby="savings-history-heading">
              <div className="savings-history-toolbar">
                <div className="savings-history-title-row">
                  <span className="savings-wallet-accent" aria-hidden />
                  <h2 id="savings-history-heading" className="savings-wallet-title">
                    <span className="savings-history-title-text savings-history-title-text--desktop">Saving history</span>
                    <span className="savings-history-title-text savings-history-title-text--mobile">Transaction History</span>
                  </h2>
                </div>
                <div className="savings-history-controls savings-history-desktop-only">
                  <div className="savings-history-dropdown" ref={historyFilterMenuRef}>
                    <button
                      type="button"
                      className="savings-history-pill-btn"
                      aria-haspopup="menu"
                      aria-expanded={showHistoryFilterMenu}
                      onClick={() => {
                        setShowHistoryFilterMenu((v) => !v);
                        setShowHistoryRangeMenu(false);
                      }}
                    >
                      {savingHistoryDirectionLabel}
                      <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
                    </button>
                    {showHistoryFilterMenu && (
                      <div className="savings-history-dropdown-menu" role="menu" aria-label="Transaction direction">
                        {savingHistoryDirectionOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={savingHistoryDirection === option.value}
                            className={`savings-history-dropdown-item ${
                              savingHistoryDirection === option.value ? 'active' : ''
                            }`}
                            onClick={() => {
                              setSavingHistoryDirection(option.value);
                              setSavingHistoryPage(1);
                              setSavingHistorySelectedIds({});
                              setShowHistoryFilterMenu(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="savings-history-dropdown" ref={historyRangeMenuRef}>
                    <button
                      type="button"
                      className="savings-history-pill-btn"
                      aria-haspopup="menu"
                      aria-expanded={showHistoryRangeMenu}
                      onClick={() => {
                        setShowHistoryRangeMenu((v) => !v);
                        setShowHistoryFilterMenu(false);
                      }}
                    >
                      {savingHistoryRangeLabel}
                      <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
                    </button>
                    {showHistoryRangeMenu && (
                      <div className="savings-history-dropdown-menu" role="menu" aria-label="Transaction range">
                        {savingHistoryRangeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={savingHistoryRange === option.value}
                            className={`savings-history-dropdown-item ${
                              savingHistoryRange === option.value ? 'active' : ''
                            }`}
                            onClick={() => {
                              setSavingHistoryRange(option.value);
                              setSavingHistoryPage(1);
                              setSavingHistorySelectedIds({});
                              setShowHistoryRangeMenu(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="savings-history-icon-round"
                    aria-label="Table columns"
                    onClick={() => toast.success('Columns — coming soon')}
                  >
                    <SlidersHorizontal size={17} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <button
                  type="button"
                  className="savings-history-mobile-forward"
                  aria-label="View all transactions"
                  onClick={() => toast.success('Full history — coming soon')}
                >
                  <ChevronRight size={22} strokeWidth={2.25} aria-hidden />
                </button>
              </div>

              <div className="savings-history-table-scroll savings-history-desktop-only">
                {showSavingsLazyLoader ? (
                  <div className="savings-lazy-loader savings-lazy-loader--history">
                    <LoadingIndicator size="md" />
                    <span>Loading transactions…</span>
                  </div>
                ) : savingHistoryRows.length === 0 ? (
                  <div className="savings-empty-state savings-empty-state--history">No savings transactions yet.</div>
                ) : (
                <table className="savings-history-table">
                  <thead>
                    <tr>
                      <th className="savings-history-cell savings-history-cell-check" scope="col">
                        <input
                          type="checkbox"
                          className="savings-history-checkbox"
                          checked={savingHistoryAllChecked}
                          onChange={toggleSavingHistorySelectAll}
                          aria-label="Select all transactions"
                        />
                      </th>
                      <th className="savings-history-cell" scope="col">
                        Transaction
                      </th>
                      <th className="savings-history-cell" scope="col">
                        Transaction ID
                      </th>
                      <th className="savings-history-cell" scope="col">
                        Amount
                      </th>
                      <th className="savings-history-cell" scope="col">
                        Saving Plan
                      </th>
                      <th className="savings-history-cell" scope="col">
                        Status
                      </th>
                      <th className="savings-history-cell" scope="col">
                        Date
                      </th>
                      <th className="savings-history-cell savings-history-cell-action" scope="col">
                        <span className="savings-history-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {savingHistoryRows.map((row) => (
                      <tr key={row.id}>
                        <td className="savings-history-cell savings-history-cell-check">
                          <input
                            type="checkbox"
                            className="savings-history-checkbox"
                            checked={Boolean(savingHistorySelectedIds[row.id])}
                            onChange={() => toggleSavingHistoryRow(row.id)}
                            aria-label={`Select transaction ${row.txShort}…${row.txEnd}`}
                          />
                        </td>
                        <td className="savings-history-cell">
                          <span className="savings-history-tx-received">
                            <span className="savings-history-tx-icon" aria-hidden>
                              <ArrowDown size={12} strokeWidth={2.5} />
                            </span>
                            <span className="savings-history-tx-label">{row.txLabel || 'Received'}</span>
                          </span>
                        </td>
                        <td className="savings-history-cell savings-history-cell-mono savings-history-cell-txid">
                          {row.txShort}…{row.txEnd}
                        </td>
                        <td className="savings-history-cell">{fmtUsdWhole(row.amount)}</td>
                        <td className="savings-history-cell">{row.plan}</td>
                        <td className="savings-history-cell">
                          <span className="savings-history-status-ok">{row.status || 'Successful'}</span>
                        </td>
                        <td className="savings-history-cell savings-history-cell-mono">{row.date}</td>
                        <td className="savings-history-cell savings-history-cell-action">
                          <button
                            type="button"
                            className="savings-history-row-action"
                            aria-label={`View transaction ${row.txShort}`}
                            onClick={() => toast.success('Transaction detail — coming soon')}
                          >
                            <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>

              <nav className="savings-history-pagination savings-history-desktop-only" aria-label="Saving history pagination">
                <button
                  type="button"
                  className="savings-history-page-nav"
                  disabled={showSavingsLazyLoader || savingHistoryRows.length === 0 || savingHistoryPage <= 1}
                  onClick={() => setSavingHistoryPage((p) => Math.max(1, p - HISTORY_PAGE_CHUNK))}
                >
                  ← Prev {HISTORY_PAGE_CHUNK}
                </button>
                <div className="savings-history-page-list">
                  {savingHistoryPaginationStrip.map((p, idx) =>
                    p == null ? (
                      <span key={`e-${idx}`} className="savings-history-page-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`savings-history-page-num ${savingHistoryPage === p ? 'active' : ''}`}
                        onClick={() => setSavingHistoryPage(p)}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  className="savings-history-page-nav"
                  disabled={
                    showSavingsLazyLoader ||
                    savingHistoryRows.length === 0 ||
                    savingHistoryPage >= savingHistoryTotalPages
                  }
                  onClick={() => setSavingHistoryPage((p) => Math.min(savingHistoryTotalPages, p + HISTORY_PAGE_CHUNK))}
                >
                  Next {HISTORY_PAGE_CHUNK} →
                </button>
              </nav>

              <ul className="savings-history-mobile-feed savings-history-mobile-only" aria-label="Recent transactions">
                {showSavingsLazyLoader ? (
                  <li className="savings-lazy-loader savings-lazy-loader--mobile">
                    <LoadingIndicator size="sm" />
                    <span>Loading transactions…</span>
                  </li>
                ) : savingsMobileTxFeed.length === 0 ? (
                  <li className="savings-empty-state">No recent transactions yet.</li>
                ) : (
                  savingsMobileTxFeed.map((item) => (
                    <li key={item.id} className="savings-history-mobile-feed-item">
                      <span className="savings-history-mobile-feed-icon" aria-hidden>
                        <ArrowDown size={14} strokeWidth={2.5} />
                      </span>
                      <div className="savings-history-mobile-feed-main">
                        <p className="savings-history-mobile-feed-title">{item.title}</p>
                        <p className="savings-history-mobile-feed-sub">{item.subtitle}</p>
                      </div>
                      <div className="savings-history-mobile-feed-meta">
                        <span className="savings-history-mobile-feed-status">{item.status}</span>
                        <span className="savings-history-mobile-feed-date">{item.date}</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </main>
      </div>

      <AddSavingsPlanModal
        isOpen={showAddSavingsPlanModal}
        onClose={() => {
          setShowAddSavingsPlanModal(false);
          setAddSavingsPlanForm({ name: '', category: 'Fixed', amount: '', autoSaveAmount: '', autoSaveFrequency: '' });
        }}
        name={addSavingsPlanForm.name}
        onNameChange={(v) => setAddSavingsPlanForm((prev) => ({ ...prev, name: v }))}
        selectedPlan={addSavingsPlanForm.category}
        onSelectPlan={(plan) => setAddSavingsPlanForm((prev) => ({ ...prev, category: plan }))}
        amount={addSavingsPlanForm.amount}
        onAmountChange={(v) => setAddSavingsPlanForm((prev) => ({ ...prev, amount: v }))}
        autoSaveAmount={addSavingsPlanForm.autoSaveAmount}
        onAutoSaveAmountChange={(v) => setAddSavingsPlanForm((prev) => ({ ...prev, autoSaveAmount: v }))}
        autoSaveFrequency={addSavingsPlanForm.autoSaveFrequency}
        onAutoSaveFrequencyChange={(v) =>
          setAddSavingsPlanForm((prev) => ({ ...prev, autoSaveFrequency: v }))
        }
        exchangeRateLine="1 XRP = 1.05 USD"
        onCreate={() => {
          const n = String(addSavingsPlanForm.name || '').trim();
          if (!n) {
            toast.error('Enter a plan name');
            return;
          }
          const planKind = String(addSavingsPlanForm.category || '').trim();
          if (planRequiresGoalAmount(planKind)) {
            const raw = String(addSavingsPlanForm.amount || '').replace(/,/g, '').trim();
            const amt = parseFloat(raw);
            if (!Number.isFinite(amt) || amt <= 0) {
              toast.error('Enter a valid goal amount');
              return;
            }
          }
          if (planIsAutoSavings(planKind)) {
            const autoRaw = String(addSavingsPlanForm.autoSaveAmount || '').replace(/,/g, '').trim();
            const ax = parseFloat(autoRaw);
            if (!Number.isFinite(ax) || ax <= 0) {
              toast.error('Enter a valid AutoSave amount');
              return;
            }
            if (!String(addSavingsPlanForm.autoSaveFrequency || '').trim()) {
              toast.error('Select an autosave frequency');
              return;
            }
          }
          const submitCreateWallet = async () => {
            try {
              setIsCreatingSavingsWallet(true);
              const amountRaw = String(addSavingsPlanForm.amount || '').replace(/,/g, '').trim();
              const targetAmountUsd = Math.max(1, parseFloat(amountRaw) || 5000);
              const targetDate = toYyyyMmDd(new Date(new Date().getFullYear(), 11, 31));
              const payload = await fetchSavingsWithAuth('api/savings/wallets', {
                method: 'POST',
                body: JSON.stringify({
                  name: n,
                  targetAmountUsd,
                  targetDate,
                }),
              });
              toast.success(payload?.message || 'Savings wallet created');
              setShowAddSavingsPlanModal(false);
              setAddSavingsPlanForm({
                name: '',
                category: 'Fixed',
                amount: '',
                autoSaveAmount: '',
                autoSaveFrequency: '',
              });
              setSavingsReloadTick((v) => v + 1);
            } catch (error) {
              toast.error(error?.message || 'Failed to create savings wallet');
            } finally {
              setIsCreatingSavingsWallet(false);
            }
          };
          submitCreateWallet();
        }}
        isSubmitting={isCreatingSavingsWallet}
      />

      <SavingsAddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => {
          setShowAddMoneyModal(false);
          setAddMoneyAmount('');
          setAddMoneyAccountId(savingsPlans[0]?.id ?? '');
        }}
        amount={addMoneyAmount}
        onAmountChange={setAddMoneyAmount}
        accounts={savingsAddMoneyAccounts}
        selectedAccountId={addMoneyAccountId}
        onSelectAccount={setAddMoneyAccountId}
        onTransfer={submitSavingsTransfer}
        isSubmitting={isSubmittingSavingsTransfer}
        balanceLine={isLoadingSavingsData ? 'Loading…' : `${Number(savingsTotalUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
        amountPrefix=""
        amountSuffix="XRP"
      />

      <SavingsWithdrawWalletModal
        isOpen={showWithdrawWalletModal}
        onClose={() => setShowWithdrawWalletModal(false)}
        wallets={savingsWithdrawWallets}
        onConfirmWithdraw={submitSavingsWithdraw}
        isSubmitting={isSubmittingSavingsWithdraw}
      />

      <NotificationCenterModal open={showNotificationModal} onClose={() => setShowNotificationModal(false)} titleId="savings-notifications-title" />
    </>
    </PersonalSidebarWalletProvider>
  );
};

export default Savings;
