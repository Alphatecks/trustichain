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
  X
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './APIKeys.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CreateApiKeyModal from '../../../components/CreateApiKeyModal';
import ApiKeyDetailsModal from '../../../components/ApiKeyDetailsModal';

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
  const [currentPage, setCurrentPage] = useState(12);
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

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
          setUserAvatar(data.avatar || data.profilePicture || data.image || data.photo || null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  // Sample API keys data - expanded to fill space
  const apiKeys = [
    {
      id: 1,
      name: 'Backend Server Key',
      publicKey: 'pk_live_87GH2KD9JKL990ASDF23',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '2hrs ago',
      created: 'Oct 12, 2025',
      type: 'Backend Key'
    },
    {
      id: 2,
      name: 'Mobile App Key',
      publicKey: 'pk_live_12OP9SD8HF77QWLA92KD',
      permission: 'Read / Write',
      status: 'Active',
      lastUsed: '21.03.2021',
      created: '21.03.2021',
      type: 'Mobile Key'
    },
    {
      id: 3,
      name: 'Backend Server Key',
      publicKey: 'pk_live_34RT8YU9JK12QWER45TY',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '5hrs ago',
      created: 'Sep 28, 2025',
      type: 'Backend Key'
    },
    {
      id: 4,
      name: 'Backend Server Key',
      publicKey: 'pk_live_56FG9HI0KL34ZXCV67UI',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '1 day ago',
      created: 'Sep 15, 2025',
      type: 'Backend Key'
    },
    {
      id: 5,
      name: 'Main Key',
      publicKey: 'pk_live_78JK0LM1NO45ASDF89PO',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '3hrs ago',
      created: 'Aug 20, 2025',
      type: 'Main Key'
    },
    {
      id: 6,
      name: 'Backend Server Key',
      publicKey: 'pk_live_90MN1OP2QR56ZXCV89AB',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '4hrs ago',
      created: 'Sep 10, 2025',
      type: 'Backend Key'
    },
    {
      id: 7,
      name: 'Mobile App Key',
      publicKey: 'pk_live_23CD4EF5GH67IJKL90MN',
      permission: 'Read / Write',
      status: 'Active',
      lastUsed: '6hrs ago',
      created: 'Aug 25, 2025',
      type: 'Mobile Key'
    },
    {
      id: 8,
      name: 'Backend Server Key',
      publicKey: 'pk_live_45GH6IJ7KL89MNOP01QR',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '8hrs ago',
      created: 'Aug 15, 2025',
      type: 'Backend Key'
    },
    {
      id: 9,
      name: 'Main Key',
      publicKey: 'pk_live_67IJ8KL9MN01OPQR23ST',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '12hrs ago',
      created: 'Aug 5, 2025',
      type: 'Main Key'
    },
    {
      id: 10,
      name: 'Backend Server Key',
      publicKey: 'pk_live_89KL0MN1OP23QRST45UV',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '1 day ago',
      created: 'Jul 30, 2025',
      type: 'Backend Key'
    },
    {
      id: 11,
      name: 'Mobile App Key',
      publicKey: 'pk_live_01MN2OP3QR45STUV67WX',
      permission: 'Read / Write',
      status: 'Active',
      lastUsed: '2 days ago',
      created: 'Jul 20, 2025',
      type: 'Mobile Key'
    },
    {
      id: 12,
      name: 'Backend Server Key',
      publicKey: 'pk_live_23OP4QR5ST67UVWX89YZ',
      permission: 'Full Access',
      status: 'Active',
      lastUsed: '3 days ago',
      created: 'Jul 10, 2025',
      type: 'Backend Key'
    }
  ];

  const filteredKeys = keyTypeFilter === 'All' 
    ? apiKeys 
    : apiKeys.filter(key => key.type === keyTypeFilter);

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

            {/* Summary Cards */}
            <div className="api-keys-summary-cards">
              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>Total Active Keys</h3>
                  </div>
                  <span className="api-keys-trend-badge positive">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="api-keys-card-value">
                  <span className="api-keys-main-value">43</span>
                </div>
                <div className="api-keys-card-period">This month</div>
              </div>

              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>API Requests</h3>
                  </div>
                  <span className="api-keys-trend-badge positive">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="api-keys-card-value">
                  <span className="api-keys-main-value">12,943</span>
                </div>
                <div className="api-keys-card-period">This month</div>
              </div>

              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>Failed Requests</h3>
                  </div>
                </div>
                <div className="api-keys-card-value">
                  <span className="api-keys-main-value">231</span>
                </div>
                <div className="api-keys-card-subtitle">1.7% of total calls</div>
              </div>

              <div className="api-keys-summary-card">
                <div className="api-keys-card-header">
                  <div className="api-keys-card-header-left">
                    <div className="api-keys-card-indicator"></div>
                    <h3>Avg Latency</h3>
                  </div>
                </div>
                <div className="api-keys-card-value">
                  <span className="api-keys-main-value">184ms</span>
                </div>
                <div className="api-keys-card-period">This month</div>
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
                    {filteredKeys.map((key) => (
                      <tr key={key.id}>
                        <td>{key.name}</td>
                        <td>
                          <button type="button" className="api-keys-public-key-link" onClick={() => { setSelectedKey(key); setShowDetailsModal(true); }}>
                            {key.publicKey}
                          </button>
                        </td>
                        <td>{key.permission}</td>
                        <td>
                          <span className={`api-keys-status ${key.status.toLowerCase()}`}>
                            {key.status}
                          </span>
                        </td>
                        <td>{key.lastUsed}</td>
                        <td>{key.created}</td>
                        <td>
                          <button 
                            type="button" 
                            className="api-keys-action-btn"
                            onClick={() => {
                              setSelectedKey(key);
                              setShowDetailsModal(true);
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

              {/* Pagination */}
              <div className="api-keys-pagination">
                <button
                  type="button"
                  className="api-keys-pagination-btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Prev 10
                </button>
                <div className="api-keys-pagination-numbers">
                  <span>1</span>
                  <span>...</span>
                  <span>11</span>
                  <span className="active">{currentPage}</span>
                  <span>13</span>
                  <span>14</span>
                  <span>15</span>
                  <span>16</span>
                  <span>17</span>
                  <span>18</span>
                  <span>19</span>
                  <span>20</span>
                  <span>...</span>
                  <span>78</span>
                </div>
                <button
                  type="button"
                  className="api-keys-pagination-btn"
                  onClick={() => setCurrentPage(Math.min(78, currentPage + 1))}
                  disabled={currentPage === 78}
                >
                  Next 10
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
          console.log('Create API key:', data);
          // Handle the API key creation logic here
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
      />
    </div>
  );
};

export default APIKeys;
