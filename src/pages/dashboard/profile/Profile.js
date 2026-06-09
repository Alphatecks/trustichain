import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings,
  HelpCircle,
  Search,
  Bell,
  KeyRound,
  LogOut,
  PiggyBank,
  Copy,
  Pencil,
  X,
  FileCheck,
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Profile.css';
import logo from '../../../assets/images/icons/logo.png';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import { persistTrustitagFromProfileResponse } from '../../../utils/trustitag';
import { extractWalletAddresses } from '../../../utils/depositAddressFlow';
import { handleLogout } from '../../../utils/logout';
import { useSession } from '../../../context/SessionContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import EditTrustitagModal from '../../../components/EditTrustitagModal/EditTrustitagModal';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { PersonalSidebarWalletProvider, PersonalSidebarWalletNav } from '../../../components/PersonalSidebarWallet';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Savings', icon: PiggyBank, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' },
];

const supportNav = [{ label: 'Settings', icon: Settings }];

function readStoredBoolean(key, defaultValue = false) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return raw === 'true';
  } catch {
    return defaultValue;
  }
}

const normalizeCompanyLogoUrl = (data) => {
  const raw =
    data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

async function copyToClipboard(text, successMessage = 'Copied') {
  const t = String(text ?? '').trim();
  if (!t) {
    toast.error('Nothing to copy');
    return;
  }
  try {
    await navigator.clipboard.writeText(t);
    toast.success(successMessage);
  } catch {
    toast.error('Could not copy');
  }
}

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading, openTrustiscoreModal } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();

  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editTrustitagOpen, setEditTrustitagOpen] = useState(false);
  const [formattedToday, setFormattedToday] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [personalKycComplete] = useState(() => readStoredBoolean('kycComplete', true));
  const [businessKycComplete, setBusinessKycComplete] = useState(() =>
    readStoredBoolean('businessKycComplete', false),
  );

  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [trustitag, setTrustitag] = useState('');
  const [rlusdWallet, setRlusdWallet] = useState('');

  const [businessProfileName, setBusinessProfileName] = useState('');
  const [businessProfileEmail, setBusinessProfileEmail] = useState('');
  const [businessLogoUrl, setBusinessLogoUrl] = useState('');
  const [isLoadingBusinessAvatar, setIsLoadingBusinessAvatar] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('dashboard_account_type');
      if (t && typeof t === 'string') setAccountType(t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString(undefined, { month: 'long' });
      const suf = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      setFormattedToday(`${weekday}, ${day}${suf} ${month}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadProfileData = useCallback(async () => {
    if (isSessionExpired) {
      setUserFullName('');
      setUserInitials('');
      setUserAvatar(null);
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setTrustitag('');
      setRlusdWallet('');
      setBusinessProfileName('');
      setBusinessProfileEmail('');
      setBusinessLogoUrl('');
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    const isBusinessSuite = accountType === 'Business Suite';
    setIsLoading(true);

    try {
      const profileRes = await fetch(getApiUrl('api/user/profile'), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const profileJson = await profileRes.json().catch(() => ({}));
      if (profileRes.ok && profileJson?.success && profileJson?.data) {
        persistTrustitagFromProfileResponse(profileJson);
        const data = profileJson.data;
        const fullName =
          data.fullName ||
          [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ') ||
          [data.firstName, data.lastName].filter(Boolean).join(' ') ||
          data.name ||
          '';

        setUserFullName(String(fullName || '').trim());

        let fn = String(data.firstName || '').trim();
        let ln = String(data.lastName || '').trim();
        const mn = String(data.middleName ?? data.middle_name ?? '').trim();
        setMiddleName(mn || '');
        if (!fn && !ln && fullName && typeof fullName === 'string') {
          const parts = fullName.trim().split(/\s+/).filter(Boolean);
          if (parts.length >= 3) {
            fn = parts[0];
            ln = parts.slice(2).join(' ');
          } else if (parts.length === 2) {
            fn = parts[0];
            ln = parts[1];
          } else if (parts.length === 1) fn = parts[0];
        }
        setFirstName(fn);
        setLastName(ln);

        let initials = '';
        if (fn && ln) initials = `${fn.charAt(0).toUpperCase()}${ln.charAt(0).toUpperCase()}`;
        else if (fullName && typeof fullName === 'string') {
          const nameParts = fullName.trim().split(/\s+/);
          if (nameParts.length >= 2) {
            initials = `${nameParts[0].charAt(0).toUpperCase()}${nameParts[nameParts.length - 1].charAt(0).toUpperCase()}`;
          } else if (nameParts.length === 1) initials = nameParts[0].charAt(0).toUpperCase();
        }
        setUserInitials(initials);

        setEmail(
          String(data.email ?? data.emailAddress ?? data.userEmail ?? data.user?.email ?? '').trim(),
        );

        const tagRaw = data.trustitag ?? data.trustiTag ?? data.trust_itag;
        setTrustitag(typeof tagRaw === 'string' && tagRaw.trim() ? tagRaw.trim() : '');

        setUserAvatar(getProfileAvatarUrl(data));
      }

      const walletUrl = isBusinessSuite
        ? getApiUrl('api/business-suite/wallet/balance')
        : getApiUrl('api/wallet/balance');
      const walletRes = await fetch(walletUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const walletJson = await walletRes.json().catch(() => ({}));
      if (walletRes.ok && walletJson) {
        const existingAddress =
          walletJson?.xrplAddress ||
          walletJson?.xrpl_address ||
          walletJson?.data?.xrplAddress ||
          walletJson?.data?.xrpl_address ||
          walletJson?.data?.walletAddress ||
          '';
        const d = walletJson?.data && typeof walletJson.data === 'object' ? walletJson.data : {};
        const mergedFallback =
          (typeof existingAddress === 'string' ? existingAddress : '') ||
          d.xrplAddress ||
          d.xrpl_address ||
          d.walletAddress ||
          d.address ||
          '';
        const addresses = extractWalletAddresses(walletJson, mergedFallback.trim());
        setRlusdWallet(addresses.rlusd || addresses.xrp || '');
      }

      if (isBusinessSuite) {
        setIsLoadingBusinessAvatar(true);
        const [detailsRes, kycRes] = await Promise.all([
          fetch(getApiUrl('api/business-suite/profile/details'), {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }).then((r) => r.json().catch(() => ({}))),
          fetch(getApiUrl('api/business-suite/kyc'), {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }).then((r) => r.json().catch(() => ({}))),
        ]);

        if (detailsRes?.success && detailsRes?.data) {
          const bd = detailsRes.data;
          setBusinessProfileName(String(bd.businessName || '').trim());
          setBusinessProfileEmail(String(bd.businessEmailAddress || '').trim());
          const pic = String(bd.businessProfilePicture || '').trim();
          if (pic) {
            setBusinessLogoUrl(/^https?:\/\//i.test(pic) ? pic : `${API_BASE_URL.replace(/\/$/, '')}${pic.startsWith('/') ? pic : `/${pic}`}`);
          }
        }

        if (kycRes?.success && kycRes?.data) {
          const kycData = kycRes.data;
          const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
          const status = statusRaw.replace(/_/g, ' ').toLowerCase();
          const verifiedStatuses = ['verified', 'approved', 'complete'];
          const verified = verifiedStatuses.includes(status);
          setBusinessKycComplete(verified);
          if (verified) localStorage.setItem('businessKycComplete', 'true');
          else localStorage.removeItem('businessKycComplete');

          const logoFromKyc = normalizeCompanyLogoUrl(kycData);
          if (logoFromKyc) setBusinessLogoUrl((prev) => prev || logoFromKyc);
          const nm = String(kycData.companyName || '').trim();
          if (nm) setBusinessProfileName((prev) => prev || nm);
        }
      }
    } catch (e) {
      console.error('[Profile] load failed', e);
      toast.error('Could not load profile');
    } finally {
      setIsLoadingBusinessAvatar(false);
      setIsLoading(false);
    }
  }, [accountType, isSessionExpired]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const isNavActive = (label) =>
    (label === 'Dashboard' && location.pathname === '/dashboard') ||
    (label === 'My Escrow' && location.pathname === '/my-escrow') ||
    (label === 'Transactions' && location.pathname === '/transactions') ||
    (label === 'Dispute' && location.pathname.startsWith('/dispute')) ||
    (label === 'Savings' && location.pathname === '/savings') ||
    (label === 'Trusticard' && location.pathname === '/trusticard');

  const navigateForLabel = (label) => {
    if (label === 'Dashboard') navigate('/dashboard');
    else if (label === 'My Escrow') navigate('/my-escrow');
    else if (label === 'Transactions') navigate('/transactions');
    else if (label === 'Dispute') navigate('/dispute');
    else if (label === 'Savings') navigate('/savings');
    else if (label === 'Trusticard') navigate('/trusticard');
  };

  const showVerifiedBadge =
    accountType === 'Business Suite' ? businessKycComplete : personalKycComplete;

  const summaryName =
    accountType === 'Business Suite'
      ? businessProfileName || userFullName || '—'
      : userFullName || '—';

  const summaryEmail =
    accountType === 'Business Suite'
      ? businessProfileEmail || email || '—'
      : email || '—';

  const summaryAvatarEl =
    accountType === 'Business Suite' ? (
      businessLogoUrl ? (
        <img src={businessLogoUrl} alt={summaryName} />
      ) : isLoadingBusinessAvatar ? (
        <LoadingIndicator size="sm" />
      ) : (
        (businessProfileName || summaryName || '—').charAt(0).toUpperCase()
      )
    ) : userAvatar ? (
      <img src={userAvatar} alt={summaryName} />
    ) : (
      userInitials || '—'
    );

  const gridFirstLabel = accountType === 'Business Suite' ? 'Business name' : 'First Name';
  const gridFirstValue =
    accountType === 'Business Suite' ? businessProfileName || '—' : firstName || '—';

  const gridMiddleLabel = accountType === 'Business Suite' ? 'Trading name' : 'Middle Name';
  const gridMiddleValue =
    accountType === 'Business Suite' ? '—' : middleName.trim() ? middleName : '—';

  const gridLastLabel = accountType === 'Business Suite' ? 'Company tagline' : 'Last Name';
  const gridLastValue = accountType === 'Business Suite' ? '—' : lastName || '—';

  const gridEmailValue =
    accountType === 'Business Suite' ? businessProfileEmail || email || '—' : email || '—';

  const desktopHeaderAvatar = (
    <>
      {accountType === 'Business Suite' ? (
        businessLogoUrl ? (
          <img src={businessLogoUrl} alt={businessProfileName || 'Business'} className="user-avatar-img" />
        ) : isLoadingBusinessAvatar ? (
          <LoadingIndicator size="sm" />
        ) : (
          businessProfileName ? businessProfileName.charAt(0).toUpperCase() : '—'
        )
      ) : userAvatar ? (
        <img src={userAvatar} alt={userFullName} className="user-avatar-img" />
      ) : (
        userInitials
      )}
      <HeaderProfileVerifyBadge show={showVerifiedBadge} />
    </>
  );

  const mobileVerify =
    accountType === 'Business Suite' ? businessKycComplete : personalKycComplete;

  const handleMobileProfileClose = () => {
    navigate(-1);
  };

  const walletCopyBtn =
    rlusdWallet ? (
      <button
        type="button"
        className="profile-copy-btn"
        aria-label="Copy RLUSD wallet address"
        onClick={() => copyToClipboard(rlusdWallet, 'Wallet address copied')}
      >
        <Copy size={16} strokeWidth={2} />
      </button>
    ) : null;

  const trustitagCopyBtn =
    trustitag ? (
      <button
        type="button"
        className="profile-copy-btn"
        aria-label="Copy Trustitag"
        onClick={() => copyToClipboard(trustitag, 'Trustitag copied')}
      >
        <Copy size={16} strokeWidth={2} />
      </button>
    ) : null;

  return (
    <PersonalSidebarWalletProvider
      isSessionExpired={isSessionExpired}
      enabled={accountType !== 'Business Suite'}
    >
    <div className="profile-route">
      <header className="profile-mobile-topbar">
        <div className="profile-mobile-topbar-title">
          <span className="profile-mobile-topbar-accent" aria-hidden />
          <h1 className="profile-mobile-topbar-heading">Profile</h1>
        </div>
        <button type="button" className="profile-mobile-close" onClick={handleMobileProfileClose} aria-label="Close profile">
          <X size={20} strokeWidth={2} />
        </button>
      </header>

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
            <p className="sidebar-section-label">Main Menu</p>
            <nav className="sidebar-nav">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const navBadge = getNavBadge(item);
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`sidebar-nav-item ${isNavActive(item.label) ? 'active' : ''}`}
                    onClick={() => navigateForLabel(item.label)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {navBadge != null && navBadge !== '' ? <span className="sidebar-badge">{navBadge}</span> : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {accountType !== 'Business Suite' && <PersonalSidebarWalletNav />}

          <div className="sidebar-section">
            <p className="sidebar-section-label">Support</p>
            <nav className="sidebar-nav">
              {supportNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" className="sidebar-nav-item" onClick={() => navigate('/settings')}>
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

        <main className="dashboard-main savings-dashboard-main">
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
              {mobileVerify ? (
                <>
                  <button
                    type="button"
                    className="header-trustiscore-box"
                    role="status"
                    aria-label={`TrustiScore ${trustiscoreBadgeText}`}
                    onClick={openTrustiscoreModal}
                  >
                    <span className="header-trustiscore-label">TrustiScore</span>
                    <span className="header-trustiscore-value">{trustiscoreBadgeText}</span>
                  </button>
                  <div className="account-type-display">
                    <span className="account-type-label">{accountType}</span>
                  </div>
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
                <HeaderProfileAvatarNav>{desktopHeaderAvatar}</HeaderProfileAvatarNav>
              </div>
            </div>
          </header>

          <div className="profile-page">
            {isLoading ? (
              <div className="profile-loading">
                <LoadingIndicator size="md" />
              </div>
            ) : (
              <>
                <div className="card-breadcrumb">
                  <span className="breadcrumb-root">General</span>
                  <span className="breadcrumb-divider">›</span>
                  <span className="breadcrumb-current">Profile</span>
                </div>

                <div className="profile-card profile-card--basic-strip">
                  <span className="profile-chip profile-chip--basic">Basic Information</span>
                </div>

                <div className="profile-card profile-summary-card">
                  <div className="profile-summary-avatar">{summaryAvatarEl}</div>
                  <div className="profile-summary-meta">
                    <p className="profile-summary-name">{summaryName}</p>
                    <p className="profile-summary-email">{summaryEmail}</p>
                  </div>
                  {showVerifiedBadge ? <span className="profile-summary-verified">Verified</span> : null}
                </div>

                <div className="profile-card">
                  <span className="profile-chip profile-chip--muted">Personal Information</span>
                  <div className="profile-personal-desktop">
                    <div className="profile-grid" style={{ marginTop: '1.25rem' }}>
                      <div>
                        <span className="profile-field-label">{gridFirstLabel}</span>
                        <p className="profile-field-value">{gridFirstValue}</p>
                        <span className="profile-field-label" style={{ marginTop: '1rem' }}>
                          Email
                        </span>
                        <p className="profile-field-value profile-field-value--normal">{gridEmailValue}</p>
                      </div>
                      <div>
                        <span className="profile-field-label">{gridMiddleLabel}</span>
                        <p className="profile-field-value profile-field-value--normal">{gridMiddleValue}</p>
                        <span className="profile-field-label" style={{ marginTop: '1rem' }}>
                          RLUSD Wallet
                        </span>
                        <div className="profile-copy-row">
                          <code>{rlusdWallet || '—'}</code>
                          {walletCopyBtn}
                        </div>
                      </div>
                      <div>
                        <span className="profile-field-label">{gridLastLabel}</span>
                        <p className="profile-field-value">{gridLastValue}</p>
                      </div>
                    </div>
                  </div>
                  <div className="profile-personal-mobile">
                    <div className="profile-mobile-field">
                      <span className="profile-field-label">{gridFirstLabel}</span>
                      <p className="profile-field-value">{gridFirstValue}</p>
                    </div>
                    <div className="profile-mobile-field">
                      <span className="profile-field-label">{gridMiddleLabel}</span>
                      <p className="profile-field-value profile-field-value--normal">{gridMiddleValue}</p>
                    </div>
                    <div className="profile-mobile-field">
                      <span className="profile-field-label">{gridLastLabel}</span>
                      <p className="profile-field-value">{gridLastValue}</p>
                    </div>
                    <div className="profile-mobile-field">
                      <span className="profile-field-label">Email</span>
                      <p className="profile-field-value profile-field-value--normal">{gridEmailValue}</p>
                    </div>
                    <div className="profile-mobile-field">
                      <span className="profile-field-label">RLUSD Wallet</span>
                      <div className="profile-copy-row profile-copy-row--wallet-mobile">
                        <code>{rlusdWallet || '—'}</code>
                        {walletCopyBtn}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-card profile-card--trustitag">
                  <div className="profile-section-head">
                    <span className="profile-chip profile-chip--muted">Trustitag</span>
                    <button type="button" className="profile-trustitag-edit" onClick={() => setEditTrustitagOpen(true)}>
                      <Pencil size={16} strokeWidth={2} aria-hidden />
                      Edit
                    </button>
                  </div>
                  <div className="profile-trustitag-box profile-copy-row">
                    <code>{trustitag || '—'}</code>
                    {trustitagCopyBtn}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <EditTrustitagModal
        isOpen={editTrustitagOpen}
        initialTrustitag={trustitag}
        onClose={() => setEditTrustitagOpen(false)}
        onSaved={(next) => setTrustitag(next)}
      />

      <NotificationCenterModal open={showNotificationModal} onClose={() => setShowNotificationModal(false)} titleId="profile-notifications-title" />
    </div>
    </PersonalSidebarWalletProvider>
  );
};

export default Profile;
