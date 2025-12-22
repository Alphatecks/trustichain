import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings,
  Search,
  Bell,
  ArrowRight,
  Plus,
  DollarSign,
  Building2,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  X,
  Menu,
  ChevronRight,
  ChevronDown,
  Filter,
  TrendingUp,
  Clock,
  FileText,
  KeyRound
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Payroll.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import LoadingIndicator from '../../../components/LoadingIndicator';
import AddPayrollModal from '../../../components/AddPayrollModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
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

const Payroll = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Business Suite');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isKycCompleteForAccount, setIsKycCompleteForAccount] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [monthlyFilter, setMonthlyFilter] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(12);
  const [payrollToggles, setPayrollToggles] = useState({
    payroll1: 'active',
    angelo1: 'active',
    angelo2: 'active',
    angelo3: 'active'
  });
  const [freezeAutoRelease, setFreezeAutoRelease] = useState({
    payroll1: false,
    angelo1: false,
    angelo2: false,
    angelo3: false
  });
  const [showAddPayrollModal, setShowAddPayrollModal] = useState(false);

  const payrolls = [
    { id: 'payroll1', name: 'Payroll 1', releaseDate: '31 nov' },
    { id: 'angelo1', name: 'Angelo group', releaseDate: '31 nov' },
    { id: 'angelo2', name: 'Angelo group', releaseDate: '31 nov' },
    { id: 'angelo3', name: 'Angelo group', releaseDate: '31 nov' }
  ];

  const transactions = Array(9).fill({
    transactionId: 'TC-PAY-AGP-0118-983472',
    payrollName: 'Angelo Group Payroll',
    amount: '+50 XRP ($25.00 USD)',
    status: 'Pending',
    dueDate: '2024-07-04'
  });

  const toggleFreezeAutoRelease = (payrollId) => {
    setFreezeAutoRelease(prev => ({
      ...prev,
      [payrollId]: !prev[payrollId]
    }));
  };


  return (
    <div className="dashboard payroll-dashboard">
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
                               (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract');
              const handleNavClick = () => {
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
          <p className="sidebar-section-label">Developers Tool</p>
          <nav className="sidebar-nav">
            {developersNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === 'Api Keys' && location.pathname === '/api-keys';
              const handleDevelopersNavClick = () => {
                if (item.label === 'Api Keys') {
                  navigate('/api-keys');
                }
              };
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={handleDevelopersNavClick}
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

        <div className="payroll-page">
          <div className="payroll-page-header">
            <h1 className="payroll-page-title">Payrolls</h1>
            <button className="add-payroll-btn" onClick={() => setShowAddPayrollModal(true)}>
              <Plus size={18} />
              Add Payroll
            </button>
          </div>

          <div className="payroll-content">
            {/* Left Section: Payroll Cards */}
            <div className="payroll-cards-section">
              {payrolls.map((payroll) => (
                <div key={payroll.id} className="payroll-card">
                  <div className="payroll-card-header">
                    <h3 className="payroll-card-title">{payroll.name}</h3>
                    <a 
                      href="#" 
                      className="payroll-view-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/payroll/${payroll.id}`);
                      }}
                    >
                      View
                    </a>
                  </div>
                  
                  {/* Segmented toggle for all payrolls */}
                  <div className="payroll-segmented-toggle">
                    <button
                      type="button"
                      className={`segmented-toggle-segment ${payrollToggles[payroll.id] === 'active' ? 'active' : ''}`}
                      onClick={() => setPayrollToggles(prev => ({ ...prev, [payroll.id]: 'active' }))}
                    >
                    </button>
                    <button
                      type="button"
                      className={`segmented-toggle-segment ${payrollToggles[payroll.id] === 'scheduled' ? 'active' : ''}`}
                      onClick={() => setPayrollToggles(prev => ({ ...prev, [payroll.id]: 'scheduled' }))}
                    >
                    </button>
                  </div>

                  <div className="payroll-release-date">
                    Release date: <span className="payroll-date-value">{payroll.releaseDate}</span>
                  </div>

                  <div className="payroll-freeze-toggle">
                    <span className="freeze-toggle-label">Freeze Auto release</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={freezeAutoRelease[payroll.id]}
                        onChange={() => toggleFreezeAutoRelease(payroll.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <button className="payroll-release-btn">Release now</button>
                </div>
              ))}
            </div>

            {/* Right Section: Summary & Transaction History */}
            <div className="payroll-summary-section">
              {/* Summary Cards */}
              <div className="payroll-summary-cards">
                <div className="payroll-summary-card">
                  <div className="summary-card-icon">
                    <FileText size={24} />
                  </div>
                  <div className="summary-card-content">
                    <div className="summary-card-title">Total Payroll</div>
                    <div className="summary-card-value-row">
                      <div className="summary-card-value">23</div>
                      <div className="summary-card-trend positive">
                        <TrendingUp size={14} />
                        <span>+3.1%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="payroll-summary-card">
                  <div className="summary-card-icon">
                    <Users size={24} />
                  </div>
                  <div className="summary-card-content">
                    <div className="summary-card-title">Total Team members</div>
                    <div className="summary-card-value-row">
                      <div className="summary-card-value">345</div>
                      <div className="summary-card-subtitle">Active members</div>
                    </div>
                  </div>
                </div>

                <div className="payroll-summary-card">
                  <div className="summary-card-icon">
                    <Clock size={24} />
                  </div>
                  <div className="summary-card-content">
                    <div className="summary-card-title">Total Payroll Escrowed</div>
                    <div className="summary-card-value-row">
                      <div className="summary-card-value">$45,280</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="transaction-history-section">
                <div className="transaction-history-header">
                  <div className="section-indicator"></div>
                  <h2 className="transaction-history-title">Transaction history</h2>
                </div>

                <div className="transaction-filters">
                  <button className="filter-btn">
                    <Filter size={16} />
                    Filter
                  </button>
                  <button className="monthly-filter-btn">
                    {monthlyFilter}
                    <ChevronDown size={16} />
                  </button>
                  <button className="filter-icon-btn">
                    <Filter size={16} />
                  </button>
                </div>

                <div className="transaction-table-wrapper">
                  <table className="transaction-table">
                    <thead>
                      <tr>
                        <th>
                          <input type="checkbox" />
                        </th>
                        <th>Transaction ID</th>
                        <th>Payroll Name</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => (
                        <tr key={index}>
                          <td>
                            <input type="checkbox" />
                          </td>
                          <td className="transaction-id">{transaction.transactionId}</td>
                          <td>{transaction.payrollName}</td>
                          <td>{transaction.amount}</td>
                          <td>
                            <span className="transaction-status pending">{transaction.status}</span>
                          </td>
                          <td>{transaction.dueDate}</td>
                          <td>
                            <button className="transaction-action-btn">
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="transaction-pagination">
                  <button className="pagination-btn" disabled={currentPage === 1}>
                    ← Prev 10
                  </button>
                  <div className="pagination-numbers">
                    <span className="pagination-number">1</span>
                    <span className="pagination-ellipsis">...</span>
                    <span className="pagination-number">11</span>
                    <span className="pagination-number active">{currentPage}</span>
                    <span className="pagination-number">13</span>
                    <span className="pagination-number">14</span>
                    <span className="pagination-number">15</span>
                    <span className="pagination-number">16</span>
                    <span className="pagination-number">17</span>
                    <span className="pagination-number">18</span>
                  </div>
                  <button className="pagination-btn">
                    Next 10 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Payroll Modal */}
      <AddPayrollModal
        isOpen={showAddPayrollModal}
        onCancel={() => setShowAddPayrollModal(false)}
        onSuccess={(data) => {
          console.log('Payroll created:', data);
          setShowAddPayrollModal(false);
          // You can add toast notification or refresh the payroll list here
        }}
      />
    </div>
  );
};

export default Payroll;
