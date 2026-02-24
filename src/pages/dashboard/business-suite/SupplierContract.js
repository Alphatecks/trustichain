import React, { useState } from 'react';
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
  FileText,
  ArrowDown,
  ArrowRight as ArrowRightIcon,
  Filter,
  ShoppingCart,
  Package,
  Monitor,
  Info,
  Calendar
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './SupplierContract.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { handleLogout } from '../../../utils/logout';
import FundSupplyAccountModal from '../../../components/FundSupplyAccountModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
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

const SupplierContract = ({
  dashboardData,
  isLoadingDashboard,
  exchangeRates,
  isLoadingRates,
  walletBalances,
  isLoadingWalletBalances,
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
  setShowFundWalletModal,
  setShowFundSupplyAccountModal,
  setShowWithdrawWalletModal,
  setShowWithdrawModal,
  setShowCreateNewSupplierModal,
  accountType,
  setAccountType,
  setIsSwitchingAccountType,
  setSwitchMessage,
  businessKycComplete,
  navigate,
  location,
  getBalanceValue,
  getExchangeRate,
  totalEscrowedAmount,
  isLoadingTotalEscrowed
}) => {
  const [transactionFilter, setTransactionFilter] = useState('All');
  const [monthlyFilter, setMonthlyFilter] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(12);
  const [fundSupplyAmount, setFundSupplyAmount] = useState('24,567.89');
  const [showFundSupplyAccountModalMobile, setShowFundSupplyAccountModalMobile] = useState(false);
  const [showWithdrawSupplyAccountModalMobile, setShowWithdrawSupplyAccountModalMobile] = useState(false);
  const [withdrawSupplyAmount, setWithdrawSupplyAmount] = useState('24,567.89');
  const [withdrawWalletType, setWithdrawWalletType] = useState('USD wallet');
  const [showCreateNewSupplierModalMobile, setShowCreateNewSupplierModalMobile] = useState(false);
  const [newSupplierStep, setNewSupplierStep] = useState(1);
  const [showSupplierDetailsModalMobile, setShowSupplierDetailsModalMobile] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    supplierName: '',
    dueDate: '',
    amount: '24,567.89',
    accountType: 'bank',
    walletType: '',
    walletAddress: '',
    currency: '',
    bankName: '',
    accountNumber: ''
  });

  const supplierDetails = [
    { id: 'SUPP-2024-00', progress: 75, dueDate: '14th Nov 25', amount: '$16,000' },
    { id: 'SUPP-2024-002', progress: 15, percentage: '15%', amount: '$4,000' },
    { id: 'SUPP-2024-00', progress: 75, dueDate: '14th Nov 25', amount: '$16,000' },
    { id: 'SUPP-2024-002', progress: 15, percentage: '15%', amount: '$4,000' }
  ];

  const transactions = Array(9).fill({
    id: 'F4E5D6...C1B2A3',
    type: 'Received',
    amount: '+50 XRP ($25.00 USD)',
    status: 'Successful',
    date: '2024-07-04'
  });

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
                  handleLogout();
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Supplier Contract Content */}
        <div className="supplier-contract-mobile-content">
          {/* Total Supply Amount Card - Mobile */}
          <div className="supplier-total-supply-card-mobile">
            <div className="supplier-total-supply-header-mobile">
              <div className="supplier-total-supply-header-left-mobile">
                <div className="supplier-total-supply-icon-mobile">
                  <Wallet size={18} />
                </div>
                <h3 className="supplier-total-supply-title-mobile">Total supply amount</h3>
              </div>
              <button 
                type="button" 
                className="supplier-total-supply-eye-mobile"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            <div className="supplier-total-supply-amount-mobile">
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
                        }
                        const usdBalance = getBalanceValue(dashboardData, 'usd');
                        if (usdBalance !== null && usdBalance !== undefined) {
                          return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                        return '$24,567.89';
                      })())
                : '••••••'}
            </div>
            <div className="supplier-total-supply-xrp-mobile">
              ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                  ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '45,234')} XRP
            </div>
            <div className="supplier-total-supply-actions-mobile">
              <button 
                type="button" 
                className="supplier-fund-wallet-btn-mobile"
                onClick={() => setShowFundSupplyAccountModalMobile(true)}
              >
                <Plus size={16} />
                <span>Fund Wallet</span>
              </button>
              <button 
                type="button" 
                className="supplier-withdraw-btn-mobile"
                onClick={() => setShowWithdrawSupplyAccountModalMobile(true)}
              >
                <Plus size={16} />
                <span>Withdraw</span>
              </button>
            </div>
          </div>

          {/* Supplier Cards - Horizontally Scrollable */}
          <div className="supplier-cards-scrollable-mobile">
            {/* Total Supplier Card - Mobile */}
            <div className="supplier-total-supplier-card-mobile">
              <div className="supplier-card-header-mobile">
                <div className="supplier-card-icon-mobile">
                  <Users size={20} />
                </div>
                <h3 className="supplier-card-title-mobile">Total supplier</h3>
              </div>
              <div className="supplier-card-value-mobile">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </div>
              <div className="supplier-card-secondary-mobile">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </div>
              <button
                type="button"
                className="supplier-create-btn-mobile"
                onClick={() => setShowCreateNewSupplierModalMobile(true)}
              >
                <Plus size={16} />
                <span>Create new supplier</span>
              </button>
            </div>

            {/* Pending Supplier Card - Mobile */}
            <div className="supplier-pending-supplier-card-mobile">
              <div className="supplier-card-header-mobile">
                <div className="supplier-card-icon-mobile">
                  <Monitor size={20} />
                </div>
                <h3 className="supplier-card-title-mobile">Pending supplier</h3>
              </div>
              <div className="supplier-card-value-mobile">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="supplier-card-ratio-mobile">/100</span>
              </div>
              <div className="supplier-card-label-mobile">
                {dashboardData?.trustiscore?.level !== undefined 
                  ? dashboardData.trustiscore.level 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
              </div>
            </div>

            {/* Total Supplier Amount Card - Mobile */}
            <div className="supplier-total-supplier-amount-card-mobile">
              <div className="supplier-card-header-mobile">
                <div className="supplier-card-icon-mobile">
                  <FileText size={20} />
                </div>
                <h3 className="supplier-card-title-mobile">Total Supplier Amount</h3>
              </div>
              <div className="supplier-card-value-mobile">
                ${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '45,280')}
              </div>
            </div>
          </div>

          {/* Upcoming Supply Section - Mobile */}
          <div className="upcoming-supply-section-mobile">
            <div className="upcoming-supply-header-mobile">
              <div className="upcoming-supply-title-wrapper-mobile">
                <div className="upcoming-supply-blue-accent-mobile"></div>
                <h2 className="upcoming-supply-title-mobile">Upcoming Supply</h2>
              </div>
              <button className="upcoming-supply-see-all-mobile">See All</button>
            </div>

            <div className="upcoming-supply-grid-mobile">
              {supplierDetails.map((supplier, index) => (
                <div key={index} className="upcoming-supply-card-mobile">
                  <div className="upcoming-supply-progress-circle-mobile">
                    <svg className="upcoming-supply-progress-ring-mobile" width="60" height="60">
                      <circle
                        className="upcoming-supply-progress-ring-background-mobile"
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="4"
                      />
                      <circle
                        className="upcoming-supply-progress-ring-progress-mobile"
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 25}`}
                        strokeDashoffset={`${2 * Math.PI * 25 * (1 - supplier.progress / 100)}`}
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                    <span className="upcoming-supply-progress-text-mobile">{supplier.progress}%</span>
                  </div>
                  <div className="upcoming-supply-id-mobile">#{supplier.id}</div>
                  {supplier.dueDate && (
                    <div className="upcoming-supply-due-date-mobile">Due date: {supplier.dueDate}</div>
                  )}
                  {supplier.percentage && (
                    <div className="upcoming-supply-percentage-mobile">{supplier.percentage}</div>
                  )}
                  <div className="upcoming-supply-amount-section-mobile">
                    <div className="upcoming-supply-amount-label-mobile">Amount</div>
                    <div className="upcoming-supply-amount-value-mobile">{supplier.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History Section - Mobile */}
          <div className="supplier-transaction-history-section-mobile">
            <div className="supplier-transaction-history-header-mobile">
              <div className="supplier-transaction-history-title-wrapper-mobile">
                <div className="supplier-transaction-history-blue-accent-mobile"></div>
                <h2 className="supplier-transaction-history-title-mobile">Transaction History</h2>
              </div>
              <button className="supplier-transaction-history-arrow-mobile">
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="supplier-transaction-history-list-mobile">
              {transactions.slice(0, 4).map((transaction, index) => (
                <div key={index} className="supplier-transaction-item-mobile">
                  <div className="supplier-transaction-icon-mobile">
                    <ArrowDown size={16} />
                  </div>
                  <div className="supplier-transaction-content-mobile">
                    <div className="supplier-transaction-type-mobile">Received</div>
                    <div className="supplier-transaction-description-mobile">You received 50 XRP, worth $25.00 USD.</div>
                  </div>
                  <div className="supplier-transaction-right-mobile">
                    <div className="supplier-transaction-status-mobile">Successful</div>
                    <div className="supplier-transaction-date-mobile">2024-07-04</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fund Supply Account Modal - Mobile */}
          {showFundSupplyAccountModalMobile && (
            <div className="fund-supply-account-modal-mobile">
              <div className="fund-supply-account-header-mobile">
                <div className="fund-supply-account-title-wrapper-mobile">
                  <div className="fund-supply-account-blue-accent-mobile"></div>
                  <h2 className="fund-supply-account-title-mobile">Fund supply account</h2>
                </div>
                <button
                  className="fund-supply-account-close-mobile"
                  onClick={() => setShowFundSupplyAccountModalMobile(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="fund-supply-account-content-mobile">
                <div className="fund-supply-account-amount-section-mobile">
                  <div className="fund-supply-account-amount-header-mobile">
                    <label className="fund-supply-account-amount-label-mobile">Amount</label>
                    <div className="fund-supply-account-currency-selector-mobile">
                      <img
                        src="https://cryptologos.cc/logos/xrp-xrp-logo.png"
                        alt="XRP"
                        className="fund-supply-account-currency-logo-mobile"
                      />
                      <span className="fund-supply-account-currency-text-mobile">XRP wallet</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="fund-supply-account-amount-input-mobile"
                    value={`$${fundSupplyAmount}`}
                    onChange={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setFundSupplyAmount(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setFundSupplyAmount(numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }
                    }}
                    placeholder="$0.00"
                  />
                  <div className="fund-supply-account-balance-mobile">Balance: 24,567.89 USDT</div>
                </div>

                <button className="fund-supply-account-button-mobile">
                  Fund
                </button>

                <div className="fund-supply-account-info-mobile">
                  <Info size={16} />
                  <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                </div>
              </div>
            </div>
          )}

          {/* Withdraw Supply Account Modal - Mobile */}
          {showWithdrawSupplyAccountModalMobile && (
            <div className="withdraw-supply-account-modal-mobile">
              <div className="withdraw-supply-account-header-mobile">
                <div className="withdraw-supply-account-title-wrapper-mobile">
                  <div className="withdraw-supply-account-blue-accent-mobile"></div>
                  <h2 className="withdraw-supply-account-title-mobile">Withdraw</h2>
                </div>
                <button
                  className="withdraw-supply-account-close-mobile"
                  onClick={() => setShowWithdrawSupplyAccountModalMobile(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="withdraw-supply-account-content-mobile">
                <div className="withdraw-supply-account-amount-section-mobile">
                  <div className="withdraw-supply-account-amount-header-mobile">
                    <label className="withdraw-supply-account-amount-label-mobile">Amount</label>
                    <div className="withdraw-supply-account-currency-selector-mobile">
                      <img
                        src="https://cryptologos.cc/logos/xrp-xrp-logo.png"
                        alt="XRP"
                        className="withdraw-supply-account-currency-logo-mobile"
                      />
                      <span className="withdraw-supply-account-currency-text-mobile">XRP wallet</span>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="withdraw-supply-account-amount-input-mobile"
                    value={`$${withdrawSupplyAmount}`}
                    onChange={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setWithdrawSupplyAmount(value);
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.target.value.replace('$', '').replace(/,/g, '');
                      if (value) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue)) {
                          setWithdrawSupplyAmount(numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }
                    }}
                    placeholder="$0.00"
                  />
                  <div className="withdraw-supply-account-balance-mobile">Balance: 24,567.89 USDT</div>
                </div>

                <div className="withdraw-supply-account-wallet-type-section-mobile">
                  <label className="withdraw-supply-account-wallet-type-label-mobile">Wallet Type</label>
                  <div className="withdraw-supply-account-wallet-type-selector-mobile">
                    <span className="withdraw-supply-account-wallet-type-text-mobile">{withdrawWalletType}</span>
                    <ChevronDown size={16} />
                  </div>
                </div>

                <button className="withdraw-supply-account-button-mobile">
                  Withdraw
                </button>

                <div className="withdraw-supply-account-info-mobile">
                  <Info size={16} />
                  <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                </div>
              </div>
            </div>
          )}

          {/* Create New Supplier Modal - Mobile */}
          {showCreateNewSupplierModalMobile && (
            <div className="create-new-supplier-modal-mobile">
              <div className="create-new-supplier-header-mobile">
                <div className="create-new-supplier-title-wrapper-mobile">
                  <div className="create-new-supplier-blue-accent-mobile"></div>
                  <h2 className="create-new-supplier-title-mobile">Create New Supplier</h2>
                </div>
                <button
                  className="create-new-supplier-close-mobile"
                  onClick={() => {
                    setShowCreateNewSupplierModalMobile(false);
                    setNewSupplierStep(1);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="create-new-supplier-content-mobile">
                {newSupplierStep === 1 && (
                  <>
                    <div className="create-new-supplier-field-mobile">
                      <label className="create-new-supplier-label-mobile">Supplier name</label>
                      <input
                        type="text"
                        className="create-new-supplier-input-mobile"
                        placeholder="Enter name"
                        value={newSupplierForm.supplierName}
                        onChange={(e) => setNewSupplierForm({...newSupplierForm, supplierName: e.target.value})}
                      />
                    </div>

                    <div className="create-new-supplier-field-mobile">
                      <label className="create-new-supplier-label-mobile">Due Date</label>
                      <div className="create-new-supplier-input-wrapper-mobile">
                        <input
                          type="text"
                          className="create-new-supplier-input-mobile"
                          placeholder="00/00/00"
                          value={newSupplierForm.dueDate}
                          onChange={(e) => setNewSupplierForm({...newSupplierForm, dueDate: e.target.value})}
                        />
                        <Calendar size={18} className="create-new-supplier-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="create-new-supplier-amount-section-mobile">
                      <label className="create-new-supplier-label-mobile">Amount</label>
                      <input
                        type="text"
                        className="create-new-supplier-amount-input-mobile"
                        value={`$${newSupplierForm.amount}`}
                        onChange={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setNewSupplierForm({...newSupplierForm, amount: value});
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              setNewSupplierForm({...newSupplierForm, amount: numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })});
                            }
                          }
                        }}
                        placeholder="$0.00"
                      />
                      <div className="create-new-supplier-balance-mobile">Balance: {newSupplierForm.amount}</div>
                    </div>

                    <button 
                      className="create-new-supplier-button-mobile"
                      onClick={() => setNewSupplierStep(2)}
                    >
                      Next
                    </button>

                    <div className="create-new-supplier-info-mobile">
                      <Info size={16} />
                      <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                    </div>
                  </>
                )}

                {newSupplierStep === 2 && (
                  <>
                    <div className="create-new-supplier-field-mobile">
                      <label className="create-new-supplier-account-type-label-mobile">Account Type</label>
                      <div className="create-new-supplier-account-type-buttons-mobile">
                        <button
                          type="button"
                          className={`create-new-supplier-account-type-btn-mobile ${newSupplierForm.accountType === 'bank' ? 'active' : ''}`}
                          onClick={() => setNewSupplierForm({...newSupplierForm, accountType: 'bank'})}
                        >
                          <Building2 size={18} />
                          <span>Bank Transfer</span>
                        </button>
                        <button
                          type="button"
                          className={`create-new-supplier-account-type-btn-mobile ${newSupplierForm.accountType === 'wallet' ? 'active' : ''}`}
                          onClick={() => setNewSupplierForm({...newSupplierForm, accountType: 'wallet'})}
                        >
                          <Wallet size={18} />
                          <span>Wallet Transfer</span>
                        </button>
                      </div>
                    </div>

                    {newSupplierForm.accountType === 'bank' ? (
                      <>
                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Currency</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Select"
                              value={newSupplierForm.currency}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, currency: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Bank Name</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Select"
                              value={newSupplierForm.bankName}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, bankName: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Account Number</label>
                          <input
                            type="text"
                            className="create-new-supplier-input-mobile"
                            placeholder="Enter account name"
                            value={newSupplierForm.accountNumber}
                            onChange={(e) => setNewSupplierForm({...newSupplierForm, accountNumber: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Wallet Type</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Select"
                              value={newSupplierForm.walletType}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, walletType: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="create-new-supplier-field-mobile">
                          <label className="create-new-supplier-label-mobile">Wallet Address</label>
                          <div className="create-new-supplier-input-wrapper-mobile">
                            <input
                              type="text"
                              className="create-new-supplier-input-mobile"
                              placeholder="Enter Wallet address"
                              value={newSupplierForm.walletAddress}
                              onChange={(e) => setNewSupplierForm({...newSupplierForm, walletAddress: e.target.value})}
                            />
                            <ChevronDown size={18} className="create-new-supplier-input-icon-mobile" />
                          </div>
                        </div>
                      </>
                    )}

                    <button 
                      className="create-new-supplier-button-mobile"
                      onClick={() => {
                        setShowCreateNewSupplierModalMobile(false);
                        setShowSupplierDetailsModalMobile(true);
                        setNewSupplierStep(1);
                      }}
                    >
                      Done
                    </button>

                    <div className="create-new-supplier-info-mobile">
                      <Info size={16} />
                      <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Supplier Details Modal - Mobile */}
          {showSupplierDetailsModalMobile && (
            <div className="supplier-details-modal-mobile">
              <div className="supplier-details-header-mobile">
                <div className="supplier-details-title-wrapper-mobile">
                  <div className="supplier-details-blue-accent-mobile"></div>
                  <h2 className="supplier-details-title-mobile">Details</h2>
                </div>
                <button
                  className="supplier-details-close-mobile"
                  onClick={() => setShowSupplierDetailsModalMobile(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="supplier-details-content-mobile">
                <div className="supplier-details-section-mobile">
                  <h3 className="supplier-details-section-title-mobile">Transaction ID</h3>
                  
                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Supplier Details</span>
                    <span className="supplier-details-value-mobile">#SUPP-2024-00</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Supplier Name</span>
                    <span className="supplier-details-value-mobile">Jenny . O</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Due Date</span>
                    <span className="supplier-details-value-mobile">30 - 12 - 25</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Account Type</span>
                    <span className="supplier-details-value-mobile">Bank Transfer</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Currency</span>
                    <span className="supplier-details-value-mobile">USD</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Amount</span>
                    <span className="supplier-details-value-mobile">$5,000</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Bank Name</span>
                    <span className="supplier-details-value-mobile">Bank Name</span>
                  </div>

                  <div className="supplier-details-row-mobile">
                    <span className="supplier-details-label-mobile">Account Number</span>
                    <span className="supplier-details-value-mobile">034326483252</span>
                  </div>
                </div>

                <div className="supplier-details-status-mobile">
                  <span className="supplier-details-label-mobile">Status</span>
                  <span className="supplier-details-status-value-mobile">Successful</span>
                </div>

                <div className="supplier-details-actions-mobile">
                  <button className="supplier-details-delete-btn-mobile">
                    Delete
                  </button>
                  <button 
                    className="supplier-details-done-btn-mobile"
                    onClick={() => setShowSupplierDetailsModalMobile(false)}
                  >
                    Done
                  </button>
                </div>

                <div className="supplier-details-info-mobile">
                  <Info size={16} />
                  <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Dashboard */}
      <div className="dashboard-content">
        {/* Breadcrumb */}
        <div className="card-breadcrumb">
          <span className="breadcrumb-root">Business Suite</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-current">Supplier Contract</span>
        </div>

        {/* Summary Cards */}
        <div className="dashboard-summary-cards">
          {/* Total Supply Amount Card */}
          <div className="summary-card total-supply-amount-card">
            <div className="total-supply-header">
              <div className="total-supply-header-left">
                <div className="total-supply-icon-circle">
                  <Wallet size={16} />
                </div>
                <h3>Total supply amount</h3>
              </div>
              <button 
                type="button" 
                className="total-supply-eye-toggle"
                onClick={() => setShowBalance(!showBalance)}
              >
                <div className="total-supply-icon-circle">
                  <Eye size={16} />
                </div>
              </button>
            </div>
            <div className="total-supply-amount-row">
              <div className="total-supply-main-amount">
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
                          }
                          const usdBalance = getBalanceValue(dashboardData, 'usd');
                          if (usdBalance !== null && usdBalance !== undefined) {
                            return `$${Number(usdBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          }
                          return '$24,567.89';
                        })())
                  : '••••••'}
              </div>
              <div className="total-supply-xrp-amount">
                ≈ {dashboardData?.balance?.xrp !== undefined && dashboardData?.balance?.xrp !== null 
                    ? Number(dashboardData.balance.xrp).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '45,234')} XRP
              </div>
            </div>
            <div className="total-supply-actions">
              <button 
                type="button" 
                className="total-supply-btn fund-btn"
                onClick={() => setShowFundSupplyAccountModal(true)}
              >
                <Plus size={16} />
                Fund Supply Account
              </button>
              <button 
                type="button" 
                className="total-supply-btn withdraw-btn"
                onClick={() => setShowWithdrawModal(true)}
              >
                <Plus size={16} />
                Withdraw
              </button>
            </div>
          </div>

          {/* Total Supplier Card */}
          <div className="summary-card total-supplier-card overview-card">
            <div className="overview-card-icon">
              <Users />
            </div>
            <h3 className="overview-card-title">Total supplier</h3>
            <div className="overview-card-metrics">
              <span className="overview-card-main-value">
                {dashboardData?.activeEscrows?.count !== undefined 
                  ? dashboardData.activeEscrows.count 
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 23)}
              </span>
              <span className="overview-card-secondary-value">
                ${dashboardData?.activeEscrows?.lockedAmount !== undefined 
                    ? dashboardData.activeEscrows.lockedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
                    : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : '156,789')} locked
              </span>
            </div>
            <button
              type="button"
              className="overview-card-button"
              onClick={() => setShowCreateNewSupplierModal(true)}
            >
              <Plus size={16} />
              Create new supplier
            </button>
          </div>

          {/* Pending Supplier Card */}
          <div className="summary-card pending-supplier-card overview-card">
            <div className="overview-card-icon">
              <ShoppingCart />
            </div>
            <h3 className="overview-card-title">Pending supplier</h3>
            <div className="overview-card-metrics">
              <span className="overview-card-main-value">
                {dashboardData?.trustiscore?.score !== undefined 
                  ? dashboardData.trustiscore.score
                  : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 70)}
                <span className="overview-card-ratio">/100</span>
              </span>
            </div>
            <div className="overview-card-label">
              {dashboardData?.trustiscore?.level !== undefined 
                ? dashboardData.trustiscore.level 
                : (isLoadingDashboard ? <LoadingIndicator size="sm" /> : 'Platinum')}
            </div>
          </div>

          {/* Total Supplier Amount Card */}
          <div className="summary-card total-supplier-amount-card overview-card">
            <div className="overview-card-icon">
              <FileText />
            </div>
            <h3 className="overview-card-title">Total Supplier Amount</h3>
            <div className="overview-card-metrics">
              <span className="overview-card-main-value">
                ${totalEscrowedAmount !== null && totalEscrowedAmount !== undefined
                    ? totalEscrowedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : (isLoadingTotalEscrowed ? <LoadingIndicator size="sm" /> : '45,280')}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section */}
        <div className="dashboard-middle supplier-contract-middle">
          {/* Supplier Details Section */}
          <div className="supplier-details-section">
            <div className="section-header">
              <div className="section-indicator"></div>
              <h3>Supplier details</h3>
            </div>
            <div className="supplier-details-grid">
              {supplierDetails.map((supplier, index) => (
                <div key={index} className="supplier-detail-card">
                  <div className="supplier-card-top">
                    <div className="supplier-progress-circle">
                      <svg className="progress-ring" width="60" height="60">
                        <circle
                          className="progress-ring-background"
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="4"
                        />
                        <circle
                          className="progress-ring-progress"
                          cx="30"
                          cy="30"
                          r="25"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="4"
                          strokeDasharray={`${2 * Math.PI * 25}`}
                          strokeDashoffset={`${2 * Math.PI * 25 * (1 - supplier.progress / 100)}`}
                          transform="rotate(-90 30 30)"
                        />
                      </svg>
                      <span className="progress-text">{supplier.progress}%</span>
                    </div>
                    <div className="supplier-card-info">
                      <div className="supplier-id">#{supplier.id}</div>
                      {supplier.dueDate && (
                        <div className="supplier-due-date">Due date: {supplier.dueDate}</div>
                      )}
                      {supplier.percentage && (
                        <div className="supplier-percentage">{supplier.percentage}</div>
                      )}
                    </div>
                  </div>
                  <div className="supplier-amount-section">
                    <div className="supplier-amount-label">Amount</div>
                    <div className="supplier-amount">{supplier.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="transaction-history-section">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-indicator"></div>
                <h3>Transaction history</h3>
              </div>
              <div className="transaction-filters">
                <div className="filter-dropdown">
                  <span>Filter</span>
                  <ChevronDown size={14} />
                </div>
                <div className="filter-dropdown">
                  <span>{monthlyFilter}</span>
                  <ChevronDown size={14} />
                </div>
                <button className="filter-icon-btn">
                  <Filter size={16} />
                </button>
              </div>
            </div>
            <div className="transaction-table-container">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Transaction ID</th>
                    <th>Supplier Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="transaction-type-cell">
                          <div className="transaction-type-icon received">
                            <ArrowDown size={14} />
                          </div>
                          <span>{transaction.type}</span>
                        </div>
                      </td>
                      <td>{transaction.id}</td>
                      <td>{transaction.amount}</td>
                      <td>
                        <span className="status-badge successful">{transaction.status}</span>
                      </td>
                      <td>{transaction.date}</td>
                      <td>
                        <button className="transaction-view-btn">
                          <ArrowRightIcon size={16} />
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
              </div>
              <button className="pagination-btn">
                Next 10 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierContract;
