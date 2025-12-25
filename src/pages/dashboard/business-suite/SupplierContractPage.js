import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  DollarSign,
  Building2,
  Repeat,
  Users,
  FileCheck,
  Code,
  Box,
  Link,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Search,
  Bell
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { getApiUrl } from '../../../utils/config';
import { handleLogout } from '../../../utils/logout';
import SupplierContract from './SupplierContract';
import FundSupplyAccountModal from '../../../components/FundSupplyAccountModal';
import WithdrawModal from '../../../components/WithdrawModal';
import CreateNewSupplierModal from '../../../components/CreateNewSupplierModal';
import LoadingIndicator from '../../../components/LoadingIndicator';
import '../dashboard/Dashboard.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';

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

const SupplierContractPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  
  const [accountType, setAccountType] = useState('Business Suite');
  const [showBalance, setShowBalance] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [walletBalances, setWalletBalances] = useState(null);
  const [isLoadingWalletBalances, setIsLoadingWalletBalances] = useState(true);
  const [totalEscrowedAmount, setTotalEscrowedAmount] = useState(45280.00);
  const [isLoadingTotalEscrowed, setIsLoadingTotalEscrowed] = useState(false);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userRole, setUserRole] = useState('Business Owner');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showFundSupplyAccountModal, setShowFundSupplyAccountModal] = useState(false);
  const [showWithdrawWalletModal, setShowWithdrawWalletModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateNewSupplierModal, setShowCreateNewSupplierModal] = useState(false);
  const [businessKycComplete, setBusinessKycComplete] = useState(() => {
    const stored = localStorage.getItem('businessKycComplete');
    return stored ? JSON.parse(stored) : false;
  });

  // Helper function to extract balance from different API response structures
  const getBalanceValue = (data, currency = 'usd') => {
    if (!data) return null;
    
    const currencyKey = currency.toLowerCase();
    const currencyUpper = currency.toUpperCase();
    
    if (data.balance && typeof data.balance === 'object') {
      const value = data.balance[currencyKey] || data.balance[currencyUpper] || null;
      if (value !== null) return Number(value);
    }
    
    const balanceObj = data.totalBalance || data.balanceData || data.balances || {};
    if (balanceObj && typeof balanceObj === 'object') {
      const value = balanceObj[currencyKey] || balanceObj[currencyUpper] || null;
      if (value !== null) return Number(value);
    }
    
    const value = data[`total${currencyUpper}`] || 
                  data[`balance${currencyUpper}`] ||
                  data[`${currencyKey}Balance`] ||
                  null;
    
    return value !== null ? Number(value) : null;
  };

  // Helper function to get exchange rate between two currencies
  const getExchangeRate = (fromCurrency, toCurrency) => {
    if (!exchangeRates || !Array.isArray(exchangeRates)) return null;
    if (fromCurrency === toCurrency) return 1;
    
    const directRate = exchangeRates.find(rate => 
      rate.from === fromCurrency && rate.to === toCurrency
    );
    if (directRate) return directRate.rate;

    const reverseRate = exchangeRates.find(rate => 
      rate.from === toCurrency && rate.to === fromCurrency
    );
    if (reverseRate) return 1 / reverseRate.rate;

    return null;
  };

  const handleCreateWallet = async () => {
    // Placeholder for wallet creation logic
    setHasWallet(true);
  };

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        if (isSessionExpired) {
          setDashboardData({
            balance: { usd: 24567.89, xrp: 45234.00 },
            activeEscrows: { count: 23, lockedAmount: 156789.00 },
            trustiscore: { score: 70, level: 'Platinum' }
          });
          setIsLoadingDashboard(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingDashboard(false);
          return;
        }

        const apiUrl = getApiUrl('api/dashboard/summary');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const normalizedData = { ...result.data };
            
            if (!normalizedData.balance) {
              normalizedData.balance = {};
            }
            
            const usdValue = getBalanceValue(result.data, 'usd');
            const xrpValue = getBalanceValue(result.data, 'xrp');
            
            if (usdValue !== null) {
              normalizedData.balance.usd = usdValue;
            }
            if (xrpValue !== null) {
              normalizedData.balance.xrp = xrpValue;
            }
            
            setDashboardData(normalizedData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    fetchDashboardSummary();
  }, [isSessionExpired]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('Sarah Chen');
        setUserInitials('SC');
        setUserRole('Business Owner');
        setUserAvatar(null);
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
            const fullName =
              data.fullName ||
              [data.firstName, data.lastName].filter(Boolean).join(' ') ||
              data.name ||
              userFullName;

            if (fullName && typeof fullName === 'string') {
              setUserFullName(fullName);
            }

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
            const role = data.role || data.userType || data.accountType || 'Business Owner';
            setUserRole(role);
            const avatar = data.avatar || data.profilePicture || data.image || null;
            setUserAvatar(avatar);
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

  // Update totalEscrowedAmount from dashboard data if available
  useEffect(() => {
    if (!isLoadingDashboard && dashboardData) {
      // You can update this from actual dashboard data if available
      // For now, keeping the default value
      setIsLoadingTotalEscrowed(false);
    }
  }, [dashboardData, isLoadingDashboard]);

  return (
    <div className="dashboard supplier-contract-dashboard">
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

          <button type="button" className="sidebar-logout" onClick={handleLogout}>
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
            {businessKycComplete && (
              <button 
                type="button" 
                className="create-wallet-btn"
                onClick={() => {
                  if (hasWallet) {
                    setShowWalletModal(true);
                  } else {
                    handleCreateWallet();
                  }
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
                <small>{userRole}</small>
              </div>
            </div>
          </div>
        </header>

        <SupplierContract
          dashboardData={dashboardData}
          isLoadingDashboard={isLoadingDashboard}
          exchangeRates={exchangeRates}
          isLoadingRates={isLoadingRates}
          walletBalances={walletBalances}
          isLoadingWalletBalances={isLoadingWalletBalances}
          userFullName={userFullName}
          userInitials={userInitials}
          userRole={userRole}
          userAvatar={userAvatar}
          isLoadingUserProfile={isLoadingUserProfile}
          showBalance={showBalance}
          setShowBalance={setShowBalance}
          showNotificationModal={showNotificationModal}
          setShowNotificationModal={setShowNotificationModal}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          hasWallet={hasWallet}
          setShowWalletModal={setShowWalletModal}
          handleCreateWallet={handleCreateWallet}
          setShowFundWalletModal={setShowFundWalletModal}
          setShowFundSupplyAccountModal={setShowFundSupplyAccountModal}
          setShowWithdrawWalletModal={setShowWithdrawWalletModal}
          setShowWithdrawModal={setShowWithdrawModal}
          setShowCreateNewSupplierModal={setShowCreateNewSupplierModal}
          accountType={accountType}
          setAccountType={setAccountType}
          setIsSwitchingAccountType={setIsSwitchingAccountType}
          setSwitchMessage={setSwitchMessage}
          businessKycComplete={businessKycComplete}
          navigate={navigate}
          location={location}
          getBalanceValue={getBalanceValue}
          getExchangeRate={getExchangeRate}
          totalEscrowedAmount={totalEscrowedAmount}
          isLoadingTotalEscrowed={isLoadingTotalEscrowed}
        />
      </main>

      <FundSupplyAccountModal
        isOpen={showFundSupplyAccountModal}
        onCancel={() => setShowFundSupplyAccountModal(false)}
        onSuccess={(data) => {
          console.log('Fund supply account:', data);
          // Handle the transfer logic here
          setShowFundSupplyAccountModal(false);
        }}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onCancel={() => setShowWithdrawModal(false)}
        onSuccess={(data) => {
          console.log('Withdraw:', data);
          // Handle the withdraw logic here
          setShowWithdrawModal(false);
        }}
      />

      <CreateNewSupplierModal
        isOpen={showCreateNewSupplierModal}
        onCancel={() => setShowCreateNewSupplierModal(false)}
        onSuccess={(data) => {
          console.log('Create new supplier:', data);
          // Handle the create supplier logic here
          // Don't close modal on Next - likely goes to next step
        }}
      />
    </div>
  );
};

export default SupplierContractPage;
