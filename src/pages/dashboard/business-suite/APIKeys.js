import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
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
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CreateApiKeyModal from '../../../components/CreateApiKeyModal';
import ApiKeyDetailsModal from '../../../components/ApiKeyDetailsModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
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

const APIKeys = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Business Suite');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isKycCompleteForAccount, setIsKycCompleteForAccount] = useState(true);
  const [keyTypeFilter, setKeyTypeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(12);
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

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

  // #region agent log
  useEffect(() => {
    const logLayout = () => {
      const dashboard = document.querySelector('.api-keys-dashboard');
      const dashboardMain = document.querySelector('.api-keys-dashboard .dashboard-main');
      const dashboardContent = document.querySelector('.api-keys-dashboard .dashboard-content');
      const dashboardLayout = document.querySelector('.api-keys-dashboard .dashboard-layout');
      const tableSection = document.querySelector('.api-keys-table-section');
      const viewportWidth = window.innerWidth;
      
      const mainStyles = dashboardMain ? window.getComputedStyle(dashboardMain) : {};
      const contentStyles = dashboardContent ? window.getComputedStyle(dashboardContent) : {};
      
      const data = {
        viewportWidth,
        dashboardWidth: dashboard?.offsetWidth || 0,
        dashboardMainWidth: dashboardMain?.offsetWidth || 0,
        dashboardMainMaxWidth: mainStyles.maxWidth || 'none',
        dashboardMainMarginLeft: mainStyles.marginLeft || '0',
        dashboardMainMarginRight: mainStyles.marginRight || '0',
        dashboardContentWidth: dashboardContent?.offsetWidth || 0,
        dashboardContentMaxWidth: contentStyles.maxWidth || 'none',
        dashboardContentMarginLeft: contentStyles.marginLeft || '0',
        dashboardContentMarginRight: contentStyles.marginRight || '0',
        dashboardLayoutWidth: dashboardLayout?.offsetWidth || 0,
        tableSectionWidth: tableSection?.offsetWidth || 0,
        whiteSpaceRight: viewportWidth - (dashboardContent?.offsetWidth || 0),
      };
      
      fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'APIKeys.js:145',
          message: 'Layout dimensions - Hypothesis A: max-width constraint',
          data,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
      
      fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'APIKeys.js:145',
          message: 'Layout dimensions - Hypothesis B: dashboard-content max-width',
          data: { ...data, contentMaxWidth: contentStyles.maxWidth },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'B'
        })
      }).catch(() => {});
    };
    
    const timeoutId = setTimeout(logLayout, 100);
    window.addEventListener('resize', logLayout);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', logLayout);
    };
  }, []);
  // #endregion

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
                                   (item.label === 'Payroll' && location.pathname === '/payroll') ||
                                   (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
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
                <p className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                <div className="account-type-display">
                  <span className="account-type-label">Business Suite</span>
                </div>
                {isKycCompleteForAccount && (
                  <button 
                    type="button" 
                    className="create-wallet-btn"
                    onClick={() => {
                      // Wallet functionality can be added here
                    }}
                  >
                    {hasWallet ? 'View Wallet' : 'Create Wallet'}
                  </button>
                )}
                <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
                  <Bell size={18} />
                </button>
                <div className="header-user">
                  <div className="user-avatar">{userInitials}</div>
                  <div className="user-info">
                    <span className="user-name">
                      {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
                      <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                    </span>
                    <small>Freelancer</small>
                  </div>
                </div>
              </div>
            </header>

            {/* Breadcrumb */}
            <div className="card-breadcrumb">
              <span className="breadcrumb-root">Business Suite</span>
              <span className="breadcrumb-divider">›</span>
              <span className="breadcrumb-current">API Keys</span>
            </div>

            {/* Create API Key Button */}
            <div className="api-keys-page-header">
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
                        <td className="api-keys-public-key">{key.publicKey}</td>
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
