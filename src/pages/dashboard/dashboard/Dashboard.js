import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Headphones,
  Settings,
  Search,
  Bell,
  ArrowRight,
  KeyRound,
  QrCode,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Plus,
  DollarSign,
  Building2,
  Users,
  FileCheck,
  FileText,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  X,
  Filter,
  AlertTriangle,
  CheckCircle,
  Package,
  Menu,
  Wallet,
  ChevronRight,
  Upload,
  PiggyBank,
  Copy,
  Clock,
  Mail
} from 'lucide-react';
import './Dashboard.css';
import logo from '../../../assets/images/icons/logo.png';
import logoWhite from '../../../assets/images/logo/logo_white.png';
import mockIllustration from '../../../assets/images/illustrations/mock.png';
import uploadIllustration from '../../../assets/images/illustrations/upload.png';
import chainsIllustration from '../../../assets/images/illustrations/chain.png';
import cardIllustration from '../../../assets/images/illustrations/card.png';
import complianceIllustration from '../../../assets/images/illustrations/compliance.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../../utils/notificationsApi';
import { handleLogout } from '../../../utils/logout';
import { useSession } from '../../../context/SessionContext';
import { useWeb3 } from '../../../context/Web3Context';
import ConnectedWalletModal from '../../../components/ConnectedWalletModal';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CreateEscrowForm from '../../../components/CreateEscrowForm';
import BusinessSuiteLoader from '../../../components/BusinessSuiteLoader';
import BusinessDashboard from '../business-suite/BusinessDashboard';
import SupplierContractContent from '../business-suite/SupplierContractContent';
import TeamDetailModal from '../business-suite/TeamDetailModal';
import ConnectWalletModal from '../../../components/ConnectWalletModal';
import BusinessSuitePinModal from '../../../components/BusinessSuitePinModal';

// Normalize company logo URL from API: accept multiple keys and turn relative paths into absolute URLs
const normalizeCompanyLogoUrl = (data) => {
  const raw = data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

// Check if business email is set from GET api/business-suite/business-email/status (accept any response shape)
const isBusinessEmailSet = (result) => {
  if (!result) return false;
  const d = result.data;
  // result.data is the email string directly
  if (typeof d === 'string' && d.trim().length > 0) return true;
  // result.data is an object
  if (d && typeof d === 'object') {
    if (d.hasBusinessEmail === true) return true;
    const email = d.businessEmail ?? d.email ?? d.business_email ?? d.businessEmail;
    if (typeof email === 'string' && email.trim().length > 0) return true;
  }
  // email at top level
  const topEmail = result.businessEmail ?? result.email ?? result.business_email;
  if (typeof topEmail === 'string' && topEmail.trim().length > 0) return true;
  return false;
};

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
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
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck }
];

const personalSteps = [
  { label: 'Proof of identity', detail: 'Proof of identity' },
  { label: 'Document upload', detail: 'Document upload' },
  { label: 'Connect Wallet', detail: 'Connect Wallet' }
];

const businessSteps = [
  { label: 'Brand Customization', detail: 'Brand Customization' },
  { label: 'Escrow Configuration', detail: 'Escrow Configuration' },
  { label: 'Compliance', detail: 'Compliance' }
];

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

const getNotificationIconConfig = (type) => {
  if (type === 'wallet_deposit') {
    return { Icon: CheckCircle, className: 'notification-status-icon success' };
  }
  if (type === 'escrow_completed') {
    return { Icon: Package, className: 'notification-status-icon package' };
  }
  return { Icon: AlertTriangle, className: 'notification-status-icon warning' };
};

const Dashboard = () => {
      // Loading state for View Wallet button
      const [isLoadingWalletAddress, setIsLoadingWalletAddress] = useState(false);
    // On mount and when account type changes: check if user has a wallet (Personal vs Business Suite API)
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { account, isConnected, isWalletConnectedViaAPI } = useWeb3();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycComplete, setKycComplete] = useState(() => {
    // Check localStorage first, default to true if KYC was previously completed
    const stored = localStorage.getItem('kycComplete');
    return stored ? JSON.parse(stored) : true;
  });
  const [businessKycComplete, setBusinessKycComplete] = useState(() => {
    const stored = localStorage.getItem('businessKycComplete');
    return stored ? JSON.parse(stored) : false;
  });
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [isSubmittingBusinessKyc, setIsSubmittingBusinessKyc] = useState(false);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [accountType, setAccountType] = useState(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Personal';
  });
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showBusinessSuitePinModal, setShowBusinessSuitePinModal] = useState(false);
  const [kycStatusDialog, setKycStatusDialog] = useState(null); // 'in_review' | 'rejected' | null
  const [showUnderReviewKycModal, setShowUnderReviewKycModal] = useState(false);
  const showUnderReviewModalIfApplicable = (message) => {
    const m = String(message || '').toLowerCase();
    if (m.includes('under review') || m.includes('temporarily suspended')) {
      setShowUnderReviewKycModal(true);
      return true;
    }
    return false;
  };
  const [pendingAccountSwitch, setPendingAccountSwitch] = useState(false);
  const [showConnectedWalletModal, setShowConnectedWalletModal] = useState(false);

  // Persist account type so it survives reload
  useEffect(() => {
    localStorage.setItem('dashboard_account_type', accountType);
  }, [accountType]);

  // When on Supplier Contract route, ensure Business Suite is selected (same header/sidebar)
  useEffect(() => {
    if (location.pathname === '/supplier-contract' && accountType !== 'Business Suite') {
      setAccountType('Business Suite');
    }
  }, [location.pathname, accountType]);

  // On mount and when account type changes: check if user has a wallet (Personal vs Business Suite API)
  useEffect(() => {
    const fetchWallets = async () => {
      setIsLoadingWalletAddress(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasWallet(false);
          setWalletAddress('');
          setIsLoadingWalletAddress(false);
          return;
        }
        const url = accountType === 'Business Suite'
          ? getApiUrl('api/business-suite/wallet/balance')
          : getApiUrl('api/wallet/balance');
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await res.json().catch(() => ({}));
        const address = result?.xrplAddress || result?.xrpl_address || result?.data?.xrplAddress || result?.data?.xrpl_address || result?.data?.walletAddress;
        if (result?.success && address && typeof address === 'string' && address.trim().length > 0) {
          setWalletAddress(address);
          setHasWallet(true);
        } else {
          setWalletAddress('');
          setHasWallet(false);
        }
      } catch (err) {
        setHasWallet(false);
        setWalletAddress('');
      } finally {
        setIsLoadingWalletAddress(false);
      }
    };
    fetchWallets();
  }, [accountType]);

  // Update account type from navigation state if provided (e.g. link with state)
  useEffect(() => {
    if (location.state?.accountType) {
      setAccountType(location.state.accountType);
    }
  }, [location.state]);

  // Fetch business KYC status when on Business Suite (source of truth for show KYC vs dashboard)
  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setBusinessKycComplete(false);
      localStorage.removeItem('businessKycComplete');
      return;
    }
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
        console.log('KYC response (Business Suite load):', result);
        if (result?.success && result?.data) {
          const kycData = result.data;
          console.log('Business Suite KYC response (company logo):', {
            raw: kycData?.companyLogoUrl ?? kycData?.logoUrl ?? kycData?.company_logo_url ?? kycData?.url,
            normalized: normalizeCompanyLogoUrl(kycData) || '(empty)',
          });
          const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
          const status = statusRaw.replace(/_/g, ' ').toLowerCase();
          const verifiedStatuses = ['verified', 'approved', 'complete'];
          const isKycVerified = verifiedStatuses.includes(status);
          if (isKycVerified) {
            setBusinessKycComplete(true);
            setBusinessCompanyName(kycData.companyName || '');
            setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
            localStorage.setItem('businessKycComplete', 'true');
          } else {
            setBusinessKycComplete(false);
            setBusinessCompanyName(kycData?.companyName || '');
            setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
            localStorage.removeItem('businessKycComplete');
          }
        } else {
          setBusinessKycComplete(false);
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
          localStorage.removeItem('businessKycComplete');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusinessKycComplete(false);
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
          localStorage.removeItem('businessKycComplete');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBusinessKyc(false);
      });
    return () => { cancelled = true; };
  }, [accountType]);

  useEffect(() => {
    if (accountType === 'Business Suite') {
      console.log('Business Suite company logo URL:', businessCompanyLogoUrl || '(empty)');
    }
  }, [accountType, businessCompanyLogoUrl]);

  const [notificationFilter, setNotificationFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsTotal] = useState(0);
  const [, setNotificationsUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const notificationsApiFilter = useMemo(() => (notificationFilter === 'Unread' ? 'unread' : 'all'), [notificationFilter]);

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

  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');

  const [businessSuitePinMode, setBusinessSuitePinMode] = useState('verify'); // 'set' | 'verify'

  // Handle Business Suite PIN: set (first time) or verify (when switching)
  const handleBusinessSuitePinSubmit = async (pin) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return false;
    }
    const pinStr = String(pin).trim();
    if (pinStr.length !== 6) return false;

    const url = businessSuitePinMode === 'verify'
      ? getApiUrl('api/business-suite/verify-pin')
      : getApiUrl('api/business-suite/set-pin');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: pinStr }),
      });
      const data = await res.json().catch(() => ({}));
      if (businessSuitePinMode === 'set') {
        console.log('Business Suite set-pin response:', { status: res.status, statusText: res.statusText, data });
      }
      if (res.ok && data.success) {
        setAccountType('Business Suite');
        setPendingAccountSwitch(false);
        setShowBusinessSuitePinModal(false);
        return true;
      }
      if (res.status === 401) {
        if (showUnderReviewModalIfApplicable(data?.message)) return false;
        toast.error(data?.message || 'Invalid PIN');
        return false;
      }
      if (res.status === 400) {
        if (showUnderReviewModalIfApplicable(data?.message)) return false;
        toast.error(data?.message || (businessSuitePinMode === 'set' ? 'Could not set PIN' : 'Invalid PIN'));
        return false;
      }
      if (showUnderReviewModalIfApplicable(data?.message)) return false;
      toast.error(data?.message || 'Something went wrong');
      return false;
    } catch (err) {
      console.error('Business Suite PIN error:', err);
      toast.error('Network error. Please try again.');
      return false;
    }
  };

  // Handle switch to Business Suite - first check KYC; if approved show PIN, else show KYC page
  const handleSwitchToBusinessSuite = async () => {
    setPendingAccountSwitch(true);
    setSwitchMessage('switching to business suite');
    setIsSwitchingAccountType(true);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      setPendingAccountSwitch(false);
      setIsSwitchingAccountType(false);
      setSwitchMessage('');
      return;
    }

    try {
      const kycRes = await fetch(getApiUrl('api/business-suite/kyc'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const kycResult = await kycRes.json().catch(() => ({}));
      console.log('KYC response (switch to Business Suite):', { ok: kycRes.ok, status: kycRes.status, body: kycResult });
      // Status must be one of: In review, Verified, Rejected. In review/Rejected → show dialog; Verified → PIN; else → KYC screen
      const hasKycRecord = kycRes.ok && kycResult?.success && kycResult?.data;
      const kycData = hasKycRecord ? kycResult.data : null;
      const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
      const status = statusRaw.replace(/_/g, ' ').toLowerCase();
      const isInReview = status === 'in review';
      const isRejected = status === 'rejected';
      const verifiedStatuses = ['verified', 'approved', 'complete'];
      const isKycVerified = verifiedStatuses.includes(status);

      if (isInReview) {
        setIsSwitchingAccountType(false);
        setSwitchMessage('');
        setPendingAccountSwitch(false);
        setKycStatusDialog('in_review');
        return;
      }
      if (isRejected) {
        setIsSwitchingAccountType(false);
        setSwitchMessage('');
        setPendingAccountSwitch(false);
        setKycStatusDialog('rejected');
        return;
      }
      if (isKycVerified) {
        console.log('Business Suite: KYC verified, showing PIN modal after short delay. status=', status);
        setBusinessKycComplete(true);
        if (kycData?.companyName) setBusinessCompanyName(kycData.companyName);
        const logoUrl = normalizeCompanyLogoUrl(kycData);
        if (logoUrl) setBusinessCompanyLogoUrl(logoUrl);
        localStorage.setItem('businessKycComplete', 'true');
        const pinRes = await fetch(getApiUrl('api/business-suite/pin-status'), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const pinData = await pinRes.json().catch(() => ({}));
        const pinSet = pinData?.success && pinData?.pinSet === true;
        setBusinessSuitePinMode(pinSet ? 'verify' : 'set');
        setTimeout(() => {
          setIsSwitchingAccountType(false);
          setSwitchMessage('');
          setShowBusinessSuitePinModal(true);
        }, 600);
      } else {
        console.log('Business Suite: showing KYC screen. status=', JSON.stringify(status));
        setBusinessKycComplete(false);
        setBusinessCompanyName('');
        setBusinessCompanyLogoUrl('');
        localStorage.removeItem('businessKycComplete');
        setAccountType('Business Suite');
        setPendingAccountSwitch(false);
        setIsSwitchingAccountType(false);
        setSwitchMessage('');
      }
    } catch (err) {
      console.error('Business Suite switch KYC check error:', err);
      setBusinessKycComplete(false);
      setBusinessCompanyName('');
      setBusinessCompanyLogoUrl('');
      localStorage.removeItem('businessKycComplete');
      setAccountType('Business Suite');
      setPendingAccountSwitch(false);
      setIsSwitchingAccountType(false);
      setSwitchMessage('');
    }
  };

  // Handle closing PIN modal without verification
  const handleClosePinModal = () => {
    setShowBusinessSuitePinModal(false);
    // If PIN modal is closed without verification (cancel button or clicking outside), revert to Personal account
    if (pendingAccountSwitch) {
      setAccountType('Personal');
      setPendingAccountSwitch(false);
    }
  };

  const [kycForm, setKycForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    passport: '',
    dob: ''
  });

  const [documents, setDocuments] = useState({
    front: null,
    back: null,
    selfie: null
  });

  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    businessDescription: '',
    companyLogo: null,
    companyLogoUrl: '' // set after uploading via POST api/business-suite/kyc/logo
  });

  const [escrowConfigForm, setEscrowConfigForm] = useState({
    defaultEscrowFeeRate: '',
    autoReleasePeriod: '',
    approvalWorkflow: ''
  });

  const [complianceForm, setComplianceForm] = useState({
    arbitrationType: '',
    transactionLimits: '',
    identityVerificationRequired: false,
    addressVerificationRequired: false,
    enhancedDueDiligence: false,
    identityVerificationDocument: null,
    addressVerificationDocument: null,
    enhancedDueDiligenceDocument: null
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [businessSuiteDashboardData, setBusinessSuiteDashboardData] = useState(null);
  const [isLoadingBusinessSuiteDashboard, setIsLoadingBusinessSuiteDashboard] = useState(false);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [portfolioPoints, setPortfolioPoints] = useState([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [portfolioTimeframe, setPortfolioTimeframe] = useState('monthly');
  const [portfolioYear, setPortfolioYear] = useState(() => new Date().getFullYear());
  const [businessSuitePortfolioPoints, setBusinessSuitePortfolioPoints] = useState([]);
  const [isLoadingBusinessSuitePortfolio, setIsLoadingBusinessSuitePortfolio] = useState(false);
  const [businessSuiteTeams, setBusinessSuiteTeams] = useState([]);
  const [isLoadingBusinessSuiteTeams, setIsLoadingBusinessSuiteTeams] = useState(false);
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [teamDetailData, setTeamDetailData] = useState(null);
  const [teamDetailTeamId, setTeamDetailTeamId] = useState(null);
  const [isLoadingTeamDetail, setIsLoadingTeamDetail] = useState(false);
  const [upcomingSupply, setUpcomingSupply] = useState([]);
  const [isLoadingUpcomingSupply, setIsLoadingUpcomingSupply] = useState(false);
  const [subscriptionList, setSubscriptionList] = useState([]);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);
  const [showPortfolioYearDropdown, setShowPortfolioYearDropdown] = useState(false);
  const [showMobilePortfolioDropdown, setShowMobilePortfolioDropdown] = useState(false);
  const [showMobilePortfolioYearDropdown, setShowMobilePortfolioYearDropdown] = useState(false);
  const [walletBalances, setWalletBalances] = useState(null);
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [walletBalancesRefreshTrigger, setWalletBalancesRefreshTrigger] = useState(0);
  const [escrows, setEscrows] = useState([]);
  const [isLoadingEscrows, setIsLoadingEscrows] = useState(true);
  const [totalEscrowedAmount, setTotalEscrowedAmount] = useState(null);
  const [isLoadingTotalEscrowed, setIsLoadingTotalEscrowed] = useState(true);
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [hasWallet, setHasWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateEscrowModal, setShowCreateEscrowModal] = useState(false);
  const [showFundMethodModal, setShowFundMethodModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showConnectWalletModal, setShowConnectWalletModal] = useState(false);
  const [showConnectBusinessWalletModal, setShowConnectBusinessWalletModal] = useState(false);
  const [connectBusinessWalletAddress, setConnectBusinessWalletAddress] = useState('');
  const [isConnectingBusinessWallet, setIsConnectingBusinessWallet] = useState(false);
  const [showBusinessSuiteWalletModal, setShowBusinessSuiteWalletModal] = useState(false);
  const [businessSuiteWalletModalLoading, setBusinessSuiteWalletModalLoading] = useState(false);
  const [businessSuiteWalletModalData, setBusinessSuiteWalletModalData] = useState(null); // { address?, balances?, error? }
  const [fundViaAddress, setFundViaAddress] = useState(false);
  const [fundWalletForm, setFundWalletForm] = useState({
    amount: '',
    currency: 'XRP'
  });
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [fundingStep, setFundingStep] = useState('idle'); // 'idle', 'preparing', 'signing', 'completing'
  const [transactionData, setTransactionData] = useState(null); // { transactionId, transactionBlob }
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [withdrawWalletForm, setWithdrawWalletForm] = useState({
    amount: '',
    currency: 'USD',
    destinationAddress: ''
  });
  const [isWithdrawingWallet, setIsWithdrawingWallet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper function to extract balance from different API response structures
  const getBalanceValue = (data, currency = 'usd') => {
    if (!data) {
      console.log('getBalanceValue: No data provided');
      return null;
    }
    
    const currencyKey = currency.toLowerCase();
    const currencyUpper = currency.toUpperCase();
    
    // Try different possible structures
    let value = null;
    
    // Structure 1: data.balance.usd or data.balance.xrp (use ?? so 0 is valid)
    if (data.balance && typeof data.balance === 'object') {
      value = data.balance[currencyKey] ?? data.balance[currencyUpper] ?? null;
      if (value !== null && value !== undefined) {
        console.log(`getBalanceValue: Found in data.balance.${currencyKey}:`, value);
        return Number(value);
      }
    }
    
    // Structure 2: data.totalBalance or data.balanceData (use ?? so 0 is valid)
    const balanceObj = data.totalBalance || data.balanceData || data.balances || {};
    if (balanceObj && typeof balanceObj === 'object') {
      value = balanceObj[currencyKey] ?? balanceObj[currencyUpper] ??
              balanceObj[`total${currencyUpper}`] ??
              balanceObj[`${currencyKey}Balance`] ??
              balanceObj[`${currencyKey}Amount`] ??
              null;
      if (value !== null && value !== undefined) {
        console.log(`getBalanceValue: Found in balance object:`, value);
        return Number(value);
      }
    }

    // Structure 3: Direct properties like data.totalUSD, data.balanceUSD
    value = data[`total${currencyUpper}`] ??
            data[`balance${currencyUpper}`] ??
            data[`${currencyKey}Balance`] ??
            data[`${currencyKey}Amount`] ??
            null;

    if (value !== null && value !== undefined) {
      console.log(`getBalanceValue: Found as direct property:`, value);
      return Number(value);
    }
    
    console.log(`getBalanceValue: Could not find ${currencyKey} balance in data:`, data);
    return null;
  };

  // Helper function to get exchange rate between two currencies
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

  const fetchDashboardSummary = async () => {
    try {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback dashboard data');
        setDashboardData({
          balance: { usd: 125000.00, xrp: 250000.00 },
          activeEscrows: { count: 12, lockedAmount: 45000.00 },
          trustiscore: { score: 850, level: 'Gold' }
        });
        setIsLoadingDashboard(false);
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Dashboard useEffect - Token exists:', !!token);
      console.log('Dashboard useEffect - kycComplete:', kycComplete);
      
      if (!token) {
        console.warn('No token found in localStorage');
        setIsLoadingDashboard(false);
        return;
      }

      const apiUrl = getApiUrl('api/dashboard/summary');
      console.log('Fetching dashboard summary from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Dashboard API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Dashboard API response data:', result);
        
        if (result.success && result.data) {
          console.log('Setting dashboard data:', result.data);
          console.log('Balance data:', result.data.balance);
          
          // Normalize balance data structure
          const normalizedData = { ...result.data };
          
          // Ensure balance structure exists and is properly formatted
          if (!normalizedData.balance) {
            normalizedData.balance = {};
          }
          
          // Extract balance values using helper function (handles multiple structures)
          const usdValue = getBalanceValue(result.data, 'usd');
          const xrpValue = getBalanceValue(result.data, 'xrp');
          
          // Set balance values if found
          if (usdValue !== null) {
            normalizedData.balance.usd = usdValue;
            console.log('USD Balance extracted:', usdValue);
          } else {
            console.warn('USD Balance not found in API response');
          }
          
          if (xrpValue !== null) {
            normalizedData.balance.xrp = xrpValue;
            console.log('XRP Balance extracted:', xrpValue);
          } else {
            console.warn('XRP Balance not found in API response');
          }
          
          setDashboardData(normalizedData);
          console.log('Dashboard data state updated with normalized balance:', normalizedData.balance);
        } else {
          console.warn('API response missing success or data. Full response:', result);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Dashboard API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    // Always fetch when component mounts, not just when kycComplete is true
    fetchDashboardSummary();
  }, [kycComplete, isSessionExpired]);

  // Business Suite dashboard summary (when account type is Business Suite)
  useEffect(() => {
    if (accountType !== 'Business Suite') {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingBusinessSuiteDashboard(false);
      return;
    }
    setIsLoadingBusinessSuiteDashboard(true);
    fetch(getApiUrl('api/business-suite/dashboard/summary'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        console.log('Business Suite dashboard summary response:', result);
        if (result?.success && result?.data) {
          const d = result.data;
          const bal = d.balance ?? {};
          const usdVal = getBalanceValue(d, 'usd');
          const xrpVal = getBalanceValue(d, 'xrp');
          const normalized = {
            balance: {
              usd: usdVal ?? bal.usd ?? bal.USD ?? bal.usdAmount ?? bal.totalUsd ?? null,
              xrp: xrpVal ?? bal.xrp ?? bal.XRP ?? bal.xrpAmount ?? bal.totalXrp ?? null,
              usdt: bal.usdt ?? bal.USDT ?? null,
              usdc: bal.usdc ?? bal.USDC ?? null,
            },
            activeEscrows: d.activeEscrows ?? { count: 0, lockedAmount: 0 },
            trustiscore: d.trustiscore ?? { score: 0, level: '' },
            totalEscrowed: d.totalEscrowed,
            payrollsCreated: d.payrollsCreated,
            suppliers: d.suppliers,
            completedThisMonth: d.completedThisMonth,
          };
          setBusinessSuiteDashboardData(normalized);
        } else {
          setBusinessSuiteDashboardData(null);
        }
      })
      .catch((err) => {
        console.error('Business Suite dashboard summary error:', err);
        setBusinessSuiteDashboardData(null);
      })
      .finally(() => setIsLoadingBusinessSuiteDashboard(false));
  }, [accountType]);

  // Business Suite portfolio (Subscription + Payroll per month)
  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingBusinessSuitePortfolio(false);
      return;
    }
    const year = portfolioYear;
    setIsLoadingBusinessSuitePortfolio(true);
    fetch(getApiUrl(`api/business-suite/dashboard/portfolio?period=monthly&year=${year}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (result?.success && Array.isArray(result?.data?.data)) {
          const raw = result.data.data;
          const byPeriod = {};
          raw.forEach((p) => {
            const key = String(p.period ?? '').trim().slice(0, 3);
            byPeriod[key] = p;
          });
          const points = months.map((label) => {
            const key = label.toLowerCase().slice(0, 3);
            const p = byPeriod[key] || raw.find((r) => String(r.period ?? '').trim().toLowerCase().slice(0, 3) === key);
            return {
              label,
              subscriptionUsd: p ? Number(p.subscriptionUsd ?? 0) : 0,
              payrollUsd: p ? Number(p.payrollUsd ?? 0) : 0,
              subscriptionPercent: p ? Number(p.subscriptionPercent ?? 0) : 0,
              payrollPercent: p ? Number(p.payrollPercent ?? 0) : 0,
            };
          });
          setBusinessSuitePortfolioPoints(points);
        } else {
          setBusinessSuitePortfolioPoints([]);
        }
      })
      .catch((err) => {
        console.error('Business Suite portfolio error:', err);
        setBusinessSuitePortfolioPoints([]);
      })
      .finally(() => setIsLoadingBusinessSuitePortfolio(false));
  }, [accountType, portfolioYear]);

  // Business Suite teams (My Teams) – refetchable for Add Team modal
  const refetchBusinessSuiteTeams = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingBusinessSuiteTeams(false);
      return;
    }
    setIsLoadingBusinessSuiteTeams(true);
    fetch(getApiUrl('api/business-suite/teams?page=1&pageSize=10'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && Array.isArray(result?.data?.items)) {
          setBusinessSuiteTeams(result.data.items);
        } else {
          setBusinessSuiteTeams([]);
        }
      })
      .catch((err) => {
        console.error('Business Suite teams error:', err);
        setBusinessSuiteTeams([]);
      })
      .finally(() => setIsLoadingBusinessSuiteTeams(false));
  }, []);

  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    refetchBusinessSuiteTeams();
  }, [accountType, refetchBusinessSuiteTeams]);

  // Business Suite upcoming supply (card: no query)
  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingUpcomingSupply(false);
      return;
    }
    setIsLoadingUpcomingSupply(true);
    fetch(getApiUrl('api/business-suite/dashboard/upcoming-supply'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && Array.isArray(result?.data?.items)) {
          setUpcomingSupply(result.data.items);
        } else {
          setUpcomingSupply([]);
        }
      })
      .catch((err) => {
        console.error('Upcoming supply error:', err);
        setUpcomingSupply([]);
      })
      .finally(() => setIsLoadingUpcomingSupply(false));
  }, [accountType]);

  // Business Suite subscription
  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingSubscription(false);
      return;
    }
    setIsLoadingSubscription(true);
    fetch(getApiUrl('api/business-suite/dashboard/subscription'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && Array.isArray(result?.data?.items)) {
          setSubscriptionList(result.data.items);
        } else if (result?.success && result?.data != null && !Array.isArray(result.data?.items)) {
          setSubscriptionList(Array.isArray(result.data) ? result.data : []);
        } else {
          setSubscriptionList([]);
        }
      })
      .catch((err) => {
        console.error('Subscription error:', err);
        setSubscriptionList([]);
      })
      .finally(() => setIsLoadingSubscription(false));
  }, [accountType]);

  const handleViewTeam = (teamId) => {
    if (!teamId) return;
    setTeamDetailOpen(true);
    setTeamDetailTeamId(teamId);
    setIsLoadingTeamDetail(true);
    setTeamDetailData(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingTeamDetail(false);
      return;
    }
    fetch(getApiUrl(`api/business-suite/teams/${teamId}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && result?.data) {
          setTeamDetailData(result.data);
        } else {
          setTeamDetailData(null);
        }
      })
      .catch((err) => {
        console.error('Team detail error:', err);
        setTeamDetailData(null);
      })
      .finally(() => setIsLoadingTeamDetail(false));
  };

  const handleCloseTeamDetail = () => {
    setTeamDetailOpen(false);
    setTeamDetailData(null);
    setTeamDetailTeamId(null);
  };

  const handleTeamDetailMemberRemoved = () => {
    const teamId = teamDetailTeamId;
    if (!teamId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(getApiUrl(`api/business-suite/teams/${teamId}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && result?.data) {
          setTeamDetailData(result.data);
        }
      })
      .catch((err) => console.error('Team detail refetch error:', err));
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      // If session is expired, use fallback data
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
          console.warn('No token found for user profile');
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        console.log('Fetching user profile from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('User profile API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('User profile API response data:', result);

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

            // Extract initials from firstName and lastName
            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = '';
            
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              // Fallback: extract from fullName if firstName/lastName not available
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
              } else if (nameParts.length === 1) {
                initials = nameParts[0].charAt(0).toUpperCase();
              }
            }
            
            setUserInitials(initials);

            // Extract user role from profile data
            const role = data.role || data.userType || data.accountType || '';
            setUserRole(role);

            // Extract user avatar/image from profile data
            const avatar = data.avatar || data.profilePicture || data.image || data.photo || null;
            setUserAvatar(avatar);
          } else {
            console.warn('Unexpected user profile response shape. Expected success and data.', result);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('User profile API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoadingUserProfile(false);
      }
    };

    fetchUserProfile();
  }, [isSessionExpired]);

  const handleCreateWallet = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in to create a wallet.');
      return;
    }

    if (accountType === 'Business Suite') {
      try {
        const apiUrl = getApiUrl('api/business-suite/wallet/create');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json().catch(() => ({}));
        console.log('Business Suite Create Wallet API response:', result);

        if (response.ok && result?.success && result?.data?.xrpl_address) {
          const xrplAddress = result.data.xrpl_address;
          setWalletAddress(xrplAddress);
          setHasWallet(true);
          toast.success(result?.message || 'Wallet created successfully');
          setWalletBalancesRefreshTrigger((prev) => prev + 1);
          setShowBusinessSuiteWalletModal(true);
        } else {
          if (showUnderReviewModalIfApplicable(result?.message)) return;
          toast.error(result?.message || 'Failed to create wallet. Please try again.');
        }
      } catch (error) {
        console.error('Error creating Business Suite wallet:', error);
        toast.error('An error occurred while creating the wallet. Please try again.');
      }
      return;
    }

    try {
      const apiUrl = getApiUrl('api/wallet/create');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        toast.error('Failed to create wallet. Please try again.');
        return;
      }

      const result = await response.json();
      console.log('Create Wallet API response:', result);

      if (result?.success) {
        const xrplAddress = result?.data?.xrpl_address;
        if (xrplAddress) {
          setWalletAddress(xrplAddress);
          setHasWallet(true);
          toast.success('Wallet creation was successful');
        } else {
          toast.error('Wallet was created but address is missing in the response.');
        }
      } else {
        const message = result?.message || 'Failed to create wallet. Please try again.';
        if (showUnderReviewModalIfApplicable(message)) return;
        toast.error(message);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast.error('An error occurred while creating the wallet. Please try again.');
    }
  };

  const handleConnectBusinessWallet = async () => {
    const address = (connectBusinessWalletAddress || '').trim();
    if (!address) {
      toast.error('Enter an XRPL wallet address.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in.');
      return;
    }
    setIsConnectingBusinessWallet(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/wallet/connect'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });
      const result = await res.json().catch(() => ({}));
      if (result?.success) {
        const connectedAddress = result?.data?.walletAddress || address;
        setWalletAddress(connectedAddress);
        setHasWallet(true);
        setShowConnectBusinessWalletModal(false);
        setConnectBusinessWalletAddress('');
        toast.success(result?.message || 'Wallet connected successfully.');
      } else {
        if (showUnderReviewModalIfApplicable(result?.message)) return;
        toast.error(result?.message || 'Failed to connect wallet.');
      }
    } catch (err) {
      console.error('Connect business wallet error:', err);
      toast.error('Failed to connect wallet.');
    } finally {
      setIsConnectingBusinessWallet(false);
    }
  };

  // Determine if wallet already exists based on initial walletAddress (if server pre-fills it)
  useEffect(() => {
    if (walletAddress && typeof walletAddress === 'string' && walletAddress.trim().length > 0) {
      setHasWallet(true);
    }
  }, [walletAddress]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for exchange rates');
          setIsLoadingRates(false);
          return;
        }

        const apiUrl = getApiUrl('api/exchange/rates');
        console.log('Fetching exchange rates from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Exchange rates API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Exchange rates API response data:', result);

          // Expected shape:
          // { success: true, data: { rates: [ { currency, rate, change, changePercent }, ... ], lastUpdated } }
          console.log('Full API result:', JSON.stringify(result, null, 2));
          console.log('result.success:', result?.success);
          console.log('result.data:', result?.data);
          console.log('result.data.rates:', result?.data?.rates);
          console.log('Is array?', Array.isArray(result?.data?.rates));
          
          if (result?.success && Array.isArray(result?.data?.rates) && result.data.rates.length > 0) {
            console.log('Setting exchange rates:', result.data.rates);
            setExchangeRates(result.data.rates);
          } else {
            console.warn('Unexpected exchange rates response shape. Expected data.rates as an array.', result);
            console.warn('Setting exchange rates to empty array');
            setExchangeRates([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Exchange rates API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setExchangeRates([]);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        setExchangeRates([]);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchExchangeRates();
  }, []);

  useEffect(() => {
    const fetchPortfolioPerformance = async () => {
      try {
        setIsLoadingPortfolio(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for portfolio performance');
          setPortfolioPoints([]);
          setIsLoadingPortfolio(false);
          return;
        }

        const params = new URLSearchParams({ timeframe: portfolioTimeframe });
        if (portfolioTimeframe === 'monthly') params.set('year', String(portfolioYear));
        // Cache-buster so changing year always fetches fresh data (avoids stale GET cache)
        params.set('_', String(Date.now()));
        const apiUrl = getApiUrl(`api/portfolio/performance?${params.toString()}`);
        console.log('Fetching portfolio performance from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        console.log('Portfolio performance API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Portfolio response:', result);

          // API: GET api/portfolio/performance?timeframe=monthly&year=YYYY (year optional; when monthly, filter by year)
          // Response: { success, data: { timeframe, year?, data: [ { period, value }, ... ] } }
          const rawData = result?.data?.data;
          if (result?.success && Array.isArray(rawData)) {
            const points = rawData.map((p) => ({ label: p.period ?? p.label ?? '', value: p.value }));
            setPortfolioPoints(points);
          } else {
            setPortfolioPoints([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.log('Portfolio response (error):', { status: response.status, statusText: response.statusText, data: errorData });
          setPortfolioPoints([]);
          if (!showUnderReviewModalIfApplicable(errorData?.message)) {
            toast.error(errorData?.message || 'Failed to load portfolio data');
          }
        }
      } catch (error) {
        console.error('Error fetching portfolio performance:', error);
        setPortfolioPoints([]);
        toast.error('Failed to load portfolio data');
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    fetchPortfolioPerformance();
  }, [portfolioTimeframe, portfolioYear]);

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const portfolioChartPoints = useMemo(() => {
    const data = portfolioPoints || [];
    const norm = (p) => String(p ?? '').trim().toLowerCase();
    const findValue = (label) => {
      const labelStr = String(label).trim();
      const labelNorm = labelStr.toLowerCase();
      const match = data.find((d) => {
        const dLabel = norm(d.label);
        if (portfolioTimeframe === 'monthly') {
          return dLabel === labelNorm || dLabel.slice(0, 3) === labelNorm.slice(0, 3) || labelNorm.slice(0, 3) === dLabel.slice(0, 3);
        }
        if (portfolioTimeframe === 'daily') {
          const dayNum = parseInt(labelStr, 10);
          const dNum = parseInt(dLabel, 10);
          if (!Number.isNaN(dayNum) && !Number.isNaN(dNum)) return dayNum === dNum;
          return dLabel === labelNorm;
        }
        if (portfolioTimeframe === 'yearly') {
          const y = parseInt(labelStr, 10);
          const dy = parseInt(dLabel, 10);
          if (!Number.isNaN(y) && !Number.isNaN(dy)) return y === dy;
          return dLabel === labelNorm;
        }
        return dLabel === labelNorm;
      });
      return match ? Number(match.value ?? 0) : 0;
    };

    if (portfolioTimeframe === 'daily') {
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return { label: String(day), value: findValue(String(day)) };
      });
    }
    if (portfolioTimeframe === 'monthly') {
      return MONTH_LABELS.map((label) => ({ label, value: findValue(label) }));
    }
    if (portfolioTimeframe === 'yearly') {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => {
        const y = currentYear - 4 + i;
        return { label: String(y), value: findValue(String(y)) };
      });
    }
    return data.map((p) => ({ label: p.label ?? '', value: Number(p.value ?? 0) }));
  }, [portfolioPoints, portfolioTimeframe]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.mobile-section-dropdown') && !event.target.closest('.chart-dropdown')) {
        setShowMobilePortfolioDropdown(false);
        setShowPortfolioDropdown(false);
        setShowPortfolioYearDropdown(false);
        setShowMobilePortfolioYearDropdown(false);
      }
    };

    if (showPortfolioDropdown || showMobilePortfolioDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showPortfolioDropdown, showMobilePortfolioDropdown]);

  useEffect(() => {
    const fetchWalletBalances = async () => {
      try {
        // If session is expired, don't fetch
        if (isSessionExpired) {
          console.log('Session expired, skipping wallet balances fetch');
          setIsLoadingWalletBalances(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for wallet balances');
          setIsLoadingWalletBalances(false);
          return;
        }

        const isBusinessSuite = accountType === 'Business Suite';
        if (isBusinessSuite) {
          setWalletBalances(null);
        }
        const apiUrl = isBusinessSuite
          ? getApiUrl('api/business-suite/wallet/balance')
          : getApiUrl('api/wallet/balance');
        console.log('Fetching wallet balances from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Wallet balances API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Wallet balances API response data:', result);

          // If backend includes an XRPL address, treat wallet as already created (same extraction as mount + header)
          const existingAddress = result?.xrplAddress || result?.xrpl_address || result?.data?.xrplAddress || result?.data?.xrpl_address || result?.data?.walletAddress;
          if (
            result?.success &&
            existingAddress &&
            typeof existingAddress === 'string' &&
            existingAddress.trim().length > 0
          ) {
            setWalletAddress(prev => prev || existingAddress);
            setHasWallet(true);
          } else if (accountType === 'Business Suite') {
            setWalletAddress('');
            setHasWallet(false);
          }

          // Handle different possible response structures
          let balances = null;
          
          // Structure 1: { success: true, data: { balance: { xrp, usdt, usdc } } }
          if (result?.success && result?.data?.balance) {
            balances = result.data.balance;
            console.log('Found balances in result.data.balance:', balances);
          }
          // Structure 2: { success: true, data: { xrp, usdt, usdc } }
          else if (result?.success && result?.data) {
            const data = result.data;
            if (data.xrp !== undefined || data.usdt !== undefined || data.usdc !== undefined) {
              balances = {
                xrp: data.xrp || data.XRP || 0,
                usdt: data.usdt || data.USDT || 0,
                usdc: data.usdc || data.USDC || 0
              };
              console.log('Found balances in result.data:', balances);
            }
          }
          // Structure 3: { success: true, data: { wallets: [...] } }
          else if (result?.success && Array.isArray(result?.data?.wallets)) {
            balances = {};
            result.data.wallets.forEach(wallet => {
              const currency = (wallet.currency || wallet.code || '').toLowerCase();
              const balance = wallet.balance || wallet.amount || 0;
              if (currency === 'xrp') balances.xrp = Number(balance);
              if (currency === 'usdt') balances.usdt = Number(balance);
              if (currency === 'usdc') balances.usdc = Number(balance);
            });
            console.log('Found balances from wallets array:', balances);
          }
          // Structure 4: Direct balance object
          else if (result?.balance) {
            balances = result.balance;
            console.log('Found balances in result.balance:', balances);
          }

          if (balances) {
            // Normalize the balance values
            const normalizedBalances = {
              xrp: balances.xrp !== undefined && balances.xrp !== null ? Number(balances.xrp) : 0,
              usdt: balances.usdt !== undefined && balances.usdt !== null ? Number(balances.usdt) : 0,
              usdc: balances.usdc !== undefined && balances.usdc !== null ? Number(balances.usdc) : 0,
              rippleUsd: balances.rippleUsd !== undefined && balances.rippleUsd !== null ? Number(balances.rippleUsd) : (balances.xrpusd !== undefined && balances.xrpusd !== null ? Number(balances.xrpusd) : 0)
            };
            console.log('Setting normalized wallet balances:', normalizedBalances);
            setWalletBalances(normalizedBalances);
          } else {
            console.warn('Could not extract wallet balances from API response:', result);
            setWalletBalances({ xrp: 0, usdt: 0, usdc: 0, rippleUsd: 0 });
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Wallet balances API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setWalletBalances({ xrp: 0, usdt: 0, usdc: 0, rippleUsd: 0 });
          if (accountType === 'Business Suite') {
            setWalletAddress('');
            setHasWallet(false);
          }
        }
      } catch (error) {
        console.error('Error fetching wallet balances:', error);
        setWalletBalances({ xrp: 0, usdt: 0, usdc: 0, rippleUsd: 0 });
        if (accountType === 'Business Suite') {
          setWalletAddress('');
          setHasWallet(false);
        }
      } finally {
        setIsLoadingWalletBalances(false);
      }
    };

    fetchWalletBalances();
  }, [isSessionExpired, accountType, walletBalancesRefreshTrigger]);

  // When Business Suite wallet modal opens, fetch balance
  useEffect(() => {
    if (!showBusinessSuiteWalletModal || accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setBusinessSuiteWalletModalData({ error: 'Not authenticated' });
      return;
    }
    setBusinessSuiteWalletModalLoading(true);
    setBusinessSuiteWalletModalData(null);
    const apiUrl = getApiUrl('api/business-suite/wallet/balance');
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        console.log('GET api/business-suite/wallet/balance response:', result);
        const address = result?.xrplAddress || result?.xrpl_address || result?.data?.xrplAddress || result?.data?.xrpl_address || result?.data?.walletAddress;
        let balances = null;
        if (result?.success && result?.data?.balance) {
          balances = result.data.balance;
        } else if (result?.success && result?.data) {
          const data = result.data;
          if (data.xrp !== undefined || data.usdt !== undefined || data.usdc !== undefined) {
            balances = {
              xrp: data.xrp ?? data.XRP ?? 0,
              usdt: data.usdt ?? data.USDT ?? 0,
              usdc: data.usdc ?? data.USDC ?? 0,
              rippleUsd: data.rippleUsd ?? data.xrpusd ?? 0,
            };
          }
        } else if (result?.success && Array.isArray(result?.data?.wallets)) {
          balances = { xrp: 0, usdt: 0, usdc: 0, rippleUsd: 0 };
          result.data.wallets.forEach((wallet) => {
            const currency = (wallet.currency || wallet.code || '').toLowerCase();
            const balance = Number(wallet.balance ?? wallet.amount ?? 0);
            if (currency === 'xrp') balances.xrp = balance;
            if (currency === 'usdt') balances.usdt = balance;
            if (currency === 'usdc') balances.usdc = balance;
          });
        } else if (result?.balance) {
          balances = result.balance;
        }
        const normalized = balances
          ? {
              xrp: Number(balances.xrp ?? 0),
              usdt: Number(balances.usdt ?? 0),
              usdc: Number(balances.usdc ?? 0),
              rippleUsd: Number(balances.rippleUsd ?? balances.xrpusd ?? 0),
            }
          : null;
        if (result?.success && address && typeof address === 'string' && address.trim().length > 0) {
          setBusinessSuiteWalletModalData({ address: address.trim(), balances: normalized || { xrp: 0, usdt: 0, usdc: 0, rippleUsd: 0 } });
        } else if (normalized) {
          setBusinessSuiteWalletModalData({ address: null, balances: normalized });
        } else {
          const msg = (result?.message || '').toLowerCase();
          setBusinessSuiteWalletModalData({
            error: msg.includes('wallet not found') || msg.includes('not found') ? 'No wallet' : result?.message || 'Failed to load balance',
          });
        }
      })
      .catch((err) => {
        console.error('Business Suite wallet modal fetch:', err);
        setBusinessSuiteWalletModalData({ error: 'Failed to load balance' });
      })
      .finally(() => setBusinessSuiteWalletModalLoading(false));
  }, [showBusinessSuiteWalletModal, accountType]);

  useEffect(() => {
    const fetchEscrows = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for escrows');
          setIsLoadingEscrows(false);
          setIsLoadingTotalEscrowed(false);
          return;
        }

        // Fetch escrows to calculate total escrowed amount
        // Try to get all escrows or use a summary endpoint if available
        const apiUrl = getApiUrl('api/escrow/list?limit=1000&offset=0');
        console.log('Fetching escrows for total calculation from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Escrows API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('Escrows API response data:', result);
          console.log('Escrows API response structure:', {
            hasSuccess: !!result?.success,
            hasData: !!result?.data,
            escrowsArray: Array.isArray(result?.data?.escrows),
            escrowsLength: result?.data?.escrows?.length,
            totalEscrowed: result?.data?.totalEscrowed,
            totalEscrowedAmount: result?.data?.totalEscrowedAmount
          });

          // Expected shape:
          // { success: true, data: { escrows: [ ... ], totalEscrowed, total } }
          if (result?.success && result?.data) {
            // Set escrows list
            if (Array.isArray(result.data.escrows)) {
              setEscrows(result.data.escrows);
              console.log('Set escrows array, length:', result.data.escrows.length);
            }

            // Extract total escrowed amount from API response
            // Check for totalEscrowed, totalEscrowedAmount, or calculate from escrows
            let calculatedTotal = null;
            
            if (result.data.totalEscrowed !== undefined && result.data.totalEscrowed !== null) {
              calculatedTotal = result.data.totalEscrowed;
              console.log('Using totalEscrowed from API:', calculatedTotal);
            } else if (result.data.totalEscrowedAmount !== undefined && result.data.totalEscrowedAmount !== null) {
              calculatedTotal = result.data.totalEscrowedAmount;
              console.log('Using totalEscrowedAmount from API:', calculatedTotal);
            } else if (Array.isArray(result.data.escrows) && result.data.escrows.length > 0) {
              // Calculate total from escrows array if totalEscrowed is not provided
              // Escrow amount structure: escrow.amount.usd or escrow.amount.xrp
              console.log('Calculating total from escrows array, count:', result.data.escrows.length);
              calculatedTotal = result.data.escrows.reduce((sum, escrow, index) => {
                // Try to get USD amount first, then XRP, then other possible fields
                const amount = escrow.amount?.usd || 
                              escrow.amount?.USD || 
                              escrow.amount?.xrp || 
                              escrow.amount?.XRP ||
                              escrow.totalAmount || 
                              escrow.usdAmount || 
                              (typeof escrow.amount === 'number' ? escrow.amount : null) ||
                              0;
                const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
                if (index < 3) {
                  console.log(`Escrow ${index}:`, {
                    escrow,
                    amount,
                    numAmount,
                    runningSum: sum + numAmount
                  });
                }
                return sum + numAmount;
              }, 0);
              console.log('Calculated total escrowed amount:', calculatedTotal);
            } else {
              console.log('No escrows found, setting total to 0');
              calculatedTotal = 0;
            }
            
            if (calculatedTotal !== null) {
              setTotalEscrowedAmount(calculatedTotal);
              console.log('Set totalEscrowedAmount state to:', calculatedTotal);
            }
          } else {
            console.warn('Unexpected escrows response shape. Expected success and data.', result);
            setTotalEscrowedAmount(0);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('Escrows API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          setTotalEscrowedAmount(0);
        }
      } catch (error) {
        console.error('Error fetching escrows:', error);
        setTotalEscrowedAmount(0);
      } finally {
        setIsLoadingEscrows(false);
        setIsLoadingTotalEscrowed(false);
      }
    };

    fetchEscrows();
  }, [isSessionExpired]);

  const handleFundWallet = async (e) => {
    e.preventDefault();
    console.log('handleFundWallet submitted with form:', fundWalletForm);
    console.log('Selected wallet type from dropdown:', fundWalletForm.currency);
    console.log('Amount:', fundWalletForm.amount);
    
    if (!fundWalletForm.amount || parseFloat(fundWalletForm.amount) <= 0) {
      console.warn('Invalid fund amount:', fundWalletForm.amount);
      toast.error('Please enter a valid amount');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No auth token found while funding wallet');
      toast.error('Please login to fund your wallet');
      return;
    }

    // Get the selected currency/wallet type
    const selectedCurrency = fundWalletForm.currency || 'XRP';
    console.log('Using currency/wallet type for API call:', selectedCurrency);

    setIsFundingWallet(true);
    setFundingStep('preparing');
    
    try {
      // Step 1: Prepare transaction - Call /api/wallet/fund
      const apiUrl = getApiUrl('api/wallet/fund');
      const requestBody = {
        amount: parseFloat(fundWalletForm.amount),
        currency: selectedCurrency
      };
      
      console.log('Step 1: Calling fund wallet API to prepare transaction:', apiUrl);
      console.log('Request body being sent:', requestBody);
      console.log('Currency value in request:', requestBody.currency);

      toast.loading('Preparing transaction...', { id: 'fund-wallet' });

      const prepareResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Fund wallet API response status:', prepareResponse.status);

      const prepareResult = await prepareResponse.json().catch(() => ({}));
      console.log('Fund wallet API response body:', prepareResult);
      console.log('Fund wallet API response data:', prepareResult.data);
      console.log('Transaction ID:', prepareResult.data?.transactionId);
      console.log('Transaction Blob:', prepareResult.data?.transactionBlob);

      if (!prepareResponse.ok || !prepareResult.success) {
        if (showUnderReviewModalIfApplicable(prepareResult?.message)) {
          setIsFundingWallet(false);
          setFundingStep('idle');
          return;
        }
        toast.error(prepareResult.message || 'Failed to prepare transaction. Please try again.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      // Store transaction data
      const transactionId = prepareResult.data?.transactionId;
      const xummUrl = prepareResult.data?.xummUrl;
      // Check for transaction object/blob for browser wallet flow
      const transactionObject = prepareResult.data?.transaction 
        || prepareResult.data?.transactionBlob 
        || prepareResult.data?.txBlob 
        || prepareResult.data?.blob;

      // Check if transaction was already processed (has xrplTxHash)
      if (prepareResult.data?.xrplTxHash) {
        console.log('Transaction already processed by backend, skipping wallet signing step');
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        await fetchDashboardSummary();
        return;
      }

      if (!transactionId) {
        console.error('Missing transactionId in response:', prepareResult);
        toast.error('Backend response missing transaction ID.', { id: 'fund-wallet' });
        setIsFundingWallet(false);
        setFundingStep('idle');
        return;
      }

      setTransactionData({ transactionId, transactionObject, xummUrl });
      setFundingStep('signing');

      // Step 2: Determine which flow to use based on xummUrl presence
      if (xummUrl) {
        // Xaman flow (mobile app)
        console.log('Using Xaman flow - xummUrl provided:', xummUrl);
        toast.loading('Please sign the transaction in your Xaman wallet...', { id: 'fund-wallet' });
        
        // Open XUMM URL for user to sign
        window.open(xummUrl, '_blank');

        // Poll backend for transaction status
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
              console.log('Transaction status check:', statusResult);
              
              if (statusResult.data?.signed) {
                // Backend automatically submits to XRPL when signed
                // No need to call /api/wallet/fund/complete
                clearInterval(pollInterval);
                
                console.log('Transaction signed and automatically submitted by backend');
                
                // Show success and refresh
                toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
                setShowFundWalletModal(false);
                setFundWalletForm({ amount: '', currency: 'XRP' });
                setTransactionData(null);
                setFundingStep('idle');
                setIsFundingWallet(false);
                // Refresh dashboard data
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
        }, 2000); // Poll every 2 seconds
        
        // Store interval to clear it if user cancels
        setTransactionData({ transactionId, transactionObject, xummUrl, pollInterval });
        
        // Cleanup interval after 5 minutes (timeout)
        setTimeout(() => {
          clearInterval(pollInterval);
          if (fundingStep === 'signing') {
            toast.error('Transaction signing timed out.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        }, 5 * 60 * 1000); // 5 minutes timeout
        
      } else {
        // Browser wallet flow (Crossmark/MetaMask)
        console.log('Using browser wallet flow - no xummUrl, signing with browser wallet');
        
        if (!transactionObject) {
          console.error('Missing transaction object for browser wallet flow:', prepareResult);
          toast.error('Backend response missing transaction data for browser wallet signing.', { id: 'fund-wallet' });
          setIsFundingWallet(false);
          setFundingStep('idle');
          setTransactionData(null);
          return;
        }
        
        toast.loading('Please sign the transaction in your browser wallet...', { id: 'fund-wallet' });
        
        try {
          // Parse transaction object if it's a JSON string
          let txToSign = transactionObject;
          if (typeof transactionObject === 'string') {
            try {
              txToSign = JSON.parse(transactionObject);
            } catch (e) {
              console.warn('Could not parse transaction object as JSON:', e);
            }
          }
          
          console.log('Transaction to sign:', txToSign);
          console.log('Transaction to sign (stringified):', JSON.stringify(txToSign, null, 2));
          
          // Validate transaction object structure
          if (!txToSign || (typeof txToSign !== 'object' && typeof txToSign !== 'string')) {
            console.error('Invalid transaction object:', txToSign);
            throw new Error('Invalid transaction object received from backend. Please try again.');
          }
          
          // Check for Crossmark (XRPL browser wallet)
          if (window.crossmark) {
            console.log('Crossmark wallet detected');
            console.log('Crossmark API structure:', window.crossmark);
            console.log('Crossmark api object:', window.crossmark.api);
            console.log('Crossmark methods:', window.crossmark.methods);
            console.log('Crossmark session:', window.crossmark.session);
            console.log('Transaction to sign:', txToSign);
            console.log('Transaction type:', typeof txToSign);
            console.log('Transaction keys:', txToSign && typeof txToSign === 'object' ? Object.keys(txToSign) : 'N/A');
            
            // Validate XRPL transaction structure if it's an object
            if (typeof txToSign === 'object' && txToSign !== null) {
              const requiredFields = ['TransactionType'];
              const missingFields = requiredFields.filter(field => !(field in txToSign));
              if (missingFields.length > 0) {
                console.warn('Transaction may be missing required fields:', missingFields);
                console.warn('Transaction object:', txToSign);
              }
            }
            
            // Check if Crossmark is connected
            let isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
            console.log('Crossmark connected:', isConnected);
            console.log('Crossmark session address:', window.crossmark?.session?.address);
            console.log('Crossmark api connected:', window.crossmark?.api?.connected);
            
            // If not connected, we need to connect first - this will trigger the popup
            if (!isConnected) {
              console.log('Crossmark wallet is not connected. Attempting to connect...');
              
              // Try different connection methods
              try {
                if (window.crossmark?.session?.signIn && typeof window.crossmark.session.signIn === 'function') {
                  console.log('Using session.signIn to connect...');
                  await window.crossmark.session.signIn();
                  console.log('Crossmark sign-in completed');
                  
                  // Wait a moment for connection to establish
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Check connection again
                  isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                  console.log('Crossmark connected after signIn:', isConnected);
                } else if (window.crossmark?.async?.signInAndWait && typeof window.crossmark.async.signInAndWait === 'function') {
                  console.log('Using async.signInAndWait to connect...');
                  await window.crossmark.async.signInAndWait();
                  console.log('Crossmark signInAndWait completed');
                  
                  // Wait a moment for connection to establish
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Check connection again with retry
                  let retryCount = 0;
                  const maxRetries = 5;
                  while (retryCount < maxRetries && !isConnected) {
                    isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                    if (!isConnected) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                      retryCount++;
                    }
                  }
                  console.log('Crossmark connected after signInAndWait:', isConnected, `(retries: ${retryCount})`);
                } else if (window.crossmark?.methods?.signIn && typeof window.crossmark.methods.signIn === 'function') {
                  console.log('Using methods.signIn to connect...');
                  await window.crossmark.methods.signIn();
                  console.log('Crossmark methods.signIn completed');
                  
                  // Wait a moment for connection to establish
                  await new Promise(resolve => setTimeout(resolve, 500));
                  
                  // Check connection again with retry
                  let retryCount = 0;
                  const maxRetries = 5;
                  while (retryCount < maxRetries && !isConnected) {
                    isConnected = window.crossmark?.session?.address || window.crossmark?.api?.connected || false;
                    if (!isConnected) {
                      await new Promise(resolve => setTimeout(resolve, 500));
                      retryCount++;
                    }
                  }
                  console.log('Crossmark connected after methods.signIn:', isConnected, `(retries: ${retryCount})`);
                }
              } catch (connectError) {
                console.error('Error connecting Crossmark:', connectError);
                throw new Error('Failed to connect Crossmark wallet. Please make sure the extension is installed and unlocked, then try again.');
              }
              
              // If still not connected after attempting to connect, throw an error
              if (!isConnected) {
                console.error('Crossmark wallet is still not connected after connection attempt');
                console.error('Session state:', {
                  address: window.crossmark?.session?.address,
                  apiConnected: window.crossmark?.api?.connected,
                  session: window.crossmark?.session
                });
                throw new Error('Crossmark wallet is not connected. Please connect your wallet in the Crossmark extension and try again.');
              }
            }
            
            console.log('Crossmark is connected, proceeding with transaction signing...');
            toast.loading('Requesting transaction signature from Crossmark...', { id: 'fund-wallet' });
            
            try {
              let signedTx;
              
              // Crossmark's recommended approach: use api.request with method 'sign'
              // This is the standard way to trigger the popup
              if (window.crossmark.api && typeof window.crossmark.api.request === 'function') {
                console.log('Using Crossmark api.request method...');
                toast.loading('Waiting for you to approve the transaction in Crossmark...', { id: 'fund-wallet' });
                // Request-based API - this should trigger the popup
                signedTx = await window.crossmark.api.request({
                  method: 'sign',
                  params: {
                    transaction: txToSign
                  }
                });
                console.log('Crossmark request completed, response:', signedTx);
              } else if (window.crossmark.api && typeof window.crossmark.api.sign === 'function') {
                console.log('Using Crossmark api.sign method...');
                // Direct sign method
                signedTx = await window.crossmark.api.sign(txToSign);
                console.log('Crossmark sign completed, response:', signedTx);
              } else if (window.crossmark.api && typeof window.crossmark.api.signTransaction === 'function') {
                console.log('Using Crossmark api.signTransaction method...');
                // signTransaction method
                signedTx = await window.crossmark.api.signTransaction(txToSign);
                console.log('Crossmark signTransaction completed, response:', signedTx);
              } else if (window.crossmark.methods && typeof window.crossmark.methods.sign === 'function') {
                console.log('Using Crossmark methods.sign...');
                // Methods-based API
                signedTx = await window.crossmark.methods.sign(txToSign);
                console.log('Crossmark methods.sign completed, response:', signedTx);
              } else if (window.crossmark.async && typeof window.crossmark.async.sign === 'function') {
                console.log('Using Crossmark async.sign...');
                // Async API
                signedTx = await window.crossmark.async.sign(txToSign);
                console.log('Crossmark async.sign completed, response:', signedTx);
              } else {
                // Try to find any sign-related method
                const api = window.crossmark.api || window.crossmark;
                const availableMethods = Object.keys(api || {}).filter(key => 
                  typeof api[key] === 'function' && key.toLowerCase().includes('sign')
                );
                
                if (availableMethods.length > 0) {
                  console.log('Found sign methods:', availableMethods);
                  console.log('Using method:', availableMethods[0]);
                  signedTx = await api[availableMethods[0]](txToSign);
                  console.log('Method call completed, response:', signedTx);
                } else {
                  console.error('Available API methods:', Object.keys(api || {}));
                  throw new Error('No sign method found. Available API methods: ' + Object.keys(api || {}).join(', '));
                }
              }
              
              console.log('Transaction signed with Crossmark:', signedTx);
              console.log('Full Crossmark response:', JSON.stringify(signedTx, null, 2));
              console.log('Crossmark response type:', typeof signedTx);
              console.log('Crossmark response keys:', signedTx ? Object.keys(signedTx) : 'null/undefined');
              
              // Check if the response is a UUID (request ID) - Crossmark sometimes returns request IDs that need to be awaited
              const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
              let actualResponse = signedTx;
              
              // If the response is a UUID string, it's a request ID - we need to await the actual response
              if (typeof signedTx === 'string' && uuidPattern.test(signedTx)) {
                console.log('Received UUID request ID from Crossmark, awaiting actual response...');
                console.log('Request ID:', signedTx);
                
                const requestId = signedTx;
                const REQUEST_TIMEOUT = 120000; // 2 minutes timeout
                let responseReceived = false;
                
                toast.loading('Transaction approved, processing response...', { id: 'fund-wallet' });
                
                // Strategy 1: Try awaitRequest with timeout
                if (window.crossmark?.api?.awaitRequest && typeof window.crossmark.api.awaitRequest === 'function') {
                  console.log('Strategy 1: Using awaitRequest with timeout...');
                  try {
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Request timeout: No response received within 2 minutes')), REQUEST_TIMEOUT)
                    );
                    
                    actualResponse = await Promise.race([
                      window.crossmark.api.awaitRequest(requestId),
                      timeoutPromise
                    ]);
                    
                    console.log('Received response from awaitRequest:', actualResponse);
                    console.log('Response type:', typeof actualResponse);
                    console.log('Response keys:', actualResponse ? Object.keys(actualResponse) : null);
                    responseReceived = true;
                  } catch (awaitError) {
                    console.warn('awaitRequest failed or timed out:', awaitError);
                    // Continue to fallback strategies
                  }
                }
                
                // Strategy 2: Use event listeners if awaitRequest didn't work
                if (!responseReceived && window.crossmark?.api) {
                  console.log('Strategy 2: Trying event listener approach...');
                  try {
                    const eventPromise = new Promise((resolve, reject) => {
                      let handler;
                      const timeout = setTimeout(() => {
                        if (handler && window.crossmark?.api?.off) {
                          window.crossmark.api.off('response', handler);
                        }
                        reject(new Error('Event listener timeout: No response event received within 2 minutes'));
                      }, REQUEST_TIMEOUT);
                      
                      handler = (event) => {
                        console.log('Received response event:', event);
                        // Check if this event is for our request
                        if (event.uuid === requestId || event.requestId === requestId || event.id === requestId) {
                          clearTimeout(timeout);
                          if (window.crossmark?.api?.off) {
                            window.crossmark.api.off('response', handler);
                          }
                          resolve(event);
                        }
                      };
                      
                      // Try different event names
                      if (window.crossmark.api.on) {
                        window.crossmark.api.on('response', handler);
                      } else if (window.crossmark.api.addEventListener) {
                        window.crossmark.api.addEventListener('response', handler);
                      } else if (window.crossmark.on) {
                        window.crossmark.on('response', handler);
                      }
                    });
                    
                    actualResponse = await eventPromise;
                    console.log('Received response from event listener:', actualResponse);
                    responseReceived = true;
                  } catch (eventError) {
                    console.warn('Event listener approach failed:', eventError);
                    // Continue to next strategy
                  }
                }
                
                // Strategy 3: Poll the active Map for response
                if (!responseReceived && window.crossmark?.api?.active && window.crossmark.api.active instanceof Map) {
                  console.log('Strategy 3: Polling active Map for response...');
                  try {
                    const pollPromise = new Promise((resolve, reject) => {
                      let pollCount = 0;
                      const maxPolls = REQUEST_TIMEOUT / 1000; // Poll every second for 2 minutes
                      
                      const pollInterval = setInterval(() => {
                        pollCount++;
                        const activeRequest = window.crossmark.api.active.get(requestId);
                        
                        console.log(`Polling attempt ${pollCount}/${maxPolls}, active request:`, activeRequest);
                        
                        if (activeRequest) {
                          // Check if response is available
                          if (activeRequest.response) {
                            clearInterval(pollInterval);
                            console.log('Found response in active request:', activeRequest.response);
                            resolve(activeRequest.response);
                            return;
                          }
                          
                          // Check if there's a promise we can await
                          if (activeRequest.promise && typeof activeRequest.promise.then === 'function') {
                            clearInterval(pollInterval);
                            console.log('Found promise in active request, awaiting...');
                            activeRequest.promise
                              .then(resolve)
                              .catch(reject);
                            return;
                          }
                          
                          // Check for other response properties
                          if (activeRequest.result) {
                            clearInterval(pollInterval);
                            console.log('Found result in active request:', activeRequest.result);
                            resolve(activeRequest.result);
                            return;
                          }
                        }
                        
                        // Timeout after max polls
                        if (pollCount >= maxPolls) {
                          clearInterval(pollInterval);
                          reject(new Error('Polling timeout: No response found in active Map after 2 minutes'));
                        }
                      }, 1000); // Poll every second
                    });
                    
                    actualResponse = await pollPromise;
                    console.log('Received response from polling:', actualResponse);
                    responseReceived = true;
                  } catch (pollError) {
                    console.warn('Polling approach failed:', pollError);
                    // All strategies failed
                  }
                }
                
                // If all strategies failed, throw error
                if (!responseReceived || (typeof actualResponse === 'string' && uuidPattern.test(actualResponse))) {
                  console.error('All strategies failed to get response. Request ID:', requestId);
                  console.error('Active Map contents:', window.crossmark?.api?.active ? Array.from(window.crossmark.api.active.entries()) : 'N/A');
                  toast.error('Transaction request timed out. Please check if you approved the transaction in Crossmark and try again.', { id: 'fund-wallet' });
                  throw new Error('Failed to receive transaction response from Crossmark. The transaction may have been cancelled or the request timed out. Please try again.');
                }
                
                // Success - update toast message
                toast.loading('Transaction signed successfully, submitting to network...', { id: 'fund-wallet' });
              }
              
              // Extract signed transaction blob from response
              // Crossmark typically returns the blob in various formats
              let signedTxBlob = null;
              
              // Helper function to recursively search for blob-like strings in an object
              const findBlobInObject = (obj, depth = 0, maxDepth = 5) => {
                if (depth > maxDepth || !obj || typeof obj !== 'object') return null;
                
                // Check if current object has blob-like properties
                const blobKeys = ['signedTransaction', 'txBlob', 'blob', 'tx', 'transaction', 'hex', 'txHex', 'signedTx'];
                for (const key of blobKeys) {
                  if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 0) {
                    return obj[key];
                  }
                }
                
                // Recursively search nested objects
                for (const key in obj) {
                  if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
                    const found = findBlobInObject(obj[key], depth + 1, maxDepth);
                    if (found) return found;
                  }
                }
                
                return null;
              };
              
              // If it's already a string (hex blob), use it directly (but not if it's a UUID)
              if (typeof actualResponse === 'string' && actualResponse.length > 0 && !uuidPattern.test(actualResponse)) {
                signedTxBlob = actualResponse;
                console.log('Found blob as direct string response');
              } 
              // Check for common response structures - expanded list
              else if (actualResponse?.signedTransaction) {
                signedTxBlob = actualResponse.signedTransaction;
                console.log('Found blob in actualResponse.signedTransaction');
              } else if (actualResponse?.txBlob) {
                signedTxBlob = actualResponse.txBlob;
                console.log('Found blob in actualResponse.txBlob');
              } else if (actualResponse?.blob) {
                signedTxBlob = actualResponse.blob;
                console.log('Found blob in actualResponse.blob');
              } else if (actualResponse?.tx) {
                signedTxBlob = actualResponse.tx;
                console.log('Found blob in actualResponse.tx');
              } else if (actualResponse?.transaction) {
                signedTxBlob = actualResponse.transaction;
                console.log('Found blob in actualResponse.transaction');
              } else if (actualResponse?.hex) {
                signedTxBlob = actualResponse.hex;
                console.log('Found blob in actualResponse.hex');
              } else if (actualResponse?.txHex) {
                signedTxBlob = actualResponse.txHex;
                console.log('Found blob in actualResponse.txHex');
              } else if (actualResponse?.result) {
                // If result is a string, use it; if it's an object, check its properties
                if (typeof actualResponse.result === 'string' && !uuidPattern.test(actualResponse.result)) {
                  signedTxBlob = actualResponse.result;
                  console.log('Found blob in actualResponse.result (string)');
                } else if (actualResponse.result?.signedTransaction) {
                  signedTxBlob = actualResponse.result.signedTransaction;
                  console.log('Found blob in actualResponse.result.signedTransaction');
                } else if (actualResponse.result?.txBlob) {
                  signedTxBlob = actualResponse.result.txBlob;
                  console.log('Found blob in actualResponse.result.txBlob');
                } else if (actualResponse.result?.blob) {
                  signedTxBlob = actualResponse.result.blob;
                  console.log('Found blob in actualResponse.result.blob');
                } else if (actualResponse.result?.tx) {
                  signedTxBlob = actualResponse.result.tx;
                  console.log('Found blob in actualResponse.result.tx');
                } else if (actualResponse.result?.hex) {
                  signedTxBlob = actualResponse.result.hex;
                  console.log('Found blob in actualResponse.result.hex');
                }
              } else if (actualResponse?.response) {
                // Check nested response structures
                if (actualResponse.response?.signedTransaction) {
                  signedTxBlob = actualResponse.response.signedTransaction;
                  console.log('Found blob in actualResponse.response.signedTransaction');
                } else if (actualResponse.response?.txBlob) {
                  signedTxBlob = actualResponse.response.txBlob;
                  console.log('Found blob in actualResponse.response.txBlob');
                } else if (actualResponse.response?.blob) {
                  signedTxBlob = actualResponse.response.blob;
                  console.log('Found blob in actualResponse.response.blob');
                } else if (actualResponse.response?.data) {
                  if (actualResponse.response.data?.signedTransaction) {
                    signedTxBlob = actualResponse.response.data.signedTransaction;
                    console.log('Found blob in actualResponse.response.data.signedTransaction');
                  } else if (actualResponse.response.data?.txBlob) {
                    signedTxBlob = actualResponse.response.data.txBlob;
                    console.log('Found blob in actualResponse.response.data.txBlob');
                  } else if (actualResponse.response.data?.blob) {
                    signedTxBlob = actualResponse.response.data.blob;
                    console.log('Found blob in actualResponse.response.data.blob');
                  } else if (actualResponse.response.data?.hex) {
                    signedTxBlob = actualResponse.response.data.hex;
                    console.log('Found blob in actualResponse.response.data.hex');
                  }
                } else if (actualResponse.response?.payload) {
                  if (typeof actualResponse.response.payload === 'string' && !uuidPattern.test(actualResponse.response.payload)) {
                    signedTxBlob = actualResponse.response.payload;
                    console.log('Found blob in actualResponse.response.payload (string)');
                  } else if (actualResponse.response.payload?.signedTransaction) {
                    signedTxBlob = actualResponse.response.payload.signedTransaction;
                    console.log('Found blob in actualResponse.response.payload.signedTransaction');
                  } else if (actualResponse.response.payload?.txBlob) {
                    signedTxBlob = actualResponse.response.payload.txBlob;
                    console.log('Found blob in actualResponse.response.payload.txBlob');
                  }
                } else if (actualResponse.response?.result) {
                  if (actualResponse.response.result?.signedTransaction) {
                    signedTxBlob = actualResponse.response.result.signedTransaction;
                    console.log('Found blob in actualResponse.response.result.signedTransaction');
                  } else if (actualResponse.response.result?.txBlob) {
                    signedTxBlob = actualResponse.response.result.txBlob;
                    console.log('Found blob in actualResponse.response.result.txBlob');
                  } else if (typeof actualResponse.response.result === 'string' && !uuidPattern.test(actualResponse.response.result)) {
                    signedTxBlob = actualResponse.response.result;
                    console.log('Found blob in actualResponse.response.result (string)');
                  }
                }
              } else if (actualResponse?.data) {
                if (actualResponse.data?.signedTransaction) {
                  signedTxBlob = actualResponse.data.signedTransaction;
                  console.log('Found blob in actualResponse.data.signedTransaction');
                } else if (actualResponse.data?.txBlob) {
                  signedTxBlob = actualResponse.data.txBlob;
                  console.log('Found blob in actualResponse.data.txBlob');
                } else if (actualResponse.data?.blob) {
                  signedTxBlob = actualResponse.data.blob;
                  console.log('Found blob in actualResponse.data.blob');
                } else if (actualResponse.data?.hex) {
                  signedTxBlob = actualResponse.data.hex;
                  console.log('Found blob in actualResponse.data.hex');
                }
              } else if (actualResponse?.payload) {
                if (typeof actualResponse.payload === 'string' && !uuidPattern.test(actualResponse.payload)) {
                  signedTxBlob = actualResponse.payload;
                  console.log('Found blob in actualResponse.payload (string)');
                } else if (actualResponse.payload?.signedTransaction) {
                  signedTxBlob = actualResponse.payload.signedTransaction;
                  console.log('Found blob in actualResponse.payload.signedTransaction');
                } else if (actualResponse.payload?.txBlob) {
                  signedTxBlob = actualResponse.payload.txBlob;
                  console.log('Found blob in actualResponse.payload.txBlob');
                }
              }
              
              // If still not found, try recursive search
              if (!signedTxBlob && actualResponse && typeof actualResponse === 'object') {
                console.log('Attempting recursive search for blob in response object...');
                signedTxBlob = findBlobInObject(actualResponse);
                if (signedTxBlob) {
                  console.log('Found blob via recursive search');
                }
              }
              
              // Validate that we have a proper transaction blob (hex string, not a UUID)
              if (!signedTxBlob || typeof signedTxBlob !== 'string') {
                console.error('Invalid signed transaction blob extracted:', signedTxBlob);
                console.error('Full response structure for debugging:', {
                  originalResponse: signedTx,
                  actualResponse: actualResponse,
                  type: typeof actualResponse,
                  keys: actualResponse ? Object.keys(actualResponse) : null,
                  stringified: JSON.stringify(actualResponse, null, 2)
                });
                throw new Error('Failed to extract signed transaction blob from wallet response. Please check the console for the full response structure and try again.');
              }
              
              // Ensure it's not a UUID (UUIDs have a specific format with dashes)
              if (uuidPattern.test(signedTxBlob)) {
                console.error('Extracted value appears to be a UUID, not a transaction blob:', signedTxBlob);
                console.error('Full response structure for debugging:', {
                  originalResponse: signedTx,
                  actualResponse: actualResponse,
                  type: typeof actualResponse,
                  keys: actualResponse ? Object.keys(actualResponse) : null,
                  stringified: JSON.stringify(actualResponse, null, 2)
                });
                throw new Error(`Invalid transaction blob format: received UUID "${signedTxBlob}" instead of transaction blob. The response structure may be different for this transaction type. Please check the console for the full response and try again.`);
              }
              
              // Validate blob format: should be a hex string (alphanumeric, typically 100+ characters)
              // XRPL transaction blobs are typically hex-encoded and much longer than UUIDs
              const hexPattern = /^[0-9a-f]+$/i;
              if (!hexPattern.test(signedTxBlob)) {
                console.warn('Transaction blob does not match hex pattern. Blob preview:', signedTxBlob.substring(0, 100));
              }
              
              // Check minimum length (XRPL blobs are typically 100+ characters)
              if (signedTxBlob.length < 50) {
                console.warn('Transaction blob seems unusually short:', signedTxBlob.length, 'characters');
              }
              
              console.log('Extracted signed transaction blob (length:', signedTxBlob.length, '):', signedTxBlob.substring(0, 50) + '...');
              
              // Submit signed transaction to backend
              await submitSignedTransaction(transactionId, signedTxBlob, token);
            } catch (crossmarkError) {
              console.error('Crossmark signing error:', crossmarkError);
              console.error('Crossmark error details:', {
                name: crossmarkError?.name,
                message: crossmarkError?.message,
                code: crossmarkError?.code,
                stack: crossmarkError?.stack
              });
              console.error('Crossmark object:', window.crossmark);
              console.error('Crossmark api:', window.crossmark.api);
              console.error('Transaction that failed:', txToSign);
              
              // Provide more specific error messages
              let errorMessage = crossmarkError.message || 'Unknown error';
              
              if (crossmarkError.message?.includes('rejected') || crossmarkError.message?.includes('denied') || crossmarkError.message?.includes('cancel')) {
                errorMessage = 'Transaction signing was cancelled or rejected. Please try again.';
              } else if (crossmarkError.message?.includes('popup') || crossmarkError.message?.includes('blocked')) {
                errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
              } else if (crossmarkError.message?.includes('not connected') || crossmarkError.message?.includes('connect')) {
                errorMessage = 'Crossmark wallet is not connected. Please connect your wallet and try again.';
              } else if (crossmarkError.message?.includes('invalid') || crossmarkError.message?.includes('format')) {
                errorMessage = 'Invalid transaction format. Please check the transaction data and try again.';
              }
              
              toast.error(`Failed to sign with Crossmark wallet: ${errorMessage}`, { id: 'fund-wallet' });
              setIsFundingWallet(false);
              setFundingStep('idle');
              setTransactionData(null);
            }
          } 
          // Check for MetaMask or other Web3 wallets (for XRPL if supported)
          else if (window.ethereum) {
            console.log('MetaMask/Web3 wallet detected, attempting XRPL signing');
            try {
              // MetaMask uses xrpl_signTransaction method for XRPL transactions
              const signedTx = await window.ethereum.request({
                method: 'xrpl_signTransaction',
                params: [txToSign]
              });
              
              console.log('Transaction signed with MetaMask:', signedTx);
              console.log('Full MetaMask response:', JSON.stringify(signedTx, null, 2));
              
              // Extract signed transaction blob from response
              // MetaMask XRPL signing typically returns the blob in various formats
              let signedTxBlob = null;
              
              // If it's already a string (hex blob), use it directly
              if (typeof signedTx === 'string' && signedTx.length > 0) {
                signedTxBlob = signedTx;
              } 
              // Check for common response structures
              else if (signedTx?.signedTransaction) {
                signedTxBlob = signedTx.signedTransaction;
              } else if (signedTx?.txBlob) {
                signedTxBlob = signedTx.txBlob;
              } else if (signedTx?.result) {
                // If result is a string, use it; if it's an object, check its properties
                if (typeof signedTx.result === 'string') {
                  signedTxBlob = signedTx.result;
                } else if (signedTx.result?.signedTransaction) {
                  signedTxBlob = signedTx.result.signedTransaction;
                } else if (signedTx.result?.txBlob) {
                  signedTxBlob = signedTx.result.txBlob;
                }
              } else if (signedTx?.blob) {
                signedTxBlob = signedTx.blob;
              } else if (signedTx?.response?.signedTransaction) {
                signedTxBlob = signedTx.response.signedTransaction;
              } else if (signedTx?.data?.signedTransaction) {
                signedTxBlob = signedTx.data.signedTransaction;
              }
              
              // Validate that we have a proper transaction blob (hex string, not a UUID)
              if (!signedTxBlob || typeof signedTxBlob !== 'string') {
                console.error('Invalid signed transaction blob extracted:', signedTxBlob);
                throw new Error('Failed to extract signed transaction blob from wallet response. Please try again.');
              }
              
              // Ensure it's not a UUID (UUIDs have a specific format with dashes)
              if (signedTxBlob.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.error('Extracted value appears to be a UUID, not a transaction blob:', signedTxBlob);
                throw new Error('Invalid transaction blob format. Please try signing again.');
              }
              
              console.log('Extracted signed transaction blob (length:', signedTxBlob.length, '):', signedTxBlob.substring(0, 50) + '...');
              
              // Submit signed transaction to backend
              await submitSignedTransaction(transactionId, signedTxBlob, token);
            } catch (metamaskError) {
              console.error('MetaMask signing error:', metamaskError);
              // If MetaMask doesn't support XRPL, suggest Crossmark
              if (metamaskError.code === -32601 || metamaskError.message?.includes('not supported')) {
                toast.error('MetaMask does not support XRPL transactions. Please install Crossmark wallet extension.', { id: 'fund-wallet' });
              } else {
                toast.error(`Failed to sign with MetaMask: ${metamaskError.message || 'Unknown error'}. Please try again.`, { id: 'fund-wallet' });
              }
              setIsFundingWallet(false);
              setFundingStep('idle');
              setTransactionData(null);
            }
          } else {
            toast.error('No XRPL wallet detected. Please install Crossmark wallet extension or use MetaMask with XRPL support.', { id: 'fund-wallet' });
            setIsFundingWallet(false);
            setFundingStep('idle');
            setTransactionData(null);
          }
        } catch (browserWalletError) {
          console.error('Error with browser wallet flow:', browserWalletError);
          toast.error('Failed to sign transaction with browser wallet. Please try again.', { id: 'fund-wallet' });
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

  // Helper function to submit signed transaction for browser wallet flow
  const submitSignedTransaction = async (transactionId, signedTxBlob, token) => {
    try {
      setFundingStep('completing');
      toast.loading('Submitting signed transaction...', { id: 'fund-wallet' });
      
      // Validate inputs
      if (!transactionId || typeof transactionId !== 'string') {
        console.error('Invalid transaction ID:', transactionId, 'Type:', typeof transactionId);
        throw new Error('Invalid transaction ID. Please try the transaction again.');
      }
      
      if (!signedTxBlob || typeof signedTxBlob !== 'string') {
        console.error('Invalid signedTxBlob:', signedTxBlob, 'Type:', typeof signedTxBlob);
        throw new Error('Invalid signed transaction blob. The wallet response may be in an unexpected format. Please try signing again.');
      }
      
      // Ensure we're not accidentally sending the transaction ID as the blob
      if (signedTxBlob === transactionId) {
        console.error('ERROR: signedTxBlob is the same as transactionId! This should not happen.');
        console.error('Transaction ID:', transactionId);
        console.error('Signed TX Blob:', signedTxBlob);
        throw new Error('Invalid transaction blob: received transaction ID instead of signed blob. Please try signing again.');
      }
      
      // Validate blob format (should be a hex string, not a UUID)
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidPattern.test(signedTxBlob)) {
        console.error('ERROR: signedTxBlob appears to be a UUID:', signedTxBlob);
        console.error('This suggests the wallet response structure may be different than expected.');
        throw new Error(`Invalid transaction blob format: received UUID "${signedTxBlob}" instead of transaction blob. The wallet may have returned a request ID instead of the signed transaction. Please check the console for details and try signing again.`);
      }
      
      // Validate blob format: should be a hex string (alphanumeric)
      // XRPL transaction blobs are typically hex-encoded and much longer than UUIDs
      const hexPattern = /^[0-9a-f]+$/i;
      if (!hexPattern.test(signedTxBlob)) {
        console.warn('Warning: Transaction blob does not match expected hex pattern.');
        console.warn('Blob preview (first 100 chars):', signedTxBlob.substring(0, 100));
        console.warn('Blob length:', signedTxBlob.length);
        // Don't throw here - some blobs might have different encoding, let backend validate
      }
      
      // Transaction blobs are typically hex strings (even length, alphanumeric)
      // They should be longer than a UUID (typically 100+ characters)
      if (signedTxBlob.length < 50) {
        console.warn('Warning: signedTxBlob seems unusually short:', signedTxBlob.length, 'characters');
        console.warn('Expected length for XRPL transaction blobs is typically 100+ characters');
        // Don't throw here - let backend validate, but log the warning
      }
      
      // Additional validation: check if blob looks reasonable (not empty, not just whitespace)
      const trimmedBlob = signedTxBlob.trim();
      if (trimmedBlob.length === 0) {
        console.error('ERROR: Transaction blob is empty or only whitespace');
        throw new Error('Invalid transaction blob: received empty blob. Please try signing again.');
      }
      
      const submitUrl = getApiUrl('api/wallet/fund/submit');
      const requestBody = {
        transactionId: transactionId,
        signedTxBlob: signedTxBlob
      };
      
      console.log('Submitting signed transaction to:', submitUrl);
      console.log('Transaction ID:', transactionId);
      console.log('Signed TX Blob (first 100 chars):', signedTxBlob.substring(0, 100));
      console.log('Signed TX Blob length:', signedTxBlob.length);
      console.log('Request body (without blob):', { transactionId, signedTxBlobLength: signedTxBlob.length });
      
      const submitResponse = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Submit transaction response status:', submitResponse.status);
      
      const submitResult = await submitResponse.json().catch(() => ({}));
      console.log('Submit transaction response body:', submitResult);
      
      if (submitResponse.ok && submitResult.success) {
        toast.success('Wallet funded successfully!', { id: 'fund-wallet' });
        setShowFundWalletModal(false);
        setFundWalletForm({ amount: '', currency: 'XRP' });
        setTransactionData(null);
        setFundingStep('idle');
        setIsFundingWallet(false);
        await fetchDashboardSummary();
      } else {
        const errorMessage = submitResult.message || submitResult.error || 'Failed to submit transaction';
        console.error('Transaction submission failed:', {
          status: submitResponse.status,
          statusText: submitResponse.statusText,
          response: submitResult
        });
        toast.error(`${errorMessage}. Please try again.`, { id: 'fund-wallet' });
        setFundingStep('idle');
        setIsFundingWallet(false);
      }
    } catch (submitError) {
      console.error('Error submitting signed transaction:', submitError);
      console.error('Error details:', {
        name: submitError?.name,
        message: submitError?.message,
        stack: submitError?.stack
      });
      
      // Provide more specific error messages based on error type
      let errorMessage = 'An error occurred while submitting the transaction.';
      if (submitError?.message) {
        errorMessage = submitError.message;
      } else if (submitError?.name === 'TypeError' && submitError?.message?.includes('fetch')) {
        errorMessage = 'Network error: Could not connect to the server. Please check your internet connection and try again.';
      } else if (submitError?.name === 'SyntaxError') {
        errorMessage = 'Invalid response from server. Please try again.';
      }
      
      toast.error(`${errorMessage} Please try again.`, { id: 'fund-wallet' });
      setFundingStep('idle');
      setIsFundingWallet(false);
    }
  };

  const handleWithdrawWallet = async (e) => {
    e.preventDefault();
    console.log('handleWithdrawWallet submitted with form:', withdrawWalletForm);

    if (!withdrawWalletForm.amount || parseFloat(withdrawWalletForm.amount) <= 0) {
      console.warn('Invalid withdraw amount:', withdrawWalletForm.amount);
      toast.error('Please enter a valid amount');
      return;
    }

    if (!withdrawWalletForm.destinationAddress || withdrawWalletForm.destinationAddress.trim().length < 10) {
      console.warn('Invalid destination address:', withdrawWalletForm.destinationAddress);
      toast.error('Please enter a valid destination address');
      return;
    }

    setIsWithdrawingWallet(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found while withdrawing wallet');
        toast.error('Please login to withdraw from your wallet');
        setIsWithdrawingWallet(false);
        return;
      }

      const apiUrl = getApiUrl('api/wallet/withdraw');
      console.log('Calling withdraw wallet API:', apiUrl, {
        amount: withdrawWalletForm.amount,
        currency: withdrawWalletForm.currency,
        destinationAddress: withdrawWalletForm.destinationAddress,
      });

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

      console.log('Withdraw wallet API response status:', response.status);

      const result = await response.json().catch(() => ({}));
      console.log('Withdraw wallet API response body:', result);

      if (response.ok && result.success) {
        toast.success('Withdrawal request submitted successfully!');
        setShowWithdrawWalletModal(false);
        setWithdrawWalletForm({
          amount: '',
          currency: 'USD',
          destinationAddress: ''
        });
        // Refresh dashboard data
        await fetchDashboardSummary();
      } else {
        if (showUnderReviewModalIfApplicable(result?.message)) return;
        toast.error(result.message || 'Failed to withdraw from wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error withdrawing from wallet:', error);
      toast.error('An error occurred while processing your withdrawal. Please try again.');
    } finally {
      setIsWithdrawingWallet(false);
    }
  };

  const activeIllustration = useMemo(() => {
    if (currentStep === 1) {
      // For Business Suite Escrow Configuration, use card illustration
      if (accountType === 'Business Suite') return cardIllustration;
      return uploadIllustration;
    }
    if (currentStep === 2) {
      // For Business Suite Compliance, use compliance illustration
      if (accountType === 'Business Suite') return complianceIllustration;
      return chainsIllustration;
    }
    return mockIllustration;
  }, [currentStep, accountType]);

  const isKycCompleteForAccount =
    accountType === 'Business Suite' ? businessKycComplete : kycComplete;

  const steps = useMemo(() => {
    return accountType === 'Business Suite' ? businessSteps : personalSteps;
  }, [accountType]);

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  const handleInputChange = (field, value) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    setDocuments((prev) => ({ ...prev, [field]: file || null }));
  };

  const advanceStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmitAndNext = async (event) => {
    event.preventDefault();

    // Step 2 only: final submit sends all KYC (logo upload + main POST + document uploads)
    if (currentStep === 2) {
      if (accountType === 'Business Suite') {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please sign in to submit business KYC.');
          return;
        }
        let companyLogoUrl = businessForm.companyLogoUrl?.trim() || null;
        // Log everything that will be sent (for verification)
        const kycSendLog = {
          logo: businessForm.companyLogo
            ? { sent: true, name: businessForm.companyLogo.name, size: businessForm.companyLogo.size, type: businessForm.companyLogo.type }
            : { sent: false },
          mainBody: null, // set below before POST
          documents: {
            identity: complianceForm.identityVerificationDocument
              ? { sent: true, name: complianceForm.identityVerificationDocument.name, size: complianceForm.identityVerificationDocument.size, type: complianceForm.identityVerificationDocument.type }
              : { sent: false },
            address: complianceForm.addressVerificationDocument
              ? { sent: true, name: complianceForm.addressVerificationDocument.name, size: complianceForm.addressVerificationDocument.size, type: complianceForm.addressVerificationDocument.type }
              : { sent: false },
            enhancedDueDiligence: complianceForm.enhancedDueDiligenceDocument
              ? { sent: true, name: complianceForm.enhancedDueDiligenceDocument.name, size: complianceForm.enhancedDueDiligenceDocument.size, type: complianceForm.enhancedDueDiligenceDocument.type }
              : { sent: false },
          },
        };
        // Upload company logo first if user selected a file (final stage sends everything)
        if (businessForm.companyLogo) {
          setIsSubmittingBusinessKyc(true);
          try {
            const formData = new FormData();
            formData.append('logo', businessForm.companyLogo);
            const logoRes = await fetch(getApiUrl('api/business-suite/kyc/logo'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formData,
            });
            const logoResult = await logoRes.json().catch(() => ({}));
            if (logoRes.ok && logoResult?.success && (logoResult?.data?.companyLogoUrl || logoResult?.data?.url)) {
              const normalized = normalizeCompanyLogoUrl(logoResult.data);
              companyLogoUrl = normalized || logoResult.data.companyLogoUrl || logoResult.data.url || null;
            }
            if (!logoRes.ok || !logoResult?.success) {
              if (showUnderReviewModalIfApplicable(logoResult?.message)) {
                setIsSubmittingBusinessKyc(false);
                return;
              }
              toast.error(logoResult?.message || 'Failed to upload company logo. Please try again.');
              setIsSubmittingBusinessKyc(false);
              return;
            }
          } catch (err) {
            console.error('Logo upload error:', err);
            toast.error('Failed to upload company logo. Please try again.');
            setIsSubmittingBusinessKyc(false);
            return;
          }
        }
        // Upload KYC documents first and get URLs (same pattern as logo)
        let identityDocumentUrl = null;
        let addressDocumentUrl = null;
        let enhancedDueDiligenceDocumentUrl = null;
        const hasAnyDoc =
          complianceForm.identityVerificationDocument ||
          complianceForm.addressVerificationDocument ||
          complianceForm.enhancedDueDiligenceDocument;
        if (hasAnyDoc) setIsSubmittingBusinessKyc(true);
        if (complianceForm.identityVerificationDocument) {
          try {
            const fd = new FormData();
            fd.append('document', complianceForm.identityVerificationDocument);
            const r = await fetch(getApiUrl('api/business-suite/kyc/documents/identity'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
            const data = await r.json().catch(() => ({}));
            console.log('KYC document upload response (identity):', data);
            if (!r.ok || !data?.success) {
              toast.error(data?.message || 'Failed to upload identity document.');
              setIsSubmittingBusinessKyc(false);
              return;
            }
            identityDocumentUrl = data?.data?.identityVerificationDocumentUrl || data?.data?.companyLogoUrl || data?.data?.url || data?.data?.documentUrl || null;
            console.log('identityDocumentUrl:', identityDocumentUrl);
          } catch (err) {
            console.error('Identity document upload error:', err);
            toast.error('Failed to upload identity document.');
            setIsSubmittingBusinessKyc(false);
            return;
          }
        }
        if (complianceForm.addressVerificationDocument) {
          try {
            const fd = new FormData();
            fd.append('document', complianceForm.addressVerificationDocument);
            const r = await fetch(getApiUrl('api/business-suite/kyc/documents/address'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
            const data = await r.json().catch(() => ({}));
            console.log('KYC document upload response (address):', data);
            if (!r.ok || !data?.success) {
              toast.error(data?.message || 'Failed to upload address document.');
              setIsSubmittingBusinessKyc(false);
              return;
            }
            addressDocumentUrl = data?.data?.addressVerificationDocumentUrl || data?.data?.companyLogoUrl || data?.data?.url || data?.data?.documentUrl || null;
            console.log('addressDocumentUrl:', addressDocumentUrl);
          } catch (err) {
            console.error('Address document upload error:', err);
            toast.error('Failed to upload address document.');
            setIsSubmittingBusinessKyc(false);
            return;
          }
        }
        if (complianceForm.enhancedDueDiligenceDocument) {
          try {
            const fd = new FormData();
            fd.append('document', complianceForm.enhancedDueDiligenceDocument);
            const r = await fetch(getApiUrl('api/business-suite/kyc/documents/enhanced-due-diligence'), {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
            const data = await r.json().catch(() => ({}));
            console.log('KYC document upload response (enhanced-due-diligence):', data);
            if (!r.ok || !data?.success) {
              toast.error(data?.message || 'Failed to upload enhanced due diligence document.');
              setIsSubmittingBusinessKyc(false);
              return;
            }
            enhancedDueDiligenceDocumentUrl = data?.data?.enhancedDueDiligenceDocumentUrl || data?.data?.companyLogoUrl || data?.data?.url || data?.data?.documentUrl || null;
            console.log('enhancedDueDiligenceDocumentUrl:', enhancedDueDiligenceDocumentUrl);
          } catch (err) {
            console.error('Enhanced due diligence document upload error:', err);
            toast.error('Failed to upload enhanced due diligence document.');
            setIsSubmittingBusinessKyc(false);
            return;
          }
        }
        const payload = {
          companyName: businessForm.companyName?.trim() || null,
          businessDescription: businessForm.businessDescription?.trim() || null,
          companyLogoUrl: companyLogoUrl || null,
          identityVerificationDocumentUrl: identityDocumentUrl || null,
          addressVerificationDocumentUrl: addressDocumentUrl || null,
          enhancedDueDiligenceDocumentUrl: enhancedDueDiligenceDocumentUrl || null,
          identityVerificationRequired: Boolean(complianceForm.identityVerificationRequired),
          addressVerificationRequired: Boolean(complianceForm.addressVerificationRequired),
          enhancedDueDiligence: Boolean(complianceForm.enhancedDueDiligence),
          defaultEscrowFeeRate: escrowConfigForm.defaultEscrowFeeRate?.trim() || null,
          autoReleasePeriod: escrowConfigForm.autoReleasePeriod?.trim() || null,
          approvalWorkflow: escrowConfigForm.approvalWorkflow || null,
          arbitrationType: complianceForm.arbitrationType || null,
          transactionLimits: complianceForm.transactionLimits?.trim() || null,
        };
        kycSendLog.mainBody = payload;
        if (kycSendLog.documents.identity) kycSendLog.documents.identity.url = identityDocumentUrl;
        if (kycSendLog.documents.address) kycSendLog.documents.address.url = addressDocumentUrl;
        if (kycSendLog.documents.enhancedDueDiligence) kycSendLog.documents.enhancedDueDiligence.url = enhancedDueDiligenceDocumentUrl;
        console.log('KYC submit (Business Suite) – body sent to API:', kycSendLog);
        console.log('POST api/business-suite/kyc – exact request body (as sent):', JSON.stringify(payload, null, 2));
        if (!businessForm.companyLogo) setIsSubmittingBusinessKyc(true);
        try {
          const res = await fetch(getApiUrl('api/business-suite/kyc'), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          const result = await res.json().catch(() => ({}));
          console.log('Submit for verification (Business Suite KYC) – API response:', { ok: res.ok, status: res.status, statusText: res.statusText, body: result });
          if (res.ok && result?.success) {
            const statusRaw = String(result?.data?.status ?? result?.status ?? '').trim();
            const statusLower = statusRaw.replace(/_/g, ' ').toLowerCase();
            const verifiedStatuses = ['verified', 'approved', 'complete'];
            const isVerified = verifiedStatuses.includes(statusLower);
            if (isVerified) {
              setBusinessKycComplete(true);
              if (result?.data?.companyName) setBusinessCompanyName(result.data.companyName);
              const logoUrl = normalizeCompanyLogoUrl(result?.data);
              if (logoUrl) setBusinessCompanyLogoUrl(logoUrl);
              localStorage.setItem('businessKycComplete', 'true');
              toast.success(result?.message || 'Business KYC submitted successfully');
            } else {
              setBusinessKycComplete(false);
              localStorage.removeItem('businessKycComplete');
              setShowUnderReviewKycModal(true);
              toast.success(result?.message || 'Registration is under review. We will notify you once verified.');
            }
          } else {
            console.error('Business KYC submit response error:', { status: res.status, statusText: res.statusText, result });
            const msg = (result?.message || result?.error || '').toLowerCase();
            const statusStr = String(result?.data?.status ?? result?.status ?? '').replace(/_/g, ' ').trim().toLowerCase();
            const isUnderReview =
              msg.includes('under review') ||
              msg.includes('cannot update kyc') ||
              msg.includes('temporarily suspended') ||
              statusStr === 'in review';
            if (isUnderReview) {
              setShowUnderReviewKycModal(true);
            } else {
              toast.error(result?.message || 'Failed to submit business KYC. Please try again.');
            }
          }
        } catch (err) {
          console.error('Business KYC submit error:', err);
          toast.error('Failed to submit business KYC. Please try again.');
        } finally {
          setIsSubmittingBusinessKyc(false);
        }
        return;
      }
      setKycComplete(true);
      localStorage.setItem('kycComplete', 'true');
    } else {
      advanceStep();
    }
  };

  const stepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'upcoming';
  };

  const renderDashboardView = () => {
    console.log('renderDashboardView - dashboardData:', dashboardData);
    console.log('renderDashboardView - isLoadingDashboard:', isLoadingDashboard);
    
    return (
      <>
        {/* Mobile Dashboard */}
        <div className="mobile-dashboard">
          {/* Mobile Header */}
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
                <button
                  type="button"
                  className="account-chip-mobile"
                  onClick={() => {
                    if (accountType === 'Business Suite') {
                      setSwitchMessage('switching to personal');
                      setIsSwitchingAccountType(true);
                      setTimeout(() => {
                        setAccountType('Personal');
                        setIsSwitchingAccountType(false);
                        setSwitchMessage('');
                      }, 2000);
                    } else {
                      handleSwitchToBusinessSuite();
                    }
                  }}
                >
                  <div className="account-chip-text">
                    <span className="account-label">Account</span>
                    <span className="account-type">
                      {accountType === 'Business Suite' ? 'Business Suite' : 'Personal'}
                    </span>
                  </div>
                  <span className="account-chip-icon">
                    <ChevronRight size={14} />
                  </span>
                </button>
              </div>

              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">
                  {accountType === 'Business Suite' ? 'Business Suite' : 'General'}
                </p>
                <nav className="mobile-sidebar-nav">
                  {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
                    const Icon = item.icon;
                    const isDisabled = accountType === 'Business Suite' && !businessKycComplete;
                    const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                     (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                                     (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                     (item.label === 'Dispute' && location.pathname === '/dispute') ||
                                     (item.label === 'Savings' && location.pathname === '/savings') ||
                                     (item.label === 'Trusticard' && location.pathname === '/trusticard') ||
                                     (item.label === 'Payroll' && location.pathname === '/payroll') ||
                                     (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract');
                    const handleNavClick = () => {
                      if (isDisabled) return;
                      setIsMobileMenuOpen(false);
                      if (item.label === 'Dashboard') {
                        navigate('/dashboard');
                      } else if (item.label === 'My Escrow') {
                        navigate('/my-escrow');
                      } else if (item.label === 'Transactions') {
                        navigate('/transactions');
                      } else if (item.label === 'Dispute') {
                        navigate('/dispute');
                      } else if (item.label === 'Savings') {
                        navigate('/savings');
                      } else if (item.label === 'Trusticard') {
                        navigate('/trusticard');
                      } else if (item.label === 'Payroll') {
                        navigate('/payroll');
                      } else if (item.label === 'Supplier Contract') {
                        navigate('/supplier-contract');
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

              {accountType === 'Business Suite' && (
                <div className="mobile-sidebar-section">
                  <p className="mobile-sidebar-section-label">Developers Tool</p>
                  <nav className="mobile-sidebar-nav">
                    {developersNav.map((item) => {
                      const Icon = item.icon;
                      const isDisabled = !businessKycComplete;
                      const developerPath = item.label === 'Api Keys' ? '/api-keys' : item.label === 'Sand box enviroment' ? '/sandbox-environment' : item.label === 'Web hook' ? '/webhook' : null;
                      const handleDeveloperClick = () => {
                        if (isDisabled) return;
                        setIsMobileMenuOpen(false);
                        if (developerPath) navigate(developerPath);
                      };
                      return (
                        <button 
                          key={item.label} 
                          type="button" 
                          className={`mobile-sidebar-nav-item ${isDisabled ? 'disabled' : ''}`}
                          onClick={handleDeveloperClick}
                          disabled={isDisabled}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}

              <div className="mobile-sidebar-section">
                <p className="mobile-sidebar-section-label">Support</p>
                <nav className="mobile-sidebar-nav">
                  {supportNav.map((item) => {
                    const Icon = item.icon;
                    const isDisabled = accountType === 'Business Suite' && !businessKycComplete;
                    const handleSupportNavClick = () => {
                      if (isDisabled) return;
                      setIsMobileMenuOpen(false);
                      if (item.label === 'Settings') {
                        navigate('/settings');
                      } else if (item.label === 'Security') {
                        navigate('/security');
                      }
                    };
                    return (
                      <button 
                        key={item.label} 
                        type="button" 
                        className={`mobile-sidebar-nav-item ${isDisabled ? 'disabled' : ''}`}
                        onClick={handleSupportNavClick}
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
                <p className="mobile-sidebar-section-label">Wallet</p>
                <nav className="mobile-sidebar-nav">
                  <button
                    type="button"
                    className={`mobile-sidebar-nav-item ${accountType === 'Business Suite' && !businessKycComplete ? 'disabled' : ''}`}
                    onClick={() => {
                      if (accountType === 'Business Suite' && !businessKycComplete) return;
                      if (isLoadingWalletAddress) return;
                      setIsMobileMenuOpen(false);
                      if (hasWallet) {
                        setShowWalletModal(true);
                      } else {
                        handleCreateWallet();
                      }
                    }}
                    disabled={isLoadingWalletAddress || (accountType === 'Business Suite' && !businessKycComplete)}
                  >
                    <span>{isLoadingWalletAddress ? 'Loading...' : hasWallet ? 'View wallet' : 'Create wallet'}</span>
                  </button>
                </nav>
              </div>

              <div className="mobile-sidebar-bottom">
                <div className="mobile-sidebar-trustiscore">
                  <span className="mobile-sidebar-trustiscore-label">Trustiscore</span>
                  <span className="mobile-sidebar-trustiscore-badge">
                    {dashboardData?.trustiscore?.score !== undefined 
                      ? dashboardData.trustiscore.score 
                      : (isLoadingDashboard ? '...' : '97')}
                  </span>
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

          {/* Total Balance Card */}
          <div className="mobile-total-balance-card">
            <div className="mobile-balance-header">
              <div className="mobile-balance-title">
                <Wallet size={18} />
                <span>Total Balance</span>
              </div>
              <button type="button" onClick={() => setShowBalance(!showBalance)} className="mobile-eye-toggle">
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="mobile-balance-amount">
              {showBalance 
                ? (isLoadingDashboard 
                    ? <LoadingIndicator size="sm" />
                    : (() => {
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
                        const usdBalance = getBalanceValue(dashboardData, 'usd');
                        if (usdBalance !== null && usdBalance !== undefined) {
                          return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return '$0.00';
                      })())
                : '••••••'}
            </div>
            <div className="mobile-balance-xrp">
              ≈ {(() => {
                  const xrpBalance = getBalanceValue(dashboardData, 'xrp');
                  if (isLoadingDashboard) {
                    return <LoadingIndicator size="sm" />;
                  }
                  if (xrpBalance !== null && xrpBalance !== undefined) {
                    return Number(xrpBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  }
                  return '0.00';
                })()} XRP
            </div>
            <div className="mobile-balance-actions">
              <button 
                type="button" 
                className="mobile-fund-btn"
                onClick={() => setShowFundMethodModal(true)}
              >
                <Plus size={16} />
                Fund Wallet
              </button>
              <button 
                type="button" 
                className="mobile-withdraw-btn"
                onClick={() => setShowWithdrawWalletModal(true)}
              >
                <Plus size={16} />
                Withdraw
              </button>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="mobile-metrics-cards">
            <div className="mobile-metric-card">
              <div className="mobile-metric-header">
                <FileCheck size={16} />
                <span>Active Escrow</span>
              </div>
              <div className="mobile-metric-value">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </div>
              <div className="mobile-metric-subvalue">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </div>
            <button
              type="button"
              className="mobile-metric-btn"
              onClick={() => setShowCreateEscrowModal(true)}
            >
                <Plus size={14} />
                Create Escrow
              </button>
            </div>
            <div className="mobile-metric-card">
              <div className="mobile-metric-header">
                <ShieldCheck size={16} />
                <span>Trustiscore</span>
              </div>
              <div className="mobile-metric-value">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="mobile-metric-suffix">/100</span>
              </div>
              <div className="mobile-metric-subvalue">
                {dashboardData?.trustiscore?.level !== undefined 
                  ? dashboardData.trustiscore.level 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
              </div>
              <button type="button" className="mobile-metric-btn">
                View Level
              </button>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="mobile-portfolio-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Portfolio</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="mobile-section-dropdown" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMobilePortfolioDropdown(!showMobilePortfolioDropdown);
                      setShowMobilePortfolioYearDropdown(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'inherit'
                    }}
                  >
                    <span>{portfolioTimeframe.charAt(0).toUpperCase() + portfolioTimeframe.slice(1)}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showMobilePortfolioDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        minWidth: '120px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['daily', 'monthly', 'yearly'].map((timeframe) => (
                        <button
                          key={timeframe}
                          type="button"
                          onClick={() => {
                            setPortfolioTimeframe(timeframe);
                            setShowMobilePortfolioDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: portfolioTimeframe === timeframe ? '#f0f7ff' : 'white',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            color: portfolioTimeframe === timeframe ? '#2563eb' : 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            if (portfolioTimeframe !== timeframe) {
                              e.target.style.background = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (portfolioTimeframe !== timeframe) {
                              e.target.style.background = 'white';
                            }
                          }}
                        >
                          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mobile-section-dropdown" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMobilePortfolioYearDropdown(!showMobilePortfolioYearDropdown);
                      setShowMobilePortfolioDropdown(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>{portfolioYear}</span>
                    <ChevronDown size={14} />
                  </button>
                  {showMobilePortfolioYearDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        minWidth: '100px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setPortfolioYear(y);
                            setPortfolioTimeframe('monthly');
                            setShowMobilePortfolioYearDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: portfolioYear === y ? '#f0f7ff' : 'white',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            color: portfolioYear === y ? '#2563eb' : 'inherit'
                          }}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mobile-chart-container">
              <div className="mobile-chart-y-axis">
                {[50, 40, 30, 20, 10, 0].map((val) => (
                  <span key={val}>{val}k</span>
                ))}
              </div>
              <div className="mobile-bar-chart">
                {isLoadingPortfolio && (
                  <span className="mobile-rate-currency"><LoadingIndicator size="sm" /></span>
                )}

                {!isLoadingPortfolio && portfolioChartPoints && portfolioChartPoints.length > 0 && (() => {
                  const maxValue =
                    portfolioChartPoints.reduce(
                      (max, p) => Math.max(max, Math.abs(Number(p.value ?? 0))),
                      0
                    ) || 1;

                  return portfolioChartPoints.map((point, index) => {
                    const value = Number(point.value ?? 0);
                    const hasBar = value !== 0;
                    const height = hasBar ? Math.max(5, (Math.abs(value) / maxValue) * 100) : 0;
                    const label = point.label ?? '';
                    const isLastBar = index === portfolioChartPoints.length - 1;
                    const isNegative = value < 0;

                    return (
                      <div key={`${label}-${index}`} className="mobile-bar-wrapper">
                        <div className="mobile-bar-inner">
                          {hasBar && (
                            <div
                              className={`mobile-bar ${isLastBar && !isNegative ? 'mobile-bar-last' : ''} ${isNegative ? 'mobile-bar-negative' : ''}`}
                              style={{ height: `${height}%` }}
                            />
                          )}
                        </div>
                        <span className="mobile-bar-label">{label}</span>
                      </div>
                    );
                  });
                })()}

                {!isLoadingPortfolio && (!portfolioChartPoints || portfolioChartPoints.length === 0) && (
                  <span className="mobile-rate-currency">No portfolio data</span>
                )}
              </div>
            </div>
          </div>

          {/* Live Exchange Rate Section */}
          <div className="mobile-exchange-rate-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Live Exchange Rate</h3>
            </div>
            <div className="mobile-rate-list">
              {isLoadingRates && (
                <div className="mobile-rate-item">
                  <div className="mobile-rate-info">
                    <span className="mobile-rate-currency"><LoadingIndicator size="sm" /></span>
                  </div>
                </div>
              )}

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
                  <div className="mobile-rate-item" key={`${code}-${index}`}>
                    <div className="mobile-rate-flag">
                      <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt={code} />
                    </div>
                    <div className="mobile-rate-info">
                      <span className="mobile-rate-currency">{code}</span>
                    </div>
                    <div className="mobile-rate-value-change">
                      <span className="mobile-rate-value">
                        {symbol}{Number(rate.rate ?? rate.value ?? 0).toFixed(4)}
                      </span>
                      <div className={`mobile-rate-change ${isPositive ? 'positive' : isNegative ? 'negative' : 'neutral'}`}>
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
                <div className="mobile-rate-item">
                  <div className="mobile-rate-info">
                    <span className="mobile-rate-currency">No exchange rates available</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Balance Section */}
          <div className="mobile-wallet-balance-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Wallet Balance</h3>
            </div>
            <div className="mobile-wallet-list">
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="XRP" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">XRP</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null && walletBalances.xrp > 0
                                ? `${Number(walletBalances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP`
                                : '0.00 XRP'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                  <span className="mobile-wallet-amount">
                    {showBalance 
                      ? (() => {
                          if (walletBalances?.xrp && exchangeRates) {
                            const xrpRate = exchangeRates.find(r => (r.currency || r.code || '').toUpperCase() === 'USD');
                            if (xrpRate && xrpRate.rate) {
                              const usdValue = Number(walletBalances.xrp) * Number(xrpRate.rate);
                              return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                          }
                          if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                            return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00';
                        })()
                      : '••••••'}
                  </span>
                  <div className="mobile-wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+2.4%</span>
                  </div>
                </div>
              </div>
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon usdt-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                      alt="USDT" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">Tether USD</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null && walletBalances.usdt > 0
                                ? `${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                                : '0.00 USDT'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                    <span className="mobile-wallet-amount">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null && walletBalances.usdt > 0
                                ? `$${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '$0.00'))
                        : '••••••'}
                    </span>
                  <div className="mobile-wallet-change neutral">
                    <span>0.0%</span>
                  </div>
                </div>
              </div>
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon usdc-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                      alt="USDC" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">USD Coin</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null && walletBalances.usdc > 0
                                ? `${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                                : '0.00 USDC'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                  <span className="mobile-wallet-amount">
                    {showBalance 
                      ? (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                          ? `$${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$8,750.00'))
                      : '••••••'}
                  </span>
                  <div className="mobile-wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+0.1%</span>
                  </div>
                </div>
              </div>
              <div className="mobile-wallet-item">
                <div className="mobile-wallet-icon-group">
                  <div className="mobile-wallet-icon">
                    <img 
                      src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                      alt="Ripple USD" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  </div>
                  <div className="mobile-wallet-icon-info">
                    <span className="mobile-wallet-name">Ripple USD</span>
                    <span className="mobile-wallet-crypto">
                      {showBalance 
                        ? (isLoadingWalletBalances 
                            ? <LoadingIndicator size="sm" />
                            : (walletBalances?.rippleUsd !== undefined && walletBalances?.rippleUsd !== null && walletBalances.rippleUsd > 0
                                ? `${Number(walletBalances.rippleUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRPUSD`
                                : '0.00 XRPUSD'))
                        : '••••••'}
                    </span>
                  </div>
                </div>
                <div className="mobile-wallet-value-change">
                  <span className="mobile-wallet-amount">
                    {showBalance 
                      ? (isLoadingWalletBalances 
                          ? <LoadingIndicator size="sm" />
                          : (walletBalances?.rippleUsd !== undefined && walletBalances?.rippleUsd !== null && walletBalances.rippleUsd > 0
                              ? `$${Number(walletBalances.rippleUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : '$0.00'))
                      : '••••••'}
                  </span>
                  <div className="mobile-wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+1.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Escrow Section */}
          <div className="mobile-escrow-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Live Escrow</h3>
            </div>
            <div className="mobile-escrow-list">
              {isLoadingEscrows ? (
                <div className="mobile-escrow-item">
                  <div className="mobile-escrow-loading"><LoadingIndicator size="md" /></div>
                </div>
              ) : escrows && escrows.length > 0 ? (
                escrows.slice(0, 3).map((escrow, index) => {
                  const escrowId = escrow.id || escrow.escrowId || escrow._id || `#ESC-2024-${String(index + 1).padStart(3, '0')}`;
                  const payerName = escrow.payerName || escrow.payer?.name || escrow.senderName || 'John Depp';
                  const payerAvatar = escrow.payerAvatar || escrow.payer?.avatar || null;
                  const payerInitials = payerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const counterpartyName = escrow.counterpartyName || escrow.counterparty?.name || escrow.receiverName || 'Sarah Wilson';
                  const counterpartyAvatar = escrow.counterpartyAvatar || escrow.counterparty?.avatar || null;
                  const counterpartyInitials = counterpartyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  
                  // Get amount - try XRP first, then USD
                  const xrpAmount = escrow.amount?.xrp || escrow.amount?.XRP || escrow.xrpAmount || null;
                  const usdAmount = escrow.amount?.usd || escrow.amount?.USD || escrow.usdAmount || escrow.totalAmount || null;
                  
                  // Calculate USD equivalent if we have XRP amount and exchange rate
                  let displayXrp = xrpAmount;
                  let displayUsd = usdAmount;
                  if (xrpAmount && exchangeRates && exchangeRates.length > 0) {
                    const xrpRate = exchangeRates.find(r => (r.currency || r.code || '').toUpperCase() === 'XRP');
                    if (xrpRate && xrpRate.rate && !displayUsd) {
                      displayUsd = Number(xrpAmount) * Number(xrpRate.rate);
                    }
                  }
                  
                  const status = escrow.status || escrow.escrowStatus || 'pending';
                  const statusText = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
                  // Normalize status for CSS class (handle spaces, underscores, etc.)
                  const statusClass = status.toLowerCase().replace(/[\s_]/g, '_');
                  
                  return (
                    <div key={escrowId || index} className="mobile-escrow-item">
                      <div className="mobile-escrow-id">{escrowId}</div>
                      <div className="mobile-escrow-parties">
                        <div className="mobile-escrow-party">
                          {payerAvatar ? (
                            <img src={payerAvatar} alt={payerName} className="mobile-escrow-avatar" />
                          ) : (
                            <div className="mobile-escrow-avatar-initials">{payerInitials}</div>
                          )}
                          <span className="mobile-escrow-party-name">{payerName}</span>
                        </div>
                        <ArrowRight size={16} className="mobile-escrow-arrow" />
                        <div className="mobile-escrow-party">
                          {counterpartyAvatar ? (
                            <img src={counterpartyAvatar} alt={counterpartyName} className="mobile-escrow-avatar" />
                          ) : (
                            <div className="mobile-escrow-avatar-initials">{counterpartyInitials}</div>
                          )}
                          <span className="mobile-escrow-party-name">{counterpartyName}</span>
                        </div>
                      </div>
                      <div className="mobile-escrow-amounts">
                        <div className="mobile-escrow-xrp">
                          {displayXrp ? `${Number(displayXrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRP` : '0.00 XRP'}
                        </div>
                        {displayUsd && (
                          <div className="mobile-escrow-usd">
                            ≈ ${Number(displayUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </div>
                      <button className={`mobile-escrow-status ${statusClass}`}>
                        {statusText}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="mobile-escrow-item">
                  <div className="mobile-escrow-empty">No active escrows</div>
                </div>
              )}
            </div>
          </div>

          {/* Trusticard Section */}
          <div className="mobile-trusticard-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h3 className="mobile-section-title">Trusticard</h3>
            </div>
            <div className="mobile-trusticard">
              <div className="mobile-card-header-info">
                <div className="mobile-card-logo">
                  <img src={logoWhite} alt="TrustiChain" className="mobile-card-logo-img" />
                  <span>TrustiChain</span>
                </div>
                <div className="mobile-card-type">Premium Debit</div>
              </div>
              <div className="mobile-card-number">7834 **** **** 6453</div>
              <div className="mobile-card-holder">
                <span className="mobile-card-holder-label">Card holder</span>
                <span className="mobile-card-holder-name">
                  {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Dashboard */}
        <div className="dashboard-content">
        {/* Breadcrumb */}
        <div className="card-breadcrumb">
          <span className="breadcrumb-root">General</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-current">Dashboard</span>
        </div>
        {/* Summary Cards */}
        <div className="dashboard-summary-cards">
          <div className="summary-card total-balance-card">
            <div className="summary-card-header">
              <h3>Total Balance</h3>
              <button type="button" onClick={() => setShowBalance(!showBalance)} className="eye-toggle">
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {showBalance 
                  ? (isLoadingDashboard 
                      ? <LoadingIndicator size="sm" />
                      : (() => {
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
                        })())
                  : '••••••'}
              </div>
              <div className="summary-card-subvalue">
                ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                    ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '0.000000')} XRP
              </div>
            </div>
            <div className="summary-card-actions">
              <button 
                type="button" 
                className="summary-card-btn primary"
                onClick={() => setShowFundMethodModal(true)}
              >
                + Fund Wallet
              </button>
              <button 
                type="button" 
                className="summary-card-btn secondary"
                onClick={() => setShowWithdrawWalletModal(true)}
              >
                + Withdraw
              </button>
            </div>
          </div>

          <div className="summary-card active-escrow-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Active Escrow</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </div>
              <div className="summary-card-subvalue">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </div>
            </div>
            <button
              type="button"
              className="summary-card-btn primary"
              onClick={() => setShowCreateEscrowModal(true)}
            >
              + Create Escrow
            </button>
          </div>

          <div className="summary-card trustiscore-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Trustiscore</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="summary-card-value-suffix">/100</span>
              </div>
              <div className="summary-card-subvalue">
                {dashboardData?.trustiscore?.level !== undefined 
                  ? dashboardData.trustiscore.level 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
              </div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Level</button>
          </div>

          <div className="summary-card total-escrowed-card">
            <div className="summary-card-header">
              <CreditCard size={16} />
              <h3>Total Escrowed</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                ${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '0.00')}
              </div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Escrow</button>
          </div>
        </div>

        {/* Middle Section */}
        <div className="dashboard-middle">
          <div className="dashboard-left-column">
          {/* Portfolio Chart */}
          <div className="dashboard-chart-card">
            <div className="chart-header">
              <h3>Portfolio</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="chart-dropdown" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPortfolioDropdown(!showPortfolioDropdown);
                      setShowPortfolioYearDropdown(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'inherit'
                    }}
                  >
                    <span>{portfolioTimeframe.charAt(0).toUpperCase() + portfolioTimeframe.slice(1)}</span>
                    <ChevronDown size={16} />
                  </button>
                  {showPortfolioDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        minWidth: '120px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['daily', 'monthly', 'yearly'].map((timeframe) => (
                        <button
                          key={timeframe}
                          type="button"
                          onClick={() => {
                            setPortfolioTimeframe(timeframe);
                            setShowPortfolioDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: portfolioTimeframe === timeframe ? '#f0f7ff' : 'white',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            color: portfolioTimeframe === timeframe ? '#2563eb' : 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            if (portfolioTimeframe !== timeframe) {
                              e.target.style.background = '#f9fafb';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (portfolioTimeframe !== timeframe) {
                              e.target.style.background = 'white';
                            }
                          }}
                        >
                          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="chart-dropdown chart-year-dropdown" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPortfolioYearDropdown(!showPortfolioYearDropdown);
                      setShowPortfolioDropdown(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'inherit',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span>{portfolioYear}</span>
                    <ChevronDown size={16} />
                  </button>
                  {showPortfolioYearDropdown && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        minWidth: '100px',
                        maxHeight: '240px',
                        overflowY: 'auto'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => {
                            setPortfolioYear(y);
                            setPortfolioTimeframe('monthly');
                            setShowPortfolioYearDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: portfolioYear === y ? '#f0f7ff' : 'white',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            color: portfolioYear === y ? '#2563eb' : 'inherit'
                          }}
                          onMouseEnter={(e) => {
                            if (portfolioYear !== y) e.target.style.background = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            if (portfolioYear !== y) e.target.style.background = 'white';
                          }}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-y-axis">
                {[50, 40, 30, 20, 10, 0].map((val) => (
                  <span key={val}>{val}k</span>
                ))}
              </div>
              <div className="bar-chart">
                {isLoadingPortfolio && (
                  <span className="rate-currency"><LoadingIndicator size="md" /></span>
                )}

                {!isLoadingPortfolio && portfolioChartPoints && portfolioChartPoints.length > 0 && (() => {
                  const maxValue =
                    portfolioChartPoints.reduce(
                      (max, p) => Math.max(max, Math.abs(Number(p.value ?? 0))),
                      0
                    ) || 1;

                  return portfolioChartPoints.map((point, index) => {
                    const value = Number(point.value ?? 0);
                    const hasBar = value !== 0;
                    const height = hasBar ? Math.max(5, (Math.abs(value) / maxValue) * 100) : 0;
                    const label = point.label ?? '';
                    const isLast = index === portfolioChartPoints.length - 1;
                    const isNegative = value < 0;

                    return (
                      <div key={`${label}-${index}`} className="bar-wrapper">
                        {hasBar && (
                          <div
                            className={`bar ${isLast && !isNegative ? 'bar-purple' : ''} ${isNegative ? 'bar-negative' : ''}`}
                            style={{ height: `${height}%` }}
                          />
                        )}
                        <span className="bar-label">{label}</span>
                      </div>
                    );
                  });
                })()}

                {!isLoadingPortfolio && (!portfolioChartPoints || portfolioChartPoints.length === 0) && (
                  <span className="rate-currency">No portfolio data</span>
                )}
              </div>
            </div>
          </div>

            {/* Live Escrow Table */}
            <div className="escrow-table-card">
              <div className="table-header">
                <h3>Live Escrow</h3>
                <a href="#" className="view-link">View Escrow</a>
              </div>
              <div className="table-wrapper">
                <table className="escrow-table">
                  <thead>
                    <tr>
                      <th># Escrow ID <ChevronDown size={14} /></th>
                      <th>Parties <ChevronDown size={14} /></th>
                      <th>Amount <ChevronDown size={14} /></th>
                      <th>Status <ChevronDown size={14} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingEscrows && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                          <LoadingIndicator size="md" />
                        </td>
                      </tr>
                    )}
                    {!isLoadingEscrows && escrows.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                          No escrows found
                        </td>
                      </tr>
                    )}
                    {!isLoadingEscrows && escrows.length > 0 && escrows.map((escrow) => {
                      // Format escrow ID (use short version or format)
                      const escrowId = escrow.id ? `#${escrow.id.substring(0, 8).toUpperCase()}` : '#ESC-N/A';
                      
                      // Get counterparty name
                      const counterpartyName = escrow.counterpartyName || 'Unknown';
                      
                      // Generate initials for avatar
                      const getInitials = (name) => {
                        if (!name) return '??';
                        const parts = name.trim().split(/\s+/);
                        if (parts.length >= 2) {
                          return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
                        }
                        return name.substring(0, 2).toUpperCase();
                      };
                      
                      // Format amounts
                      const xrpAmount = escrow.amount?.xrp 
                        ? Number(escrow.amount.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                        : '0.00';
                      const usdAmount = escrow.amount?.usd 
                        ? Number(escrow.amount.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00';
                      
                      // Map status to badge class and label
                      const getStatusBadge = (status) => {
                        const statusLower = (status || '').toLowerCase();
                        if (statusLower === 'active') {
                          return { class: 'pending', label: 'Active' };
                        } else if (statusLower === 'pending' || statusLower === 'pending release') {
                          return { class: 'pending', label: 'Pending release' };
                        } else if (statusLower === 'review' || statusLower === 'under review') {
                          return { class: 'review', label: 'Under Review' };
                        } else if (statusLower === 'completed' || statusLower === 'complete') {
                          return { class: 'completed', label: 'Completed' };
                        } else {
                          return { class: 'pending', label: status || 'Unknown' };
                        }
                      };
                      
                      const statusBadge = getStatusBadge(escrow.status);
                      
                      return (
                        <tr key={escrow.id || escrow.xrplEscrowId}>
                          <td>{escrowId}</td>
                          <td>
                            <div className="party-info">
                              <div className="party-main">
                                <div className="party-avatar">{getInitials(counterpartyName)}</div>
                                <span>{counterpartyName}</span>
                              </div>
                              <div className="party-subtitle">
                                <ArrowRight size={14} />
                                <span>{userFullName || 'You'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{xrpAmount} XRP</div>
                            <div className="amount-usd">≈ ${usdAmount}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${statusBadge.class}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Exchange Rate & Wallet Balance */}
          <div className="dashboard-right-cards">
            <div className="exchange-rate-card">
              <h3>Live Exchange Rate</h3>
              <div className="rate-list">
                {isLoadingRates && (
                  <div className="rate-item">
                    <div className="rate-info">
                      <span className="rate-currency"><LoadingIndicator size="sm" /></span>
                    </div>
                  </div>
                )}

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

            <div className="wallet-balance-card">
              <h3>Wallet Balance</h3>
              <div className="wallet-list">
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                        alt="XRP" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">XRP</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.xrp !== undefined && walletBalances?.xrp !== null
                              ? `${Number(walletBalances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 XRP'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (() => {
                            // Calculate USD value for XRP using exchange rate if available
                            if (walletBalances?.xrp && exchangeRates) {
                              const xrpRate = exchangeRates.find(r => (r.currency || r.code || '').toUpperCase() === 'USD');
                              if (xrpRate && xrpRate.rate) {
                                const usdValue = Number(walletBalances.xrp) * Number(xrpRate.rate);
                                return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                              }
                            }
                            // Fallback to dashboard total USD if available
                            if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                              return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            return isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00';
                          })()
                        : '••••••'}
                    </span>
                  <div className="wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+2.4%</span>
                    </div>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon usdt-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/325/small/Tether-logo.png" 
                        alt="USDT" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">Tether USD</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                              ? `${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 USDT'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (walletBalances?.usdt !== undefined && walletBalances?.usdt !== null
                            ? `$${Number(walletBalances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00'))
                        : '••••••'}
                    </span>
                  <div className="wallet-change neutral">
                    <span>0.0%</span>
                    </div>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon usdc-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389" 
                        alt="USDC" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">USD Coin</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                              ? `${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 USDC'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (walletBalances?.usdc !== undefined && walletBalances?.usdc !== null
                            ? `$${Number(walletBalances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00'))
                        : '••••••'}
                    </span>
                  <div className="wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+0.1%</span>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                        alt="Ripple USD" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <div className="wallet-icon-info">
                      <span className="wallet-name">Ripple USD</span>
                      <span className="wallet-crypto">
                        {showBalance 
                          ? (walletBalances?.rippleUsd !== undefined && walletBalances?.rippleUsd !== null
                              ? `${Number(walletBalances.rippleUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XRPUSD`
                              : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '0.00 XRPUSD'))
                          : '••••••'}
                      </span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">
                      {showBalance 
                        ? (walletBalances?.rippleUsd !== undefined && walletBalances?.rippleUsd !== null
                            ? `$${Number(walletBalances.rippleUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : (isLoadingWalletBalances ? <LoadingIndicator size="sm" /> : '$0.00'))
                        : '••••••'}
                    </span>
                    <div className="wallet-change positive">
                      <TrendingUp size={14} />
                      <span>+1.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusticard */}
          <div className="trusticard-card">
            <h3>Trusticard</h3>
            <div className="virtual-card">
              <div className="card-header-info">
                <div className="card-logo">
                  <img src={logoWhite} alt="TrustiChain" className="card-logo-img" />
                  <span>TrustiChain</span>
                </div>
                <div className="card-type">Premium Debit</div>
              </div>
                <div className="card-number">7834 **** **** 6453</div>
                <div className="card-holder">
                  <span className="card-holder-label">Card holder</span>
                  <span>Sarah Chen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="dashboard-bottom">
        </div>
      </div>
      </>
    );
  };

  const handleBusinessInputChange = (field, value) => {
    setBusinessForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBusinessLogoChange = (file) => {
    setBusinessForm((prev) => ({ ...prev, companyLogo: file || null }));
  };

  const handleEscrowConfigChange = (field, value) => {
    setEscrowConfigForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplianceChange = (field, value) => {
    setComplianceForm((prev) => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    // Brand Customization form for Business Suite
    if (currentStep === 0 && accountType === 'Business Suite') {
      return (
        <>
          <form className="kyc-form brand-customization-form" onSubmit={handleSubmitAndNext}>
            <label>
              <span>Company Name</span>
              <input
                type="text"
                placeholder="Enter your company name"
                value={businessForm.companyName}
                onChange={(e) => handleBusinessInputChange('companyName', e.target.value)}
              />
            </label>
            <label>
              <span>Business Description</span>
              <input
                type="text"
                placeholder="Enter your company description"
                value={businessForm.businessDescription}
                onChange={(e) => handleBusinessInputChange('businessDescription', e.target.value)}
              />
            </label>
            <label>
              <span>Company Logo</span>
              <label className="company-logo-upload" htmlFor="logo-upload">
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/svg+xml,image/png,image/jpeg"
                  onChange={(e) => handleBusinessLogoChange(e.target.files[0])}
                />
                <div className="logo-upload-icon">
                  <Upload size={32} />
                </div>
                <div className="logo-upload-text">
                  <p>Click to upload or drag and drop</p>
                  <span>SVG, PNG, JPG up to 2MB</span>
                </div>
                {businessForm.companyLogo && (
                  <div className="logo-upload-preview">
                    {businessForm.companyLogo.name}
                  </div>
                )}
              </label>
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-btn">
                <span className="btn-arrow">
                  <ArrowRight size={16} />
                </span>
                <span className="btn-text">Submit and Next</span>
              </button>
            </div>
          </form>
        </>
      );
    }

    if (currentStep === 1) {
      // Escrow Configuration form for Business Suite
      if (accountType === 'Business Suite') {
        return (
          <>
            <form className="kyc-form escrow-config-form" onSubmit={handleSubmitAndNext}>
              <label>
                <span>Default Escrow Fee Rate</span>
                <input
                  type="text"
                  placeholder="Enter escrow fee rate"
                  value={escrowConfigForm.defaultEscrowFeeRate}
                  onChange={(e) => handleEscrowConfigChange('defaultEscrowFeeRate', e.target.value)}
                />
              </label>
              <label>
                <span>Auto-Release Period</span>
                <div className="select-field">
                  <select
                    value={escrowConfigForm.autoReleasePeriod}
                    onChange={(e) => handleEscrowConfigChange('autoReleasePeriod', e.target.value)}
                  >
                    <option value="">Select auto-release period</option>
                    <option value="24 hours">24 hours</option>
                    <option value="3 days">3 days</option>
                    <option value="7 days">7 days</option>
                    <option value="14 days">14 days</option>
                    <option value="30 days">30 days</option>
                    <option value="60 days">60 days</option>
                    <option value="90 days">90 days</option>
                  </select>
                </div>
              </label>
              <label>
                <span>Approval Workflow</span>
                <div className="select-field">
                  <select
                    value={escrowConfigForm.approvalWorkflow}
                    onChange={(e) => handleEscrowConfigChange('approvalWorkflow', e.target.value)}
                  >
                    <option value="">Select approval workflow</option>
                    <option value="single">Single Approval</option>
                    <option value="dual">Dual Approval</option>
                    <option value="multi">Multi-Party Approval</option>
                  </select>
                </div>
              </label>
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  <span className="btn-arrow">
                    <ArrowRight size={16} />
                  </span>
                  <span className="btn-text">Submit and Next</span>
                </button>
              </div>
            </form>
          </>
        );
      }

      // Document upload for Personal accounts
      return (
        <>
          <div className="upload-grid">
            <div className="upload-sections">
              <div className="upload-card">
                <h3>NID/Passport Front Side</h3>
                <label className="upload-drop" htmlFor="front-upload">
                  <input
                    id="front-upload"
                    type="file"
                    onChange={(e) => handleFileChange('front', e.target.files[0])}
                  />
                  <p>Choose a file or drag & drop it here</p>
                  <button type="button">Browse file</button>
                  <span>{documents.front ? documents.front.name : 'No file chosen'}</span>
                </label>
              </div>
              <div className="upload-card">
                <h3>NID/Passport Back Side</h3>
                <label className="upload-drop" htmlFor="back-upload">
                  <input
                    id="back-upload"
                    type="file"
                    onChange={(e) => handleFileChange('back', e.target.files[0])}
                  />
                  <p>Choose a file or drag & drop it here</p>
                  <button type="button">Browse file</button>
                  <span>{documents.back ? documents.back.name : 'No file chosen'}</span>
                </label>
              </div>
              <div className="selfie-header">
                <span className="selfie-title">Take a selfie</span>
                <span className="selfie-subtitle">Hold your ID next to your face</span>
              </div>
              <div className="upload-card selfie-card">
                <label className="selfie-action" htmlFor="selfie-upload">
                  <input
                    id="selfie-upload"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange('selfie', e.target.files[0])}
                  />
                  <span className="selfie-label">Take a selfie</span>
                  <button type="button">Take Photo</button>
                  <span className="selfie-file">
                    {documents.selfie ? documents.selfie.name : 'No selfie uploaded'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="upload-actions">
            <button type="button" className="primary-btn" onClick={advanceStep}>
              <span className="btn-arrow">
                <ArrowRight size={16} />
              </span>
              <span>Submit and Next</span>
            </button>
          </div>
        </>
      );
    }

    if (currentStep === 2) {
      // Compliance form for Business Suite
      if (accountType === 'Business Suite') {
        return (
          <>
            <form className="kyc-form compliance-form" onSubmit={handleSubmitAndNext}>
              <label>
                <span>Arbitration Type</span>
                <div className="select-field">
                  <select
                    value={complianceForm.arbitrationType}
                    onChange={(e) => handleComplianceChange('arbitrationType', e.target.value)}
                  >
                    <option value="">Select arbitration type</option>
                    <option value="binding">Binding Arbitration</option>
                    <option value="non-binding">Non-Binding Arbitration</option>
                    <option value="mediation">Mediation</option>
                  </select>
                </div>
              </label>
              <label>
                <span>Transaction Limits</span>
                <div className="select-field">
                  <select
                    value={complianceForm.transactionLimits}
                    onChange={(e) => handleComplianceChange('transactionLimits', e.target.value)}
                  >
                    <option value="">Select transaction limit</option>
                    <option value="Max 10k USD">Max 10k USD</option>
                    <option value="Max 50k USD">Max 50k USD</option>
                    <option value="Max 100k USD">Max 100k USD</option>
                    <option value="Max 250k USD">Max 250k USD</option>
                    <option value="Max 500k USD">Max 500k USD</option>
                    <option value="Max 1M USD">Max 1M USD</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>
              </label>
              <div className="kyc-requirements-section">
                <h3 className="kyc-requirements-title">KYC Requirements</h3>
                <p className="kyc-requirements-subtitle">Enable each requirement and attach supporting documents (PDF or image).</p>
                <div className="kyc-requirement-cards">
                  <div className="kyc-requirement-card">
                    <div className="kyc-requirement-header">
                      <span className="kyc-requirement-name">Identity Verification</span>
                      <button
                        type="button"
                        className={`kyc-toggle ${complianceForm.identityVerificationRequired ? 'active' : ''}`}
                        onClick={() => handleComplianceChange('identityVerificationRequired', !complianceForm.identityVerificationRequired)}
                        aria-label="Toggle identity verification"
                      >
                        <div className={`kyc-toggle-slider ${complianceForm.identityVerificationRequired ? 'active' : ''}`} />
                      </button>
                    </div>
                    <label className="kyc-doc-picker-btn">
                      <input type="file" accept=".pdf,image/*" onChange={(e) => handleComplianceChange('identityVerificationDocument', e.target.files?.[0] || null)} />
                      <span className="kyc-doc-picker-btn-text">Browse</span>
                    </label>
                    {complianceForm.identityVerificationDocument && (
                      <span className="kyc-doc-filename">{complianceForm.identityVerificationDocument.name}</span>
                    )}
                  </div>
                  <div className="kyc-requirement-card">
                    <div className="kyc-requirement-header">
                      <span className="kyc-requirement-name">Address Verification</span>
                      <button
                        type="button"
                        className={`kyc-toggle ${complianceForm.addressVerificationRequired ? 'active' : ''}`}
                        onClick={() => handleComplianceChange('addressVerificationRequired', !complianceForm.addressVerificationRequired)}
                        aria-label="Toggle address verification"
                      >
                        <div className={`kyc-toggle-slider ${complianceForm.addressVerificationRequired ? 'active' : ''}`} />
                      </button>
                    </div>
                    <label className="kyc-doc-picker-btn">
                      <input type="file" accept=".pdf,image/*" onChange={(e) => handleComplianceChange('addressVerificationDocument', e.target.files?.[0] || null)} />
                      <span className="kyc-doc-picker-btn-text">Browse</span>
                    </label>
                    {complianceForm.addressVerificationDocument && (
                      <span className="kyc-doc-filename">{complianceForm.addressVerificationDocument.name}</span>
                    )}
                  </div>
                  <div className="kyc-requirement-card">
                    <div className="kyc-requirement-header">
                      <span className="kyc-requirement-name">Enhanced Due Diligence</span>
                      <button
                        type="button"
                        className={`kyc-toggle ${complianceForm.enhancedDueDiligence ? 'active' : ''}`}
                        onClick={() => handleComplianceChange('enhancedDueDiligence', !complianceForm.enhancedDueDiligence)}
                        aria-label="Toggle enhanced due diligence"
                      >
                        <div className={`kyc-toggle-slider ${complianceForm.enhancedDueDiligence ? 'active' : ''}`} />
                      </button>
                    </div>
                    <label className="kyc-doc-picker-btn">
                      <input type="file" accept=".pdf,image/*" onChange={(e) => handleComplianceChange('enhancedDueDiligenceDocument', e.target.files?.[0] || null)} />
                      <span className="kyc-doc-picker-btn-text">Browse</span>
                    </label>
                    {complianceForm.enhancedDueDiligenceDocument && (
                      <span className="kyc-doc-filename">{complianceForm.enhancedDueDiligenceDocument.name}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={isSubmittingBusinessKyc}>
                  <span className="btn-arrow">
                    <ArrowRight size={16} />
                  </span>
                  <span className="btn-text">{isSubmittingBusinessKyc ? 'Submitting…' : 'Submit for verification'}</span>
                </button>
              </div>
            </form>
          </>
        );
      }

      // Wallet form for Personal accounts
      return (
        <>
          <form className="wallet-form" onSubmit={handleSubmitAndNext}>
            <div className="wallet-address-section">
              <h3 className="wallet-address-label">XRP Wallet Address</h3>
              <div className="wallet-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="wallet-address-input"
                />
                <button type="button" className="wallet-qr-btn" aria-label="Scan QR code">
                  <QrCode size={20} />
                </button>
              </div>
            </div>

            <div className="wallet-connections">
              <div className="wallet-connection-item">
                <div className="wallet-connection-header">
                  <span className="wallet-connection-name">XUMM</span>
                </div>
                <button type="button" className="wallet-connect-btn">
                  Connect to XUMM
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="wallet-connection-item">
                <div className="wallet-connection-header">
                  <span className="wallet-connection-name">Metamask</span>
                </div>
                <button type="button" className="wallet-connect-btn">
                  Connect to Metamask
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="wallet-form-actions">
              <button type="submit" className="primary-btn">
                <span className="btn-arrow">
                  <ArrowRight size={16} />
                </span>
                <span>Submit for verification</span>
              </button>
            </div>
          </form>
        </>
      );
    }

    return (
      <>
        <form className="kyc-form" onSubmit={handleSubmitAndNext}>
          <label>
            <span>First name</span>
            <input
              type="text"
              placeholder="Enter your first name"
              value={kycForm.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
            />
          </label>
          <label>
            <span>Last name</span>
            <input
              type="text"
              placeholder="Enter your last name"
              value={kycForm.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
            />
          </label>
          <label>
            <span>Nationality</span>
            <div className="select-field">
              <select
                value={kycForm.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
              >
                <option value="">Please select</option>
                <option value="usa">United States</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
              </select>
            </div>
          </label>
          <label>
            <span>NID/Passport Number</span>
            <input
              type="text"
              placeholder="Enter your NID/Passport number"
              value={kycForm.passport}
              onChange={(e) => handleInputChange('passport', e.target.value)}
            />
          </label>
          <label>
            <span>Date of Birth</span>
            <input
              type="date"
              placeholder="Enter Date of Birth"
              value={kycForm.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-btn">
              <span className="btn-arrow">
                <ArrowRight size={16} />
              </span>
              <span className="btn-text">Submit and Next</span>
            </button>
          </div>
        </form>
      </>
    );
  };

  return (
    <div className="dashboard">
      {isSwitchingAccountType && <BusinessSuiteLoader message={switchMessage} />}
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
              const isDisabled = accountType === 'Business Suite' && !businessKycComplete;

              const routeByLabel = {
                Dashboard: '/dashboard',
                'My Escrow': '/my-escrow',
                Transactions: '/transactions',
                Transaction: '/transactions',
                Dispute: accountType === 'Business Suite' ? '/business-dispute' : '/dispute',
                Savings: '/savings',
                Trusticard: '/trusticard',
                Payroll: '/payroll',
                'Supplier Contract': '/supplier-contract',
              };

              const targetPath = routeByLabel[item.label];

              const isActive = (() => {
                if (!targetPath) return false;
                if (targetPath === '/dispute' || targetPath === '/business-dispute') {
                  return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
                }
                if (targetPath === '/payroll') {
                  return location.pathname === '/payroll' || location.pathname.startsWith('/payroll/');
                }
                return location.pathname === targetPath;
              })();

              const handleNavClick = () => {
                if (isDisabled) return;
                if (!targetPath) return;
                navigate(targetPath);
              };
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={handleNavClick}
                  disabled={isDisabled}
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
          <p className="sidebar-section-label">Wallet</p>
          <div className="sidebar-wallet" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isLoadingWalletAddress ? (
              <div className="sidebar-wallet-btn" style={{ opacity: 0.8, cursor: 'default' }} aria-label="Loading wallet">
                <LoadingIndicator size="sm" />
                <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
              </div>
            ) : (accountType === 'Business Suite' && !businessKycComplete) ? (
              <button type="button" className="sidebar-wallet-btn disabled" disabled aria-label="Verification required">
                <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M20.5 21.5c-1.834-2.5-5.333-4-8.5-4s-6.666 1.5-8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <span style={{ marginLeft: '0.5rem' }}>View wallet</span>
              </button>
            ) : hasWallet ? (
              <button
                className="sidebar-wallet-btn"
                onClick={() => (accountType === 'Business Suite' ? setShowBusinessSuiteWalletModal(true) : setShowConnectedWalletModal(true))}
                aria-label="View wallet"
              >
                <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M20.5 21.5c-1.834-2.5-5.333-4-8.5-4s-6.666 1.5-8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <span style={{ marginLeft: '0.5rem' }}>View wallet</span>
              </button>
            ) : (
              <button className="sidebar-wallet-btn" onClick={handleCreateWallet} aria-label="Create wallet">
                <svg className="user-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M20.5 21.5c-1.834-2.5-5.333-4-8.5-4s-6.666 1.5-8.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                <span style={{ marginLeft: '0.5rem' }}>Create wallet</span>
              </button>
            )}
          </div>
        </div>

        {accountType === 'Business Suite' && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Developers Tool</p>
            <nav className="sidebar-nav">
              {developersNav.map((item) => {
                const Icon = item.icon;
                const isDisabled = !businessKycComplete;
                const developerPath = item.label === 'Api Keys' ? '/api-keys' : item.label === 'Sand box enviroment' ? '/sandbox-environment' : item.label === 'Web hook' ? '/webhook' : null;
                const isActive = developerPath && location.pathname === developerPath;
                const handleDeveloperClick = () => {
                  if (isDisabled || !developerPath) return;
                  navigate(developerPath);
                };
                return (
                  <button 
                    key={item.label} 
                    type="button" 
                    className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    disabled={isDisabled}
                    onClick={handleDeveloperClick}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const Icon = item.icon;
              const isDisabled = accountType === 'Business Suite' && !businessKycComplete;
              const handleSupportNavClick = () => {
                if (isDisabled) return;
                if (item.label === 'Settings') {
                  navigate('/settings');
                } else if (item.label === 'Security') {
                  navigate('/security');
                }
              };
              const isActive = item.label === 'Settings' && location.pathname === '/settings';
              return (
                <button 
                  key={item.label} 
                  type="button" 
                  className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={handleSupportNavClick}
                  disabled={isDisabled}
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
            <span className="trustiscore-badge">
              {dashboardData?.trustiscore?.score !== undefined 
                ? dashboardData.trustiscore.score 
                : (isLoadingDashboard ? '...' : '97')}
            </span>
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
            {accountType === 'Business Suite' || isKycCompleteForAccount ? (
              <>
                <div className="account-type-buttons">
                  <button 
                    type="button" 
                    className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                    onClick={() => {
                      if (accountType === 'Business Suite') {
                        setSwitchMessage('switching to personal');
                        setIsSwitchingAccountType(true);
                        setTimeout(() => {
                          setAccountType('Personal');
                          setIsSwitchingAccountType(false);
                          setSwitchMessage('');
                        }, 2000);
                      } else {
                        setAccountType('Personal');
                      }
                    }}
                  >
                    Personal
                  </button>
                  <button 
                    type="button" 
                    className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                    onClick={() => {
                      if (accountType !== 'Business Suite') {
                        handleSwitchToBusinessSuite();
                      }
                    }}
                  >
                    Business Suite
                  </button>
                </div>
                {isKycCompleteForAccount && (
                  <button 
                    type="button" 
                    className="create-wallet-btn"
                    onClick={async () => {
                      // If walletAddress is already set, just open the modal
                      if (walletAddress) {
                        console.log('View Wallet clicked - Using existing walletAddress:', walletAddress);
                        setShowWalletModal(true);
                        return;
                      }
                      
                      console.log('View Wallet clicked - Fetching wallet address from API...');
                      
                      setIsLoadingWalletAddress(true);
                      try {
                        const token = localStorage.getItem('token');
                        if (!token) {
                          toast.error('No authentication token found.');
                          setIsLoadingWalletAddress(false);
                          return;
                        }
                        const walletBalanceUrl = accountType === 'Business Suite'
                          ? getApiUrl('api/business-suite/wallet/balance')
                          : getApiUrl('api/wallet/balance');
                        const res = await fetch(walletBalanceUrl, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        const result = await res.json().catch(() => ({}));
                        const address = result?.xrplAddress || result?.xrpl_address || result?.data?.xrplAddress || result?.data?.xrpl_address || result?.data?.walletAddress;
                        if (result?.success && address && typeof address === 'string' && address.trim().length > 0) {
                          setWalletAddress(address);
                          setHasWallet(true);
                          setShowWalletModal(true);
                        } else {
                          const msg = (result?.message || '').toLowerCase();
                          const isNotFound = msg.includes('wallet not found') || msg.includes('not found') || !result?.success;
                          setWalletAddress('');
                          setHasWallet(false);
                          if (accountType === 'Business Suite' && isNotFound) {
                            toast.error('No Business Suite wallet connected. Use Create wallet to connect your XRPL address.');
                            setShowConnectBusinessWalletModal(true);
                          } else {
                            if (!showUnderReviewModalIfApplicable(result?.message)) {
                              toast.error(result?.message || 'Failed to fetch wallet address.');
                            }
                          }
                        }
                      } catch (err) {
                        toast.error('Failed to fetch wallet address.');
                        console.error(err);
                      } finally {
                        setIsLoadingWalletAddress(false);
                      }
                    }}
                  >
                    {isLoadingWalletAddress ? <LoadingIndicator size="sm" /> : 'View Wallet'}
                  </button>
                )}
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

        {accountType === 'Business Suite' && isLoadingBusinessKyc ? (
          <div className="dashboard-kyc-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', padding: '2rem' }}>
            <LoadingIndicator size="md" />
          </div>
        ) : isKycCompleteForAccount ? (
          accountType === 'Business Suite' ? (
            location.pathname === '/supplier-contract' ? (
              <SupplierContractContent
                dashboardData={businessSuiteDashboardData}
                isLoadingDashboard={isLoadingBusinessSuiteDashboard}
                exchangeRates={exchangeRates}
                isLoadingRates={isLoadingRates}
                walletBalances={walletBalances}
                isLoadingWalletBalances={isLoadingWalletBalances}
                totalEscrowedAmount={businessSuiteDashboardData?.totalEscrowed}
                isLoadingTotalEscrowed={isLoadingBusinessSuiteDashboard}
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
                setShowWithdrawWalletModal={setShowWithdrawWalletModal}
                accountType={accountType}
                setAccountType={setAccountType}
                setIsSwitchingAccountType={setIsSwitchingAccountType}
                setSwitchMessage={setSwitchMessage}
                businessKycComplete={businessKycComplete}
                businessCompanyName={businessCompanyName}
                businessCompanyLogoUrl={businessCompanyLogoUrl}
                isLoadingBusinessKyc={isLoadingBusinessKyc}
                navigate={navigate}
                location={location}
                getBalanceValue={getBalanceValue}
                getExchangeRate={getExchangeRate}
              />
            ) : (
            <BusinessDashboard
              dashboardData={businessSuiteDashboardData}
              isLoadingDashboard={isLoadingBusinessSuiteDashboard}
              exchangeRates={exchangeRates}
              isLoadingRates={isLoadingRates}
              portfolioPoints={accountType === 'Business Suite' ? businessSuitePortfolioPoints : portfolioChartPoints}
              isLoadingPortfolio={accountType === 'Business Suite' ? isLoadingBusinessSuitePortfolio : isLoadingPortfolio}
              teams={businessSuiteTeams}
              isLoadingTeams={isLoadingBusinessSuiteTeams}
              onViewTeam={handleViewTeam}
              onTeamCreated={refetchBusinessSuiteTeams}
              upcomingSupply={upcomingSupply}
              isLoadingUpcomingSupply={isLoadingUpcomingSupply}
              subscriptionList={subscriptionList}
              isLoadingSubscription={isLoadingSubscription}
              walletBalances={walletBalances}
              isLoadingWalletBalances={isLoadingWalletBalances}
              escrows={escrows}
              isLoadingEscrows={isLoadingEscrows}
              totalEscrowedAmount={businessSuiteDashboardData?.totalEscrowed}
              isLoadingTotalEscrowed={isLoadingBusinessSuiteDashboard}
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
              setShowFundMethodModal={setShowFundMethodModal}
              setShowFundWalletModal={setShowFundWalletModal}
              setShowWithdrawWalletModal={setShowWithdrawWalletModal}
              setShowCreateEscrowModal={setShowCreateEscrowModal}
              accountType={accountType}
              setAccountType={setAccountType}
              setIsSwitchingAccountType={setIsSwitchingAccountType}
              setSwitchMessage={setSwitchMessage}
              businessKycComplete={businessKycComplete}
              businessCompanyName={businessCompanyName}
              businessCompanyLogoUrl={businessCompanyLogoUrl}
              isLoadingBusinessKyc={isLoadingBusinessKyc}
              navigate={navigate}
              location={location}
              getBalanceValue={getBalanceValue}
              getExchangeRate={getExchangeRate}
            />
            )
          ) : (
            renderDashboardView()
          )
        ) : (
          <section className={`dashboard-card ${accountType === 'Business Suite' ? 'business-kyc' : ''}`}>
            {accountType !== 'Business Suite' && (
              <div className="kyc-mobile-header-only">
                <div className="kyc-mobile-indicator"></div>
                <h1 className="kyc-mobile-title-only">KYC Verification</h1>
              </div>
            )}
            <div className="card-header kyc-header-desktop">
              <div className="card-breadcrumb">
                <span className="breadcrumb-root">KYC verification Form</span>
                <span className="breadcrumb-divider">›</span>
                <span className="breadcrumb-current">
                  {accountType === 'Business Suite' && currentStep === 0 ? 'Upload Document' : steps[currentStep].detail}
                </span>
              </div>
            </div>

            <div className="stepper">
              {steps.map((step, index) => (
                <div key={step.label} className={`step ${stepStatus(index)}`}>
                  <div className="step-node" aria-hidden="true" />
                  <p className="step-title">{step.detail}</p>
                  {index < steps.length - 1 && (
                    <div className={`step-connector ${stepStatus(index + 1)}`} />
                  )}
                </div>
              ))}
            </div>

            <div className={`card-content ${currentStep === 1 && accountType !== 'Business Suite' ? 'single-column' : ''}`}>
              <div className="card-left">
                {currentStep === 0 && <h2 className="kyc-section-title-mobile">{steps[currentStep].detail}</h2>}
                {renderStepContent()}
              </div>

              {(currentStep !== 1 || accountType === 'Business Suite') && (
                <div className="card-illustration">
                  <img src={activeIllustration} alt="Document illustration" />
                  {currentStep === 2 && accountType !== 'Business Suite' && (
                    <div className="card-overlay">
                      <img src={cardIllustration} alt="Card illustration" className="card-image" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
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
              {Array.isArray(notifications) && notifications.length > 0 ? (
                notifications.map((n) => {
                  const isUnread = !n?.isRead;
                  const { Icon, className } = getNotificationIconConfig(n?.type);
                  const message = n?.message || n?.title || 'N/A';
                  return (
                    <div
                      key={n?.id}
                      className={`notification-item ${isUnread ? 'unread' : ''}`}
                      onClick={() => {
                        if (isUnread) handleMarkNotificationRead(n?.id);
                      }}
                    >
                      <div className="notification-bell-icon">
                        <Bell size={16} />
                        {isUnread && <span className="notification-bell-dot"></span>}
                      </div>
                      <div className="notification-content">
                        <div className="notification-message-wrapper">
                          <Icon size={18} className={className} />
                          <p className="notification-message">{message}</p>
                        </div>
                        <span className="notification-time">{formatTimeAgo(n?.createdAt)}</span>
                      </div>
                      {isUnread && <div className="notification-unread-dot"></div>}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  N/A
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Escrow Modal (Dashboard-scoped, reusing shared form) */}
      <CreateEscrowForm
        isOpen={showCreateEscrowModal}
        onCancel={() => setShowCreateEscrowModal(false)}
        onSuccess={() => {
          // After creating an escrow, refresh high-level dashboard summary.
          fetchDashboardSummary();
        }}
      />

      {/* Fund Method Selection Modal */}
      {showFundMethodModal && (
        <div className="notification-modal-overlay" onClick={() => setShowFundMethodModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Fund Wallet</h2>
              </div>
              <button 
                type="button" 
                className="notification-close-btn" 
                onClick={() => setShowFundMethodModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '2rem' }}>
              <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '0.95rem' }}>
                Choose how you want to fund your wallet
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFundMethodModal(false);
                    if (!isWalletConnectedViaAPI) {
                      setShowConnectWalletModal(true);
                    }
                  }}
                  disabled={isWalletConnectedViaAPI}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Satoshi, Inter, sans-serif',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#0066ff';
                    e.target.style.background = '#f0f7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#ffffff';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    flexShrink: 0
                  }}>
                    <Wallet size={24} color="#0066ff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#000', marginBottom: '0.25rem' }}>
                      Fund with Wallet
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Connect your crypto wallet to fund
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFundMethodModal(false);
                    setFundViaAddress(true);
                    setShowFundWalletModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    background: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Satoshi, Inter, sans-serif',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#0066ff';
                    e.target.style.background = '#f0f7ff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#ffffff';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    flexShrink: 0
                  }}>
                    <QrCode size={24} color="#0066ff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#000', marginBottom: '0.25rem' }}>
                      Fund with Address
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      Send funds to your wallet address
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet Modal */}
      <ConnectWalletModal 
        isOpen={showConnectWalletModal && !isWalletConnectedViaAPI} 
        onClose={() => setShowConnectWalletModal(false)} 
      />

      {/* Business Suite Wallet Modal (fetch & show balance) */}
      {showBusinessSuiteWalletModal && (
        <div className="notification-modal-overlay" onClick={() => setShowBusinessSuiteWalletModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Business Suite Wallet</h2>
              </div>
              <button
                type="button"
                className="notification-close-btn"
                onClick={() => setShowBusinessSuiteWalletModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="notification-modal-content" style={{ padding: '1.25rem' }}>
              {businessSuiteWalletModalLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                  <LoadingIndicator size="md" />
                </div>
              ) : businessSuiteWalletModalData?.error ? (
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{businessSuiteWalletModalData.error}</p>
                  {businessSuiteWalletModalData.error === 'No wallet' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: '1rem' }}
                      onClick={() => {
                        setShowBusinessSuiteWalletModal(false);
                        setConnectBusinessWalletAddress('');
                        setShowConnectBusinessWalletModal(true);
                      }}
                    >
                      Connect wallet
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {businessSuiteWalletModalData?.address && (
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>XRPL Address</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>{businessSuiteWalletModalData.address}</span>
                        <button
                          type="button"
                          className="btn"
                          style={{ flexShrink: 0 }}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(businessSuiteWalletModalData.address);
                              toast.success('Address copied');
                            } catch (e) {
                              toast.error('Copy failed');
                            }
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  {businessSuiteWalletModalData?.balances && (
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Balance</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border, #eee)' }}>
                          <span style={{ fontSize: '0.9rem' }}>XRP</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{Number(businessSuiteWalletModalData.balances.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border, #eee)' }}>
                          <span style={{ fontSize: '0.9rem' }}>USDT</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{Number(businessSuiteWalletModalData.balances.usdt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border, #eee)' }}>
                          <span style={{ fontSize: '0.9rem' }}>USDC</span>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{Number(businessSuiteWalletModalData.balances.usdc).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {(businessSuiteWalletModalData.balances.rippleUsd ?? 0) > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                            <span style={{ fontSize: '0.9rem' }}>XRPUSD</span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{Number(businessSuiteWalletModalData.balances.rippleUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Connect Business Suite Wallet Modal */}
      {showConnectBusinessWalletModal && (
        <div className="notification-modal-overlay" onClick={() => !isConnectingBusinessWallet && setShowConnectBusinessWalletModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Connect XRPL Wallet</h2>
              </div>
              <button
                type="button"
                className="notification-close-btn"
                onClick={() => !isConnectingBusinessWallet && setShowConnectBusinessWalletModal(false)}
                disabled={isConnectingBusinessWallet}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="notification-modal-content" style={{ padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Enter your XRPL wallet address to use as your Business Suite wallet. You can fund it from this connected wallet.
              </p>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Wallet address</label>
              <input
                type="text"
                placeholder="Paste your XRPL address here"
                value={connectBusinessWalletAddress}
                onChange={(e) => setConnectBusinessWalletAddress(e.target.value)}
                disabled={isConnectingBusinessWallet}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border, #e0e0e0)',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowConnectBusinessWalletModal(false)}
                disabled={isConnectingBusinessWallet}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConnectBusinessWallet}
                disabled={isConnectingBusinessWallet}
              >
                {isConnectingBusinessWallet ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Suite PIN Modal */}
      <BusinessSuitePinModal
        isOpen={showBusinessSuitePinModal}
        mode={businessSuitePinMode}
        onClose={handleClosePinModal}
        onVerify={handleBusinessSuitePinSubmit}
      />

      {/* KYC Status Dialog: In review / Rejected */}
      {kycStatusDialog && (
        <div className="notification-modal-overlay kyc-status-dialog-overlay" onClick={() => setKycStatusDialog(null)}>
          <div className="notification-modal kyc-status-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <h2>Business Suite</h2>
              <button type="button" className="notification-close-btn" onClick={() => setKycStatusDialog(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="kyc-status-dialog-content">
              <p className="kyc-status-dialog-message">
                {kycStatusDialog === 'in_review'
                  ? 'Your Business Suite application is in review. We will notify you once it has been verified.'
                  : 'Your Business Suite application was rejected. Please contact support if you have questions.'}
              </p>
              <button type="button" className="kyc-status-dialog-ok" onClick={() => setKycStatusDialog(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Under review – cannot update KYC modal */}
      {showUnderReviewKycModal && (
        <div className="notification-modal-overlay under-review-kyc-modal-overlay" onClick={() => setShowUnderReviewKycModal(false)}>
          <div className="under-review-kyc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="under-review-kyc-modal-icon-wrap">
              <Clock size={40} strokeWidth={1.5} className="under-review-kyc-modal-icon" />
            </div>
            <h2 className="under-review-kyc-modal-title">Registration is under review</h2>
            <p className="under-review-kyc-modal-message">
              Your Business Suite registration has been submitted and is currently under review. You cannot update KYC details or use Business Suite features until the review is complete. We’ll notify you once it’s done.
            </p>
            <button type="button" className="under-review-kyc-modal-btn" onClick={() => setShowUnderReviewKycModal(false)}>
              Got it
            </button>
            <button type="button" className="under-review-kyc-modal-close" onClick={() => setShowUnderReviewKycModal(false)} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <TeamDetailModal
        isOpen={teamDetailOpen}
        onClose={handleCloseTeamDetail}
        team={teamDetailData}
        loading={isLoadingTeamDetail}
        onMemberRemoved={handleTeamDetailMemberRemoved}
      />

      {/* Connected Wallet Modal */}
      <ConnectedWalletModal
        isOpen={showConnectedWalletModal}
        onClose={() => setShowConnectedWalletModal(false)}
        walletAddress={walletAddress}
      />

      {/* Fund Wallet Modal */}
      {showFundWalletModal && (
        <div className="notification-modal-overlay" onClick={() => setShowFundWalletModal(false)}>
          <div className="notification-modal fund-wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Fund Wallet</h2>
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
                }}
                disabled={isFundingWallet && fundingStep !== 'idle'}
              >
                <X size={20} />
              </button>
            </div>

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

            {/* Wallet Connection Status */}
            {isWalletConnectedViaAPI && isConnected && account && (() => {
              const isXamanConnected = localStorage.getItem('xamanWalletConnected') === 'true';
              const isMetamaskConnected = localStorage.getItem('metamaskWalletConnected') === 'true';
              const walletName = isXamanConnected ? 'XAMAN' : isMetamaskConnected ? 'MetaMask' : 'Wallet';
              
              return (
                <div style={{
                  padding: '1rem 1.25rem',
                  margin: '0 1.25rem',
                  background: '#f0f9ff',
                  border: '1px solid #2F74FF',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle size={20} color="#2F74FF" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2F74FF', marginBottom: '0.25rem' }}>
                      {walletName} Connected
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </div>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleFundWallet} className="fund-wallet-form">
              <div className="form-group">
                <label htmlFor="fund-amount">Amount</label>
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

              <div className="form-group">
                <label htmlFor="fund-currency">Wallets</label>
                <select
                  id="fund-currency"
                  value={fundWalletForm.currency}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    console.log('Dropdown changed - selected wallet type:', selectedValue);
                    setFundWalletForm(prev => {
                      console.log('Previous form state:', prev);
                      const updated = { ...prev, currency: selectedValue };
                      console.log('Updated form state:', updated);
                      return updated;
                    });
                  }}
                  disabled={isFundingWallet}
                >
                  <option value="XRP">XRP</option>
                  <option value="USDT">USDT</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>

              <div className="fund-wallet-actions">
                {fundViaAddress ? (
                  walletAddress ? (
                    <>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0',
                        width: '100%'
                      }}>
                        <p style={{
                          fontSize: '0.95rem',
                          color: '#666',
                          textAlign: 'center',
                          margin: 0
                        }}>
                          Scan this QR code to send funds to your XRP wallet address
                        </p>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '0.75rem',
                          minHeight: '200px',
                          width: '100%',
                          maxWidth: '300px'
                        }}>
                          <QRCode
                            value={walletAddress}
                            size={256}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            viewBox="0 0 256 256"
                          />
                        </div>

                        <div style={{
                          padding: '0.5rem',
                          background: '#f9fafb',
                          border: '1px solid #e0e0e0',
                          borderRadius: '0.75rem',
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          color: '#374151',
                          textAlign: 'left',
                          width: '100%',
                          maxWidth: '300px'
                        }}>
                          {walletAddress}
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(walletAddress);
                              toast.success('Wallet address copied to clipboard');
                            } catch (err) {
                              console.error('Failed to copy wallet address:', err);
                              toast.error('Failed to copy wallet address');
                            }
                          }}
                          style={{
                            width: '100%',
                            maxWidth: '300px',
                            padding: '0.6rem 1rem',
                            background: '#2F74FF',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontFamily: 'Satoshi, Inter, sans-serif',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#2563eb';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = '#2F74FF';
                          }}
                        >
                          <Copy size={16} />
                          Copy Address
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '2rem',
                      textAlign: 'center'
                    }}>
                      <p style={{
                        fontSize: '0.95rem',
                        color: '#666',
                        margin: 0
                      }}>
                        No wallet address found. Please create a wallet first.
                      </p>
                      <button
                        type="button"
                        className="fund-wallet-btn cancel"
                        onClick={() => {
                          setShowFundWalletModal(false);
                          setFundViaAddress(false);
                        }}
                        style={{ width: '100%' }}
                      >
                        Close
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <button
                      type="button"
                      className="fund-wallet-btn cancel"
                      onClick={() => {
                        setShowFundWalletModal(false);
                        setFundWalletForm({ amount: '', currency: 'XRP' });
                        setTransactionData(null);
                        setFundingStep('idle');
                        setIsFundingWallet(false);
                        setFundViaAddress(false);
                      }}
                      disabled={isFundingWallet && fundingStep !== 'idle'}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="fund-wallet-btn primary"
                      disabled={isFundingWallet}
                    >
                      {fundingStep === 'preparing' && 'Preparing...'}
                      {fundingStep === 'signing' && 'Waiting for signature...'}
                      {fundingStep === 'completing' && 'Completing...'}
                      {!isFundingWallet && 'Fund Wallet'}
                      {isFundingWallet && fundingStep === 'idle' && 'Processing...'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && hasWallet && walletAddress && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2>Your Wallet</h2>
              <button
                type="button"
                className="wallet-modal-close-btn"
                onClick={() => setShowWalletModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="wallet-modal-body">
              <p className="wallet-modal-label">XRPL Address</p>
              <div className="wallet-modal-address-row">
                <div className="wallet-modal-address-box">
                  {walletAddress}
                </div>
                <button
                  type="button"
                  className="wallet-modal-copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(walletAddress);
                      toast.success('Wallet address copied');
                    } catch (err) {
                      console.error('Failed to copy wallet address:', err);
                      toast.error('Failed to copy wallet address');
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Wallet Modal */}
      {showWithdrawWalletModal && (
        <div className="notification-modal-overlay" onClick={() => setShowWithdrawWalletModal(false)}>
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
    </div>
  );
};

export default Dashboard;

