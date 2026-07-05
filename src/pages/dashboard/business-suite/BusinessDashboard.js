import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
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
  ChevronRight,
  ArrowDown,
  Send,
  FileText,
  Repeat
} from 'lucide-react';
import './BusinessDashboard.css';
import '../dashboard/Dashboard.css';
import logo from '../../../assets/images/icons/logo.png';
import logoWhite from '../../../assets/images/logo/logo_white.png';
import {
  DashboardBalanceSkeleton,
  DashboardMetricValuesSkeleton,
  DashboardSkeletonBlock,
  BusinessSuiteListRowsSkeleton,
  BusinessSuiteTeamRowsSkeleton,
} from '../../../components/DashboardSkeletons';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import AddTeamMemberModal from '../../../components/AddTeamMemberModal';
import AddTeamModal from '../../../components/AddTeamModal';
import AddPayrollModal from '../../../components/AddPayrollModal';
import CreateNewSupplierModal from '../../../components/CreateNewSupplierModal';
import { handleLogout } from '../../../utils/logout';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null, path: '/dashboard' },
  { label: 'Payroll', icon: DollarSign, badge: null, path: '/payroll' },
  { label: 'Supplier Contract', icon: Building2, badge: null, path: '/supplier-contract' },
  { label: 'Invoice', icon: FileText, badge: null, path: '/invoice' },
  { label: 'Transactions', icon: Repeat, badge: null, path: '/transactions' },
  { label: 'Dispute', icon: CreditCard, badge: null, path: '/business-dispute' },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta', path: '/compliance' } // placeholder route (not currently wired)
];

const developersNav = [
  { label: 'API Keys', icon: Code, badge: null, path: '/api-keys' },
  { label: 'Sandbox Environment', icon: Box, badge: null, path: '/sandbox-environment' },
  { label: 'Webhooks', icon: Link, badge: null, path: '/webhook' }
];

const supportNav = [
  { label: 'Settings', icon: Settings, path: '/settings' },
  { label: 'Security', icon: ShieldCheck, path: '/security' } // placeholder route (not currently wired)
];

const formatUsd = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(Number(n)));

const BusinessDashboard = ({
  dashboardData,
  isLoadingDashboard,
  exchangeRates,
  isLoadingRates,
  portfolioPoints,
  isLoadingPortfolio,
  portfolioTimeframe = 'monthly',
  portfolioYear,
  portfolioYAxisTicks = [],
  portfolioScaleMax = 1000,
  formatPortfolioYAxisTick,
  getPortfolioYAxisTickFraction,
  toPortfolioBarHeight,
  renderPortfolioSummary,
  renderPortfolioChartSkeleton,
  handlePortfolioTimeframeChange,
  handlePortfolioYearChange,
  portfolioTimeframeOptions = ['daily', 'monthly', 'yearly'],
  showPortfolioDropdown,
  setShowPortfolioDropdown,
  showPortfolioYearDropdown,
  setShowPortfolioYearDropdown,
  showMobilePortfolioDropdown,
  setShowMobilePortfolioDropdown,
  showMobilePortfolioYearDropdown,
  setShowMobilePortfolioYearDropdown,
  teams = [],
  isLoadingTeams = false,
  onViewTeam,
  upcomingSupply = [],
  isLoadingUpcomingSupply = false,
  subscriptionList = [],
  isLoadingSubscription = false,
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
  isLoadingWalletAddress = false,
  setShowWalletModal,
  handleCreateWallet,
  setShowFundMethodModal,
  setShowFundWalletModal,
  setShowWithdrawWalletModal,
  setShowCreateEscrowModal,
  accountType,
  setAccountType,
  setIsSwitchingAccountType,
  setSwitchMessage,
  businessKycComplete,
  businessCompanyName = '',
  businessCompanyLogoUrl = '',
  isLoadingBusinessKyc = false,
  navigate,
  location,
  getBalanceValue,
  getExchangeRate,
  onTeamCreated
}) => {
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
  const [addTeamMemberTeamId, setAddTeamMemberTeamId] = useState(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddPayrollModal, setShowAddPayrollModal] = useState(false);
  const [showCreateNewSupplierModal, setShowCreateNewSupplierModal] = useState(false);

  const handleNavClick = (item) => {
    if (!item?.path) return;
    // Compliance/Security are placeholders in this repo; avoid navigating to dead routes.
    if (item.path === '/compliance' || item.path === '/security') return;
    navigate(
      item.path,
      item.path === '/dashboard' || item.path === '/settings' || item.path === '/transactions'
        ? { state: { accountType: 'Business Suite' } }
        : undefined
    );
  };

  const handleDevelopersNavClick = (item) => {
    if (!item?.path) return;
    navigate(item.path);
  };

  const renderPortfolioTimeframeDropdown = (mobile = false) => {
    const isOpen = mobile ? showMobilePortfolioDropdown : showPortfolioDropdown;
    const setOpen = mobile ? setShowMobilePortfolioDropdown : setShowPortfolioDropdown;
    const closeYear = mobile ? setShowMobilePortfolioYearDropdown : setShowPortfolioYearDropdown;
    const ChevronSize = mobile ? 14 : 16;

    return (
      <div className={`chart-dropdown${mobile ? ' mobile-section-dropdown' : ''}`} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!isOpen);
            closeYear(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            color: 'inherit',
          }}
        >
          <span>{portfolioTimeframe.charAt(0).toUpperCase() + portfolioTimeframe.slice(1)}</span>
          <ChevronDown size={ChevronSize} />
        </button>
        {isOpen ? (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              minWidth: '120px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {portfolioTimeframeOptions.map((timeframe) => (
              <button
                key={timeframe}
                type="button"
                onClick={() => handlePortfolioTimeframeChange?.(timeframe)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: portfolioTimeframe === timeframe ? '#f0f7ff' : 'white',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  color: portfolioTimeframe === timeframe ? '#2563eb' : 'inherit',
                }}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderPortfolioYearDropdown = (mobile = false) => {
    if (portfolioTimeframe !== 'monthly') return null;
    const isOpen = mobile ? showMobilePortfolioYearDropdown : showPortfolioYearDropdown;
    const setOpen = mobile ? setShowMobilePortfolioYearDropdown : setShowPortfolioYearDropdown;
    const closeTimeframe = mobile ? setShowMobilePortfolioDropdown : setShowPortfolioDropdown;
    const ChevronSize = mobile ? 14 : 16;

    return (
      <div
        className={`chart-dropdown chart-year-dropdown${mobile ? ' mobile-section-dropdown' : ''}`}
        style={{ position: 'relative' }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!isOpen);
            closeTimeframe(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            color: mobile ? 'inherit' : 'var(--text-muted)',
          }}
        >
          <span>{portfolioYear}</span>
          <ChevronDown size={ChevronSize} />
        </button>
        {isOpen ? (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              minWidth: '100px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => handlePortfolioYearChange?.(y)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: portfolioYear === y ? '#f0f7ff' : 'white',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  color: portfolioYear === y ? '#2563eb' : 'inherit',
                }}
              >
                {y}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderBusinessPortfolioChart = (mobile = false) => {
    if (isLoadingPortfolio && renderPortfolioChartSkeleton) {
      return renderPortfolioChartSkeleton(mobile);
    }

    const hasPoints = portfolioPoints && portfolioPoints.length > 0;
    const formatTick = formatPortfolioYAxisTick || ((val) => String(val));
    const tickFraction = getPortfolioYAxisTickFraction || (() => 0);
    const barHeight = toPortfolioBarHeight || (() => 0);

    if (mobile) {
      return (
        <div className="mobile-chart-container">
          <div className={`mobile-chart-body${hasPoints ? ' mobile-chart-body--with-labels' : ''}`}>
            <div className="mobile-chart-y-axis">
              {portfolioYAxisTicks.map((val) => (
                <span
                  key={val}
                  className={`mobile-chart-y-axis-tick${val === 0 ? ' mobile-chart-y-axis-tick--zero' : ''}`}
                  style={{ '--tick-fraction': tickFraction(val) }}
                >
                  {formatTick(val)}
                </span>
              ))}
            </div>
            <div className="mobile-chart-main">
              <div className="mobile-chart-plot-area">
                <div className="mobile-chart-plot-content">
                  <div className="mobile-chart-grid-lines" aria-hidden="true">
                    {portfolioYAxisTicks.map((val) => (
                      <div
                        key={`mobile-grid-${val}`}
                        className="mobile-chart-grid-line"
                        style={{ bottom: `${portfolioScaleMax > 0 ? (val / portfolioScaleMax) * 100 : 0}%` }}
                      />
                    ))}
                  </div>
                  <div className={`mobile-bar-chart${portfolioTimeframe === 'daily' ? ' mobile-bar-chart--daily' : ''}`}>
                    {hasPoints &&
                      portfolioPoints.map((point, index) => {
                        const sub = Number(point.subscriptionUsd ?? 0);
                        const pay = Number(point.payrollUsd ?? 0);
                        const hSub = sub > 0 ? barHeight(sub) : 0;
                        const hPay = pay > 0 ? barHeight(pay) : 0;
                        const label = point.label ?? '';

                        return (
                          <div key={`${label}-${index}`} className="mobile-bar-wrapper bar-wrapper--dual">
                            {(hSub > 0 || hPay > 0) && (
                              <div className="bs-dual-bars">
                                {hSub > 0 && <div className="mobile-bar bs-chart-bar-sub" style={{ height: `${hSub}%` }} />}
                                {hPay > 0 && <div className="mobile-bar bs-chart-bar-pay" style={{ height: `${hPay}%` }} />}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    {!hasPoints && <span className="mobile-rate-currency">No portfolio data</span>}
                  </div>
                </div>
              </div>
              {hasPoints && (
                <div className={`mobile-chart-x-labels${portfolioTimeframe === 'daily' ? ' mobile-chart-x-labels--daily' : ''}`}>
                  {portfolioPoints.map((point, index) => (
                    <span key={`${point.label ?? ''}-${index}`} className="mobile-bar-label">
                      {point.label ?? ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="chart-container">
        <div className={`chart-body${hasPoints ? ' chart-body--with-labels' : ''}`}>
          <div className="chart-y-axis">
            {portfolioYAxisTicks.map((val) => (
              <span
                key={val}
                className={`chart-y-axis-tick${val === 0 ? ' chart-y-axis-tick--zero' : ''}`}
                style={{ '--tick-fraction': tickFraction(val) }}
              >
                {formatTick(val)}
              </span>
            ))}
          </div>
          <div className="chart-main">
            <div className="chart-plot-area">
              <div className="chart-plot-content">
                <div className="chart-grid-lines" aria-hidden="true">
                  {portfolioYAxisTicks.map((val) => (
                    <div
                      key={`grid-${val}`}
                      className="chart-grid-line"
                      style={{ bottom: `${portfolioScaleMax > 0 ? (val / portfolioScaleMax) * 100 : 0}%` }}
                    />
                  ))}
                </div>
                <div className={`bar-chart${portfolioTimeframe === 'daily' ? ' bar-chart--daily' : ''}`}>
                  {hasPoints &&
                    portfolioPoints.map((point, index) => {
                      const sub = Number(point.subscriptionUsd ?? 0);
                      const pay = Number(point.payrollUsd ?? 0);
                      const hSub = sub > 0 ? barHeight(sub) : 0;
                      const hPay = pay > 0 ? barHeight(pay) : 0;
                      const label = point.label ?? '';

                      return (
                        <div key={`${label}-${index}`} className="bar-wrapper bar-wrapper--dual">
                          {(hSub > 0 || hPay > 0) && (
                            <div className="bs-dual-bars">
                              {hSub > 0 && <div className="bar bs-chart-bar-sub" style={{ height: `${hSub}%` }} />}
                              {hPay > 0 && <div className="bar bs-chart-bar-pay" style={{ height: `${hPay}%` }} />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {!hasPoints && <span className="rate-currency">No portfolio data</span>}
                </div>
              </div>
            </div>
            {hasPoints && (
              <div className={`chart-x-labels${portfolioTimeframe === 'daily' ? ' chart-x-labels--daily' : ''}`}>
                {portfolioPoints.map((point, index) => (
                  <span key={`${point.label ?? ''}-${index}`} className="bar-label">
                    {point.label ?? ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Dashboard */}
      <div className="mobile-dashboard">
        {/* Mobile Header */}
        <div className="mobile-dashboard-header">
          <div className="mobile-header-left">
            <HeaderProfileAvatarNav variant="mobile">
              {businessCompanyLogoUrl ? (
                <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} />
              ) : userAvatar ? (
                <img src={userAvatar} alt={userFullName} />
              ) : (
                userInitials
              )}
              <HeaderProfileVerifyBadge show={businessKycComplete} mobile />
            </HeaderProfileAvatarNav>
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
                  const isActive = item.path
                    ? (item.path === '/business-dispute' || item.path === '/payroll')
                      ? (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
                      : location.pathname === item.path
                    : false;
                  const handleNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    if (item.path === '/compliance') return;
                    navigate(
                      item.path,
                      item.path === '/dashboard' || item.path === '/settings' || item.path === '/transactions'
                        ? { state: { accountType: 'Business Suite' } }
                        : undefined
                    );
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
                  const isActive = item.path ? location.pathname === item.path : false;
                  const handleDevelopersNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    navigate(item.path);
                  };
                  return (
                    <button 
                      key={item.label} 
                      type="button" 
                      className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={handleDevelopersNavClick}
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
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleNavClick(item);
                      }}
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
                    if (isLoadingWalletAddress) return;
                    setIsMobileMenuOpen(false);
                    if (hasWallet) {
                      setShowWalletModal(true);
                    } else {
                      handleCreateWallet();
                    }
                  }}
                  disabled={isLoadingWalletAddress}
                >
                  <span>{isLoadingWalletAddress ? 'Loading...' : hasWallet ? 'View wallet' : 'Create wallet'}</span>
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
                <span className="mobile-sidebar-trustiscore-label">Active Suppliers</span>
                <span className="mobile-sidebar-trustiscore-badge">
                  {dashboardData?.suppliers !== undefined 
                    ? dashboardData.suppliers 
                    : (isLoadingDashboard ? '...' : '0')}
                </span>
              </div>

              <button 
                type="button" 
                className="mobile-sidebar-logout"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
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
            {showBalance && isLoadingDashboard ? (
              <DashboardBalanceSkeleton mobile />
            ) : showBalance ? (
              (() => {
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
                    })()
            ) : (
              '••••••'
            )}
          </div>
          {!isLoadingDashboard && (
          <div className="mobile-balance-xrp">
            ≈ {(() => {
                const xrpBalance = getBalanceValue(dashboardData, 'xrp');
                if (xrpBalance !== null && xrpBalance !== undefined) {
                  return Number(xrpBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return '0.00';
              })()} XRP
          </div>
          )}
          <div className="mobile-balance-actions">
            <button 
              type="button" 
              className="mobile-fund-btn"
              onClick={() => setShowFundMethodModal(true)}
            >
              <ArrowDown size={16} />
              Receive
            </button>
            <button
              type="button"
              className="mobile-withdraw-btn"
              onClick={() => setShowWithdrawWalletModal(true)}
            >
              <Send size={16} />
              Send
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
            {isLoadingDashboard ? (
              <DashboardMetricValuesSkeleton mobile wideSubvalue />
            ) : (
              <>
            <div className="mobile-metric-value">
              {dashboardData?.activeEscrows?.count !== undefined 
                ? dashboardData.activeEscrows.count 
                : 23}
            </div>
            <div className="mobile-metric-subvalue">
              ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                  ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                  : '156,789'} locked
            </div>
              </>
            )}
            <button
              type="button"
              className="mobile-metric-btn"
              onClick={() => setShowAddPayrollModal(true)}
            >
              <Plus size={14} />
              Create Payroll
            </button>
          </div>
          <div className="mobile-metric-card">
            <div className="mobile-metric-header">
              <ShieldCheck size={16} />
              <span>Active Suppliers</span>
            </div>
            {isLoadingDashboard ? (
              <DashboardMetricValuesSkeleton mobile withSubvalue={false} />
            ) : (
            <div className="mobile-metric-value">
              {dashboardData?.suppliers !== undefined 
                ? dashboardData.suppliers 
                : 0}
            </div>
            )}
            <div className="mobile-metric-subvalue">
              {dashboardData?.suppliers !== undefined ? 'Active suppliers' : ''}
            </div>
            <button type="button" className="mobile-metric-btn" onClick={() => setShowCreateNewSupplierModal(true)}>
              Create Supplier Escrow
            </button>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="mobile-portfolio-section">
          <div className="mobile-portfolio-header">
            <div className="mobile-section-header">
              <div className="mobile-section-indicator"></div>
              <div className="mobile-portfolio-heading">
                <h3 className="mobile-section-title">Portfolio</h3>
                {renderPortfolioSummary?.()}
              </div>
            </div>
            <div className="mobile-portfolio-header-actions">
              {renderPortfolioTimeframeDropdown(true)}
              {renderPortfolioYearDropdown(true)}
            </div>
          </div>
          <div className="bs-portfolio-legend bs-portfolio-legend--mobile">
            <span><span className="bs-legend-dot bs-legend-dot-sub" /> Subscription</span>
            <span><span className="bs-legend-dot bs-legend-dot-pay" /> Payroll</span>
          </div>
          {renderBusinessPortfolioChart(true)}
        </div>

        {/* My Teams Section */}
        <div className="mobile-my-teams-section">
          <div className="mobile-section-header">
            <div className="mobile-section-indicator"></div>
            <h3 className="mobile-section-title">My Payroll</h3>
            <button type="button" className="mobile-see-all-link" onClick={() => setShowAddTeamModal(true)}>Add a team</button>
          </div>
          <div className="mobile-teams-list">
            {isLoadingTeams ? (
              <BusinessSuiteTeamRowsSkeleton count={2} mobile />
            ) : teams.length === 0 ? (
              <div className="mobile-team-item"><span style={{ color: 'var(--text-muted)' }}>No teams yet</span></div>
            ) : (
              teams.map((team) => (
                <div key={team.id || team.name} className="mobile-team-item">
                  <div className="mobile-team-row1">
                    <div className="mobile-team-name">{team.name}</div>
                    <div className="mobile-team-next-date">Next date: {team.nextDate ?? '—'}</div>
                  </div>
                  <div className="mobile-team-row2">
                    <span className="mobile-team-members-wrap">
                      <span className="mobile-team-members">Team members</span>
                      <span className="mobile-team-badge">{team.memberCount ?? team.members ?? 0}</span>
                    </span>
                    <div className="mobile-team-actions">
                      <button type="button" className="mobile-team-add-members" onClick={() => { setAddTeamMemberTeamId(team.id); setShowAddTeamMemberModal(true); }}>Add team members</button>
                      <button type="button" className="mobile-team-view-btn" onClick={() => onViewTeam?.(team.id)}>View</button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
            {isLoadingUpcomingSupply ? (
              <BusinessSuiteListRowsSkeleton count={3} mobile />
            ) : upcomingSupply.length === 0 ? (
              <div className="mobile-supply-item"><span style={{ color: 'var(--text-muted)' }}>No upcoming supply</span></div>
            ) : (
              upcomingSupply.map((supply) => (
                <div key={supply.id || supply.email} className="mobile-supply-item">
                  <div className="mobile-supply-avatar">
                    <div className="mobile-supply-avatar-placeholder"></div>
                  </div>
                  <div className="mobile-supply-content">
                    <div className="mobile-supply-name">{supply.name ?? '—'}</div>
                    <div className="mobile-supply-email">{supply.email ?? '—'}</div>
                  </div>
                  <div className="mobile-supply-right">
                    <div className="mobile-supply-amount">{formatUsd(supply.amountUsd)}</div>
                    <div className="mobile-supply-date">Due date: {supply.dueDate ?? '—'}</div>
                  </div>
                </div>
              ))
            )}
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
            {isLoadingSubscription ? (
              <BusinessSuiteListRowsSkeleton count={3} mobile />
            ) : subscriptionList.length === 0 ? (
              <div className="mobile-subscription-item"><span style={{ color: 'var(--text-muted)' }}>No subscriptions</span></div>
            ) : (
              subscriptionList.map((sub) => (
                <div key={sub.id || sub.email} className="mobile-subscription-item">
                  <div className="mobile-subscription-avatar">
                    <div className="mobile-subscription-avatar-placeholder"></div>
                  </div>
                  <div className="mobile-subscription-content">
                    <div className="mobile-subscription-name">{sub.name ?? '—'}</div>
                    <div className="mobile-subscription-email">{sub.email ?? '—'}</div>
                  </div>
                  <div className="mobile-subscription-right">
                    <div className="mobile-subscription-amount">{formatUsd(sub.amountUsd)}</div>
                    <div className="mobile-subscription-date">Next payment: {sub.nextPayment ?? sub.dueDate ?? '—'}</div>
                  </div>
                </div>
              ))
            )}
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
                {isLoadingUserProfile ? (
                  <DashboardSkeletonBlock className="business-suite-card-holder-skeleton" />
                ) : (
                  userFullName
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: content only (parent provides sidebar + main) */}
      <div className="bs-dashboard">
        <div className="bs-breadcrumb">
          <span>General</span>
          <span className="bs-breadcrumb-current">› Dashboard</span>
        </div>

        {/* 4 cards */}
        <div className="bs-cards-row">
          <div className="bs-card bs-card-balance">
            <div className="bs-card-header">
              <div className="bs-card-header-left">
                <Eye size={18} />
                <h3 className="bs-card-title">Total Balance</h3>
              </div>
            </div>
            <div className="bs-card-balance-row">
              {showBalance && isLoadingDashboard ? (
                <DashboardBalanceSkeleton />
              ) : (
                <>
              <span className="bs-card-value">
                {showBalance
                  ? (() => {
                          let usdBalance = null;
                          if (dashboardData?.balance?.xrp != null && exchangeRates?.length > 0) {
                            const xrpToUsdRate = getExchangeRate('XRP', 'USD');
                            if (xrpToUsdRate != null) {
                              usdBalance = Number(dashboardData.balance.xrp) * Number(xrpToUsdRate);
                            } else {
                              const usdRate = exchangeRates.find(r =>
                                (r.from === 'XRP' && r.to === 'USD') ||
                                (r.currency === 'USD' || r.code === 'USD')
                              );
                              if (usdRate && usdRate.rate != null) {
                                usdBalance = Number(dashboardData.balance.xrp) * Number(usdRate.rate);
                              }
                            }
                          }
                          if (usdBalance == null) usdBalance = getBalanceValue(dashboardData, 'usd');
                          if (usdBalance == null && dashboardData?.balance != null) {
                            const b = dashboardData.balance;
                            const directUsd = b.usd ?? b.USD ?? b.usdAmount;
                            if (directUsd != null) usdBalance = Number(directUsd);
                          }
                          if (usdBalance != null) return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          return '$0.00';
                        })()
                  : '••••••'}
              </span>
              <span className="bs-card-subvalue">
                ≈ {dashboardData?.balance?.xrp != null
                  ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'} XRP
              </span>
                </>
              )}
            </div>
            <div className="bs-card-actions">
              <button type="button" className="bs-btn bs-btn-primary" onClick={() => setShowFundMethodModal(true)}><ArrowDown size={16} /> Receive</button>
              <button type="button" className="bs-btn" onClick={() => setShowWithdrawWalletModal(true)}><Send size={16} /> Send</button>
            </div>
          </div>

          <div className="bs-card bs-card-metric">
            <div className="bs-card-header">
              <div className="bs-card-header-left">
                <Users size={16} />
                <h3 className="bs-card-title">Total Payroll Teams</h3>
              </div>
            </div>
            {isLoadingDashboard ? (
              <DashboardMetricValuesSkeleton inline wideSubvalue />
            ) : (
            <div className="bs-card-value-inline">
              <span className="bs-card-value">
                {dashboardData?.activeEscrows?.count !== undefined ? dashboardData.activeEscrows.count : 23}
              </span><span className="bs-card-subvalue">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '156,789'} locked
              </span>
            </div>
            )}
            <button type="button" className="bs-btn" onClick={() => setShowAddPayrollModal(true)}>+ Create Payroll</button>
          </div>

          <div className="bs-card bs-card-metric">
            <div className="bs-card-header">
              <div className="bs-card-header-left">
                <ShieldCheck size={16} />
                <h3 className="bs-card-title">Active Suppliers</h3>
              </div>
            </div>
            {isLoadingDashboard ? (
              <DashboardMetricValuesSkeleton inline withSubvalue={false} />
            ) : (
            <div className="bs-card-value-inline">
              <span className="bs-card-value">
                {dashboardData?.suppliers !== undefined ? dashboardData.suppliers : 0}
              </span>
              <span className="bs-card-subvalue">Active suppliers</span>
            </div>
            )}
            <button type="button" className="bs-btn" onClick={() => setShowCreateNewSupplierModal(true)}>+ Add supplier contract</button>
          </div>

          <div className="bs-card bs-card-subscription">
            <div className="bs-card-header">
              <div className="bs-card-header-left">
                <CreditCard size={16} />
                <h3 className="bs-card-title">Total Subscription</h3>
              </div>
            </div>
            <div className="bs-card-value">
              {isLoadingTotalEscrowed ? (
                <DashboardSkeletonBlock className="business-suite-single-value-skeleton" />
              ) : (
                <>${totalEscrowedAmount != null ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</>
              )}
            </div>
            <button type="button" className="bs-btn">View Payroll Escrow</button>
          </div>
        </div>

        {/* Middle: Portfolio | My Teams + Alert */}
        <div className="bs-middle-row">
          <div className="bs-middle-left">
            <div className="bs-portfolio-card dashboard-chart-card">
              <div className="chart-header">
                <div className="chart-header-left">
                  <div className="chart-portfolio-heading">
                    <h3 className="bs-portfolio-title">Portfolio</h3>
                    {renderPortfolioSummary?.()}
                  </div>
                </div>
                <div className="chart-header-actions">
                  {renderPortfolioTimeframeDropdown(false)}
                  {renderPortfolioYearDropdown(false)}
                </div>
              </div>
              <div className="bs-portfolio-legend">
                <span><span className="bs-legend-dot bs-legend-dot-sub" /> Subscription</span>
                <span><span className="bs-legend-dot bs-legend-dot-pay" /> Payroll</span>
              </div>
              {renderBusinessPortfolioChart(false)}
            </div>
            {/* Upcoming Supply & Subscription directly under Portfolio */}
            <div className="bs-under-portfolio">
              <div className="bs-list-card">
                <div className="bs-list-card-header">
                  <h3 className="bs-list-card-title">Upcoming Supply</h3>
                  <a href="#" className="bs-list-card-see-all">See all</a>
                </div>
                {isLoadingUpcomingSupply ? (
                  <BusinessSuiteListRowsSkeleton count={3} />
                ) : upcomingSupply.length === 0 ? (
                  <div className="bs-list-item"><span style={{ color: 'var(--text-muted)' }}>No upcoming supply</span></div>
                ) : (
                  upcomingSupply.map((row) => (
                    <div key={row.id || row.email} className="bs-list-item">
                      <div className="bs-list-avatar" />
                      <div className="bs-list-content">
                        <div className="bs-list-name">{row.name ?? '—'}</div>
                        <div className="bs-list-email">{row.email ?? '—'}</div>
                      </div>
                      <div className="bs-list-right">
                        <div className="bs-list-amount">{formatUsd(row.amountUsd)}</div>
                        <div className="bs-list-date">Due date: {row.dueDate ?? '—'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="bs-list-card">
                <div className="bs-list-card-header">
                  <h3 className="bs-list-card-title">Subscription</h3>
                  <a href="#" className="bs-list-card-see-all">See all</a>
                </div>
                {isLoadingSubscription ? (
                  <BusinessSuiteListRowsSkeleton count={3} />
                ) : subscriptionList.length === 0 ? (
                  <div className="bs-list-item"><span style={{ color: 'var(--text-muted)' }}>No subscriptions</span></div>
                ) : (
                  subscriptionList.map((row) => (
                    <div key={row.id || row.email} className="bs-list-item">
                      <div className="bs-list-avatar" />
                      <div className="bs-list-content">
                        <div className="bs-list-name">{row.name ?? '—'}</div>
                        <div className="bs-list-email">{row.email ?? '—'}</div>
                      </div>
                      <div className="bs-list-right">
                        <div className="bs-list-amount">{formatUsd(row.amountUsd)}</div>
                        <div className="bs-list-date">Next payment: {row.nextPayment ?? row.dueDate ?? '—'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="bs-middle-right">
            <div className="bs-teams-card">
              <div className="bs-teams-header">
                <h3 className="bs-teams-title">My Payroll</h3>
                <button type="button" className="bs-teams-see-all" onClick={() => setShowAddTeamModal(true)}>Add a team</button>
              </div>
              <div className="bs-teams-list">
                {isLoadingTeams ? (
                  <BusinessSuiteTeamRowsSkeleton count={2} />
                ) : teams.length === 0 ? (
                  <div className="bs-team-item"><span style={{ color: 'var(--text-muted)' }}>No teams yet</span></div>
                ) : (
                  teams.map((team) => (
                    <div key={team.id || team.name} className="bs-team-item">
                      <div className="bs-team-row1">
                        <div className="bs-team-name">{team.name}</div>
                        <div className="bs-team-next-date">Next date: {team.nextDate ?? '—'}</div>
                      </div>
                      <div className="bs-team-row2">
                        <span className="bs-team-members-wrap">
                          <span className="bs-team-members">Team members</span>
                          <span className="bs-team-badge">{team.memberCount ?? team.members ?? 0}</span>
                        </span>
                        <div className="bs-team-actions">
                          <button type="button" className="bs-team-add-members" onClick={() => { setAddTeamMemberTeamId(team.id); setShowAddTeamMemberModal(true); }}>Add team members</button>
                          <button type="button" className="bs-team-view" onClick={() => onViewTeam?.(team.id)}>View</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bs-alert-card">
              <div className="bs-alert-header">
                <span className="bs-alert-indicator" />
                <h3 className="bs-alert-title">Alert</h3>
              </div>
              <div className="bs-alert-body">
                <div className="bs-alert-icon"><CreditCard size={32} /></div>
                <div>
                  <div className="bs-alert-heading">Upcoming Payroll Alert</div>
                  <div className="bs-alert-message">Angelo Group's next payout window is opening. Confirm and finalize your disbursement.</div>
                  <button type="button" className="bs-alert-btn">View payroll</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <AddTeamMemberModal
        isOpen={showAddTeamMemberModal}
        onCancel={() => { setShowAddTeamMemberModal(false); setAddTeamMemberTeamId(null); }}
        onSuccess={() => { setShowAddTeamMemberModal(false); setAddTeamMemberTeamId(null); }}
        teamId={addTeamMemberTeamId}
      />
      <AddTeamModal
        isOpen={showAddTeamModal}
        onCancel={() => setShowAddTeamModal(false)}
        onSuccess={() => {
          setShowAddTeamModal(false);
          onTeamCreated?.();
        }}
      />
      <AddPayrollModal
        isOpen={showAddPayrollModal}
        onCancel={() => setShowAddPayrollModal(false)}
        onSuccess={() => {
          setShowAddPayrollModal(false);
          navigate?.('/payroll');
        }}
      />
      <CreateNewSupplierModal
        isOpen={showCreateNewSupplierModal}
        onCancel={() => setShowCreateNewSupplierModal(false)}
        onSuccess={(data) => {
          setShowCreateNewSupplierModal(false);
          if (data) navigate?.('/supplier-contract');
        }}
      />
    </>
  );
};

export default BusinessDashboard;
