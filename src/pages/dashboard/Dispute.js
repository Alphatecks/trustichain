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
  Calendar
} from 'lucide-react';
import './Dashboard.css';
import './Dispute.css';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import { getApiUrl } from '../../utils/config';
import { useSession } from '../../context/SessionContext';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Help', icon: HelpCircle }
];

const Dispute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [currentPage, setCurrentPage] = useState(12);
  const [itemsPerPage] = useState(10);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('November');

  const [formattedToday, setFormattedToday] = useState('');

  // Real-time date formatting - updates every minute
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString(undefined, { month: 'long' });
      const formatted = `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
      setFormattedToday(formatted);
    };

    // Update immediately
    updateDate();

    // Update every minute to keep it real-time
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  // Mock dispute data
  const disputeData = Array.from({ length: 11 }, (_, i) => ({
    id: `DSP-2024-${String(i + 1).padStart(3, '0')}`,
    parties: { from: 'John Smith', to: 'Sarah Wilson' },
    amount: { xrp: '5,000', usd: '$2,715.00' },
    status: 'Pending',
    reason: 'Logo design dispute',
    duration: '1.5 days'
  }));

  const totalPages = 78;

  useEffect(() => {
    // Fetch user profile
    const fetchUserProfile = async () => {
      try {
        if (isSessionExpired) {
          setIsLoadingUserProfile(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingUserProfile(false);
          return;
        }

        const response = await fetch(`${getApiUrl()}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserFullName(data.user.fullName || 'Sarah Chen');
            const names = (data.user.fullName || 'Sarah Chen').split(' ');
            setUserInitials((names[0]?.[0] || '') + (names[1]?.[0] || ''));
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

  return (
    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">TrustiChain</span>
            <span className="sidebar-brand-tagline">Escrow Platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Main Menu</p>
          <nav className="sidebar-nav">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                               (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                               (item.label === 'Transactions' && location.pathname === '/transactions') ||
                               (item.label === 'Dispute' && location.pathname === '/dispute') ||
                               (item.label === 'Trusticard' && location.pathname === '/trusticard');
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard');
                } else if (item.label === 'My Escrow') {
                  navigate('/my-escrow');
                } else if (item.label === 'Transactions') {
                  navigate('/transactions');
                } else if (item.label === 'Dispute') {
                  navigate('/dispute');
                } else if (item.label === 'Trusticard') {
                  navigate('/trusticard');
                }
              };
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
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
            <span className="trustiscore-badge">97</span>
          </div>

          <button type="button" className="sidebar-logout">
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
            {kycComplete ? (
              <div className="account-type-buttons">
                <button 
                  type="button" 
                  className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                  onClick={() => setAccountType('Personal')}
                >
                  Personal
                </button>
                <button 
                  type="button" 
                  className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                  onClick={() => setAccountType('Business Suite')}
                >
                  Business Suite
                </button>
              </div>
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
              <div className="user-avatar">{userInitials}</div>
              <div className="user-info">
                <span className="user-name">
                  {isLoadingUserProfile ? 'Loading...' : userFullName}
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>Freelancer</small>
              </div>
            </div>
          </div>
        </header>

        <div className="dispute-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">General</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">Dashboard</span>
          </div>

          {/* Summary Cards */}
          <div className="dispute-summary-cards">
            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Total Dispute</span>
                  <div className="dispute-card-change-badge positive">
                    <TrendingUp size={12} />
                    <span>+2.4%</span>
                  </div>
                </div>
                <div className="dispute-card-value">32</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Active Dispute</span>
                  <div className="dispute-card-change-badge positive">
                    <TrendingUp size={12} />
                    <span>+2.4%</span>
                  </div>
                </div>
                <div className="dispute-card-value">32</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Resolved Dispute</span>
                  <div className="dispute-card-change-badge positive">
                    <TrendingUp size={12} />
                    <span>+2.4%</span>
                  </div>
                </div>
                <div className="dispute-card-value">32</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            <div className="dispute-summary-card">
              <div className="dispute-card-indicator"></div>
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Avg Resolution Time</span>
                </div>
                <div className="dispute-card-value">3.2 Sec</div>
                <div className="dispute-card-dropdown">
                  <span>This Monthly</span>
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="dispute-filters">
            <div className="dispute-filter-dropdown">
              <span>{selectedFilter}</span>
              <ChevronDown size={16} />
            </div>
            <div className="dispute-month-filter">
              <Calendar size={16} />
              <span>{selectedMonth}</span>
            </div>
          </div>

          {/* Dispute Table */}
          <div className="dispute-table-wrapper">
            {/* Header Row */}
            <div className="dispute-table-header">
              <div className="dispute-table-cell">Case ID</div>
              <div className="dispute-table-cell">Parties</div>
              <div className="dispute-table-cell">Amount</div>
              <div className="dispute-table-cell">Status</div>
              <div className="dispute-table-cell">Reason</div>
              <div className="dispute-table-cell">Duration</div>
            </div>
            {/* Data Rows */}
            {disputeData.map((dispute, index) => (
              <div key={index} className="dispute-table-row">
                <div className="dispute-table-cell dispute-case-id">#{dispute.id}</div>
                <div className="dispute-table-cell dispute-parties">
                  <span className="party-link">{dispute.parties.from}</span>
                  <ArrowRight size={14} className="party-arrow" />
                  <span>{dispute.parties.to}</span>
                </div>
                <div className="dispute-table-cell dispute-amount">
                  <div className="amount-primary">{dispute.amount.xrp} XRP</div>
                  <div className="amount-secondary">≈ {dispute.amount.usd}</div>
                </div>
                <div className="dispute-table-cell">
                  <span className="dispute-status pending">{dispute.status}</span>
                </div>
                <div className="dispute-table-cell dispute-reason">{dispute.reason}</div>
                <div className="dispute-table-cell dispute-duration">
                  <span>{dispute.duration}</span>
                  <button 
                    type="button" 
                    className="dispute-action-btn"
                    onClick={() => navigate(`/dispute/${dispute.id.replace('#', '')}`)}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="dispute-pagination">
            <button 
              type="button" 
              className="pagination-nav-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 10))}
              disabled={currentPage <= 1}
            >
              <ArrowLeft size={16} />
              <span>Prev 10</span>
            </button>
            <div className="pagination-pages">
              <button 
                type="button" 
                className={`pagination-page-btn ${currentPage === 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <span className="pagination-ellipsis">...</span>
              {Array.from({ length: 10 }, (_, i) => i + 11).map(page => (
                <button
                  key={page}
                  type="button"
                  className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <span className="pagination-ellipsis">...</span>
              <button 
                type="button" 
                className={`pagination-page-btn ${currentPage === totalPages ? 'active' : ''}`}
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </button>
            </div>
            <button 
              type="button" 
              className="pagination-nav-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 10))}
              disabled={currentPage >= totalPages}
            >
              <span>Next 10</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dispute;
