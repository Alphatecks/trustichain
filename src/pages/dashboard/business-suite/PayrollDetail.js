import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  ArrowLeft,
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
  Edit,
  Calendar,
  Wallet,
  Download
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './PayrollDetail.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import AddTeamMemberModal from '../../../components/AddTeamMemberModal';
import FundPayrollModal from '../../../components/FundPayrollModal';
import ChangeReleaseDateModal from '../../../components/ChangeReleaseDateModal';

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

const PayrollDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { payrollId } = useParams();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Business Suite');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [currentPage, setCurrentPage] = useState(12);
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
  const [showFundPayrollModal, setShowFundPayrollModal] = useState(false);
  const [showChangeReleaseDateModal, setShowChangeReleaseDateModal] = useState(false);

  // Mock data for team members
  const teamMembers = Array(10).fill({
    name: 'John Daniel',
    base: { usd: '$1,000', xrp: '≈ 2,715.00 XRP' },
    allowance: { usd: '$200', xrp: '≈ 453 XRP' },
    deduct: { usd: '$0.00', xrp: '≈ 0.00 XRP' },
    netPay: { usd: '$1,200', xrp: '≈ 3168XRP' },
    status: 'Pending'
  });

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
          <p className="sidebar-section-label">Business Suite</p>
          <nav className="sidebar-nav">
            {businessSuiteNav.map((item) => {
              const Icon = item.icon;
              const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                               (item.label === 'Payroll' && (location.pathname === '/payroll' || location.pathname.startsWith('/payroll/')));
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                } else if (item.label === 'Payroll') {
                  navigate('/payroll');
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

        <div className="payroll-detail-page">
          {/* Back Button */}
          <button 
            className="payroll-back-btn"
            onClick={() => navigate('/payroll')}
          >
            <ArrowLeft size={18} />
            Back to Payrolls
          </button>

          {/* Summary Cards */}
          <div className="payroll-detail-summary">
            <div className="payroll-detail-card">
              <div className="detail-card-indicator"></div>
              <div className="detail-card-content">
                <div className="detail-card-label-row">
                  <div className="detail-card-indicator-small"></div>
                  <span className="detail-card-label">Payroll name</span>
                </div>
                <div className="detail-card-value">Angelo Group</div>
                <button className="detail-card-btn">
                  <span>Description</span>
                  <Download size={16} />
                </button>
              </div>
            </div>

            <div className="payroll-detail-card">
              <div className="detail-card-indicator"></div>
              <div className="detail-card-content">
                <div className="detail-card-label-row">
                  <div className="detail-card-indicator-small"></div>
                  <span className="detail-card-label">Team members</span>
                </div>
                <div className="detail-card-value">23</div>
                <button className="detail-card-btn" onClick={() => setShowAddTeamMemberModal(true)}>
                  <Plus size={16} />
                  Add team member
                </button>
              </div>
            </div>

            <div className="payroll-detail-card">
              <div className="detail-card-indicator"></div>
              <div className="detail-card-content">
                <div className="detail-card-label-row">
                  <div className="detail-card-indicator-small"></div>
                  <span className="detail-card-label">Next release date</span>
                </div>
                <div className="detail-card-value">31st Nov</div>
                <div className="detail-card-subtitle">31st every month</div>
                <button className="detail-card-btn" onClick={() => setShowChangeReleaseDateModal(true)}>
                  <Edit size={16} />
                  Change
                </button>
              </div>
            </div>

            <div className="payroll-detail-card">
              <div className="detail-card-indicator"></div>
              <div className="detail-card-content">
                <div className="detail-card-label-row">
                  <div className="detail-card-indicator-small"></div>
                  <span className="detail-card-label">Payroll amount</span>
                </div>
                <div className="detail-card-value">$23,000</div>
                <div className="detail-card-subtitle">=$23,000</div>
                <button className="detail-card-btn" onClick={() => setShowFundPayrollModal(true)}>
                  <Wallet size={16} />
                  Fund wallet
                </button>
              </div>
            </div>
          </div>

          {/* Team Details Section */}
          <div className="team-details-section">
            <div className="team-details-header">
              <div className="section-indicator"></div>
              <h2 className="team-details-title">Team Details</h2>
              <div className="month-selector">
                <Calendar size={16} />
                <span>{selectedMonth}</span>
              </div>
            </div>

            <div className="team-details-table-wrapper">
              <table className="team-details-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Base</th>
                    <th>Allowance</th>
                    <th>Deduct</th>
                    <th>Net Pay</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr key={index}>
                      <td className="employee-name">{member.name}</td>
                      <td>
                        <div className="amount-cell">
                          <span className="amount-usd">{member.base.usd}</span>
                          <span className="amount-xrp">{member.base.xrp}</span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell">
                          <span className="amount-usd">{member.allowance.usd}</span>
                          <span className="amount-xrp">{member.allowance.xrp}</span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell">
                          <span className="amount-usd">{member.deduct.usd}</span>
                          <span className="amount-xrp">{member.deduct.xrp}</span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell">
                          <span className="amount-usd">{member.netPay.usd}</span>
                          <span className="amount-xrp">{member.netPay.xrp}</span>
                        </div>
                      </td>
                      <td>
                        <span className="status-badge pending">{member.status}</span>
                      </td>
                      <td>
                        <button className="action-btn">
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="team-details-pagination">
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
                <span className="pagination-number">19</span>
                <span className="pagination-number">20</span>
                <span className="pagination-ellipsis">...</span>
                <span className="pagination-number">78</span>
              </div>
              <button className="pagination-btn">
                Next 10 →
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        isOpen={showAddTeamMemberModal}
        onCancel={() => setShowAddTeamMemberModal(false)}
        onSuccess={(data) => {
          console.log('Team member added:', data);
          setShowAddTeamMemberModal(false);
          // You can add toast notification or update the team list here
        }}
      />

      {/* Fund Payroll Modal */}
      <FundPayrollModal
        isOpen={showFundPayrollModal}
        onCancel={() => setShowFundPayrollModal(false)}
        onSuccess={(data) => {
          console.log('Payroll funded:', data);
          setShowFundPayrollModal(false);
          // You can add toast notification or update the balance here
        }}
      />

      {/* Change Release Date Modal */}
      <ChangeReleaseDateModal
        isOpen={showChangeReleaseDateModal}
        onCancel={() => setShowChangeReleaseDateModal(false)}
        onSuccess={(data) => {
          console.log('Release date changed:', data);
          setShowChangeReleaseDateModal(false);
          // You can add toast notification or update the release date here
        }}
        currentReleaseDate="31st Nov"
        currentReleasePeriod="30 Days"
      />
    </div>
  );
};

export default PayrollDetail;

