import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  CreditCard,
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
  Download,
  Repeat
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './PayrollDetail.css';
import logo from '../../../assets/images/icons/logo.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import {
  DashboardSkeletonBlock,
  PayrollDetailGridMobileSkeleton,
  PayrollTableRowsSkeleton,
} from '../../../components/DashboardSkeletons';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import AddTeamMemberModal from '../../../components/AddTeamMemberModal';
import FundPayrollModal from '../../../components/FundPayrollModal';
import ChangeReleaseDateModal from '../../../components/ChangeReleaseDateModal';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Invoice', icon: FileText, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings }
];

const normalizeCompanyLogoUrl = (data) => {
  const raw = data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

const extractXrpHashes = (data) => {
  if (!data || typeof data !== 'object') return [];
  return Array.from(new Set([
    ...(Array.isArray(data.xrpHashes) ? data.xrpHashes : []),
    ...(Array.isArray(data.xrpHashesCreated) ? data.xrpHashesCreated : []),
    ...(Array.isArray(data.xrpHashs) ? data.xrpHashs : []),
    data.xrpHash,
    data.xrp_hash,
    data.xrplEscrowId,
    data.xrpl_escrow_id,
  ].filter((value) => typeof value === 'string' && value.trim()))).map((value) => value.trim());
};

const PayrollDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { payrollId } = useParams();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const [accountType, setAccountType] = useState(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Business Suite';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('November');
  const [currentPage, setCurrentPage] = useState(1);
  const [freezeAutoRelease, setFreezeAutoRelease] = useState(false);
  const [releasingPayroll, setReleasingPayroll] = useState(false);
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
  const [showFundPayrollModal, setShowFundPayrollModal] = useState(false);
  const [showChangeReleaseDateModal, setShowChangeReleaseDateModal] = useState(false);
  const [payrollDetail, setPayrollDetail] = useState(null);
  const [isLoadingPayrollDetail, setIsLoadingPayrollDetail] = useState(true);

  useEffect(() => {
    if (!payrollId) {
      setIsLoadingPayrollDetail(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingPayrollDetail(false);
      return;
    }
    setIsLoadingPayrollDetail(true);
    fetch(getApiUrl(`api/business-suite/payrolls/${payrollId}`), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        console.error('PAYROLL_DETAIL_RESPONSE (detail page):', result);
        if (result?.success && result?.data) {
          setPayrollDetail(result.data);
        } else {
          setPayrollDetail(null);
        }
      })
      .catch((err) => {
        console.error('Payroll detail error:', err);
        setPayrollDetail(null);
      })
      .finally(() => setIsLoadingPayrollDetail(false));
  }, [payrollId]);

  const formattedToday = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    setIsLoadingBusinessKyc(true);
    fetch(getApiUrl('api/business-suite/kyc'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          const kycData = result.data;
          setBusinessCompanyName(kycData.companyName || kycData?.companyName || '');
          setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
        }
      })
      .catch(() => { if (!cancelled) { setBusinessCompanyName(''); setBusinessCompanyLogoUrl(''); } })
      .finally(() => { if (!cancelled) setIsLoadingBusinessKyc(false); });
    return () => { cancelled = true; };
  }, [accountType]);

  useEffect(() => {
    if (isSessionExpired) {
      setUserFullName('');
      setUserInitials('');
      setUserRole('');
      setUserAvatar(null);
      setIsLoadingUserProfile(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) { setIsLoadingUserProfile(false); return; }
    setIsLoadingUserProfile(true);
    fetch(getApiUrl('api/user/profile'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success && result?.data) {
          const data = result.data;
          const fullName = data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || '';
          if (fullName) setUserFullName(fullName);
          const firstName = data.firstName || '';
          const lastName = data.lastName || '';
          let initials = '';
          if (firstName && lastName) initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
          else if (fullName) {
            const nameParts = fullName.trim().split(/\s+/);
            if (nameParts.length >= 2) initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
            else if (nameParts.length === 1) initials = nameParts[0].charAt(0).toUpperCase();
          }
          setUserInitials(initials);
          setUserRole(data.role || data.userType || data.accountType || '');
          setUserAvatar(getProfileAvatarUrl(data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  const formatUsd = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(n)));
  const formatXrp = (n) => (n == null || Number.isNaN(Number(n)) ? null : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n)));

  const getItemPayFields = (item) => {
    const netPayUsd = item?.netPayUsd ?? item?.netPay ?? item?.amountUsd;
    const baseUsd = item?.baseUsd ?? item?.baseAmount ?? item?.baseSalary ?? item?.base ?? netPayUsd;
    const allowanceUsd = item?.allowanceUsd ?? item?.allowance ?? item?.allowanceAmount ?? 0;
    const deductUsd = item?.deductUsd ?? item?.deductionUsd ?? item?.deduct ?? item?.deduction ?? 0;
    const totalUsd = Number(netPayUsd ?? item?.amountUsd);
    const totalXrp = Number(item?.amountXrp);
    const ratio = totalUsd > 0 && !Number.isNaN(totalXrp) ? totalXrp / totalUsd : null;
    const toXrp = (usd) => (ratio != null && usd != null && !Number.isNaN(Number(usd)) ? Number(usd) * ratio : null);

    return {
      base: { usd: baseUsd, xrp: item?.baseXrp ?? item?.baseAmountXrp ?? toXrp(baseUsd) },
      allowance: { usd: allowanceUsd, xrp: item?.allowanceXrp ?? toXrp(allowanceUsd) },
      deduct: { usd: deductUsd, xrp: item?.deductXrp ?? item?.deductionXrp ?? toXrp(deductUsd) },
      netPay: { usd: netPayUsd ?? item?.amountUsd, xrp: item?.netPayXrp ?? item?.amountXrp },
    };
  };

  const renderPayCell = (usd, xrp) => (
    <div className="pay-cell">
      <span className="pay-cell-usd">{formatUsd(usd)}</span>
      {formatXrp(xrp) && <span className="pay-cell-xrp">≈ {formatXrp(xrp)} XRP</span>}
    </div>
  );

  useEffect(() => {
    if (payrollDetail) {
      setFreezeAutoRelease(!!payrollDetail.freezeAutoRelease);
    }
  }, [payrollDetail]);

  const handleReleasePayroll = () => {
    if (!payrollId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setReleasingPayroll(true);
    fetch(getApiUrl(`api/business-suite/payrolls/${payrollId}/release`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (result?.success) {
          toast.success('Payroll released');
          const newReleaseHashes = extractXrpHashes(result?.data);
          setPayrollDetail((prev) => {
            if (!prev) return prev;
            const existingHashes = extractXrpHashes(prev);
            const mergedHashes = Array.from(new Set([...existingHashes, ...newReleaseHashes]));
            return { ...prev, ...result.data, xrpHashes: mergedHashes, xrpHashesCreated: mergedHashes };
          });
        } else {
          toast.error(result?.message || 'Failed to release payroll');
        }
      })
      .catch((err) => {
        console.error('Payroll release error:', err);
        toast.error('Failed to release payroll');
      })
      .finally(() => setReleasingPayroll(false));
  };

  const toggleFreezeAutoRelease = () => {
    if (!payrollId) return;
    const nextFreeze = !freezeAutoRelease;
    setFreezeAutoRelease(nextFreeze);
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(getApiUrl(`api/business-suite/payrolls/${payrollId}`), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ freezeAutoRelease: nextFreeze }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (!result?.success) {
          setFreezeAutoRelease(!nextFreeze);
          toast.error(result?.message || 'Failed to update auto release setting');
        }
      })
      .catch((err) => {
        console.error('Update payroll error:', err);
        setFreezeAutoRelease(!nextFreeze);
        toast.error('Failed to update auto release setting');
      });
  };

  const items = payrollDetail?.items ?? [];
  const payrollXrpHashes = useMemo(() => extractXrpHashes(payrollDetail), [payrollDetail]);

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
                               (item.label === 'Payroll' && (location.pathname === '/payroll' || location.pathname.startsWith('/payroll/'))) ||
                               (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                               (item.label === 'Invoice' && location.pathname === '/invoice') ||
                               (item.label === 'Transactions' && location.pathname === '/transactions') ||
                               (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')));
              const handleNavClick = () => {
                if (item.label === 'Dashboard') {
                  navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                } else if (item.label === 'Payroll') {
                  navigate('/payroll');
                } else if (item.label === 'Supplier Contract') {
                  navigate('/supplier-contract');
                } else if (item.label === 'Invoice') {
                  navigate('/invoice');
                } else if (item.label === 'Transactions') {
                  navigate('/transactions', { state: { accountType: 'Business Suite' } });
                } else if (item.label === 'Dispute') {
                  navigate('/business-dispute');
                } else if (item.label === 'Compliance') {
                  toast('Compliance workspace coming soon');
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
            <span className="trustiscore-badge">{trustiscoreBadgeText}</span>
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
            <div className="account-type-buttons">
              <button
                type="button"
                className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('Personal');
                  localStorage.setItem('dashboard_account_type', 'Personal');
                  navigate('/dashboard');
                }}
              >
                Personal
              </button>
              <button
                type="button"
                className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('Business Suite');
                  localStorage.setItem('dashboard_account_type', 'Business Suite');
                }}
              >
                Business Suite
              </button>
            </div>
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <HeaderProfileAvatarNav>
                {accountType === 'Business Suite' ? (
                  businessCompanyLogoUrl ? (
                    <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} className="user-avatar-img" />
                  ) : isLoadingBusinessKyc ? (
                    <DashboardSkeletonBlock className="dashboard-skeleton-header-avatar" />
                  ) : (
                    businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—'
                  )
                ) : userAvatar ? (
                  <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
                ) : (
                  userInitials
                )}
                <HeaderProfileVerifyBadge />
              </HeaderProfileAvatarNav>
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
            {isLoadingPayrollDetail ? (
              <PayrollDetailGridMobileSkeleton count={4} />
            ) : !payrollDetail ? (
              <div className="payroll-detail-card" style={{ gridColumn: '1 / -1', padding: '2rem', color: 'var(--text-muted)' }}>Payroll not found</div>
            ) : (
              <>
                <div className="payroll-detail-card">
                  <div className="detail-card-indicator"></div>
                  <div className="detail-card-content">
                    <div className="detail-card-label-row">
                      <div className="detail-card-indicator-small"></div>
                      <span className="detail-card-label">Payroll name</span>
                    </div>
                    <div className="detail-card-value">{payrollDetail.name ?? '—'}</div>
                    <button type="button" className="detail-card-btn">
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
                    <div className="detail-card-value">{items.length}</div>
                    <button type="button" className="detail-card-btn" onClick={() => setShowAddTeamMemberModal(true)}>
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
                    <div className="detail-card-value">{payrollDetail.releaseDate ?? '—'}</div>
                    <div className="detail-card-subtitle">Status: {payrollDetail.status ?? '—'}</div>
                    <button type="button" className="detail-card-btn" onClick={() => setShowChangeReleaseDateModal(true)}>
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
                    <div className="detail-card-value">{formatUsd(payrollDetail.totalAmountUsd)}</div>
                    <div className="detail-card-subtitle">Total</div>
                    <button type="button" className="detail-card-btn" onClick={() => setShowFundPayrollModal(true)}>
                      <Wallet size={16} />
                      <span>Fund wallet</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="payroll-hashes-section">
            <div className="payroll-hashes-header">
              <div className="section-indicator"></div>
              <h2 className="payroll-hashes-title">XRPL Hashes</h2>
            </div>
            <div className="payroll-hashes-list">
              {isLoadingPayrollDetail ? (
                <div className="payroll-hash-item payroll-hash-item-empty">Loading hashes...</div>
              ) : payrollXrpHashes.length === 0 ? (
                <div className="payroll-hash-item payroll-hash-item-empty">No XRPL hash yet</div>
              ) : (
                payrollXrpHashes.map((hash) => (
                  <div key={hash} className="payroll-hash-item">{hash}</div>
                ))
              )}
            </div>
          </div>

          {/* Team Details Section */}
          <div className="team-details-section">
            <div className="team-details-header">
              <div className="team-details-header-left">
                <div className="section-indicator"></div>
                <h2 className="team-details-title">Team Details</h2>
              </div>
              <div className="team-details-header-actions">
                <button
                  type="button"
                  className="team-details-release-btn"
                  onClick={handleReleasePayroll}
                  disabled={releasingPayroll || isLoadingPayrollDetail}
                >
                  {releasingPayroll ? 'Releasing...' : 'Release now'}
                </button>
                <button type="button" className="team-details-month-selector">
                  <span>{selectedMonth}</span>
                  <Calendar size={16} />
                </button>
                <div className="team-details-freeze-toggle">
                  <span className="team-details-freeze-label">Freeze Auto release</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={freezeAutoRelease}
                      onChange={toggleFreezeAutoRelease}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <button type="button" className="team-details-filter-btn" aria-label="Filter team details">
                  <Filter size={16} />
                </button>
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayrollDetail ? (
                    <PayrollTableRowsSkeleton rows={5} columns={7} />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="team-details-empty">No items</td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const pay = getItemPayFields(item);
                      return (
                        <tr key={item.id}>
                          <td className="employee-name">{item.counterpartyName ?? '—'}</td>
                          <td>{renderPayCell(pay.base.usd, pay.base.xrp)}</td>
                          <td>{renderPayCell(pay.allowance.usd, pay.allowance.xrp)}</td>
                          <td>{renderPayCell(pay.deduct.usd, pay.deduct.xrp)}</td>
                          <td>{renderPayCell(pay.netPay.usd, pay.netPay.xrp)}</td>
                          <td>
                            <span className={`status-badge ${(item.status || 'pending').toLowerCase()}`}>
                              {item.status ?? 'Pending'}
                            </span>
                          </td>
                          <td>
                            <button type="button" className="team-details-action-btn" aria-label="View employee details">
                              <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="team-details-pagination">
              <button type="button" className="pagination-btn" disabled={currentPage === 1}>
                ← Prev 10
              </button>
              <div className="pagination-numbers">
                <span className={`pagination-number ${currentPage === 1 ? 'active' : ''}`}>1</span>
                {currentPage > 1 && (
                  <>
                    <span className="pagination-ellipsis">...</span>
                    {currentPage > 2 && <span className="pagination-number">{currentPage - 1}</span>}
                    <span className="pagination-number active">{currentPage}</span>
                    {currentPage < 78 && <span className="pagination-number">{currentPage + 1}</span>}
                    {currentPage < 77 && <span className="pagination-ellipsis">...</span>}
                  </>
                )}
                {currentPage === 1 && (
                  <>
                    <span className="pagination-number">2</span>
                    <span className="pagination-number">3</span>
                    <span className="pagination-ellipsis">...</span>
                  </>
                )}
                <span className="pagination-number">78</span>
              </div>
              <button type="button" className="pagination-btn">
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
          setShowAddTeamMemberModal(false);
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
        currentReleaseDate={payrollDetail?.releaseDate ?? '31st Nov'}
        currentReleasePeriod="30 Days"
      />

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="payroll-detail-notifications-title"
      />
    </div>
  );
};

export default PayrollDetail;

