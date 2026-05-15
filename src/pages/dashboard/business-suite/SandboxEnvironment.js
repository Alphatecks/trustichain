import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  ChevronRight,
  ChevronDown,
  Calendar,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  X,
  Copy,
  Filter,
  FileText,
  Repeat
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './SandboxEnvironment.css';
import logo from '../../../assets/images/icons/logo.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import CreateSandboxKeyModal from '../../../components/CreateSandboxKeyModal';

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

const SandboxEnvironment = () => {
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
  const [showCreateSandboxKeyModal, setShowCreateSandboxKeyModal] = useState(false);
  const [sandboxStats, setSandboxStats] = useState(null);
  const [isLoadingSandboxStats, setIsLoadingSandboxStats] = useState(true);
  const [isResettingSandbox, setIsResettingSandbox] = useState(false);

  const [sandboxTestCopyValues, setSandboxTestCopyValues] = useState({});
  const [activeSandboxTest, setActiveSandboxTest] = useState(null);

  const [sandboxKeysList, setSandboxKeysList] = useState([]);
  const [isLoadingSandboxKeys, setIsLoadingSandboxKeys] = useState(false);
  const [sandboxKeysTotal, setSandboxKeysTotal] = useState(0);
  const [sandboxKeysPage, setSandboxKeysPage] = useState(1);
  const sandboxKeysPageSize = 20;

  const [sandboxKeyDetail, setSandboxKeyDetail] = useState(null);
  const [isLoadingSandboxKeyDetail, setIsLoadingSandboxKeyDetail] = useState(false);
  const [showSandboxKeyDetailModal, setShowSandboxKeyDetailModal] = useState(false);

  const [sandboxLogsList, setSandboxLogsList] = useState([]);
  const [isLoadingSandboxLogs, setIsLoadingSandboxLogs] = useState(false);
  const [sandboxLogsTotal, setSandboxLogsTotal] = useState(0);
  const [sandboxLogsPage, setSandboxLogsPage] = useState(1);
  const sandboxLogsPageSize = 20;
  const sandboxLogsStatus = 'all';

  const formattedToday = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  const loadSandboxStats = useCallback(async () => {
    if (accountType !== 'Business Suite') {
      setSandboxStats(null);
      setIsLoadingSandboxStats(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSandboxStats(null);
      setIsLoadingSandboxStats(false);
      return;
    }

    setIsLoadingSandboxStats(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/sandbox/stats'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setSandboxStats(result.data);
      } else {
        setSandboxStats(null);
      }
    } catch (e) {
      console.error('Sandbox stats error:', e);
      setSandboxStats(null);
    } finally {
      setIsLoadingSandboxStats(false);
    }
  }, [accountType]);

  useEffect(() => {
    loadSandboxStats();
  }, [loadSandboxStats]);

  const loadSandboxKeys = useCallback(async () => {
    if (accountType !== 'Business Suite') {
      setSandboxKeysList([]);
      setSandboxKeysTotal(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSandboxKeysList([]);
      setSandboxKeysTotal(0);
      return;
    }

    setIsLoadingSandboxKeys(true);
    try {
      const dateRange = 'monthly';
      const status = 'all';
      const res = await fetch(
        getApiUrl(
          `api/business-suite/sandbox/keys?status=${encodeURIComponent(status)}&dateRange=${encodeURIComponent(dateRange)}&page=${sandboxKeysPage}&pageSize=${sandboxKeysPageSize}`
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
        setSandboxKeysList(Array.isArray(result.data.keys) ? result.data.keys : []);
        setSandboxKeysTotal(Number(result.data.total ?? 0));
      } else {
        setSandboxKeysList([]);
        setSandboxKeysTotal(0);
      }
    } catch (e) {
      console.error('Sandbox keys list error:', e);
      setSandboxKeysList([]);
      setSandboxKeysTotal(0);
    } finally {
      setIsLoadingSandboxKeys(false);
    }
  }, [accountType, sandboxKeysPage]);

  useEffect(() => {
    loadSandboxKeys();
  }, [loadSandboxKeys]);

  const loadSandboxLogs = useCallback(async () => {
    if (accountType !== 'Business Suite') {
      setSandboxLogsList([]);
      setSandboxLogsTotal(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSandboxLogsList([]);
      setSandboxLogsTotal(0);
      return;
    }

    setIsLoadingSandboxLogs(true);
    try {
      const res = await fetch(
        getApiUrl(
          `api/business-suite/sandbox/logs?status=${encodeURIComponent(sandboxLogsStatus)}&page=${sandboxLogsPage}&pageSize=${sandboxLogsPageSize}`
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
        setSandboxLogsList(Array.isArray(result.data.logs) ? result.data.logs : []);
        setSandboxLogsTotal(Number(result.data.total ?? 0));
      } else {
        setSandboxLogsList([]);
        setSandboxLogsTotal(0);
      }
    } catch (e) {
      console.error('Sandbox logs error:', e);
      setSandboxLogsList([]);
      setSandboxLogsTotal(0);
    } finally {
      setIsLoadingSandboxLogs(false);
    }
  }, [accountType, sandboxLogsPage]);

  useEffect(() => {
    loadSandboxLogs();
  }, [loadSandboxLogs]);

  const handleViewSandboxKeyDetail = useCallback(async (keyId) => {
    if (!keyId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setShowSandboxKeyDetailModal(true);
    setIsLoadingSandboxKeyDetail(true);
    setSandboxKeyDetail(null);

    try {
      const res = await fetch(getApiUrl(`api/business-suite/sandbox/keys/${keyId}`), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        setSandboxKeyDetail(result.data);
      } else {
        setSandboxKeyDetail(null);
      }
    } catch (e) {
      console.error('Sandbox key detail error:', e);
      setSandboxKeyDetail(null);
    } finally {
      setIsLoadingSandboxKeyDetail(false);
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

  const handleResetSandbox = () => {
    // Reset sandbox data via API, then refresh stats.
    (async () => {
      if (isResettingSandbox) return;

      if (accountType !== 'Business Suite') {
        toast.error('Sandbox reset is only available in Business Suite');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      setIsResettingSandbox(true);
      try {
        const res = await fetch(getApiUrl('api/business-suite/sandbox/reset'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const result = await res.json().catch(() => ({}));
        if (result?.success) {
          toast.success('Sandbox reset successfully');
          await loadSandboxStats();
        } else {
          toast.error(result?.message || 'Failed to reset sandbox');
        }
      } catch (e) {
        console.error('Reset sandbox error:', e);
        toast.error('Failed to reset sandbox');
      } finally {
        setIsResettingSandbox(false);
      }
    })();
  };

  const handleCreateSandboxKey = () => {
    setShowCreateSandboxKeyModal(true);
  };

  const handleTestAction = async (actionKey) => {
    if (accountType !== 'Business Suite') {
      toast.error('Sandbox testing is only available in Business Suite');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    // actionKey maps to { endpoint, copyValueField } below.
    const apiMap = {
      'test-wallet': 'api/business-suite/sandbox/test-wallet/generate',
      'test-escrow': 'api/business-suite/sandbox/test-escrow/create',
      'subscription-renewal': 'api/business-suite/sandbox/subscription-renewal/simulate',
      dispute: 'api/business-suite/sandbox/dispute/simulate',
      'payment-success': 'api/business-suite/sandbox/payment-success/simulate',
      'failed-payment': 'api/business-suite/sandbox/payment-failed/simulate',
    };

    const apiPath = apiMap[actionKey];
    if (!apiPath) return;

    setActiveSandboxTest(actionKey);
    try {
      const res = await fetch(getApiUrl(apiPath), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const result = await res.json().catch(() => ({}));
      if (result?.success && result?.data) {
        const copyValue =
          result.data.copyValue ??
          result.data.address ??
          result.data.escrowId ??
          result.data.reference ??
          '';

        setSandboxTestCopyValues((prev) => ({ ...prev, [actionKey]: copyValue }));
        toast.success(result?.message || 'Sandbox test executed');
      } else {
        toast.error(result?.message || result?.error || 'Failed to execute sandbox test');
      }
    } catch (e) {
      console.error('Sandbox test error:', e);
      toast.error('Failed to execute sandbox test');
    } finally {
      setActiveSandboxTest(null);
    }
  };

  const handleCopyAction = async (actionKey) => {
    const value = sandboxTestCopyValues[actionKey];
    if (!value) {
      toast.error('Nothing to copy yet. Run the test first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (e) {
      console.error('Copy error:', e);
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="dashboard sandbox-environment-dashboard">
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
              <span className="breadcrumb-current">Sandbox Environment</span>
            </div>

            {/* Action Buttons */}
            <div className="sandbox-page-header">
              <button
                type="button"
                className="sandbox-reset-btn"
                onClick={handleResetSandbox}
                disabled={isResettingSandbox}
              >
                {isResettingSandbox ? <LoadingIndicator size="sm" /> : 'Reset Sandbox Data'}
              </button>
              <button
                type="button"
                className="sandbox-create-btn"
                onClick={handleCreateSandboxKey}
              >
                <Plus size={18} />
                Create Sandbox Key
              </button>
            </div>

            {/* Summary Cards */}
            <div className="sandbox-summary-cards">
              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Total Sandbox Keys</h3>
                  </div>
                  {isLoadingSandboxStats ? (
                    <span className="sandbox-trend-badge positive">
                      <LoadingIndicator size="sm" />
                    </span>
                  ) : (
                    (() => {
                      const tp = Number(sandboxStats?.totalSandboxKeys?.trendPercent ?? 0);
                      const positive = Number.isNaN(tp) ? true : tp >= 0;
                      return (
                        <span className={`sandbox-trend-badge ${positive ? 'positive' : 'negative'}`}>
                          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Number.isNaN(tp) ? '+0.0%' : `${positive ? '+' : ''}${tp}%`}
                        </span>
                      );
                    })()
                  )}
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">
                    {isLoadingSandboxStats ? (
                      '—'
                    ) : (
                      sandboxStats?.totalSandboxKeys?.value ?? '—'
                    )}
                  </span>
                </div>
                <div className="sandbox-card-subtitle">
                  {isLoadingSandboxStats ? '—' : (sandboxStats?.totalSandboxKeys?.secondary ?? sandboxStats?.totalSandboxKeys?.period ?? '—')}
                </div>
              </div>

              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Sandbox Transactions</h3>
                  </div>
                  {isLoadingSandboxStats ? (
                    <span className="sandbox-trend-badge positive">
                      <LoadingIndicator size="sm" />
                    </span>
                  ) : (
                    (() => {
                      const tp = Number(sandboxStats?.sandboxTransactions?.trendPercent ?? 0);
                      const positive = Number.isNaN(tp) ? true : tp >= 0;
                      return (
                        <span className={`sandbox-trend-badge ${positive ? 'positive' : 'negative'}`}>
                          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {Number.isNaN(tp) ? '+0.0%' : `${positive ? '+' : ''}${tp}%`}
                        </span>
                      );
                    })()
                  )}
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">
                    {isLoadingSandboxStats ? '—' : (sandboxStats?.sandboxTransactions?.value ?? '—')}
                  </span>
                </div>
                <div className="sandbox-card-period">
                  {isLoadingSandboxStats ? '—' : (sandboxStats?.sandboxTransactions?.period ?? '—')}
                </div>
              </div>

              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Errors (24h)</h3>
                  </div>
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">
                    {isLoadingSandboxStats ? '—' : (sandboxStats?.errors24h?.value ?? '—')}
                  </span>
                </div>
                <div className="sandbox-card-period">
                  {isLoadingSandboxStats ? '—' : (sandboxStats?.errors24h?.period ?? '—')}
                </div>
              </div>

              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Test Wallets</h3>
                  </div>
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">
                    {isLoadingSandboxStats ? '—' : (sandboxStats?.testWallets?.value ?? '—')}
                  </span>
                </div>
                <div className="sandbox-card-period">
                  {isLoadingSandboxStats ? '—' : (sandboxStats?.testWallets?.period ?? '—')}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="sandbox-content-grid">
              {/* Testing Tools Section */}
              <div className="sandbox-section-card">
                <div className="sandbox-section-header">
                  <div className="sandbox-section-indicator"></div>
                  <h2 className="sandbox-section-title">TESTING TOOLS</h2>
                </div>
                <div className="sandbox-testing-tools">
                  <div className="sandbox-test-item">
                    <div className="sandbox-test-label">Test wallet</div>
                    <div className="sandbox-test-actions">
                      <button 
                        type="button"
                        className="sandbox-test-btn-primary"
                        onClick={() => handleTestAction('test-wallet')}
                        disabled={activeSandboxTest === 'test-wallet'}
                      >
                        {activeSandboxTest === 'test-wallet' ? <LoadingIndicator size="sm" /> : 'Generate'}
                      </button>
                      <button 
                        type="button"
                        className="sandbox-test-btn-copy"
                        onClick={() => handleCopyAction('test-wallet')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="sandbox-test-item">
                    <div className="sandbox-test-label">Test Escrow</div>
                    <div className="sandbox-test-actions">
                      <button 
                        type="button"
                        className="sandbox-test-btn-primary"
                        onClick={() => handleTestAction('test-escrow')}
                        disabled={activeSandboxTest === 'test-escrow'}
                      >
                        {activeSandboxTest === 'test-escrow' ? <LoadingIndicator size="sm" /> : 'Create'}
                      </button>
                      <button 
                        type="button"
                        className="sandbox-test-btn-copy"
                        onClick={() => handleCopyAction('test-escrow')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="sandbox-test-item">
                    <div className="sandbox-test-label">Subscription Renewal</div>
                    <div className="sandbox-test-actions">
                      <button 
                        type="button"
                        className="sandbox-test-btn-primary"
                        onClick={() => handleTestAction('subscription-renewal')}
                        disabled={activeSandboxTest === 'subscription-renewal'}
                      >
                        {activeSandboxTest === 'subscription-renewal' ? <LoadingIndicator size="sm" /> : 'Simulate'}
                      </button>
                      <button 
                        type="button"
                        className="sandbox-test-btn-copy"
                        onClick={() => handleCopyAction('subscription-renewal')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="sandbox-test-item">
                    <div className="sandbox-test-label">Dispute</div>
                    <div className="sandbox-test-actions">
                      <button 
                        type="button"
                        className="sandbox-test-btn-primary"
                        onClick={() => handleTestAction('dispute')}
                        disabled={activeSandboxTest === 'dispute'}
                      >
                        {activeSandboxTest === 'dispute' ? <LoadingIndicator size="sm" /> : 'Simulate'}
                      </button>
                      <button 
                        type="button"
                        className="sandbox-test-btn-copy"
                        onClick={() => handleCopyAction('dispute')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="sandbox-test-item">
                    <div className="sandbox-test-label">Payment Success</div>
                    <div className="sandbox-test-actions">
                      <button 
                        type="button"
                        className="sandbox-test-btn-primary"
                        onClick={() => handleTestAction('payment-success')}
                        disabled={activeSandboxTest === 'payment-success'}
                      >
                        {activeSandboxTest === 'payment-success' ? <LoadingIndicator size="sm" /> : 'Simulate'}
                      </button>
                      <button 
                        type="button"
                        className="sandbox-test-btn-copy"
                        onClick={() => handleCopyAction('payment-success')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="sandbox-test-item">
                    <div className="sandbox-test-label">Failed Payment</div>
                    <div className="sandbox-test-actions">
                      <button 
                        type="button"
                        className="sandbox-test-btn-primary"
                        onClick={() => handleTestAction('failed-payment')}
                        disabled={activeSandboxTest === 'failed-payment'}
                      >
                        {activeSandboxTest === 'failed-payment' ? <LoadingIndicator size="sm" /> : 'Simulate'}
                      </button>
                      <button 
                        type="button"
                        className="sandbox-test-btn-copy"
                        onClick={() => handleCopyAction('failed-payment')}
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sandbox Keys Table */}
              <div className="sandbox-section-card">
                <div className="sandbox-section-header">
                  <div className="sandbox-section-indicator"></div>
                  <h2 className="sandbox-section-title">SANDBOX KEYS</h2>
                </div>
                <div className="sandbox-table-header">
                  <div className="sandbox-filters">
                    <button type="button" className="sandbox-filter-btn">
                      <Filter size={14} />
                      Filter
                    </button>
                    <button type="button" className="sandbox-filter-btn">
                      <Calendar size={14} />
                      {selectedMonth}
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <button type="button" className="sandbox-filter-icon-btn">
                    <Filter size={16} />
                  </button>
                </div>
                <div className="sandbox-table-wrapper">
                  <table className="sandbox-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>NAME</th>
                        <th>PUBLIC KEY</th>
                        <th>Status</th>
                        <th>Date created</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingSandboxKeys ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1.25rem' }}>
                            <LoadingIndicator size="md" />
                          </td>
                        </tr>
                      ) : sandboxKeysList.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)' }}>
                            No sandbox keys
                          </td>
                        </tr>
                      ) : (
                        sandboxKeysList.map((key) => (
                          <tr key={key.id}>
                            <td>
                              <input type="checkbox" />
                            </td>
                            <td>{key.name}</td>
                            <td className="sandbox-public-key">{key.publicKey}</td>
                            <td>
                              <span className={`sandbox-status ${String(key.status ?? '').toLowerCase()}`}>
                                {key.status}
                              </span>
                            </td>
                            <td>{key.dateCreated}</td>
                            <td>
                              <button
                                type="button"
                                className="sandbox-action-btn"
                                onClick={() => handleViewSandboxKeyDetail(key.id)}
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

                {sandboxKeysTotal > 0 && (
                  <div className="sandbox-keys-pagination">
                    <button
                      type="button"
                      className="sandbox-keys-pagination-btn"
                      disabled={sandboxKeysPage <= 1}
                      onClick={() => setSandboxKeysPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span className="sandbox-keys-pagination-info">
                      Page {sandboxKeysPage} of {Math.max(1, Math.ceil(sandboxKeysTotal / sandboxKeysPageSize))}
                    </span>
                    <button
                      type="button"
                      className="sandbox-keys-pagination-btn"
                      disabled={sandboxKeysPage >= Math.ceil(sandboxKeysTotal / sandboxKeysPageSize)}
                      onClick={() => setSandboxKeysPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Sandbox Logs Table */}
              <div className="sandbox-section-card">
                <div className="sandbox-section-header">
                  <div className="sandbox-section-indicator"></div>
                  <h2 className="sandbox-section-title">SANDBOX LOGS</h2>
                </div>
                <div className="sandbox-table-wrapper">
                  <table className="sandbox-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingSandboxLogs ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '1.25rem' }}>
                            <LoadingIndicator size="md" />
                          </td>
                        </tr>
                      ) : sandboxLogsList.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)' }}>
                            No sandbox logs
                          </td>
                        </tr>
                      ) : (
                        sandboxLogsList.map((log) => {
                          const fallbackTime = log.createdAt
                            ? new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                            : '—';
                          return (
                            <tr key={log.id}>
                              <td>
                                <input type="checkbox" />
                              </td>
                              <td>{log.time ?? fallbackTime}</td>
                              <td>{log.event ?? '—'}</td>
                              <td>
                                <span className={`sandbox-status ${String(log.status ?? '').toLowerCase()}`}>
                                  {log.status ?? '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {sandboxLogsTotal > 0 && (
                  <div className="sandbox-keys-pagination">
                    <button
                      type="button"
                      className="sandbox-keys-pagination-btn"
                      disabled={sandboxLogsPage <= 1}
                      onClick={() => setSandboxLogsPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <span className="sandbox-keys-pagination-info">
                      Page {sandboxLogsPage} of {Math.max(1, Math.ceil(sandboxLogsTotal / sandboxLogsPageSize))}
                    </span>
                    <button
                      type="button"
                      className="sandbox-keys-pagination-btn"
                      disabled={sandboxLogsPage >= Math.ceil(sandboxLogsTotal / sandboxLogsPageSize)}
                      onClick={() => setSandboxLogsPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Create Sandbox Key Modal */}
      <CreateSandboxKeyModal
        isOpen={showCreateSandboxKeyModal}
        onCancel={() => setShowCreateSandboxKeyModal(false)}
        onSuccess={() => {
          setShowCreateSandboxKeyModal(false);
          loadSandboxStats();
          loadSandboxKeys();
        }}
      />

      {/* Sandbox Key Detail Modal */}
      {showSandboxKeyDetailModal && (
        <div
          className="sandbox-key-detail-overlay"
          onClick={() => setShowSandboxKeyDetailModal(false)}
        >
          <div className="sandbox-key-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sandbox-key-detail-header">
              <h2 className="sandbox-key-detail-title">Sandbox key details</h2>
              <button
                type="button"
                className="sandbox-key-detail-close"
                onClick={() => setShowSandboxKeyDetailModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="sandbox-key-detail-body">
              {isLoadingSandboxKeyDetail ? (
                <div className="sandbox-key-detail-loading">
                  <LoadingIndicator size="md" />
                </div>
              ) : !sandboxKeyDetail ? (
                <div className="sandbox-key-detail-empty">Failed to load sandbox key details</div>
              ) : (
                <div className="sandbox-key-detail-grid">
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Name</span>
                    <span className="sandbox-key-detail-value">{sandboxKeyDetail.name ?? '—'}</span>
                  </div>
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Environment</span>
                    <span className="sandbox-key-detail-value">{sandboxKeyDetail.environmentName ?? '—'}</span>
                  </div>
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Purpose</span>
                    <span className="sandbox-key-detail-value">{sandboxKeyDetail.environmentPurpose ?? '—'}</span>
                  </div>
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Status</span>
                    <span className="sandbox-key-detail-value">{sandboxKeyDetail.status ?? '—'}</span>
                  </div>
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Public Key</span>
                    <span className="sandbox-key-detail-value sandbox-public-key">{sandboxKeyDetail.publicKey ?? '—'}</span>
                  </div>
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Permissions</span>
                    <span className="sandbox-key-detail-value">
                      {Array.isArray(sandboxKeyDetail.permissions) ? sandboxKeyDetail.permissions.join(', ') : '—'}
                    </span>
                  </div>
                  <div className="sandbox-key-detail-row">
                    <span className="sandbox-key-detail-label">Created At</span>
                    <span className="sandbox-key-detail-value">
                      {sandboxKeyDetail.createdAt ?? sandboxKeyDetail.dateCreated ?? '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="sandbox-notifications-title"
      />
    </div>
  );
};

export default SandboxEnvironment;

