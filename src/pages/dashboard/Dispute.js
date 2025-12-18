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
  Calendar,
  Menu
} from 'lucide-react';
import './Dashboard.css';
import './Dispute.css';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import { getApiUrl } from '../../utils/config';
import { useSession } from '../../context/SessionContext';
import LoadingIndicator from '../../components/LoadingIndicator';

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
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('Personal Account');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('Personal Account');
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data) {
            const data = result.data;
            const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || 'Sarah Chen';
            setUserFullName(fullName);

            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = 'SC';
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
              } else if (nameParts.length === 1) {
                initials = nameParts[0].charAt(0).toUpperCase();
              }
            }
            setUserInitials(initials);
            
            // Set user role if available
            const role = data.role || data.userRole || 'Personal Account';
            setUserRole(role);
            
            // Set avatar if available
            setUserAvatar(data.avatar || null);
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
    <>
      {/* Mobile Header */}
      <div className="mobile-dashboard-header transactions-mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-user-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt={userFullName} />
            ) : (
              userInitials
            )}
          </div>
          <div className="mobile-user-info">
            <span className="mobile-user-name">
              {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
              <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
            </span>
            <span className="mobile-user-role">
              {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userRole}
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
            <p className="mobile-sidebar-section-label">
              {accountType === 'Business Suite' ? 'Business Suite' : 'General'}
            </p>
            <nav className="mobile-sidebar-nav">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                 (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                                 (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                 (item.label === 'Dispute' && location.pathname === '/dispute') ||
                                 (item.label === 'Trusticard' && location.pathname === '/trusticard');
                const handleNavClick = () => {
                  setIsMobileMenuOpen(false);
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
                    className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge && <span className="mobile-sidebar-badge">{item.badge}</span>}
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
                  <button 
                    key={item.label} 
                    type="button" 
                    className="mobile-sidebar-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
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
              <span className="mobile-sidebar-trustiscore-badge">850</span>
            </div>

            <button 
              type="button"
              className="mobile-sidebar-logout"
              onClick={() => {
                setIsMobileMenuOpen(false);
                localStorage.removeItem('token');
                navigate('/');
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
              <div className="account-type-display">
                <span className="account-type-label">{accountType}</span>
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
                  {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
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

          {/* Dispute History Section - Mobile */}
          <div className="mobile-dispute-history-section">
            <div className="mobile-dispute-history-header">
              <div className="mobile-dispute-history-title-wrapper">
                <div className="mobile-section-indicator"></div>
                <h3 className="mobile-dispute-history-title">Dispute History</h3>
              </div>
              <div className="mobile-dispute-history-actions">
                <button type="button" className="mobile-dispute-history-icon-btn">
                  <ChevronDown size={18} />
                </button>
                <button type="button" className="mobile-dispute-history-icon-btn">
                  <Calendar size={18} />
                </button>
              </div>
            </div>

            <div className="mobile-dispute-history-cards">
              {disputeData.map((dispute, index) => (
                <div 
                  key={index} 
                  className="mobile-dispute-history-card"
                  onClick={() => navigate(`/dispute/${dispute.id.replace('DSP-2024-', '')}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mobile-dispute-history-row">
                    <div className="mobile-dispute-history-parties">
                      <span className="mobile-dispute-party-from">{dispute.parties.from}</span>
                      <ArrowRight size={14} className="mobile-dispute-party-arrow" />
                      <span className="mobile-dispute-party-to">{dispute.parties.to}</span>
                    </div>
                    <div className="mobile-dispute-history-amount">
                      {dispute.amount.xrp} XRP ≈ {dispute.amount.usd}
                    </div>
                  </div>
                  <div className="mobile-dispute-history-row">
                    <div className="mobile-dispute-history-reason">{dispute.reason}</div>
                    <span className={`mobile-dispute-status mobile-dispute-status-${dispute.status.toLowerCase()}`}>
                      {dispute.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute Table - Desktop */}
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
    </>
  );
};

export default Dispute;
