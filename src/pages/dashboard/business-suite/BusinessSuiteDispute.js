import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  CreditCard,
  DollarSign,
  Building2,
  FileCheck,
  Code,
  Box,
  Link,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Calendar,
  Menu,
  Plus,
  CheckCircle,
  X,
  TrendingUp,
  Upload
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import '../my-escrow/MyEscrow.css';
import '../dispute/Dispute.css';
import '../dispute/DisputeDetail.css';
import './BusinessSuiteDispute.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { getDisputeSummary, getDisputes } from '../../../utils/disputesApi';
import { handleLogout } from '../../../utils/logout';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import LoadingIndicator from '../../../components/LoadingIndicator';

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null, path: '/dashboard' },
  { label: 'Payroll', icon: DollarSign, badge: null, path: '/payroll' },
  { label: 'Supplier Contract', icon: Building2, badge: null, path: '/supplier-contract' },
  { label: 'Dispute', icon: CreditCard, badge: null, path: '/business-dispute' },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta', path: '/compliance' }
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null, path: '/api-keys' },
  { label: 'Sand box enviroment', icon: Box, badge: null, path: '/sandbox-environment' },
  { label: 'Web hook', icon: Link, badge: null, path: '/webhook' }
];

const supportNav = [
  { label: 'Settings', icon: Settings, path: '/settings' }
];

const MONTH_LABEL_TO_NUMBER = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getCurrentMonth = () => MONTH_OPTIONS[new Date().getMonth()];

const toNumberOrNull = (v) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatPercent = (v) => {
  const n = toNumberOrNull(v);
  if (n === null) return 'N/A';
  return `${n > 0 ? '+' : ''}${n}%`;
};

const formatXrpAmount = (v) => {
  const n = toNumberOrNull(v);
  if (n === null) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(n);
};

const formatUsdAmount = (v) => {
  const n = toNumberOrNull(v);
  if (n === null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
};

const formatDurationSeconds = (s) => {
  const n = toNumberOrNull(s);
  if (n === null) return 'N/A';
  const abs = Math.abs(n);
  const days = abs / 86400;
  if (days >= 1) return `${Number(days.toFixed(1))} days`;
  const hours = abs / 3600;
  if (hours >= 1) return `${Number(hours.toFixed(1))} hrs`;
  const mins = abs / 60;
  if (mins >= 1) return `${Number(mins.toFixed(1))} mins`;
  return `${Number(abs.toFixed(1))} Sec`;
};

const titleCaseStatus = (s) => {
  if (!s || typeof s !== 'string') return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const monthLabelToYYYYMM = (label) => {
  if (!label || typeof label !== 'string') return undefined;
  const num = MONTH_LABEL_TO_NUMBER[label.trim().toLowerCase()];
  if (!num) return undefined;
  const year = new Date().getFullYear();
  return `${year}-${String(num).padStart(2, '0')}`;
};

const normalizeCompanyLogoUrl = (data) => {
  const raw = data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

const BusinessSuiteDispute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    referenceId: '',
    supplierName: '',
    reason: '',
    amount: '',
    description: '',
    currency: 'USD'
  });
  const [payrollForm, setPayrollForm] = useState({
    payrollId: '',
    reason: '',
    amount: '',
    description: '',
    currency: 'USD'
  });
  const [supplierEvidence, setSupplierEvidence] = useState([]);
  const [payrollEvidence, setPayrollEvidence] = useState([]);
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [businessKycComplete, setBusinessKycComplete] = useState(false);
  const [accountType, setAccountType] = useState('Business Suite');

  useEffect(() => {
    localStorage.setItem('dashboard_account_type', 'Business Suite');
  }, []);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isMobileMonthDropdownOpen, setIsMobileMonthDropdownOpen] = useState(false);
  const monthDropdownRef = useRef(null);
  const mobileMonthDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalDisputes: null,
    activeDisputes: null,
    resolvedDisputes: null,
    avgResolutionTimeSeconds: null,
    totalChangePercent: null,
    activeChangePercent: null,
    resolvedChangePercent: null
  });
  const [disputeData, setDisputeData] = useState([]);
  const [formattedToday, setFormattedToday] = useState('');
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const monthParam = useMemo(() => monthLabelToYYYYMM(selectedMonth), [selectedMonth]);
  const statusParam = useMemo(() => {
    const n = (selectedFilter || '').trim().toLowerCase();
    if (!n || n === 'all') return 'all';
    if (['pending', 'active', 'resolved', 'cancelled'].includes(n)) return n;
    return 'all';
  }, [selectedFilter]);

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setCurrentPage(1);
    setIsMonthDropdownOpen(false);
    setIsMobileMonthDropdownOpen(false);
  };

  useEffect(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    setFormattedToday(`${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`);
  }, []);

  useEffect(() => {
    const onClose = (e) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)) setIsMonthDropdownOpen(false);
      if (mobileMonthDropdownRef.current && !mobileMonthDropdownRef.current.contains(e.target)) setIsMobileMonthDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClose);
    return () => document.removeEventListener('mousedown', onClose);
  }, []);

  useEffect(() => {
    if (isSessionExpired) {
      setSummaryMetrics({ totalDisputes: null, activeDisputes: null, resolvedDisputes: null, avgResolutionTimeSeconds: null, totalChangePercent: null, activeChangePercent: null, resolvedChangePercent: null });
      setDisputeData([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getDisputeSummary({ token, month: monthParam });
        const m = data?.metrics;
        if (!cancelled && m) setSummaryMetrics((prev) => ({ ...prev, ...m }));
      } catch (e) {
        console.error('Dispute summary error:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [isSessionExpired, monthParam]);

  useEffect(() => {
    if (isSessionExpired) {
      setDisputeData([]);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getDisputes({
          token,
          status: statusParam,
          month: monthParam,
          page: currentPage,
          pageSize: itemsPerPage
        });
        const list = Array.isArray(data?.disputes) ? data.disputes : [];
        const mapped = list.map((d) => ({
          id: (d?.caseId || '').replace(/^#/, '') || '—',
          apiId: d?.id,
          parties: { from: d?.initiatorName || '—', to: d?.respondentName || '—' },
          amount: { xrp: formatXrpAmount(d?.amount?.xrp), usd: formatUsdAmount(d?.amount?.usd) },
          status: titleCaseStatus(d?.status),
          reason: d?.reason || '—',
          duration: formatDurationSeconds(d?.durationSeconds)
        }));
        if (!cancelled) setDisputeData(mapped);
      } catch (e) {
        console.error('Disputes list error:', e);
        if (!cancelled) setDisputeData([]);
      }
    })();
    return () => { cancelled = true; };
  }, [isSessionExpired, monthParam, statusParam, currentPage, itemsPerPage, listRefreshKey]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) {
      setUserAvatar(null);
      setIsLoadingUserProfile(false);
      return;
    }
    (async () => {
      try {
        const [profileRes, kycRes] = await Promise.all([
          fetch(getApiUrl('api/user/profile'), { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
          fetch(getApiUrl('api/business-suite/kyc/status'), { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
        ]);
        const profile = await profileRes.json().catch(() => ({}));
        const kyc = await kycRes.json().catch(() => ({}));
        if (profile?.success && profile?.data) {
          const d = profile.data;
          const name = d.fullName || [d.firstName, d.lastName].filter(Boolean).join(' ') || d.name || '';
          setUserFullName(name);
          const parts = name.trim().split(/\s+/);
          setUserInitials(parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : (parts[0]?.[0] || '')?.toUpperCase() || '');
          setUserAvatar(getProfileAvatarUrl(d));
          setUserRole(d.role || d.userRole || '');
        }
        if (kyc?.success && kyc?.data) {
          setBusinessCompanyName(kyc.data.companyName || '');
          const raw = kyc.data.companyLogoUrl || kyc.data.logoUrl || '';
          setBusinessCompanyLogoUrl(raw && !/^https?:\/\//i.test(raw) ? `${getApiUrl('').replace(/\/$/, '')}${raw.startsWith('/') ? raw : `/${raw}`}` : raw);
          const status = String(kyc.data.status ?? kyc.data.verification?.status ?? '').trim().toLowerCase();
          setBusinessKycComplete(['verified', 'approved', 'complete'].includes(status));
        }
      } catch (e) {
        console.error('Profile/KYC load error:', e);
      } finally {
        setIsLoadingUserProfile(false);
        setIsLoadingBusinessKyc(false);
      }
    })();
  }, [isSessionExpired]);

  // Full KYC for header (company name + logo) – same as other Business Suite pages so desktop header loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isSessionExpired) return;
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
      .catch(() => {
        if (!cancelled) {
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBusinessKyc(false);
      });
    return () => { cancelled = true; };
  }, [isSessionExpired]);

  const uploadEvidenceFile = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(getApiUrl('api/disputes/evidence/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || result.error || 'Upload failed');
    return {
      fileUrl: result.data?.fileUrl || result.data?.url || result.fileUrl,
      fileName: result.data?.fileName || file.name,
      fileType: result.data?.fileType || file.type,
      fileSize: result.data?.fileSize || file.size
    };
  };

  /** Upload evidence for payroll dispute (Business Suite). Returns { fileUrl, fileName } for evidence array. */
  const uploadPayrollEvidenceFile = async (file) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    const formData = new FormData();
    formData.append('document', file);
    const res = await fetch(getApiUrl('api/business-suite/payroll-disputes/evidence/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result?.message || result?.error || 'Upload failed');
    return {
      fileUrl: result.data?.fileUrl || result.data?.url,
      fileName: result.data?.fileName || file.name
    };
  };

  const submitSupplierDispute = async () => {
    const ref = (supplierForm.referenceId || supplierForm.supplierName || '').trim();
    if (!ref) {
      toast.error('Supplier reference or name is required');
      return;
    }
    if (!(supplierForm.reason || '').trim()) {
      toast.error('Reason is required');
      return;
    }
    const amount = parseFloat(supplierForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (!(supplierForm.description || '').trim()) {
      toast.error('Description is required');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    setIsCreating(true);
    try {
      const evidenceArray = [];
      for (const item of supplierEvidence) {
        if (item?.file) {
          const up = await uploadEvidenceFile(item.file);
          evidenceArray.push({ fileUrl: up.fileUrl, fileName: up.fileName });
        }
      }
      const body = {
        supplierReference: ref,
        reason: supplierForm.reason.trim(),
        amount: amount,
        currency: supplierForm.currency || 'USD',
        description: supplierForm.description.trim(),
        evidence: evidenceArray.length ? evidenceArray : undefined
      };
      const res = await fetch(getApiUrl('api/business-suite/supplier-disputes'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result?.message || result?.error || 'Failed to create dispute');
        return;
      }
      toast.success('Supplier dispute filed');
      setShowSupplierModal(false);
      setSupplierForm({ referenceId: '', supplierName: '', reason: '', amount: '', description: '', currency: 'USD' });
      setSupplierEvidence([]);
      setListRefreshKey((k) => k + 1);
      if (result?.data?.disputeId || result?.data?.caseId || result?.data?.id) {
        const id = result.data.disputeId || result.data.caseId || result.data.id;
        setTimeout(() => navigate(`/business-dispute/${id}`), 500);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to file dispute');
    } finally {
      setIsCreating(false);
    }
  };

  const submitPayrollDispute = async () => {
    const payrollId = (payrollForm.payrollId || '').trim();
    if (!payrollId) {
      toast.error('Payroll ID is required');
      return;
    }
    if (!(payrollForm.reason || '').trim()) {
      toast.error('Reason is required');
      return;
    }
    const amount = parseFloat(payrollForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    if (!(payrollForm.description || '').trim()) {
      toast.error('Description is required');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in');
      return;
    }
    setIsCreating(true);
    try {
      const evidenceArray = [];
      for (const item of payrollEvidence) {
        if (item?.file) {
          const up = await uploadPayrollEvidenceFile(item.file);
          evidenceArray.push({ fileUrl: up.fileUrl, fileName: up.fileName });
        }
      }
      const body = {
        payrollId,
        reason: payrollForm.reason.trim(),
        amount: Number(amount),
        currency: payrollForm.currency || 'USD',
        description: payrollForm.description.trim(),
        ...(evidenceArray.length > 0 && { evidence: evidenceArray })
      };
      const res = await fetch(getApiUrl('api/business-suite/payroll-disputes'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        toast.error(result?.message || result?.error || 'Failed to create dispute');
        return;
      }
      toast.success(result?.message || 'Payroll dispute filed');
      setShowPayrollModal(false);
      setPayrollForm({ payrollId: '', reason: '', amount: '', description: '', currency: 'USD' });
      setPayrollEvidence([]);
      setListRefreshKey((k) => k + 1);
      const id = result?.data?.disputeId;
      if (id) setTimeout(() => navigate(`/business-dispute/${id}`), 500);
    } catch (e) {
      toast.error(e?.message || 'Failed to file dispute');
    } finally {
      setIsCreating(false);
    }
  };

  const handleNavClick = (item) => {
    if (!item?.path) return;
    if (item.path === '/compliance') return;
    navigate(
      item.path,
      item.path === '/dashboard' || item.path === '/settings'
        ? { state: { accountType: 'Business Suite' } }
        : undefined
    );
  };

  const totalPages = Math.max(1, 78);

  return (
    <div className="dashboard payroll-dashboard">
      {/* Mobile */}
      <div className="mobile-dashboard">
        <div className="mobile-dashboard-header">
          <div className="mobile-header-left">
            <div className="mobile-user-avatar">
              {businessCompanyLogoUrl ? (
                <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} />
              ) : userAvatar ? (
                <img src={userAvatar} alt={userFullName} />
              ) : (
                userInitials
              )}
            </div>
            <div className="mobile-user-info">
              <span className="mobile-user-name">
                {businessCompanyName ? (isLoadingBusinessKyc ? <LoadingIndicator size="sm" /> : businessCompanyName) : (isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName)}
                <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
              </span>
              <span className="mobile-user-role">{businessCompanyName ? 'Business' : (isLoadingUserProfile ? <LoadingIndicator size="sm" /> : 'Business Suite')}</span>
            </div>
          </div>
          <div className="mobile-header-right">
            <button type="button" className="mobile-header-bell"><Bell size={20} /></button>
            <button type="button" className="mobile-header-menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}><Menu size={20} /></button>
          </div>
        </div>

        {isMobileMenuOpen && <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />}
        <div className={`mobile-sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-sidebar-header">
            <div className="mobile-sidebar-branding">
              <img src={logo} alt="TrustiChain" className="mobile-sidebar-logo" />
              <span className="mobile-sidebar-title">TrustiChain</span>
            </div>
            <button type="button" className="mobile-sidebar-close" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
          </div>
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">Business Suite</p>
            <nav className="mobile-sidebar-nav">
              {businessSuiteNav.map((item) => {
                const Icon = item.icon;
                const isActive = item.path ? (item.path === '/business-dispute' || item.path === '/payroll' ? (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) : location.pathname === item.path) : false;
                const navBadge = getNavBadge(item);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (item.path && item.path !== '/compliance') {
                        navigate(
                          item.path,
                          item.path === '/dashboard' || item.path === '/settings'
                            ? { state: { accountType: 'Business Suite' } }
                            : undefined
                        );
                      }
                    }}
                  >
                    <Icon size={18} /><span>{item.label}</span>
                    {navBadge != null && navBadge !== '' ? (
                      <span className="mobile-sidebar-badge">{navBadge}</span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">Support</p>
            <nav className="mobile-sidebar-nav">
              {supportNav.map((item) => {
                const SupportIcon = item.icon;
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
                    <SupportIcon size={18} /><span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <button type="button" className="mobile-sidebar-logout" onClick={handleLogout}><LogOut size={18} /><span>Logout</span></button>
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
                (item.label === 'Payroll' && (location.pathname === '/payroll' || location.pathname.startsWith('/payroll/'))) ||
                (item.label === 'Supplier Contract' && location.pathname === '/supplier-contract') ||
                (item.label === 'Dispute' && (location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/')));
              const navBadge = getNavBadge(item);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  <Icon size={18} /><span>{item.label}</span>
                  {navBadge != null && navBadge !== '' ? (
                    <span className="sidebar-badge">{navBadge}</span>
                  ) : null}
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
              const isActive = (item.label === 'Api Keys' && location.pathname === '/api-keys') ||
                (item.label === 'Sand box enviroment' && location.pathname === '/sandbox-environment') ||
                (item.label === 'Web hook' && location.pathname === '/webhook');
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => item.path && navigate(item.path)}
                >
                  <Icon size={18} /><span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-section">
          <p className="sidebar-section-label">Support</p>
          <nav className="sidebar-nav">
            {supportNav.map((item) => {
              const SupportIcon = item.icon;
              const isActive =
                (item.label === 'Settings' && location.pathname === '/settings') ||
                (item.path && location.pathname === item.path);
              return (
                <button
                  key={item.label}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  <SupportIcon size={18} /><span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-bottom-section">
          <div className="sidebar-help-card">
            <HelpCircle size={24} />
            <h3>Help Center</h3>
            <p>Having trouble? Please contact us</p>
            <button type="button" className="help-cta">Contact us</button>
          </div>
          <div className="sidebar-trustiscore">
            <span className="trustiscore-label">Trustiscore</span>
            <span className="trustiscore-badge">{trustiscoreBadgeText}</span>
          </div>
          <button type="button" className="sidebar-logout" onClick={handleLogout}><LogOut size={18} /><span>Logout</span></button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-info">
            <p className="header-date">{formattedToday}</p>
            <h1>Welcome Back !</h1>
          </div>
          <div className="header-search-group">
            <label className="header-search"><input type="text" placeholder="Search" /></label>
            <span className="search-divider" aria-hidden="true" />
            <button type="button" className="search-icon-btn"><Search size={18} /></button>
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
            {businessKycComplete && (
              <button
                type="button"
                className="create-wallet-btn"
                onClick={() => navigate('/dashboard')}
              >
                {hasWallet ? 'View Wallet' : 'Create Wallet'}
              </button>
            )}
            <button type="button" className="header-bell" onClick={() => setShowNotificationModal(true)}>
              <Bell size={18} />
            </button>
            <div className="header-user">
              <div className="user-avatar">
                {accountType === 'Business Suite' ? (
                  businessCompanyLogoUrl ? (
                    <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} className="user-avatar-img" />
                  ) : isLoadingBusinessKyc ? (
                    <LoadingIndicator size="sm" />
                  ) : (
                    businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—'
                  )
                ) : userAvatar ? (
                  <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {accountType === 'Business Suite' ? (
                    isLoadingBusinessKyc || !businessCompanyName ? <LoadingIndicator size="sm" /> : businessCompanyName
                  ) : (
                    isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName
                  )}
                  <img src={verifyBadge} alt="Verified" className="user-verified-icon" />
                </span>
                <small>{accountType === 'Business Suite' ? 'Business' : (userRole || '')}</small>
              </div>
            </div>
          </div>
        </header>

        <div className="dispute-content">
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">Business Suite</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">Dispute</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button type="button" className="create-escrow-btn" onClick={() => setShowSupplierModal(true)}>
              <Building2 size={18} />
              File dispute for suppliers
            </button>
            <button type="button" className="create-escrow-btn" onClick={() => setShowPayrollModal(true)}>
              <DollarSign size={18} />
              File payroll disputes
            </button>
          </div>

          <div className="dispute-summary-cards">
            <div className="dispute-summary-card">
              <div className="dispute-card-indicator" />
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Total Dispute</span>
                  <div className="dispute-card-change-badge positive"><TrendingUp size={12} /><span>{formatPercent(summaryMetrics.totalChangePercent)}</span></div>
                </div>
                <div className="dispute-card-value">{summaryMetrics.totalDisputes ?? 'N/A'}</div>
                <div className="dispute-card-dropdown"><span>This Monthly</span><ChevronDown size={14} /></div>
              </div>
            </div>
            <div className="dispute-summary-card">
              <div className="dispute-card-indicator" />
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Active Dispute</span>
                  <div className="dispute-card-change-badge positive"><TrendingUp size={12} /><span>{formatPercent(summaryMetrics.activeChangePercent)}</span></div>
                </div>
                <div className="dispute-card-value">{summaryMetrics.activeDisputes ?? 'N/A'}</div>
                <div className="dispute-card-dropdown"><span>This Monthly</span><ChevronDown size={14} /></div>
              </div>
            </div>
            <div className="dispute-summary-card">
              <div className="dispute-card-indicator" />
              <div className="dispute-card-content">
                <div className="dispute-card-title-row">
                  <span className="dispute-card-title">Resolved Dispute</span>
                  <div className="dispute-card-change-badge positive"><TrendingUp size={12} /><span>{formatPercent(summaryMetrics.resolvedChangePercent)}</span></div>
                </div>
                <div className="dispute-card-value">{summaryMetrics.resolvedDisputes ?? 'N/A'}</div>
                <div className="dispute-card-dropdown"><span>This Monthly</span><ChevronDown size={14} /></div>
              </div>
            </div>
            <div className="dispute-summary-card">
              <div className="dispute-card-indicator" />
              <div className="dispute-card-content">
                <div className="dispute-card-title-row"><span className="dispute-card-title">Avg Resolution Time</span></div>
                <div className="dispute-card-value">{formatDurationSeconds(summaryMetrics.avgResolutionTimeSeconds)}</div>
                <div className="dispute-card-dropdown"><span>This Monthly</span><ChevronDown size={14} /></div>
              </div>
            </div>
          </div>

          <div className="dispute-filters">
            <div className="dispute-filter-dropdown"><span>{selectedFilter}</span><ChevronDown size={16} /></div>
            <div className="dispute-month-filter-wrapper" ref={monthDropdownRef}>
              <button type="button" className={`dispute-month-filter ${isMonthDropdownOpen ? 'open' : ''}`} onClick={() => setIsMonthDropdownOpen((o) => !o)}>
                <Calendar size={16} /><span>{selectedMonth}</span><ChevronDown size={14} className={isMonthDropdownOpen ? 'rotated' : ''} />
              </button>
              {isMonthDropdownOpen && (
                <div className="dispute-month-dropdown" role="listbox">
                  {MONTH_OPTIONS.map((month) => (
                    <button key={month} type="button" className={`dispute-month-dropdown-item ${selectedMonth === month ? 'active' : ''}`} onClick={() => handleMonthSelect(month)}>
                      <span>{month}</span>{selectedMonth === month && <CheckCircle size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mobile-dispute-history-section">
            <div className="mobile-dispute-history-header">
              <div className="mobile-dispute-history-title-wrapper">
                <div className="mobile-section-indicator" /><h3 className="mobile-dispute-history-title">Dispute History</h3>
              </div>
              <div className="mobile-month-filter-wrapper" ref={mobileMonthDropdownRef}>
                <button type="button" className={`mobile-dispute-history-icon-btn ${isMobileMonthDropdownOpen ? 'active' : ''}`} onClick={() => setIsMobileMonthDropdownOpen((o) => !o)}>
                  <Calendar size={18} />
                </button>
                {isMobileMonthDropdownOpen && (
                  <div className="mobile-dispute-month-dropdown">
                    {MONTH_OPTIONS.map((month) => (
                      <button key={month} type="button" className={`mobile-dispute-month-dropdown-item ${selectedMonth === month ? 'active' : ''}`} onClick={() => handleMonthSelect(month)}>
                        <span>{month}</span>{selectedMonth === month && <CheckCircle size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mobile-dispute-history-cards">
              {disputeData.length > 0 ? (
                disputeData.map((dispute, idx) => (
                  <div key={idx} className="mobile-dispute-history-card" onClick={() => navigate(`/business-dispute/${dispute.apiId || dispute.id}`)} style={{ cursor: 'pointer' }}>
                    <div className="mobile-dispute-history-row">
                      <div className="mobile-dispute-history-parties">
                        <span className="mobile-dispute-party-from">{dispute.parties.from}</span>
                        <ArrowRight size={14} className="mobile-dispute-party-arrow" />
                        <span className="mobile-dispute-party-to">{dispute.parties.to}</span>
                      </div>
                      <div className="mobile-dispute-history-amount">{dispute.amount.xrp} XRP ≈ {dispute.amount.usd}</div>
                    </div>
                    <div className="mobile-dispute-history-row">
                      <div className="mobile-dispute-history-reason">{dispute.reason}</div>
                      <span className={`mobile-dispute-status mobile-dispute-status-${(dispute.status || '').toLowerCase()}`}>{dispute.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No disputes</div>
              )}
            </div>
          </div>

          <div className="dispute-table-wrapper">
            <div className="dispute-table-header">
              <div className="dispute-table-cell">Case ID</div>
              <div className="dispute-table-cell">Parties</div>
              <div className="dispute-table-cell">Amount</div>
              <div className="dispute-table-cell">Status</div>
              <div className="dispute-table-cell">Reason</div>
              <div className="dispute-table-cell">Duration</div>
            </div>
            {disputeData.length > 0 ? (
              disputeData.map((dispute, idx) => (
                <div key={idx} className="dispute-table-row">
                  <div className="dispute-table-cell dispute-case-id">#{dispute.id}</div>
                  <div className="dispute-table-cell dispute-parties">
                    <span className="party-link">{dispute.parties.from}</span>
                    <ArrowRight size={14} className="party-arrow" />
                    <span>{dispute.parties.to}</span>
                  </div>
                  <div className="dispute-table-cell dispute-amount">
                    <div className="amount-primary">{dispute.amount.xrp} XRP</div>
                    <div className="amount-secondary">≈ {dispute.amount.usd}</div>
                  </div>
                  <div className="dispute-table-cell">
                    <span className="dispute-status pending">{dispute.status}</span>
                  </div>
                  <div className="dispute-table-cell dispute-reason">{dispute.reason}</div>
                  <div className="dispute-table-cell dispute-duration">
                    <span>{dispute.duration}</span>
                    <button type="button" className="dispute-action-btn" onClick={() => navigate(`/business-dispute/${dispute.apiId || dispute.id}`)}>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No disputes</div>
            )}
          </div>

          <div className="dispute-pagination">
            <button type="button" className="pagination-nav-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 10))} disabled={currentPage <= 1}>
              <ArrowLeft size={16} /><span>Prev 10</span>
            </button>
            <div className="pagination-pages">
              <button type="button" className={`pagination-page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
              <span className="pagination-ellipsis">...</span>
              <button type="button" className="pagination-nav-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 10))} disabled={currentPage >= totalPages}>
                <span>Next 10</span><ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Supplier dispute modal */}
      {showSupplierModal && (
        <div className="create-escrow-modal-overlay" onClick={() => !isCreating && setShowSupplierModal(false)}>
          <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-escrow-modal-header">
              <h2>File dispute for suppliers</h2>
              <button type="button" className="modal-close-btn" onClick={() => !isCreating && setShowSupplierModal(false)}><X size={20} /></button>
            </div>
            <div className="create-escrow-modal-content business-dispute-modal-body">
              <label><span>Supplier reference ID or name</span><input type="text" value={supplierForm.referenceId || supplierForm.supplierName} onChange={(e) => setSupplierForm((f) => ({ ...f, referenceId: e.target.value, supplierName: e.target.value }))} placeholder="Supplier ID or name" /></label>
              <label><span>Reason</span><input type="text" value={supplierForm.reason} onChange={(e) => setSupplierForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Short reason" /></label>
              <label><span>Amount</span><input type="number" min="0" step="0.01" value={supplierForm.amount} onChange={(e) => setSupplierForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></label>
              <label><span>Currency</span><select value={supplierForm.currency} onChange={(e) => setSupplierForm((f) => ({ ...f, currency: e.target.value }))}><option value="USD">USD</option><option value="XRP">XRP</option></select></label>
              <label><span>Description</span><textarea value={supplierForm.description} onChange={(e) => setSupplierForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the dispute..." rows={3} /></label>
              <label><span>Evidence (optional)</span><input type="file" multiple accept=".pdf,image/*" onChange={(e) => setSupplierEvidence((prev) => [...prev, ...Array.from(e.target.files || []).map((file) => ({ file }))])} /></label>
            </div>
            <div className="create-escrow-modal-footer">
              <button type="button" className="previous-btn" onClick={() => !isCreating && setShowSupplierModal(false)}>Cancel</button>
              <button type="button" className="submit-next-btn" onClick={submitSupplierDispute} disabled={isCreating}>
                {isCreating ? 'Submitting...' : 'Submit dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll dispute modal */}
      {showPayrollModal && (
        <div className="create-escrow-modal-overlay" onClick={() => !isCreating && setShowPayrollModal(false)}>
          <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-escrow-modal-header">
              <h2>File payroll dispute</h2>
              <button type="button" className="modal-close-btn" onClick={() => !isCreating && setShowPayrollModal(false)}><X size={20} /></button>
            </div>
            <div className="create-escrow-modal-content business-dispute-modal-body">
              <label><span>Payroll ID</span><input type="text" value={payrollForm.payrollId} onChange={(e) => setPayrollForm((f) => ({ ...f, payrollId: e.target.value }))} placeholder="Payroll ID" /></label>
              <label><span>Reason</span><input type="text" value={payrollForm.reason} onChange={(e) => setPayrollForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Short reason" /></label>
              <label><span>Amount</span><input type="number" min="0" step="0.01" value={payrollForm.amount} onChange={(e) => setPayrollForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" /></label>
              <label><span>Currency</span><select value={payrollForm.currency} onChange={(e) => setPayrollForm((f) => ({ ...f, currency: e.target.value }))}><option value="USD">USD</option><option value="XRP">XRP</option></select></label>
              <label><span>Description</span><textarea value={payrollForm.description} onChange={(e) => setPayrollForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe the dispute..." rows={3} /></label>
              <label><span>Evidence (optional)</span><input type="file" multiple accept=".pdf,image/*" onChange={(e) => setPayrollEvidence((prev) => [...prev, ...Array.from(e.target.files || []).map((file) => ({ file }))])} /></label>
            </div>
            <div className="create-escrow-modal-footer">
              <button type="button" className="previous-btn" onClick={() => !isCreating && setShowPayrollModal(false)}>Cancel</button>
              <button type="button" className="submit-next-btn" onClick={submitPayrollDispute} disabled={isCreating}>
                {isCreating ? 'Submitting...' : 'Submit dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSuiteDispute;
