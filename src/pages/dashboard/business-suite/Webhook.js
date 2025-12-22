import React, { useState } from 'react';
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
  Home
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Webhook.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import LoadingIndicator from '../../../components/LoadingIndicator';
import CreateWebhookModal from '../../../components/CreateWebhookModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Transaction', icon: Repeat, badge: null }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Help', icon: HelpCircle }
];

const Webhook = () => {
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
  const [selectedMonth, setSelectedMonth] = useState('Monthly');
  const [webhookUrl, setWebhookUrl] = useState('https://yourserver.com/webhooks/trustichain');
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

  // Sample webhook logs data
  const webhookLogs = [
    {
      id: 1,
      time: '12:11 PM',
      event: 'Escrow Released',
      status: 'Sent'
    },
    {
      id: 2,
      time: '11:11 PM',
      event: 'Subscription Failed',
      status: 'Failed'
    },
    {
      id: 3,
      time: '11:52 AM',
      event: 'Payment Received',
      status: 'Sent'
    },
    {
      id: 4,
      time: '11:52 AM',
      event: 'Payment Received',
      status: 'Sent'
    },
    {
      id: 5,
      time: '11:52 AM',
      event: 'Payment Received',
      status: 'Sent'
    },
    {
      id: 6,
      time: '11:52 AM',
      event: 'Payment Received',
      status: 'Sent'
    }
  ];

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

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      console.log('Webhook URL copied to clipboard');
    });
  };

  const handleUpdateUrl = () => {
    console.log('Update URL clicked');
    // Placeholder - no actual API call
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
              <button type="button" className="sidebar-logout">
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
                    +3.1%
                  </span>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">$45,280</span>
                </div>
                <div className="webhook-card-subtitle">$16,789 locked</div>
              </div>

              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Events Sent</h3>
                  </div>
                  <span className="webhook-trend-badge positive">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">45</span>
                </div>
                <div className="webhook-card-period">This month</div>
              </div>

              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Failed Deliveries</h3>
                  </div>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">23</span>
                </div>
                <div className="webhook-card-period">This month</div>
              </div>

              <div className="webhook-summary-card">
                <div className="webhook-card-header">
                  <div className="webhook-card-header-left">
                    <div className="webhook-card-indicator"></div>
                    <h3>Last Event Received</h3>
                  </div>
                </div>
                <div className="webhook-card-value">
                  <span className="webhook-main-value">7</span>
                </div>
                <div className="webhook-card-period">This month</div>
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
                      <div className="webhook-url-value">{webhookUrl}</div>
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
                      {webhookLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td>{log.time}</td>
                          <td>{log.event}</td>
                          <td>
                            <span className={`webhook-status ${log.status.toLowerCase()}`}>
                              {log.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className="webhook-action-btn"
                              onClick={() => {
                                console.log('View details for:', log.event);
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
                <div className="webhook-pagination">
                  <button
                    type="button"
                    className="webhook-pagination-link"
                    onClick={() => {}}
                  >
                    ← Prev 10
                  </button>
                  <div className="webhook-pagination-numbers">
                    <span>1</span>
                    <span>...</span>
                    <span>11</span>
                    <span className="active">12</span>
                    <span>13</span>
                    <span>14</span>
                    <span>15</span>
                    <span>16</span>
                    <span>17</span>
                    <span>18</span>
                  </div>
                  <button
                    type="button"
                    className="webhook-pagination-link"
                    onClick={() => {}}
                  >
                    Next 10 →
                  </button>
                </div>
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
    </div>
  );
};

export default Webhook;

