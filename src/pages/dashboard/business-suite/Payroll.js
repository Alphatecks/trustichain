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
  KeyRound,
  Download,
  Pencil,
  Calendar,
  User,
  ArrowLeft,
  Check,
  Wallet,
  Coins,
  Info
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Payroll.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import AddPayrollModal from '../../../components/AddPayrollModal';

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
  const [userRole, setUserRole] = useState('Freelancer');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isKycCompleteForAccount, setIsKycCompleteForAccount] = useState(true);
  const [businessKycComplete, setBusinessKycComplete] = useState(true);
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
  const [selectedPayrollDetail, setSelectedPayrollDetail] = useState(null);
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [showChangeReleaseDateModal, setShowChangeReleaseDateModal] = useState(false);
  const [showAddPayrollModalMobile, setShowAddPayrollModalMobile] = useState(false);
  const [fundAmount, setFundAmount] = useState('24,567.89');
  const [addPayrollStep, setAddPayrollStep] = useState(1);
  const [addPayrollForm, setAddPayrollForm] = useState({
    currency: '',
    defaultSalaryType: '',
    salaryAmount: '',
    disbursementMode: 'auto',
    allowanceAllocation: false,
    addAmount: '',
    jobTitle: '',
    email: '',
    employmentType: 'fulltime',
    status: '',
    dateJoined: '',
    companyName: 'Angelo Group',
    companyEmail: 'angelogroup@trustichain.org',
    cycleDate: 'Monthly',
    startDate: '3rd Dec 2025',
    endDate: '25 Dec 2026',
    companyDescription: ''
  });
  const [teamMemberStep, setTeamMemberStep] = useState(1);
  const [teamMemberForm, setTeamMemberForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    address: '',
    gender: '',
    jobTitle: '',
    employmentType: 'fulltime',
    status: '',
    dateJoined: '',
    disbursementMode: 'auto',
    defaultSalaryType: '',
    currency: '',
    salaryAmount: '',
    accountType: 'bank',
    walletType: '',
    walletAddress: '',
    network: '',
    currency: '',
    bankName: '',
    accountNumber: ''
  });

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
      {/* Mobile Dashboard */}
      <div className="mobile-dashboard">
        {/* Mobile Header */}
        {!selectedPayrollDetail && (
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
        )}

        {/* Mobile Sidebar Overlay */}
        {!selectedPayrollDetail && isMobileMenuOpen && (
          <div 
            className="mobile-sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Notifications Dialog */}
        {showNotificationModal && (
          <>
            <div 
              className="mobile-notifications-overlay"
              onClick={() => setShowNotificationModal(false)}
            />
            <div className="mobile-notifications-dialog">
              <div className="mobile-notifications-header">
                <h2 className="mobile-notifications-title">Notifications</h2>
                <button
                  className="mobile-notifications-close"
                  onClick={() => setShowNotificationModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mobile-notifications-content">
                {/* Sample notifications */}
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">New Payroll Created</div>
                    <div className="mobile-notification-message">Your payroll "Angelo Group" has been successfully created.</div>
                    <div className="mobile-notification-time">2 hours ago</div>
                  </div>
                </div>
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">Payment Received</div>
                    <div className="mobile-notification-message">You received $5,000 in your wallet.</div>
                    <div className="mobile-notification-time">5 hours ago</div>
                  </div>
                </div>
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">Team Member Added</div>
                    <div className="mobile-notification-message">A new team member has been added to your payroll.</div>
                    <div className="mobile-notification-time">1 day ago</div>
                  </div>
                </div>
                <div className="mobile-notification-item">
                  <div className="mobile-notification-icon">
                    <Bell size={18} />
                  </div>
                  <div className="mobile-notification-details">
                    <div className="mobile-notification-title">Release Date Updated</div>
                    <div className="mobile-notification-message">The release date for "Angelo Group" has been changed.</div>
                    <div className="mobile-notification-time">2 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Sidebar Drawer */}
        {!selectedPayrollDetail && (
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
                    navigate('/dashboard');
                  }, 1500);
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
                                   (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                                   (item.label === 'Transaction' && location.pathname === '/transactions');
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
                  const handleDevelopersNavClick = () => {
                    if (isDisabled) return;
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Api Keys') {
                      navigate('/api-keys');
                    } else if (item.label === 'Sand box enviroment') {
                      navigate('/sandbox-environment');
                    } else if (item.label === 'Web hook') {
                      navigate('/webhook');
                    }
                  };
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`mobile-sidebar-nav-item ${isDisabled ? 'disabled' : ''}`}
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
                  const handleSupportNavClick = () => {
                    setIsMobileMenuOpen(false);
                    if (item.label === 'Settings') {
                      navigate('/settings');
                    } else if (item.label === 'Security') {
                      navigate('/security');
                    }
                  };
                  return (
                    <button 
                      key={item.label} 
                      type="button"
                      className="mobile-sidebar-nav-item"
                      onClick={handleSupportNavClick}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="mobile-sidebar-bottom">
            <div className="mobile-sidebar-trustiscore">
              <span className="mobile-sidebar-trustiscore-label">Active Supplier</span>
              <span className="mobile-sidebar-trustiscore-badge">97</span>
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
        )}

        {/* Mobile Payroll Content */}
        <div className="payroll-page-mobile">
          {/* Summary Cards - Horizontally Scrollable */}
          {!selectedPayrollDetail && (
            <div className="payroll-summary-cards-wrapper-mobile">
              <div className="payroll-summary-cards-mobile">
            <div className="payroll-summary-card-mobile">
              <div className="summary-card-icon-mobile">
                <FileText size={24} />
              </div>
              <div className="summary-card-content-mobile">
                <div className="summary-card-title-mobile">Total Payroll</div>
                <div className="summary-card-value-row-mobile">
                  <div className="summary-card-value-mobile">23</div>
                  <div className="summary-card-trend-mobile positive">
                    <TrendingUp size={14} />
                    <span>+3.1%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="payroll-summary-card-mobile">
              <div className="summary-card-icon-mobile">
                <Users size={24} />
              </div>
              <div className="summary-card-content-mobile">
                <div className="summary-card-title-mobile">Total Team members</div>
                <div className="summary-card-value-row-mobile">
                  <div className="summary-card-value-mobile">345</div>
                  <div className="summary-card-subtitle-mobile">Active members</div>
                </div>
              </div>
            </div>

            <div className="payroll-summary-card-mobile">
              <div className="summary-card-icon-mobile">
                <Clock size={24} />
              </div>
              <div className="summary-card-content-mobile">
                <div className="summary-card-title-mobile">Total Payroll Escrowed</div>
                <div className="summary-card-value-row-mobile">
                  <div className="summary-card-value-mobile">$45,280</div>
                </div>
              </div>
            </div>
          </div>
          </div>
          )}

          {/* Mobile Payroll Header */}
          {!selectedPayrollDetail && (
            <>
              <div className="payroll-section-header-mobile">
                <h2 className="payroll-section-title-mobile">Payrolls</h2>
                <button className="add-payroll-btn-mobile" onClick={() => setShowAddPayrollModalMobile(true)}>
                  <Plus size={18} />
                  <span>Add Payroll</span>
                </button>
              </div>

              {/* Payroll List - Simple Mobile View */}
              <div className="payroll-list-mobile">
                {payrolls.map((payroll) => (
                  <div 
                    key={payroll.id} 
                    className="payroll-list-item-mobile"
                    onClick={() => navigate(`/payroll/${payroll.id}`)}
                  >
                    <div className="payroll-list-item-content-mobile">
                      <h3 className="payroll-list-item-title-mobile">{payroll.name}</h3>
                      <p className="payroll-list-item-subtitle-mobile">Next release {payroll.releaseDate}</p>
                    </div>
                    <button 
                      className="payroll-list-item-arrow-mobile"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayrollDetail(payroll);
                      }}
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Mobile Payroll Details Screen */}
          {selectedPayrollDetail && (
            <div className="payroll-details-mobile">
              <div className="payroll-details-header-mobile">
                <div className="payroll-details-title-wrapper-mobile">
                  <h2 className="payroll-details-title-mobile">Payroll Details</h2>
                </div>
                <button 
                  className="payroll-details-close-mobile"
                  onClick={() => setSelectedPayrollDetail(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="payroll-details-grid-mobile">
                {/* Payroll Name Card */}
                <div className="payroll-detail-card-mobile">
                  <div className="payroll-detail-card-header-mobile">
                    <h3 className="payroll-detail-card-title-mobile">Payroll name</h3>
                  </div>
                  <div className="payroll-detail-card-value-mobile">{selectedPayrollDetail.name}</div>
                  <button className="payroll-detail-card-action-mobile">
                    <Download size={16} />
                    <span>Description</span>
                  </button>
                </div>

                {/* Team Members Card */}
                <div className="payroll-detail-card-mobile">
                  <div className="payroll-detail-card-header-mobile">
                    <h3 className="payroll-detail-card-title-mobile">Team members</h3>
                  </div>
                  <div className="payroll-detail-card-value-mobile">23</div>
                  <button 
                  className="payroll-detail-card-action-mobile"
                  onClick={() => setShowAddTeamMember(true)}
                >
                    <Plus size={16} />
                    <span>Add team member</span>
                  </button>
                </div>

                {/* Next Release Date Card */}
                <div className="payroll-detail-card-mobile">
                  <div className="payroll-detail-card-header-mobile">
                    <h3 className="payroll-detail-card-title-mobile">Next release date</h3>
                  </div>
                  <div className="payroll-detail-card-value-mobile">31st Nov</div>
                  <button 
                    className="payroll-detail-card-action-mobile"
                    onClick={() => setShowChangeReleaseDateModal(true)}
                  >
                    <Pencil size={16} />
                    <span>Change</span>
                  </button>
                </div>

                {/* Payroll Amount Card */}
                <div className="payroll-detail-card-mobile">
                  <div className="payroll-detail-card-header-mobile">
                    <h3 className="payroll-detail-card-title-mobile">Payroll amount</h3>
                  </div>
                  <div className="payroll-detail-card-amount-wrapper-mobile">
                    <div className="payroll-detail-card-value-mobile">$23,000</div>
                    <div className="payroll-detail-card-amount-secondary-mobile">=$23,000</div>
                  </div>
                  <button 
                    className="payroll-detail-card-action-mobile"
                    onClick={() => setShowFundWalletModal(true)}
                  >
                    <Plus size={16} />
                    <span>Fund wallet</span>
                  </button>
                </div>
              </div>

              {/* Transaction History Section */}
              <div className="payroll-details-transaction-header-mobile">
                <h2 className="payroll-details-transaction-title-mobile">Transaction History</h2>
                <div className="payroll-details-transaction-actions-mobile">
                  <button className="payroll-details-transaction-calendar-mobile">
                    <Calendar size={20} />
                  </button>
                  <button className="payroll-details-transaction-arrow-mobile">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>

              <div className="payroll-details-transaction-list-mobile">
                {Array(5).fill({
                  sender: 'Ethel Johnson',
                  amount: '+50 XRP ($25.00 USD)',
                  date: '15th July 2025'
                }).map((transaction, index) => (
                  <div key={index} className="payroll-details-transaction-item-mobile">
                    <div className="payroll-details-transaction-content-mobile">
                      <div className="payroll-details-transaction-sender-mobile">{transaction.sender}</div>
                      <div className="payroll-details-transaction-amount-mobile">{transaction.amount}</div>
                    </div>
                    <div className="payroll-details-transaction-right-mobile">
                      <div className="payroll-details-transaction-date-mobile">{transaction.date}</div>
                      <button className="payroll-details-transaction-arrow-btn-mobile">
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Team Member Modal */}
              {showAddTeamMember && (
                <div className="add-team-member-modal-mobile">
                  <div className="add-team-member-header-mobile">
                    <div className="add-team-member-title-wrapper-mobile">
                      <h2 className="add-team-member-title-mobile">Add new team member</h2>
                    </div>
                    <button 
                      className="add-team-member-close-mobile"
                      onClick={() => {
                        setShowAddTeamMember(false);
                        setTeamMemberStep(1);
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Step Indicator */}
                  <div className="step-indicator-mobile">
                    <div className="step-indicator-icon-mobile">
                      {teamMemberStep === 1 ? <User size={20} /> : teamMemberStep === 2 ? <FileText size={20} /> : <Check size={20} />}
                    </div>
                    <div className="step-indicator-content-mobile">
                      <div className="step-indicator-step-mobile">Step {teamMemberStep}/3</div>
                      <div className="step-indicator-label-mobile">
                        {teamMemberStep === 1 ? 'Personal details' : teamMemberStep === 2 ? 'Compliance & Documentation' : 'Payment Details'}
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Personal Details Form */}
                  {teamMemberStep === 1 && (
                  <div className="personal-details-form-mobile">
                    <h3 className="personal-details-title-mobile">Personal Details</h3>
                    
                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Name</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Add Date"
                          value={teamMemberForm.name}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, name: e.target.value})}
                        />
                        <Calendar size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Email</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.email}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, email: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Phone Number:</label>
                      <input
                        type="tel"
                        className="form-input-mobile"
                        placeholder="Enter phone number"
                        value={teamMemberForm.phoneNumber}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, phoneNumber: e.target.value})}
                      />
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Country:</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.country}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, country: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Address:</label>
                      <input
                        type="text"
                        className="form-input-mobile"
                        placeholder="Enter details"
                        value={teamMemberForm.address}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, address: e.target.value})}
                      />
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Gender:</label>
                      <div className="gender-options-mobile">
                        <label className="gender-option-mobile">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={teamMemberForm.gender === 'male'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, gender: e.target.value})}
                          />
                          <span>Male</span>
                        </label>
                        <label className="gender-option-mobile">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={teamMemberForm.gender === 'female'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, gender: e.target.value})}
                          />
                          <span>Female</span>
                        </label>
                        <label className="gender-option-mobile">
                          <input
                            type="radio"
                            name="gender"
                            value="other"
                            checked={teamMemberForm.gender === 'other'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, gender: e.target.value})}
                          />
                          <span>Other</span>
                        </label>
                      </div>
                    </div>

                    <button 
                      className="submit-next-btn-mobile"
                      onClick={() => setTeamMemberStep(2)}
                    >
                      <div className="submit-next-icon-mobile">
                        <ArrowRight size={16} />
                      </div>
                      <span>Submit and Next</span>
                    </button>
                  </div>
                  )}

                  {/* Step 2: Compliance & Documentation Form */}
                  {teamMemberStep === 2 && (
                  <div className="job-details-form-mobile">
                    <h3 className="job-details-title-mobile">Compliance & Documentation</h3>
                    
                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Job Title:</label>
                      <input
                        type="text"
                        className="form-input-mobile"
                        placeholder="Add job title"
                        value={teamMemberForm.jobTitle}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, jobTitle: e.target.value})}
                      />
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Email</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.email}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, email: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Employment Type:</label>
                      <div className="employment-type-options-mobile">
                        <label className="employment-type-option-mobile">
                          <input
                            type="radio"
                            name="employmentType"
                            value="fulltime"
                            checked={teamMemberForm.employmentType === 'fulltime'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, employmentType: e.target.value})}
                          />
                          <span>Full time</span>
                        </label>
                        <label className="employment-type-option-mobile">
                          <input
                            type="radio"
                            name="employmentType"
                            value="parttime"
                            checked={teamMemberForm.employmentType === 'parttime'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, employmentType: e.target.value})}
                          />
                          <span>part time</span>
                        </label>
                        <label className="employment-type-option-mobile">
                          <input
                            type="radio"
                            name="employmentType"
                            value="contract"
                            checked={teamMemberForm.employmentType === 'contract'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, employmentType: e.target.value})}
                          />
                          <span>contract</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Status</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.status}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, status: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Date Joined</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Enter phone number"
                          value={teamMemberForm.dateJoined}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, dateJoined: e.target.value})}
                        />
                        <Calendar size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Disbursement Mode</label>
                      <div className="disbursement-mode-options-mobile">
                        <label className="disbursement-mode-option-mobile">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="auto"
                            checked={teamMemberForm.disbursementMode === 'auto'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, disbursementMode: e.target.value})}
                          />
                          <span>Auto Release</span>
                        </label>
                        <label className="disbursement-mode-option-mobile">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="manual"
                            checked={teamMemberForm.disbursementMode === 'manual'}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, disbursementMode: e.target.value})}
                          />
                          <span>Manual Release</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Default Salary Type</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Select"
                          value={teamMemberForm.defaultSalaryType}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, defaultSalaryType: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Currency</label>
                      <div className="form-input-wrapper-mobile">
                        <input
                          type="text"
                          className="form-input-mobile"
                          placeholder="Add Date"
                          value={teamMemberForm.currency}
                          onChange={(e) => setTeamMemberForm({...teamMemberForm, currency: e.target.value})}
                        />
                        <ChevronDown size={18} className="form-input-icon-mobile" />
                      </div>
                    </div>

                    <div className="form-field-mobile">
                      <label className="form-label-mobile">Salary Amount</label>
                      <input
                        type="text"
                        className="form-input-mobile"
                        placeholder="Enter Amount"
                        value={teamMemberForm.salaryAmount}
                        onChange={(e) => setTeamMemberForm({...teamMemberForm, salaryAmount: e.target.value})}
                      />
                    </div>

                    <div className="form-navigation-buttons-mobile">
                      <button 
                        className="previous-btn-mobile"
                        onClick={() => setTeamMemberStep(1)}
                      >
                        <div className="previous-icon-mobile">
                          <ArrowLeft size={16} />
                        </div>
                        <span>Previous</span>
                      </button>
                      <button 
                        className="submit-next-btn-mobile"
                        onClick={() => setTeamMemberStep(3)}
                      >
                        <div className="submit-next-icon-mobile">
                          <ArrowRight size={16} />
                        </div>
                        <span>Submit and Next</span>
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Step 3: Payment Details Form */}
                  {teamMemberStep === 3 && (
                  <div className="payment-details-form-mobile">
                    <h3 className="payment-details-section-title-mobile">Account Type</h3>
                    
                    <div className="account-type-options-mobile">
                      <button
                        className={`account-type-option-mobile ${teamMemberForm.accountType === 'bank' ? 'selected' : ''}`}
                        onClick={() => setTeamMemberForm({...teamMemberForm, accountType: 'bank'})}
                      >
                        <Download size={18} />
                        <span>Bank Transfer</span>
                      </button>
                      <button
                        className={`account-type-option-mobile ${teamMemberForm.accountType === 'wallet' ? 'selected' : ''}`}
                        onClick={() => setTeamMemberForm({...teamMemberForm, accountType: 'wallet'})}
                      >
                        <Coins size={18} />
                        <span>Wallet Transfer</span>
                      </button>
                    </div>

                    <h3 className="payment-details-section-title-mobile">Personal Details</h3>
                    
                    {teamMemberForm.accountType === 'bank' ? (
                      <>
                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Currency</label>
                          <div className="form-input-wrapper-mobile">
                            <input
                              type="text"
                              className="form-input-mobile"
                              placeholder="Select"
                              value={teamMemberForm.currency}
                              onChange={(e) => setTeamMemberForm({...teamMemberForm, currency: e.target.value})}
                            />
                            <ChevronDown size={18} className="form-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Bank Name</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Add Date"
                            value={teamMemberForm.bankName}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, bankName: e.target.value})}
                          />
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Account Number</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Enter your name"
                            value={teamMemberForm.accountNumber}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, accountNumber: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Wallet Type</label>
                          <div className="form-input-wrapper-mobile">
                            <input
                              type="text"
                              className="form-input-mobile"
                              placeholder="Select"
                              value={teamMemberForm.walletType}
                              onChange={(e) => setTeamMemberForm({...teamMemberForm, walletType: e.target.value})}
                            />
                            <ChevronDown size={18} className="form-input-icon-mobile" />
                          </div>
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Wallet Adress</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Add Date"
                            value={teamMemberForm.walletAddress}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, walletAddress: e.target.value})}
                          />
                        </div>

                        <div className="form-field-mobile">
                          <label className="form-label-mobile">Network</label>
                          <input
                            type="text"
                            className="form-input-mobile"
                            placeholder="Enter your name"
                            value={teamMemberForm.network}
                            onChange={(e) => setTeamMemberForm({...teamMemberForm, network: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <button className="add-team-member-final-btn-mobile">
                      <div className="add-team-member-final-icon-mobile">
                        <ArrowRight size={16} />
                      </div>
                      <span>Add Team Member</span>
                    </button>
                  </div>
                  )}
                </div>
              )}

              {/* Fund Wallet Modal */}
              {showFundWalletModal && (
                <div className="fund-wallet-modal-mobile">
                  <div className="fund-wallet-header-mobile">
                    <div className="fund-wallet-title-wrapper-mobile">
                      <div className="fund-wallet-blue-accent-mobile"></div>
                      <h2 className="fund-wallet-title-mobile">Fund Payroll</h2>
                    </div>
                    <button
                      className="fund-wallet-close-mobile"
                      onClick={() => setShowFundWalletModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="fund-wallet-content-mobile">
                    <div className="fund-wallet-amount-section-mobile">
                      <div className="fund-wallet-amount-header-mobile">
                        <label className="fund-wallet-amount-label-mobile">Amount</label>
                        <div className="fund-wallet-currency-selector-mobile">
                          <img 
                            src="https://cryptologos.cc/logos/xrp-xrp-logo.png" 
                            alt="XRP" 
                            className="fund-wallet-currency-logo-mobile"
                          />
                          <span className="fund-wallet-currency-text-mobile">XRP wallet</span>
                          <ChevronDown size={16} />
                        </div>
                      </div>
                      <input
                        type="text"
                        className="fund-wallet-amount-input-mobile"
                        value={`$${fundAmount}`}
                        onChange={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFundAmount(value);
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.replace('$', '').replace(/,/g, '');
                          if (value) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              setFundAmount(numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }
                          }
                        }}
                        placeholder="$0.00"
                      />
                      <div className="fund-wallet-balance-mobile">Balance: 24,567.89 USDT</div>
                    </div>

                    <button className="fund-wallet-button-mobile">
                      Fund
                    </button>

                    <div className="fund-wallet-info-mobile">
                      <Info size={16} />
                      <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Release Date Modal */}
              {showChangeReleaseDateModal && (
                <div className="change-release-date-modal-mobile">
                  <div className="change-release-date-header-mobile">
                    <div className="change-release-date-title-wrapper-mobile">
                      <div className="change-release-date-blue-accent-mobile"></div>
                      <h2 className="change-release-date-title-mobile">Change Release Date</h2>
                    </div>
                    <button
                      className="change-release-date-close-mobile"
                      onClick={() => setShowChangeReleaseDateModal(false)}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="change-release-date-content-mobile">
                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile">Current Release Date</label>
                      <div className="change-release-date-display-mobile">31st Nov</div>
                    </div>

                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile">Current Release Period</label>
                      <div className="change-release-date-display-mobile">30 Days</div>
                    </div>

                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile change-release-date-label-editable-mobile">New Release Period</label>
                      <input
                        type="text"
                        className="change-release-date-input-mobile"
                        placeholder="20 Days"
                        defaultValue="20 Days"
                      />
                    </div>

                    <div className="change-release-date-field-mobile">
                      <label className="change-release-date-label-mobile change-release-date-label-editable-mobile">New Release Date</label>
                      <input
                        type="text"
                        className="change-release-date-input-mobile"
                        placeholder="20th Nov"
                        defaultValue="20th Nov"
                      />
                    </div>

                    <button className="change-release-date-save-btn-mobile">
                      Save
                    </button>

                    <div className="change-release-date-info-mobile">
                      <Info size={16} />
                      <span>Your Release Date would be change</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add New Payroll Modal - Mobile */}
          {showAddPayrollModalMobile && (
            <div className="add-new-payroll-modal-mobile">
              <div className="add-new-payroll-header-mobile">
                <div className="add-new-payroll-title-wrapper-mobile">
                  <div className="add-new-payroll-blue-accent-mobile"></div>
                  <h2 className="add-new-payroll-title-mobile">Add new payroll</h2>
                </div>
                <button
                  className="add-new-payroll-close-mobile"
                  onClick={() => {
                    setShowAddPayrollModalMobile(false);
                    setAddPayrollStep(1);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="add-new-payroll-step-indicator-mobile">
                <div className="add-new-payroll-step-icon-mobile">
                  {addPayrollStep === 1 ? <Users size={20} /> : addPayrollStep === 2 ? <FileText size={20} /> : <Check size={20} />}
                </div>
                <div className="add-new-payroll-step-content-mobile">
                  <div className="add-new-payroll-step-number-mobile">Step {addPayrollStep}/3</div>
                  <div className="add-new-payroll-step-label-mobile">
                    {addPayrollStep === 1 ? 'Payroll Detail' : addPayrollStep === 2 ? 'Compliance & Documentation' : 'Step 3'}
                  </div>
                </div>
              </div>

              {/* Step 1: Payroll Detail Form */}
              {addPayrollStep === 1 && (
                <div className="add-new-payroll-form-mobile">
                  <h3 className="add-new-payroll-form-title-mobile">Payroll Detail</h3>
                  
                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Currency</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Add Date"
                        value={addPayrollForm.currency}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, currency: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Default Salary Type</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.defaultSalaryType}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, defaultSalaryType: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Salary Amount</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Enter phone number"
                      value={addPayrollForm.salaryAmount}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, salaryAmount: e.target.value})}
                    />
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Disbursement Mode</label>
                    <div className="add-new-payroll-radio-group-mobile">
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementMode"
                          value="auto"
                          checked={addPayrollForm.disbursementMode === 'auto'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Auto Release</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementMode"
                          value="manual"
                          checked={addPayrollForm.disbursementMode === 'manual'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Manual Release</span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Allowance Allocation</label>
                    <div className="add-new-payroll-toggle-wrapper-mobile">
                      <span className="add-new-payroll-toggle-text-mobile">Enable Allowances</span>
                      <label className="add-new-payroll-toggle-mobile">
                        <input
                          type="checkbox"
                          checked={addPayrollForm.allowanceAllocation}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, allowanceAllocation: e.target.checked})}
                        />
                        <span className="add-new-payroll-toggle-slider-mobile"></span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Add Amount</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Add amount"
                      value={addPayrollForm.addAmount}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, addAmount: e.target.value})}
                    />
                  </div>

                  <button 
                    className="add-new-payroll-submit-btn-mobile"
                    onClick={() => setAddPayrollStep(2)}
                  >
                    <div className="add-new-payroll-submit-icon-mobile">
                      <ArrowRight size={16} />
                    </div>
                    <span>Submit and Next</span>
                  </button>
                </div>
              )}

              {/* Step 2: Compliance & Documentation Form */}
              {addPayrollStep === 2 && (
                <div className="add-new-payroll-form-mobile">
                  <h3 className="add-new-payroll-form-title-mobile">Compliance & Documentation</h3>
                  
                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Job Title:</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Add job title"
                      value={addPayrollForm.jobTitle}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, jobTitle: e.target.value})}
                    />
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Email</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.email}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, email: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Employment Type:</label>
                    <div className="add-new-payroll-radio-group-mobile">
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="employmentType"
                          value="fulltime"
                          checked={addPayrollForm.employmentType === 'fulltime'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, employmentType: e.target.value})}
                        />
                        <span>Full time</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="employmentType"
                          value="parttime"
                          checked={addPayrollForm.employmentType === 'parttime'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, employmentType: e.target.value})}
                        />
                        <span>part time</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="employmentType"
                          value="contract"
                          checked={addPayrollForm.employmentType === 'contract'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, employmentType: e.target.value})}
                        />
                        <span>contract</span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Status</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.status}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, status: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Date Joined</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Enter phone number"
                        value={addPayrollForm.dateJoined}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, dateJoined: e.target.value})}
                      />
                      <Calendar size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Disbursement Mode</label>
                    <div className="add-new-payroll-radio-group-mobile">
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementModeStep2"
                          value="auto"
                          checked={addPayrollForm.disbursementMode === 'auto'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Auto Release</span>
                      </label>
                      <label className="add-new-payroll-radio-option-mobile">
                        <input
                          type="radio"
                          name="disbursementModeStep2"
                          value="manual"
                          checked={addPayrollForm.disbursementMode === 'manual'}
                          onChange={(e) => setAddPayrollForm({...addPayrollForm, disbursementMode: e.target.value})}
                        />
                        <span>Manual Release</span>
                      </label>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Default Salary Type</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Select"
                        value={addPayrollForm.defaultSalaryType}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, defaultSalaryType: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Currency</label>
                    <div className="add-new-payroll-input-wrapper-mobile">
                      <input
                        type="text"
                        className="add-new-payroll-input-mobile"
                        placeholder="Add Date"
                        value={addPayrollForm.currency}
                        onChange={(e) => setAddPayrollForm({...addPayrollForm, currency: e.target.value})}
                      />
                      <ChevronDown size={18} className="add-new-payroll-input-icon-mobile" />
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Salary Amount</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Enter Amount"
                      value={addPayrollForm.salaryAmount}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, salaryAmount: e.target.value})}
                    />
                  </div>

                  <div className="form-navigation-buttons-mobile">
                    <button 
                      className="previous-btn-mobile"
                      onClick={() => setAddPayrollStep(1)}
                    >
                      <div className="previous-icon-mobile">
                        <ArrowLeft size={16} />
                      </div>
                      <span>Previous</span>
                    </button>
                    <button 
                      className="submit-next-btn-mobile"
                      onClick={() => setAddPayrollStep(3)}
                    >
                      <div className="submit-next-icon-mobile">
                        <ArrowRight size={16} />
                      </div>
                      <span>Submit and Next</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {addPayrollStep === 3 && (
                <div className="add-new-payroll-form-mobile">
                  <h3 className="add-new-payroll-form-title-mobile">Confirmation</h3>
                  
                  <div className="add-new-payroll-confirmation-section-mobile">
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Company Name:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.companyName}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Company email:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.companyEmail}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Cycle Date:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.cycleDate}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Start Date:</span>
                      <div className="add-new-payroll-confirmation-value-with-icon-mobile">
                        <span>{addPayrollForm.startDate}</span>
                        <Calendar size={16} />
                      </div>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">End Date:</span>
                      <div className="add-new-payroll-confirmation-value-with-icon-mobile">
                        <span>{addPayrollForm.endDate}</span>
                        <Calendar size={16} />
                      </div>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Currency:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.currency || 'Add Date'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Default Salary Type:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.defaultSalaryType || 'Select'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Salary Amount:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">${addPayrollForm.salaryAmount || '50'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Disbursement Mode:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">{addPayrollForm.disbursementMode === 'auto' ? 'Auto Release' : 'Manual Release'}</span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Allowance Allocation:</span>
                      <span className={`add-new-payroll-confirmation-value-mobile ${addPayrollForm.allowanceAllocation ? 'enabled' : ''}`}>
                        {addPayrollForm.allowanceAllocation ? 'Enable' : 'Disabled'}
                      </span>
                    </div>
                    <div className="add-new-payroll-confirmation-item-mobile">
                      <span className="add-new-payroll-confirmation-label-mobile">Add Amount:</span>
                      <span className="add-new-payroll-confirmation-value-mobile">${addPayrollForm.addAmount || '20'}</span>
                    </div>
                  </div>

                  <div className="add-new-payroll-field-mobile">
                    <label className="add-new-payroll-label-mobile">Company Description</label>
                    <input
                      type="text"
                      className="add-new-payroll-input-mobile"
                      placeholder="Enter details"
                      value={addPayrollForm.companyDescription}
                      onChange={(e) => setAddPayrollForm({...addPayrollForm, companyDescription: e.target.value})}
                    />
                  </div>

                  <button 
                    className="add-new-payroll-save-lock-btn-mobile"
                    onClick={() => {
                      setShowAddPayrollModalMobile(false);
                      setAddPayrollStep(1);
                    }}
                  >
                    <div className="add-new-payroll-submit-icon-mobile">
                      <ArrowRight size={16} />
                    </div>
                    <span>Save and Lock</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Transaction History Header */}
          {!selectedPayrollDetail && (
            <>
              <div className="transaction-history-header-mobile">
                <h2 className="transaction-history-title-mobile">Transaction History</h2>
                <div className="transaction-history-actions-mobile">
                  <button className="transaction-history-calendar-mobile">
                    <Clock size={20} />
                  </button>
                  <button className="transaction-history-arrow-mobile">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>

              {/* Mobile Transaction History List */}
              <div className="transaction-history-list-mobile">
            {transactions.slice(0, 3).map((transaction, index) => {
              const statusClass = transaction.status.toLowerCase() === 'pending' ? 'pending' : 'successful';
              // Format transaction ID like "#ESC-2024-001"
              const transactionIdFormatted = `#ESC-2024-00${index + 1}`;
              return (
                <div key={index} className="transaction-item-mobile">
                  <div className="transaction-item-content-mobile">
                    <div className="transaction-id-mobile">{transactionIdFormatted}</div>
                    <div className="transaction-recipient-mobile">{transaction.payrollName.replace(' Payroll', '')}</div>
                  </div>
                  <div className="transaction-item-right-mobile">
                    <div className="transaction-amount-mobile">{transaction.amount}</div>
                    <span className={`transaction-status-mobile ${statusClass}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              );
            })}
              </div>
            </>
          )}
        </div>
      </div>

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
          <div className="payroll-content">
            {/* Left Section: Payroll Cards */}
            <div className="payroll-cards-section">
              <div className="payroll-section-header">
                <h2 className="payroll-section-title">Payrolls</h2>
                <button className="add-payroll-btn" onClick={() => setShowAddPayrollModal(true)}>
                  <Plus size={18} />
                  Add Payroll
                </button>
              </div>
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
