import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  KeyRound,
  DollarSign,
  Building2,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  X,
  Filter,
  AlertTriangle,
  CheckCircle,
  Package
} from 'lucide-react';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import { getApiUrl } from '../../utils/config';
import { useSession } from '../../context/SessionContext';
import './Dashboard.css';
import LoadingIndicator from '../../components/LoadingIndicator';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: FileCheck, badge: null },
  { label: 'Transaction', icon: Repeat, badge: null },
  { label: 'Teams', icon: Users, badge: null },
  { label: 'Compliance', icon: ShieldCheck, badge: null }
];

const developersNav = [
  { label: 'Api Keys', icon: KeyRound, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings, badge: null },
  { label: 'Security', icon: ShieldCheck, badge: null },
  { label: 'Help', icon: HelpCircle, badge: null }
];

const MyEscrowLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [accountType, setAccountType] = useState('Personal');
  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
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

  // Fetch user profile from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      // If session is expired, use fallback data
      if (isSessionExpired) {
        console.log('Session expired, using fallback user profile');
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found for user profile');
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        console.log('Fetching user profile from:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('User profile API response status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('User profile API response data:', result);

          if (result?.success && result?.data) {
            const data = result.data;
            const fullName =
              data.fullName ||
              [data.firstName, data.lastName].filter(Boolean).join(' ') ||
              data.name ||
              userFullName;

            if (fullName && typeof fullName === 'string') {
              setUserFullName(fullName);
            }

            // Extract initials from firstName and lastName
            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = 'SC'; // default fallback
            
            if (firstName && lastName) {
              initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
            } else if (fullName && typeof fullName === 'string') {
              // Fallback: extract from fullName if firstName/lastName not available
              const nameParts = fullName.trim().split(/\s+/);
              if (nameParts.length >= 2) {
                initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
              } else if (nameParts.length === 1) {
                initials = nameParts[0].charAt(0).toUpperCase();
              }
            }
            
            setUserInitials(initials);
          } else {
            console.warn('Unexpected user profile response shape. Expected success and data.', result);
          }
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          console.error('User profile API error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
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
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
          <nav className="sidebar-nav">
            {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
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

        {accountType === 'Business Suite' && (
          <div className="sidebar-section">
            <p className="sidebar-section-label">Developers Tool</p>
            <nav className="sidebar-nav">
              {developersNav.map((item) => {
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
        )}

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
        {children}
      </main>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="notification-modal-overlay" onClick={() => setShowNotificationModal(false)}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent"></div>
                <h2>Notification</h2>
              </div>
              <button type="button" className="notification-close-btn" onClick={() => setShowNotificationModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="notification-filter-bar">
              <div className="notification-filter-buttons">
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'All' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('All')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`notification-filter-btn ${notificationFilter === 'Unread' ? 'active' : ''}`}
                  onClick={() => setNotificationFilter('Unread')}
                >
                  Unread
                </button>
              </div>
              <button type="button" className="notification-filter-icon">
                <Filter size={18} />
              </button>
            </div>

            <div className="notification-list">
              <div className="notification-item unread">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                  <span className="notification-bell-dot"></span>
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <AlertTriangle size={18} className="notification-status-icon warning" />
                    <p className="notification-message">Low stock for "Premium Sofa" (only 3K available, 5K required)</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
                <div className="notification-unread-dot"></div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <CheckCircle size={18} className="notification-status-icon success" />
                    <p className="notification-message">Stock updated for "Sneakers" — now 8K available</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <Package size={18} className="notification-status-icon package" />
                    <p className="notification-message">15K products shipped this month</p>
                  </div>
                  <span className="notification-time">2m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEscrowLayout;

