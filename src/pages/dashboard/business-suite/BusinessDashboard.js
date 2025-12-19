import React from 'react';
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
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  ChevronDown,
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
  Wallet,
  ChevronRight
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import logo from '../../../assets/images/icons/logo.png';
import logoWhite from '../../../assets/images/logo/logo_white.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import LoadingIndicator from '../../../components/LoadingIndicator';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
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

const BusinessDashboard = ({
  dashboardData,
  isLoadingDashboard,
  exchangeRates,
  isLoadingRates,
  portfolioPoints,
  isLoadingPortfolio,
  walletBalances,
  isLoadingWalletBalances,
  escrows,
  isLoadingEscrows,
  totalEscrowedAmount,
  isLoadingTotalEscrowed,
  userFullName,
  userInitials,
  userRole,
  userAvatar,
  isLoadingUserProfile,
  showBalance,
  setShowBalance,
  showNotificationModal,
  setShowNotificationModal,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  hasWallet,
  setShowWalletModal,
  handleCreateWallet,
  setShowFundWalletModal,
  setShowWithdrawWalletModal,
  setShowCreateEscrowModal,
  accountType,
  setAccountType,
  setIsSwitchingAccountType,
  setSwitchMessage,
  businessKycComplete,
  navigate,
  location,
  getBalanceValue,
  getExchangeRate
}) => {
  return (
    <>
      {/* Mobile Dashboard */}
      <div className="mobile-dashboard">
        {/* Mobile Header */}
        <div className="mobile-dashboard-header">
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
              <button
                type="button"
                className="account-chip-mobile"
                onClick={() => {
                  setSwitchMessage('switching to personal');
                  setIsSwitchingAccountType(true);
                  setTimeout(() => {
                    setAccountType('Personal');
                    setIsSwitchingAccountType(false);
                    setSwitchMessage('');
                  }, 2000);
                }}
              >
                <div className="account-chip-text">
                  <span className="account-label">Account</span>
                  <span className="account-type">Business Suite</span>
                </div>
                <span className="account-chip-icon">
                  <ChevronRight size={14} />
                </span>
              </button>
            </div>

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Business Suite</p>
              <nav className="mobile-sidebar-nav">
                {businessSuiteNav.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = !businessKycComplete;
                  const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                   (item.label === 'Payroll' && location.pathname === '/payroll') ||
                                   (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract');
                  const handleNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Dashboard') {
                      navigate('/dashboard');
                    } else if (item.label === 'Payroll') {
                      navigate('/payroll');
                    } else if (item.label === 'Supplier Contract') {
                      navigate('/supplier-contract');
                    }
                  };
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={handleNavClick}
                      disabled={isDisabled}
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
              <p className="mobile-sidebar-section-label">Developers Tool</p>
              <nav className="mobile-sidebar-nav">
                {developersNav.map((item) => {
                  const Icon = item.icon;
                  const isDisabled = !businessKycComplete;
                  return (
                    <button 
                      key={item.label} 
                      type="button" 
                      className={`mobile-sidebar-nav-item ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!isDisabled) setIsMobileMenuOpen(false);
                      }}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
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

            <div className="mobile-sidebar-section">
              <p className="mobile-sidebar-section-label">Wallet</p>
              <nav className="mobile-sidebar-nav">
                <button
                  type="button"
                  className="mobile-sidebar-nav-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (hasWallet) {
                      setShowWalletModal(true);
                    } else {
                      handleCreateWallet();
                    }
                  }}
                >
                  <span>{hasWallet ? 'View wallet' : 'Create wallet'}</span>
                </button>
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
                <span className="mobile-sidebar-trustiscore-label">Active Supplier</span>
                <span className="mobile-sidebar-trustiscore-badge">
                  {dashboardData?.trustiscore?.score !== undefined 
                    ? dashboardData.trustiscore.score 
                    : (isLoadingDashboard ? '...' : '97')}
                </span>
              </div>

              <button 
                type="button" 
                className="mobile-sidebar-logout"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="mobile-total-balance-card">
          <div className="mobile-balance-header">
            <div className="mobile-balance-title">
              <Wallet size={18} />
              <span>Total Balance</span>
            </div>
            <button type="button" onClick={() => setShowBalance(!showBalance)} className="mobile-eye-toggle">
              {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="mobile-balance-amount">
            {showBalance 
              ? (isLoadingDashboard 
                  ? <LoadingIndicator size="sm" />
                  : (() => {
                      if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                        const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                        if (xrpToUsdRate) {
                          const usdValue = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                          return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        const usdRate = exchangeRates.find(r => 
                          (r.from === 'XRP' && r.to === 'USD') || 
                          (r.currency === 'USD' || r.code === 'USD')
                        );
                        if (usdRate && usdRate.rate) {
                          const usdValue = Number(dashboardData.balance.xrp) * Number(usdRate.rate);
                          return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                      }
                      const usdBalance = getBalanceValue(dashboardData, 'usd');
                      if (usdBalance !== null && usdBalance !== undefined) {
                        return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      }
                      return '$0.00';
                    })())
              : '••••••'}
          </div>
          <div className="mobile-balance-xrp">
            ≈ {(() => {
                const xrpBalance = getBalanceValue(dashboardData, 'xrp');
                if (isLoadingDashboard) {
                  return <LoadingIndicator size="sm" />;
                }
                if (xrpBalance !== null && xrpBalance !== undefined) {
                  return Number(xrpBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return '0.00';
              })()} XRP
          </div>
          <div className="mobile-balance-actions">
            <button 
              type="button" 
              className="mobile-fund-btn"
              onClick={() => setShowFundWalletModal(true)}
            >
              <Plus size={16} />
              Fund Wallet
            </button>
            <button 
              type="button" 
              className="mobile-withdraw-btn"
              onClick={() => setShowWithdrawWalletModal(true)}
            >
              <Plus size={16} />
              Withdraw
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="mobile-metrics-cards">
          <div className="mobile-metric-card">
            <div className="mobile-metric-header">
              <Users size={16} />
              <span>Total Payroll Teams</span>
            </div>
            <div className="mobile-metric-value">
              {dashboardData?.activeEscrows?.count !== undefined 
                ? dashboardData.activeEscrows.count 
                : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
            </div>
            <div className="mobile-metric-subvalue">
              ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                  ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
            </div>
            <button
              type="button"
              className="mobile-metric-btn"
              onClick={() => setShowCreateEscrowModal(true)}
            >
              <Plus size={14} />
              Create Payroll
            </button>
          </div>
          <div className="mobile-metric-card">
            <div className="mobile-metric-header">
              <ShieldCheck size={16} />
              <span>Active Supplier</span>
            </div>
            <div className="mobile-metric-value">
              {dashboardData?.trustiscore?.score !== undefined 
                ? dashboardData.trustiscore.score 
                : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
              <span className="mobile-metric-suffix">/100</span>
            </div>
            <div className="mobile-metric-subvalue">
              {dashboardData?.trustiscore?.level !== undefined 
                ? dashboardData.trustiscore.level 
                : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
            </div>
            <button type="button" className="mobile-metric-btn">
              Add Team Member
            </button>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="mobile-portfolio-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">Portfolio</h3>
            <div className="mobile-section-dropdown">
              <span>Monthly</span>
              <ChevronDown size={14} />
            </div>
          </div>
          <div className="mobile-chart-container">
            <div className="mobile-chart-y-axis">
              {[0, 10, 20, 30, 40, 50].map((val) => (
                <span key={val}>{val}k</span>
              ))}
            </div>
            <div className="mobile-bar-chart">
              {isLoadingPortfolio && (
                <span className="mobile-rate-currency"><LoadingIndicator size="sm" /></span>
              )}

              {!isLoadingPortfolio && portfolioPoints && portfolioPoints.length > 0 && (() => {
                const maxValue =
                  portfolioPoints.reduce(
                    (max, p) => Math.max(max, Number(p.value ?? 0)),
                    0
                  ) || 1;

                return portfolioPoints.map((point, index) => {
                  const value = Number(point.value ?? 0);
                  const height = Math.max(5, (value / maxValue) * 100);
                  const label = point.label ?? '';
                  const isLastBar = index === portfolioPoints.length - 1;

                  return (
                    <div key={`${label}-${index}`} className="mobile-bar-wrapper">
                      <div
                        className={`mobile-bar ${isLastBar ? 'mobile-bar-last' : ''}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="mobile-bar-label">{label}</span>
                    </div>
                  );
                });
              })()}

              {!isLoadingPortfolio && (!portfolioPoints || portfolioPoints.length === 0) && (
                <span className="mobile-rate-currency">No portfolio data</span>
              )}
            </div>
          </div>
        </div>

        {/* My Teams Section */}
        <div className="mobile-my-teams-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">My Teams</h3>
            <a href="#" className="mobile-see-all-link">See all</a>
          </div>
          <div className="mobile-teams-list">
            {[
              { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
              { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
              { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
              { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
              { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
              { name: 'Payroll1', members: 23, nextDate: '31st Nov' }
            ].map((team, index) => (
              <div key={index} className="mobile-team-item">
                <div className="mobile-team-content">
                  <div className="mobile-team-name">{team.name}</div>
                  <div className="mobile-team-members">
                    Team members <span className="mobile-team-badge">{team.members}</span>
                  </div>
                </div>
                <div className="mobile-team-right">
                  <div className="mobile-team-next-date">Next date: {team.nextDate}</div>
                  <button className="mobile-team-view-btn">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Supply Section */}
        <div className="mobile-upcoming-supply-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">Upcoming Supply</h3>
            <a href="#" className="mobile-see-all-link">See all</a>
          </div>
          <div className="mobile-supply-list">
            {[
              { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', dueDate: '28 Nov' },
              { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', dueDate: '28 Nov' },
              { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', dueDate: '28 Nov' }
            ].map((supply, index) => (
              <div key={index} className="mobile-supply-item">
                <div className="mobile-supply-avatar">
                  <div className="mobile-supply-avatar-placeholder"></div>
                </div>
                <div className="mobile-supply-content">
                  <div className="mobile-supply-name">{supply.name}</div>
                  <div className="mobile-supply-email">{supply.email}</div>
                </div>
                <div className="mobile-supply-right">
                  <div className="mobile-supply-amount">{supply.amount}</div>
                  <div className="mobile-supply-date">Due date: {supply.dueDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Section */}
        <div className="mobile-subscription-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">Subscription</h3>
            <a href="#" className="mobile-see-all-link">See all</a>
          </div>
          <div className="mobile-subscription-list">
            {[
              { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', nextPayment: '28 Nov' },
              { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', nextPayment: '28 Nov' },
              { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', nextPayment: '28 Nov' }
            ].map((subscription, index) => (
              <div key={index} className="mobile-subscription-item">
                <div className="mobile-subscription-avatar">
                  <div className="mobile-subscription-avatar-placeholder"></div>
                </div>
                <div className="mobile-subscription-content">
                  <div className="mobile-subscription-name">{subscription.name}</div>
                  <div className="mobile-subscription-email">{subscription.email}</div>
                </div>
                <div className="mobile-subscription-right">
                  <div className="mobile-subscription-amount">{subscription.amount}</div>
                  <div className="mobile-subscription-date">Next payment: {subscription.nextPayment}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Section */}
        <div className="mobile-alert-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">Alert</h3>
          </div>
          <div className="mobile-alert-card">
            <div className="mobile-alert-icon">
              <CreditCard size={32} />
            </div>
            <div className="mobile-alert-content">
              <div className="mobile-alert-title">Upcoming Payroll Alert</div>
              <div className="mobile-alert-message">
                Angelo Group's next payout window is opening. Confirm and finalize your disbursement.
              </div>
            </div>
            <button className="mobile-alert-btn">View payroll</button>
          </div>
        </div>

        {/* Trusticard Section */}
        <div className="mobile-trusticard-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">Trusticard</h3>
          </div>
          <div className="mobile-trusticard">
            <div className="mobile-card-header-info">
              <div className="mobile-card-logo">
                <img src={logoWhite} alt="TrustiChain" className="mobile-card-logo-img" />
                <span>TrustiChain</span>
              </div>
              <div className="mobile-card-type">Premium Debit</div>
            </div>
            <div className="mobile-card-number">7834 **** **** 6453</div>
            <div className="mobile-card-holder">
              <span className="mobile-card-holder-label">Card holder</span>
              <span className="mobile-card-holder-name">
                {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Dashboard */}
      <div className="dashboard-content">
        {/* Breadcrumb */}
        <div className="card-breadcrumb">
          <span className="breadcrumb-root">Business Suite</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-current">Dashboard</span>
        </div>
        {/* Summary Cards */}
        <div className="dashboard-summary-cards">
          <div className="summary-card total-balance-card">
            <div className="summary-card-header">
              <h3>Total Balance</h3>
              <button type="button" onClick={() => setShowBalance(!showBalance)} className="eye-toggle">
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {showBalance 
                  ? (isLoadingDashboard 
                      ? <LoadingIndicator size="sm" />
                      : (() => {
                          if (dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null && exchangeRates && exchangeRates.length > 0) {
                            const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                            if (xrpToUsdRate) {
                              const usdValue = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                              return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                            const usdRate = exchangeRates.find(r => 
                              (r.from === 'XRP' && r.to === 'USD') || 
                              (r.currency === 'USD' || r.code === 'USD')
                            );
                            if (usdRate && usdRate.rate) {
                              const usdValue = Number(dashboardData.balance.xrp) * Number(usdRate.rate);
                              return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                          }
                          if (dashboardData?.balance?.usd !== undefined && dashboardData?.balance?.usd !== null) {
                            return `$${Number(dashboardData.balance.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return '$0.00';
                        })())
                  : '••••••'}
              </div>
              <div className="summary-card-subvalue">
                ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                    ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '0.000000')} XRP
              </div>
            </div>
            <div className="summary-card-actions">
              <button 
                type="button" 
                className="summary-card-btn primary"
                onClick={() => setShowFundWalletModal(true)}
              >
                + Fund Wallet
              </button>
              <button 
                type="button" 
                className="summary-card-btn secondary"
                onClick={() => setShowWithdrawWalletModal(true)}
              >
                + Withdraw
              </button>
            </div>
          </div>

          <div className="summary-card active-escrow-card">
            <div className="summary-card-header">
              <Users size={16} />
              <h3>Total Payroll Teams</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </div>
              <div className="summary-card-subvalue">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </div>
            </div>
            <button
              type="button"
              className="summary-card-btn primary"
              onClick={() => setShowCreateEscrowModal(true)}
            >
              + Create Payroll
            </button>
          </div>

          <div className="summary-card trustiscore-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Active Supplier</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="summary-card-value-suffix">/100</span>
              </div>
              <div className="summary-card-subvalue">
                {dashboardData?.trustiscore?.level !== undefined 
                  ? dashboardData.trustiscore.level 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
              </div>
            </div>
            <button type="button" className="summary-card-btn secondary">Add Team Member</button>
          </div>

          <div className="summary-card total-escrowed-card">
            <div className="summary-card-header">
              <CreditCard size={16} />
              <h3>Total Subscription</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">
                ${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '0.00')}
              </div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Payroll Escrow</button>
          </div>
        </div>

        {/* Middle Section */}
        <div className="dashboard-middle">
          <div className="dashboard-left-column">
          {/* Portfolio Chart */}
          <div className="dashboard-chart-card">
            <div className="chart-header">
              <h3>Portfolio</h3>
              <div className="chart-dropdown">
                <span>Monthly</span>
                <ChevronDown size={16} />
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-y-axis">
                {[0, 10, 20, 30, 40, 50].map((val) => (
                  <span key={val}>{val}k</span>
                ))}
              </div>
              <div className="bar-chart">
                {isLoadingPortfolio && (
                  <span className="rate-currency"><LoadingIndicator size="md" /></span>
                )}

                {!isLoadingPortfolio && portfolioPoints && portfolioPoints.length > 0 && (() => {
                  const maxValue =
                    portfolioPoints.reduce(
                      (max, p) => Math.max(max, Number(p.value ?? 0)),
                      0
                    ) || 1;

                  return portfolioPoints.map((point, index) => {
                    const value = Number(point.value ?? 0);
                    const height = Math.max(5, (value / maxValue) * 100);
                    const label = point.label ?? '';

                    return (
                      <div key={`${label}-${index}`} className="bar-wrapper">
                        <div
                          className={`bar ${index === portfolioPoints.length - 1 ? 'bar-purple' : ''}`}
                          style={{ height: `${height}%` }}
                        />
                        <span className="bar-label">{label}</span>
                      </div>
                    );
                  });
                })()}

                {!isLoadingPortfolio && (!portfolioPoints || portfolioPoints.length === 0) && (
                  <span className="rate-currency">No portfolio data</span>
                )}
              </div>
            </div>
          </div>

            {/* Upcoming Supply, Subscription & Alert Cards */}
            <div className="business-cards-grid">
              {/* Upcoming Supply Card */}
              <div className="upcoming-supply-card">
                <div className="card-section-header">
                  <div className="card-section-header-left">
                    <div className="card-section-indicator"></div>
                    <h3>Upcoming Supply</h3>
                  </div>
                  <a href="#" className="card-see-all-link">See all</a>
                </div>
                <div className="supply-list">
                  {[
                    { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', dueDate: '28 Nov' },
                    { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', dueDate: '28 Nov' },
                    { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', dueDate: '28 Nov' }
                  ].map((supply, index) => (
                    <div key={index} className="supply-item">
                      <div className="supply-avatar">
                        <div className="supply-avatar-placeholder"></div>
                      </div>
                      <div className="supply-content">
                        <div className="supply-name">{supply.name}</div>
                        <div className="supply-email">{supply.email}</div>
                      </div>
                      <div className="supply-right">
                        <div className="supply-amount">{supply.amount}</div>
                        <div className="supply-date">Due date: {supply.dueDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription Card */}
              <div className="subscription-card">
                <div className="card-section-header">
                  <div className="card-section-header-left">
                    <div className="card-section-indicator"></div>
                    <h3>Subscription</h3>
                  </div>
                  <a href="#" className="card-see-all-link">See all</a>
                </div>
                <div className="subscription-list">
                  {[
                    { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', nextPayment: '28 Nov' },
                    { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', nextPayment: '28 Nov' },
                    { name: 'Name 1', email: 'Demoemail@gmail.com', amount: '$24,567.89', nextPayment: '28 Nov' }
                  ].map((subscription, index) => (
                    <div key={index} className="subscription-item">
                      <div className="subscription-avatar">
                        <div className="subscription-avatar-placeholder"></div>
                      </div>
                      <div className="subscription-content">
                        <div className="subscription-name">{subscription.name}</div>
                        <div className="subscription-email">{subscription.email}</div>
                      </div>
                      <div className="subscription-right">
                        <div className="subscription-amount">{subscription.amount}</div>
                        <div className="subscription-date">Next payment: {subscription.nextPayment}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* My Teams & Alert */}
          <div className="dashboard-right-cards">
            <div className="my-teams-card">
              <div className="teams-card-header">
                <div className="teams-header-left">
                  <div className="teams-indicator"></div>
                  <h3>My Teams</h3>
                </div>
                <a href="#" className="teams-see-all-link">See all</a>
              </div>
              <div className="teams-list">
                {[
                  { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
                  { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
                  { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
                  { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
                  { name: 'Payroll1', members: 23, nextDate: '31st Nov' },
                  { name: 'Payroll1', members: 23, nextDate: '31st Nov' }
                ].map((team, index) => (
                  <div key={index} className="team-item">
                    <div className="team-content">
                      <div className="team-name">{team.name}</div>
                      <div className="team-members">
                        Team members <span className="team-badge">{team.members}</span>
                      </div>
                    </div>
                    <div className="team-right">
                      <div className="team-next-date">Next date: {team.nextDate}</div>
                      <button className="team-view-btn">View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert Card */}
            <div className="alert-card">
              <div className="card-section-header">
                <div className="card-section-header-left">
                  <div className="card-section-indicator"></div>
                  <h3>Alert</h3>
                </div>
              </div>
              <div className="alert-content-wrapper">
                <div className="alert-icon">
                  <CreditCard size={40} />
                </div>
                <div className="alert-text-content">
                  <div className="alert-title">Upcoming Payroll Alert</div>
                  <div className="alert-message">
                    Angelo Group's next payout window is opening. Confirm and finalize your disbursement.
                  </div>
                </div>
                <button className="alert-view-btn">View payroll</button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="dashboard-bottom">
        </div>
      </div>
    </>
  );
};

export default BusinessDashboard;
