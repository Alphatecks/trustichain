import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Headphones,
  Settings,
  Search,
  Bell,
  ArrowRight,
  KeyRound,
  QrCode,
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
  Filter,
  AlertTriangle,
  CheckCircle,
  Package
} from 'lucide-react';
import './Dashboard.css';
import logo from '../../assets/images/icons/logo.png';
import logoWhite from '../../assets/images/logo/logo_white.png';
import mockIllustration from '../../assets/images/illustrations/mock.png';
import uploadIllustration from '../../assets/images/illustrations/upload.png';
import chainsIllustration from '../../assets/images/illustrations/chain.png';
import cardIllustration from '../../assets/images/illustrations/card.png';
import verifyBadge from '../../assets/images/icons/verify.png';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

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

const steps = [
  { label: 'Proof of identity', detail: 'Proof of identity' },
  { label: 'Document upload', detail: 'Document upload' },
  { label: 'Connect Wallet', detail: 'Connect Wallet' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [kycComplete, setKycComplete] = useState(() => {
    // Check localStorage first, default to true if KYC was previously completed
    const stored = localStorage.getItem('kycComplete');
    return stored ? JSON.parse(stored) : true;
  });
  const [showBalance, setShowBalance] = useState(true);
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [kycForm, setKycForm] = useState({
    firstName: '',
    lastName: '',
    nationality: '',
    passport: '',
    dob: ''
  });

  const [documents, setDocuments] = useState({
    front: null,
    back: null,
    selfie: null
  });

  const [walletAddress, setWalletAddress] = useState('');

  const activeIllustration = useMemo(() => {
    if (currentStep === 1) return uploadIllustration;
    if (currentStep === 2) return chainsIllustration;
    return mockIllustration;
  }, [currentStep]);

  const handleInputChange = (field, value) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, file) => {
    setDocuments((prev) => ({ ...prev, [field]: file || null }));
  };

  const advanceStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleSubmitAndNext = (event) => {
    event.preventDefault();
    if (currentStep === 2) {
      setKycComplete(true);
      localStorage.setItem('kycComplete', 'true');
    } else {
      advanceStep();
    }
  };

  const stepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'upcoming';
  };

  const renderDashboardView = () => {
    return (
      <div className="dashboard-content">
        {/* Breadcrumb */}
        <div className="card-breadcrumb">
          <span className="breadcrumb-root">General</span>
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
                {showBalance ? '$24,567.89' : '••••••'}
              </div>
              <div className="summary-card-subvalue">≈ 45,234 XRP</div>
            </div>
            <div className="summary-card-actions">
              <button type="button" className="summary-card-btn primary">+ Fund Wallet</button>
              <button type="button" className="summary-card-btn secondary">+ Withdraw</button>
            </div>
          </div>

          <div className="summary-card active-escrow-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Active Escrow</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">23</div>
              <div className="summary-card-subvalue">$156,789 locked</div>
            </div>
            <button type="button" className="summary-card-btn primary">+ Create Escrow</button>
          </div>

          <div className="summary-card trustiscore-card">
            <div className="summary-card-header">
              <ShieldCheck size={16} />
              <h3>Trustiscore</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">70<span className="summary-card-value-suffix">/100</span></div>
              <div className="summary-card-subvalue">Platinum</div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Level</button>
          </div>

          <div className="summary-card total-escrowed-card">
            <div className="summary-card-header">
              <CreditCard size={16} />
              <h3>Total Escrowed</h3>
            </div>
            <div className="summary-card-value-row">
              <div className="summary-card-value">$45,280</div>
            </div>
            <button type="button" className="summary-card-btn secondary">View Escrow</button>
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
                {[41, 21, 29, 12, 25, 33].map((value, index) => (
                  <div key={index} className="bar-wrapper">
                    <div className={`bar ${index === 5 ? 'bar-purple' : ''}`} style={{ height: `${(value / 50) * 100}%` }} />
                    <span className="bar-label">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index]}</span>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Live Escrow Table */}
            <div className="escrow-table-card">
              <div className="table-header">
                <h3>Live Escrow</h3>
                <a href="#" className="view-link">View Escrow</a>
              </div>
              <div className="table-wrapper">
                <table className="escrow-table">
                  <thead>
                    <tr>
                      <th># Escrow ID <ChevronDown size={14} /></th>
                      <th>Parties <ChevronDown size={14} /></th>
                      <th>Amount <ChevronDown size={14} /></th>
                      <th>Status <ChevronDown size={14} /></th>
                    </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td>#ESC-2024-001</td>
                    <td>
                      <div className="party-info">
                        <div className="party-main">
                          <div className="party-avatar">JD</div>
                          <span>John Depp</span>
                        </div>
                        <div className="party-subtitle">
                          <ArrowRight size={14} />
                          <span>Sarah Wilson</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>5,000 XRP</div>
                      <div className="amount-usd">≈ $2,715.00</div>
                    </td>
                    <td><span className="status-badge pending">Pending release</span></td>
                  </tr>
                  <tr>
                    <td>#ESC-2024-001</td>
                    <td>
                      <div className="party-info">
                        <div className="party-main">
                          <div className="party-avatar">KA</div>
                          <span>Kelly Amanda</span>
                        </div>
                        <div className="party-subtitle">
                          <ArrowRight size={14} />
                          <span>Sarah Wilson</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>5,000 XRP</div>
                      <div className="amount-usd">≈ $2,715.00</div>
                    </td>
                    <td><span className="status-badge review">Under Review</span></td>
                  </tr>
                  <tr>
                    <td>#ESC-2024-001</td>
                    <td>
                      <div className="party-info">
                        <div className="party-main">
                          <div className="party-avatar">PJ</div>
                          <span>Peter Jury</span>
                        </div>
                        <div className="party-subtitle">
                          <ArrowRight size={14} />
                          <span>Sarah Wilson</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>5,000 XRP</div>
                      <div className="amount-usd">≈ $2,715.00</div>
                    </td>
                    <td><span className="status-badge completed">Completed</span></td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Exchange Rate & Wallet Balance */}
          <div className="dashboard-right-cards">
            <div className="exchange-rate-card">
              <h3>Live Exchange Rate</h3>
              <div className="rate-list">
                <div className="rate-item">
                  <div className="rate-flag">
                    <img src="https://flagcdn.com/w40/us.png" alt="USD" />
                  </div>
                  <div className="rate-info">
                    <span className="rate-currency">USD</span>
                  </div>
                  <div className="rate-value-change">
                    <span className="rate-value">$0.5430</span>
                    <div className="rate-change positive">
                      <TrendingUp size={14} />
                      <span>+2.4%</span>
                    </div>
                  </div>
                </div>
                <div className="rate-item">
                  <div className="rate-flag">
                    <img src="https://flagcdn.com/w40/eu.png" alt="EUR" />
                  </div>
                  <div className="rate-info">
                    <span className="rate-currency">EUR</span>
                  </div>
                  <div className="rate-value-change">
                    <span className="rate-value">€0.4920</span>
                    <div className="rate-change positive">
                      <TrendingUp size={14} />
                      <span>+2.4%</span>
                    </div>
                  </div>
                </div>
                <div className="rate-item">
                  <div className="rate-flag">
                    <img src="https://flagcdn.com/w40/gb.png" alt="GBP" />
                  </div>
                  <div className="rate-info">
                    <span className="rate-currency">GBP</span>
                  </div>
                  <div className="rate-value-change">
                    <span className="rate-value">£0.4310</span>
                    <div className="rate-change negative">
                      <TrendingDown size={14} />
                      <span>-0.5%</span>
                    </div>
                  </div>
                </div>
                <div className="rate-item">
                  <div className="rate-flag">
                    <img src="https://flagcdn.com/w40/jp.png" alt="JPY" />
                  </div>
                  <div className="rate-info">
                    <span className="rate-currency">JPY</span>
                  </div>
                  <div className="rate-value-change">
                    <span className="rate-value">¥81.20</span>
                    <div className="rate-change positive">
                      <TrendingUp size={14} />
                      <span>+3.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="wallet-balance-card">
              <h3>Wallet Balance</h3>
              <div className="wallet-list">
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon">XRP</div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">XRP</span>
                      <span className="wallet-crypto">{showBalance ? '45,234.56 XRP' : '••••••'}</span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">{showBalance ? '$24,567.89' : '••••••'}</span>
                  <div className="wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+2.4%</span>
                    </div>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon">USDT</div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">USDT</span>
                      <span className="wallet-crypto">{showBalance ? '12,500.00 USDT' : '••••••'}</span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">{showBalance ? '$12,500.00' : '••••••'}</span>
                  <div className="wallet-change neutral">
                    <span>0.0%</span>
                    </div>
                  </div>
                </div>
                <div className="wallet-item">
                  <div className="wallet-icon-group">
                    <div className="wallet-icon">USDC</div>
                    <div className="wallet-icon-info">
                    <span className="wallet-name">USDC</span>
                      <span className="wallet-crypto">{showBalance ? '8,750.00 USDC' : '••••••'}</span>
                    </div>
                  </div>
                  <div className="wallet-value-change">
                    <span className="wallet-amount">{showBalance ? '$8,750.00' : '••••••'}</span>
                  <div className="wallet-change positive">
                    <TrendingUp size={14} />
                    <span>+0.1%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trusticard */}
          <div className="trusticard-card">
            <h3>Trusticard</h3>
            <div className="virtual-card">
              <div className="card-header-info">
                <div className="card-logo">
                  <img src={logoWhite} alt="TrustiChain" className="card-logo-img" />
                  <span>TrustiChain</span>
                </div>
                <div className="card-type">Premium Debit</div>
              </div>
                <div className="card-number">7834 **** **** 6453</div>
                <div className="card-holder">
                  <span className="card-holder-label">Card holder</span>
                  <span>Sarah Chen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="dashboard-bottom">
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <div className="upload-grid">
            <div className="upload-sections">
              <div className="upload-card">
                <h3>NID/Passport Front Side</h3>
                <label className="upload-drop" htmlFor="front-upload">
                  <input
                    id="front-upload"
                    type="file"
                    onChange={(e) => handleFileChange('front', e.target.files[0])}
                  />
                  <p>Choose a file or drag & drop it here</p>
                  <button type="button">Browse file</button>
                  <span>{documents.front ? documents.front.name : 'No file chosen'}</span>
                </label>
              </div>
              <div className="upload-card">
                <h3>NID/Passport Back Side</h3>
                <label className="upload-drop" htmlFor="back-upload">
                  <input
                    id="back-upload"
                    type="file"
                    onChange={(e) => handleFileChange('back', e.target.files[0])}
                  />
                  <p>Choose a file or drag & drop it here</p>
                  <button type="button">Browse file</button>
                  <span>{documents.back ? documents.back.name : 'No file chosen'}</span>
                </label>
              </div>
              <div className="selfie-header">
                <span className="selfie-title">Take a selfie</span>
                <span className="selfie-subtitle">Hold your ID next to your face</span>
              </div>
              <div className="upload-card selfie-card">
                <label className="selfie-action" htmlFor="selfie-upload">
                  <input
                    id="selfie-upload"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => handleFileChange('selfie', e.target.files[0])}
                  />
                  <span className="selfie-label">Take a selfie</span>
                  <button type="button">Take Photo</button>
                  <span className="selfie-file">
                    {documents.selfie ? documents.selfie.name : 'No selfie uploaded'}
                  </span>
                </label>
              </div>
            </div>
            <div className="upload-illustration">
              <img src={uploadIllustration} alt="Document upload illustration" />
            </div>
          </div>
          <div className="upload-actions">
            <button type="button" className="primary-btn" onClick={advanceStep}>
              <span className="btn-arrow">
                <ArrowRight size={16} />
              </span>
              <span>Submit and Next</span>
            </button>
          </div>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <form className="wallet-form" onSubmit={handleSubmitAndNext}>
            <div className="wallet-address-section">
              <h3 className="wallet-address-label">XRP Wallet Address</h3>
              <div className="wallet-input-wrapper">
                <input
                  type="text"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="wallet-address-input"
                />
                <button type="button" className="wallet-qr-btn" aria-label="Scan QR code">
                  <QrCode size={20} />
                </button>
              </div>
            </div>

            <div className="wallet-connections">
              <div className="wallet-connection-item">
                <div className="wallet-connection-header">
                  <span className="wallet-connection-name">XUMM</span>
                </div>
                <button type="button" className="wallet-connect-btn">
                  Connect to XUMM
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="wallet-connection-item">
                <div className="wallet-connection-header">
                  <span className="wallet-connection-name">Metamask</span>
                </div>
                <button type="button" className="wallet-connect-btn">
                  Connect to Metamask
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="wallet-form-actions">
              <button type="submit" className="primary-btn">
                <span className="btn-arrow">
                  <ArrowRight size={16} />
                </span>
                <span>Submit for verification</span>
              </button>
            </div>
          </form>
        </>
      );
    }

    return (
      <>
        <form className="kyc-form" onSubmit={handleSubmitAndNext}>
          <label>
            <span>First name</span>
            <input
              type="text"
              placeholder="Enter your first name"
              value={kycForm.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
            />
          </label>
          <label>
            <span>Last name</span>
            <input
              type="text"
              placeholder="Enter your last name"
              value={kycForm.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
            />
          </label>
          <label>
            <span>Nationality</span>
            <div className="select-field">
              <select
                value={kycForm.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
              >
                <option value="">Please select</option>
                <option value="usa">United States</option>
                <option value="canada">Canada</option>
                <option value="uk">United Kingdom</option>
              </select>
            </div>
          </label>
          <label>
            <span>NID/Passport Number</span>
            <input
              type="text"
              placeholder="Enter your NID/Passport number"
              value={kycForm.passport}
              onChange={(e) => handleInputChange('passport', e.target.value)}
            />
          </label>
          <label>
            <span>Date of Birth</span>
            <input
              type="date"
              placeholder="Enter Date of Birth"
              value={kycForm.dob}
              onChange={(e) => handleInputChange('dob', e.target.value)}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="primary-btn">
              <span className="btn-arrow">
                <ArrowRight size={16} />
              </span>
              <span>Submit and Next</span>
            </button>
          </div>
        </form>
      </>
    );
  };

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
                               (item.label === 'My Escrow' && location.pathname === '/my-escrow');
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard');
                } else if (item.label === 'My Escrow') {
                  navigate('/my-escrow');
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
            <p className="header-date">Thursday, 7th November</p>
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
              <div className="user-avatar">SC</div>
              <div className="user-info">
                <span className="user-name">
                  Sarah Chen
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>Freelancer</small>
              </div>
            </div>
          </div>
        </header>

        {kycComplete ? (
          renderDashboardView()
        ) : (
          <section className="dashboard-card">
            <div className="card-header">
              <div className="card-breadcrumb">
                <span className="breadcrumb-root">KYC verification Form</span>
                <span className="breadcrumb-divider">›</span>
                <span className="breadcrumb-current">{steps[currentStep].detail}</span>
              </div>
            </div>

            <div className="stepper">
              {steps.map((step, index) => (
                <div key={step.label} className={`step ${stepStatus(index)}`}>
                  <div className="step-node" aria-hidden="true" />
                  <p className="step-title">{step.detail}</p>
                  {index < steps.length - 1 && <div className="step-connector" />}
                </div>
              ))}
            </div>

            <div className={`card-content ${currentStep === 1 ? 'single-column' : ''}`}>
              <div className="card-left">
                {renderStepContent()}
              </div>

              {currentStep !== 1 && (
                <div className="card-illustration">
                  <img src={activeIllustration} alt="Document illustration" />
                  {currentStep === 2 && (
                    <div className="card-overlay">
                      <img src={cardIllustration} alt="Card illustration" className="card-image" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
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

export default Dashboard;

