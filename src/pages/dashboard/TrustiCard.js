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
  Search,
  Bell,
  LogOut,
  ArrowRight,
  Plus,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Filter,
  X,
  CreditCard as CreditCardIcon,
  Wallet,
  Eye,
  KeyRound,
  Info,
  Menu,
  DollarSign,
  Users,
  Building2,
  FileCheck,
  Code,
  Box,
  Link
} from 'lucide-react';
import './Dashboard.css';
import './TrustiCard.css';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import { useSession } from '../../context/SessionContext';
import LoadingIndicator from '../../components/LoadingIndicator';
import { getApiUrl } from '../../utils/config';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Transaction', icon: Repeat, badge: null },
  { label: 'Teams', icon: Users, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: null }
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

const TrustiCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('24,000');
  const [withdrawAmount, setWithdrawAmount] = useState('24,567.89');
  const [selectedWallet, setSelectedWallet] = useState('XRP wallet');
  const [selectedWithdrawWallet, setSelectedWithdrawWallet] = useState('USD wallet');
  const [addressForm, setAddressForm] = useState({
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    postalCode: ''
  });
  const [kycComplete] = useState(true);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('User');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [freezeCard, setFreezeCard] = useState(false);
  const [cashflowPeriod, setCashflowPeriod] = useState('Monthly');
  const [transactionFilter, setTransactionFilter] = useState('Filter');
  const [transactionPeriod, setTransactionPeriod] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(12);
  const [message, setMessage] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showMobileAddressPage, setShowMobileAddressPage] = useState(false);
  const [showMobileWithdrawPage, setShowMobileWithdrawPage] = useState(false);
  const [showMobileFundPage, setShowMobileFundPage] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Mock transaction data
  const transactions = [
    { id: 'F4E5D6...C1B2A3', type: 'Received', amount: '+50 XRP', usd: '$25.00 USD', status: 'Successful', date: '2024-07-04', checked: false },
    { id: 'A1B2C3...D4E5F6', type: 'Sent', amount: '-25 XRP', usd: '$12.50 USD', status: 'Successful', date: '2024-07-03', checked: false },
    { id: 'G7H8I9...J0K1L2', type: 'Received', amount: '+100 XRP', usd: '$50.00 USD', status: 'Successful', date: '2024-07-02', checked: false },
  ];

  // Mock cashflow data
  const cashflowData = [
    { month: 'Jan', received: 75, spent: 55 },
    { month: 'Feb', received: 48, spent: 38 },
    { month: 'Mar', received: 61, spent: 21 },
    { month: 'Apr', received: 34, spent: 22 },
    { month: 'May', received: 83, spent: 55 },
    { month: 'Jun', received: 74, spent: 49 },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('User');
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
            const role = data.role || data.userRole || 'User';
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
      {/* Mobile Header - Only visible on mobile */}
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
              {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
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

          {accountType === 'Business Suite' && (
            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Developers Tool</p>
              <nav className="mobile-sidebar-nav">
                {developersNav.map((item) => {
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
          )}

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
          <div className="sidebar-branding-text">
            <span className="sidebar-title">TrustiChain</span>
            <span className="sidebar-tagline">Secure escrow platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">General</p>
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
                  {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>Freelancer</small>
              </div>
            </div>
          </div>
        </header>

        <div className="trusticard-content">
          {/* Mobile My Cards Section */}
          {!showCardDetails && (
          <div className="mobile-my-cards-section">
            <div className="mobile-my-cards-header">
              <div className="mobile-my-cards-title-wrapper">
                <div className="mobile-section-indicator"></div>
                <h2 className="mobile-my-cards-title">My Cards</h2>
              </div>
              <button type="button" className="mobile-add-card-btn">
                <Plus size={16} />
                <span>Add card</span>
              </button>
            </div>
            <div className="mobile-card-display">
              {currentCardIndex === 0 ? (
                <div 
                  className="mobile-card-blue" 
                  onClick={() => setShowCardDetails(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mobile-card-top">
                    <span className="mobile-card-type-label">Platinum Card</span>
                    <div className="mobile-card-debit-action">
                      <span className="mobile-card-debit-text">Debit</span>
                      <div className="mobile-card-debit-arrow">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="mobile-card-balance">$24,567.89</div>
                  <div className="mobile-card-bottom">
                    <div className="mobile-card-bottom-item">
                      <span className="mobile-card-bottom-label">Exp Date</span>
                      <span className="mobile-card-bottom-value">4532 **** **** 5434</span>
                    </div>
                    <div className="mobile-card-bottom-item">
                      <span className="mobile-card-bottom-label">Exp Date</span>
                      <span className="mobile-card-bottom-value">19/29</span>
                    </div>
                    <div className="mobile-card-bottom-item">
                      <span className="mobile-card-bottom-label">CVV</span>
                      <span className="mobile-card-bottom-value">345/29</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="mobile-card-white" 
                  onClick={() => setShowCardDetails(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mobile-card-top">
                    <span className="mobile-card-type-label">Platinum Card</span>
                    <div className="mobile-card-debit-action">
                      <span className="mobile-card-debit-text">Debit</span>
                      <div className="mobile-card-debit-arrow">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="mobile-card-balance">$24,567.89</div>
                  <div className="mobile-card-bottom">
                    <div className="mobile-card-bottom-item">
                      <span className="mobile-card-bottom-label">Exp Date</span>
                      <span className="mobile-card-bottom-value">4532 **** **** 5434</span>
                    </div>
                    <div className="mobile-card-bottom-item">
                      <span className="mobile-card-bottom-label">Exp Date</span>
                      <span className="mobile-card-bottom-value">19/29</span>
                    </div>
                    <div className="mobile-card-bottom-item">
                      <span className="mobile-card-bottom-label">CVV</span>
                      <span className="mobile-card-bottom-value">345/29</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mobile-card-pagination">
              <div 
                className={`mobile-card-dot ${currentCardIndex === 0 ? 'active' : ''}`}
                onClick={() => setCurrentCardIndex(0)}
              ></div>
              <div 
                className={`mobile-card-dot ${currentCardIndex === 1 ? 'active' : ''}`}
                onClick={() => setCurrentCardIndex(1)}
              ></div>
              <div 
                className={`mobile-card-dot ${currentCardIndex === 2 ? 'active' : ''}`}
                onClick={() => setCurrentCardIndex(2)}
              ></div>
            </div>
          </div>
          )}

          {/* Mobile Cashflow Section */}
          {!showCardDetails && (
          <div className="mobile-cashflow-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h2 className="mobile-section-title">Cashflow</h2>
              <div className="mobile-period-selector">
                <select 
                  value={cashflowPeriod} 
                  onChange={(e) => setCashflowPeriod(e.target.value)}
                  className="mobile-period-select"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="mobile-cashflow-legend">
              <div className="mobile-legend-item">
                <div className="mobile-legend-color received"></div>
                <span>Amount received</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color spent"></div>
                <span>Amount Spent</span>
              </div>
            </div>
            <div className="mobile-cashflow-chart-container">
              <div className="mobile-chart-y-axis">
                <span className="mobile-y-axis-label">100%</span>
                <span className="mobile-y-axis-label">80%</span>
                <span className="mobile-y-axis-label">60%</span>
                <span className="mobile-y-axis-label">40%</span>
                <span className="mobile-y-axis-label">20%</span>
                <span className="mobile-y-axis-label">0%</span>
              </div>
              <div className="mobile-cashflow-chart">
                <div className="mobile-chart-bars-container">
                  {cashflowData.map((item, index) => (
                    <div key={index} className="mobile-chart-month">
                      <div className="mobile-chart-bars">
                        <div 
                          className="mobile-chart-bar received" 
                          style={{ height: `${item.received}%` }}
                        ></div>
                        <div 
                          className="mobile-chart-bar spent" 
                          style={{ height: `${item.spent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mobile-chart-labels-row">
                  {cashflowData.map((item, index) => (
                    <div key={index} className="mobile-chart-label-wrapper">
                      <span className="mobile-chart-label">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Mobile Transaction History Section */}
          {!showCardDetails && (
          <div className="mobile-transaction-history-section">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <h2 className="mobile-section-title">Transaction History</h2>
              <button type="button" className="mobile-transaction-arrow">
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="mobile-transaction-list">
              {transactions.map((tx, index) => {
                // Extract XRP amount from tx.amount (e.g., "+50 XRP" -> "50 XRP")
                const xrpAmount = tx.amount.replace('+', '').replace('-', '');
                return (
                  <div key={index} className="mobile-transaction-item">
                    <div className={`mobile-transaction-icon ${tx.type.toLowerCase()}`}>
                      {tx.type === 'Received' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                    </div>
                    <div className="mobile-transaction-content">
                      <div className="mobile-transaction-type">{tx.type}</div>
                      <div className="mobile-transaction-description">
                        You received {xrpAmount}, worth {tx.usd}.
                      </div>
                      <div className="mobile-transaction-footer">
                        <span className={`mobile-transaction-status ${tx.status.toLowerCase()}`}>
                          {tx.status}
                        </span>
                        <span className="mobile-transaction-date">{tx.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Mobile Card Details Page */}
          {showCardDetails && isMobile && (
            <div className="mobile-card-details-page">
              <div className="mobile-card-details-header">
                <div className="mobile-card-details-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-card-details-title">Card Details</h2>
                </div>
                <button 
                  type="button" 
                  className="mobile-card-details-close"
                  onClick={() => setShowCardDetails(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-card-details-content">
                {/* Platinum Card Section */}
                <div className="mobile-card-details-card-section">
                  <div className="mobile-card-details-section-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-card-details-section-title">Platinum Card</h3>
                  </div>
                  <div className="mobile-card-details-card-display">
                    <div className="mobile-card-blue">
                      <div className="mobile-card-top">
                        <span className="mobile-card-type-label">Platinum Card</span>
                        <div className="mobile-card-debit-action">
                          <span className="mobile-card-debit-text">Debit</span>
                          <div className="mobile-card-debit-arrow">
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="mobile-card-balance">$24,567.89</div>
                      <div className="mobile-card-bottom">
                        <div className="mobile-card-bottom-item">
                          <span className="mobile-card-bottom-label">Exp Date</span>
                          <span className="mobile-card-bottom-value">4532 **** **** 5434</span>
                        </div>
                        <div className="mobile-card-bottom-item">
                          <span className="mobile-card-bottom-label">Exp Date</span>
                          <span className="mobile-card-bottom-value">19/29</span>
                        </div>
                        <div className="mobile-card-bottom-item">
                          <span className="mobile-card-bottom-label">CVV</span>
                          <span className="mobile-card-bottom-value">345/29</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mobile-card-details-actions">
                  <button 
                    type="button" 
                    className="mobile-card-action-btn"
                    onClick={() => {
                      setShowCardDetails(false);
                      setShowMobileFundPage(true);
                    }}
                  >
                    <Plus size={16} />
                    <span>Top Up</span>
                  </button>
                  <div className="mobile-card-action-divider"></div>
                  <button 
                    type="button" 
                    className="mobile-card-action-btn"
                    onClick={() => {
                      setShowCardDetails(false);
                      setShowMobileWithdrawPage(true);
                    }}
                  >
                    <ArrowUp size={16} />
                    <span>Withdraw</span>
                  </button>
                  <div className="mobile-card-action-divider"></div>
                  <button 
                    type="button" 
                    className="mobile-card-action-btn"
                    onClick={() => {
                      setShowCardDetails(false);
                      setShowMobileAddressPage(true);
                    }}
                  >
                    <CreditCardIcon size={16} />
                    <span>Address</span>
                  </button>
                </div>

                {/* Card Numbers Section */}
                <div className="mobile-card-details-info-section">
                  <div className="mobile-card-info-item full-width">
                    <span className="mobile-card-info-label">Card Numbers</span>
                    <div className="mobile-card-info-value">
                      <span>4532 5434 9875 5434</span>
                      <Eye size={14} className="mobile-card-eye-icon" />
                    </div>
                  </div>
                  <div className="mobile-card-info-row">
                    <div className="mobile-card-info-item">
                      <span className="mobile-card-info-label">Exp Date</span>
                      <span className="mobile-card-info-value">19/29</span>
                    </div>
                    <div className="mobile-card-info-item">
                      <span className="mobile-card-info-label">CVV</span>
                      <span className="mobile-card-info-value">345</span>
                    </div>
                    <div className="mobile-card-info-item">
                      <span className="mobile-card-info-label">Status</span>
                      <button type="button" className="mobile-card-status-badge active">Active</button>
                    </div>
                  </div>
                </div>

                {/* Spending Limits */}
                <div className="mobile-card-details-spending-limits">
                  <div className="mobile-card-details-section-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-card-details-section-title">Spending limits</h3>
                  </div>
                  <div className="mobile-spending-limits-bar">
                    <div className="mobile-spending-limits-progress" style={{ width: '60%' }}></div>
                  </div>
                  <div className="mobile-spending-limits-text">$6,000 of $10,000</div>
                </div>

                {/* Freeze Card */}
                <div className="mobile-card-details-freeze">
                  <span className="mobile-freeze-card-label">Freeze Card</span>
                  <button 
                    type="button" 
                    className={`mobile-freeze-toggle ${freezeCard ? 'active' : ''}`}
                    onClick={() => setFreezeCard(!freezeCard)}
                  >
                    <div className={`mobile-freeze-toggle-slider ${freezeCard ? 'active' : ''}`}></div>
                  </button>
                </div>

                {/* Transaction History */}
                <div className="mobile-card-details-transaction-history">
                  <div className="mobile-card-details-section-header">
                    <div className="mobile-section-indicator"></div>
                    <h3 className="mobile-card-details-section-title">Transaction History</h3>
                    <button type="button" className="mobile-transaction-history-arrow">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <div className="mobile-card-details-transaction-list">
                    {transactions.map((tx, index) => {
                      const xrpAmount = tx.amount.replace('+', '').replace('-', '');
                      return (
                        <div key={index} className="mobile-card-details-transaction-item">
                          <div className={`mobile-transaction-icon ${tx.type.toLowerCase()}`}>
                            {tx.type === 'Received' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                          </div>
                          <div className="mobile-transaction-content">
                            <div className="mobile-transaction-type">{tx.type}</div>
                            <div className="mobile-transaction-description">
                              You received {xrpAmount}, worth {tx.usd}.
                            </div>
                            <div className="mobile-transaction-footer">
                              <span className={`mobile-transaction-status ${tx.status.toLowerCase()}`}>
                                {tx.status}
                              </span>
                              <span className="mobile-transaction-date">{tx.date}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Card Address Page */}
          {showMobileAddressPage && isMobile && (
            <div className="mobile-card-address-page">
              <div className="mobile-card-address-header">
                <div className="mobile-card-address-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-card-address-title">Card Address</h2>
                </div>
                <button 
                  type="button" 
                  className="mobile-card-address-close"
                  onClick={() => setShowMobileAddressPage(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-card-address-content">
                <div className="mobile-address-form">
                  <div className="mobile-address-field">
                    <label className="mobile-address-label">Street Address</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.streetAddress}
                      onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">City</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">State</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">Country</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    />
                  </div>

                  <div className="mobile-address-field">
                    <label className="mobile-address-label">Postal code</label>
                    <input 
                      type="text" 
                      className="mobile-address-input"
                      placeholder="Enter your name"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Withdraw Funds Page */}
          {showMobileWithdrawPage && isMobile && (
            <div className="mobile-withdraw-funds-page">
              <div className="mobile-withdraw-header">
                <div className="mobile-withdraw-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-withdraw-title">Withdraw Funds</h2>
                </div>
                <button 
                  type="button" 
                  className="mobile-withdraw-close"
                  onClick={() => setShowMobileWithdrawPage(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-withdraw-content">
                {/* Amount Section */}
                <div className="mobile-withdraw-amount-section">
                  <label className="mobile-withdraw-amount-label">Amount</label>
                  <div className="mobile-withdraw-amount-value">$24,567.89</div>
                  <div className="mobile-withdraw-balance">Balance: 24,567.89</div>
                </div>

                {/* Wallet Selection Section */}
                <div className="mobile-withdraw-wallet-section">
                  <label className="mobile-withdraw-wallet-label">Wallet name</label>
                  <div className="mobile-withdraw-wallet-selector">
                    <span className="mobile-withdraw-wallet-value">{selectedWithdrawWallet}</span>
                    <ChevronDown size={16} />
                  </div>
                </div>

                {/* Withdraw Button */}
                <button 
                  type="button" 
                  className="mobile-withdraw-btn"
                  onClick={() => {
                    // Handle withdraw action
                    setShowMobileWithdrawPage(false);
                  }}
                >
                  Withdraw
                </button>

                {/* Information Message */}
                <div className="mobile-withdraw-info-message">
                  <div className="mobile-withdraw-info-icon">
                    <Info size={18} />
                  </div>
                  <span className="mobile-withdraw-info-text">
                    Your funds will be added to your account within seconds or refunded if there's an issue.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Fund Trusticard Page */}
          {showMobileFundPage && isMobile && (
            <div className="mobile-fund-trusticard-page">
              <div className="mobile-fund-header">
                <div className="mobile-fund-title-wrapper">
                  <div className="mobile-section-indicator"></div>
                  <h2 className="mobile-fund-title">Fund Trusticard</h2>
                </div>
                <button 
                  type="button" 
                  className="mobile-fund-close"
                  onClick={() => setShowMobileFundPage(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mobile-fund-content">
                <div className="mobile-fund-amount-card">
                  {/* Amount Section */}
                  <div className="mobile-fund-amount-section">
                    <div className="mobile-fund-amount-header">
                      <label className="mobile-fund-amount-label">Amount</label>
                      <div className="mobile-fund-wallet-pill">
                        <div className="mobile-fund-wallet-pill-badge">
                          <img 
                            src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                            alt="XRP" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                          />
                        </div>
                        <span className="mobile-fund-wallet-pill-text">{selectedWallet}</span>
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <input 
                      type="text" 
                      className="mobile-fund-amount-input"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="24,000 XPR"
                    />
                    <div className="mobile-fund-balance">Balance: 24,567.89 XPR</div>
                  </div>

                  {/* Amount in USD Section */}
                  <div className="mobile-fund-usd-section">
                    <label className="mobile-fund-usd-label">Amount in USD</label>
                    <div className="mobile-fund-usd-value">$24,567.89</div>
                  </div>
                </div>

                {/* Fund Card Button */}
                <button 
                  type="button" 
                  className="mobile-fund-card-btn"
                  onClick={() => {
                    // Handle fund card action
                    setShowMobileFundPage(false);
                  }}
                >
                  Fund Card
                </button>

                {/* Information Message */}
                <div className="mobile-fund-info-message">
                  <div className="mobile-fund-info-icon">
                    <Info size={18} />
                  </div>
                  <span className="mobile-fund-info-text">
                    Your funds will be added to your account within seconds or refunded if there's an issue.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="trusticard-layout">
            {/* Left Column - My Cards */}
            <div className="trusticard-left-column">
              <div className="my-cards-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">My Cards</h2>
                  <button type="button" className="add-card-btn">
                    <Plus size={16} />
                    Add card
                  </button>
                </div>
                <div className="cards-stack">
                  <div className="platinum-card blue-card">
                    <div className="platinum-card-header">
                      <span className="platinum-card-label">Platinum Card</span>
                      <span className="platinum-card-type">Debit</span>
                    </div>
                    <div className="platinum-card-balance">$24,567.89</div>
                    <div className="platinum-card-details">
                      <div className="platinum-card-detail-item">
                        <span className="platinum-card-detail-label">Exp Date</span>
                        <span className="platinum-card-detail-value">4532 **** **** 5434</span>
                      </div>
                      <div className="platinum-card-detail-item">
                        <span className="platinum-card-detail-label">Exp Date</span>
                        <span className="platinum-card-detail-value">19/29</span>
                      </div>
                      <div className="platinum-card-detail-item">
                        <span className="platinum-card-detail-label">CVV</span>
                        <span className="platinum-card-detail-value">345/29</span>
                      </div>
                    </div>
                  </div>
                  <div className="platinum-card secondary-card">
                    <div className="platinum-card-header">
                      <span className="platinum-card-label">Platinum Card</span>
                      <span className="platinum-card-type">Debit</span>
                    </div>
                    <div className="platinum-card-balance">$24,567.89</div>
                    <div className="platinum-card-details">
                      <div className="platinum-card-detail-item">
                        <span className="platinum-card-detail-label">Exp Date</span>
                        <span className="platinum-card-detail-value">4532 **** **** 5434</span>
                      </div>
                      <div className="platinum-card-detail-item">
                        <span className="platinum-card-detail-label">Exp Date</span>
                        <span className="platinum-card-detail-value">19/29</span>
                      </div>
                      <div className="platinum-card-detail-item">
                        <span className="platinum-card-detail-label">CVV</span>
                        <span className="platinum-card-detail-value">345/29</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Card Details, Cashflow, Transaction History */}
            <div className="trusticard-right-column">
              {/* Card Details and Cashflow Row */}
              <div className="card-details-cashflow-row">
                {/* Card Details Section */}
                <div className="card-details-section">
                <div className="card-actions">
                  <button 
                    type="button" 
                    className="card-action-btn" 
                    onClick={() => {
                      if (isMobile) {
                        setShowMobileFundPage(true);
                      } else {
                        setShowFundModal(true);
                      }
                    }}
                  >
                    <Plus size={14} />
                    Top Up
                  </button>
                  <button type="button" className="card-action-btn" onClick={() => setShowWithdrawModal(true)}>
                    <ArrowUp size={14} />
                    Withdraw
                  </button>
                  <button type="button" className="card-action-btn" onClick={() => setShowAddressModal(true)}>
                    <CreditCardIcon size={14} />
                    Address
                  </button>
                </div>
                <div className="card-info-grid">
                  <div className="card-info-item card-numbers-full">
                    <span className="card-info-label">Card Numbers</span>
                    <div className="card-info-value">
                      <span>4532 5434 9875 5434</span>
                      <Eye size={14} className="refresh-icon" />
                    </div>
                  </div>
                  <div className="card-info-row">
                    <div className="card-info-item">
                      <span className="card-info-label">Exp Date</span>
                      <span className="card-info-value">19/29</span>
                    </div>
                    <div className="card-info-item">
                      <span className="card-info-label">CVV</span>
                      <span className="card-info-value">345</span>
                    </div>
                    <div className="card-info-item status-item">
                      <span className="card-info-label">Status</span>
                      <button type="button" className="status-badge active">Active</button>
                    </div>
                  </div>
                </div>
                <div className="spending-limits">
                  <div className="spending-limits-header">
                    <span className="spending-limits-label">Spending limits</span>
                  </div>
                  <div className="spending-limits-bar">
                    <div className="spending-limits-progress" style={{ width: '60%' }}></div>
                  </div>
                  <div className="spending-limits-text">$6,000 of $10,000</div>
                </div>
                <div className="freeze-card-toggle">
                  <span className="freeze-card-label">Freeze Card</span>
                  <button 
                    type="button" 
                    className={`freeze-toggle ${freezeCard ? 'active' : ''}`}
                    onClick={() => setFreezeCard(!freezeCard)}
                  >
                    <div className={`freeze-toggle-slider ${freezeCard ? 'active' : ''}`}></div>
                  </button>
                </div>
              </div>

              {/* Cashflow Section */}
              <div className="cashflow-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Cashflow</h2>
                  <div className="period-selector">
                    <select 
                      value={cashflowPeriod} 
                      onChange={(e) => setCashflowPeriod(e.target.value)}
                      className="period-select"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div className="cashflow-legend">
                  <div className="legend-item">
                    <div className="legend-color received"></div>
                    <span>Amount received</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color spent"></div>
                    <span>Amount Spent</span>
                  </div>
                </div>
                <div className="cashflow-chart-container">
                  <div className="chart-y-axis">
                    <span className="y-axis-label">100%</span>
                    <span className="y-axis-label">80%</span>
                    <span className="y-axis-label">60%</span>
                    <span className="y-axis-label">40%</span>
                    <span className="y-axis-label">20%</span>
                    <span className="y-axis-label">0%</span>
                  </div>
                  <div className="cashflow-chart">
                    {/* Bars only */}
                    <div className="chart-bars-container">
                      {cashflowData.map((item, index) => (
                        <div key={index} className="chart-month">
                          <div className="chart-bars">
                            <div 
                              className="chart-bar received" 
                              style={{ height: `${item.received}%` }}
                            ></div>
                            <div 
                              className="chart-bar spent" 
                              style={{ height: `${item.spent}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Labels row below */}
                    <div className="chart-labels-row">
                      {cashflowData.map((item, index) => (
                        <div key={index} className="chart-label-wrapper">
                          <span className="chart-label">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Transaction History Section */}
              <div className="transaction-history-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Transaction history</h2>
                  <div className="transaction-filters">
                    <div className="filter-selector">
                      <select 
                        value={transactionFilter} 
                        onChange={(e) => setTransactionFilter(e.target.value)}
                        className="filter-select"
                      >
                        <option value="Filter">Filter</option>
                        <option value="All">All</option>
                        <option value="Received">Received</option>
                        <option value="Sent">Sent</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                    <div className="period-selector">
                      <select 
                        value={transactionPeriod} 
                        onChange={(e) => setTransactionPeriod(e.target.value)}
                        className="period-select"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                      <ChevronDown size={16} />
                    </div>
                    <button type="button" className="filter-icon-btn">
                      <Filter size={18} />
                    </button>
                  </div>
                </div>
                <div className="transaction-table-wrapper">
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, index) => (
                        <tr key={index}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={tx.checked}
                              onChange={() => {}}
                            />
                          </td>
                          <td>
                            <div className="transaction-type-cell">
                              <div className={`transaction-type-icon ${tx.type.toLowerCase()}`}>
                                {tx.type === 'Received' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                              </div>
                              <span>{tx.type}</span>
                            </div>
                          </td>
                          <td>
                            <div className="transaction-id">{tx.id}</div>
                          </td>
                          <td>
                            <div className="transaction-amount">
                              <span className="amount-value">{tx.amount}</span>
                              <span className="amount-usd">({tx.usd})</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${tx.status.toLowerCase()}`}>{tx.status}</span>
                          </td>
                          <td>{tx.date}</td>
                          <td>
                            <button type="button" className="transaction-detail-btn">
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="transaction-pagination">
                  <button 
                    type="button" 
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ← Prev 10
                  </button>
                  <div className="pagination-numbers">
                    <button 
                      type="button" 
                      className={`pagination-number ${currentPage === 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                    <span className="pagination-ellipsis">...</span>
                    {[11, 12, 13, 14, 15, 16, 17, 18].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`pagination-number ${currentPage === num ? 'active' : ''}`}
                        onClick={() => setCurrentPage(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <button 
                    type="button" 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next 10 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fund Trusticard Modal */}
      {/* Fund Modal - Desktop Only */}
      {showFundModal && !isMobile && (
        <div className="modal-overlay" onClick={() => setShowFundModal(false)}>
          <div className="fund-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fund-modal-header">
              <h2 className="fund-modal-title">Fund Trusticard</h2>
              <button 
                type="button" 
                className="fund-modal-close"
                onClick={() => setShowFundModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="fund-modal-content">
              {/* Amount Section (XRP) */}
              <div className="fund-amount-section">
                <div className="fund-amount-header">
                  <label className="fund-amount-label">Amount</label>
                  <div className="fund-wallet-selector">
                    <div className="wallet-icon">
                      <img 
                        src="https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png?1605778731" 
                        alt="XRP" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    </div>
                    <span>{selectedWallet}</span>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div className="fund-amount-input-wrapper">
                  <input 
                    type="text" 
                    className="fund-amount-input"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                  />
                  <span className="fund-amount-currency">XRP</span>
                </div>
                <div className="fund-balance">Balance: 24,567.89 XRP</div>
              </div>

              {/* Amount in USD Section */}
              <div className="fund-usd-section">
                <label className="fund-usd-label">Amount in USD</label>
                <div className="fund-usd-input-wrapper">
                  <input 
                    type="text" 
                    className="fund-usd-input"
                    value="$24,567.89"
                    readOnly
                  />
                </div>
              </div>

              {/* Fund Card Button */}
              <button 
                type="button" 
                className="fund-card-btn"
                onClick={() => {
                  // Handle fund card logic here
                  setShowFundModal(false);
                }}
              >
                Fund Card
              </button>

              {/* Info Message */}
              <div className="fund-info-message">
                <Info size={16} />
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-modal-header">
              <h2 className="withdraw-modal-title">Withdraw</h2>
              <button 
                type="button" 
                className="withdraw-modal-close"
                onClick={() => setShowWithdrawModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="withdraw-modal-content">
              {/* Amount Section */}
              <div className="withdraw-amount-section">
                <label className="withdraw-amount-label">Amount</label>
                <div className="withdraw-amount-input-wrapper">
                  <input 
                    type="text" 
                    className="withdraw-amount-input"
                    value={`$${withdrawAmount}`}
                    onChange={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      setWithdrawAmount(value);
                    }}
                  />
                </div>
                <div className="withdraw-balance">Balance: {withdrawAmount}</div>
              </div>

              {/* Wallet Name Section */}
              <div className="withdraw-wallet-section">
                <label className="withdraw-wallet-label">Wallet name</label>
                <div className="withdraw-wallet-selector">
                  <span>{selectedWithdrawWallet}</span>
                  <ChevronDown size={16} />
                </div>
              </div>

              {/* Withdraw Button */}
              <button 
                type="button" 
                className="withdraw-btn"
                onClick={() => {
                  // Handle withdraw logic here
                  setShowWithdrawModal(false);
                }}
              >
                Withdraw
              </button>

              {/* Info Message */}
              <div className="withdraw-info-message">
                <Info size={16} />
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Address Modal */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h2 className="address-modal-title">Card Address</h2>
              <button 
                type="button" 
                className="address-modal-close"
                onClick={() => setShowAddressModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="address-modal-content">
              <div className="address-form-field">
                <label className="address-field-label">Street Address</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.streetAddress}
                  onChange={(e) => setAddressForm({...addressForm, streetAddress: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">City</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">State</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">Country</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                />
              </div>

              <div className="address-form-field">
                <label className="address-field-label">Postal code</label>
                <input 
                  type="text" 
                  className="address-input"
                  placeholder="Enter your name"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                />
              </div>

              <button 
                type="button" 
                className="update-address-btn"
                onClick={() => {
                  // Handle update address logic here
                  setShowAddressModal(false);
                }}
              >
                Update address
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <p className="notification-message">Your payment of $1,200 has been processed successfully</p>
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
                    <p className="notification-message">New transaction received: 50 XRP</p>
                  </div>
                  <span className="notification-time">5m ago</span>
                </div>
              </div>

              <div className="notification-item">
                <div className="notification-bell-icon">
                  <Bell size={16} />
                </div>
                <div className="notification-content">
                  <div className="notification-message-wrapper">
                    <p className="notification-message">Card transaction completed</p>
                  </div>
                  <span className="notification-time">1h ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default TrustiCard;
