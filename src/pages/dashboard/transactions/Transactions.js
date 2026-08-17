import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings,
  HelpCircle,
  Search,
  Bell,
  KeyRound,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Filter,
  Wallet,
  Building2,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  DollarSign,
  X,
  Info,
  ArrowUpDown,
  ExternalLink,
  Copy,
  QrCode,
  Menu,
  CheckCircle,
  Package,
  Trophy,
  ShoppingBag,
  Home,
  PiggyBank,
  Trash2,
  FileText,
  Plus,
  Send,
  Share,
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Transactions.css';
import logo from '../../../assets/images/icons/logo.png';
import googleLogo from '../../../assets/images/icons/google-logo.svg';
import { getApiUrl } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../../utils/notificationsApi';
import { handleLogout } from '../../../utils/logout';
import {
  getDepositNetworksForCurrency,
  extractWalletAddresses,
  resolveDepositAddressFromBalance,
  splitDepositAddressLines,
} from '../../../utils/depositAddressFlow';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import { useWeb3 } from '../../../context/Web3Context';
import LoadingIndicator from '../../../components/LoadingIndicator';
import {
  DashboardBalanceSkeleton,
  DashboardExchangeRatesSkeleton,
  WalletOverviewCardsSkeleton,
  TransactionHistoryCardsSkeleton,
  DashboardEscrowTableSkeleton,
  NotificationListSkeleton,
} from '../../../components/DashboardSkeletons';
import DepositAddressSelectors from '../../../components/DepositAddressSelectors';
import StripeWalletFundCheckout from '../../../components/StripeWalletFundCheckout';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import PersonalSuiteMobileHeader from '../../../components/PersonalSuiteMobileHeader';
import ConnectWalletModal from '../../../components/ConnectWalletModal';
import TransactionSummaryModal from '../../../components/TransactionSummaryModal';
import SavingsAddMoneyModal from '../../../components/SavingsAddMoneyModal';
import AddSavingsPlanModal, { planRequiresGoalAmount } from '../../../components/AddSavingsPlanModal';
import NotificationListItems from '../../../components/NotificationListItems/NotificationListItems';
import { PersonalSidebarWalletProvider, PersonalSidebarWalletNav } from '../../../components/PersonalSidebarWallet';
import {
  buildTransactionFromNotification,
  extractNotificationLookupId,
  findTransactionForNotification,
  isTransactionNotification,
  transactionRecordMatchesEscrowId,
  transactionRecordMatchesId,
} from '../../../utils/transactionDeepLink';
import { getNotificationId } from '../../../utils/notificationItemHelpers';
import {
  assertStripePublishableKey,
  createStripeFundingIntent,
  resolveStripeSuiteContext,
} from '../../../utils/stripeWalletFunding';

const DepositGooglePayMark = () => (
  <span className="fund-method-payment-mark fund-method-payment-mark--google" aria-hidden>
    <img src={googleLogo} alt="" className="fund-method-payment-logo" />
    <span className="fund-method-payment-logo-text fund-method-payment-logo-text--google">Pay</span>
  </span>
);

const DepositApplePayMark = () => (
  <span className="fund-method-payment-mark fund-method-payment-mark--apple" aria-hidden>
    <svg className="fund-method-payment-logo" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M17.05 12.06c.01 2.56 2.24 3.41 2.26 3.42-.02.06-.36 1.23-1.19 2.43-.72 1.04-1.47 2.07-2.65 2.09-1.16.02-1.53-.69-2.86-.69-1.33 0-1.74.67-2.84.71-1.14.04-2.01-1.14-2.74-2.17-1.5-2.16-2.65-6.09-1.11-8.77.76-1.33 2.12-2.18 3.6-2.2 1.12-.02 2.18.75 2.86.75.68 0 1.95-.93 3.29-.79.56.02 2.14.23 3.16 1.72-.08.05-1.89 1.1-1.88 3.5zm-2.58-6.15c.6-.73 1.01-1.74.9-2.75-.86.03-1.91.57-2.53 1.3-.56.65-1.05 1.69-.92 2.68.96.08 1.95-.48 2.55-1.23z"
        fill="currentColor"
      />
    </svg>
    <span className="fund-method-payment-logo-text fund-method-payment-logo-text--apple">Pay</span>
  </span>
);

const STRIPE_DEPOSIT_METHODS = new Set(['googlepay', 'applepay']);

const getBeneficiaryTrustitag = (beneficiary) =>
  beneficiary?.trustitag || beneficiary?.tag || beneficiary?.handle || beneficiary?.username || '';

const getBeneficiaryDisplayName = (beneficiary) => {
  const tag = getBeneficiaryTrustitag(beneficiary);
  const name = typeof beneficiary?.name === 'string' ? beneficiary.name.trim() : '';
  if (name && name !== tag) return name;
  return tag ? tag.replace(/^@/, '') : 'Trustitag';
};

const getBeneficiaryTrustitagId = (beneficiary) => {
  const explicit =
    beneficiary?.trustitagId ||
    beneficiary?.tagId ||
    beneficiary?.trustitagCode ||
    beneficiary?.code;
  if (explicit) return String(explicit).replace(/^@/, '');

  const tag = getBeneficiaryTrustitag(beneficiary);
  if (/^TG/i.test(tag)) return tag.replace(/^@/, '');

  const numericId = String(beneficiary?.id ?? '').replace(/\D/g, '');
  if (numericId) return `TG${numericId.padStart(10, '0').slice(-10)}`;

  return tag ? tag.replace(/^@/, '') : '—';
};

const getBeneficiaryInitials = (beneficiary) => {
  if (typeof beneficiary?.initials === 'string' && beneficiary.initials.trim()) {
    return beneficiary.initials.trim().slice(0, 2).toUpperCase();
  }
  const tag = getBeneficiaryTrustitag(beneficiary) || beneficiary?.name || '';
  return (
    tag
      .replace(/^@/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase() || '??'
  );
};

const getBeneficiaryAvatarUrl = (beneficiary) =>
  getProfileAvatarUrl(beneficiary) ||
  (typeof beneficiary?.avatar === 'string' ? beneficiary.avatar.trim() : null) ||
  null;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getBeneficiaryDeleteKey = (beneficiary) => {
  const id = beneficiary?.id != null ? String(beneficiary.id) : '';
  if (id && UUID_PATTERN.test(id)) return id;

  const trustitagId = getBeneficiaryTrustitagId(beneficiary);
  if (trustitagId && trustitagId !== '—') return trustitagId.replace(/^@/, '');

  if (id && !id.startsWith('local-')) return id;

  const trustitag = getBeneficiaryTrustitag(beneficiary);
  if (trustitag) return trustitag.replace(/^@/, '');

  return null;
};

const formatTimeAgo = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const time = date.getTime();
  if (!Number.isFinite(time)) return 'N/A';
  const diffMs = Date.now() - time;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/** Short month names for cashflow X-axis (Jan–Dec). */
const CASHFLOW_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 0–11 or null — prefers period/label before dates so rows don’t all inherit the same endDate month. */
const parseCashflowPeriodToMonthIndex = (raw) => {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  if (/^\d{1,2}$/.test(s)) {
    const m = parseInt(s, 10);
    if (m >= 1 && m <= 12) return m - 1;
  }

  const head3 = s.slice(0, 3).toLowerCase();
  const byAbbr = CASHFLOW_MONTH_SHORT.findIndex((abbr) => abbr.toLowerCase() === head3);
  if (byAbbr >= 0) return byAbbr;

  const ym = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (ym) {
    const m = parseInt(ym[2], 10) - 1;
    if (m >= 0 && m <= 11) return m;
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.getMonth();

  return null;
};

const cashflowPointMonthIndex = (point) => {
  const candidates = [
    point?.period,
    point?.label,
    point?.month,
    point?.monthLabel,
    point?.startDate,
    point?.endDate,
    point?.start,
    point?.end,
  ];
  for (const c of candidates) {
    const idx = parseCashflowPeriodToMonthIndex(c);
    if (idx !== null) return idx;
  }
  return null;
};

/**
 * Merge API points into 12 calendar months (Jan–Dec). Sums USD when several rows hit one month.
 * If there are exactly 12 rows and every row parses to the same month (or none parse), treat as Jan–Dec in order.
 */
const mergeCashflowPointsIntoCalendarMonths = (points) => {
  const slots = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    receivedUsd: 0,
    spentUsd: 0,
  }));

  if (!Array.isArray(points) || points.length === 0) return slots;

  const indices = points.map((p) => cashflowPointMonthIndex(p));
  const nonNull = indices.filter((x) => x !== null);
  const uniqueNonNull = new Set(nonNull);

  const forceSequentialJanDec =
    points.length === 12 && (nonNull.length === 0 || (nonNull.length === 12 && uniqueNonNull.size === 1));

  points.forEach((p, i) => {
    let mi = cashflowPointMonthIndex(p);
    if (forceSequentialJanDec) {
      mi = i;
    }
    if (mi === null || mi < 0 || mi > 11) return;
    const receivedUsd = typeof p?.receivedUsd === 'number' ? p.receivedUsd : Number(p?.receivedUsd) || 0;
    const spentUsd = typeof p?.spentUsd === 'number' ? p.spentUsd : Number(p?.spentUsd) || 0;
    slots[mi].receivedUsd += receivedUsd;
    slots[mi].spentUsd += spentUsd;
  });

  return slots;
};

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
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

const supportNav = [{ label: 'Settings', icon: Settings }];

/** Same routes as Dashboard.js sidebar so Transactions shows the same items and links. */
function getGeneralNavTargetPath(itemLabel, accountType) {
  const routes = {
    Dashboard: '/dashboard',
    'My Escrow': '/my-escrow',
    Transactions: '/transactions',
    Transaction: '/transactions',
    Savings: '/savings',
    Trusticard: '/trusticard',
    Payroll: '/payroll',
    'Supplier Contract': '/supplier-contract',
    Invoice: '/invoice',
    Compliance: null,
    'P2P trading': null
  };
  if (itemLabel === 'Dispute') {
    return accountType === 'Business Suite' ? '/business-dispute' : '/dispute';
  }
  return routes[itemLabel] ?? null;
}

function isGeneralNavItemActive(itemLabel, pathname, accountType) {
  const targetPath = getGeneralNavTargetPath(itemLabel, accountType);
  if (!targetPath) return false;
  if (targetPath === '/dispute' || targetPath === '/business-dispute') {
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  }
  if (targetPath === '/payroll') {
    return pathname === '/payroll' || pathname.startsWith('/payroll/');
  }
  return pathname === targetPath;
}

function handleGeneralNavClick({
  itemLabel,
  accountType,
  navigate,
  setShowDesktopSavingsDashboard,
  closeMobileMenu
}) {
  if (typeof closeMobileMenu === 'function') closeMobileMenu();
  if (typeof setShowDesktopSavingsDashboard === 'function') {
    if (itemLabel === 'Savings') {
      setShowDesktopSavingsDashboard(true);
    } else {
      setShowDesktopSavingsDashboard(false);
    }
  }
  const targetPath = getGeneralNavTargetPath(itemLabel, accountType);
  if (!targetPath) return;
  if (itemLabel === 'Transactions' && accountType === 'Business Suite') {
    navigate('/transactions', { state: { accountType: 'Business Suite' } });
    return;
  }
  navigate(targetPath);
}

function getDeveloperNavPath(itemLabel) {
  if (itemLabel === 'Api Keys') return '/api-keys';
  if (itemLabel === 'Sand box enviroment') return '/sandbox-environment';
  if (itemLabel === 'Web hook') return '/webhook';
  return null;
}

const Transactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading, openTrustiscoreModal } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const { account, isConnected, isWalletConnectedViaAPI } = useWeb3();
  const [showBalance, setShowBalance] = useState(true);
  const [accountType, setAccountType] = useState(() => {
    const navType = location.state?.accountType;
    if (navType === 'Business Suite' || navType === 'Personal') return navType;
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Personal';
  });
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsTotal] = useState(0);
  const [, setNotificationsUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);
  const [kycComplete] = useState(true);

  const notificationsApiFilter = useMemo(() => (notificationFilter === 'Unread' ? 'unread' : 'all'), [notificationFilter]);

  useEffect(() => {
    if (!showNotificationModal) setExpandedNotificationId(null);
  }, [showNotificationModal]);
  
  // Fetch notifications for the modal (All / Unread)
  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      if (!showNotificationModal) return;
      if (isSessionExpired) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnreadCount(0);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnreadCount(0);
        return;
      }

      setIsLoadingNotifications(true);
      try {
        const data = await getNotifications({ token, filter: notificationsApiFilter, page: 1, pageSize: 10 });
        if (cancelled) return;
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setNotificationsTotal(Number(data?.total) || 0);
        setNotificationsUnreadCount(Number(data?.unreadCount) || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        if (!cancelled) {
          setNotifications([]);
          setNotificationsTotal(0);
          setNotificationsUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNotifications(false);
        }
      }
    };

    fetchNotifications();
    return () => {
      cancelled = true;
    };
  }, [showNotificationModal, isSessionExpired, notificationsApiFilter]);

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId) return;
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await markNotificationRead({ token, id: notificationId });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') {
          return prev.filter((n) => n?.id !== notificationId);
        }
        return prev.map((n) => (n?.id === notificationId ? { ...n, isRead: true } : n));
      });
      setNotificationsUnreadCount((prev) => Math.max(0, (Number(prev) || 0) - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await markAllNotificationsRead({ token });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') return [];
        return prev.map((n) => ({ ...n, isRead: true }));
      });
      setNotificationsUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [walletBalances, setWalletBalances] = useState(null);
  /** Custodial wallet UUIDs from GET api/wallet/balance when provided (for savings transfer sourceWalletId). */
  const [custodialWalletIds, setCustodialWalletIds] = useState({ xrp: '', usdt: '' });
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [isSubmittingSavingsTransfer, setIsSubmittingSavingsTransfer] = useState(false);
  const [isSubmittingSavingsWithdraw, setIsSubmittingSavingsWithdraw] = useState(false);
  const [deletingSavingsWalletId, setDeletingSavingsWalletId] = useState(null);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userRole, setUserRole] = useState('Freelancer');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [isLoadingBusinessIdentity, setIsLoadingBusinessIdentity] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(true);
  const [showTransactionDetailsModal, setShowTransactionDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Add state for TransactionSummaryModal

  const [linkedAccounts, setLinkedAccounts] = useState(null);
  const [isLoadingLinkedAccounts, setIsLoadingLinkedAccounts] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [monthlyFilter, setMonthlyFilter] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFundMethodModal, setShowFundMethodModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [fundWalletForm, setFundWalletForm] = useState({
    amount: '',
    currency: 'XRP'
  });
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [fundingStep, setFundingStep] = useState('idle');
  const [transactionData, setTransactionData] = useState(null);
  const [fundViaAddress, setFundViaAddress] = useState(false);
  const [fundDepositPaymentMethod, setFundDepositPaymentMethod] = useState(null);
  const [stripeFundSession, setStripeFundSession] = useState(null);
  const [depositAddressNetwork, setDepositAddressNetwork] = useState('XRPL');
  const [walletAddress, setWalletAddress] = useState('');
  /** Last successful GET wallet/balance JSON (used to resolve deposit address by currency/network). */
  const [walletBalanceRaw, setWalletBalanceRaw] = useState(null);
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [showSavingsWithdrawModal, setShowSavingsWithdrawModal] = useState(false);
  const [showSavingsWithdrawConfirmModal, setShowSavingsWithdrawConfirmModal] = useState(false);
  const [selectedWithdrawWallet, setSelectedWithdrawWallet] = useState(null);
  const [showSavingsAddMoneyModal, setShowSavingsAddMoneyModal] = useState(false);
  const [savingsAddMoneyForm, setSavingsAddMoneyForm] = useState({
    amount: '',
    savingAccount: 'My Goals',
    walletId: '',
  });
  const [showAddSavingsAccountModal, setShowAddSavingsAccountModal] = useState(false);
  const [addSavingsAccountForm, setAddSavingsAccountForm] = useState({
    name: '',
    category: 'Fixed',
    duration: '',
    amount: '',
    autoSaveAmount: '',
    autoSaveFrequency: '',
  });
  const [isCreatingSavingsAccount, setIsCreatingSavingsAccount] = useState(false);
  const [withdrawWalletForm, setWithdrawWalletForm] = useState({
    amount: '',
    currency: 'USD',
    destinationAddress: ''
  });
  const [isWithdrawingWallet, setIsWithdrawingWallet] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showSwapPreviewModal, setShowSwapPreviewModal] = useState(false);
  const [showSwapSummaryModal, setShowSwapSummaryModal] = useState(false);
  const [swapPreviewData, setSwapPreviewData] = useState(null);
  const [swapForm, setSwapForm] = useState({
    fromCurrency: 'XRP',
    toCurrency: 'USDT',
    fromAmount: '',
    toAmount: ''
  });
  const [isSwapping, setIsSwapping] = useState(false);
  const [isFetchingSwapQuote, setIsFetchingSwapQuote] = useState(false);
  const [useDEX, setUseDEX] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState(5);
  const swapQuoteTimeoutRef = useRef(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSendPage, setShowSendPage] = useState(false);
  const [showTransactionSummaryModal, setShowTransactionSummaryModal] = useState(false);
  const [showFundWalletTransferModal, setShowFundWalletTransferModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showSavingsPage, setShowSavingsPage] = useState(false);
  const [showSavingsSummary, setShowSavingsSummary] = useState(false);
  const [showDesktopSavingsDashboard, setShowDesktopSavingsDashboard] = useState(location.pathname === '/savings');
  const [savingsAmount, setSavingsAmount] = useState('');
  /** Savings cashflow: GET api/savings/cashflow?range=...&interval=weekly (interval optional) */
  const [cashflowRange, setCashflowRange] = useState('this_month');
  const [cashflowInterval, setCashflowInterval] = useState('monthly'); // monthly | weekly
  const [showFundWalletPage, setShowFundWalletPage] = useState(false);
  const [showFundWalletSummary, setShowFundWalletSummary] = useState(false);
  const [fundWalletNetwork, setFundWalletNetwork] = useState('');
  const [fundWalletAmount, setFundWalletAmount] = useState('');
  const [sendForm, setSendForm] = useState({
    fromWallet: 'XRP',
    fromAmount: '',
    toCurrency: 'EUR',
    toAmount: '',
    recipientTrustitag: '',
    recipientFullName: '',
    recipientPhone: '',
    reason: ''
  });
  const [sendExchangeRate, setSendExchangeRate] = useState(null);
  const [isLoadingSendRate, setIsLoadingSendRate] = useState(false);
  const [showToCurrencyDropdown, setShowToCurrencyDropdown] = useState(false);
  const [lastEditedField, setLastEditedField] = useState(null); // 'from' or 'to'
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [addBeneficiaryTrustitag, setAddBeneficiaryTrustitag] = useState('');
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [showRemoveBeneficiaryModal, setShowRemoveBeneficiaryModal] = useState(false);
  const [beneficiaryToRemove, setBeneficiaryToRemove] = useState(null);
  const [isRemovingBeneficiary, setIsRemovingBeneficiary] = useState(false);

  useEffect(() => {
    if (!showAddBeneficiaryModal) {
      setAddBeneficiaryTrustitag('');
    }
  }, [showAddBeneficiaryModal]);

  useEffect(() => {
    if (!location.state?.openSendModal) return;
    setShowSendModal(true);
    const prev = location.state && typeof location.state === 'object' ? { ...location.state } : {};
    delete prev.openSendModal;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: prev });
  }, [location.state?.openSendModal, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!location.state?.openSwapModal) return;
    setShowSwapModal(true);
    const prev = location.state && typeof location.state === 'object' ? { ...location.state } : {};
    delete prev.openSwapModal;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: prev });
  }, [location.state?.openSwapModal, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!showFundWalletModal || !fundViaAddress) return;
    const keys = getDepositNetworksForCurrency(fundWalletForm.currency);
    setDepositAddressNetwork((prev) => (keys.includes(prev) ? prev : keys[0]));
  }, [showFundWalletModal, fundViaAddress, fundWalletForm.currency]);

  // Available currencies for the send modal
  const availableCurrencies = [
    { code: 'USD', name: 'USD', flag: 'us', symbol: '$' },
    { code: 'EUR', name: 'EUR', flag: 'eu', symbol: '€' },
    { code: 'GBP', name: 'GBP', flag: 'gb', symbol: '£' },
    { code: 'JPY', name: 'JPY', flag: 'jp', symbol: '¥' },
    { code: 'NGN', name: 'NGN', flag: 'ng', symbol: '₦' },
    { code: 'CAD', name: 'CAD', flag: 'ca', symbol: 'C$' },
    { code: 'AUD', name: 'AUD', flag: 'au', symbol: 'A$' },
    { code: 'CNY', name: 'CNY', flag: 'cn', symbol: '¥' },
  ];

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  // Savings (API-backed) state
  const [savingsSummaryRange] = useState('this_month');
  const [isLoadingSavingsSummary, setIsLoadingSavingsSummary] = useState(false);
  const [savingsSummary, setSavingsSummary] = useState(null);

  const [isLoadingSavingsCashflow, setIsLoadingSavingsCashflow] = useState(false);
  const [savingsCashflow, setSavingsCashflow] = useState({ interval: 'monthly', points: [] });

  const [isLoadingSavingsWallets, setIsLoadingSavingsWallets] = useState(false);
  const [savingsWallets, setSavingsWallets] = useState([]);

  const [isLoadingSavingsTransactions, setIsLoadingSavingsTransactions] = useState(false);
  const [savingsTransactionsTotal, setSavingsTransactionsTotal] = useState(0);
  const [savingsTransactionsPage, setSavingsTransactionsPage] = useState(1);
  const [savingsTransactionsDirection, setSavingsTransactionsDirection] = useState('all'); // all | received | spent
  const [savingsTransactionsRange, setSavingsTransactionsRange] = useState('monthly'); // daily | weekly | monthly
  const [savingsTransactionsWalletId] = useState('');
  const [savingHistory, setSavingHistory] = useState([]);

  const isSavingsDashboardActive = location.pathname === '/savings' || showDesktopSavingsDashboard;
  const normalizeCompanyLogoUrl = useCallback((data) => {
    const raw =
      data?.companyLogoUrl ||
      data?.logoUrl ||
      data?.companyLogo ||
      data?.businessLogo ||
      data?.logo ||
      '';
    if (!raw || typeof raw !== 'string') return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = getApiUrl('').replace(/\/$/, '');
    return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }, []);

  const isBusinessSuiteAccount = accountType === 'Business Suite';
  const dashboardSummaryEndpoint = isBusinessSuiteAccount
    ? 'api/business-suite/dashboard/summary'
    : 'api/dashboard/summary';
  const walletBalanceEndpoint = isBusinessSuiteAccount
    ? 'api/business-suite/wallet/balance'
    : 'api/wallet/balance';
  const headerName = isBusinessSuiteAccount ? businessCompanyName : userFullName;
  const headerAvatar = isBusinessSuiteAccount ? businessCompanyLogoUrl : userAvatar;
  const headerInitials = isBusinessSuiteAccount
    ? (businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—')
    : userInitials;
  const headerRole = isBusinessSuiteAccount ? 'Business' : userRole;
  const isLoadingHeaderIdentity = isBusinessSuiteAccount ? isLoadingBusinessIdentity : isLoadingUserProfile;

  const formatUsd = useMemo(() => {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (value) => {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) return 'N/A';
      return formatter.format(num);
    };
  }, []);

  const formatUsdNoCents = useMemo(() => {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return (value) => {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num)) return 'N/A';
      return formatter.format(num);
    };
  }, []);

  const formatSignedPercent = (value) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return 'N/A';
    const rounded = Number.isInteger(num) ? num : Number(num.toFixed(1));
    return `${rounded > 0 ? '+' : ''}${rounded}%`;
  };

  const savingsWalletColorById = useMemo(() => {
    const map = {};
    savingsWallets.forEach((wallet) => {
      if (wallet?.id) map[wallet.id] = wallet.color;
    });
    return map;
  }, [savingsWallets]);

  const savingsAllocation = useMemo(() => {
    const palette = ['#2F74FF', '#10b981', '#9333ea', '#f59e0b', '#ef4444', '#06b6d4'];
    const categories = Array.isArray(savingsSummary?.categories) ? savingsSummary.categories : [];
    return categories.map((category, index) => {
      const amountUsd = typeof category?.amountUsd === 'number' ? category.amountUsd : Number(category?.amountUsd) || 0;
      const percentage = typeof category?.percentage === 'number' ? category.percentage : Number(category?.percentage) || 0;
      const walletId = category?.walletId;
      return {
        walletId,
        name: category?.name || '—',
        amount: amountUsd,
        percentage,
        color: (walletId && savingsWalletColorById[walletId]) || palette[index % palette.length],
      };
    });
  }, [savingsSummary, savingsWalletColorById]);

  /** Bar height = % of total savings (same basis as allocation %). X-axis = full Jan–Dec with data merged per month. */
  const cashflowData = useMemo(() => {
    const points = Array.isArray(savingsCashflow?.points) ? savingsCashflow.points : [];
    const slots = mergeCashflowPointsIntoCalendarMonths(points);

    const totalUsdFromSummary =
      typeof savingsSummary?.totalUsd === 'number' ? savingsSummary.totalUsd : Number(savingsSummary?.totalUsd) || 0;
    const totalFromAllocationAmounts = savingsAllocation.reduce(
      (sum, row) => sum + (typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0),
      0,
    );
    const allocationPercentTotal = savingsAllocation.reduce(
      (sum, row) => sum + (typeof row.percentage === 'number' ? row.percentage : Number(row.percentage) || 0),
      0,
    );
    const totalUsdDenominator = totalUsdFromSummary > 0 ? totalUsdFromSummary : totalFromAllocationAmounts;
    const useAllocationBasedScale = totalUsdDenominator > 0;
    const yAxisPercentScale = allocationPercentTotal > 0 ? allocationPercentTotal : 100;

    const values = slots.flatMap((s) => [s.receivedUsd, s.spentUsd]);
    const maxInSeries = Math.max(...values, 0);

    return slots.map((slot) => {
      const { monthIndex, receivedUsd, spentUsd } = slot;

      let received;
      let spent;
      if (useAllocationBasedScale) {
        const r = (receivedUsd / totalUsdDenominator) * yAxisPercentScale;
        const s = (spentUsd / totalUsdDenominator) * yAxisPercentScale;
        received = Math.min(100, Math.max(0, r));
        spent = Math.min(100, Math.max(0, s));
      } else {
        received = maxInSeries > 0 ? (receivedUsd / maxInSeries) * 100 : 0;
        spent = maxInSeries > 0 ? (spentUsd / maxInSeries) * 100 : 0;
      }

      return {
        month: CASHFLOW_MONTH_SHORT[monthIndex],
        received,
        spent,
        receivedUsd,
        spentUsd,
      };
    });
  }, [savingsCashflow, savingsSummary, savingsAllocation]);

  useEffect(() => {
    if (!isSavingsDashboardActive) return;
    console.log('[TrustiChain] Savings cashflow chart', {
      range: cashflowRange,
      interval: cashflowInterval,
      rawApi: savingsCashflow,
      seriesForBars: cashflowData,
    });
  }, [isSavingsDashboardActive, cashflowRange, cashflowInterval, savingsCashflow, cashflowData]);

  const savingsWalletStylePresets = [
    { icon: Trophy, color: '#2F74FF' },
    { icon: Home, color: '#10b981' },
    { icon: ShoppingBag, color: '#9333ea' },
    { icon: Package, color: '#f59e0b' },
  ];

  const hashStringToIndex = (value, modulo) => {
    if (!value || !modulo) return 0;
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash % modulo;
  };

  const mapSavingsWalletApiToUi = (wallet, fallbackIndex) => {
    const styleIndex = wallet?.id
      ? hashStringToIndex(String(wallet.id), savingsWalletStylePresets.length)
      : fallbackIndex % savingsWalletStylePresets.length;
    const style = savingsWalletStylePresets[styleIndex] || savingsWalletStylePresets[0];

    const percentageNum = typeof wallet?.percentage === 'number' ? wallet.percentage : Number(wallet?.percentage) || 0;
    const amountUsd = typeof wallet?.amountUsd === 'number' ? wallet.amountUsd : Number(wallet?.amountUsd) || 0;
    const targetAmountUsd =
      typeof wallet?.targetAmountUsd === 'number' ? wallet.targetAmountUsd : Number(wallet?.targetAmountUsd) || 0;

    return {
      id: wallet?.id ? String(wallet.id) : `wallet-${fallbackIndex}`,
      name: wallet?.name || `Wallet ${fallbackIndex + 1}`,
      percentage: `${percentageNum}%`,
      saved: formatUsdNoCents(amountUsd),
      icon: style.icon,
      color: style.color,
      targetAmountUsd,
    };
  };

  const resetSavingsAddMoneyForm = useCallback(() => {
    setSavingsAddMoneyForm({
      amount: '',
      savingAccount: 'My Goals',
      walletId: '',
    });
  }, []);

  const openSavingsAddMoneyForWallet = useCallback((wallet) => {
    if (wallet?.isPlaceholder) return;
    setSavingsAddMoneyForm({
      amount: '',
      savingAccount: wallet?.name || 'My Goals',
      walletId: wallet?.id ? String(wallet.id) : '',
    });
    setShowSavingsAddMoneyModal(true);
  }, []);

  const openSavingsAddMoneyDefault = useCallback(() => {
    if (savingsWallets.length > 0 && !savingsWallets[0].isPlaceholder) {
      openSavingsAddMoneyForWallet(savingsWallets[0]);
    } else {
      resetSavingsAddMoneyForm();
      const first = savingsWallets.find((w) => w && !w.isPlaceholder);
      if (first) {
        setSavingsAddMoneyForm({
          amount: '',
          savingAccount: first.name || 'My Goals',
          walletId: String(first.id),
        });
      }
      setShowSavingsAddMoneyModal(true);
    }
  }, [savingsWallets, openSavingsAddMoneyForWallet, resetSavingsAddMoneyForm]);

  const resetAddSavingsAccountForm = useCallback(() => {
    setAddSavingsAccountForm({
      name: '',
      category: 'Fixed',
      duration: '',
      amount: '',
      autoSaveAmount: '',
      autoSaveFrequency: '',
    });
  }, []);

  // Update accountType from location state
  useEffect(() => {
    if (location.state?.accountType) {
      setAccountType(location.state.accountType);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem('dashboard_account_type', accountType);
  }, [accountType]);

  useEffect(() => {
    if (accountType !== 'Business Suite' || isSessionExpired) {
      setIsLoadingBusinessIdentity(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingBusinessIdentity(false);
      return;
    }

    let cancelled = false;
    setIsLoadingBusinessIdentity(true);

    const fetchBusinessIdentity = async () => {
      try {
        const endpoints = [
          'api/business-suite/kyc',
          'api/business-suite/kyc/status',
          'api/business-suite/profile/details',
        ];

        for (const endpoint of endpoints) {
          const response = await fetch(getApiUrl(endpoint), {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!response.ok) continue;

          const result = await response.json().catch(() => ({}));
          if (!result?.success || !result?.data || cancelled) continue;

          const data = result.data;
          const resolvedName =
            (typeof data.companyName === 'string' && data.companyName.trim()) ||
            (typeof data.businessName === 'string' && data.businessName.trim()) ||
            (typeof data.teamName === 'string' && data.teamName.trim()) ||
            '';
          const resolvedLogo = normalizeCompanyLogoUrl(data);

          setBusinessCompanyName((prev) => resolvedName || prev || '');
          setBusinessCompanyLogoUrl((prev) => resolvedLogo || prev || '');

          if (resolvedName || resolvedLogo) break;
        }
      } catch (error) {
        console.error('Error fetching business identity:', error);
      } finally {
        if (!cancelled) setIsLoadingBusinessIdentity(false);
      }
    };

    fetchBusinessIdentity();
    return () => {
      cancelled = true;
    };
  }, [accountType, isSessionExpired, normalizeCompanyLogoUrl]);

  // Show savings screen if on /savings route
  useEffect(() => {
    if (location.pathname === '/savings') {
      setShowDesktopSavingsDashboard(true);
    } else {
      setShowDesktopSavingsDashboard(false);
    }
  }, [location.pathname]);

  // Savings endpoints (only when Savings dashboard is visible)
  useEffect(() => {
    if (!isSavingsDashboardActive) return;
    if (isSessionExpired) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const controller = new AbortController();

    const fetchSavingsSummary = async () => {
      setIsLoadingSavingsSummary(true);
      try {
        const params = new URLSearchParams();
        if (savingsSummaryRange) params.set('range', savingsSummaryRange);

        const apiUrl = `${getApiUrl('api/savings/summary')}${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        const result = await response.json().catch(() => ({}));
        if (response.ok && result?.success && result?.data) {
          setSavingsSummary(result.data);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error fetching savings summary:', error);
        }
      } finally {
        setIsLoadingSavingsSummary(false);
      }
    };

    fetchSavingsSummary();
    return () => controller.abort();
  }, [isSavingsDashboardActive, isSessionExpired, savingsSummaryRange]);

  useEffect(() => {
    if (!isSavingsDashboardActive) return;
    if (isSessionExpired) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const controller = new AbortController();

    const fetchSavingsWallets = async () => {
      setIsLoadingSavingsWallets(true);
      try {
        const apiUrl = getApiUrl('api/savings/wallets');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        const result = await response.json().catch(() => ({}));
        if (response.ok && result?.success && result?.data?.wallets) {
          const wallets = Array.isArray(result.data.wallets) ? result.data.wallets : [];
          setSavingsWallets(wallets.map((w, idx) => mapSavingsWalletApiToUi(w, idx)));
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error fetching savings wallets:', error);
        }
      } finally {
        setIsLoadingSavingsWallets(false);
      }
    };

    fetchSavingsWallets();
    return () => controller.abort();
  }, [isSavingsDashboardActive, isSessionExpired]);

  useEffect(() => {
    if (!isSavingsDashboardActive) return;
    if (isSessionExpired) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const controller = new AbortController();
    let cancelled = false;

    const fetchSavingsCashflow = async () => {
      setIsLoadingSavingsCashflow(true);
      try {
        const params = new URLSearchParams();
        params.set('range', cashflowRange);
        if (cashflowInterval === 'weekly') {
          params.set('interval', 'weekly');
        }

        const apiUrl = `${getApiUrl('api/savings/cashflow')}?${params.toString()}`;
        console.log('[TrustiChain] Savings cashflow request', { url: apiUrl, range: cashflowRange, interval: cashflowInterval });

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          cache: 'no-store',
        });

        const result = await response.json().catch(() => ({}));
        if (cancelled) return;

        console.log('[TrustiChain] Savings cashflow response', {
          ok: response.ok,
          status: response.status,
          success: result?.success,
          data: result?.data,
        });

        if (response.ok && result?.success && result?.data) {
          setSavingsCashflow(result.data);
        } else {
          setSavingsCashflow({ interval: cashflowInterval, points: [] });
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
        if (!cancelled) {
          console.error('Error fetching savings cashflow:', error);
          setSavingsCashflow({ interval: cashflowInterval, points: [] });
        }
      } finally {
        if (!cancelled) setIsLoadingSavingsCashflow(false);
      }
    };

    fetchSavingsCashflow();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isSavingsDashboardActive, isSessionExpired, cashflowRange, cashflowInterval]);

  useEffect(() => {
    if (!isSavingsDashboardActive) return;
    if (isSessionExpired) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const controller = new AbortController();

    const fetchSavingsTransactions = async () => {
      setIsLoadingSavingsTransactions(true);
      try {
        const params = new URLSearchParams();
        if (savingsTransactionsWalletId) params.set('walletId', savingsTransactionsWalletId);
        params.set('direction', savingsTransactionsDirection || 'all');
        params.set('range', savingsTransactionsRange || 'monthly');
        params.set('page', String(savingsTransactionsPage || 1));
        params.set('pageSize', String(itemsPerPage || 10));

        const apiUrl = `${getApiUrl('api/savings/transactions')}?${params.toString()}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        const result = await response.json().catch(() => ({}));
        if (response.ok && result?.success && result?.data) {
          const transactions = Array.isArray(result.data.transactions) ? result.data.transactions : [];
          const mapped = transactions.map((tx) => {
            const amountUsd = typeof tx?.amountUsd === 'number' ? tx.amountUsd : Number(tx?.amountUsd) || 0;
            return {
              id: tx?.txHash || tx?.id || '—',
              amount: formatUsdNoCents(amountUsd),
              status: tx?.status || '—',
              date: tx?.date || '—',
              type: tx?.txLabel || '—',
              direction: tx?.direction || 'all',
              walletId: tx?.walletId,
              walletName: tx?.walletName,
            };
          });

          setSavingHistory(mapped);
          setSavingsTransactionsTotal(typeof result.data.total === 'number' ? result.data.total : mapped.length);
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Error fetching savings transactions:', error);
        }
      } finally {
        setIsLoadingSavingsTransactions(false);
      }
    };

    fetchSavingsTransactions();
    return () => controller.abort();
  }, [
    isSavingsDashboardActive,
    isSessionExpired,
    savingsTransactionsDirection,
    savingsTransactionsRange,
    savingsTransactionsPage,
    itemsPerPage,
    savingsTransactionsWalletId,
    formatUsdNoCents,
  ]);

  // Fetch dashboard summary for total balance
  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        if (isSessionExpired) {
          setIsLoadingDashboard(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingDashboard(false);
          return;
        }

        const apiUrl = getApiUrl(dashboardSummaryEndpoint);
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
            setDashboardData(result.data);
          } else {
            setDashboardData(null);
          }
        } else {
          setDashboardData(null);
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        setDashboardData(null);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboardSummary();
  }, [isSessionExpired, dashboardSummaryEndpoint]);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('Freelancer');
        setUserAvatar(null);
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserAvatar(null);
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
            persistTrustitagFromProfileResponse(result);
            const data = result.data;
            const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || 'Sarah Chen';
            setUserFullName(fullName);

            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = 'SC';
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
            
            // Set user role if available
            const role = data.role || data.userRole || 'Freelancer';
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

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingRates(false);
          return;
        }

        const apiUrl = getApiUrl('api/exchange/rates');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && Array.isArray(result?.data?.rates)) {
            setExchangeRates(result.data.rates);
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  // Fetch external exchange rate when send modal opens or currencies change
  useEffect(() => {
    if (showSendModal && sendForm.fromWallet && sendForm.toCurrency) {
      fetchExternalExchangeRate(sendForm.fromWallet, sendForm.toCurrency);
    } else if (!showSendModal) {
      setSendExchangeRate(null);
    }
  }, [showSendModal, sendForm.fromWallet, sendForm.toCurrency]);

  // Calculate toAmount when fromAmount changes (if fromAmount was last edited)
  useEffect(() => {
    if (lastEditedField === 'from' && sendForm.fromAmount && sendExchangeRate && parseFloat(sendForm.fromAmount) > 0) {
      const calculated = parseFloat(sendForm.fromAmount) * sendExchangeRate;
      setSendForm(prev => ({ ...prev, toAmount: calculated.toFixed(2) }));
    } else if (lastEditedField === 'from' && (!sendForm.fromAmount || parseFloat(sendForm.fromAmount) === 0)) {
      setSendForm(prev => ({ ...prev, toAmount: '' }));
    }
  }, [sendForm.fromAmount, sendExchangeRate, lastEditedField]);

  // Handle currency change
  const handleToCurrencyChange = (currencyCode) => {
    setSendForm(prev => ({ ...prev, toCurrency: currencyCode }));
    setShowToCurrencyDropdown(false);
    setLastEditedField(null); // Reset edit tracking when currency changes
  };

  // POST /api/wallet/send/trustitag — send to recipient by Trustitag
  const handleSendTransfer = async () => {
    if (!sendForm.fromAmount || parseFloat(sendForm.fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const tag = sendForm.recipientTrustitag.trim();
    if (!tag || tag.length < 3) {
      toast.error('Please enter a valid wallet address, bank details, or Trustitag');
      return;
    }

    setIsProcessingTransfer(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        setIsProcessingTransfer(false);
        return;
      }

      const apiUrl = getApiUrl('api/wallet/send/trustitag');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trustitag: tag,
          amount: parseFloat(sendForm.fromAmount),
          currency: sendForm.fromWallet,
        }),
      });

      const result = await response.json().catch(() => ({}));
      console.log('Trustitag send API response:', result);

      if (response.ok) {
        if (result.success === false) {
          toast.error(result.message || 'Failed to process transfer. Please try again.');
        } else {
          toast.success('Transfer completed successfully!');
          setShowTransactionSummaryModal(false);
          setSendForm({
            fromWallet: 'XRP',
            fromAmount: '',
            toCurrency: 'EUR',
            toAmount: '',
            recipientTrustitag: '',
            recipientFullName: '',
            recipientPhone: '',
            reason: '',
          });
          await fetchWalletBalances();
        }
      } else {
        toast.error(result.message || 'Failed to process transfer. Please try again.');
      }
    } catch (error) {
      console.error('Error processing transfer:', error);
      toast.error('An error occurred while processing your transfer. Please try again.');
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showToCurrencyDropdown && !event.target.closest('.send-modal-currency-anchor')) {
        setShowToCurrencyDropdown(false);
      }
    };

    if (showToCurrencyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showToCurrencyDropdown]);

  // Handle toAmount change (reverse calculation)
  const handleToAmountChange = (value) => {
    setLastEditedField('to');
    const numericValue = value.replace(/[^0-9.]/g, '');
    setSendForm(prev => ({ ...prev, toAmount: numericValue }));
    
    // Calculate fromAmount based on toAmount
    if (numericValue && sendExchangeRate && parseFloat(numericValue) > 0) {
      const calculated = parseFloat(numericValue) / sendExchangeRate;
      setSendForm(prev => ({ ...prev, fromAmount: calculated.toFixed(6) }));
    } else if (!numericValue || parseFloat(numericValue) === 0) {
      setSendForm(prev => ({ ...prev, fromAmount: '' }));
    }
  };

  // Fetch wallet balances function
  const fetchWalletBalances = async () => {
    try {
      if (isSessionExpired) {
        setIsLoadingWalletBalances(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingWalletBalances(false);
        return;
      }

      setIsLoadingWalletBalances(true);

      const apiUrl = getApiUrl(walletBalanceEndpoint);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const d = result?.data && typeof result.data === 'object' ? result.data : {};

        const nextCustodial = { xrp: '', usdt: '' };
        if (d.xrpWalletId) nextCustodial.xrp = String(d.xrpWalletId);
        if (d.usdtWalletId) nextCustodial.usdt = String(d.usdtWalletId);
        if (d.xrp_wallet_id && !nextCustodial.xrp) nextCustodial.xrp = String(d.xrp_wallet_id);
        if (d.usdt_wallet_id && !nextCustodial.usdt) nextCustodial.usdt = String(d.usdt_wallet_id);
        if (Array.isArray(d.wallets)) {
          d.wallets.forEach((w) => {
            const c = String(w.currency || w.code || '').toLowerCase();
            if (c === 'xrp' && w.id) nextCustodial.xrp = String(w.id);
            if (c === 'usdt' && w.id) nextCustodial.usdt = String(w.id);
          });
        }
        setCustodialWalletIds(nextCustodial);

        setWalletBalanceRaw(result);

        const mergedFallback =
          d.xrplAddress ??
          d.xrpl_address ??
          d.walletAddress ??
          d.address ??
          result?.xrplAddress ??
          '';
        const { xrp } = extractWalletAddresses(
          result,
          typeof mergedFallback === 'string' ? mergedFallback : ''
        );
        if (xrp) {
          setWalletAddress(xrp);
        }

        if (result?.success && result?.data?.balance) {
          setWalletBalances(result.data.balance);
        } else {
          setWalletBalances(null);
        }
      } else {
        setWalletBalances(null);
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      setWalletBalances(null);
    } finally {
      setIsLoadingWalletBalances(false);
    }
  };

  // Fetch wallet balances on mount and when session changes
  useEffect(() => {
    fetchWalletBalances();
  }, [isSessionExpired, walletBalanceEndpoint]);

  // Refresh wallet balances when Add Money modal opens
  useEffect(() => {
    if (showSavingsAddMoneyModal) {
      fetchWalletBalances();
    }
  }, [showSavingsAddMoneyModal]);

  useEffect(() => {
    if (showFundWalletModal && fundViaAddress) {
      fetchWalletBalances();
    }
  }, [showFundWalletModal, fundViaAddress]);

  const depositDisplayAddress = useMemo(() => {
    if (!fundViaAddress) return walletAddress || '';
    const fromApi =
      walletBalanceRaw != null
        ? resolveDepositAddressFromBalance(
            walletBalanceRaw,
            fundWalletForm.currency,
            depositAddressNetwork
          )
        : '';
    return (fromApi || walletAddress || '').trim();
  }, [
    fundViaAddress,
    walletBalanceRaw,
    fundWalletForm.currency,
    depositAddressNetwork,
    walletAddress,
  ]);

  // Fetch transactions
  useEffect(() => {
    const normalizeTransactions = (items, businessMode = false) => {
      if (!Array.isArray(items)) return [];
      return items.map((tx, index) => {
        const amountXrp =
          tx?.amountXrp ??
          tx?.amount_xrp ??
          tx?.amount?.xrp ??
          tx?.amount?.XRP ??
          tx?.xrpAmount ??
          0;
        const amountUsd =
          tx?.amountUsd ??
          tx?.amount_usd ??
          tx?.amount?.usd ??
          tx?.amount?.USD ??
          tx?.usdAmount ??
          tx?.totalAmount ??
          0;

        return {
          ...tx,
          id: tx?.id ?? tx?.transactionId ?? tx?.txId ?? `TX-${index + 1}`,
          transactionId: tx?.transactionId ?? tx?.id ?? tx?.txId ?? tx?.reference ?? `TX-${index + 1}`,
          type:
            tx?.type ??
            tx?.transactionType ??
            tx?.direction ??
            (businessMode ? 'Business transaction' : 'Received'),
          amountXrp,
          amountUsd,
          status: tx?.status ?? tx?.transactionStatus ?? tx?.state ?? 'Successful',
          date: tx?.date ?? tx?.createdAt ?? tx?.transactionDate ?? tx?.created_at ?? tx?.timestamp,
        };
      });
    };

    const fetchTransactions = async () => {
      try {
        if (isSessionExpired) {
          // Mock transaction data
          setTransactions([
            {
              id: 'F4E5D6C1B2A3',
              type: 'Received',
              amount: { xrp: 50, usd: 25.00 },
              status: 'Successful',
              date: '2024-07-04'
            }
          ]);
          setIsLoadingTransactions(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setTransactions([]);
          setIsLoadingTransactions(false);
          return;
        }

        try {
          if (accountType === 'Business Suite') {
            const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            const businessCandidates = [
              getApiUrl('api/business-suite/transactions?limit=50&offset=0'),
              getApiUrl(`api/business-suite/payrolls/transactions?page=1&pageSize=50&month=${month}`),
            ];

            let loadedBusinessTransactions = false;
            for (const apiUrl of businessCandidates) {
              const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (!response.ok) continue;

              const result = await response.json().catch(() => ({}));
              if (!result?.success) continue;

              const rawItems = Array.isArray(result?.data?.transactions)
                ? result.data.transactions
                : Array.isArray(result?.data?.items)
                  ? result.data.items
                  : Array.isArray(result?.data)
                    ? result.data
                    : [];

              setTransactions(normalizeTransactions(rawItems, true));
              loadedBusinessTransactions = true;
              break;
            }

            if (!loadedBusinessTransactions) {
              setTransactions([]);
            }
          } else {
            const apiUrl = getApiUrl('api/transactions?limit=50&offset=0');
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const result = await response.json().catch(() => ({}));
              const rawItems = Array.isArray(result?.data?.transactions)
                ? result.data.transactions
                : Array.isArray(result?.data)
                  ? result.data
                  : [];
              setTransactions(normalizeTransactions(rawItems, false));
            } else {
              setTransactions([]);
            }
          }
        } catch (error) {
          console.error('Error fetching transaction history:', error);
          setTransactions([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [isSessionExpired, accountType]);

  const transactionDeepLinkHandledRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('transactionId')?.trim();
    if (!targetId) {
      transactionDeepLinkHandledRef.current = null;
      return;
    }
    if (transactionDeepLinkHandledRef.current === targetId) return;
    if (isLoadingTransactions) return;

    const clearTransactionQuery = () => {
      const nextParams = new URLSearchParams(location.search);
      nextParams.delete('transactionId');
      const qs = nextParams.toString();
      const nextState = location.state?.notificationForTransactionDetail
        ? { ...location.state, notificationForTransactionDetail: undefined }
        : location.state;
      navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true, state: nextState });
    };

    const openTransactionDetail = async () => {
      let match = transactions.find((tx) => transactionRecordMatchesId(tx, targetId));
      if (!match) {
        match = transactions.find((tx) => transactionRecordMatchesEscrowId(tx, targetId));
      }

      const notification = location.state?.notificationForTransactionDetail;
      if (!match && notification) {
        const found = findTransactionForNotification(notification, transactions);
        if (found?.transaction) match = found.transaction;
      }

      if (!match && !isSessionExpired) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const businessMode = accountType === 'Business Suite';
            const detailUrl = businessMode
              ? getApiUrl(`api/business-suite/transactions/${encodeURIComponent(targetId)}`)
              : getApiUrl(`api/transactions/${encodeURIComponent(targetId)}`);
            const response = await fetch(detailUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const result = await response.json().catch(() => ({}));
              const raw = result?.data?.transaction ?? result?.data ?? result?.transaction;
              if (raw && typeof raw === 'object') {
                match = {
                  ...raw,
                  id: raw?.id ?? raw?.transactionId ?? raw?.txId ?? targetId,
                  transactionId: raw?.transactionId ?? raw?.id ?? raw?.txId ?? raw?.reference ?? targetId,
                  type: raw?.type ?? raw?.transactionType ?? raw?.direction ?? 'Transaction',
                  amountXrp:
                    raw?.amountXrp ??
                    raw?.amount_xrp ??
                    raw?.amount?.xrp ??
                    raw?.amount?.XRP ??
                    0,
                  amountUsd:
                    raw?.amountUsd ??
                    raw?.amount_usd ??
                    raw?.amount?.usd ??
                    raw?.amount?.USD ??
                    0,
                  status: raw?.status ?? raw?.transactionStatus ?? raw?.state ?? 'Successful',
                  date: raw?.date ?? raw?.createdAt ?? raw?.transactionDate ?? raw?.created_at ?? raw?.timestamp,
                };
              }
            }
          } catch (error) {
            console.error('Error fetching transaction detail:', error);
          }
        }
      }

      if (!match && notification) {
        match = buildTransactionFromNotification(notification, targetId);
      }

      transactionDeepLinkHandledRef.current = targetId;

      if (match) {
        setShowNotificationModal(false);
        setSelectedTransaction(match);
        setShowTransactionDetailsModal(true);
      } else {
        toast.error('Transaction not found');
      }

      clearTransactionQuery();
    };

    openTransactionDetail();
  }, [
    location.search,
    location.pathname,
    location.state,
    isLoadingTransactions,
    transactions,
    isSessionExpired,
    accountType,
    navigate,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('transactionId')) return;

    const notification = location.state?.notificationForTransactionDetail;
    if (!notification || isLoadingTransactions) return;

    const notifKey = `list-${getNotificationId(notification, 0)}`;
    if (transactionDeepLinkHandledRef.current === notifKey) return;
    if (!isTransactionNotification(notification)) return;

    const lookupId = extractNotificationLookupId(notification);
    const found = findTransactionForNotification(notification, transactions);
    let match = found?.transaction ?? null;

    if (!match && lookupId) {
      match = buildTransactionFromNotification(notification, lookupId);
    }

    if (!match) return;

    transactionDeepLinkHandledRef.current = notifKey;
    setShowNotificationModal(false);
    setSelectedTransaction(match);
    setShowTransactionDetailsModal(true);

    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        notificationForTransactionDetail: undefined,
      },
    });
  }, [
    location.pathname,
    location.search,
    location.state,
    isLoadingTransactions,
    transactions,
    navigate,
  ]);

  const loadBeneficiaries = useCallback(async () => {
    try {
      if (isSessionExpired) {
        setBeneficiaries([]);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setBeneficiaries([]);
        return;
      }

      const apiUrl = getApiUrl('api/user/beneficiaries');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.success) {
          if (Array.isArray(result.data)) {
            setBeneficiaries(result.data);
          } else if (Array.isArray(result.data?.beneficiaries)) {
            setBeneficiaries(result.data.beneficiaries);
          } else {
            setBeneficiaries([]);
          }
          return;
        }
      }

      setBeneficiaries([]);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      setBeneficiaries([]);
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    setIsLoadingBeneficiaries(true);
    loadBeneficiaries();
  }, [loadBeneficiaries]);

  const handleConfirmAddBeneficiary = useCallback(async () => {
    const tag = addBeneficiaryTrustitag.trim();
    if (!tag) {
      toast.error('Please enter a Trustitag');
      return;
    }

    const initialsFromTag = (t) =>
      t
        .replace(/^@/, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 2)
        .toUpperCase() || '??';

    if (isSessionExpired) {
      setBeneficiaries((prev) => [
        ...prev,
        { id: `local-${Date.now()}`, name: tag, initials: initialsFromTag(tag), trustitag: tag },
      ]);
      toast.success('Beneficiary added');
      setAddBeneficiaryTrustitag('');
      setShowAddBeneficiaryModal(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to add beneficiaries');
      return;
    }

    setIsAddingBeneficiary(true);
    try {
      const apiUrl = getApiUrl('api/user/beneficiaries');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trustitag: tag }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success !== false) {
        toast.success(typeof result?.message === 'string' ? result.message : 'Beneficiary added');
        setAddBeneficiaryTrustitag('');
        setShowAddBeneficiaryModal(false);
        setIsLoadingBeneficiaries(true);
        await loadBeneficiaries();
      } else {
        const msg =
          (typeof result?.message === 'string' && result.message) ||
          (typeof result?.error === 'string' && result.error) ||
          'Could not add beneficiary';
        toast.error(msg);
      }
    } catch (e) {
      console.error('Add beneficiary failed:', e);
      toast.error('Could not add beneficiary');
    } finally {
      setIsAddingBeneficiary(false);
    }
  }, [addBeneficiaryTrustitag, isSessionExpired, loadBeneficiaries]);

  const handleConfirmRemoveBeneficiary = useCallback(async () => {
    if (!beneficiaryToRemove || isRemovingBeneficiary) return;

    if (isSessionExpired || String(beneficiaryToRemove.id ?? '').startsWith('local-')) {
      setBeneficiaries((prev) => prev.filter((item) => item.id !== beneficiaryToRemove.id));
      toast.success('Beneficiary removed');
      setShowRemoveBeneficiaryModal(false);
      setBeneficiaryToRemove(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to remove beneficiaries');
      return;
    }

    setIsRemovingBeneficiary(true);
    try {
      const deleteKey = getBeneficiaryDeleteKey(beneficiaryToRemove);
      if (!deleteKey) {
        toast.error('Could not identify beneficiary to remove');
        return;
      }

      const apiUrl = getApiUrl(
        `api/user/beneficiaries/${encodeURIComponent(deleteKey)}`,
      );

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success !== false) {
        toast.success(typeof result?.message === 'string' ? result.message : 'Beneficiary removed');
        setShowRemoveBeneficiaryModal(false);
        setBeneficiaryToRemove(null);
        setIsLoadingBeneficiaries(true);
        await loadBeneficiaries();
      } else {
        const msg =
          (typeof result?.message === 'string' && result.message) ||
          (typeof result?.error === 'string' && result.error) ||
          'Could not remove beneficiary';
        toast.error(msg);
      }
    } catch (error) {
      console.error('Remove beneficiary failed:', error);
      toast.error('Could not remove beneficiary');
    } finally {
      setIsRemovingBeneficiary(false);
    }
  }, [beneficiaryToRemove, isRemovingBeneficiary, isSessionExpired, loadBeneficiaries]);

  // Fetch linked accounts
  useEffect(() => {
    const fetchLinkedAccounts = async () => {
      try {
        if (isSessionExpired) {
          setLinkedAccounts({
            bankAccount: '9832547364',
            web3Wallet: 'XUMM (Connected)'
          });
          setIsLoadingLinkedAccounts(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingLinkedAccounts(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/linked-accounts');
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
            setLinkedAccounts(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching linked accounts:', error);
        // Use mock data on error
        setLinkedAccounts({
          bankAccount: '9832547364',
          web3Wallet: 'XUMM (Connected)'
        });
      } finally {
        setIsLoadingLinkedAccounts(false);
      }
    };

    fetchLinkedAccounts();
  }, [isSessionExpired]);

  // Format transaction ID
  const formatTransactionId = (id) => {
    if (!id) return 'N/A';
    if (id.length <= 12) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };

  // Format date to YYYY-MM-DD
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
          return dateString.split('T')[0].split(' ')[0];
        }
        return dateString;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      // If parsing fails, try to extract YYYY-MM-DD from the string
      const match = dateString.match(/(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : dateString;
    }
  };

  const isIncomingTransaction = (transaction) => {
    const direction = String(transaction?.direction || '').trim().toLowerCase();
    if (['received', 'credit', 'deposit', 'incoming', 'in'].includes(direction)) return true;
    if (['spent', 'sent', 'debit', 'withdrawal', 'withdraw', 'outgoing', 'out'].includes(direction)) {
      return false;
    }

    const type = String(transaction?.type || transaction?.transactionType || '').trim().toLowerCase();
    if (type.includes('withdraw') || type.includes('sent') || type === 'debit' || type.includes('spent')) {
      return false;
    }
    if (
      type.includes('deposit')
      || type.includes('received')
      || type === 'credit'
      || type.includes('incoming')
      || type.includes('fund')
    ) {
      return true;
    }

    return true;
  };

  const renderTransactionDetailsModal = () => {
    if (!showTransactionDetailsModal || !selectedTransaction) return null;
    return (
      <div className="notification-modal-overlay transaction-details-modal-overlay" onClick={() => setShowTransactionDetailsModal(false)}>
        <div className="notification-modal transaction-summary-modal transaction-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="transaction-summary-header">
            <h2>Transaction Details</h2>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowTransactionDetailsModal(false)}
            >
              <X size={24} />
            </button>
          </div>
          <div className="transaction-summary-content" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
            {(() => {
              const tx = selectedTransaction;
              const transactionId = tx.id || tx.transactionId || 'N/A';
              const type = tx.type || tx.transactionType || 'N/A';
              const rawAmount = tx.amount?.xrp ?? tx.amountXrp ?? tx.amount ?? 0;
              const amountXrp =
                typeof rawAmount === 'string'
                  ? parseFloat(String(rawAmount).replace(/[^0-9.-]/g, '')) || 0
                  : Number(rawAmount) || 0;
              const amountUsd = tx.amount?.usd || tx.amountUsd || (Number.isFinite(amountXrp) ? amountXrp * 0.5 : 0);
              const status = tx.status || 'N/A';
              const date = tx.date || tx.createdAt || tx.timestamp || 'N/A';
              const isReceived =
                type.toLowerCase().includes('received') ||
                type.toLowerCase() === 'credit' ||
                tx.direction === 'received';
              const direction = tx.direction || (isReceived ? 'received' : 'sent');
              const fromAddress = tx.from || tx.fromAddress || tx.sender || 'N/A';
              const toAddress = tx.to || tx.toAddress || tx.recipient || 'N/A';
              const description = tx.description || tx.reason || tx.note || 'N/A';
              const fee = tx.fee || tx.transactionFee || 'N/A';
              const network = tx.network || tx.blockchain || 'XRP Ledger';
              const hash = tx.hash || tx.txHash || tx.transactionHash || 'N/A';
              const blockNumber = tx.blockNumber || tx.block || 'N/A';
              const confirmations = tx.confirmations || 'N/A';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className={`mobile-transaction-icon ${isReceived ? 'received' : 'sent'}`} style={{ width: '48px', height: '48px' }}>
                        {isReceived ? <ArrowDown size={24} /> : <ArrowUp size={24} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-dark)' }}>{type}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {direction === 'received' ? 'Received' : direction === 'spent' ? 'Sent' : 'Transaction'}
                        </div>
                      </div>
                    </div>
                    <span className={`status-badge ${status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed' ? 'successful' : 'pending'}`}>
                      {status}
                    </span>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--blue-100)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Amount</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600, color: isReceived ? '#10b981' : '#ef4444' }}>
                      {isReceived ? '+' : '-'}
                      {Number(amountXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      ≈ ${Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Transaction Information</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Transaction ID</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                        {formatTransactionId(transactionId)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Date</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500 }}>{formatDate(date)}</span>
                    </div>

                    {fromAddress !== 'N/A' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>From</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                          {fromAddress}
                        </span>
                      </div>
                    )}

                    {toAddress !== 'N/A' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>To</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500, wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%' }}>
                          {toAddress}
                        </span>
                      </div>
                    )}

                    {description !== 'N/A' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Description</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500 }}>{description}</span>
                      </div>
                    )}

                    {fee !== 'N/A' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Transaction Fee</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500 }}>
                          {typeof fee === 'number' ? `${fee} XRP` : fee}
                        </span>
                      </div>
                    )}

                    {hash !== 'N/A' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Transaction Hash</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {hash}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(hash));
                              toast.success('Transaction hash copied to clipboard');
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: 'var(--blue-100)',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Network</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500 }}>{network}</span>
                    </div>

                    {blockNumber !== 'N/A' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Block Number</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500 }}>{blockNumber}</span>
                      </div>
                    )}

                    {confirmations !== 'N/A' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Confirmations</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-dark)', fontWeight: 500 }}>{confirmations}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderRemoveBeneficiaryModal = () => {
    if (!showRemoveBeneficiaryModal || !beneficiaryToRemove) return null;

    const close = () => {
      if (isRemovingBeneficiary) return;
      setShowRemoveBeneficiaryModal(false);
      setBeneficiaryToRemove(null);
    };

    const avatarUrl = getBeneficiaryAvatarUrl(beneficiaryToRemove);
    const trustitagId = getBeneficiaryTrustitagId(beneficiaryToRemove);
    const initials = getBeneficiaryInitials(beneficiaryToRemove);

    return (
      <div
        className="remove-beneficiary-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-beneficiary-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="remove-beneficiary-modal-shell">
          <div className="remove-beneficiary-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="remove-beneficiary-modal-close"
              onClick={close}
              aria-label="Close"
              disabled={isRemovingBeneficiary}
            >
              <X size={20} strokeWidth={1.75} />
            </button>
            <div className="remove-beneficiary-modal-header" aria-hidden />
            <div className="remove-beneficiary-modal-body">
              <div className="remove-beneficiary-modal-hero" aria-hidden>
                <div className="remove-beneficiary-modal-hero-inner">
                  <Trash2 size={44} strokeWidth={2} aria-hidden />
                </div>
              </div>
              <h2 id="remove-beneficiary-title" className="remove-beneficiary-modal-title">
                Are you sure you want to remove trustitag?
              </h2>
              <p className="remove-beneficiary-modal-lead">
                This will permanently remove your Trustitag. This action cannot be undone.
              </p>
              <div className="remove-beneficiary-preview">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="remove-beneficiary-preview-avatar"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="remove-beneficiary-preview-avatar remove-beneficiary-preview-avatar--initials"
                    aria-hidden
                  >
                    {initials}
                  </div>
                )}
                <div className="remove-beneficiary-preview-details">
                  <p className="remove-beneficiary-preview-name">Trustitag</p>
                  <span className="remove-beneficiary-preview-id">{trustitagId}</span>
                </div>
              </div>
              <div className="remove-beneficiary-modal-actions">
                <button
                  type="button"
                  className="remove-beneficiary-modal-btn remove-beneficiary-modal-btn--danger"
                  onClick={handleConfirmRemoveBeneficiary}
                  disabled={isRemovingBeneficiary}
                >
                  {isRemovingBeneficiary ? 'Removing…' : 'Remove Trustitag'}
                </button>
                <button
                  type="button"
                  className="remove-beneficiary-modal-btn remove-beneficiary-modal-btn--muted"
                  onClick={close}
                  disabled={isRemovingBeneficiary}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddBeneficiaryModal = () => {
    if (!showAddBeneficiaryModal) return null;
    const close = () => {
      setShowAddBeneficiaryModal(false);
    };
    return (
      <div className="notification-modal-overlay add-beneficiary-modal-overlay" onClick={close}>
        <div
          className="notification-modal add-beneficiary-modal"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-beneficiary-title"
        >
          <div className="notification-modal-header add-beneficiary-modal-header">
            <div className="notification-header-content">
              <div className="notification-header-accent" aria-hidden />
              <h2 id="add-beneficiary-title">Beneficiary</h2>
            </div>
            <button type="button" className="notification-close-btn" onClick={close} aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="add-beneficiary-modal-body">
            <label className="add-beneficiary-field-label" htmlFor="add-beneficiary-trustitag">
              Trustitag
            </label>
            <input
              id="add-beneficiary-trustitag"
              type="text"
              className="add-beneficiary-input"
              placeholder="Add Trustitag"
              autoComplete="username"
              value={addBeneficiaryTrustitag}
              onChange={(e) => setAddBeneficiaryTrustitag(e.target.value.trimStart())}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAddingBeneficiary) {
                  e.preventDefault();
                  handleConfirmAddBeneficiary();
                }
              }}
              disabled={isAddingBeneficiary}
            />
            <button
              type="button"
              className="add-beneficiary-confirm-btn"
              onClick={handleConfirmAddBeneficiary}
              disabled={isAddingBeneficiary}
            >
              {isAddingBeneficiary ? 'Saving…' : 'Confirm'}
            </button>
            <div className="add-beneficiary-info">
              <div className="add-beneficiary-info-icon" aria-hidden>
                <Info size={18} strokeWidth={2} />
              </div>
              <p className="add-beneficiary-info-text">
                Recipient gets added to your Trustichain beneficiaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transactions.slice(startIndex, endIndex);
  }, [transactions, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [transactionFilter, monthlyFilter]);

  // Function to refresh dashboard data
  const fetchDashboardSummary = async () => {
    try {
      if (isSessionExpired) {
        setIsLoadingDashboard(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoadingDashboard(false);
        return;
      }

      const apiUrl = getApiUrl(dashboardSummaryEndpoint);
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
          setDashboardData(result.data);
        } else {
          setDashboardData(null);
        }
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      setDashboardData(null);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Helper function to submit signed transaction for browser wallet flow
  const submitSignedTransaction = async (transactionId, signedTxBlob, token) => {
    try {
      setFundingStep('completing');
      toast.loading('Submitting signed transaction...', { id: 'fund-wallet' });
      
      if (!transactionId || typeof transactionId !== 'string') {
        throw new Error('Invalid transaction ID. Please try the transaction again.');
      }
      
      if (!signedTxBlob || typeof signedTxBlob !== 'string') {
        throw new Error('Invalid signed transaction blob. Please try signing again.');
      }
      
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(signedTxBlob)) {
        throw new Error('Invalid transaction blob format. Please try signing again.');
      }
      
      const submitUrl = getApiUrl('api/wallet/fund/submit');
      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: transactionId,
          signedTxBlob: signedTxBlob
        }),
      });
      
      const submitResult = await submitResponse.json().catch(() => ({}));
      
      if (submitResponse.ok && submitResult.success) {
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        setFundViaAddress(false);
        setFundDepositPaymentMethod(null);
        setDepositAddressNetwork('XRPL');
        await fetchDashboardSummary();
        await fetchWalletBalances();
      } else {
        const errorMessage = submitResult.message || submitResult.error || 'Failed to submit transaction';
        toast.error(`${errorMessage}. Please try again.`, { id: 'fund-wallet' });
        setFundingStep('idle');
        setIsFundingWallet(false);
      }
    } catch (submitError) {
      console.error('Error submitting signed transaction:', submitError);
      toast.error('An error occurred while submitting the transaction. Please try again.', { id: 'fund-wallet' });
      setFundingStep('idle');
      setIsFundingWallet(false);
    }
  };

  const openStripeDeposit = (method) => {
    setShowFundMethodModal(false);
    setFundViaAddress(false);
    setFundDepositPaymentMethod(method);
    setStripeFundSession(null);
    setFundWalletForm({ amount: '', currency: 'USDC' });
    setShowFundWalletModal(true);
  };

  const resetStripeFundModal = () => {
    setShowFundWalletModal(false);
    setFundWalletForm({ amount: '', currency: 'XRP' });
    setTransactionData(null);
    setFundingStep('idle');
    setIsFundingWallet(false);
    setFundViaAddress(false);
    setFundDepositPaymentMethod(null);
    setStripeFundSession(null);
    setDepositAddressNetwork('XRPL');
  };

  const handleStripeFundSuccess = async () => {
    resetStripeFundModal();
    await fetchDashboardSummary();
    await fetchWalletBalances();
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();
    
    if (!fundWalletForm.amount || parseFloat(fundWalletForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to fund your wallet');
      return;
    }

    if (STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod)) {
      const amountUsd = Number(parseFloat(fundWalletForm.amount).toFixed(2));
      const methodLabel = fundDepositPaymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay';
      const asset = fundWalletForm.currency === 'USDT' ? 'USDT' : 'USDC';
      setIsFundingWallet(true);
      setFundingStep('preparing');
      try {
        assertStripePublishableKey();
        toast.loading(`Preparing ${methodLabel}…`, { id: 'fund-wallet' });
        const intentData = await createStripeFundingIntent({
          token,
          amountUsd,
          asset,
          suiteContext: resolveStripeSuiteContext(accountType),
        });
        setStripeFundSession({
          clientSecret: intentData.clientSecret,
          fundingAttemptId: intentData.fundingAttemptId,
          intentId: intentData.intentId,
          amountUsd,
          asset,
        });
        toast.success(`Complete payment with ${methodLabel} below`, { id: 'fund-wallet' });
        setFundingStep('idle');
        setIsFundingWallet(false);
      } catch (stripeError) {
        console.error('Stripe deposit error:', stripeError);
        toast.error(
          stripeError?.message || `Failed to initialize ${methodLabel}. Please try again.`,
          { id: 'fund-wallet' },
        );
        setFundingStep('idle');
        setIsFundingWallet(false);
      }
      return;
    }

    const selectedCurrency = fundWalletForm.currency || 'XRP';
    setIsFundingWallet(true);
    setFundingStep('preparing');
    
    try {
      const apiUrl = getApiUrl('api/wallet/fund');
      toast.loading('Preparing transaction...', { id: 'fund-wallet' });

      const prepareResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(fundWalletForm.amount),
          currency: selectedCurrency
        }),
      });

      const prepareResult = await prepareResponse.json().catch(() => ({}));

      if (!prepareResponse.ok || !prepareResult.success) {
        toast.error(prepareResult.message || 'Failed to prepare transaction. Please try again.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      const transactionId = prepareResult.data?.transactionId;
      const xummUrl = prepareResult.data?.xummUrl;
      const transactionObject = prepareResult.data?.transaction 
        || prepareResult.data?.transactionBlob 
        || prepareResult.data?.txBlob 
        || prepareResult.data?.blob;

      if (prepareResult.data?.xrplTxHash) {
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        setFundViaAddress(false);
        setFundDepositPaymentMethod(null);
        setDepositAddressNetwork('XRPL');
        await fetchDashboardSummary();
        return;
      }

      if (!transactionId) {
        toast.error('Backend response missing transaction ID.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      setTransactionData({ transactionId, transactionObject, xummUrl });
      setFundingStep('signing');

      if (xummUrl) {
        toast.loading('Please sign the transaction in your Xaman wallet...', { id: 'fund-wallet' });
        window.open(xummUrl, '_blank');

        const pollInterval = setInterval(async () => {
          try {
            const statusUrl = getApiUrl(`api/wallet/fund/status?transactionId=${transactionId}`);
            const statusResponse = await fetch(statusUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();
              
              if (statusResult.data?.signed) {
                clearInterval(pollInterval);
                toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
                setShowFundWalletModal(false);
                setFundWalletForm({ amount: '', currency: 'XRP' });
                setTransactionData(null);
                setFundingStep('idle');
                setIsFundingWallet(false);
                setFundViaAddress(false);
                setFundDepositPaymentMethod(null);
                setDepositAddressNetwork('XRPL');
                await fetchDashboardSummary();
              } else if (statusResult.data?.cancelled || statusResult.data?.expired) {
                clearInterval(pollInterval);
                toast.error('Transaction was cancelled or expired.', { id: 'fund-wallet' });
                setIsFundingWallet(false);
                setFundingStep('idle');
                setTransactionData(null);
              }
            }
          } catch (pollError) {
            console.error('Error polling transaction status:', pollError);
          }
        }, 2000);
        
        setTransactionData({ transactionId, transactionObject, xummUrl, pollInterval });
        
        setTimeout(() => {
          clearInterval(pollInterval);
          if (fundingStep === 'signing') {
            toast.error('Transaction signing timed out.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        }, 5 * 60 * 1000);
        
      } else {
        if (!transactionObject) {
          toast.error('Backend response missing transaction data for browser wallet signing.', { id: 'fund-wallet' });
          setIsFundingWallet(false);
          setFundingStep('idle');
          setTransactionData(null);
          return;
        }
        
        toast.loading('Please sign the transaction in your browser wallet...', { id: 'fund-wallet' });
        
        try {
          let txToSign = transactionObject;
          if (typeof transactionObject === 'string') {
            try {
              txToSign = JSON.parse(transactionObject);
            } catch (e) {
              console.warn('Could not parse transaction object as JSON:', e);
            }
          }
          
          if (window.crossmark) {
            let isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
            
            if (!isConnected) {
              try {
                if (window.crossmark?.session?.signIn) {
                  await window.crossmark.session.signIn();
                  await new Promise(resolve => setTimeout(resolve, 500));
                  isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                } else if (window.crossmark?.async?.signInAndWait) {
                  await window.crossmark.async.signInAndWait();
                  await new Promise(resolve => setTimeout(resolve, 500));
                  isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                }
              } catch (connectError) {
                throw new Error('Failed to connect Crossmark wallet. Please make sure the extension is installed and unlocked.');
              }
            }
            
            if (!isConnected) {
              throw new Error('Crossmark wallet is not connected. Please connect your wallet and try again.');
            }
            
            toast.loading('Requesting transaction signature from Crossmark...', { id: 'fund-wallet' });
            
            let signedTx;
            if (window.crossmark.api && typeof window.crossmark.api.request === 'function') {
              signedTx = await window.crossmark.api.request({
                method: 'sign',
                params: { transaction: txToSign }
              });
            } else if (window.crossmark.api && typeof window.crossmark.api.sign === 'function') {
              signedTx = await window.crossmark.api.sign(txToSign);
            } else if (window.crossmark.api && typeof window.crossmark.api.signTransaction === 'function') {
              signedTx = await window.crossmark.api.signTransaction(txToSign);
            } else {
              throw new Error('No sign method found in Crossmark API');
            }
            
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            let actualResponse = signedTx;
            
            if (typeof signedTx === 'string' && uuidPattern.test(signedTx)) {
              if (window.crossmark?.api?.awaitRequest) {
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Request timeout')), 120000)
                );
                actualResponse = await Promise.race([
                  window.crossmark.api.awaitRequest(signedTx),
                  timeoutPromise
                ]);
              }
            }
            
            let signedTxBlob = null;
            if (typeof actualResponse === 'string' && !uuidPattern.test(actualResponse)) {
              signedTxBlob = actualResponse;
            } else if (actualResponse?.signedTransaction) {
              signedTxBlob = actualResponse.signedTransaction;
            } else if (actualResponse?.txBlob) {
              signedTxBlob = actualResponse.txBlob;
            } else if (actualResponse?.blob) {
              signedTxBlob = actualResponse.blob;
            } else if (actualResponse?.result) {
              signedTxBlob = typeof actualResponse.result === 'string' ? actualResponse.result : actualResponse.result?.signedTransaction || actualResponse.result?.txBlob;
            }
            
            if (!signedTxBlob || typeof signedTxBlob !== 'string') {
              throw new Error('Failed to extract signed transaction blob from wallet response.');
            }
            
            await submitSignedTransaction(transactionId, signedTxBlob, token);
          } else if (window.ethereum) {
            const signedTx = await window.ethereum.request({
              method: 'xrpl_signTransaction',
              params: [txToSign]
            });
            
            let signedTxBlob = null;
            if (typeof signedTx === 'string') {
              signedTxBlob = signedTx;
            } else if (signedTx?.signedTransaction) {
              signedTxBlob = signedTx.signedTransaction;
            } else if (signedTx?.txBlob) {
              signedTxBlob = signedTx.txBlob;
            } else if (signedTx?.result) {
              signedTxBlob = typeof signedTx.result === 'string' ? signedTx.result : signedTx.result?.signedTransaction;
            }
            
            if (!signedTxBlob) {
              throw new Error('Failed to extract signed transaction blob.');
            }
            
            await submitSignedTransaction(transactionId, signedTxBlob, token);
          } else {
            toast.error('No XRPL wallet detected. Please install Crossmark wallet extension.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        } catch (browserWalletError) {
          console.error('Error with browser wallet flow:', browserWalletError);
          toast.error(`Failed to sign transaction: ${browserWalletError.message || 'Unknown error'}. Please try again.`, { id: 'fund-wallet' });
          setIsFundingWallet(false);
          setFundingStep('idle');
          setTransactionData(null);
        }
      }

    } catch (error) {
      console.error('Error funding wallet:', error);
      toast.error('An error occurred while funding your wallet. Please try again.', { id: 'fund-wallet' });
      setIsFundingWallet(false);
      setFundingStep('idle');
      setTransactionData(null);
    }
  };

  const handleWithdrawWallet = async (e) => {
    e.preventDefault();

    if (!withdrawWalletForm.amount || parseFloat(withdrawWalletForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!withdrawWalletForm.destinationAddress || withdrawWalletForm.destinationAddress.trim().length < 10) {
      toast.error('Please enter a valid destination address');
      return;
    }

    setIsWithdrawingWallet(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to withdraw from your wallet');
        setIsWithdrawingWallet(false);
        return;
      }

      const apiUrl = getApiUrl('api/wallet/withdraw');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawWalletForm.amount),
          currency: withdrawWalletForm.currency,
          destinationAddress: withdrawWalletForm.destinationAddress.trim(),
        }),
      });

      const result = await response.json().catch(() => ({}));
      // Log the withdrawal response to the console
      console.log('Withdraw API response:', result);

      if (response.ok && result.success) {
        toast.success('Withdrawal request submitted successfully!');
        setShowWithdrawWalletModal(false);
        setWithdrawWalletForm({
          amount: '',
          currency: 'USD',
          destinationAddress: ''
        });
        await fetchDashboardSummary();
        await fetchWalletBalances();
      } else {
        toast.error(result.message || 'Failed to withdraw from wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error withdrawing from wallet:', error);
      toast.error('An error occurred while processing your withdrawal. Please try again.');
    } finally {
      setIsWithdrawingWallet(false);
    }
  };

  // Helper function to get currency display name
  const getCurrencyDisplayName = (currency) => {
    const mapping = {
      'XRP': 'XRP wallet',
      'USDT': 'Tether USD',
      'USDC': 'USD Coin'
    };
    return mapping[currency] || currency;
  };

  // Helper function to get currency badge text
  const getCurrencyBadge = (currency) => {
    const mapping = {
      'XRP': 'XRP',
      'USDT': 'USDT',
      'USDC': 'USDC'
    };
    return mapping[currency] || currency;
  };

  // Helper function to get balance for a currency
  const getCurrencyBalance = (currency) => {
    if (!walletBalances) return 0;
    const currencyKey = currency.toLowerCase();
    return walletBalances[currencyKey] || 0;
  };

  const savingsAddMoneyAccountOptions = useMemo(
    () =>
      savingsWallets
        .filter((w) => w && !w.isPlaceholder)
        .map((w) => ({
          id: String(w.id),
          label: w.name || 'Savings account',
        })),
    [savingsWallets],
  );

  const savingsAddMoneyBalanceLine = useMemo(() => {
    const balance = getCurrencyBalance('XRP');
    const formatted = Number(balance).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
    return `${formatted} XRP`;
  }, [walletBalances]);

  const submitSavingsTransfer = async () => {
    if (isSessionExpired) {
      toast.error('Session expired. Please sign in again.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    const savingsWalletId = String(savingsAddMoneyForm.walletId || '').trim();
    if (!savingsWalletId || savingsWalletId.startsWith('wallet-')) {
      toast.error('Select a savings wallet to add funds to.');
      return;
    }
    const rawAmount = String(savingsAddMoneyForm.amount || '').replace(/,/g, '').trim();
    const amountXrp = parseFloat(rawAmount);
    if (!Number.isFinite(amountXrp) || amountXrp <= 0) {
      toast.error('Enter a valid XRP amount.');
      return;
    }
    const xrpBalance = getCurrencyBalance('XRP');
    if (amountXrp > xrpBalance + 1e-10) {
      toast.error('Insufficient XRP balance.');
      return;
    }

    const body = {
      savingsWalletId,
      amountXrp,
    };
    if (custodialWalletIds.xrp) {
      body.sourceWalletId = custodialWalletIds.xrp;
    }

    setIsSubmittingSavingsTransfer(true);
    try {
      const res = await fetch(getApiUrl('api/savings/transfer'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.success === false) {
        toast.error(payload?.message || payload?.error || 'Transfer failed');
        return;
      }
      toast.success(payload?.message || 'Funds moved to savings');
      setShowSavingsAddMoneyModal(false);
      resetSavingsAddMoneyForm();
      await fetchWalletBalances();
      if (isSavingsDashboardActive) {
        try {
          const wRes = await fetch(getApiUrl('api/savings/wallets'), {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const wJson = await wRes.json().catch(() => ({}));
          if (wRes.ok && wJson?.success && Array.isArray(wJson?.data?.wallets)) {
            setSavingsWallets(
              wJson.data.wallets.map((w, idx) => mapSavingsWalletApiToUi(w, idx))
            );
          }
        } catch (_) {
          /* ignore refresh errors */
        }
      }
    } catch (err) {
      console.error('Savings transfer:', err);
      toast.error(err?.message || 'Network error');
    } finally {
      setIsSubmittingSavingsTransfer(false);
    }
  };

  const submitSavingsWithdraw = async () => {
    if (isSessionExpired) {
      toast.error('Session expired. Please sign in again.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    if (selectedWithdrawWallet == null) return;
    const wallet = savingsWallets[selectedWithdrawWallet];
    if (!wallet || wallet.isPlaceholder) {
      toast.error('Select a valid savings wallet.');
      return;
    }
    const savingsWalletId = String(wallet.id || '').trim();
    if (!savingsWalletId || savingsWalletId.startsWith('wallet-') || savingsWalletId.startsWith('na-')) {
      toast.error('Invalid savings wallet.');
      return;
    }

    setIsSubmittingSavingsWithdraw(true);
    try {
      const res = await fetch(getApiUrl('api/savings/withdraw'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          savingsWalletId,
          withdrawAll: true,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.success === false) {
        toast.error(payload?.message || payload?.error || 'Withdrawal failed');
        return;
      }
      toast.success(payload?.message || 'Withdrawal submitted');
      setShowSavingsWithdrawConfirmModal(false);
      setSelectedWithdrawWallet(null);
      await fetchWalletBalances();
      if (isSavingsDashboardActive) {
        try {
          const params = new URLSearchParams();
          if (savingsSummaryRange) params.set('range', savingsSummaryRange);
          const summaryUrl = `${getApiUrl('api/savings/summary')}${params.toString() ? `?${params.toString()}` : ''}`;
          const [wRes, sRes] = await Promise.all([
            fetch(getApiUrl('api/savings/wallets'), {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }),
            fetch(summaryUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }),
          ]);
          const wJson = await wRes.json().catch(() => ({}));
          if (wRes.ok && wJson?.success && Array.isArray(wJson?.data?.wallets)) {
            setSavingsWallets(wJson.data.wallets.map((w, idx) => mapSavingsWalletApiToUi(w, idx)));
          }
          const sJson = await sRes.json().catch(() => ({}));
          if (sRes.ok && sJson?.success && sJson?.data) {
            setSavingsSummary(sJson.data);
          }
        } catch (_) {
          /* ignore refresh errors */
        }
      }
    } catch (err) {
      console.error('Savings withdraw:', err);
      toast.error(err?.message || 'Network error');
    } finally {
      setIsSubmittingSavingsWithdraw(false);
    }
  };

  const submitCreateAddSavingsPlan = async () => {
    const name = String(addSavingsAccountForm.name || '').trim();
    if (!name) {
      toast.error('Please enter a wallet name');
      return;
    }

    const planKind = String(addSavingsAccountForm.category || '').trim();
    const needsGoalAmount = planRequiresGoalAmount(planKind);

    let targetAmountUsd;
    if (needsGoalAmount) {
      const raw = String(addSavingsAccountForm.amount || '').replace(/,/g, '').trim();
      const xrpGoal = parseFloat(raw);
      if (!Number.isFinite(xrpGoal) || xrpGoal <= 0) {
        toast.error('Enter a valid XRP goal amount.');
        return;
      }
      targetAmountUsd = Math.round(xrpGoal * 1.05 * 100) / 100;
    } else {
      /* Flex / Goal: no upfront goal in UI; nominal target until API supports open goals */
      targetAmountUsd = 5000;
    }

    if (planKind === 'Auto Savings') {
      const autoRaw = String(addSavingsAccountForm.autoSaveAmount || '').replace(/,/g, '').trim();
      const autoXrp = parseFloat(autoRaw);
      if (!Number.isFinite(autoXrp) || autoXrp <= 0) {
        toast.error('Enter a valid AutoSave amount (XRP).');
        return;
      }
      if (!String(addSavingsAccountForm.autoSaveFrequency || '').trim()) {
        toast.error('Select an autosave frequency.');
        return;
      }
    }

    if (isSessionExpired) {
      toast.error('Session expired. Please sign in again.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to create a savings wallet');
      return;
    }

    setIsCreatingSavingsAccount(true);
    try {
      const apiUrl = getApiUrl('api/savings/wallets');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          targetAmountUsd,
          ...(planKind === 'Auto Savings'
            ? {
                autosaveAmountXrp: Number(
                  String(addSavingsAccountForm.autoSaveAmount || '')
                    .replace(/,/g, '')
                    .trim(),
                ),
                autosaveFrequency: String(addSavingsAccountForm.autoSaveFrequency || '').trim(),
              }
            : {}),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success && result?.data?.wallets?.length) {
        const created = result.data.wallets[0];
        setSavingsWallets((prev) => [...prev, mapSavingsWalletApiToUi(created, prev.length)]);

        setShowAddSavingsAccountModal(false);
        resetAddSavingsAccountForm();
        toast.success(result.message || 'Savings wallet created successfully');
      } else {
        toast.error(result?.message || 'Failed to create savings wallet');
      }
    } catch (error) {
      console.error('Error creating savings wallet:', error);
      toast.error('Failed to create savings wallet');
    } finally {
      setIsCreatingSavingsAccount(false);
    }
  };

  const isDeletableSavingsPlan = (wallet) => {
    if (!wallet || wallet.isPlaceholder) return false;
    const id = String(wallet.id || '').trim();
    if (!id || id.startsWith('wallet-') || id.startsWith('na-')) return false;
    return true;
  };

  const deleteSavingsPlan = async (wallet) => {
    if (!isDeletableSavingsPlan(wallet)) return;
    const planId = String(wallet.id).trim();
    if (
      !window.confirm(
        `Delete savings plan "${wallet.name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    if (isSessionExpired) {
      toast.error('Session expired. Please sign in again.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }

    setDeletingSavingsWalletId(planId);
    try {
      const res = await fetch(
        getApiUrl(`api/savings/wallets/${encodeURIComponent(planId)}`),
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        let errMsg = 'Could not delete savings plan';
        try {
          const err = await res.json();
          errMsg = err?.message || err?.error || errMsg;
        } catch (_) {
          /* empty body */
        }
        toast.error(errMsg);
        return;
      }
      let payload = {};
      try {
        const text = await res.text();
        if (text) payload = JSON.parse(text);
      } catch (_) {
        /* 204 or non-JSON success */
      }
      if (payload && Object.keys(payload).length > 0 && payload.success === false) {
        toast.error(payload?.message || payload?.error || 'Could not delete savings plan');
        return;
      }
      toast.success(payload?.message || 'Savings plan deleted');
      await fetchWalletBalances();
      if (isSavingsDashboardActive) {
        try {
          const params = new URLSearchParams();
          if (savingsSummaryRange) params.set('range', savingsSummaryRange);
          const summaryUrl = `${getApiUrl('api/savings/summary')}${params.toString() ? `?${params.toString()}` : ''}`;
          const [wRes, sRes] = await Promise.all([
            fetch(getApiUrl('api/savings/wallets'), {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }),
            fetch(summaryUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }),
          ]);
          const wJson = await wRes.json().catch(() => ({}));
          if (wRes.ok && wJson?.success && Array.isArray(wJson?.data?.wallets)) {
            setSavingsWallets(wJson.data.wallets.map((w, idx) => mapSavingsWalletApiToUi(w, idx)));
          }
          const sJson = await sRes.json().catch(() => ({}));
          if (sRes.ok && sJson?.success && sJson?.data) {
            setSavingsSummary(sJson.data);
          }
        } catch (_) {
          /* ignore refresh errors */
        }
      }
    } catch (err) {
      console.error('Delete savings plan:', err);
      toast.error(err?.message || 'Network error');
    } finally {
      setDeletingSavingsWalletId(null);
    }
  };

  // Fetch exchange rate from external API for send modal
  const fetchExternalExchangeRate = async (fromCurrency, toCurrency) => {
    setIsLoadingSendRate(true);
    try {
      // For XRP to fiat, we need to get XRP/USD from CoinGecko, then convert via ExchangeRate-API
      if (fromCurrency === 'XRP' && toCurrency !== 'XRP') {
        // Fetch XRP to USD rate from CoinGecko
        const xrpResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
        const xrpData = await xrpResponse.json();
        const xrpToUsd = xrpData?.ripple?.usd;
        
        if (!xrpToUsd) {
          setSendExchangeRate(null);
          setIsLoadingSendRate(false);
          return;
        }

        // If target is USD, return directly
        if (toCurrency === 'USD') {
          setSendExchangeRate(xrpToUsd);
          setIsLoadingSendRate(false);
          return;
        }

        // For other fiat currencies, get USD to target currency rate
        const fiatResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
        const fiatData = await fiatResponse.json();
        const usdToTarget = fiatData?.rates?.[toCurrency];
        
        if (usdToTarget) {
          // XRP to target = (XRP to USD) * (USD to target)
          setSendExchangeRate(xrpToUsd * usdToTarget);
        } else {
          setSendExchangeRate(null);
        }
      } else if (fromCurrency !== 'XRP' && toCurrency === 'XRP') {
        // Fiat to XRP: convert via USD
        if (fromCurrency === 'USD') {
          const xrpResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
          const xrpData = await xrpResponse.json();
          const xrpToUsd = xrpData?.ripple?.usd;
          if (xrpToUsd) {
            setSendExchangeRate(1 / xrpToUsd); // USD to XRP = 1 / (XRP to USD)
          } else {
            setSendExchangeRate(null);
          }
        } else {
          // Convert fromCurrency to USD, then USD to XRP
          const fiatResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
          const fiatData = await fiatResponse.json();
          const fromToUsd = 1 / (fiatData?.rates?.[fromCurrency] || 1);
          
          const xrpResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
          const xrpData = await xrpResponse.json();
          const xrpToUsd = xrpData?.ripple?.usd;
          
          if (xrpToUsd) {
            setSendExchangeRate(fromToUsd / xrpToUsd);
          } else {
            setSendExchangeRate(null);
          }
        }
      } else if (fromCurrency !== 'XRP' && toCurrency !== 'XRP') {
        // Fiat to fiat
        const fiatResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const fiatData = await fiatResponse.json();
        const rate = fiatData?.rates?.[toCurrency];
        setSendExchangeRate(rate || null);
      } else {
        setSendExchangeRate(null);
      }
    } catch (error) {
      console.error('Error fetching external exchange rate:', error);
      setSendExchangeRate(null);
    } finally {
      setIsLoadingSendRate(false);
    }
  };

  // Helper function to get exchange rate
  const getExchangeRate = (fromCurrency, toCurrency) => {
    if (!exchangeRates || !Array.isArray(exchangeRates)) return null;
    if (fromCurrency === toCurrency) return 1;
    
    // Try to find direct rate
    const directRate = exchangeRates.find(rate => 
      rate.from === fromCurrency && rate.to === toCurrency
    );
    if (directRate) return directRate.rate;

    // Try reverse rate
    const reverseRate = exchangeRates.find(rate => 
      rate.from === toCurrency && rate.to === fromCurrency
    );
    if (reverseRate) return 1 / reverseRate.rate;

    // Fallback: try to find via USD if available
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUsd = exchangeRates.find(rate => 
        rate.from === fromCurrency && rate.to === 'USD'
      );
      const usdToTo = exchangeRates.find(rate => 
        rate.from === 'USD' && rate.to === toCurrency
      );
      if (fromToUsd && usdToTo) {
        return fromToUsd.rate * usdToTo.rate;
      }
    }

    return null;
  };

  // Calculate toAmount based on fromAmount and exchange rate
  const calculateToAmount = (fromAmount, fromCurrency, toCurrency) => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return '';
    const rate = getExchangeRate(fromCurrency, toCurrency);
    if (!rate) return '';
    const calculated = parseFloat(fromAmount) * rate;
    return calculated.toFixed(6);
  };

  const handleSwapCurrencyChange = (field, value) => {
    setSwapForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // If currencies are the same, prevent it
      if (field === 'fromCurrency' && value === updated.toCurrency) {
        return prev;
      }
      if (field === 'toCurrency' && value === updated.fromCurrency) {
        return prev;
      }

      // Recalculate toAmount if fromAmount exists
      if (updated.fromAmount && updated.fromAmount !== '') {
        updated.toAmount = calculateToAmount(updated.fromAmount, updated.fromCurrency, updated.toCurrency);
      } else {
        updated.toAmount = '';
      }

      return updated;
    });
  };

  const handleSwapAmountChange = (field, value) => {
    setSwapForm(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === 'fromAmount') {
        // Don't calculate locally - let the API handle it via useEffect
        // The useEffect will trigger and fetch the quote
      } else if (field === 'toAmount') {
        // Calculate fromAmount based on toAmount (reverse calculation)
        const rate = getExchangeRate(updated.toCurrency, updated.fromCurrency);
        if (rate && value && parseFloat(value) > 0) {
          updated.fromAmount = (parseFloat(value) * rate).toFixed(6);
        } else {
          updated.fromAmount = '';
        }
      }

      return updated;
    });
  };

  const handleSwapCurrencies = () => {
    setSwapForm(prev => {
      const newFromCurrency = prev.toCurrency;
      const newToCurrency = prev.fromCurrency;
      const newFromAmount = prev.toAmount;
      const newToAmount = prev.fromAmount;

      return {
        fromCurrency: newFromCurrency,
        toCurrency: newToCurrency,
        fromAmount: newFromAmount,
        toAmount: newToAmount
      };
    });
  };

  // Function to fetch swap quote from API
  const fetchSwapQuote = async (amount, fromCurrency, toCurrency) => {
    if (!amount || parseFloat(amount) <= 0) {
      setSwapForm(prev => ({ ...prev, toAmount: '' }));
      setIsFetchingSwapQuote(false);
      return;
    }

    if (fromCurrency === toCurrency) {
      setSwapForm(prev => ({ ...prev, toAmount: '' }));
      setIsFetchingSwapQuote(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setIsFetchingSwapQuote(false);
      return;
    }

    setIsFetchingSwapQuote(true);

    try {
      const apiUrl = getApiUrl('api/wallet/swap/quote');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          fromCurrency: fromCurrency,
          toCurrency: toCurrency,
          useDEX: useDEX
        })
      });

      const result = await response.json();

      if (!result.success) {
        // Silently fail for real-time updates (don't show toast for every keystroke)
        setSwapForm(prev => ({ ...prev, toAmount: '' }));
        setIsFetchingSwapQuote(false);
        return;
      }

      // Update toAmount with API response
      setSwapForm(prev => ({
        ...prev,
        toAmount: result.data.toAmount ? result.data.toAmount.toFixed(6) : ''
      }));
      setIsFetchingSwapQuote(false);
    } catch (error) {
      console.error('Error fetching swap quote:', error);
      setSwapForm(prev => ({ ...prev, toAmount: '' }));
      setIsFetchingSwapQuote(false);
    }
  };

  // Real-time swap quote fetching with debouncing
  useEffect(() => {
    if (!showSwapModal) {
      // Clean up when modal closes
      if (swapQuoteTimeoutRef.current) {
        clearTimeout(swapQuoteTimeoutRef.current);
      }
      setIsFetchingSwapQuote(false);
      return;
    }

    // Clear existing timeout
    if (swapQuoteTimeoutRef.current) {
      clearTimeout(swapQuoteTimeoutRef.current);
    }

    // Only fetch if fromAmount is valid
    if (swapForm.fromAmount && parseFloat(swapForm.fromAmount) > 0) {
      // Debounce API call by 500ms
      swapQuoteTimeoutRef.current = setTimeout(() => {
        fetchSwapQuote(swapForm.fromAmount, swapForm.fromCurrency, swapForm.toCurrency);
      }, 500);
    } else {
      setSwapForm(prev => ({ ...prev, toAmount: '' }));
      setIsFetchingSwapQuote(false);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (swapQuoteTimeoutRef.current) {
        clearTimeout(swapQuoteTimeoutRef.current);
      }
    };
  }, [swapForm.fromAmount, swapForm.fromCurrency, swapForm.toCurrency, showSwapModal, useDEX]);

  const handlePreviewSwap = async (e) => {
    e.preventDefault();

    // Validation
    if (!swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (swapForm.fromCurrency === swapForm.toCurrency) {
      toast.error('Please select different currencies');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to continue');
      return;
    }

    setIsSwapping(true);

    try {
      const apiUrl = getApiUrl('api/wallet/swap/quote');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(swapForm.fromAmount),
          fromCurrency: swapForm.fromCurrency,
          toCurrency: swapForm.toCurrency,
          useDEX: useDEX
        })
      });

      const result = await response.json();

      if (!result.success) {
        // Handle error responses
        const errorMessage = result.message || 'Failed to get swap quote';
        toast.error(errorMessage);
        setIsSwapping(false);
        return;
      }

      // Update swapPreviewData with API response
      setSwapPreviewData({
        fromCurrency: result.data.fromCurrency,
        toCurrency: result.data.toCurrency,
        fromAmount: result.data.fromAmount,
        toAmount: result.data.toAmount,
        rate: result.data.rate,
        usdValue: result.data.usdValue,
        feeUsd: result.data.feeUsd
      });
      setShowSwapModal(false);
      setShowSwapPreviewModal(true);
      setIsSwapping(false);
    } catch (error) {
      console.error('Error fetching swap quote:', error);
      toast.error('Failed to get swap quote. Please try again.');
      setIsSwapping(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!swapPreviewData) {
      setShowSwapPreviewModal(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to continue');
      return;
    }

    setIsSwapping(true);

    try {
      const apiUrl = getApiUrl('api/wallet/swap');
      const requestBody = {
        amount: swapPreviewData.fromAmount,
        fromCurrency: swapPreviewData.fromCurrency,
        toCurrency: swapPreviewData.toCurrency,
        ...(useDEX && {
          swapType: "onchain",
          slippageTolerance: slippageTolerance
        })
      };
      
      console.log('🔄 Swap API Call:', {
        url: apiUrl,
        method: 'POST',
        body: requestBody
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 Swap API Response Status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Swap API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        const errorMessage = errorData.message || `Swap failed with status ${response.status}`;
        toast.error(errorMessage);
        setIsSwapping(false);
        return;
      }

      const result = await response.json();
      console.log('✅ Swap API Success Response:', result);
      console.log('📊 Swap API Response Data:', result.data);
      console.log('🔑 Swap API Response Keys:', Object.keys(result));
      console.log('📋 Swap API Response Data Keys:', result.data ? Object.keys(result.data) : 'No data');

      if (!result.success) {
        console.error('❌ Swap API Returned Error:', result);
        // Handle error responses with specific error messages
        const errorMessage = result.message || 'Failed to execute swap';
        toast.error(errorMessage);
        setIsSwapping(false);
        return;
      }

      // Swap executed successfully - update swapPreviewData with transaction details
      console.log('🔄 Updating swapPreviewData with transaction details:', result.data);
      
      const updatedPreviewData = {
        ...swapPreviewData,
        transactionId: result.data.transactionId,
        status: result.data.status,
        toAmount: result.data.toAmount,
        rate: result.data.rate,
        usdValue: result.data.usdValue,
        feeUsd: result.data.feeUsd,
        ...(result.data.xrplTxHash && { xrplTxHash: result.data.xrplTxHash }),
        ...(result.data.swapType && { swapType: result.data.swapType })
      };
      
      console.log('📝 Updated Preview Data:', updatedPreviewData);

      console.log('🎯 Setting state updates...');
      setSwapPreviewData(updatedPreviewData);
      setShowSwapPreviewModal(false);
      setShowSwapSummaryModal(true);
      setIsSwapping(false);
      
      console.log('✅ State updates completed. Showing success toast.');

      toast.success(result.message || 'Swap completed successfully!');
      
      // Refresh wallet balances after successful swap
      console.log('🔄 Refreshing wallet balances...');
      fetchWalletBalances();
    } catch (error) {
      console.error('❌ Exception caught in handleConfirmSwap:', error);
      console.error('❌ Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      toast.error('Failed to execute swap. Please try again.');
      setIsSwapping(false);
    }
  };

  const handleCloseSwapSummary = () => {
    setShowSwapSummaryModal(false);
    setShowSwapModal(false);
    setSwapForm({
      fromCurrency: 'XRP',
      toCurrency: 'USDT',
      fromAmount: '',
      toAmount: ''
    });
    setSwapPreviewData(null);
  };

  // Add body class to hide navbar on transactions page (backup)
  useEffect(() => {
    document.body.classList.add('transactions-page-active');
    return () => {
      document.body.classList.remove('transactions-page-active');
    };
  }, []);

  // Cleanup poll interval when modal closes or component unmounts
  useEffect(() => {
    return () => {
      if (transactionData?.pollInterval) {
        clearInterval(transactionData.pollInterval);
      }
    };
  }, [transactionData]);

  // Render mobile savings summary page
  if (showSavingsSummary) {
    const xrpAmount = parseFloat(savingsAmount) || 0;
    let exchangeRate = 0.5430;
    let usdValue = xrpAmount * exchangeRate;
    
    if (exchangeRates && exchangeRates.length > 0) {
      const xrpToUsdRate = getExchangeRate('XRP', 'USD');
      if (xrpToUsdRate) {
        exchangeRate = Number(xrpToUsdRate);
        usdValue = xrpAmount * exchangeRate;
      }
    }

    const networkFee = 0.00001;
    const serviceFeePercent = 0.46;
    const serviceFeeUsd = usdValue * (serviceFeePercent / 100);
    const recipientGets = usdValue - serviceFeeUsd;

    return (
      <div className="mobile-savings-summary-page">
        <div className="mobile-savings-summary-header">
          <div className="mobile-savings-summary-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Transaction Summary</h2>
          </div>
          <button 
            type="button" 
            className="mobile-savings-close-btn"
            onClick={() => setShowSavingsSummary(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-savings-summary-content">
          {/* Transaction Details */}
          <div className="mobile-savings-summary-section">
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Send Amount</span>
              <span className="mobile-savings-summary-value">{xrpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP</span>
            </div>
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Exchange Rate</span>
              <span className="mobile-savings-summary-value">1 XRP = ${exchangeRate.toFixed(4)}</span>
            </div>
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Network Fee</span>
              <span className="mobile-savings-summary-value">{networkFee} XRP</span>
            </div>
            <div className="mobile-savings-summary-item mobile-savings-summary-divider">
              <span className="mobile-savings-summary-label">Service Fee</span>
              <span className="mobile-savings-summary-value">${serviceFeeUsd.toFixed(2)} ({serviceFeePercent}%)</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="mobile-savings-summary-section">
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">
                <span className="mobile-savings-summary-bold">Recipient Gets</span>
              </span>
              <span className="mobile-savings-summary-value mobile-savings-summary-bold">${recipientGets.toFixed(2)} USD</span>
            </div>
            <div className="mobile-savings-summary-item">
              <span className="mobile-savings-summary-label">Estimated Arrival</span>
              <span className="mobile-savings-summary-value">3-5 seconds</span>
            </div>
          </div>

          {/* Transfer Button */}
          <div className="mobile-savings-summary-actions">
            <button 
              type="button" 
              className="mobile-savings-summary-transfer-btn"
              onClick={() => {
                // Handle final transfer logic
                setShowSavingsSummary(false);
                setShowSavingsPage(false);
                toast.success('Transfer completed successfully');
              }}
            >
              Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-savings-summary-info-message">
            <div className="mobile-savings-summary-info-icon">
              <Info size={16} />
            </div>
            <span>Recipient will receive at least {recipientGets.toFixed(0)} USDT (${recipientGets.toFixed(0)}) or the transaction will be refunded</span>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile fund wallet summary page
  if (showFundWalletSummary) {
    // Calculate transaction details
    const xrpAmount = parseFloat(fundWalletAmount) || 0;
    let exchangeRate = 0.5430;
    let usdValue = xrpAmount * exchangeRate;
    
    if (exchangeRates && exchangeRates.length > 0) {
      const xrpToUsdRate = getExchangeRate('XRP', 'USD');
      if (xrpToUsdRate) {
        exchangeRate = Number(xrpToUsdRate);
        usdValue = xrpAmount * exchangeRate;
      }
    }
    
    const networkFee = 0.00001;
    const serviceFeePercent = 0.46;
    const serviceFeeUsd = usdValue * (serviceFeePercent / 100);
    const recipientGets = usdValue - serviceFeeUsd;

    return (
      <div className="mobile-fund-wallet-summary-page">
        <div className="mobile-fund-wallet-summary-header">
          <div className="mobile-fund-wallet-summary-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Transaction Summary</h2>
          </div>
          <button 
            type="button" 
            className="mobile-fund-wallet-close-btn"
            onClick={() => setShowFundWalletSummary(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-fund-wallet-summary-content">
          {/* Transaction Details */}
          <div className="mobile-fund-wallet-summary-section">
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Send Amount</span>
              <span className="mobile-fund-wallet-summary-value">{xrpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP</span>
            </div>
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Exchange Rate</span>
              <span className="mobile-fund-wallet-summary-value">1 XRP = ${exchangeRate.toFixed(4)}</span>
            </div>
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Network Fee</span>
              <span className="mobile-fund-wallet-summary-value">{networkFee} XRP</span>
            </div>
            <div className="mobile-fund-wallet-summary-item mobile-fund-wallet-summary-divider">
              <span className="mobile-fund-wallet-summary-label">Service Fee</span>
              <span className="mobile-fund-wallet-summary-value">${serviceFeeUsd.toFixed(2)} ({serviceFeePercent}%)</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="mobile-fund-wallet-summary-section">
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">
                <span className="mobile-fund-wallet-summary-bold">Recipient Gets</span>
              </span>
              <span className="mobile-fund-wallet-summary-value mobile-fund-wallet-summary-bold">${recipientGets.toFixed(2)} USD</span>
            </div>
            <div className="mobile-fund-wallet-summary-item">
              <span className="mobile-fund-wallet-summary-label">Estimated Arrival</span>
              <span className="mobile-fund-wallet-summary-value">3-5 seconds</span>
            </div>
          </div>

          {/* Transfer Button */}
          <div className="mobile-fund-wallet-summary-actions">
            <button 
              type="button" 
              className="mobile-fund-wallet-summary-transfer-btn"
              onClick={() => {
                // Handle final transfer logic
                setShowFundWalletSummary(false);
                setShowFundWalletPage(false);
                toast.success('Transfer completed successfully');
              }}
            >
              Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-fund-wallet-summary-info-message">
            <div className="mobile-fund-wallet-summary-info-icon">
              <Info size={16} />
            </div>
            <span>Recipient will receive at least {recipientGets.toFixed(0)} USDT (${recipientGets.toFixed(0)}) or the transaction will be refunded</span>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile send full page
  if (showSendPage) {
    return (
        <div className="mobile-send-full-page">
        <div className="mobile-send-page-header">
          <div className="mobile-send-page-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <div>
              <h2>Send via Trustitag</h2>
              <p className="mobile-send-page-subtitle">Send to another user with their Trustitag</p>
            </div>
          </div>
          <button 
            type="button" 
            className="mobile-send-close-btn"
            onClick={() => setShowSendPage(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-send-page-content">
          {/* From Section */}
          <div className="mobile-send-from-section">
            <label className="mobile-send-section-label">From</label>
            <div className="mobile-send-wallet-selector">
              <div className="mobile-send-currency-badge">
                <img 
                  src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                  alt="XRP" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <span className="mobile-send-wallet-text">XRP wallet</span>
              <ChevronDown size={16} />
            </div>
            <input
              type="text"
              className="mobile-send-amount-input"
              placeholder="$0.00"
              value={sendForm.fromAmount ? `$${sendForm.fromAmount}` : ''}
              onChange={(e) => {
                let value = e.target.value;
                // Remove $ sign if present
                value = value.replace(/\$/g, '');
                // Keep only numbers and decimal point
                value = value.replace(/[^0-9.]/g, '');
                setSendForm(prev => ({ ...prev, fromAmount: value }));
              }}
            />
            <div className="mobile-send-balance-text">Balance: 24,567.89 USDT</div>
          </div>

          {/* Swap Icon */}
          <div className="mobile-send-swap-icon-wrapper">
            <button type="button" className="mobile-send-swap-btn">
              <ArrowUpDown size={20} />
            </button>
          </div>

          {/* To Section */}
          <div className="mobile-send-to-section">
            <label className="mobile-send-section-label">To</label>
            <div className="mobile-send-wallet-selector">
              <div className="mobile-send-currency-flag">
                <span>🇪🇺</span>
              </div>
              <span className="mobile-send-wallet-text">EUR</span>
              <ChevronDown size={16} />
            </div>
            <input
              type="text"
              className="mobile-send-amount-input"
              placeholder="$0.00"
              value={sendForm.toAmount ? `$${sendForm.toAmount}` : ''}
              onChange={(e) => {
                let value = e.target.value;
                // Remove $ sign if present
                value = value.replace(/\$/g, '');
                // Keep only numbers and decimal point
                value = value.replace(/[^0-9.]/g, '');
                setSendForm(prev => ({ ...prev, toAmount: value }));
              }}
            />
            <div className="mobile-send-balance-text">Balance: 24,567.89 USDT</div>
          </div>

          {/* Recipient — Trustitag */}
          <div className="mobile-send-recipient-section">
            <div className="mobile-send-form-group">
              <label className="mobile-send-form-label">Recipient Trustitag</label>
              <input
                type="text"
                className="mobile-send-form-input mobile-send-trustitag-input"
                placeholder="e.g. tc_a1b2c3d4e5"
                autoComplete="off"
                spellCheck={false}
                value={sendForm.recipientTrustitag}
                onChange={(e) =>
                  setSendForm((prev) => ({ ...prev, recipientTrustitag: e.target.value.trimStart() }))
                }
              />
            </div>

            <div className="mobile-send-form-group">
              <label className="mobile-send-form-label">Note (optional)</label>
              <input
                type="text"
                className="mobile-send-form-input"
                placeholder="What's this for?"
                value={sendForm.reason}
                onChange={(e) => setSendForm((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          {/* Confirm Swap Button */}
          <div className="mobile-send-actions">
            <button 
              type="button" 
              className="mobile-send-confirm-btn"
              onClick={() => {
                // Handle confirm swap logic
                setShowSendPage(false);
                toast.success('Swap confirmed successfully');
              }}
            >
              Confirm Swap
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-send-info-message">
            <div className="mobile-send-info-icon">
              <Info size={16} />
            </div>
            <span>You'll receive at least 24,567 USDT ($24,567) or the transaction will be refunded</span>
          </div>
        </div>
      </div>
    );
  }

  // Render mobile fund wallet full page
  if (showFundWalletPage) {
    return (
      <div className="mobile-fund-wallet-full-page">
        <div className="mobile-fund-wallet-page-header">
          <div className="mobile-fund-wallet-page-title-wrapper">
            <div className="mobile-section-indicator"></div>
            <h2>Deposit</h2>
          </div>
          <button 
            type="button" 
            className="mobile-fund-wallet-close-btn"
            onClick={() => setShowFundWalletPage(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-fund-wallet-page-content">
          {/* Currency Selection */}
          <div className="mobile-fund-wallet-currency-section">
            <label className="mobile-fund-wallet-section-label">Currency</label>
            <div className="mobile-fund-wallet-currency-selector">
              <div className="mobile-fund-wallet-currency-icon">
                <img 
                  src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                  alt="XRP" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              </div>
              <span className="mobile-fund-wallet-currency-text">XRP wallet</span>
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Amount Input */}
          <div className="mobile-fund-wallet-amount-section">
            <label className="mobile-fund-wallet-section-label">Amount</label>
            <div className="mobile-fund-wallet-amount-input-wrapper">
              <input
                type="text"
                className="mobile-fund-wallet-amount-input"
                placeholder="0"
                value={fundWalletAmount}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setFundWalletAmount(value);
                }}
              />
              <span className="mobile-fund-wallet-amount-suffix">XRP</span>
            </div>
          </div>

          {/* Network Input */}
          <div className="mobile-fund-wallet-network-section">
            <label className="mobile-fund-wallet-section-label">Network</label>
            <input
              type="text"
              className="mobile-fund-wallet-network-input"
              placeholder="Enter your name"
              value={fundWalletNetwork}
              onChange={(e) => setFundWalletNetwork(e.target.value)}
            />
          </div>

          {/* Recipient Wallet Details */}
          <div className="mobile-fund-wallet-recipient-section">
            <label className="mobile-fund-wallet-section-label">Network</label>
            <div className="mobile-fund-wallet-address-wrapper">
              <div className="mobile-fund-wallet-qr-code">
                <QrCode size={80} />
              </div>
              <div className="mobile-fund-wallet-address-content">
                <div className="mobile-fund-wallet-address-text">
                  rEb8TK3gBgk5auZkwc6sHnw<br />
                  rGVJH8DuaLh
                </div>
                <button 
                  type="button"
                  className="mobile-fund-wallet-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh');
                    toast.success('Address copied to clipboard');
                  }}
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Preview Transfer Button */}
          <div className="mobile-fund-wallet-actions">
            <button 
              type="button" 
              className="mobile-fund-wallet-preview-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Preview Transfer clicked, setting showFundWalletSummary to true');
                setShowFundWalletSummary(true);
              }}
            >
              Preview Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-fund-wallet-info-message">
            <div className="mobile-fund-wallet-info-icon">
              <Info size={16} />
            </div>
            <span>Recipient gets the funds immediately—or a full refund applies.</span>
          </div>
        </div>
      </div>
    );
  }

  // Render desktop savings dashboard
  if (location.pathname === '/savings' || showDesktopSavingsDashboard) {
    const savingsAllocationForRender =
      savingsAllocation.length > 0
        ? savingsAllocation
        : (isLoadingSavingsSummary
            ? [{ walletId: 'na', name: 'N/A', amount: NaN, percentage: 100, color: '#e5e7eb', isPlaceholder: true }]
            : []);

    const placeholderSavingsWallets = [
      { id: 'na-1', name: 'N/A', percentage: '0%', saved: 'N/A', icon: Trophy, color: '#e5e7eb', isPlaceholder: true },
      { id: 'na-2', name: 'N/A', percentage: '0%', saved: 'N/A', icon: Home, color: '#e5e7eb', isPlaceholder: true },
      { id: 'na-3', name: 'N/A', percentage: '0%', saved: 'N/A', icon: ShoppingBag, color: '#e5e7eb', isPlaceholder: true },
      { id: 'na-4', name: 'N/A', percentage: '0%', saved: 'N/A', icon: Package, color: '#e5e7eb', isPlaceholder: true },
    ];

    const savingsWalletsForRender =
      savingsWallets.length > 0 ? savingsWallets : (isLoadingSavingsWallets ? placeholderSavingsWallets : []);

    const placeholderSavingsTransactions = [
      { id: 'N/A', amount: 'N/A', status: 'N/A', date: 'N/A', type: 'N/A', direction: 'all' },
      { id: 'N/A', amount: 'N/A', status: 'N/A', date: 'N/A', type: 'N/A', direction: 'all' },
      { id: 'N/A', amount: 'N/A', status: 'N/A', date: 'N/A', type: 'N/A', direction: 'all' },
    ];

    const savingHistoryForRender =
      savingHistory.length > 0 ? savingHistory : (isLoadingSavingsTransactions ? placeholderSavingsTransactions : []);

    return (
      <PersonalSidebarWalletProvider
        isSessionExpired={isSessionExpired}
        enabled={accountType !== 'Business Suite'}
      >
      <>
      {/* Mobile Header - Only visible on mobile for savings details */}
      <PersonalSuiteMobileHeader
        variant={isBusinessSuiteAccount ? 'business' : 'personal'}
        className="transactions-mobile-header"
        userAvatar={headerAvatar}
        userInitials={headerInitials}
        userFullName={headerName}
        personalVerificationComplete={kycComplete}
        businessVerificationComplete={kycComplete}
        businessLogoUrl={businessCompanyLogoUrl}
        businessName={businessCompanyName}
        businessAvatarLoading={isLoadingBusinessIdentity}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
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

        <div className="mobile-sidebar-section">
          <p className="mobile-sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
          <nav className="mobile-sidebar-nav">
            {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
              const Icon = item.icon;
              const isActive = isGeneralNavItemActive(item.label, location.pathname, accountType);
              const handleNavClick = () =>
                handleGeneralNavClick({
                  itemLabel: item.label,
                  accountType,
                  navigate,
                  setShowDesktopSavingsDashboard,
                  closeMobileMenu: () => setIsMobileMenuOpen(false)
                });
              const navBadge = getNavBadge(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {navBadge != null && navBadge !== '' ? (
                    <span className="mobile-sidebar-badge">{navBadge}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {accountType === 'Business Suite' && (
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">Developers Tool</p>
            <nav className="mobile-sidebar-nav">
              {developersNav.map((item) => {
                const Icon = item.icon;
                const developerPath = getDeveloperNavPath(item.label);
                const isDevActive = developerPath && location.pathname === developerPath;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item${isDevActive ? ' active' : ''}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (developerPath) navigate(developerPath);
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

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
              const handleSupportNavClick = () => {
                setIsMobileMenuOpen(false);
                if (item.label === 'Settings') {
                  navigate(
                    '/settings',
                    accountType === 'Business Suite'
                      ? { state: { accountType: 'Business Suite' } }
                      : undefined
                  );
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

          <button type="button" className="mobile-sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="dashboard transactions-page">
        <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
          <nav className="sidebar-nav">
            {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
              const Icon = item.icon;
              const isActive = isGeneralNavItemActive(item.label, location.pathname, accountType);
              const handleNavClick = () =>
                handleGeneralNavClick({
                  itemLabel: item.label,
                  accountType,
                  navigate,
                  setShowDesktopSavingsDashboard,
                  closeMobileMenu: undefined
                });
              const navBadge = getNavBadge(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {navBadge != null && navBadge !== '' ? (
                    <span className="sidebar-badge">{navBadge}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {accountType === 'Business Suite' && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Developers Tool</p>
            <nav className="sidebar-nav">
              {developersNav.map((item) => {
                const Icon = item.icon;
                const developerPath = getDeveloperNavPath(item.label);
                const isDevActive = developerPath && location.pathname === developerPath;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`sidebar-nav-item${isDevActive ? ' active' : ''}`}
                    onClick={() => {
                      if (developerPath) navigate(developerPath);
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {accountType !== 'Business Suite' && <PersonalSidebarWalletNav />}

        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const Icon = item.icon;
              const handleSupportNavClick = () => {
                if (item.label === 'Settings') {
                  navigate(
                    '/settings',
                    accountType === 'Business Suite'
                      ? { state: { accountType: 'Business Suite' } }
                      : undefined
                  );
                }
              };
              const isActive = item.label === 'Settings' && location.pathname === '/settings';
              return (
                <button 
                  key={item.label} 
                  type="button" 
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleSupportNavClick}
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
            {(isBusinessSuiteAccount || kycComplete) ? (
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
            ) : (
              <button type="button" className="kyc-status">
                <KeyRound size={16} />
                <span>KYC</span>
                <span>Unverified</span>
              </button>
            )}
            <div className="account-type-display">
              <span className="account-type-label">{accountType}</span>
            </div>
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <HeaderProfileAvatarNav>
                {headerAvatar ? (
                  <img src={headerAvatar} alt={headerName} className="user-avatar-img" />
                ) : (
                  headerInitials
                )}
                <HeaderProfileVerifyBadge show={kycComplete} />
              </HeaderProfileAvatarNav>
            </div>
          </div>
        </header>

        <div className="transactions-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">{isBusinessSuiteAccount ? 'Business Suite' : 'General'}</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">My Savings</span>
          </div>

          {/* Main Content */}
          <div className="desktop-savings-content">
          {/* Left Panel */}
          <div className="desktop-savings-left-panel">
            {/* Savings Allocation */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-indicator"></div>
              <div className="desktop-savings-section-content">
                <h3 className="desktop-savings-section-title">
                  <div className="desktop-savings-allocation-title-wrapper">
                    <div className="desktop-savings-allocation-indicator"></div>
                    <span>Savings Allocation</span>
                  </div>
                </h3>
                <p className="desktop-savings-section-subtitle">Total amount you have in your savings.</p>
                <div className="desktop-savings-total-wrapper">
                  <div className="desktop-savings-total-amount">{formatUsd(savingsSummary?.totalUsd)}</div>
                  <div className="desktop-savings-growth-wrapper">
                    <div className="desktop-savings-growth">
                      {(Number(savingsSummary?.changePercent) || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{formatSignedPercent(savingsSummary?.changePercent)}</span>
                    </div>
                    <span className="desktop-savings-growth-period">{savingsSummary?.periodLabel || 'N/A'}</span>
                  </div>
                </div>
                <div className="desktop-savings-allocation-bar">
                  {savingsAllocationForRender.map((item, index) => (
                    <div 
                      key={index}
                      className="desktop-savings-allocation-segment"
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    />
                  ))}
                </div>
                <div className="desktop-savings-allocation-breakdown">
                  {savingsAllocationForRender.map((item, index) => (
                    <div key={index} className="desktop-savings-allocation-item">
                      <div className="desktop-savings-allocation-item-header">
                        <div 
                          className="desktop-savings-allocation-dot"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="desktop-savings-allocation-name">{item.name}</span>
                      </div>
                      <div className="desktop-savings-allocation-item-details">
                        <span className="desktop-savings-allocation-amount">{formatUsd(item.amount)}</span>
                        <span 
                          className="desktop-savings-allocation-percentage"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {item.isPlaceholder ? 'N/A' : `${item.percentage}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Savings Wallet */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-content">
                <div className="desktop-savings-wallet-header">
                  <div className="desktop-savings-wallet-title-wrapper">
                    <div className="desktop-savings-wallet-indicator"></div>
                    <h3 className="desktop-savings-wallet-title">Savings plan</h3>
                  </div>
                  <button 
                    type="button" 
                    className="desktop-savings-add-wallet-btn"
                    onClick={() => setShowAddSavingsAccountModal(true)}
                  >
                    + Add plan
                  </button>
                </div>
                <div className="desktop-savings-wallet-grid">
                  {savingsWalletsForRender.map((wallet, index) => {
                    const Icon = wallet.icon;
                    const percentageValue = parseInt(wallet.percentage, 10) || 0;
                    const circumference = 2 * Math.PI * 20; // radius = 20
                    const offset = circumference - (percentageValue / 100) * circumference;
                    
                    // Convert hex to rgba for background circle
                    const hexToRgba = (hex, alpha) => {
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    };
                    
                    const backgroundColor = hexToRgba(wallet.color, 0.2);
                    
                    return (
                      <div
                        key={wallet.id || index}
                        role={wallet.isPlaceholder ? undefined : 'button'}
                        tabIndex={wallet.isPlaceholder ? -1 : 0}
                        className={`desktop-savings-wallet-card${wallet.isPlaceholder ? '' : ' desktop-savings-wallet-card--interactive'} desktop-savings-wallet-card--has-delete`}
                        onClick={() => openSavingsAddMoneyForWallet(wallet)}
                        onKeyDown={(e) => {
                          if (wallet.isPlaceholder) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openSavingsAddMoneyForWallet(wallet);
                          }
                        }}
                      >
                        <button
                            type="button"
                            className="desktop-savings-plan-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDeletableSavingsPlan(wallet)) {
                                deleteSavingsPlan(wallet);
                              }
                            }}
                            disabled={!isDeletableSavingsPlan(wallet) || deletingSavingsWalletId === String(wallet.id)}
                            title={!isDeletableSavingsPlan(wallet) ? 'No savings plan to remove' : undefined}
                            aria-label={
                              !isDeletableSavingsPlan(wallet)
                                ? 'Delete unavailable for this wallet'
                                : `Delete savings plan ${wallet.name}`
                            }
                          >
                            <Trash2 size={18} aria-hidden />
                          </button>
                        <div className="desktop-savings-wallet-card-top">
                          <div className="desktop-savings-wallet-icon-container">
                            <svg className="desktop-savings-wallet-progress-circle" width="48" height="48">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke={backgroundColor}
                                strokeWidth="4"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke={wallet.color}
                                strokeWidth="4"
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={offset}
                              strokeLinecap="round"
                              transform="rotate(-90 24 24)"
                            />
                            </svg>
                            <div 
                              className="desktop-savings-wallet-icon"
                              style={{ backgroundColor: backgroundColor }}
                            >
                              <Icon size={20} style={{ color: wallet.color }} />
                            </div>
                          </div>
                          <div className="desktop-savings-wallet-name-wrapper">
                            <div className="desktop-savings-wallet-name">{wallet.isPlaceholder ? 'N/A' : wallet.name}</div>
                            <div className="desktop-savings-wallet-percentage">{wallet.isPlaceholder ? 'N/A' : wallet.percentage}</div>
                          </div>
                        </div>
                        <div className="desktop-savings-wallet-card-bottom">
                          <div className="desktop-savings-wallet-saved-label">Saved:</div>
                          <div className="desktop-savings-wallet-amount">{wallet.isPlaceholder ? 'N/A' : wallet.saved}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="desktop-savings-actions-bottom">
                  <button 
                    type="button" 
                    className="desktop-savings-add-money-btn"
                    onClick={openSavingsAddMoneyDefault}
                  >
                    + Add money
                  </button>
                  <button 
                    type="button" 
                    className="desktop-savings-withdraw-btn"
                    onClick={() => setShowSavingsWithdrawModal(true)}
                  >
                    <ArrowDown size={16} />
                    <Wallet size={16} />
                    Withdraw
                  </button>
                </div>
              </div>
            </div>

            {/* Cashflow - Mobile Only */}
            <div className="desktop-savings-section-card mobile-cashflow-section">
              <div className="desktop-savings-section-content">
                <div className="cashflow-section">
                  <div className="section-header">
                    <div className="section-indicator"></div>
                    <h2 className="section-title">Cashflow</h2>
                    <div className="cashflow-range-selectors">
                      <div className="period-selector">
                        <select 
                          value={cashflowRange} 
                          onChange={(e) => setCashflowRange(e.target.value)}
                          className="period-select"
                          aria-label="Cashflow date range"
                        >
                          <option value="this_month">This month</option>
                          <option value="last_month">Last month</option>
                          <option value="this_year">This year</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                      <div className="period-selector">
                        <select 
                          value={cashflowInterval} 
                          onChange={(e) => setCashflowInterval(e.target.value)}
                          className="period-select"
                          aria-label="Cashflow bucket size"
                        >
                          <option value="monthly">By month</option>
                          <option value="weekly">By week</option>
                        </select>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="cashflow-legend">
                    <div className="legend-item">
                      <div className="legend-color received"></div>
                      <span>Amount Saved</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color spent"></div>
                      <span>Amount Withdrawn</span>
                    </div>
                  </div>
                  <div className="cashflow-chart-container">
                    <div className="chart-y-axis">
                      <span className="y-axis-label">100%</span>
                      <span className="y-axis-label">80%</span>
                      <span className="y-axis-label">60%</span>
                      <span className="y-axis-label">40%</span>
                      <span className="y-axis-label">20%</span>
                      <span className="y-axis-label">0%</span>
                    </div>
                    <div className="cashflow-chart">
                      {/* Bars only */}
                      <div className="chart-bars-container">
                        {cashflowData.map((item, index) => (
                          <div key={index} className="chart-month">
                            <div className="chart-bars">
                              <div 
                                className="chart-bar received" 
                                style={{ height: `${item.received}%` }}
                              ></div>
                              <div 
                                className="chart-bar spent" 
                                style={{ height: `${item.spent}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Labels row below */}
                      <div className="chart-labels-row">
                        {cashflowData.map((item, index) => (
                          <div key={index} className="chart-label-wrapper">
                            <span className="chart-label">{item.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="desktop-savings-right-panel">
            {/* Cashflow */}
            <div className="cashflow-section">
              <div className="section-header">
                <div className="section-indicator"></div>
                <h2 className="section-title">Cashflow</h2>
                <div className="cashflow-range-selectors">
                  <div className="period-selector">
                    <select 
                      value={cashflowRange} 
                      onChange={(e) => setCashflowRange(e.target.value)}
                      className="period-select"
                      aria-label="Cashflow date range"
                    >
                      <option value="this_month">This month</option>
                      <option value="last_month">Last month</option>
                      <option value="this_year">This year</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                  <div className="period-selector">
                    <select 
                      value={cashflowInterval} 
                      onChange={(e) => setCashflowInterval(e.target.value)}
                      className="period-select"
                      aria-label="Cashflow bucket size"
                    >
                      <option value="monthly">By month</option>
                      <option value="weekly">By week</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>
              <div className="cashflow-legend">
                <div className="legend-item">
                  <div className="legend-color received"></div>
                  <span>Amount received</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color spent"></div>
                  <span>Amount Spent</span>
                </div>
              </div>
              <div className="cashflow-chart-container">
                <div className="chart-y-axis">
                  <span className="y-axis-label">100%</span>
                  <span className="y-axis-label">80%</span>
                  <span className="y-axis-label">60%</span>
                  <span className="y-axis-label">40%</span>
                  <span className="y-axis-label">20%</span>
                  <span className="y-axis-label">0%</span>
                </div>
                <div className="cashflow-chart">
                  {/* Bars only */}
                  <div className="chart-bars-container">
                    {cashflowData.map((item, index) => (
                      <div key={index} className="chart-month">
                        <div className="chart-bars">
                          <div 
                            className="chart-bar received" 
                            style={{ height: `${item.received}%` }}
                          ></div>
                          <div 
                            className="chart-bar spent" 
                            style={{ height: `${item.spent}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Labels row below */}
                  <div className="chart-labels-row">
                    {cashflowData.map((item, index) => (
                      <div key={index} className="chart-label-wrapper">
                        <span className="chart-label">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Saving History */}
            <div className="desktop-savings-section-card">
              <div className="desktop-savings-section-content">
                <div className="desktop-savings-history-header">
                  <div className="desktop-savings-history-title-wrapper">
                    <div className="desktop-savings-history-indicator"></div>
                    <h3 className="desktop-savings-history-title">Transaction History</h3>
                    <ArrowRight size={20} className="desktop-savings-history-arrow" />
                  </div>
                  <div className="desktop-savings-history-filters">
                    <select
                      className="desktop-savings-filter-select"
                      onChange={(e) => {
                        const raw = String(e.target.value || '').trim().toLowerCase();
                        const next =
                          raw === 'received' ? 'received' :
                          raw === 'sent' ? 'spent' :
                          raw === 'spent' ? 'spent' :
                          raw === 'all' ? 'all' : 'all';
                        setSavingsTransactionsDirection(next);
                        setSavingsTransactionsPage(1);
                      }}
                    >
                      <option>Filter</option>
                      <option>All</option>
                      <option>Received</option>
                      <option>Sent</option>
                    </select>
                    <select
                      className="desktop-savings-filter-select"
                      onChange={(e) => {
                        const raw = String(e.target.value || '').trim().toLowerCase();
                        const next =
                          raw === 'weekly' ? 'weekly' :
                          raw === 'daily' ? 'daily' :
                          raw === 'yearly' ? 'monthly' :
                          'monthly';
                        setSavingsTransactionsRange(next);
                        setSavingsTransactionsPage(1);
                      }}
                    >
                      <option>Monthly</option>
                      <option>Weekly</option>
                      <option>Yearly</option>
                    </select>
                    <button type="button" className="desktop-savings-filter-icon-btn">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>
                <div className="desktop-savings-history-table-wrapper">
                  <table className="desktop-savings-history-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {savingHistoryForRender.map((transaction, index) => {
                        const isIncoming = isIncomingTransaction(transaction);
                        return (
                        <tr key={index}>
                          <td>
                            <div className="desktop-savings-transaction-type">
                              {isIncoming ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                              <span>{transaction.type}</span>
                            </div>
                            <div className="desktop-savings-transaction-id">{transaction.id}</div>
                          </td>
                          <td className="desktop-savings-transaction-amount">{transaction.amount}</td>
                          <td>
                            <span className="desktop-savings-status-badge successful">{transaction.status}</span>
                          </td>
                          <td className="desktop-savings-transaction-date">{transaction.date}</td>
                          <td>
                            <div className="desktop-savings-transaction-arrow" aria-hidden>
                              {isIncoming ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Transaction History Cards */}
                <div className="mobile-savings-history-cards">
                  {savingHistoryForRender.map((transaction, index) => {
                    const isIncoming = isIncomingTransaction(transaction);
                    // Extract amount value
                    const amountValue = typeof transaction.amount === 'string'
                      ? transaction.amount.replace('$', '').replace(',', '')
                      : '';
                    const numericAmount = parseFloat(amountValue);
                    const hasAmount = Number.isFinite(numericAmount);
                    // Calculate XRP amount (assuming $1,200 = 50 XRP for example, or use actual conversion)
                    const xrpAmount = hasAmount ? Math.round(numericAmount / 24) : 'N/A'; // Approximate conversion
                    const usdValue = hasAmount ? numericAmount.toFixed(2) : 'N/A';
                    
                    return (
                      <div 
                        key={index} 
                        className="mobile-savings-history-card"
                      >
                        <div className="mobile-savings-history-left">
                          <div className="mobile-savings-history-icon">
                            {isIncoming ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                          </div>
                          <div className="mobile-savings-history-details">
                            <div className="mobile-savings-history-type">{transaction.type}</div>
                            <div className="mobile-savings-history-description">
                              You {isIncoming ? 'received' : 'sent'} {xrpAmount} XRP, worth ${usdValue} USD.
                            </div>
                          </div>
                        </div>
                        <div className="mobile-savings-history-right">
                          <div className="mobile-savings-history-status">{transaction.status}</div>
                          <div className="mobile-savings-history-date">{transaction.date}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="desktop-savings-pagination">
                  <button type="button" className="desktop-savings-pagination-btn">← Prev 10</button>
                  <div className="desktop-savings-pagination-pages">
                    <button type="button" className="desktop-savings-pagination-page">1</button>
                    <span className="desktop-savings-pagination-ellipsis">...</span>
                    <button type="button" className="desktop-savings-pagination-page">11</button>
                    <button type="button" className="desktop-savings-pagination-page active">12</button>
                    <button type="button" className="desktop-savings-pagination-page">13</button>
                    <button type="button" className="desktop-savings-pagination-page">14</button>
                    <button type="button" className="desktop-savings-pagination-page">15</button>
                    <button type="button" className="desktop-savings-pagination-page">16</button>
                    <button type="button" className="desktop-savings-pagination-page">17</button>
                    <button type="button" className="desktop-savings-pagination-page">18</button>
                  </div>
                  <button type="button" className="desktop-savings-pagination-btn">Next 10 →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>

      {/* Notification Modal - For savings details page */}
      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Notification</h2>
              </div>
              <button type="button" className="notification-close-btn" onClick={() => setShowNotificationModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="notification-filter-bar">
              <div className="notification-filter-buttons">
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('All')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'Unread' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('Unread')}
                >
                  Unread
                </button>
              </div>
              <button
                type="button"
                className="notification-filter-icon"
                onClick={handleMarkAllNotificationsRead}
                disabled={isLoadingNotifications}
              >
                <Filter size={18} />
              </button>
            </div>

            <div className="notification-list">
              {isLoadingNotifications ? (
                <NotificationListSkeleton count={6} />
              ) : (
                <NotificationListItems
                  notifications={notifications}
                  expandedNotificationId={expandedNotificationId}
                  onToggleExpand={(nid) => setExpandedNotificationId((p) => (p === nid ? null : nid))}
                  onMarkRead={handleMarkNotificationRead}
                  formatTimeAgo={formatTimeAgo}
                  onBeforeCtaNavigate={() => setShowNotificationModal(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Savings Withdraw Modal - Wallet Selection (for savings details page) */}
      {showSavingsWithdrawModal && (
        <div className="savings-withdraw-modal-overlay" onClick={() => {
          setShowSavingsWithdrawModal(false);
          setSelectedWithdrawWallet(null);
        }}>
          <div className="savings-withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="savings-withdraw-modal-header">
              <h2 className="savings-withdraw-modal-title">Withdraw</h2>
              <button 
                type="button" 
                className="savings-withdraw-modal-close" 
                onClick={() => {
                  setShowSavingsWithdrawModal(false);
                  setSelectedWithdrawWallet(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="savings-withdraw-modal-content">
              <div className="savings-withdraw-select-label">Select Wallet</div>
              
              <div className="savings-withdraw-wallet-grid">
                {savingsWallets.map((wallet, index) => {
                  const Icon = wallet.icon;
                  const percentageValue = parseInt(wallet.percentage);
                  const radius = 14;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (percentageValue / 100) * circumference;
                  
                  const hexToRgba = (hex, alpha) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                  };
                  
                  const backgroundColor = hexToRgba(wallet.color, 0.2);
                  const isSelected = selectedWithdrawWallet === index;
                  
                  return (
                    <div 
                      key={index} 
                      className={`savings-withdraw-wallet-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedWithdrawWallet(index)}
                    >
                      <div className="savings-withdraw-wallet-card-top">
                        <div className="savings-withdraw-wallet-icon-container">
                          <svg className="savings-withdraw-wallet-progress-circle" width="36" height="36">
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke={backgroundColor}
                              strokeWidth="2.5"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke={wallet.color}
                              strokeWidth="2.5"
                              strokeDasharray={2 * Math.PI * 14}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                          <div 
                            className="savings-withdraw-wallet-icon"
                            style={{ backgroundColor: backgroundColor }}
                          >
                            <Icon size={14} style={{ color: wallet.color }} />
                          </div>
                        </div>
                        <div className="savings-withdraw-wallet-name-wrapper">
                          <div className="savings-withdraw-wallet-name">{wallet.name}</div>
                          <div className="savings-withdraw-wallet-percentage">{wallet.percentage}</div>
                        </div>
                      </div>
                      <div className="savings-withdraw-wallet-card-bottom">
                        <div className="savings-withdraw-wallet-saved-label">Saved:</div>
                        <div className="savings-withdraw-wallet-amount">{wallet.saved}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="savings-withdraw-next-btn"
                onClick={() => {
                  if (selectedWithdrawWallet !== null) {
                    setShowSavingsWithdrawModal(false);
                    setShowSavingsWithdrawConfirmModal(true);
                  }
                }}
                disabled={selectedWithdrawWallet === null}
              >
                Next
              </button>

              <div className="savings-withdraw-info-message">
                <div className="savings-withdraw-info-icon">
                  <Info size={16} />
                </div>
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <SavingsAddMoneyModal
        isOpen={showSavingsAddMoneyModal}
        onClose={() => {
          setShowSavingsAddMoneyModal(false);
          resetSavingsAddMoneyForm();
        }}
        amount={savingsAddMoneyForm.amount}
        onAmountChange={(v) => setSavingsAddMoneyForm((prev) => ({ ...prev, amount: v }))}
        accounts={savingsAddMoneyAccountOptions}
        selectedAccountId={
          savingsAddMoneyForm.walletId || savingsAddMoneyAccountOptions[0]?.id || ''
        }
        onSelectAccount={(id) => {
          const w = savingsWallets.find((x) => String(x.id) === id);
          setSavingsAddMoneyForm((prev) => ({
            ...prev,
            walletId: id,
            savingAccount: w?.name || prev.savingAccount,
          }));
        }}
        onTransfer={submitSavingsTransfer}
        isSubmitting={isSubmittingSavingsTransfer}
        isLoadingBalance={isLoadingWalletBalances}
        balanceLine={savingsAddMoneyBalanceLine}
      />

      <AddSavingsPlanModal
        isOpen={showAddSavingsAccountModal}
        onClose={() => {
          setShowAddSavingsAccountModal(false);
          resetAddSavingsAccountForm();
        }}
        name={addSavingsAccountForm.name}
        onNameChange={(v) => setAddSavingsAccountForm((prev) => ({ ...prev, name: v }))}
        selectedPlan={addSavingsAccountForm.category}
        onSelectPlan={(plan) => setAddSavingsAccountForm((prev) => ({ ...prev, category: plan }))}
        amount={addSavingsAccountForm.amount}
        onAmountChange={(v) => setAddSavingsAccountForm((prev) => ({ ...prev, amount: v }))}
        autoSaveAmount={addSavingsAccountForm.autoSaveAmount}
        onAutoSaveAmountChange={(v) =>
          setAddSavingsAccountForm((prev) => ({ ...prev, autoSaveAmount: v }))
        }
        autoSaveFrequency={addSavingsAccountForm.autoSaveFrequency}
        onAutoSaveFrequencyChange={(v) =>
          setAddSavingsAccountForm((prev) => ({ ...prev, autoSaveFrequency: v }))
        }
        exchangeRateLine="1 XRP = 1.05 USD"
        onCreate={submitCreateAddSavingsPlan}
        isSubmitting={isCreatingSavingsAccount}
      />

      {/* Savings Withdraw Confirm Modal - Shows selected wallet and balance */}
      {showSavingsWithdrawConfirmModal && selectedWithdrawWallet !== null && (
        <div className="savings-withdraw-modal-overlay" onClick={() => {
          setShowSavingsWithdrawConfirmModal(false);
          setSelectedWithdrawWallet(null);
        }}>
          <div className="savings-withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="savings-withdraw-modal-header">
              <h2 className="savings-withdraw-modal-title">Withdraw</h2>
              <button 
                type="button" 
                className="savings-withdraw-modal-close" 
                onClick={() => {
                  setShowSavingsWithdrawConfirmModal(false);
                  setSelectedWithdrawWallet(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="savings-withdraw-confirm-content">
              <div className="savings-withdraw-confirm-card">
                <div className="savings-withdraw-confirm-wallet-section">
                  <div className="savings-withdraw-confirm-wallet-info">
                    <div className="savings-withdraw-confirm-wallet-icon-container">
                      <div 
                        className="savings-withdraw-confirm-wallet-icon"
                        style={{ backgroundColor: savingsWallets[selectedWithdrawWallet].color }}
                      >
                        {(() => {
                          const Icon = savingsWallets[selectedWithdrawWallet].icon;
                          return <Icon size={18} style={{ color: '#ffffff' }} />;
                        })()}
                      </div>
                    </div>
                    <div className="savings-withdraw-confirm-wallet-name-wrapper">
                      <div className="savings-withdraw-confirm-wallet-name">{savingsWallets[selectedWithdrawWallet].name}</div>
                      <div className="savings-withdraw-confirm-status-badge">
                        <span>Completed</span>
                      </div>
                    </div>
                  </div>
                  <div className="savings-withdraw-confirm-balance-section">
                    <div className="savings-withdraw-confirm-balance-label">Balance</div>
                    <div className="savings-withdraw-confirm-balance-amount">{savingsWallets[selectedWithdrawWallet].saved}</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="savings-withdraw-confirm-btn"
                  onClick={() => submitSavingsWithdraw()}
                  disabled={isSubmittingSavingsWithdraw}
                >
                  {isSubmittingSavingsWithdraw ? 'Processing…' : 'Withdraw'}
                </button>

                <div className="savings-withdraw-info-message">
                  <div className="savings-withdraw-info-icon">
                    <Info size={16} />
                  </div>
                  <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderTransactionDetailsModal()}

    </>
      </PersonalSidebarWalletProvider>
    );
  }

  // Render mobile savings full page
  if (showSavingsPage) {
    return (
      <PersonalSidebarWalletProvider
        isSessionExpired={isSessionExpired}
        enabled={accountType !== 'Business Suite'}
      >
      <>
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar Drawer */}
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
              <p className="mobile-sidebar-section-label">
                {accountType === 'Business Suite' ? 'Business Suite' : 'General'}
              </p>
              <nav className="mobile-sidebar-nav">
                {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
                  const Icon = item.icon;
                  const isActive = isGeneralNavItemActive(item.label, location.pathname, accountType);
                  const handleNavClick = () =>
                    handleGeneralNavClick({
                      itemLabel: item.label,
                      accountType,
                      navigate,
                      setShowDesktopSavingsDashboard,
                      closeMobileMenu: () => setIsMobileMenuOpen(false)
                    });
                  const navBadge = getNavBadge(item);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={handleNavClick}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {navBadge != null && navBadge !== '' ? (
                        <span className="mobile-sidebar-badge">{navBadge}</span>
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>

            {accountType === 'Business Suite' && (
              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">Developers Tool</p>
                <nav className="mobile-sidebar-nav">
                  {developersNav.map((item) => {
                    const Icon = item.icon;
                    const developerPath = getDeveloperNavPath(item.label);
                    const isDevActive = developerPath && location.pathname === developerPath;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`mobile-sidebar-nav-item${isDevActive ? ' active' : ''}`}
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (developerPath) navigate(developerPath);
                        }}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}

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
                    <button 
                      key={item.label} 
                      type="button" 
                      className="mobile-sidebar-nav-item"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (item.label === 'Settings') {
                          navigate(
                            '/settings',
                            accountType === 'Business Suite'
                              ? { state: { accountType: 'Business Suite' } }
                              : undefined
                          );
                        }
                      }}
                    >
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

              <button type="button" className="mobile-sidebar-logout">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mobile-savings-full-page">
          <div className="mobile-savings-page-header">
            <div className="mobile-savings-page-title-wrapper">
              <div className="mobile-section-indicator"></div>
              <h2>Fund Savings</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="mobile-header-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
              >
                <Menu size={20} />
              </button>
              <button 
                type="button" 
                className="mobile-savings-close-btn"
                onClick={() => setShowSavingsPage(false)}
              >
                <X size={20} />
              </button>
            </div>
          </div>

        <div className="mobile-savings-page-content">
          {/* Amount Section */}
          <div className="mobile-savings-amount-section">
            <div className="mobile-savings-amount-header">
              <label className="mobile-savings-section-label">Amount</label>
              <div className="mobile-savings-wallet-selector-pill">
                <div className="mobile-savings-wallet-pill-badge">
                  <img 
                    src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                    alt="XRP" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                </div>
                <span className="mobile-savings-wallet-pill-text">XRP wallet</span>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="mobile-savings-amount-input-wrapper">
              <input
                type="text"
                className="mobile-savings-amount-input"
                placeholder="0"
                value={savingsAmount}
                onChange={(e) => {
                  // Only allow numbers and decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setSavingsAmount(value);
                }}
              />
              <span className="mobile-savings-amount-suffix">XRP</span>
            </div>
            <div className="mobile-savings-amount-display">
              {(() => {
                if (!savingsAmount || savingsAmount === '0' || savingsAmount === '') {
                  return '$0.00';
                }
                // Calculate USD value from XRP using exchange rate
                const xrpAmount = parseFloat(savingsAmount) || 0;
                if (exchangeRates && exchangeRates.length > 0) {
                  const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                  if (xrpToUsdRate) {
                    const usdValue = xrpAmount * Number(xrpToUsdRate);
                    return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }
                // Fallback calculation (approximate rate)
                const usdValue = xrpAmount * 0.5430;
                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              })()}
            </div>
            <div className="mobile-savings-balance-text">Balance: 24,567.89 XRP</div>
          </div>

          {/* Saving Accounts Section */}
          <div className="mobile-savings-accounts-section">
            <label className="mobile-savings-section-label">Saving accounts</label>
            <div className="mobile-savings-account-link">
              <span className="mobile-savings-account-link-text">My Goals</span>
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Transfer Button */}
          <div className="mobile-savings-actions">
            <button 
              type="button" 
              className="mobile-savings-transfer-btn"
              onClick={() => {
                setShowSavingsSummary(true);
              }}
            >
              Transfer
            </button>
          </div>

          {/* Information Message */}
          <div className="mobile-savings-info-message">
            <div className="mobile-savings-info-icon">
              <Info size={16} />
            </div>
            <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
          </div>
        </div>
      </div>
      </>
      </PersonalSidebarWalletProvider>
    );
  }

  return (
    <PersonalSidebarWalletProvider
      isSessionExpired={isSessionExpired}
      enabled={accountType !== 'Business Suite'}
    >
    <>
      {/* Mobile Header - Only visible on mobile */}
      <PersonalSuiteMobileHeader
        variant={isBusinessSuiteAccount ? 'business' : 'personal'}
        className="transactions-mobile-header"
        userAvatar={headerAvatar}
        userInitials={headerInitials}
        userFullName={headerName}
        personalVerificationComplete={kycComplete}
        businessVerificationComplete={kycComplete}
        businessLogoUrl={businessCompanyLogoUrl}
        businessName={businessCompanyName}
        businessAvatarLoading={isLoadingBusinessIdentity}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
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
            <p className="mobile-sidebar-section-label">
              {accountType === 'Business Suite' ? 'Business Suite' : 'General'}
            </p>
            <nav className="mobile-sidebar-nav">
              {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
                const Icon = item.icon;
                const isActive = isGeneralNavItemActive(item.label, location.pathname, accountType);
                const handleNavClick = () =>
                  handleGeneralNavClick({
                    itemLabel: item.label,
                    accountType,
                    navigate,
                    setShowDesktopSavingsDashboard,
                    closeMobileMenu: () => setIsMobileMenuOpen(false)
                  });
                const navBadge = getNavBadge(item);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {navBadge != null && navBadge !== '' ? (
                      <span className="mobile-sidebar-badge">{navBadge}</span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {accountType === 'Business Suite' && (
            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Developers Tool</p>
              <nav className="mobile-sidebar-nav">
                {developersNav.map((item) => {
                  const Icon = item.icon;
                  const developerPath = getDeveloperNavPath(item.label);
                  const isDevActive = developerPath && location.pathname === developerPath;
                  return (
                    <button 
                      key={item.label} 
                      type="button" 
                      className={`mobile-sidebar-nav-item${isDevActive ? ' active' : ''}`}
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (developerPath) navigate(developerPath);
                      }}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

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
                  <button 
                    key={item.label} 
                    type="button" 
                    className="mobile-sidebar-nav-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (item.label === 'Settings') {
                        navigate(
                          '/settings',
                          accountType === 'Business Suite'
                            ? { state: { accountType: 'Business Suite' } }
                            : undefined
                        );
                      }
                    }}
                  >
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

            <button type="button" className="mobile-sidebar-logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard transactions-page">
        <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
          <nav className="sidebar-nav">
            {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
              const Icon = item.icon;
              const isActive = isGeneralNavItemActive(item.label, location.pathname, accountType);
              const handleNavClick = () =>
                handleGeneralNavClick({
                  itemLabel: item.label,
                  accountType,
                  navigate,
                  setShowDesktopSavingsDashboard,
                  closeMobileMenu: undefined
                });
              const navBadge = getNavBadge(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {navBadge != null && navBadge !== '' ? (
                    <span className="sidebar-badge">{navBadge}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {accountType === 'Business Suite' && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Developers Tool</p>
            <nav className="sidebar-nav">
              {developersNav.map((item) => {
                const Icon = item.icon;
                const developerPath = getDeveloperNavPath(item.label);
                const isDevActive = developerPath && location.pathname === developerPath;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`sidebar-nav-item${isDevActive ? ' active' : ''}`}
                    onClick={() => {
                      if (developerPath) navigate(developerPath);
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {accountType !== 'Business Suite' && <PersonalSidebarWalletNav />}

        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const Icon = item.icon;
              const handleSupportNavClick = () => {
                if (item.label === 'Settings') {
                  navigate(
                    '/settings',
                    accountType === 'Business Suite'
                      ? { state: { accountType: 'Business Suite' } }
                      : undefined
                  );
                }
              };
              const isActive = item.label === 'Settings' && location.pathname === '/settings';
              return (
                <button 
                  key={item.label} 
                  type="button" 
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleSupportNavClick}
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
            {(isBusinessSuiteAccount || kycComplete) ? (
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
            ) : (
              <button type="button" className="kyc-status">
                <KeyRound size={16} />
                <span>KYC</span>
                <span>Unverified</span>
              </button>
            )}
            <div className="account-type-display">
              <span className="account-type-label">{accountType}</span>
            </div>
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <HeaderProfileAvatarNav>
                {headerAvatar ? (
                  <img src={headerAvatar} alt={headerName} className="user-avatar-img" />
                ) : (
                  headerInitials
                )}
                <HeaderProfileVerifyBadge show={kycComplete} />
              </HeaderProfileAvatarNav>
            </div>
          </div>
        </header>

        <div className="transactions-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">{isBusinessSuiteAccount ? 'Business Suite' : 'General'}</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">Transactions</span>
          </div>

          {/* Summary Cards Row - Like Dashboard */}
          <div className="dashboard-summary-cards">
            {/* Total Balance Card */}
            <div className="summary-card total-balance-card transactions-total-balance-card">
              <div className="summary-card-header transactions-tbc-header">
                <div className="transactions-tbc-header-main">
                  <span className="transactions-tbc-wallet-shell" aria-hidden>
                    <Wallet size={18} strokeWidth={2} />
                  </span>
                  <h3>Total Balance</h3>
                  <button
                    type="button"
                    onClick={() => setShowBalance(!showBalance)}
                    className="eye-toggle transactions-tbc-eye"
                    aria-label={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>
              <div className="summary-card-value-row transactions-tbc-value-row">
                {showBalance && isLoadingDashboard ? (
                  <DashboardBalanceSkeleton />
                ) : (
                  <>
                <div className="summary-card-value transactions-tbc-usd">
                  {showBalance 
                    ? (() => {
                            // Calculate USD value from XRP using exchange rate from API
                            if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                              // Try to find XRP to USD rate
                              const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                              if (xrpToUsdRate) {
                                const usdValue = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              }
                              // Fallback: try to find USD rate from exchange rates array
                              const usdRate = exchangeRates.find(r => 
                                (r.from === 'XRP' && r.to === 'USD') || 
                                (r.currency === 'USD' || r.code === 'USD')
                              );
                              if (usdRate && usdRate.rate) {
                                const usdValue = Number(dashboardData.balance.xrp) * Number(usdRate.rate);
                                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              }
                            }
                            // Fallback to dashboard USD if available
                            if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                              return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            return '$0.00';
                          })()
                    : '••••••'}
                </div>
                <div className="summary-card-subvalue transactions-tbc-xrp">
                  {showBalance ? (
                    <>
                      ≈{' '}
                      {dashboardData?.balance?.xrp !== undefined &&
                        dashboardData?.balance?.xrp !== null ? (
                        Number(dashboardData.balance.xrp).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      ) : (
                        '0.00'
                      )}{' '}
                      XRP
                    </>
                  ) : (
                    <>≈ •••••• XRP</>
                  )}
                </div>
                  </>
                )}
              </div>
              <div className="summary-card-actions transactions-tbc-actions">
                <button 
                  type="button" 
                  className="summary-card-btn primary transactions-tbc-btn-deposit"
                  onClick={() => setShowFundMethodModal(true)}
                >
                  <Plus size={18} strokeWidth={2.5} aria-hidden />
                  Deposit
                </button>
                <button 
                  type="button" 
                  className="summary-card-btn primary transactions-tbc-btn-convert"
                  onClick={() => setShowSwapModal(true)}
                >
                  <RefreshCw size={16} strokeWidth={2} aria-hidden />
                  Convert
                </button>
                <button 
                  type="button" 
                  className="summary-card-btn secondary transactions-tbc-btn-send"
                  onClick={() => setShowSendModal(true)}
                >
                  <Send size={16} strokeWidth={2} aria-hidden />
                  Send
                </button>
              </div>
            </div>

            {/* Wallet Summary Cards */}
            <div className="wallet-cards-grid">
              {isLoadingWalletBalances ? (
                <WalletOverviewCardsSkeleton count={3} />
              ) : (
              <>
              <div className="wallet-overview-card">
                <div className="wallet-overview-header">
                  <div className="wallet-overview-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="XRP" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <h3 className="wallet-overview-name">XRP wallet</h3>
                </div>
                <div className="wallet-overview-content">
                  <div className="wallet-overview-primary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" />
                          : (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null
                              ? `${Number(walletBalances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`
                              : '0.00 XRP'))
                      : '••••••'}
                  </div>
                  <div className="wallet-overview-secondary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" /> 
                          : (() => {
                              // Calculate USD value from XRP using exchange rate from API
                              if (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                                // Try to find XRP to USD rate
                                const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                                if (xrpToUsdRate) {
                                  const usdValue = Number(walletBalances.xrp) * Number(xrpToUsdRate);
                                  return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                                // Fallback: try to find USD rate from exchange rates array
                                const usdRate = exchangeRates.find(r => 
                                  (r.from === 'XRP' && r.to === 'USD') || 
                                  (r.currency === 'USD' || r.code === 'USD')
                                );
                                if (usdRate && usdRate.rate) {
                                  const usdValue = Number(walletBalances.xrp) * Number(usdRate.rate);
                                  return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                }
                              }
                              return '$0.00';
                            })())
                      : '••••••'}
                  </div>
                </div>
                <div className="wallet-overview-trend">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>

              <div className="wallet-overview-card">
                <div className="wallet-overview-header">
                  <div className="wallet-overview-icon usdt-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                      alt="USDT" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <h3 className="wallet-overview-name">Tether USD</h3>
                </div>
                <div className="wallet-overview-content">
                  <div className="wallet-overview-primary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" />
                          : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                              ? `${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                              : '0.00 USDT'))
                      : '••••••'}
                  </div>
                  <div className="wallet-overview-secondary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" /> 
                          : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                              ? `$${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '$0.00'))
                      : '••••••'}
                  </div>
                </div>
                <div className="wallet-overview-trend">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>

              <div className="wallet-overview-card">
                <div className="wallet-overview-header">
                  <div className="wallet-overview-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                      alt="USDC" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <h3 className="wallet-overview-name">USD Coin</h3>
                </div>
                <div className="wallet-overview-content">
                  <div className="wallet-overview-primary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" />
                          : (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                              ? `${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                              : '0.00 USDC'))
                      : '••••••'}
                  </div>
                  <div className="wallet-overview-secondary">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" /> 
                          : (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                              ? `$${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '$0.00'))
                      : '••••••'}
                  </div>
                </div>
                <div className="wallet-overview-trend">
                  <TrendingUp size={14} />
                  <span>+2.4%</span>
                </div>
              </div>
              </>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="transactions-middle">
            {/* Left Column */}
            <div className="transactions-left-column">
              {/* Payment Methods Section */}
              <div className="transactions-section-card my-details-section">
                <div className="section-content my-details-inner">
                  <div className="my-details-header">
                    <span className="my-details-accent-bar" aria-hidden />
                    <h3 className="my-details-heading">Payment Methods</h3>
                  </div>
                  <ul className="my-details-rows">
                    <li className="my-details-row">
                      <div className="my-details-row-icon" aria-hidden>
                        <Building2 size={20} strokeWidth={1.75} />
                      </div>
                      <span className="my-details-row-label">Fund with bank account</span>
                      <div className="my-details-row-value">
                        {linkedAccounts?.bankAccount ? (
                          <span>{linkedAccounts.bankAccount}</span>
                        ) : (
                          <button
                            type="button"
                            className="my-details-link-btn"
                            onClick={() => {
                              toast('Bank account linking coming soon');
                            }}
                          >
                            Link Bank Account
                          </button>
                        )}
                      </div>
                    </li>
                    <li className="my-details-row">
                      <div className="my-details-row-icon" aria-hidden>
                        <Wallet size={20} strokeWidth={1.75} />
                      </div>
                      <span className="my-details-row-label">Fund with Web3 Wallet</span>
                      <div className="my-details-row-value">
                        {linkedAccounts?.web3Wallet ? (
                          <span>{linkedAccounts.web3Wallet}</span>
                        ) : isWalletConnectedViaAPI && isConnected && account ? (
                          <span>XUMM (Connected)</span>
                        ) : (
                          <button
                            type="button"
                            className="my-details-link-btn"
                            onClick={() => {
                              if (!isWalletConnectedViaAPI) {
                                setShowConnectWalletModal(true);
                              }
                            }}
                          >
                            Connect Wallet
                          </button>
                        )}
                      </div>
                    </li>
                    <li className="my-details-row my-details-row--digital-wallets">
                      <div className="my-details-row-icon" aria-hidden>
                        <CreditCard size={20} strokeWidth={1.75} />
                      </div>
                      <span className="my-details-row-label">Fund with digital wallets</span>
                      <div className="my-details-row-value my-details-digital-wallets">
                        <button
                          type="button"
                          className="my-details-digital-wallet-btn"
                          aria-label="Fund with Google Pay"
                          onClick={() => openStripeDeposit('googlepay')}
                        >
                          <DepositGooglePayMark />
                        </button>
                        <button
                          type="button"
                          className="my-details-digital-wallet-btn"
                          aria-label="Fund with Apple Pay"
                          onClick={() => openStripeDeposit('applepay')}
                        >
                          <DepositApplePayMark />
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Beneficiaries Section */}
              <div className="transactions-section-card beneficiaries-card">
                <div className="section-content beneficiaries-inner">
                  <div className="beneficiaries-header">
                    <span className="beneficiaries-accent-bar" aria-hidden />
                    <h3 className="beneficiaries-heading">
                      <span className="beneficiaries-heading-label beneficiaries-heading-label--desktop">
                        Send to Trustichain Users
                      </span>
                      <span className="beneficiaries-heading-label beneficiaries-heading-label--mobile">
                        Beneficiaries
                      </span>
                    </h3>
                  </div>
                  <div className="beneficiaries-toolbar">
                    <div className="beneficiaries-avatars-row">
                      <button
                        type="button"
                        className="beneficiary-add-btn"
                        aria-label="Add recipient"
                        onClick={() => setShowAddBeneficiaryModal(true)}
                      >
                        <Plus size={22} strokeWidth={2.75} aria-hidden />
                      </button>
                      <div className="beneficiary-avatar-stack">
                        {!isLoadingBeneficiaries &&
                          beneficiaries.map((beneficiary) => {
                            const avatarUrl = getBeneficiaryAvatarUrl(beneficiary);
                            const label = getBeneficiaryDisplayName(beneficiary);
                            const initials = getBeneficiaryInitials(beneficiary);
                            return (
                              <button
                                key={beneficiary.id ?? label}
                                type="button"
                                className="beneficiary-avatar-btn"
                                aria-label={`Remove ${label}`}
                                onClick={() => {
                                  setBeneficiaryToRemove(beneficiary);
                                  setShowRemoveBeneficiaryModal(true);
                                }}
                              >
                                {avatarUrl ? (
                                  <img
                                    src={avatarUrl}
                                    alt=""
                                    className="beneficiary-avatar-img"
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="beneficiary-avatar-img beneficiary-avatar-img--initials" aria-hidden>
                                    {initials}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="send-beneficiary-btn"
                      onClick={() => setShowSendModal(true)}
                    >
                      <Share size={18} strokeWidth={2} aria-hidden />
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Exchange Rate Section */}
              <div className="transactions-section-card">
                <div className="section-indicator"></div>
                <div className="section-content">
                  <h3 className="section-title">Live Exchange Rate</h3>
                  <div className="rate-list">
                    {isLoadingRates ? (
                      <DashboardExchangeRatesSkeleton count={5} />
                    ) : null}

                    {!isLoadingRates && Array.isArray(exchangeRates) && exchangeRates.length > 0 && exchangeRates.map((rate, index) => {
                      const code = (rate.currency || rate.code || '').toUpperCase();
                      const change = Number(rate.changePercent ?? rate.change ?? 0);
                      const isPositive = change > 0;
                      const isNegative = change < 0;
                      const flagCode =
                        code === 'USD' ? 'us' :
                        code === 'EUR' ? 'eu' :
                        code === 'GBP' ? 'gb' :
                        code === 'JPY' ? 'jp' :
                        code === 'NGN' ? 'ng' :
                        code === 'CAD' ? 'ca' :
                        code === 'AUD' ? 'au' :
                        code === 'CNY' ? 'cn' :
                        'us';

                      const symbol =
                        code === 'USD' ? '$' :
                        code === 'EUR' ? '€' :
                        code === 'GBP' ? '£' :
                        code === 'JPY' ? '¥' :
                        '';

                      return (
                        <div className="rate-item" key={`${code}-${index}`}>
                          <div className="rate-flag">
                            <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt={code} />
                          </div>
                          <div className="rate-info">
                            <span className="rate-currency">{code}</span>
                          </div>
                          <div className="rate-value-change">
                            <span className="rate-value">
                              {symbol}{Number(rate.rate ?? rate.value ?? 0).toFixed(4)}
                            </span>
                            <div className={`rate-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
                              {isPositive && <TrendingUp size={14} />}
                              {isNegative && <TrendingDown size={14} />}
                              <span>
                                {change === 0 ? '0.0%' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!isLoadingRates && (!Array.isArray(exchangeRates) || exchangeRates.length === 0) && (
                      <div className="rate-item">
                        <div className="rate-info">
                          <span className="rate-currency">No exchange rates available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="transactions-right-column">
              {/* Transaction History Section */}
              <div className="transactions-section-card transaction-history-card">
                <div className="section-content transaction-history-inner">
                  <div className="transaction-history-header">
                    <div className="transaction-history-title-wrapper">
                      <h3 className="transaction-history-heading">Transaction History</h3>
                      <button
                        type="button"
                        className="transaction-history-nav-btn"
                        aria-label="View all transactions"
                      >
                        <ArrowRight size={18} className="transaction-history-arrow" aria-hidden />
                      </button>
                    </div>
                    <div className="transaction-filters">
                      <select 
                        className="filter-select"
                        value={transactionFilter}
                        onChange={(e) => setTransactionFilter(e.target.value)}
                      >
                        <option value="All">Filter</option>
                        <option value="Received">Received</option>
                        <option value="Sent">Sent</option>
                        <option value="All">All</option>
                      </select>
                      <select 
                        className="filter-select"
                        value={monthlyFilter}
                        onChange={(e) => setMonthlyFilter(e.target.value)}
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="This month">This month</option>
                        <option value="Last month">Last month</option>
                      </select>
                      <button type="button" className="filter-icon-btn">
                        <Filter size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Mobile Transaction Cards */}
                  <div className="mobile-transaction-cards">
                    {isLoadingTransactions ? (
                      <TransactionHistoryCardsSkeleton count={4} />
                    ) : transactions.length === 0 ? (
                      <div className="mobile-transaction-card">
                        <div className="mobile-transaction-content">
                          <span>No transactions found</span>
                        </div>
                      </div>
                    ) : (
                    paginatedTransactions.map((transaction, index) => {
                      const globalIndex = (currentPage - 1) * itemsPerPage + index;
                      const transactionId = formatTransactionId(transaction.id || transaction.transactionId || `TXN-${globalIndex}`);
                      const type = transaction.type || transaction.transactionType || 'Received';
                      const amountXrp = transaction.amount?.xrp || transaction.amountXrp || transaction.amount || 0;
                      const amountUsd = transaction.amount?.usd || transaction.amountUsd || (amountXrp * 0.5);
                      const status = transaction.status || 'Successful';
                      const date = transaction.date || transaction.createdAt || '2024-07-04';
                      const isReceived = isIncomingTransaction(transaction);

                      return (
                        <div 
                          key={transaction.id || globalIndex} 
                          className="mobile-transaction-card"
                        >
                          <div className="mobile-transaction-top">
                            <div className="mobile-transaction-left">
                              <div className={`mobile-transaction-icon ${isReceived ? 'received' : 'sent'}`}>
                                {isReceived ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                              </div>
                              <div className="mobile-transaction-type">{type}</div>
                            </div>
                            <div className="mobile-transaction-right">
                              <div className={`mobile-transaction-status ${status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed' ? 'successful' : 'pending'}`}>
                                {status}
                              </div>
                              <div className="mobile-transaction-date">{formatDate(date)}</div>
                            </div>
                          </div>
                          <p className="mobile-transaction-details">
                            {isReceived ? 'You received' : 'You sent'}{' '}
                            {Number(amountXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP, worth $
                            {Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD.
                          </p>
                        </div>
                      );
                    })
                    )}
                  </div>
                  <div className="transaction-table-wrapper">
                    <table className="transaction-table">
                      <thead>
                        <tr>
                          <th>Transaction ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingTransactions ? (
                          <tr>
                            <td colSpan="5">
                              <DashboardEscrowTableSkeleton rows={5} columns={5} />
                            </td>
                          </tr>
                        ) : null}
                        {!isLoadingTransactions && transactions.length === 0 && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                              No transactions found
                            </td>
                          </tr>
                        )}
                        {!isLoadingTransactions && transactions.length > 0 && paginatedTransactions.length > 0 && paginatedTransactions.map((transaction, index) => {
                          const globalIndex = (currentPage - 1) * itemsPerPage + index;
                          const transactionId = formatTransactionId(transaction.id || transaction.transactionId || `TXN-${globalIndex}`);
                          const type = transaction.type || transaction.transactionType || 'Received';
                          const amountXrp = transaction.amount?.xrp || transaction.amountXrp || transaction.amount || 0;
                          const amountUsd = transaction.amount?.usd || transaction.amountUsd || (amountXrp * 0.5);
                          const status = transaction.status || 'Successful';
                          const date = transaction.date || transaction.createdAt || '2024-07-04';
                          const isReceived = isIncomingTransaction(transaction);

                          return (
                            <tr key={transaction.id || globalIndex}>
                              <td>
                                <div className="transaction-id-with-type">
                                  <div className="transaction-type-indicator">
                                    {isReceived ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                                    <span>{type}</span>
                                  </div>
                                  <div className="transaction-id-cell">{transactionId}</div>
                                </div>
                              </td>
                              <td>
                                <div className="transaction-amount-cell">
                                  <span className={isReceived ? 'amount-positive' : 'amount-negative'}>
                                    {isReceived ? '+' : '-'}{Number(amountXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP
                                  </span>
                                  <span className="amount-usd">(${Number(amountUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD)</span>
                                </div>
                              </td>
                              <td>
                                <span className={`status-badge ${status.toLowerCase() === 'successful' || status.toLowerCase() === 'completed' ? 'successful' : 'pending'}`}>
                                  {status}
                                </span>
                              </td>
                              <td>
                                <div className="transaction-date-cell">{formatDate(date)}</div>
                              </td>
                              <td>
                                <div className="transaction-direction-icon" aria-hidden>
                                  {isReceived ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!isLoadingTransactions && transactions.length > 0 && (
                    <div className="transaction-pagination">
                      <div className="pagination-info">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} transactions
                      </div>
                      <div className="pagination-controls">
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ArrowLeft size={16} />
                          Previous
                        </button>
                        <div className="pagination-pages">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  type="button"
                                  className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="pagination-ellipsis">...</span>;
                            }
                            return null;
                          })}
                        </div>
                        <button
                          type="button"
                          className="pagination-btn"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Notification</h2>
              </div>
              <button type="button" className="notification-close-btn" onClick={() => setShowNotificationModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="notification-filter-bar">
              <div className="notification-filter-buttons">
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('All')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'Unread' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('Unread')}
                >
                  Unread
                </button>
              </div>
              <button
                type="button"
                className="notification-filter-icon"
                onClick={handleMarkAllNotificationsRead}
                disabled={isLoadingNotifications}
              >
                <Filter size={18} />
              </button>
            </div>

            <div className="notification-list">
              {isLoadingNotifications ? (
                <NotificationListSkeleton count={6} />
              ) : (
                <NotificationListItems
                  notifications={notifications}
                  expandedNotificationId={expandedNotificationId}
                  onToggleExpand={(nid) => setExpandedNotificationId((p) => (p === nid ? null : nid))}
                  onMarkRead={handleMarkNotificationRead}
                  formatTimeAgo={formatTimeAgo}
                  onBeforeCtaNavigate={() => setShowNotificationModal(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fund Wallet Modal (Receive on personal platform) */}
      {showFundWalletModal && (
        <div
          className={`notification-modal-overlay deposit-flow-overlay${fundViaAddress ? ' deposit-address-overlay' : ''}`}
          onClick={() => {
          if (!isFundingWallet || fundingStep === 'idle') {
            setShowFundWalletModal(false);
            setFundWalletForm({ amount: '', currency: 'XRP' });
            setTransactionData(null);
            setFundingStep('idle');
            setIsFundingWallet(false);
            setFundViaAddress(false);
            setFundDepositPaymentMethod(null);
            setDepositAddressNetwork('XRPL');
          }
        }}>
          <div
            className={`notification-modal ${fundViaAddress ? 'fund-wallet-transfer-modal deposit-address-flow' : 'fund-wallet-modal'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Deposit</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => {
                  setShowFundWalletModal(false);
                  setFundWalletForm({ amount: '', currency: 'XRP' });
                  setTransactionData(null);
                  setFundingStep('idle');
                  setIsFundingWallet(false);
                  setFundViaAddress(false);
                  setFundDepositPaymentMethod(null);
                  setDepositAddressNetwork('XRPL');
                }}
                disabled={isFundingWallet && fundingStep !== 'idle'}
              >
                <X size={20} />
              </button>
            </div>

            {fundViaAddress ? (
              <div className="fund-wallet-transfer-modal-content deposit-address-modal-content">
                <DepositAddressSelectors
                  currency={fundWalletForm.currency}
                  network={depositAddressNetwork}
                  onCurrencyChange={(code) =>
                    setFundWalletForm((prev) => ({ ...prev, currency: code }))
                  }
                  onNetworkChange={setDepositAddressNetwork}
                  currencySelectId="deposit-fund-currency"
                  networkSelectId="deposit-fund-network"
                />

                <div className="fund-wallet-transfer-form-group">
                  <span className="fund-wallet-transfer-label">Scan</span>
                  {isLoadingWalletBalances && !depositDisplayAddress ? (
                    <div className="deposit-address-scan-loading">
                      <LoadingIndicator size="md" />
                      <span>Loading deposit address from your wallet…</span>
                    </div>
                  ) : depositDisplayAddress ? (
                    <div className="fund-wallet-transfer-address-section deposit-scan-address-section">
                      <div className="fund-wallet-transfer-qr-code deposit-address-qr">
                        <QRCode
                          value={depositDisplayAddress}
                          size={120}
                          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                          viewBox="0 0 256 256"
                        />
                      </div>
                      <div className="deposit-scan-address-inline">
                        <div className="deposit-scan-address-lines" translate="no">
                          {splitDepositAddressLines(depositDisplayAddress).map((line, i) => (
                            <span key={i}>{line}</span>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="fund-wallet-transfer-copy-btn deposit-scan-copy-btn"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(depositDisplayAddress);
                              toast.success('Address copied to clipboard');
                            } catch (err) {
                              console.error('Failed to copy wallet address:', err);
                              toast.error('Failed to copy address');
                            }
                          }}
                          aria-label="Copy address"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="deposit-address-empty-message">
                      No deposit address returned from the server. Create or connect a wallet, then try again.
                    </p>
                  )}
                </div>

                <div className="fund-wallet-transfer-actions">
                  <button
                    type="button"
                    className="fund-wallet-transfer-preview-btn"
                    onClick={() => {
                      setShowFundWalletModal(false);
                      setFundWalletForm({ amount: '', currency: 'XRP' });
                      setTransactionData(null);
                      setFundingStep('idle');
                      setIsFundingWallet(false);
                      setFundViaAddress(false);
                      setFundDepositPaymentMethod(null);
                      setDepositAddressNetwork('XRPL');
                    }}
                  >
                    Confirm
                  </button>
                </div>

                <div className="fund-wallet-transfer-info-message">
                  <div className="fund-wallet-transfer-info-icon">
                    <Info size={16} />
                  </div>
                  <span>Recipient gets the funds immediately—or a full refund applies.</span>
                </div>
              </div>
            ) : (
              <>
                {/* Progress Indicator */}
                {isFundingWallet && fundingStep !== 'idle' && (
                  <div className="fund-wallet-progress" style={{ padding: '15px 20px', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: fundingStep === 'preparing' ? '#4f46e5' : fundingStep === 'signing' ? '#4f46e5' : fundingStep === 'completing' ? '#4f46e5' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {fundingStep === 'preparing' ? '1' : fundingStep === 'signing' ? '2' : fundingStep === 'completing' ? '3' : ''}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {fundingStep === 'preparing' && 'Preparing transaction...'}
                        {fundingStep === 'signing' && (
                          transactionData?.xummUrl 
                            ? 'Please sign in your Xaman wallet...' 
                            : 'Please sign in your browser wallet (Crossmark)...'
                        )}
                        {fundingStep === 'completing' && 'Completing transaction...'}
                      </span>
                    </div>
                    {fundingStep === 'signing' && (
                      <div style={{ fontSize: '12px', color: '#666', marginLeft: '30px' }}>
                        {transactionData?.xummUrl 
                          ? 'A window should open to your Xaman wallet. Please sign the transaction there.'
                          : 'Please approve the transaction in your Crossmark wallet extension popup.'
                        }
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleFundWallet} className="fund-wallet-form">
                  {STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod) && (
                    <div className="fund-wallet-stripe-method">
                      {fundDepositPaymentMethod === 'googlepay' ? (
                        <DepositGooglePayMark />
                      ) : (
                        <DepositApplePayMark />
                      )}
                      <span>
                        {fundDepositPaymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay'} deposit
                      </span>
                    </div>
                  )}
                  {!stripeFundSession && (
                    <>
                  <div className="form-group">
                    <label htmlFor="fund-amount">
                      {STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod) ? 'Amount (USD)' : 'Amount'}
                    </label>
                    <input
                      id="fund-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount"
                      value={fundWalletForm.amount}
                      onChange={(e) => setFundWalletForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      disabled={isFundingWallet}
                    />
                  </div>

                  {STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod) ? (
                    <div className="form-group">
                      <label htmlFor="fund-stripe-asset">Receive as</label>
                      <select
                        id="fund-stripe-asset"
                        value={fundWalletForm.currency}
                        onChange={(e) =>
                          setFundWalletForm((prev) => ({ ...prev, currency: e.target.value }))
                        }
                        disabled={isFundingWallet}
                      >
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="fund-currency">Wallets</label>
                      <select
                        id="fund-currency"
                        value={fundWalletForm.currency}
                        onChange={(e) => setFundWalletForm(prev => ({ ...prev, currency: e.target.value }))}
                        disabled={isFundingWallet}
                      >
                        <option value="XRP">XRP</option>
                        <option value="RLUSD">Ripple (RLUSD)</option>
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                  )}

                  <div
                    className={`fund-wallet-actions${
                      STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod)
                        ? ' fund-wallet-actions--stripe'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      className="fund-wallet-btn cancel"
                      onClick={resetStripeFundModal}
                      disabled={isFundingWallet && fundingStep !== 'idle'}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`fund-wallet-btn primary${
                        STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod)
                          ? ' fund-wallet-btn--stripe-pay'
                          : ''
                      }`}
                      disabled={isFundingWallet}
                    >
                      {fundingStep === 'preparing' && 'Preparing...'}
                      {fundingStep === 'signing' && 'Waiting for signature...'}
                      {fundingStep === 'completing' && 'Completing...'}
                      {!isFundingWallet &&
                        (fundDepositPaymentMethod === 'googlepay'
                          ? 'Continue with Google Pay'
                          : fundDepositPaymentMethod === 'applepay'
                            ? 'Continue with Apple Pay'
                            : 'Fund Wallet')}
                      {isFundingWallet && fundingStep === 'idle' && 'Processing...'}
                    </button>
                  </div>
                    </>
                  )}

                  {stripeFundSession && STRIPE_DEPOSIT_METHODS.has(fundDepositPaymentMethod) && (
                    <StripeWalletFundCheckout
                      clientSecret={stripeFundSession.clientSecret}
                      fundingAttemptId={stripeFundSession.fundingAttemptId}
                      intentId={stripeFundSession.intentId}
                      methodLabel={
                        fundDepositPaymentMethod === 'googlepay' ? 'Google Pay' : 'Apple Pay'
                      }
                      onSuccess={handleStripeFundSuccess}
                      onCancel={resetStripeFundModal}
                    />
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Withdraw Wallet Modal - Form (for transactions page) */}
      {showWithdrawWalletModal && (
        <div className="notification-modal-overlay" onClick={() => {
          if (!isWithdrawingWallet) {
            setShowWithdrawWalletModal(false);
            setWithdrawWalletForm({
              amount: '',
              currency: 'USD',
              destinationAddress: ''
            });
          }
        }}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Withdraw</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => {
                  setShowWithdrawWalletModal(false);
                  setWithdrawWalletForm({
                    amount: '',
                    currency: 'USD',
                    destinationAddress: ''
                  });
                }}
                disabled={isWithdrawingWallet}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleWithdrawWallet} className="fund-wallet-form">
              <div className="form-group">
                <label htmlFor="withdraw-amount">Amount</label>
                <input
                  id="withdraw-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={withdrawWalletForm.amount}
                  onChange={(e) => setWithdrawWalletForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  disabled={isWithdrawingWallet}
                />
              </div>

              <div className="form-group">
                <label htmlFor="withdraw-currency">Currency</label>
                <select
                  id="withdraw-currency"
                  value={withdrawWalletForm.currency}
                  onChange={(e) => setWithdrawWalletForm(prev => ({ ...prev, currency: e.target.value }))}
                  disabled={isWithdrawingWallet}
                >
                  <option value="USD">USD</option>
                  <option value="XRP">XRP</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="withdraw-destination">Destination Address</label>
                <input
                  id="withdraw-destination"
                  type="text"
                  placeholder="Enter destination wallet address"
                  value={withdrawWalletForm.destinationAddress}
                  onChange={(e) => setWithdrawWalletForm(prev => ({ ...prev, destinationAddress: e.target.value }))}
                  required
                  disabled={isWithdrawingWallet}
                />
              </div>

              <div className="fund-wallet-actions">
                <button
                  type="button"
                  className="fund-wallet-btn cancel"
                  onClick={() => {
                    setShowWithdrawWalletModal(false);
                    setWithdrawWalletForm({
                      amount: '',
                      currency: 'USD',
                      destinationAddress: ''
                    });
                  }}
                  disabled={isWithdrawingWallet}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fund-wallet-btn primary"
                  disabled={isWithdrawingWallet}
                >
                  {isWithdrawingWallet ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <div className="notification-modal-overlay swap-modal-overlay" onClick={() => {
          if (!isSwapping) {
            setShowSwapModal(false);
            setSwapForm({
              fromCurrency: 'XRP',
              toCurrency: 'USDT',
              fromAmount: '',
              toAmount: ''
            });
          }
        }}>
          <div className="notification-modal swap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Swap</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => {
                  setShowSwapModal(false);
                  setSwapForm({
                    fromCurrency: 'XRP',
                    toCurrency: 'USDT',
                    fromAmount: '',
                    toAmount: ''
                  });
                }}
                disabled={isSwapping}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePreviewSwap} className="swap-form">
              <div className="swap-container">
                {/* From Section */}
                <div className="swap-section">
                  <div className="swap-section-header">
                    <label className="swap-section-label">From</label>
                    <div className="swap-currency-selector-wrapper">
                    <select
                      id="swap-from-currency"
                      className="swap-currency-select"
                      value={swapForm.fromCurrency}
                      onChange={(e) => handleSwapCurrencyChange('fromCurrency', e.target.value)}
                      disabled={isSwapping}
                    >
                      <option value="XRP">XRP</option>
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                    </select>
                    <div className="swap-currency-selector">
                      <div className={`swap-currency-badge ${swapForm.fromCurrency === 'USDT' ? 'usdt-badge' : ''}`}>
                        {swapForm.fromCurrency === 'XRP' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.fromCurrency === 'USDT' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                            alt="USDT" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.fromCurrency === 'USDC' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                            alt="USDC" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          getCurrencyBadge(swapForm.fromCurrency)
                        )}
                      </div>
                      <span className="swap-currency-name">{getCurrencyDisplayName(swapForm.fromCurrency)}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    className="swap-amount-input"
                    placeholder="0.00"
                    value={swapForm.fromAmount}
                    onChange={(e) => handleSwapAmountChange('fromAmount', e.target.value)}
                    disabled={isSwapping}
                  />
                  <div className="swap-balance-text">
                    Balance: {isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : `${Number(getCurrencyBalance(swapForm.fromCurrency)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${swapForm.fromCurrency}`}
                  </div>
                </div>

                {/* Swap Icon Button */}
                <button
                  type="button"
                  className="swap-icon-button"
                  onClick={handleSwapCurrencies}
                  disabled={isSwapping}
                >
                  <ArrowUpDown size={20} />
                </button>

                {/* To Section */}
                <div className="swap-section">
                  <div className="swap-section-header">
                    <label className="swap-section-label">To</label>
                    <div className="swap-currency-selector-wrapper">
                    <select
                      id="swap-to-currency"
                      className="swap-currency-select"
                      value={swapForm.toCurrency}
                      onChange={(e) => handleSwapCurrencyChange('toCurrency', e.target.value)}
                      disabled={isSwapping}
                    >
                      <option value="XRP">XRP</option>
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                    </select>
                    <div className="swap-currency-selector">
                      <div className={`swap-currency-badge ${swapForm.toCurrency === 'USDT' ? 'usdt-badge' : ''}`}>
                        {swapForm.toCurrency === 'XRP' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.toCurrency === 'USDT' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                            alt="USDT" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapForm.toCurrency === 'USDC' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                            alt="USDC" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : (
                          getCurrencyBadge(swapForm.toCurrency)
                        )}
                      </div>
                      <span className="swap-currency-name">{getCurrencyDisplayName(swapForm.toCurrency)}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  </div>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    className="swap-amount-input"
                    placeholder={isFetchingSwapQuote ? "Calculating..." : "0.00"}
                    value={swapForm.toAmount}
                    onChange={(e) => handleSwapAmountChange('toAmount', e.target.value)}
                    disabled={isSwapping || isFetchingSwapQuote}
                  />
                  <div className="swap-balance-text">
                    Balance: {isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : `${Number(getCurrencyBalance(swapForm.toCurrency)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${swapForm.toCurrency}`}
                  </div>
                </div>
              </div>

              {/* Exchange Rate - Hidden on mobile, shown below button via CSS */}
              {(() => {
                const rate = getExchangeRate(swapForm.fromCurrency, swapForm.toCurrency);
                if (rate) {
                  return (
                    <div className="swap-exchange-rate">
                      <Info size={14} />
                      <span>1{getCurrencyBadge(swapForm.fromCurrency)} = {rate.toFixed(6)} {getCurrencyBadge(swapForm.toCurrency)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* DEX Toggle */}
              <div className="swap-dex-toggle" style={{ marginTop: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="use-dex-checkbox"
                  checked={useDEX}
                  onChange={(e) => setUseDEX(e.target.checked)}
                  disabled={isSwapping}
                  style={{ cursor: isSwapping ? 'not-allowed' : 'pointer' }}
                />
                <label 
                  htmlFor="use-dex-checkbox" 
                  style={{ 
                    cursor: isSwapping ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    color: 'var(--text-primary, #333)',
                    userSelect: 'none'
                  }}
                >
                  Use DEX (On-chain)
                </label>
              </div>

              {/* Slippage Tolerance Input - Only visible when DEX is enabled */}
              {useDEX && (
                <div className="swap-slippage-input" style={{ marginTop: '12px', marginBottom: '16px' }}>
                  <label 
                    htmlFor="slippage-tolerance-input" 
                    style={{ 
                      display: 'block',
                      fontSize: '14px',
                      color: 'var(--text-primary, #333)',
                      marginBottom: '8px',
                      fontWeight: 500
                    }}
                  >
                    Slippage Tolerance (%)
                  </label>
                  <input
                    type="number"
                    id="slippage-tolerance-input"
                    min="0"
                    max="100"
                    step="0.1"
                    value={slippageTolerance}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        setSlippageTolerance(value);
                      }
                    }}
                    disabled={isSwapping}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: isSwapping ? 'not-allowed' : 'text',
                      backgroundColor: isSwapping ? '#f5f5f5' : 'white'
                    }}
                  />
                </div>
              )}

              {/* Preview Swap Button */}
              <div className="swap-actions">
                <button
                  type="submit"
                  className="swap-preview-btn"
                  disabled={isSwapping || !swapForm.fromAmount || parseFloat(swapForm.fromAmount) <= 0}
                >
                  {isSwapping ? 'Processing...' : 'Preview Swap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Preview Modal */}
      {showSwapPreviewModal && swapPreviewData && (
        <div
          className="notification-modal-overlay swap-preview-overlay"
          onClick={() => {
            if (!isSwapping) {
              setShowSwapPreviewModal(false);
            }
          }}
        >
          <div 
            className="notification-modal swap-preview-modal swap-preview-modal-overlay" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', width: '90%' }}
          >
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Swap</h2>
              </div>
              <button
                type="button"
                className="notification-close-btn"
                onClick={() => setShowSwapPreviewModal(false)}
                disabled={isSwapping}
              >
                <X size={20} />
              </button>
            </div>

            <div className="send-modal-content swap-preview-content">
              {/* Transfer Details Section */}
              <div className="send-transfer-section swap-preview-transfer-section">
                <div className="send-from-section swap-preview-section">
                  <label className="send-section-label">From</label>
                  <div className="swap-preview-amount-row">
                    <div className="send-amount-display swap-preview-amount">
                      {Number(swapPreviewData.fromAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </div>
                    <div className="send-wallet-selector swap-preview-currency-selector">
                      <div className="send-currency-badge">
                        {swapPreviewData.fromCurrency === 'XRP' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapPreviewData.fromCurrency === 'USDT' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                            alt="USDT" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapPreviewData.fromCurrency === 'USDC' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                            alt="USDC" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : null}
                      </div>
                      <span className="send-wallet-text">{swapPreviewData.fromCurrency} {getCurrencyDisplayName(swapPreviewData.fromCurrency)}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <div className="send-balance-text">
                    Balance: {isLoadingWalletBalances ? '—' : `${Number(getCurrencyBalance(swapPreviewData.fromCurrency)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${swapPreviewData.fromCurrency}`}
                  </div>
                </div>

                <div className="send-transfer-arrow">
                  <button type="button" className="send-arrow-btn" disabled>
                    <ArrowUpDown size={20} />
                  </button>
                </div>

                <div className="send-to-section swap-preview-section">
                  <label className="send-section-label">To</label>
                  <div className="swap-preview-amount-row">
                    <div className="send-amount-display swap-preview-amount">
                      {Number(swapPreviewData.toAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </div>
                    <div className="send-wallet-selector swap-preview-currency-selector">
                      <div className="send-currency-badge">
                        {swapPreviewData.toCurrency === 'XRP' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapPreviewData.toCurrency === 'USDT' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                            alt="USDT" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : swapPreviewData.toCurrency === 'USDC' ? (
                          <img 
                            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                            alt="USDC" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        ) : null}
                      </div>
                      <span className="send-wallet-text">{swapPreviewData.toCurrency} {getCurrencyDisplayName(swapPreviewData.toCurrency)}</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <div className="send-balance-text">
                    Balance: {isLoadingWalletBalances ? '—' : `${Number(getCurrencyBalance(swapPreviewData.toCurrency)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${swapPreviewData.toCurrency}`}
                  </div>
                </div>
              </div>

              {/* Transaction Details Section */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Price</span>
                  <span style={{ color: 'var(--text-dark)', fontFamily: 'Satoshi, Inter, sans-serif' }}>
                    {swapPreviewData.rate
                      ? `1 ${swapPreviewData.fromCurrency} = ${swapPreviewData.rate.toFixed(6)} ${swapPreviewData.toCurrency}`
                      : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Network fee</span>
                  <span style={{ color: 'var(--text-dark)', fontFamily: 'Satoshi, Inter, sans-serif' }}>
                    ${(swapPreviewData.feeUsd || 0).toFixed(2)} USD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Price impact</span>
                  <span style={{ color: 'var(--text-dark)', fontFamily: 'Satoshi, Inter, sans-serif' }}>0.05%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Amount</span>
                  <span style={{ color: 'var(--text-dark)', fontFamily: 'Satoshi, Inter, sans-serif' }}>
                    ${(swapPreviewData.usdValue || 0).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Confirm Swap Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleConfirmSwap}
                  disabled={isSwapping}
                  style={{
                    background: '#2F74FF',
                    color: 'var(--white)',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.875rem 3rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: isSwapping ? 'not-allowed' : 'pointer',
                    opacity: isSwapping ? 0.6 : 1,
                    fontFamily: 'Satoshi, Inter, sans-serif',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {isSwapping ? 'Processing...' : 'Confirm Swap'}
                </button>
              </div>

              {/* Information Message */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '1rem' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, fontFamily: 'Satoshi, Inter, sans-serif' }}>
                  You'll receive at least {Number(swapPreviewData.toAmount || swapPreviewData.fromAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {swapPreviewData.toCurrency} (${Number(swapPreviewData.toAmount || swapPreviewData.fromAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}) or the transaction will be refunded.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swap Summary Modal */}
      {showSwapSummaryModal && swapPreviewData && (
        <div className="notification-modal-overlay swap-summary-overlay" onClick={handleCloseSwapSummary}>
          <div className="notification-modal transaction-summary-modal swap-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transaction-summary-header">
              <h2>Swap Summary</h2>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={handleCloseSwapSummary}
              >
                <X size={20} />
              </button>
            </div>

            <div className="transaction-summary-content">
              <div className="transaction-details-list">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">From:</span>
                  <span className="transaction-detail-value">
                    {Number(swapPreviewData.fromAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {swapPreviewData.fromCurrency}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">To:</span>
                  <span className="transaction-detail-value">
                    {Number(swapPreviewData.toAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {swapPreviewData.toCurrency}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Exchange Rate:</span>
                  <span className="transaction-detail-value">
                    {swapPreviewData.rate
                      ? `1 ${swapPreviewData.fromCurrency} = ${swapPreviewData.rate.toFixed(2)}${getCurrencyBadge(swapPreviewData.toCurrency)}${swapPreviewData.usdRate ? ` (${swapPreviewData.usdRate.toFixed(2)}USD)` : ''}`
                      : '—'}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Network Fee:</span>
                  <span className="transaction-detail-value">
                    ${(swapPreviewData.feeUsd || 0).toFixed(2)} USD
                  </span>
                </div>
                {swapPreviewData.transactionId && (
                  <div className="transaction-detail-item">
                    <span className="transaction-detail-label">Transaction ID:</span>
                    <span className="transaction-detail-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {swapPreviewData.transactionId}
                    </span>
                  </div>
                )}
                {swapPreviewData.xrplTxHash && (
                  <div className="transaction-detail-item">
                    <span className="transaction-detail-label">XRPL Transaction Hash:</span>
                    <span className="transaction-detail-value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {swapPreviewData.xrplTxHash}
                    </span>
                  </div>
                )}
              </div>

              <div className="transaction-divider"></div>

              <div className="transaction-recipient-details">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label recipient-label">You Received:</span>
                  <span className="transaction-detail-value">
                    {Number(swapPreviewData.toAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {swapPreviewData.toCurrency}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Status:</span>
                  <span className="transaction-detail-value" style={{ color: '#10b981', fontWeight: 600 }}>
                    {swapPreviewData.status ? swapPreviewData.status.charAt(0).toUpperCase() + swapPreviewData.status.slice(1) : 'Completed'}
                  </span>
                </div>
              </div>

              <div className="transaction-summary-actions">
                <button 
                  type="button" 
                  className="transaction-transfer-btn"
                  onClick={handleCloseSwapSummary}
                >
                  Done
                </button>
              </div>

              <div className="transaction-summary-disclaimer">
                <div className="transaction-info-icon">
                  <CheckCircle size={16} />
                </div>
                <span>Swap completed successfully. You received {Number(swapPreviewData.toAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {swapPreviewData.toCurrency} (${Number(swapPreviewData.toAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal — amount + recipient (reference UI) */}
      {showSendModal && (
        <div className="notification-modal-overlay send-modal-overlay" onClick={() => setShowSendModal(false)}>
          <div
            className="notification-modal send-modal send-modal--v2"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="send-modal-title"
          >
            <div className="send-modal-header send-modal-header--v2">
              <div className="send-modal-header-leading-v2">
                <span className="send-modal-header-accent-v2" aria-hidden />
                <h2 id="send-modal-title">Send</h2>
              </div>
              <button
                type="button"
                className="notification-close-btn send-modal-close-v2"
                onClick={() => setShowSendModal(false)}
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            <div className="send-modal-content send-modal-content--v2">
              <div className="send-amount-hero-card">
                <div className="send-amount-hero-top">
                  <span className="send-from-label-v2">From</span>
                  <div className="send-modal-currency-anchor">
                    <button
                      type="button"
                      className="send-currency-pill-v2"
                      onClick={() => setShowToCurrencyDropdown(!showToCurrencyDropdown)}
                      aria-expanded={showToCurrencyDropdown}
                      aria-haspopup="listbox"
                    >
                      <span className="send-currency-pill-flag">
                        <img
                          src={`https://flagcdn.com/w40/${availableCurrencies.find((c) => c.code === sendForm.toCurrency)?.flag || 'eu'}.png`}
                          alt=""
                          width={20}
                          height={14}
                        />
                      </span>
                      <span className="send-currency-pill-code">{sendForm.toCurrency}</span>
                      <ChevronDown size={16} aria-hidden />
                    </button>
                    {showToCurrencyDropdown && (
                      <div className="send-modal-currency-dropdown send-modal-currency-dropdown--v2" role="listbox">
                        {availableCurrencies.map((currency) => (
                          <button
                            key={currency.code}
                            type="button"
                            role="option"
                            className={`send-modal-currency-option${sendForm.toCurrency === currency.code ? ' is-active' : ''}`}
                            onClick={() => handleToCurrencyChange(currency.code)}
                          >
                            <span className="send-currency-flag">
                              <img src={`https://flagcdn.com/w40/${currency.flag}.png`} alt="" />
                            </span>
                            <span>{currency.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="send-amount-hero-input-row">
                  <span className="send-amount-hero-symbol" aria-hidden>
                    {(availableCurrencies.find((c) => c.code === sendForm.toCurrency) || availableCurrencies[1]).symbol}
                  </span>
                  <input
                    type="text"
                    className="send-amount-hero-input"
                    placeholder="0.00"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label="Amount"
                    value={sendForm.toAmount || ''}
                    onChange={(e) => handleToAmountChange(e.target.value)}
                  />
                </div>
                <p className="send-balance-line-v2">
                  Balance:{' '}
                  {walletBalances?.usdt != null && walletBalances?.usdt !== ''
                    ? Number(walletBalances.usdt).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : '—'}{' '}
                  USDT
                </p>
                {sendExchangeRate && !isLoadingSendRate ? (
                  <p className="send-rate-hint-v2">
                    1 {sendForm.fromWallet} ={' '}
                    {(availableCurrencies.find((c) => c.code === sendForm.toCurrency) || availableCurrencies[0]).symbol}
                    {sendExchangeRate.toFixed(4)} {sendForm.toCurrency}
                  </p>
                ) : isLoadingSendRate ? (
                  <p className="send-rate-hint-v2">
                    <LoadingIndicator size="sm" />
                  </p>
                ) : null}
              </div>

              <p className="send-recipient-section-title-v2">Recipient Information</p>

              <div className="send-v2-fields">
                <label className="send-v2-label" htmlFor="send-v2-fullname">
                  Full Name
                </label>
                <input
                  id="send-v2-fullname"
                  type="text"
                  className="send-v2-input"
                  placeholder="Enter your name"
                  autoComplete="name"
                  value={sendForm.recipientFullName}
                  onChange={(e) =>
                    setSendForm((prev) => ({ ...prev, recipientFullName: e.target.value }))
                  }
                />

                <label className="send-v2-label" htmlFor="send-v2-phone">
                  Phone Number
                </label>
                <input
                  id="send-v2-phone"
                  type="tel"
                  className="send-v2-input"
                  placeholder="(+44)"
                  autoComplete="tel"
                  value={sendForm.recipientPhone}
                  onChange={(e) =>
                    setSendForm((prev) => ({ ...prev, recipientPhone: e.target.value }))
                  }
                />

                <label className="send-v2-label" htmlFor="send-recipient-trustitag">
                  Wallet Address or Bank Account
                </label>
                <input
                  id="send-recipient-trustitag"
                  type="text"
                  className="send-v2-input"
                  placeholder="Enter Wallet Address or Bank Account"
                  autoComplete="off"
                  spellCheck={false}
                  value={sendForm.recipientTrustitag}
                  onChange={(e) =>
                    setSendForm((prev) => ({ ...prev, recipientTrustitag: e.target.value.trimStart() }))
                  }
                />

                <label className="send-v2-label" htmlFor="send-reason-note">
                  Reason for transfer <span className="send-optional-v2">(optional)</span>
                </label>
                <input
                  id="send-reason-note"
                  type="text"
                  className="send-v2-input"
                  placeholder="Enter description"
                  value={sendForm.reason}
                  onChange={(e) => setSendForm((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <button
                type="button"
                className="send-primary-btn-v2"
                onClick={() => {
                  if (!sendForm.fromAmount || parseFloat(sendForm.fromAmount) <= 0) {
                    toast.error('Please enter an amount');
                    return;
                  }
                  setShowSendModal(false);
                  setShowTransactionSummaryModal(true);
                }}
              >
                Send
              </button>

              <div className="send-modal-footnote-v2">
                <Info size={14} className="send-modal-footnote-icon-v2" aria-hidden />
                <span>
                  {sendForm.fromAmount && sendExchangeRate
                    ? `Recipient will receive at least ${(parseFloat(sendForm.fromAmount) * sendExchangeRate * 0.9954).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sendForm.toCurrency} or the transaction will be refunded`
                    : 'Recipient will receive at least the converted amount or the transaction will be refunded.'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Summary Modal */}
      {showTransactionSummaryModal && (
        <div className="notification-modal-overlay" onClick={() => setShowTransactionSummaryModal(false)}>
          <div className="notification-modal transaction-summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transaction-summary-header">
              <h2>Transaction Summary</h2>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowTransactionSummaryModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="transaction-summary-content">
              <div className="transaction-details-list">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Full name</span>
                  <span className="transaction-detail-value">{sendForm.recipientFullName.trim() || '—'}</span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Phone</span>
                  <span className="transaction-detail-value">{sendForm.recipientPhone.trim() || '—'}</span>
                </div>
                <div className="transaction-detail-item transaction-detail-item--trustitag">
                  <span className="transaction-detail-label">Wallet / Bank / Trustitag</span>
                  <span className="transaction-detail-value transaction-detail-trustitag">
                    {sendForm.recipientTrustitag.trim() || '—'}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Send Amount:</span>
                  <span className="transaction-detail-value">
                    {sendForm.fromAmount ? `${Number(sendForm.fromAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${sendForm.fromWallet}` : '0.00 XRP'}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Exchange Rate:</span>
                  <span className="transaction-detail-value">
                    {isLoadingSendRate ? (
                      'Calculating...'
                    ) : sendExchangeRate ? (
                      `1 ${sendForm.fromWallet} = ${sendForm.toCurrency === 'USD' ? '$' : ''}${sendExchangeRate.toFixed(4)} ${sendForm.toCurrency === 'USD' ? '' : sendForm.toCurrency}`
                    ) : (
                      'Rate unavailable'
                    )}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Network Fee:</span>
                  <span className="transaction-detail-value">0.00001 XRP</span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Service Fee:</span>
                  <span className="transaction-detail-value">
                    {sendForm.fromAmount && sendExchangeRate ? (
                      `$${((parseFloat(sendForm.fromAmount) * sendExchangeRate) * 0.0046).toFixed(2)} (0.46%)`
                    ) : (
                      '$0.00 (0.46%)'
                    )}
                  </span>
                </div>
              </div>

              <div className="transaction-divider"></div>

              <div className="transaction-recipient-details">
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label recipient-label">Recipient Gets:</span>
                  <span className="transaction-detail-value">
                    {sendForm.fromAmount && sendExchangeRate ? (
                      `${sendForm.toCurrency === 'USD' ? '$' : ''}${(parseFloat(sendForm.fromAmount) * sendExchangeRate * 0.9954).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sendForm.toCurrency === 'USD' ? '' : sendForm.toCurrency}`
                    ) : (
                      'Calculating...'
                    )}
                  </span>
                </div>
                <div className="transaction-detail-item">
                  <span className="transaction-detail-label">Estimated Arrival:</span>
                  <span className="transaction-detail-value">3-5 seconds</span>
                </div>
              </div>

              <div className="transaction-summary-actions">
                <button 
                  type="button" 
                  className="transaction-transfer-btn"
                  onClick={handleSendTransfer}
                  disabled={isProcessingTransfer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isProcessingTransfer ? (
                    <>
                      <LoadingIndicator size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Transfer'
                  )}
                </button>
              </div>

              <div className="transaction-summary-disclaimer">
                <div className="transaction-info-icon">
                  <Info size={16} />
                </div>
                <span>
                  {sendForm.fromAmount && sendExchangeRate ? (
                    `Recipient will receive at least ${(parseFloat(sendForm.fromAmount) * sendExchangeRate * 0.9954).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${sendForm.toCurrency} or the transaction will be refunded`
                  ) : (
                    "Recipient will receive the amount based on the current exchange rate or the transaction will be refunded"
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fund Wallet Transfer Modal */}
      {showFundWalletTransferModal && (
        <div className="notification-modal-overlay" onClick={() => setShowFundWalletTransferModal(false)}>
          <div className="notification-modal fund-wallet-transfer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fund-wallet-transfer-modal-header">
              <h2>Fund wallet</h2>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowFundWalletTransferModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="fund-wallet-transfer-modal-content">
              {/* Currency Section */}
              <div className="fund-wallet-transfer-form-group">
                <label className="fund-wallet-transfer-label">Currency</label>
                <div className="fund-wallet-transfer-selector">
                  <div className="fund-wallet-transfer-currency-badge">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="XRP" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <span className="fund-wallet-transfer-selector-text">XRP wallet</span>
                  <ChevronDown size={16} />
                </div>
              </div>

              {/* Network Input Section */}
              <div className="fund-wallet-transfer-form-group">
                <label className="fund-wallet-transfer-label">Network</label>
                <input
                  type="text"
                  className="fund-wallet-transfer-input"
                  placeholder="Enter your name"
                />
              </div>

              {/* Network QR Code & Address Section */}
              <div className="fund-wallet-transfer-form-group">
                <label className="fund-wallet-transfer-label">Network</label>
                <div className="fund-wallet-transfer-address-section">
                  <div className="fund-wallet-transfer-qr-code">
                    <QrCode size={120} />
                  </div>
                  <div className="fund-wallet-transfer-address-content">
                    <div className="fund-wallet-transfer-address-text">
                      <span>rEb8TK3gBgk5auZkwc6sHnw</span>
                      <span>rGVJH8DuaLh</span>
                    </div>
                    <button 
                      type="button" 
                      className="fund-wallet-transfer-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText('rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh');
                        toast.success('Address copied to clipboard');
                      }}
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Transfer Button */}
              <div className="fund-wallet-transfer-actions">
                <button 
                  type="button" 
                  className="fund-wallet-transfer-preview-btn"
                  onClick={() => {
                    setShowFundWalletTransferModal(false);
                    setShowSavingsModal(true);
                  }}
                >
                  Preview Transfer
                </button>
              </div>

              {/* Information Text */}
              <div className="fund-wallet-transfer-info-message">
                <div className="fund-wallet-transfer-info-icon">
                  <Info size={16} />
                </div>
                <span>Recipient gets the funds immediately—or a full refund applies.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings Modal - Hidden on mobile when full page is shown */}
      {showSavingsModal && !showSavingsPage && (
        <div className="notification-modal-overlay" onClick={() => setShowSavingsModal(false)}>
          <div className="notification-modal savings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="savings-modal-header">
              <div className="savings-modal-title-wrapper">
                <div className="savings-modal-indicator"></div>
                <h2>Savings</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowSavingsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="savings-modal-content">
              {/* Mobile Card-Based Layout */}
              <div className="mobile-savings-cards">
                {/* Amount Card */}
                <div className="mobile-savings-amount-card">
                  <div className="mobile-savings-card-left">
                    <div className="mobile-savings-card-icon">
                      <Wallet size={16} />
                    </div>
                    <div className="mobile-savings-card-type">Amount</div>
                  </div>
                  <div className="mobile-savings-card-center">
                    <div className="mobile-savings-card-details">
                      <div className="savings-wallet-selector mobile-savings-wallet-selector">
                        <div className="savings-currency-badge">
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </div>
                        <span className="savings-wallet-text">XRP wallet</span>
                      </div>
                      <div className="savings-amount-display mobile-savings-amount">$24,567.89</div>
                      <div className="savings-balance-text">Balance: 24,567.89 XRP</div>
                    </div>
                  </div>
                  <div className="mobile-savings-card-right">
                    <div className="mobile-savings-card-status">Active</div>
                  </div>
                </div>

                {/* Savings Account Card */}
                <div className="mobile-savings-account-card">
                  <div className="mobile-savings-card-left">
                    <div className="mobile-savings-card-icon">
                      <Package size={16} />
                    </div>
                    <div className="mobile-savings-card-type">Account</div>
                  </div>
                  <div className="mobile-savings-card-center">
                    <div className="mobile-savings-card-details">
                      <div className="savings-account-selector mobile-savings-account-selector">
                        <span className="savings-account-text">My Goals</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="mobile-savings-card-right">
                    <div className="mobile-savings-card-status">Selected</div>
                  </div>
                </div>
              </div>

              {/* Transfer Button */}
              <div className="savings-actions">
                <button 
                  type="button" 
                  className="savings-transfer-btn"
                  onClick={() => {
                    // Handle transfer logic
                    setShowSavingsModal(false);
                  }}
                >
                  Transfer
                </button>
              </div>

              {/* Information Message */}
              <div className="savings-info-message">
                <div className="savings-info-icon">
                  <Info size={16} />
                </div>
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      {/* Fund Method Selection Modal */}
      {showFundMethodModal && (
        <div
          className="notification-modal-overlay deposit-flow-overlay"
          onClick={() => setShowFundMethodModal(false)}
        >
          <div className="notification-modal fund-method-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Deposit</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowFundMethodModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="fund-method-modal-body">
              <p className="fund-method-modal-intro">
                Choose how you want to fund your wallet
              </p>
              <div className="fund-method-options">
                <button
                  type="button"
                  className="fund-method-option"
                  onClick={() => openStripeDeposit('googlepay')}
                >
                  <div className="fund-method-option-icon fund-method-option-icon--payment">
                    <DepositGooglePayMark />
                  </div>
                  <div className="fund-method-option-text">
                    <div className="fund-method-option-title">Fund with Google Pay</div>
                    <div className="fund-method-option-desc">Deposit USD instantly with Google Pay</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="fund-method-option"
                  onClick={() => openStripeDeposit('applepay')}
                >
                  <div className="fund-method-option-icon fund-method-option-icon--payment">
                    <DepositApplePayMark />
                  </div>
                  <div className="fund-method-option-text">
                    <div className="fund-method-option-title">Fund with Apple Pay</div>
                    <div className="fund-method-option-desc">Deposit USD instantly with Apple Pay</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="fund-method-option"
                  onClick={() => {
                    setShowFundMethodModal(false);
                    setFundDepositPaymentMethod(null);
                    setShowConnectWalletModal(true);
                  }}
                >
                  <div className="fund-method-option-icon">
                    <Wallet size={24} color="#0066ff" />
                  </div>
                  <div className="fund-method-option-text">
                    <div className="fund-method-option-title">Fund with Wallet</div>
                    <div className="fund-method-option-desc">Connect your crypto wallet to fund</div>
                  </div>
                </button>
                <button
                  type="button"
                  className="fund-method-option"
                  onClick={() => {
                    setShowFundMethodModal(false);
                    setFundDepositPaymentMethod(null);
                    setFundViaAddress(true);
                    setShowFundWalletModal(true);
                  }}
                >
                  <div className="fund-method-option-icon">
                    <QrCode size={24} color="#0066ff" />
                  </div>
                  <div className="fund-method-option-text">
                    <div className="fund-method-option-title">Fund with Address</div>
                    <div className="fund-method-option-desc">Send funds to your wallet address</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderTransactionDetailsModal()}
      {renderAddBeneficiaryModal()}
      {renderRemoveBeneficiaryModal()}

      {/* Connect Wallet Modal */}
      <ConnectWalletModal 
        isOpen={showConnectWalletModal && !isWalletConnectedViaAPI} 
        onClose={() => setShowConnectWalletModal(false)} 
      />

      {/* TransactionSummaryModal integration */}
      <TransactionSummaryModal
        open={showTransactionSummaryModal}
        onClose={() => setShowTransactionSummaryModal(false)}
        transaction={selectedTransaction}
      />
    </>
    </PersonalSidebarWalletProvider>
  );
};

export default Transactions;


