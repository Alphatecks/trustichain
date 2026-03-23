import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
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
  CheckCircle,
  X
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './APIKeys.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CreateApiKeyModal from '../../../components/CreateApiKeyModal';
import ApiKeyDetailsModal from '../../../components/ApiKeyDetailsModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
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

const normalizeCompanyLogoUrl = (data) => {
  const raw = data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

const APIKeys = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
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
  const [keyTypeFilter, setKeyTypeFilter] = useState('All');
  const [keysList, setKeysList] = useState([]);
  const [keysTotal, setKeysTotal] = useState(0);
  const [keysPage, setKeysPage] = useState(1);
  const [keysPageSize] = useState(20);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [keysError, setKeysError] = useState(null);
  const [keysRefreshKey, setKeysRefreshKey] = useState(0);
  const [selectedMonthValue, setSelectedMonthValue] = useState(null); // YYYY-MM or null
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [overview, setOverview] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);

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
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingOverview(false);
      setOverviewError('Unauthorized');
      return;
    }
    let cancelled = false;
    setIsLoadingOverview(true);
    setOverviewError(null);
    fetch(getApiUrl('api/business-suite/api-keys/overview'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          setOverview(result.data);
          setOverviewError(null);
        } else {
          setOverview(null);
          const msg = result?.message || result?.error || 'Failed to load overview';
          setOverviewError(msg);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverview(null);
          setOverviewError('Failed to load overview');
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingOverview(false); });
    return () => { cancelled = true; };
  }, [overviewRefreshKey]);

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
          if (firstName && lastName) {
            initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
          } else if (fullName) {
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

  // List API keys with filters and pagination
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingKeys(false);
      setKeysError('Unauthorized');
      return;
    }
    const typeParam = keyTypeFilter === 'All' ? '' : keyTypeFilter === 'Main Key' ? 'main' : keyTypeFilter === 'Mobile Key' ? 'mobile' : keyTypeFilter === 'Backend Key' ? 'backend' : '';
    const params = new URLSearchParams();
    params.set('page', String(keysPage));
    params.set('pageSize', String(keysPageSize));
    if (typeParam) params.set('type', typeParam);
    if (selectedMonthValue) params.set('month', selectedMonthValue);
    const url = `${getApiUrl('api/business-suite/api-keys')}?${params.toString()}`;
    let cancelled = false;
    setIsLoadingKeys(true);
    setKeysError(null);
    fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          setKeysList(result.data.keys || []);
          setKeysTotal(result.data.total ?? 0);
          setKeysError(null);
        } else {
          setKeysList([]);
          setKeysTotal(0);
          setKeysError(result?.message || result?.error || 'Failed to load API keys');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setKeysList([]);
          setKeysTotal(0);
          setKeysError('Failed to load API keys');
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingKeys(false); });
    return () => { cancelled = true; };
  }, [keyTypeFilter, keysPage, keysPageSize, selectedMonthValue, keysRefreshKey]);

  const formatKeyDate = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const formatLastUsed = (iso) => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}hrs ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return formatKeyDate(iso);
    } catch {
      return iso;
    }
  };

  const totalPages = Math.max(1, Math.ceil(keysTotal / keysPageSize));

  const handleNavClick = (item) => {
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

  const handleDevelopersNavClick = (item) => {
    if (item.label === 'Api Keys') {
      navigate('/api-keys');
    } else if (item.label === 'Sand box enviroment') {
      navigate('/sandbox-environment');
    } else if (item.label === 'Web hook') {
      navigate('/webhook');
    }
  };

  return (
    <div className="dashboard api-keys-dashboard">
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
                  return (
                    <button key={item.label} type="button" className="sidebar-nav-item">
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
                <span className="sidebar-trustiscore-badge">97</span>
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
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {accountType === 'Business Suite' ? (
                        isLoadingBusinessKyc || !businessCompanyName ? (
                          <LoadingIndicator size="sm" />
                        ) : (
                          businessCompanyName
                        )
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

            {/* Breadcrumb + Create API Key */}
            <div className="api-keys-breadcrumb-row">
              <div className="card-breadcrumb">
                <span className="breadcrumb-root">Business Suite</span>
                <span className="breadcrumb-divider">›</span>
                <span className="breadcrumb-current">API Keys</span>
              </div>
              <button
                type="button"
                className="api-keys-create-btn"
                onClick={() => setShowCreateApiKeyModal(true)}
              >
                <Plus size={18} />
                Create Api Key
              </button>
            </div>

            {/* Summary Cards - from api/business-suite/api-keys/overview */}
            <div className="api-keys-summary-cards">
              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>Total Active Keys</h3>
                  </div>
                  {overview?.totalActiveKeys?.trendPercent != null && (
                    <span className={`api-keys-trend-badge ${Number(overview.totalActiveKeys.trendPercent) >= 0 ? 'positive' : 'negative'}`}>
                      <TrendingUp size={14} />
                      {Number(overview.totalActiveKeys.trendPercent) >= 0 ? '+' : ''}{overview.totalActiveKeys.trendPercent}%
                    </span>
                  )}
                </div>
                <div className="api-keys-card-value">
                  {isLoadingOverview ? (
                    <LoadingIndicator size="sm" />
                  ) : overviewError || overview?.totalActiveKeys?.value == null ? (
                    <span className="api-keys-main-value">—</span>
                  ) : (
                    <span className="api-keys-main-value">{Number(overview.totalActiveKeys.value).toLocaleString()}</span>
                  )}
                </div>
                <div className="api-keys-card-period">{overview?.totalActiveKeys?.period || 'This month'}</div>
              </div>

              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>API Requests</h3>
                  </div>
                  {overview?.apiRequests?.trendPercent != null && (
                    <span className={`api-keys-trend-badge ${Number(overview.apiRequests.trendPercent) >= 0 ? 'positive' : 'negative'}`}>
                      <TrendingUp size={14} />
                      {Number(overview.apiRequests.trendPercent) >= 0 ? '+' : ''}{overview.apiRequests.trendPercent}%
                    </span>
                  )}
                </div>
                <div className="api-keys-card-value">
                  {isLoadingOverview ? (
                    <LoadingIndicator size="sm" />
                  ) : overviewError || overview?.apiRequests?.value == null ? (
                    <span className="api-keys-main-value">—</span>
                  ) : (
                    <span className="api-keys-main-value">{Number(overview.apiRequests.value).toLocaleString()}</span>
                  )}
                </div>
                <div className="api-keys-card-period">{overview?.apiRequests?.period || 'This month'}</div>
              </div>

              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>Failed Requests</h3>
                  </div>
                </div>
                <div className="api-keys-card-value">
                  {isLoadingOverview ? (
                    <LoadingIndicator size="sm" />
                  ) : overviewError || overview?.failedRequests?.value == null ? (
                    <span className="api-keys-main-value">—</span>
                  ) : (
                    <span className="api-keys-main-value">{Number(overview.failedRequests.value).toLocaleString()}</span>
                  )}
                </div>
                <div className="api-keys-card-subtitle">
                  {overview?.failedRequests?.percentOfTotalCalls != null ? `${overview.failedRequests.percentOfTotalCalls}% of total calls` : (overview?.failedRequests?.period || '')}
                </div>
              </div>

              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>Avg Latency</h3>
                  </div>
                </div>
                <div className="api-keys-card-value">
                  {isLoadingOverview ? (
                    <LoadingIndicator size="sm" />
                  ) : overviewError || overview?.avgLatencyMs?.value == null ? (
                    <span className="api-keys-main-value">—</span>
                  ) : (
                    <span className="api-keys-main-value">{Number(overview.avgLatencyMs.value)}ms</span>
                  )}
                </div>
                <div className="api-keys-card-period">{overview?.avgLatencyMs?.period || 'This month'}</div>
              </div>
            </div>

            {/* API Keys Table Section */}
            <div className="api-keys-table-section">
              <div className="api-keys-table-header">
                <div className="api-keys-tabs">
                  <button
                    type="button"
                    className={`api-keys-tab ${keyTypeFilter === 'All' ? 'active' : ''}`}
                    onClick={() => setKeyTypeFilter('All')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`api-keys-tab ${keyTypeFilter === 'Main Key' ? 'active' : ''}`}
                    onClick={() => setKeyTypeFilter('Main Key')}
                  >
                    Main Key
                  </button>
                  <button
                    type="button"
                    className={`api-keys-tab ${keyTypeFilter === 'Mobile Key' ? 'active' : ''}`}
                    onClick={() => setKeyTypeFilter('Mobile Key')}
                  >
                    Mobile Key
                  </button>
                  <button
                    type="button"
                    className={`api-keys-tab ${keyTypeFilter === 'Backend Key' ? 'active' : ''}`}
                    onClick={() => setKeyTypeFilter('Backend Key')}
                  >
                    Backend Key
                  </button>
                </div>
                <div className="api-keys-header-actions">
                  <button type="button" className="api-keys-date-filter">
                    <Calendar size={16} />
                    {selectedMonth}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="api-keys-table-wrapper">
                {keysError && (
                  <div className="api-keys-table-error" style={{ padding: '1rem', color: 'var(--color-error, #c00)' }}>
                    {keysError}
                  </div>
                )}
                <table className="api-keys-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>PUBLIC KEY</th>
                      <th>PERMISSION</th>
                      <th>STATUS</th>
                      <th>LAST USED</th>
                      <th>CREATED</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingKeys ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          <LoadingIndicator size="sm" />
                        </td>
                      </tr>
                    ) : keysList.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                          No API keys found
                        </td>
                      </tr>
                    ) : (
                      keysList.map((key) => (
                        <tr key={key.id}>
                          <td>{key.name}</td>
                          <td>
                            <button type="button" className="api-keys-public-key-link" onClick={() => { setSelectedKey(key); setShowDetailsModal(true); }}>
                              {key.publicKey || '—'}
                            </button>
                          </td>
                          <td>{key.permissionDisplay || key.permission || '—'}</td>
                          <td>
                            <span className={`api-keys-status ${(key.status || '').toLowerCase()}`}>
                              {key.status ? key.status.charAt(0).toUpperCase() + key.status.slice(1) : '—'}
                            </span>
                          </td>
                          <td>{formatLastUsed(key.lastUsedAt)}</td>
                          <td>{formatKeyDate(key.createdAt)}</td>
                          <td>
                            <button
                              type="button"
                              className="api-keys-action-btn"
                              onClick={() => { setSelectedKey(key); setShowDetailsModal(true); }}
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
              <div className="api-keys-pagination">
                <button
                  type="button"
                  className="api-keys-pagination-btn"
                  onClick={() => setKeysPage((p) => Math.max(1, p - 1))}
                  disabled={keysPage <= 1 || isLoadingKeys}
                >
                  Prev
                </button>
                <div className="api-keys-pagination-numbers">
                  <span className={keysPage === 1 ? 'active' : ''}>1</span>
                  {totalPages > 2 && <span>...</span>}
                  {keysPage > 1 && keysPage < totalPages && <span className="active">{keysPage}</span>}
                  {totalPages > 1 && <span className={keysPage === totalPages ? 'active' : ''}>{totalPages}</span>}
                </div>
                <button
                  type="button"
                  className="api-keys-pagination-btn"
                  onClick={() => setKeysPage((p) => Math.min(totalPages, p + 1))}
                  disabled={keysPage >= totalPages || isLoadingKeys}
                >
                  Next
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Create API Key Modal */}
      <CreateApiKeyModal
        isOpen={showCreateApiKeyModal}
        onCancel={() => setShowCreateApiKeyModal(false)}
        onSuccess={(data) => {
          if (data) {
            setKeysRefreshKey((k) => k + 1);
            setOverviewRefreshKey((k) => k + 1);
          }
          setShowCreateApiKeyModal(false);
        }}
      />

      {/* API Key Details Modal */}
      <ApiKeyDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedKey(null);
        }}
        keyData={selectedKey}
        onUpdated={() => {
          setKeysRefreshKey((k) => k + 1);
          setOverviewRefreshKey((k) => k + 1);
        }}
        onDeleted={() => {
          setShowDetailsModal(false);
          setSelectedKey(null);
          setKeysRefreshKey((k) => k + 1);
          setOverviewRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};

export default APIKeys;
