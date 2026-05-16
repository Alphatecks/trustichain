import React, { useState, useEffect, useMemo } from 'react';
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

const MOCK_SAVINGS_PLANS = [
  { id: '1', title: 'My goals', progressPct: 65, typeLabel: 'Fixed', savedUsd: 16000, ringColor: '#2563eb', Icon: Trophy },
  { id: '2', title: 'Utility', progressPct: 15, typeLabel: 'Auto Savings', savedUsd: 4000, ringColor: '#22c55e', Icon: Home },
  { id: '3', title: 'Expenses', progressPct: 15, typeLabel: 'Flex savings', savedUsd: 4000, ringColor: '#ec4899', Icon: Receipt },
  { id: '4', title: 'Others', progressPct: 15, typeLabel: 'Goal', savedUsd: 4000, ringColor: '#f97316', Icon: Trophy },
  { id: '5', title: 'Others', progressPct: 15, typeLabel: 'Goal', savedUsd: 4000, ringColor: '#a855f7', Icon: Package },
  { id: '6', title: 'Others', progressPct: 15, typeLabel: 'Goal', savedUsd: 4000, ringColor: '#06b6d4', Icon: Package },
];

const MOBILE_SAVINGS_ALLOCATION_BUCKETS = [
  { id: 'mb1', label: 'My Goals', pct: 50, color: '#2563eb' },
  { id: 'mb2', label: 'House Rent', pct: 15, color: '#22c55e' },
  { id: 'mb3', label: 'Expenses', pct: 15, color: '#a855f7' },
  { id: 'mb4', label: 'Set up', pct: 20, color: '#f97316' },
];

const MOCK_SAVINGS_MOBILE_TX_FEED = [
  {
    id: 'mt1',
    title: 'Received',
    subtitle: 'You received 50 XRP, worth $25.00 USD.',
    status: 'Successful',
    date: '2024-07-04',
  },
  {
    id: 'mt2',
    title: 'Received',
    subtitle: 'You received 50 XRP, worth $25.00 USD.',
    status: 'Successful',
    date: '2024-07-04',
  },
  {
    id: 'mt3',
    title: 'Received',
    subtitle: 'You received 50 XRP, worth $25.00 USD.',
    status: 'Successful',
    date: '2024-07-04',
  },
];

const MOCK_SAVING_HISTORY_ROWS = [
  { id: 'h1', txShort: 'F4E5D6', txEnd: 'C1B2A3', amount: 1200, plan: 'Flex Savings', date: '2024-07-04' },
  { id: 'h2', txShort: 'A1B2C3', txEnd: 'D4E5F6', amount: 800, plan: 'Auto-Save', date: '2024-07-03' },
  { id: 'h3', txShort: '9F8E7D', txEnd: '1A2B3C', amount: 2500, plan: 'Fixed Saving', date: '2024-07-02' },
  { id: 'h4', txShort: '7C8D9E', txEnd: 'F1A2B3', amount: 500, plan: 'Goal', date: '2024-07-01' },
  { id: 'h5', txShort: '5D6E7F', txEnd: '8C9D0E', amount: 1500, plan: 'Flex Savings', date: '2024-06-29' },
  { id: 'h6', txShort: '3E4F5A', txEnd: '6B7C8D', amount: 950, plan: 'Auto-Save', date: '2024-06-28' },
  { id: 'h7', txShort: '1F2A3B', txEnd: '4E5F6C', amount: 2200, plan: 'Fixed Saving', date: '2024-06-26' },
  { id: 'h8', txShort: '8N9P0Q', txEnd: '2R3S4T', amount: 650, plan: 'Goal', date: '2024-06-24' },
];

const HISTORY_PAGE_CHUNK = 10;
const HISTORY_TOTAL_PAGES = 18;

/** Pagination strip aligned with Saving history mock: `1 … 11–18` when there are many pages. */
const getSavingHistoryPaginationStrip = (totalPages) => {
  if (totalPages <= 10) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const tailStart = Math.max(2, totalPages - 7);
  const strip = [1];
  if (tailStart > 2) strip.push(null);
  for (let p = tailStart; p <= totalPages; p += 1) strip.push(p);
  return strip;
};

const MOCK_SAVINGS_ALLOCATION = {
  totalUsd: 24567.89,
  monthGrowthPct: 3.1,
  buckets: [
    { id: 'a1', label: 'My Goals', pct: 25, color: '#2563eb' },
    { id: 'a2', label: 'House Rent', pct: 20, color: '#22c55e' },
    { id: 'a3', label: 'Expenses', pct: 20, color: '#a855f7' },
    { id: 'a4', label: 'Set up', pct: 20, color: '#f97316' },
    { id: 'a5', label: 'Set up', pct: 10, color: '#4f46e5' },
    { id: 'a6', label: 'Set up', pct: 5, color: '#06b6d4' },
  ],
};

const fmtUsdWhole = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtUsdDecimals = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

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
  const [savingHistoryPage, setSavingHistoryPage] = useState(12);
  const [savingHistorySelectedIds, setSavingHistorySelectedIds] = useState(() => ({}));
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showAddSavingsPlanModal, setShowAddSavingsPlanModal] = useState(false);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [savingsPlans, setSavingsPlans] = useState(() => MOCK_SAVINGS_PLANS.map((p) => ({ ...p })));
  const [addMoneyAccountId, setAddMoneyAccountId] = useState(MOCK_SAVINGS_PLANS[0]?.id ?? '1');
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

  const savingHistoryPaginationStrip = getSavingHistoryPaginationStrip(HISTORY_TOTAL_PAGES);
  const savingHistoryRowIds = MOCK_SAVING_HISTORY_ROWS.map((r) => r.id);
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

  const savingsAllocationBuckets = savingsMobileMq ? MOBILE_SAVINGS_ALLOCATION_BUCKETS : MOCK_SAVINGS_ALLOCATION.buckets;

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

  const deleteSavingsPlanCard = (plan) => {
    if (!window.confirm(`Remove "${plan.title}" from your savings wallets?`)) {
      return;
    }
    setSavingsPlans((prev) => prev.filter((p) => p.id !== plan.id));
    toast.success('Plan removed');
  };

  const savingsWithdrawWallets = useMemo(() => {
    const eurFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
    const utilityBalance = 20567.89;
    return [
      {
        id: 'sw-withdraw-1',
        title: 'My goals',
        progressPct: 100,
        ringColor: '#2563eb',
        Icon: Trophy,
        balanceLabel: fmtUsdDecimals(24567.89),
        confirmBalanceLabel: fmtUsdWhole(16000),
        planStatus: 'completed',
        accent: 'blue',
      },
      ...['sw-withdraw-2', 'sw-withdraw-3', 'sw-withdraw-4'].map((id) => ({
        id,
        title: 'Utility',
        progressPct: 15,
        ringColor: '#22c55e',
        Icon: RefreshCw,
        balanceLabel: eurFmt.format(utilityBalance),
        confirmBalanceLabel: eurFmt.format(utilityBalance),
        planStatus: 'active',
        accent: 'green',
      })),
    ];
  }, []);

  return (
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
                {savingsPlans.map((plan) => {
                  const Pi = plan.Icon;
                  return (
                    <article key={plan.id} className="savings-plan-card" role="listitem">
                      <button
                        type="button"
                        className="savings-plan-delete-btn"
                        onClick={() => deleteSavingsPlanCard(plan)}
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
                })}
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
                <span className="savings-allocation-total">{fmtUsdDecimals(MOCK_SAVINGS_ALLOCATION.totalUsd)}</span>
                <span className="savings-allocation-growth">
                  <TrendingUp size={14} strokeWidth={2.25} aria-hidden />
                  +{MOCK_SAVINGS_ALLOCATION.monthGrowthPct}%
                </span>
                <span className="savings-allocation-period">This Month</span>
              </div>

              <div
                className="savings-allocation-bar"
                role="img"
                aria-label={savingsAllocationBuckets.map((b) => `${b.label} ${b.pct}%`).join(', ')}
              >
                {savingsAllocationBuckets.map((b) => (
                  <div
                    key={b.id}
                    className="savings-allocation-bar-segment"
                    style={{ flexGrow: b.pct, flexBasis: 0, backgroundColor: b.color }}
                  />
                ))}
              </div>

              <ul className="savings-allocation-legend" aria-label="Allocation categories">
                {savingsAllocationBuckets.map((b) => (
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
                  <button type="button" className="savings-history-pill-btn" onClick={() => toast.success('Filters — coming soon')}>
                    Filter
                    <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
                  </button>
                  <button type="button" className="savings-history-pill-btn" onClick={() => toast.success('Period — coming soon')}>
                    Monthly
                    <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
                  </button>
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
                    {MOCK_SAVING_HISTORY_ROWS.map((row) => (
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
                            <span className="savings-history-tx-label">Received</span>
                          </span>
                        </td>
                        <td className="savings-history-cell savings-history-cell-mono savings-history-cell-txid">
                          {row.txShort}…{row.txEnd}
                        </td>
                        <td className="savings-history-cell">{fmtUsdWhole(row.amount)}</td>
                        <td className="savings-history-cell">{row.plan}</td>
                        <td className="savings-history-cell">
                          <span className="savings-history-status-ok">Successful</span>
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
              </div>

              <nav className="savings-history-pagination savings-history-desktop-only" aria-label="Saving history pagination">
                <button
                  type="button"
                  className="savings-history-page-nav"
                  disabled={savingHistoryPage <= 1}
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
                  disabled={savingHistoryPage >= HISTORY_TOTAL_PAGES}
                  onClick={() => setSavingHistoryPage((p) => Math.min(HISTORY_TOTAL_PAGES, p + HISTORY_PAGE_CHUNK))}
                >
                  Next {HISTORY_PAGE_CHUNK} →
                </button>
              </nav>

              <ul className="savings-history-mobile-feed savings-history-mobile-only" aria-label="Recent transactions">
                {MOCK_SAVINGS_MOBILE_TX_FEED.map((item) => (
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
                ))}
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
          toast.success('Add savings plan — coming soon');
          setShowAddSavingsPlanModal(false);
          setAddSavingsPlanForm({ name: '', category: 'Fixed', amount: '', autoSaveAmount: '', autoSaveFrequency: '' });
        }}
      />

      <SavingsAddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => {
          setShowAddMoneyModal(false);
          setAddMoneyAmount('');
          setAddMoneyAccountId(MOCK_SAVINGS_PLANS[0]?.id ?? '1');
        }}
        amount={addMoneyAmount}
        onAmountChange={setAddMoneyAmount}
        accounts={savingsAddMoneyAccounts}
        selectedAccountId={addMoneyAccountId}
        onSelectAccount={setAddMoneyAccountId}
        onTransfer={() => {
          toast.success('Add money — coming soon');
          setShowAddMoneyModal(false);
          setAddMoneyAmount('');
        }}
        balanceLine="24,567.89 USDT"
        amountPrefix="$"
        amountSuffix=""
      />

      <SavingsWithdrawWalletModal
        isOpen={showWithdrawWalletModal}
        onClose={() => setShowWithdrawWalletModal(false)}
        wallets={savingsWithdrawWallets}
      />

      <NotificationCenterModal open={showNotificationModal} onClose={() => setShowNotificationModal(false)} titleId="savings-notifications-title" />
    </>
  );
};

export default Savings;
