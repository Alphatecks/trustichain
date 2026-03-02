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
  Repeat,
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
  X,
  Copy,
  Filter
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './SandboxEnvironment.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CreateSandboxKeyModal from '../../../components/CreateSandboxKeyModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'Transaction', icon: Repeat, badge: null }
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

const SandboxEnvironment = () => {
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
  const [selectedMonth, setSelectedMonth] = useState('Monthly');
  const [showCreateSandboxKeyModal, setShowCreateSandboxKeyModal] = useState(false);

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
          setUserAvatar(data.avatar || data.profilePicture || data.image || data.photo || null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  // Sample sandbox keys data
  const sandboxKeys = [
    {
      id: 1,
      name: 'Sandbox Main',
      publicKey: 'sbx_pub_834jjklm90asdf23',
      status: 'Successful',
      dateCreated: '2024-07-04'
    },
    {
      id: 2,
      name: 'Sandbox Test',
      publicKey: 'sbx_pub_12op9sd8hf77qwla92kd',
      status: 'Successful',
      dateCreated: '2024-07-03'
    },
    {
      id: 3,
      name: 'Sandbox Dev',
      publicKey: 'sbx_pub_34rt8yu9jk12qwer45ty',
      status: 'Successful',
      dateCreated: '2024-07-02'
    }
  ];

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
          setUserAvatar(data.avatar || data.profilePicture || data.image || data.photo || null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  // Sample sandbox logs data
  const sandboxLogs = [
    {
      id: 1,
      time: '12:04 PM',
      event: 'Escrow#344 Created',
      status: 'OK'
    },
    {
      id: 2,
      time: '11:30 AM',
      event: 'Payment Failed (Test Card)',
      status: 'ERROR'
    },
    {
      id: 3,
      time: '12:04 PM',
      event: 'Escrow#344 Created',
      status: 'OK'
    },
    {
      id: 4,
      time: '11:30 AM',
      event: 'Payment Failed (Test Card)',
      status: 'ERROR'
    }
  ];

  const handleNavClick = (item) => {
    if (item.label === 'Dashboard') {
      navigate('/dashboard', { state: { accountType: 'Business Suite' } });
    } else if (item.label === 'Payroll') {
      navigate('/payroll');
    } else if (item.label === 'Supplier Contract') {
      navigate('/supplier-contract');
    } else if (item.label === 'Dispute') {
      navigate('/business-dispute');
    } else if (item.label === 'Transaction') {
      navigate('/transactions', { state: { accountType: 'Business Suite' } });
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
    console.log('Reset Sandbox Data clicked');
    // Placeholder - no actual API call
  };

  const handleCreateSandboxKey = () => {
    setShowCreateSandboxKeyModal(true);
  };

  const handleTestAction = (action) => {
    console.log(`${action} clicked`);
    // Placeholder - no actual API call
  };

  const handleCopyAction = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard:', text);
    });
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
                                   (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/'))) ||
                                   (item.label === 'Transaction' && location.pathname === '/transactions');
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
                    {accountType === 'Business Suite' && businessCompanyLogoUrl ? (
                      <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} className="user-avatar-img" />
                    ) : userAvatar ? (
                      <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">
                      {accountType === 'Business Suite' && businessCompanyName
                        ? (isLoadingBusinessKyc ? <LoadingIndicator size="sm" /> : businessCompanyName)
                        : (isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName)}
                      <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                    </span>
                    <small>{accountType === 'Business Suite' ? 'Business' : (userRole || '')}</small>
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
              >
                Reset Sandbox Data
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
                  <span className="sandbox-trend-badge positive">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">$45,280</span>
                </div>
                <div className="sandbox-card-subtitle">$16,789 locked</div>
              </div>

              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Sandbox Transactions</h3>
                  </div>
                  <span className="sandbox-trend-badge positive">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">45</span>
                </div>
                <div className="sandbox-card-period">This month</div>
              </div>

              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Errors (24h)</h3>
                  </div>
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">23</span>
                </div>
                <div className="sandbox-card-period">This month</div>
              </div>

              <div className="sandbox-summary-card">
                <div className="sandbox-card-header">
                  <div className="sandbox-card-header-left">
                    <div className="sandbox-card-indicator"></div>
                    <h3>Test Wallets</h3>
                  </div>
                </div>
                <div className="sandbox-card-value">
                  <span className="sandbox-main-value">7</span>
                </div>
                <div className="sandbox-card-period">This month</div>
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
                        onClick={() => handleTestAction('Generate')}
                      >
                        Generate
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
                        onClick={() => handleTestAction('Create')}
                      >
                        Create
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
                        onClick={() => handleTestAction('Simulate')}
                      >
                        Simulate
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
                        onClick={() => handleTestAction('Simulate')}
                      >
                        Simulate
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
                        onClick={() => handleTestAction('Simulate')}
                      >
                        Simulate
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
                        onClick={() => handleTestAction('Simulate')}
                      >
                        Simulate
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
                      {sandboxKeys.map((key) => (
                        <tr key={key.id}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>{key.name}</td>
                          <td className="sandbox-public-key">{key.publicKey}</td>
                          <td>
                            <span className={`sandbox-status ${key.status.toLowerCase()}`}>
                              {key.status}
                            </span>
                          </td>
                          <td>{key.dateCreated}</td>
                          <td>
                            <button 
                              type="button" 
                              className="sandbox-action-btn"
                              onClick={() => {
                                console.log('View details for:', key.name);
                              }}
                            >
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                      {sandboxLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>{log.time}</td>
                          <td>{log.event}</td>
                          <td>
                            <span className={`sandbox-status ${log.status.toLowerCase()}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Create Sandbox Key Modal */}
      <CreateSandboxKeyModal
        isOpen={showCreateSandboxKeyModal}
        onCancel={() => setShowCreateSandboxKeyModal(false)}
        onSuccess={(data) => {
          console.log('Create Sandbox Key:', data);
          // Handle the sandbox key creation logic here
          setShowCreateSandboxKeyModal(false);
        }}
      />
    </div>
  );
};

export default SandboxEnvironment;

