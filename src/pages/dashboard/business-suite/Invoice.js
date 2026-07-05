import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  Search,
  Bell,
  Plus,
  DollarSign,
  Building2,
  FileCheck,
  Code,
  Box,
  Link,
  HelpCircle,
  LogOut,
  ChevronDown,
  Calendar,
  ArrowRight,
  TrendingUp,
  X,
  FileText,
  KeyRound,
  Menu,
  Repeat,
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Invoice.css';
import logo from '../../../assets/images/icons/logo.png';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import BusinessSuiteLoader from '../../../components/BusinessSuiteLoader';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import InvoiceEditorView from './InvoiceEditorView';

const extractWalletAddresses = (payload, fallbackAddress = '') => {
  const sources = [payload, payload?.data, payload?.result, payload?.wallet].filter(
    (node) => node && typeof node === 'object'
  );
  const pick = (keys) => {
    for (const src of sources) {
      for (const key of keys) {
        const value = src?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
    }
    return '';
  };
  const xrpAddress = pick([
    'xrplAddress',
    'xrpl_address',
    'walletAddress',
    'address',
    'xrpAddress',
    'xrp_address',
  ]);
  const rlusdAddress = pick([
    'rlusdAddress',
    'rlusd_address',
    'rippleUsdAddress',
    'ripple_usd_address',
    'rippleAddress',
    'ripple_address',
  ]);
  const normalizedXrp = String(xrpAddress || fallbackAddress || '').trim();
  const normalizedRlusd = String(rlusdAddress || normalizedXrp).trim();
  return { xrp: normalizedXrp, rlusd: normalizedRlusd };
};

const businessSuiteNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Payroll', icon: DollarSign, badge: null },
  { label: 'Supplier Contract', icon: Building2, badge: null },
  { label: 'Invoice', icon: FileText, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
];

const developersNav = [
  { label: 'Api Keys', icon: Code, badge: null },
  { label: 'Sand box enviroment', icon: Box, badge: null },
  { label: 'Web hook', icon: Link, badge: null },
];

const supportNav = [
  { label: 'Settings', icon: Settings, path: '/settings' },
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

const DEMO_INVOICES = [
  { id: 1, name: 'Design Gig', company: 'Zeedesigns', amount: 4592, status: 'Paid', dueDate: '2026-05-27', created: '2026-04-20' },
  { id: 2, name: 'Electricity', company: 'InnovateX', amount: 1820, status: 'Pending', dueDate: '2026-05-27', created: '2026-04-20' },
  { id: 3, name: 'Consulting Q2', company: 'Northwind Labs', amount: 12000, status: 'Paid', dueDate: '2026-04-15', created: '2026-03-28' },
  { id: 4, name: 'Hosting renewal', company: 'CloudNine', amount: 899, status: 'Overdue', dueDate: '2026-04-01', created: '2026-03-10' },
  { id: 5, name: 'Brand assets', company: 'Zeedesigns', amount: 3200, status: 'Pending', dueDate: '2026-06-02', created: '2026-04-18' },
  { id: 6, name: 'Legal review', company: 'InnovateX', amount: 5500, status: 'Paid', dueDate: '2026-05-10', created: '2026-04-05' },
  { id: 7, name: 'API integration', company: 'Acme Corp', amount: 7800, status: 'Paid', dueDate: '2026-05-01', created: '2026-03-22' },
  { id: 8, name: 'Training workshop', company: 'BrightMinds', amount: 2400, status: 'Pending', dueDate: '2026-06-15', created: '2026-04-12' },
  { id: 9, name: 'Office supplies', company: 'SupplyCo', amount: 412, status: 'Paid', dueDate: '2026-04-28', created: '2026-04-01' },
  { id: 10, name: 'Sprint retainer', company: 'Northwind Labs', amount: 15000, status: 'Overdue', dueDate: '2026-03-20', created: '2026-02-15' },
  { id: 11, name: 'UX audit', company: 'Zeedesigns', amount: 2800, status: 'Paid', dueDate: '2026-05-18', created: '2026-04-08' },
  { id: 12, name: 'Support package', company: 'CloudNine', amount: 1299, status: 'Pending', dueDate: '2026-07-01', created: '2026-04-25' },
];

const INVOICE_STATS = {
  totalInvoice: 43,
  pendingPayments: 5,
  paidThisMonth: 38,
  paidPercentOfTotal: 1.7,
  overdueInvoices: 2,
};

const PAGE_SIZE = 10;

const formatDueDate = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const formatCreatedDate = (iso) => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

/** Demo detail strings for the invoice list modal (until API provides full records). */
const buildInvoiceDetailFields = (row) => {
  const slug = String(row.company || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 14) || 'company';
  const phoneTail = String(62537728 + row.id * 113).slice(-8);
  return {
    invoiceName: row.name,
    companyTitle: row.company,
    companyEmail: `${slug}@gmail.com`,
    companyAddress: `${row.id * 2 + 12} west london`,
    phoneNumber: `+(0)444${phoneTail}`,
    dueDateLabel: formatDueDate(row.dueDate),
    currency: 'USDT',
    milestone: '1',
    serviceTitle: `${row.company} — deliverable`,
    amountLabel: `$${Number(row.amount).toLocaleString('en-US')}`,
  };
};

const Invoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);

  const [accountType, setAccountType] = useState(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Business Suite';
  });
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [businessKycComplete, setBusinessKycComplete] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [rlusdWalletAddress, setRlusdWalletAddress] = useState('');
  const [isLoadingWalletAddress, setIsLoadingWalletAddress] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showConnectBusinessWalletModal, setShowConnectBusinessWalletModal] = useState(false);
  const [connectBusinessWalletAddress, setConnectBusinessWalletAddress] = useState('');
  const [isConnectingBusinessWallet, setIsConnectingBusinessWallet] = useState(false);
  const [isSwitchingAccountType, setIsSwitchingAccountType] = useState(false);
  const [switchMessage, setSwitchMessage] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [filterTab, setFilterTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  /** When true, list is hidden and the New Invoice + preview UI is shown (Create invoice only). */
  const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
  /** Selected list row for read-only Invoice Details modal */
  const [invoiceDetailRow, setInvoiceDetailRow] = useState(null);
  const selectedMonth = 'November';

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  const isKycCompleteForAccount =
    accountType === 'Business Suite' ? businessKycComplete : true;

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
          setBusinessCompanyName(kycData.companyName || '');
          setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
          const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
          const status = statusRaw.replace(/_/g, ' ').toLowerCase();
          const verifiedStatuses = ['verified', 'approved', 'complete'];
          setBusinessKycComplete(verifiedStatuses.includes(status));
        } else {
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
          setBusinessKycComplete(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
          setBusinessKycComplete(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBusinessKyc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountType]);

  useEffect(() => {
    if (walletAddress && typeof walletAddress === 'string' && walletAddress.trim().length > 0) {
      setHasWallet(true);
    }
  }, [walletAddress]);

  const handleConnectBusinessWallet = async () => {
    const address = (connectBusinessWalletAddress || '').trim();
    if (!address) {
      toast.error('Enter an XRPL wallet address.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in.');
      return;
    }
    setIsConnectingBusinessWallet(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/wallet/connect'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });
      const result = await res.json().catch(() => ({}));
      if (result?.success) {
        const addresses = extractWalletAddresses(result, address);
        setWalletAddress(addresses.xrp);
        setRlusdWalletAddress(addresses.rlusd);
        setHasWallet(true);
        setShowConnectBusinessWalletModal(false);
        setConnectBusinessWalletAddress('');
        toast.success(result?.message || 'Wallet connected successfully.');
      } else {
        toast.error(result?.message || 'Failed to connect wallet.');
      }
    } catch (err) {
      console.error('Connect business wallet error:', err);
      toast.error('Failed to connect wallet.');
    } finally {
      setIsConnectingBusinessWallet(false);
    }
  };

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
    if (!token) {
      setIsLoadingUserProfile(false);
      return;
    }
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
          if (firstName && lastName) {
            initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
          } else if (fullName) {
            const nameParts = fullName.trim().split(/\s+/);
            if (nameParts.length >= 2) {
              initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
            } else if (nameParts.length === 1) initials = nameParts[0].charAt(0).toUpperCase();
          }
          setUserInitials(initials);
          setUserRole(data.role || data.userType || data.accountType || '');
          setUserAvatar(getProfileAvatarUrl(data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingUserProfile(false));
  }, [isSessionExpired]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const filteredInvoices = useMemo(() => {
    if (filterTab === 'All') return DEMO_INVOICES;
    return DEMO_INVOICES.filter((inv) => inv.status.toLowerCase() === filterTab.toLowerCase());
  }, [filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, currentPage]);

  const closeInvoiceEditor = () => setShowInvoiceEditor(false);

  const openInvoiceDetailModal = (row) => setInvoiceDetailRow(row);
  const closeInvoiceDetailModal = () => setInvoiceDetailRow(null);

  useEffect(() => {
    if (!invoiceDetailRow) return undefined;
    const onEsc = (e) => {
      if (e.key === 'Escape') setInvoiceDetailRow(null);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [invoiceDetailRow]);

  const handleNavClick = (item) => {
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

  const handleDevelopersNavClick = (item) => {
    if (item.label === 'Api Keys') navigate('/api-keys');
    else if (item.label === 'Sand box enviroment') navigate('/sandbox-environment');
    else if (item.label === 'Web hook') navigate('/webhook');
  };

  const navIsActive = (item) => {
    if (item.label === 'Dashboard') return location.pathname === '/dashboard';
    if (item.label === 'Payroll') return location.pathname === '/payroll' || location.pathname.startsWith('/payroll/');
    if (item.label === 'Supplier Contract') return location.pathname === '/supplier-contract';
    if (item.label === 'Invoice') return location.pathname === '/invoice';
    if (item.label === 'Transactions') return location.pathname === '/transactions';
    if (item.label === 'Dispute') {
      return location.pathname === '/business-dispute' || location.pathname.startsWith('/business-dispute/');
    }
    if (item.label === 'Compliance') return false;
    return false;
  };

  const invoiceDetailFields = invoiceDetailRow ? buildInvoiceDetailFields(invoiceDetailRow) : null;

  return (
    <div
      className={`dashboard invoice-dashboard${
        showInvoiceEditor ? ' invoice-dashboard--editor-open' : ''
      }`}
    >
      {isSwitchingAccountType && <BusinessSuiteLoader />}

      {isMobileMenuOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      )}
      <div className={`mobile-sidebar-drawer invoice-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-sidebar-branding">
            <img src={logo} alt="TrustiChain" className="mobile-sidebar-logo" />
            <div className="mobile-sidebar-branding-text">
              <span className="mobile-sidebar-title">TrustiChain</span>
              <span className="mobile-sidebar-tagline">Invoice</span>
            </div>
          </div>
          <button type="button" className="mobile-sidebar-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">Business Suite</p>
            <nav className="mobile-sidebar-nav">
              {businessSuiteNav.map((item) => {
                const Icon = item.icon;
                const isActive = navIsActive(item);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleNavClick(item);
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge ? <span className="mobile-sidebar-badge">{item.badge}</span> : null}
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
                const isActive =
                  (item.label === 'Api Keys' && location.pathname === '/api-keys') ||
                  (item.label === 'Sand box enviroment' && location.pathname === '/sandbox-environment') ||
                  (item.label === 'Web hook' && location.pathname === '/webhook');
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleDevelopersNavClick(item);
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
                      if (item.path === '/settings') {
                        navigate('/settings', { state: { accountType: 'Business Suite' } });
                      }
                    }}
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
            <span className="mobile-sidebar-trustiscore-label">Trustiscore</span>
            <span className="mobile-sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
          </div>
          <button type="button" className="mobile-sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-layout">
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
                  const isActive = navIsActive(item);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavClick(item)}
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
                  const isActive =
                    (item.label === 'Api Keys' && location.pathname === '/api-keys') ||
                    (item.label === 'Sand box enviroment' && location.pathname === '/sandbox-environment') ||
                    (item.label === 'Web hook' && location.pathname === '/webhook');
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleDevelopersNavClick(item)}
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
                  const isActive = item.path && location.pathname === item.path;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        if (item.path === '/settings') {
                          navigate('/settings', { state: { accountType: 'Business Suite' } });
                        }
                      }}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

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

            <div className="sidebar-footer">
              <div className="sidebar-trustiscore">
                <span className="sidebar-trustiscore-label">Trustiscore</span>
                <span className="sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
              </div>
              <button type="button" className="sidebar-logout" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <main className="dashboard-main">
            <header className="dashboard-header invoice-dashboard-header">
              <div className="invoice-dashboard-header-lead">
                <button
                  type="button"
                  className="invoice-mobile-nav-toggle"
                  aria-label="Open navigation menu"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu size={22} strokeWidth={2} />
                </button>
                <div className="header-info">
                  <p className="header-date">{formattedToday}</p>
                  <h1>Welcome Back !</h1>
                </div>
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
                {accountType === 'Business Suite' || isKycCompleteForAccount ? (
                  <>
                    <div className="account-type-buttons">
                      <button
                        type="button"
                        className={`account-type-btn ${accountType === 'Personal' ? 'active' : ''}`}
                        onClick={() => {
                          if (accountType === 'Business Suite') {
                            setSwitchMessage('switching to personal');
                            setIsSwitchingAccountType(true);
                            setTimeout(() => {
                              setAccountType('Personal');
                              localStorage.setItem('dashboard_account_type', 'Personal');
                              setIsSwitchingAccountType(false);
                              setSwitchMessage('');
                              navigate('/dashboard');
                            }, 2000);
                          } else {
                            setAccountType('Personal');
                            localStorage.setItem('dashboard_account_type', 'Personal');
                          }
                        }}
                      >
                        Personal
                      </button>
                      <button
                        type="button"
                        className={`account-type-btn ${accountType === 'Business Suite' ? 'active' : ''}`}
                        onClick={() => {
                          if (accountType !== 'Business Suite') {
                            navigate('/dashboard', { state: { accountType: 'Business Suite' } });
                          }
                        }}
                      >
                        Business Suite
                      </button>
                    </div>
                    {isKycCompleteForAccount && (
                      <button
                        type="button"
                        className="create-wallet-btn"
                        onClick={async () => {
                          if (walletAddress) {
                            setShowWalletModal(true);
                            return;
                          }
                          setIsLoadingWalletAddress(true);
                          try {
                            const token = localStorage.getItem('token');
                            if (!token) {
                              toast.error('No authentication token found.');
                              setIsLoadingWalletAddress(false);
                              return;
                            }
                            const walletBalanceUrl =
                              accountType === 'Business Suite'
                                ? getApiUrl('api/business-suite/wallet/balance')
                                : getApiUrl('api/wallet/balance');
                            const res = await fetch(walletBalanceUrl, {
                              method: 'GET',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                            });
                            const result = await res.json().catch(() => ({}));
                            const addresses = extractWalletAddresses(result);
                            if (result?.success && addresses.xrp) {
                              setWalletAddress(addresses.xrp);
                              setRlusdWalletAddress(addresses.rlusd);
                              setHasWallet(true);
                              setShowWalletModal(true);
                            } else {
                              const msg = (result?.message || '').toLowerCase();
                              const isNotFound =
                                msg.includes('wallet not found') ||
                                msg.includes('not found') ||
                                !result?.success;
                              setWalletAddress('');
                              setRlusdWalletAddress('');
                              setHasWallet(false);
                              if (accountType === 'Business Suite' && isNotFound) {
                                toast.error(
                                  'No Business Suite wallet connected. Use Create wallet to connect your XRPL address.'
                                );
                                setShowConnectBusinessWalletModal(true);
                              } else {
                                toast.error(result?.message || 'Failed to fetch wallet address.');
                              }
                            }
                          } catch (err) {
                            toast.error('Failed to fetch wallet address.');
                            console.error(err);
                          } finally {
                            setIsLoadingWalletAddress(false);
                          }
                        }}
                      >
                        {isLoadingWalletAddress ? <LoadingIndicator size="sm" /> : 'View Wallet'}
                      </button>
                    )}
                  </>
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
                  <HeaderProfileAvatarNav>
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
                    <HeaderProfileVerifyBadge show={isKycCompleteForAccount} />
                  </HeaderProfileAvatarNav>
                </div>
              </div>
            </header>

            {!showInvoiceEditor ? (
              <>
            <div className="invoice-breadcrumb-row invoice-breadcrumb-row--actions-only">
              <button
                type="button"
                className="invoice-create-btn"
                onClick={() => setShowInvoiceEditor(true)}
              >
                <Plus size={18} />
                Create invoice
              </button>
            </div>

            <div className="invoice-summary-cards">
              <div className="invoice-summary-card">
                <div className="invoice-card-header">
                  <h3 className="invoice-card-title invoice-card-title--accent">Total Invoice</h3>
                  <span className="invoice-trend-badge">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="invoice-card-value">{INVOICE_STATS.totalInvoice}</div>
                <div className="invoice-card-sub">This month</div>
              </div>
              <div className="invoice-summary-card">
                <div className="invoice-card-header">
                  <h3 className="invoice-card-title invoice-card-title--accent">Pending Payments</h3>
                  <span className="invoice-trend-badge">
                    <TrendingUp size={14} />
                    +3.1%
                  </span>
                </div>
                <div className="invoice-card-value">{INVOICE_STATS.pendingPayments}</div>
                <div className="invoice-card-sub">This month</div>
              </div>
              <div className="invoice-summary-card">
                <div className="invoice-card-header">
                  <h3 className="invoice-card-title invoice-card-title--accent">Paid This Month</h3>
                </div>
                <div className="invoice-card-value">{INVOICE_STATS.paidThisMonth}</div>
                <div className="invoice-card-sub">{INVOICE_STATS.paidPercentOfTotal}% of total invoice</div>
              </div>
              <div className="invoice-summary-card">
                <div className="invoice-card-header">
                  <h3 className="invoice-card-title invoice-card-title--accent">Overdue Invoices</h3>
                </div>
                <div className="invoice-card-value">{INVOICE_STATS.overdueInvoices}</div>
                <div className="invoice-card-sub">This month</div>
              </div>
            </div>

            <div className="invoice-table-section">
              <div className="invoice-table-toolbar">
                <div className="invoice-tabs">
                  {['All', 'Paid', 'Pending', 'Overdue'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`invoice-tab ${filterTab === tab ? 'active' : ''}`}
                      onClick={() => setFilterTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button type="button" className="invoice-month-filter" onClick={() => toast('Month filter coming soon')}>
                  <Calendar size={16} />
                  {selectedMonth}
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Invoice NAME</th>
                      <th>Company name</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Due date</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="invoice-table-row--interactive"
                        role="button"
                        tabIndex={0}
                        onClick={() => openInvoiceDetailModal(row)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openInvoiceDetailModal(row);
                          }
                        }}
                      >
                        <td className="invoice-name-cell" data-label="Invoice name">
                          {row.name}
                        </td>
                        <td data-label="Company">
                          <span className="invoice-company-name">{row.company}</span>
                        </td>
                        <td data-label="Amount">${Number(row.amount).toLocaleString('en-US')}</td>
                        <td data-label="Status">
                          <span className={`invoice-status ${row.status.toLowerCase()}`}>{row.status}</span>
                        </td>
                        <td data-label="Due date">{formatDueDate(row.dueDate)}</td>
                        <td data-label="Created">{formatCreatedDate(row.created)}</td>
                        <td data-label="Action">
                          <span className="invoice-action-display" aria-hidden>
                            <ArrowRight size={18} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-pagination">
                <button
                  type="button"
                  className="invoice-pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev {PAGE_SIZE}
                </button>
                <div className="invoice-pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <span
                      key={p}
                      role="button"
                      tabIndex={0}
                      className={p === currentPage ? 'active' : ''}
                      onClick={() => setCurrentPage(p)}
                      onKeyDown={(e) => e.key === 'Enter' && setCurrentPage(p)}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="invoice-pagination-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next {PAGE_SIZE}
                </button>
              </div>
            </div>
              </>
            ) : (
              <InvoiceEditorView
                key="invoice-create"
                listRow={null}
                issuerName={businessCompanyName}
                issuerLogoUrl={businessCompanyLogoUrl}
                onClose={closeInvoiceEditor}
              />
            )}
          </main>
        </div>
      </div>

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="invoice-notifications-title"
      />

      {invoiceDetailFields && (
        <div
          className="invoice-detail-modal-overlay"
          role="presentation"
          onClick={closeInvoiceDetailModal}
        >
          <div
            className="invoice-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-detail-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="invoice-detail-modal-header">
              <div className="invoice-detail-modal-title-wrap">
                <span className="invoice-detail-modal-title-accent" aria-hidden />
                <h2 id="invoice-detail-modal-title">Invoice Details</h2>
              </div>
              <button
                type="button"
                className="invoice-detail-modal-close"
                aria-label="Close"
                onClick={closeInvoiceDetailModal}
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>
            <div className="invoice-detail-modal-body">
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Invoice name</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.invoiceName}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Company Title</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.companyTitle}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Company email</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.companyEmail}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Company Address</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.companyAddress}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Number</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.phoneNumber}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Due Date</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.dueDateLabel}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Currency</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.currency}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Status</span>
                <span
                  className={`invoice-detail-modal-value invoice-detail-modal-value--status ${
                    invoiceDetailRow?.status ? invoiceDetailRow.status.toLowerCase() : ''
                  }`}
                >
                  {invoiceDetailRow?.status || 'Pending'}
                </span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label invoice-detail-modal-label--accent">Milestone</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.milestone}</span>
              </div>
              <div className="invoice-detail-modal-row">
                <span className="invoice-detail-modal-label">Service Title</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.serviceTitle}</span>
              </div>
              <div className="invoice-detail-modal-row invoice-detail-modal-row--last">
                <span className="invoice-detail-modal-label">Amount</span>
                <span className="invoice-detail-modal-value">{invoiceDetailFields.amountLabel}</span>
              </div>
            </div>
            <div className="invoice-detail-modal-footer">
              <button
                type="button"
                className="invoice-detail-modal-done"
                onClick={closeInvoiceDetailModal}
              >
                Done
              </button>
              <button
                type="button"
                className="invoice-detail-modal-complete"
                onClick={() => {
                  toast.success('Invoice marked as completed');
                  closeInvoiceDetailModal();
                }}
              >
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {showWalletModal && hasWallet && walletAddress && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-header">
              <h2>Your Wallet</h2>
              <button type="button" className="wallet-modal-close-btn" onClick={() => setShowWalletModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="wallet-modal-body">
              <p className="wallet-modal-label">XRP Address</p>
              <div className="wallet-modal-address-row">
                <div className="wallet-modal-address-box">{walletAddress}</div>
                <button
                  type="button"
                  className="wallet-modal-copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(walletAddress);
                      toast.success('Wallet address copied');
                    } catch (err) {
                      console.error('Failed to copy wallet address:', err);
                      toast.error('Failed to copy wallet address');
                    }
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="wallet-modal-label" style={{ marginTop: '1rem' }}>
                RLUSD Address
              </p>
              <div className="wallet-modal-address-row">
                <div className="wallet-modal-address-box">{rlusdWalletAddress || walletAddress}</div>
                <button
                  type="button"
                  className="wallet-modal-copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(rlusdWalletAddress || walletAddress);
                      toast.success('RLUSD address copied');
                    } catch (err) {
                      console.error('Failed to copy RLUSD address:', err);
                      toast.error('Failed to copy RLUSD address');
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConnectBusinessWalletModal && (
        <div
          className="notification-modal-overlay"
          onClick={() => !isConnectingBusinessWallet && setShowConnectBusinessWalletModal(false)}
        >
          <div className="notification-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="notification-modal-header">
              <div className="notification-header-content">
                <div className="notification-header-accent" />
                <h2>Connect XRPL Wallet</h2>
              </div>
              <button
                type="button"
                className="notification-close-btn"
                onClick={() => !isConnectingBusinessWallet && setShowConnectBusinessWalletModal(false)}
                disabled={isConnectingBusinessWallet}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="notification-modal-content" style={{ padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Enter your XRPL wallet address to use as your Business Suite wallet. You can fund it from this connected
                wallet.
              </p>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                Wallet address
              </label>
              <input
                type="text"
                placeholder="Paste your XRPL address here"
                value={connectBusinessWalletAddress}
                onChange={(e) => setConnectBusinessWalletAddress(e.target.value)}
                disabled={isConnectingBusinessWallet}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border, #e0e0e0)',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowConnectBusinessWalletModal(false)}
                disabled={isConnectingBusinessWallet}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConnectBusinessWallet}
                disabled={isConnectingBusinessWallet}
              >
                {isConnectingBusinessWallet ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
