import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Search,
  Bell,
  Plus,
  DollarSign,
  Building2,
  FileCheck,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  Menu,
  ChevronDown,
  Calendar,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  X,
  Copy,
  Filter,
  Home,
  FileText,
  Repeat
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Webhook.css';
import logo from '../../../assets/images/icons/logo.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import CreateWebhookModal from '../../../components/CreateWebhookModal';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import toast from 'react-hot-toast';

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
  { label: 'Settings', icon: Settings, path: '/settings' }
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

const Webhook = () => {
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
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isKycCompleteForAccount, setIsKycCompleteForAccount] = useState(true);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Monthly');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoadingWebhookUrl, setIsLoadingWebhookUrl] = useState(true);
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  const [eventSubscriptions, setEventSubscriptions] = useState({
    'Escrow Created': true,
    'Escrow Released': true,
    'Payment Received': true,
    'Payment Failed': false,
    'Subscription Renewed': true,
    'Subscription Failed': true,
    'Dispute Opened': true,
    'Dispute Resolved': true,
    'Wallet Updated': true,
    'Payout Completed': true
  });

  const [webhookStats, setWebhookStats] = useState(null);
  const [isLoadingWebhookStats, setIsLoadingWebhookStats] = useState(true);

  const loadWebhookStats = useCallback(async () => {
    if (accountType !== 'Business Suite') {
      setWebhookStats(null);
      setIsLoadingWebhookStats(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setWebhookStats(null);
      setIsLoadingWebhookStats(false);
      return;
    }

    setIsLoadingWebhookStats(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/sandbox/webhook/stats'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setWebhookStats(result.data);
      } else {
        setWebhookStats(null);
      }
    } catch (e) {
      console.error('Webhook stats error:', e);
      setWebhookStats(null);
    } finally {
      setIsLoadingWebhookStats(false);
    }
  }, [accountType]);

  useEffect(() => {
    loadWebhookStats();
  }, [loadWebhookStats]);

  const loadWebhookUrl = useCallback(async () => {
    if (accountType !== 'Business Suite') {
      setWebhookUrl('');
      setIsLoadingWebhookUrl(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setWebhookUrl('');
      setIsLoadingWebhookUrl(false);
      return;
    }
    setIsLoadingWebhookUrl(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/webhook/url'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data != null) {
        const url = typeof result.data === 'string'
          ? result.data
          : (result.data?.webhookUrl ?? result.data?.url ?? '');
        setWebhookUrl(typeof url === 'string' ? url.trim() : '');
      } else {
        setWebhookUrl('');
      }
    } catch (e) {
      console.error('Webhook URL fetch error:', e);
      setWebhookUrl('');
    } finally {
      setIsLoadingWebhookUrl(false);
    }
  }, [accountType]);

  useEffect(() => {
    loadWebhookUrl();
  }, [loadWebhookUrl]);

  const [showUpdateWebhookUrlModal, setShowUpdateWebhookUrlModal] = useState(false);
  const [webhookUrlDraft, setWebhookUrlDraft] = useState('');
  const [isUpdatingWebhookUrl, setIsUpdatingWebhookUrl] = useState(false);

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
    if (!token) { setIsLoadingUserProfile(false); return; }
    setIsLoadingUserProfile(true);
    fetch(getApiUrl('api/user/profile'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
          if (firstName && lastName) initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
          else if (fullName) {
            const nameParts = fullName.trim().split(/\s+/);
            if (nameParts.length >= 2) initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
            else if (nameParts.length === 1) initials = nameParts[0].charAt(0).toUpperCase();
          }
          setUserInitials(initials);
          setUserRole(data.role || data.userType || data.accountType || '');
          setUserAvatar(getProfileAvatarUrl(data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  // Sandbox Webhook Logs (API-driven)
  const [webhookLogsList, setWebhookLogsList] = useState([]);
  const [isLoadingWebhookLogs, setIsLoadingWebhookLogs] = useState(false);
  const [webhookLogsTotal, setWebhookLogsTotal] = useState(0);
  const [webhookLogsPage, setWebhookLogsPage] = useState(1);
  const webhookLogsPageSize = 10;

  const [showWebhookLogDetailModal, setShowWebhookLogDetailModal] = useState(false);
  const [webhookLogDetail, setWebhookLogDetail] = useState(null);
  const [isLoadingWebhookLogDetail, setIsLoadingWebhookLogDetail] = useState(false);

  const getPossiblePayload = (d) => {
    if (!d || typeof d !== 'object') return null;
    return (
      d.payload ??
      d.requestBody ??
      d.request_payload ??
      d.body ??
      d.data ??
      d.eventPayload ??
      d.logPayload ??
      null
    );
  };

  const webhookPayload = getPossiblePayload(webhookLogDetail);
  const webhookPayloadText =
    typeof webhookPayload === 'string'
      ? webhookPayload
      : webhookPayload != null
        ? JSON.stringify(webhookPayload, null, 2)
        : '';

  const retryCount =
    webhookLogDetail?.retryCount ??
    webhookLogDetail?.retries ??
    webhookLogDetail?.retry_attempts ??
    webhookLogDetail?.retryAttempts ??
    webhookLogDetail?.attemptCount ??
    null;

  const responseCode =
    webhookLogDetail?.responseStatusCode ??
    webhookLogDetail?.responseCode ??
    webhookLogDetail?.statusCode ??
    webhookLogDetail?.httpStatus ??
    null;

  const responseTimeMs =
    webhookLogDetail?.responseTimeMs ??
    webhookLogDetail?.response_time_ms ??
    webhookLogDetail?.durationMs ??
    webhookLogDetail?.duration ??
    null;

  const handleReplayWebhookLog = () => {
    if (!webhookLogDetail?.id) return;
    toast.error('Replay endpoint not wired yet for webhook logs');
    // When you provide the backend endpoint, we’ll call it here.
  };

  const loadWebhookLogs = useCallback(async () => {
    if (accountType !== 'Business Suite') {
      setWebhookLogsList([]);
      setWebhookLogsTotal(0);
      setIsLoadingWebhookLogs(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setWebhookLogsList([]);
      setWebhookLogsTotal(0);
      setIsLoadingWebhookLogs(false);
      return;
    }

    setIsLoadingWebhookLogs(true);
    try {
      const res = await fetch(
        getApiUrl(
          `api/business-suite/sandbox/webhook/logs?status=all&dateRange=monthly&page=${webhookLogsPage}&pageSize=${webhookLogsPageSize}`
        ),
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setWebhookLogsList(Array.isArray(result.data.logs) ? result.data.logs : []);
        setWebhookLogsTotal(Number(result.data.total ?? 0));
      } else {
        setWebhookLogsList([]);
        setWebhookLogsTotal(0);
      }
    } catch (e) {
      console.error('Webhook logs error:', e);
      setWebhookLogsList([]);
      setWebhookLogsTotal(0);
    } finally {
      setIsLoadingWebhookLogs(false);
    }
  }, [accountType, webhookLogsPage]);

  useEffect(() => {
    loadWebhookLogs();
  }, [loadWebhookLogs]);

  const handleViewWebhookLogDetail = useCallback(async (logId) => {
    if (!logId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setShowWebhookLogDetailModal(true);
    setIsLoadingWebhookLogDetail(true);
    setWebhookLogDetail(null);

    try {
      const res = await fetch(getApiUrl(`api/business-suite/sandbox/webhook/logs/${logId}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setWebhookLogDetail(result.data);
      } else {
        setWebhookLogDetail(null);
      }
    } catch (e) {
      console.error('Webhook log detail error:', e);
      setWebhookLogDetail(null);
    } finally {
      setIsLoadingWebhookLogDetail(false);
    }
  }, []);

  const handleNavClick = (item) => {
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

  const handleDevelopersNavClick = (item) => {
    if (item.label === 'Api Keys') {
      navigate('/api-keys');
    } else if (item.label === 'Sand box enviroment') {
      navigate('/sandbox-environment');
    } else if (item.label === 'Web hook') {
      navigate('/webhook');
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      console.log('Webhook URL copied to clipboard');
    });
  };

  const handleUpdateUrl = () => {
    setWebhookUrlDraft(webhookUrl || '');
    setShowUpdateWebhookUrlModal(true);
  };

  const handleEventSubscriptionChange = (event) => {
    setEventSubscriptions(prev => ({
      ...prev,
      [event]: !prev[event]
    }));
  };

  const handleSaveEvents = () => {
    console.log('Save Events clicked', eventSubscriptions);
    // Placeholder - no actual API call
  };

  return (
    <div className="dashboard webhook-dashboard">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Mobile sidebar content - similar to desktop */}
      </div>

      {/* Desktop Dashboard */}
      <div className="dashboard-content">
        <div className="dashboard-layout">
          {/* Sidebar */}
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
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item)}
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
                  const isActive = (item.label === 'Api Keys' && location.pathname === '/api-keys') ||
                                   (item.label === 'Sand box enviroment' && location.pathname === '/sandbox-environment') ||
                                   (item.label === 'Web hook' && location.pathname === '/webhook');
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleDevelopersNavClick(item)}
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
                  const isActive = item.path && location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (item.path === '/settings') {
                          navigate('/settings', { state: { accountType: 'Business Suite' } });
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

            {/* Help Center Widget */}
            <div className="sidebar-help-card">
              <div className="help-icon-large">
                <HelpCircle size={24} />
              </div>
              <h3>Help Center</h3>
              <p>Having trouble in Trustichain? Please contact us</p>
              <button type="button" className="help-cta">Contact us</button>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
              <div className="sidebar-trustiscore">
                <span className="sidebar-trustiscore-label">Trustiscore</span>
                <span className="sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
              </div>
              <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main">
            {/* Header */}
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
                {isKycCompleteForAccount && (
                  <button type="button" className="create-wallet-btn" onClick={() => navigate('/dashboard')}>
                    {hasWallet ? 'View Wallet' : 'Create Wallet'}
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
                    <HeaderProfileVerifyBadge show={isKycCompleteForAccount} />
                  </div>
                </div>
              </div>
            </header>

            {/* Breadcrumb */}
            <div className="card-breadcrumb">
              <span className="breadcrumb-root">Developers Tool</span>
              <span className="breadcrumb-divider">›</span>
              <span className="breadcrumb-current">Webhook</span>
            </div>

            {/* Create Webhook Button */}
            <div className="webhook-page-header">
              <button
                type="button"
                className="webhook-create-btn"
                onClick={() => setShowCreateWebhookModal(true)}
              >
                <Plus size={18} />
                Create Webhook
              </button>
            </div>

            {/* Summary Cards */}
            <div className="webhook-summary-cards">
              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Total Webhooks</h3>
                  </div>
                  <span className="webhook-trend-badge positive">
                    <TrendingUp size={14} />
                    {isLoadingWebhookStats ? '' : '+0.0%'}
                  </span>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">
                    {isLoadingWebhookStats
                      ? '—'
                      : `${Number(webhookStats?.totalWebhooks?.value ?? 0).toLocaleString('en-US')}`}
                  </span>
                </div>
                <div className="webhook-card-subtitle">
                  {isLoadingWebhookStats
                    ? '—'
                    : webhookStats?.totalWebhooks?.secondary ?? '—'}
                </div>
              </div>

              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Events Sent</h3>
                  </div>
                  <span className="webhook-trend-badge positive">
                    <TrendingUp size={14} />
                    {isLoadingWebhookStats ? '' : '+0.0%'}
                  </span>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">
                    {isLoadingWebhookStats ? '—' : (webhookStats?.eventsSent?.value ?? '—')}
                  </span>
                </div>
                <div className="webhook-card-period">
                  {isLoadingWebhookStats ? '—' : (webhookStats?.eventsSent?.secondary ?? '—')}
                </div>
              </div>

              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Failed Deliveries</h3>
                  </div>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">
                    {isLoadingWebhookStats ? '—' : (webhookStats?.failedDeliveries?.value ?? '—')}
                  </span>
                </div>
                <div className="webhook-card-period">
                  {isLoadingWebhookStats ? '—' : (webhookStats?.failedDeliveries?.secondary ?? '—')}
                </div>
              </div>

              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Last Event Received</h3>
                  </div>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">
                    {isLoadingWebhookStats ? '—' : (webhookStats?.lastEventReceived?.value ?? '—')}
                  </span>
                </div>
                <div className="webhook-card-period">
                  {isLoadingWebhookStats ? '—' : (webhookStats?.lastEventReceived?.secondary ?? '—')}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="webhook-content-grid">
              {/* Left Column: My Details and Event Subscriptions */}
              <div className="webhook-left-column">
                {/* My Details Section */}
                <div className="webhook-section-card">
                  <div className="webhook-section-header">
                    <div className="webhook-section-header-left">
                      <div className="webhook-section-indicator"></div>
                      <h2 className="webhook-section-title">My Details</h2>
                    </div>
                  </div>
                  <div className="webhook-details-content">
                    <div className="webhook-url-section">
                      <div className="webhook-url-label">
                        <Building2 size={16} />
                        <span>Webhook URL</span>
                      </div>
                      <div className="webhook-url-value">
                        {isLoadingWebhookUrl ? (
                          <span className="webhook-url-loading"><LoadingIndicator size="sm" /> Loading…</span>
                        ) : webhookUrl ? (
                          webhookUrl
                        ) : (
                          <span className="webhook-url-empty">No URL set</span>
                        )}
                      </div>
                      <div className="webhook-url-actions">
                        <button 
                          type="button"
                          className="webhook-btn-primary"
                          onClick={handleUpdateUrl}
                        >
                          Update URL
                        </button>
                        <button
                          type="button"
                          className="webhook-btn-copy"
                          onClick={handleCopyUrl}
                          disabled={!webhookUrl}
                        >
                          Copy
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Subscriptions Section */}
                <div className="webhook-section-card">
                  <div className="webhook-section-header">
                    <div className="webhook-section-header-left">
                      <div className="webhook-section-indicator"></div>
                      <h2 className="webhook-section-title">EVENT SUBSCRIPTIONS</h2>
                    </div>
                    <button 
                      type="button"
                      className="webhook-save-events-btn"
                      onClick={handleSaveEvents}
                    >
                      Save Events
                    </button>
                  </div>
                  <div className="webhook-events-list">
                    {Object.keys(eventSubscriptions).map((event) => (
                      <label key={event} className="webhook-event-item">
                        <input
                          type="checkbox"
                          checked={eventSubscriptions[event]}
                          onChange={() => handleEventSubscriptionChange(event)}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Webhook Logs Section */}
              <div className="webhook-section-card webhook-logs-card">
                <div className="webhook-section-header">
                  <div className="webhook-section-header-left">
                    <div className="webhook-section-indicator"></div>
                    <h2 className="webhook-section-title">WEBHOOK LOGS</h2>
                  </div>
                  <div className="webhook-table-header-filters">
                    <button type="button" className="webhook-filter-btn">
                      Filter
                      <ChevronDown size={14} />
                    </button>
                    <button type="button" className="webhook-filter-btn">
                      {selectedMonth}
                      <ChevronDown size={14} />
                    </button>
                    <button type="button" className="webhook-filter-icon-btn">
                      <Filter size={16} />
                    </button>
                  </div>
                </div>
                <div className="webhook-table-wrapper">
                  <table className="webhook-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                          Time
                        </th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingWebhookLogs ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem' }}>
                            <LoadingIndicator size="md" />
                          </td>
                        </tr>
                      ) : webhookLogsList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)' }}
                          >
                            No webhook logs
                          </td>
                        </tr>
                      ) : (
                        webhookLogsList.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>{log.time ?? (log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—')}</td>
                          <td>{log.event ?? '—'}</td>
                          <td>
                            <span className={`webhook-status ${String(log.status ?? '').toLowerCase()}`}>
                              {log.status ?? '—'}
                            </span>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="webhook-action-btn"
                              onClick={() => handleViewWebhookLogDetail(log.id)}
                            >
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {webhookLogsTotal > 0 && (
                  <div className="webhook-pagination">
                    <button
                      type="button"
                      className="webhook-pagination-link"
                      onClick={() => setWebhookLogsPage((p) => Math.max(1, p - 1))}
                      disabled={webhookLogsPage <= 1}
                    >
                      ← Prev
                    </button>
                    <div className="webhook-pagination-numbers">
                      <span>
                        Page {webhookLogsPage} of {Math.max(1, Math.ceil(webhookLogsTotal / webhookLogsPageSize))}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="webhook-pagination-link"
                      onClick={() => setWebhookLogsPage((p) => p + 1)}
                      disabled={webhookLogsPage >= Math.ceil(webhookLogsTotal / webhookLogsPageSize)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Create Webhook Modal */}
      <CreateWebhookModal
        isOpen={showCreateWebhookModal}
        onCancel={() => setShowCreateWebhookModal(false)}
        onSuccess={(data) => {
          console.log('Create Webhook:', data);
          // Handle the webhook creation logic here
          setShowCreateWebhookModal(false);
        }}
      />

      {/* Update Webhook URL Modal */}
      {showUpdateWebhookUrlModal && (
        <div
          className="webhook-update-url-overlay"
          onClick={() => !isUpdatingWebhookUrl && setShowUpdateWebhookUrlModal(false)}
        >
          <div
            className="webhook-update-url-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="webhook-update-url-header">
              <h2 className="webhook-update-url-title">Update Webhook URL</h2>
              <button
                type="button"
                className="webhook-update-url-close"
                onClick={() => !isUpdatingWebhookUrl && setShowUpdateWebhookUrlModal(false)}
                disabled={isUpdatingWebhookUrl}
              >
                <X size={20} />
              </button>
            </div>

            <div className="webhook-update-url-body">
              <label className="webhook-update-url-label">Webhook URL</label>
              <input
                type="text"
                className="webhook-update-url-input"
                value={webhookUrlDraft}
                onChange={(e) => setWebhookUrlDraft(e.target.value)}
                placeholder="https://yourserver.com/webhooks/trustichain"
                disabled={isUpdatingWebhookUrl}
              />
              <p className="webhook-update-url-hint">
                Make sure you use a publicly reachable HTTPS URL.
              </p>
            </div>

            <div className="webhook-update-url-actions">
              <button
                type="button"
                className="webhook-btn-copy"
                onClick={() => setShowUpdateWebhookUrlModal(false)}
                disabled={isUpdatingWebhookUrl}
              >
                Cancel
              </button>
              <button
                type="button"
                className="webhook-btn-primary"
                onClick={async () => {
                  const next = webhookUrlDraft.trim();
                  if (!next) return;
                  const token = localStorage.getItem('token');
                  if (!token) {
                    toast.error('Session expired. Please sign in again.');
                    return;
                  }
                  setIsUpdatingWebhookUrl(true);
                  try {
                    const res = await fetch(getApiUrl('api/business-suite/webhook/url'), {
                      method: 'PATCH',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ webhookUrl: next }),
                    });
                    const result = await res.json().catch(() => ({}));
                    if (result?.success) {
                      setWebhookUrl(next);
                      setShowUpdateWebhookUrlModal(false);
                      toast.success('Webhook URL saved.');
                    } else {
                      toast.error(result?.message || 'Failed to save webhook URL.');
                    }
                  } catch (e) {
                    console.error('Save webhook URL error:', e);
                    toast.error('Failed to save webhook URL.');
                  } finally {
                    setIsUpdatingWebhookUrl(false);
                  }
                }}
                disabled={isUpdatingWebhookUrl || !webhookUrlDraft.trim()}
              >
                {isUpdatingWebhookUrl ? <LoadingIndicator size="sm" /> : 'Save URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Log Detail Modal */}
      {showWebhookLogDetailModal && (
        <div
          className="webhook-log-detail-overlay"
          onClick={() => !isLoadingWebhookLogDetail && setShowWebhookLogDetailModal(false)}
        >
          <div
            className="webhook-log-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="webhook-log-detail-header">
              <h2 className="webhook-log-detail-title">Webhook Log Details</h2>
              <button
                type="button"
                className="webhook-log-detail-close"
                onClick={() => !isLoadingWebhookLogDetail && setShowWebhookLogDetailModal(false)}
                disabled={isLoadingWebhookLogDetail}
              >
                <X size={20} />
              </button>
            </div>

            <div className="webhook-log-detail-body">
              {isLoadingWebhookLogDetail ? (
                <div className="webhook-log-detail-loading">
                  <LoadingIndicator size="md" />
                </div>
              ) : !webhookLogDetail ? (
                <div className="webhook-log-detail-empty">Failed to load webhook log details</div>
              ) : (
                <>
                  <div className="webhook-log-detail-grid">
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Event</span>
                    <span className="webhook-log-detail-value">{webhookLogDetail.event ?? '—'}</span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Status</span>
                    <span className="webhook-log-detail-value">{webhookLogDetail.status ?? '—'}</span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Time</span>
                    <span className="webhook-log-detail-value">{webhookLogDetail.time ?? '—'}</span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Retry</span>
                    <span className="webhook-log-detail-value">{retryCount ?? '—'}</span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Response Code</span>
                    <span className="webhook-log-detail-value">{responseCode ?? '—'}</span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Response Time</span>
                    <span className="webhook-log-detail-value">
                      {responseTimeMs != null ? `${responseTimeMs} ms` : '—'}
                    </span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Created At</span>
                    <span className="webhook-log-detail-value">
                      {webhookLogDetail.createdAt
                        ? new Date(webhookLogDetail.createdAt).toLocaleString('en-US')
                        : '—'}
                    </span>
                  </div>
                  <div className="webhook-log-detail-row">
                    <span className="webhook-log-detail-label">Log ID</span>
                    <span className="webhook-log-detail-value">{webhookLogDetail.id ?? '—'}</span>
                  </div>
                </div>

                <div className="webhook-log-detail-actions">
                  <button
                    type="button"
                    className="webhook-log-detail-replay-btn"
                    onClick={handleReplayWebhookLog}
                    disabled={!webhookLogDetail?.id || isLoadingWebhookLogDetail}
                  >
                    Replay Event
                  </button>
                </div>

                {webhookPayloadText && (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="webhook-log-detail-section-title">Payload</div>
                    <pre className="webhook-log-detail-payload-pre">{webhookPayloadText}</pre>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="webhook-notifications-title"
      />
    </div>
  );
};

export default Webhook;

