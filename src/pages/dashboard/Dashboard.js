import React from 'react';
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
  KeyRound
} from 'lucide-react';
import './Dashboard.css';
import logo from '../../assets/images/icons/logo.png';
import mockIllustration from '../../assets/images/illustrations/mock.png';
import verifyBadge from '../../assets/images/icons/verify.png';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck }
];

const steps = [
  { label: 'Proof of identity', status: 'active', detail: 'Proof of Identity' },
  { label: 'Document upload', status: 'upcoming', detail: 'Document Upload' },
  { label: 'Connect Wallet', status: 'upcoming', detail: 'Connect Wallet' }
];

const Dashboard = () => {
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
          <p className="sidebar-section-label">General</p>
          <nav className="sidebar-nav">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
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

        <div className="sidebar-help-card">
          <div className="help-icon">
            <Headphones size={18} />
          </div>
          <h3>Help Center</h3>
          <p>Having trouble in Trustichain? Please contact us</p>
          <button type="button" className="help-cta">
            Contact us
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
            <button type="button" className="kyc-status">
              <KeyRound size={16} />
              <span>KYC</span>
              <span>Unverified</span>
            </button>
            <button type="button" className="header-bell">
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

        <section className="dashboard-card">
          <div className="card-header">
            <div className="card-breadcrumb">
              <span className="breadcrumb-root">KYC verification Form</span>
              <span className="breadcrumb-divider">›</span>
              <span className="breadcrumb-current">Upload Document</span>
            </div>
          </div>

          <div className="stepper">
            {steps.map((step, index) => (
              <div key={step.label} className={`step ${step.status}`}>
                <div className="step-node" aria-hidden="true" />
                <p className="step-title">{step.detail}</p>
                {index < steps.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>

          <div className="card-content">
            <div className="card-left">
              <form className="kyc-form">
                <label>
                  <span>First name</span>
                  <input type="text" placeholder="Enter your first name" />
                </label>
                <label>
                  <span>Last name</span>
                  <input type="text" placeholder="Enter your last name" />
                </label>
                <label>
                  <span>Nationality</span>
                  <div className="select-field">
                    <select>
                      <option>Please select</option>
                    </select>
                  </div>
                </label>
                <label>
                  <span>NID/Passport Number</span>
                  <input type="text" placeholder="Enter your NID/Passport number" />
                </label>
                <label>
                  <span>Date of Birth</span>
                  <input type="text" placeholder="Enter Date of Birth" />
                </label>
              </form>

              <div className="form-actions">
                <button type="button" className="primary-btn">
                  <span className="btn-arrow">
                    <ArrowRight size={16} />
                  </span>
                  <span>Submit and Next</span>
                </button>
              </div>
            </div>

            <div className="card-illustration">
              <img src={mockIllustration} alt="Document illustration" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

