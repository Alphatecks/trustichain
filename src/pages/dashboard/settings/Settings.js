import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  FileCheck,
  Settings as SettingsIcon,
  HelpCircle,
  Search,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  Pencil,
  ChevronDown,
  Globe,
  KeyRound,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Settings.css';
import logo from '../../../assets/images/icons/logo.png';
import verifyBadge from '../../../assets/images/icons/verify.png';
import { useSession } from '../../../context/SessionContext';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import toast from 'react-hot-toast';

const normalizeCompanyLogoUrl = (data) => {
  const raw = data?.companyLogoUrl ?? data?.logoUrl ?? data?.company_logo_url ?? data?.logo_url ?? data?.url ?? '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = s.startsWith('/') ? s : `/${s}`;
  return `${base}${path}`;
};

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

const supportNav = [
  { label: 'Settings', icon: SettingsIcon },
  { label: 'Security', icon: ShieldCheck }
];

const SettingsUserProfileImage = ({ profileImage, userInitials, onImageChange, fileInputRef }) => (
  <div className="settings-profile-image-section">
    <div className="settings-profile-image-wrapper">
      {profileImage ? (
        <img src={profileImage} alt="Profile" className="settings-profile-image" />
      ) : (
        <div className="settings-profile-image-placeholder">{userInitials}</div>
      )}
      <label className="settings-profile-edit-btn">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageChange}
          style={{ display: 'none' }}
        />
        <Pencil size={14} />
      </label>
    </div>
    <h3 className="settings-upload-text">Upload your Image</h3>
  </div>
);

const readFileAsDataUrl = (file, onResult) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => onResult(reader.result);
  reader.readAsDataURL(file);
};

const SettingsKycEditorBody = ({
  idSuffix = '',
  selfieImage,
  setSelfieImage,
  fullName,
  setFullName,
  nationality,
  setNationality,
  nidPassportNumber,
  setNidPassportNumber,
  dob,
  setDob,
  frontNidImage,
  setFrontNidImage,
  backNidImage,
  setBackNidImage,
  selfieDocImage,
  setSelfieDocImage,
  xumm,
  setXumm,
  metamask,
  setMetamask,
}) => {
  const frontId = `front-nid-upload${idSuffix}`;
  const backId = `back-nid-upload${idSuffix}`;
  const selfieDocId = `selfie-doc-upload${idSuffix}`;

  return (
    <>
      <div className="settings-kyc-selfie-section">
        <div className="settings-kyc-image-wrapper">
          {selfieImage ? (
            <img src={selfieImage} alt="Selfie" className="settings-kyc-image" />
          ) : (
            <div className="settings-kyc-image-placeholder">
              <ImageIcon size={32} />
            </div>
          )}
          <label className="settings-kyc-edit-btn">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => readFileAsDataUrl(e.target.files[0], setSelfieImage)}
              style={{ display: 'none' }}
            />
            <Pencil size={18} />
          </label>
        </div>
        <div className="settings-kyc-selfie-info">
          <h3 className="settings-kyc-selfie-title">Selfie</h3>
          <p className="settings-kyc-selfie-subtitle">Max upto 5mb</p>
        </div>
      </div>

      <div className="settings-kyc-section">
        <h2 className="settings-kyc-section-title">Proof of identity</h2>
        <div className="settings-form-row">
          <div className="settings-form-field">
            <label className="settings-form-label">Full name</label>
            <input
              type="text"
              className="settings-form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="settings-form-field">
            <label className="settings-form-label">Nationality</label>
            <input
              type="text"
              className="settings-form-input"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            />
          </div>
        </div>
        <div className="settings-form-row">
          <div className="settings-form-field">
            <label className="settings-form-label">NID/Passport Number</label>
            <input
              type="text"
              className="settings-form-input"
              value={nidPassportNumber}
              onChange={(e) => setNidPassportNumber(e.target.value)}
            />
          </div>
          <div className="settings-form-field">
            <label className="settings-form-label">DOB</label>
            <input
              type="text"
              className="settings-form-input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="settings-kyc-section">
        <h2 className="settings-kyc-section-title">Document upload</h2>
        <p className="settings-kyc-approval-text">Approval Workflow</p>
        <div className="settings-kyc-documents-grid">
          <div className="settings-kyc-document-item">
            <label className="settings-kyc-document-label">Front NID</label>
            <div className="settings-kyc-document-upload">
              {frontNidImage ? (
                <img src={frontNidImage} alt="Front NID" className="settings-kyc-document-image" />
              ) : (
                <div className="settings-kyc-document-placeholder">
                  <Upload size={24} />
                  <span>Upload</span>
                </div>
              )}
              <input
                id={frontId}
                type="file"
                accept="image/*"
                onChange={(e) => readFileAsDataUrl(e.target.files[0], setFrontNidImage)}
                style={{ display: 'none' }}
              />
              <label htmlFor={frontId} className="settings-kyc-document-upload-label" />
            </div>
          </div>
          <div className="settings-kyc-document-item">
            <label className="settings-kyc-document-label">Back NID</label>
            <div className="settings-kyc-document-upload">
              {backNidImage ? (
                <img src={backNidImage} alt="Back NID" className="settings-kyc-document-image" />
              ) : (
                <div className="settings-kyc-document-placeholder">
                  <Upload size={24} />
                  <span>Upload</span>
                </div>
              )}
              <input
                id={backId}
                type="file"
                accept="image/*"
                onChange={(e) => readFileAsDataUrl(e.target.files[0], setBackNidImage)}
                style={{ display: 'none' }}
              />
              <label htmlFor={backId} className="settings-kyc-document-upload-label" />
            </div>
          </div>
          <div className="settings-kyc-document-item">
            <label className="settings-kyc-document-label">selfie</label>
            <div className="settings-kyc-document-upload">
              {selfieDocImage ? (
                <img src={selfieDocImage} alt="Selfie document" className="settings-kyc-document-image" />
              ) : (
                <div className="settings-kyc-document-placeholder">
                  <Upload size={24} />
                  <span>Upload</span>
                </div>
              )}
              <input
                id={selfieDocId}
                type="file"
                accept="image/*"
                onChange={(e) => readFileAsDataUrl(e.target.files[0], setSelfieDocImage)}
                style={{ display: 'none' }}
              />
              <label htmlFor={selfieDocId} className="settings-kyc-document-upload-label" />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-kyc-section settings-kyc-compliance-section">
        <h2 className="settings-kyc-section-title">Compliance Settings</h2>
        <div className="settings-form-row">
          <div className="settings-form-field">
            <label className="settings-form-label">XUMM</label>
            <input
              type="text"
              className="settings-form-input"
              value={xumm}
              onChange={(e) => setXumm(e.target.value)}
            />
          </div>
          <div className="settings-form-field">
            <label className="settings-form-label">Metamask</label>
            <input
              type="text"
              className="settings-form-input"
              value={metamask}
              onChange={(e) => setMetamask(e.target.value)}
            />
          </div>
        </div>
        <div className="settings-kyc-compliance-edit-section">
          <button
            type="button"
            className="settings-kyc-edit-btn"
            onClick={() => {
              console.log('Edit KYC clicked');
            }}
          >
            <Pencil size={18} />
            Edit
          </button>
        </div>
      </div>
    </>
  );
};

const SettingsUserAccountForm = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  language,
  setLanguage,
  showLanguageDropdown,
  setShowLanguageDropdown,
  onSave,
  isSaving,
}) => (
  <div className="settings-form">
    <div className="settings-form-row">
      <div className="settings-form-field">
        <label className="settings-form-label">First Name</label>
        <input
          type="text"
          className="settings-form-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="settings-form-field">
        <label className="settings-form-label">Last Name</label>
        <input
          type="text"
          className="settings-form-input"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
    </div>

    <div className="settings-form-field">
      <label className="settings-form-label">Email Address</label>
      <input
        type="email"
        className="settings-form-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>

    <div className="settings-form-field">
      <label className="settings-form-label">Language</label>
      <div className="settings-dropdown-wrapper">
        <button
          type="button"
          className="settings-dropdown-btn"
          onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
        >
          <Globe size={16} />
          <span>{language}</span>
          <ChevronDown size={16} />
        </button>
        {showLanguageDropdown && (
          <div className="settings-dropdown">
            <button
              type="button"
              className="settings-dropdown-item"
              onClick={() => {
                setLanguage('English');
                setShowLanguageDropdown(false);
              }}
            >
              English
            </button>
            <button
              type="button"
              className="settings-dropdown-item"
              onClick={() => {
                setLanguage('Spanish');
                setShowLanguageDropdown(false);
              }}
            >
              Spanish
            </button>
            <button
              type="button"
              className="settings-dropdown-item"
              onClick={() => {
                setLanguage('French');
                setShowLanguageDropdown(false);
              }}
            >
              French
            </button>
          </div>
        )}
      </div>
    </div>

    <div className="settings-form-actions">
      <button
        type="button"
        className="settings-save-btn"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Personal';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [formattedToday, setFormattedToday] = useState('');
  const [businessKycComplete, setBusinessKycComplete] = useState(() => {
    const stored = localStorage.getItem('businessKycComplete');
    return stored ? JSON.parse(stored) : false;
  });
  const [isLoadingBusinessKyc, setIsLoadingBusinessKyc] = useState(false);
  const [businessCompanyName, setBusinessCompanyName] = useState('');
  const [businessCompanyLogoUrl, setBusinessCompanyLogoUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 769px)').matches) {
      setSelectedCategory('User');
    }
  }, []);

  useEffect(() => {
    if (selectedCategory === 'Business Suite') {
      setSelectedCategory('User');
    }
  }, [selectedCategory]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  /** Local preview (data URL) for a file chosen but not yet uploaded via Save */
  const [localPhotoPreview, setLocalPhotoPreview] = useState(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [isSavingUserProfile, setIsSavingUserProfile] = useState(false);
  const profilePhotoInputRef = useRef(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('English');

  // KYC Verification state
  const [selfieImage, setSelfieImage] = useState(null);
  const [fullName, setFullName] = useState('TechFlow Solutions');
  const [nidPassportNumber, setNidPassportNumber] = useState('TechFlow Solutions');
  const [nationality, setNationality] = useState('Active');
  const [dob, setDob] = useState('Active');
  const [frontNidImage, setFrontNidImage] = useState(null);
  const [backNidImage, setBackNidImage] = useState(null);
  const [selfieDocImage, setSelfieDocImage] = useState(null);
  const [xrpWalletAddress, setXrpWalletAddress] = useState('Trustichain Mediation');
  const [xumm, setXumm] = useState('Trustichain Mediation');
  const [metamask, setMetamask] = useState('$10000');

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavClick = (item) => {
    closeMobileMenu();
    if (item.label === 'Dashboard') {
      navigate('/dashboard');
    } else if (item.label === 'My Escrow') {
      navigate('/my-escrow');
    } else if (item.label === 'Transactions') {
      navigate('/transactions');
    } else if (item.label === 'Dispute') {
      navigate('/dispute');
    } else if (item.label === 'Trusticard') {
      navigate('/trusticard');
    }
  };

  const handleSupportNavClick = (item) => {
    closeMobileMenu();
    if (item.label === 'Settings') {
      navigate('/settings');
    } else if (item.label === 'Security') {
      navigate('/security');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingPhotoFile(file);
    readFileAsDataUrl(file, setLocalPhotoPreview);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (isSessionExpired || !token) {
      toast.error('Please sign in to save.');
      return;
    }
    if (!pendingPhotoFile) {
      toast('Select a profile photo, then click Save to upload.');
      return;
    }

    setIsSavingUserProfile(true);
    try {
      const formData = new FormData();
      formData.append('photo', pendingPhotoFile);

      const response = await fetch(getApiUrl('api/user/profile/photo'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success) {
        const nextUrl = result?.data?.avatarUrl;
        if (nextUrl) {
          setUserAvatar(nextUrl);
        } else {
          try {
            const profileRes = await fetch(getApiUrl('api/user/profile'), {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            const profileJson = await profileRes.json().catch(() => ({}));
            const refreshed = getProfileAvatarUrl(profileJson?.data);
            if (refreshed) setUserAvatar(refreshed);
          } catch {
            /* keep prior avatar */
          }
        }
        setLocalPhotoPreview(null);
        setPendingPhotoFile(null);
        if (profilePhotoInputRef.current) {
          profilePhotoInputRef.current.value = '';
        }
        toast.success(result.message || 'Profile photo updated');
      } else {
        toast.error(
          result?.message || result?.error || 'Failed to upload profile photo.'
        );
      }
    } catch {
      toast.error('Failed to upload profile photo.');
    } finally {
      setIsSavingUserProfile(false);
    }
  };

  // Real-time date formatting - updates every minute
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
      const day = now.getDate();
      const month = now.toLocaleDateString(undefined, { month: 'long' });
      const formatted = `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
      setFormattedToday(formatted);
    };

    // Update immediately
    updateDate();

    // Update every minute to keep it real-time
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  const isKycCompleteForAccount =
    accountType === 'Business Suite' ? businessKycComplete : true;

  useEffect(() => {
    localStorage.setItem('dashboard_account_type', accountType);
  }, [accountType]);

  useEffect(() => {
    if (location.state?.accountType) {
      setAccountType(location.state.accountType);
    }
  }, [location.state]);

  useEffect(() => {
    if (accountType !== 'Business Suite') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setBusinessKycComplete(false);
      localStorage.removeItem('businessKycComplete');
      return;
    }
    let cancelled = false;
    setIsLoadingBusinessKyc(true);
    fetch(getApiUrl('api/business-suite/kyc'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        if (result?.success && result?.data) {
          const kycData = result.data;
          const statusRaw = String(kycData?.status ?? kycData?.verification?.status ?? '').trim();
          const status = statusRaw.replace(/_/g, ' ').toLowerCase();
          const verifiedStatuses = ['verified', 'approved', 'complete'];
          const isKycVerified = verifiedStatuses.includes(status);
          if (isKycVerified) {
            setBusinessKycComplete(true);
            setBusinessCompanyName(kycData.companyName || '');
            setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
            localStorage.setItem('businessKycComplete', 'true');
          } else {
            setBusinessKycComplete(false);
            setBusinessCompanyName(kycData?.companyName || '');
            setBusinessCompanyLogoUrl(normalizeCompanyLogoUrl(kycData) || '');
            localStorage.removeItem('businessKycComplete');
          }
        } else {
          setBusinessKycComplete(false);
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
          localStorage.removeItem('businessKycComplete');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusinessKycComplete(false);
          setBusinessCompanyName('');
          setBusinessCompanyLogoUrl('');
          localStorage.removeItem('businessKycComplete');
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
    const fetchUserProfile = async () => {
      if (isSessionExpired) {
        setUserFullName('');
        setUserInitials('');
        setUserRole('');
        setUserAvatar(null);
        setLocalPhotoPreview(null);
        setPendingPhotoFile(null);
        if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
        setFirstName('');
        setLastName('');
        setEmail('');
        setIsLoadingUserProfile(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setFirstName('');
          setLastName('');
          setEmail('');
          setLocalPhotoPreview(null);
          setPendingPhotoFile(null);
          if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
          setIsLoadingUserProfile(false);
          return;
        }

        const apiUrl = getApiUrl('api/user/profile');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
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
              '';

            if (fullName && typeof fullName === 'string') {
              setUserFullName(fullName);
            }

            const firstName = data.firstName || '';
            const lastName = data.lastName || '';
            let initials = '';

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

            const role = data.role || data.userType || data.accountType || '';
            setUserRole(role);

            setUserAvatar(getProfileAvatarUrl(data));

            let fn = (data.firstName || '').trim();
            let ln = (data.lastName || '').trim();
            if (!fn && !ln && fullName && typeof fullName === 'string') {
              const parts = fullName.trim().split(/\s+/).filter(Boolean);
              if (parts.length >= 2) {
                fn = parts[0];
                ln = parts.slice(1).join(' ');
              } else if (parts.length === 1) {
                fn = parts[0];
              }
            }
            setFirstName(fn);
            setLastName(ln);
            setEmail(
              String(
                data.email ??
                  data.emailAddress ??
                  data.userEmail ??
                  data.user?.email ??
                  ''
              ).trim()
            );

            const lang =
              data.language ||
              data.preferredLanguage ||
              data.locale ||
              data.settings?.language;
            if (lang && typeof lang === 'string') {
              setLanguage(lang);
            }
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

  useEffect(() => {
    const sheetOpen =
      selectedCategory === 'User' || selectedCategory === 'KYC Verification';
    if (!sheetOpen) return undefined;

    const applyBodyScrollLock = () => {
      const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
      document.body.style.overflow = mobile ? 'hidden' : '';
    };

    applyBodyScrollLock();
    window.addEventListener('resize', applyBodyScrollLock);
    return () => {
      window.removeEventListener('resize', applyBodyScrollLock);
      document.body.style.overflow = '';
    };
  }, [selectedCategory]);

  const displayProfileImage = localPhotoPreview || userAvatar;

  const userEditorProps = {
    profileImage: displayProfileImage,
    userInitials,
    onImageChange: handleImageUpload,
    fileInputRef: profilePhotoInputRef,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    language,
    setLanguage,
    showLanguageDropdown,
    setShowLanguageDropdown,
    onSave: handleSave,
    isSaving: isSavingUserProfile,
  };

  const kycEditorProps = {
    selfieImage,
    setSelfieImage,
    fullName,
    setFullName,
    nationality,
    setNationality,
    nidPassportNumber,
    setNidPassportNumber,
    dob,
    setDob,
    frontNidImage,
    setFrontNidImage,
    backNidImage,
    setBackNidImage,
    selfieDocImage,
    setSelfieDocImage,
    xumm,
    setXumm,
    metamask,
    setMetamask,
  };

  return (
    <div className="dashboard settings-dashboard">
      {isMobileMenuOpen && (
        <div
          className="settings-sidebar-overlay"
          role="presentation"
          onClick={closeMobileMenu}
        />
      )}
      {/* Sidebar: do not use global class "mobile-sidebar-drawer" on this aside — MyEscrow.css hides
          .mobile-sidebar-drawer on desktop for the whole app, which would remove the Settings sidebar. */}
      <aside
        className={`dashboard-sidebar settings-sidebar-aside${isMobileMenuOpen ? ' settings-sidebar-aside--open' : ''}`}
      >
            <div className="mobile-sidebar-header settings-sidebar-drawer-header-mobile">
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
                aria-label="Close menu"
                onClick={closeMobileMenu}
              >
                <X size={20} />
              </button>
            </div>
            <div className="sidebar-branding settings-sidebar-brand-desktop">
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
                  const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                   (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                                   (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                   (item.label === 'Dispute' && location.pathname === '/dispute') ||
                                   (item.label === 'Trusticard' && location.pathname === '/trusticard');
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
              <p className="sidebar-section-label">Support</p>
              <nav className="sidebar-nav">
                {supportNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.label === 'Settings' && location.pathname === '/settings';
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSupportNavClick(item)}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Help Center Widget */}
            <div className="sidebar-help-card">
              <div className="help-icon-large">
                <HelpCircle size={24} />
              </div>
              <h3>Help Center</h3>
              <p>Having trouble in Trustichain? Please contact us</p>
              <button type="button" className="help-cta">Contact us</button>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
              <div className="sidebar-trustiscore">
                <span className="sidebar-trustiscore-label">Trustiscore</span>
                <span className="sidebar-trustiscore-badge">97</span>
              </div>
              <button
                type="button"
                className="sidebar-logout"
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main">
            <div className="mobile-dashboard-header settings-mobile-dashboard-header" aria-label="Profile">
              <div className="mobile-header-left">
                <div className="mobile-user-avatar">
                  {accountType === 'Business Suite' ? (
                    businessCompanyLogoUrl ? (
                      <img src={businessCompanyLogoUrl} alt={businessCompanyName || 'Business'} />
                    ) : isLoadingBusinessKyc ? (
                      <LoadingIndicator size="sm" />
                    ) : (
                      businessCompanyName ? businessCompanyName.charAt(0).toUpperCase() : '—'
                    )
                  ) : userAvatar ? (
                    <img src={userAvatar} alt={userFullName || 'User'} />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="mobile-user-info">
                  <span className="mobile-user-name">
                    {accountType === 'Business Suite' ? (
                      isLoadingBusinessKyc || !businessCompanyName ? (
                        <LoadingIndicator size="sm" />
                      ) : (
                        businessCompanyName
                      )
                    ) : isLoadingUserProfile ? (
                      <LoadingIndicator size="sm" />
                    ) : (
                      userFullName
                    )}
                    <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
                  </span>
                  <span className="mobile-user-role">
                    {accountType === 'Business Suite'
                      ? 'Business'
                      : isLoadingUserProfile
                        ? <LoadingIndicator size="sm" />
                        : userRole}
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

            {/* Header */}
            <header className="dashboard-header" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', alignItems: 'center', width: '100%' }}>
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

              <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', justifySelf: 'end', marginLeft: 'auto' }}>
                {isKycCompleteForAccount ? (
                  <div className="account-type-display">
                    <span className="account-type-label">{accountType}</span>
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
                      <img src={userAvatar} alt={userFullName || 'User'} className="user-avatar-img" />
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

            {/* Page Title */}
            <div className="settings-page-title">
              <h1>Settings</h1>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
              {/* Left Panel - Settings Categories */}
              <div className="settings-categories">
                <button
                  type="button"
                  className={`settings-category-btn ${selectedCategory === 'User' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('User')}
                >
                  <User size={18} />
                  User
                </button>
                <div className="settings-category-item">
                  <div className="settings-category-label">
                    <Bell size={18} />
                    <span>Notification Settings</span>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <button
                  type="button"
                  className={`settings-category-btn ${selectedCategory === 'KYC Verification' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('KYC Verification')}
                >
                  <ShieldCheck size={18} />
                  KYC Verification
                </button>
              </div>

              {/* Right Panel - User Profile Details (desktop) + full-screen sheet (mobile only via CSS) */}
              {selectedCategory === 'User' && (
                <>
                  <div className="settings-details-panel settings-user-panel">
                    <SettingsUserProfileImage
                      profileImage={userEditorProps.profileImage}
                      userInitials={userEditorProps.userInitials}
                      onImageChange={userEditorProps.onImageChange}
                      fileInputRef={userEditorProps.fileInputRef}
                    />
                    <div className="settings-user-form-desktop">
                      <SettingsUserAccountForm
                        firstName={userEditorProps.firstName}
                        setFirstName={userEditorProps.setFirstName}
                        lastName={userEditorProps.lastName}
                        setLastName={userEditorProps.setLastName}
                        email={userEditorProps.email}
                        setEmail={userEditorProps.setEmail}
                        language={userEditorProps.language}
                        setLanguage={userEditorProps.setLanguage}
                        showLanguageDropdown={userEditorProps.showLanguageDropdown}
                        setShowLanguageDropdown={userEditorProps.setShowLanguageDropdown}
                        onSave={userEditorProps.onSave}
                        isSaving={userEditorProps.isSaving}
                      />
                    </div>
                  </div>

                  <div
                    className="settings-user-mobile-sheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="settings-user-sheet-title"
                  >
                    <div className="settings-user-mobile-sheet-inner">
                      <header className="settings-user-mobile-sheet-header">
                        <span className="settings-user-mobile-sheet-accent" aria-hidden />
                        <h2 id="settings-user-sheet-title" className="settings-user-mobile-sheet-title">
                          User
                        </h2>
                        <button
                          type="button"
                          className="settings-user-mobile-sheet-close"
                          aria-label="Close"
                          onClick={() => setSelectedCategory('')}
                        >
                          <X size={22} />
                        </button>
                      </header>
                      <div className="settings-user-mobile-sheet-card">
                        <SettingsUserProfileImage
                          profileImage={userEditorProps.profileImage}
                          userInitials={userEditorProps.userInitials}
                          onImageChange={userEditorProps.onImageChange}
                          fileInputRef={userEditorProps.fileInputRef}
                        />
                        <SettingsUserAccountForm
                          firstName={userEditorProps.firstName}
                          setFirstName={userEditorProps.setFirstName}
                          lastName={userEditorProps.lastName}
                          setLastName={userEditorProps.setLastName}
                          email={userEditorProps.email}
                          setEmail={userEditorProps.setEmail}
                          language={userEditorProps.language}
                          setLanguage={userEditorProps.setLanguage}
                          showLanguageDropdown={userEditorProps.showLanguageDropdown}
                          setShowLanguageDropdown={userEditorProps.setShowLanguageDropdown}
                          onSave={userEditorProps.onSave}
                          isSaving={userEditorProps.isSaving}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* KYC Verification — desktop panel + mobile full-screen sheet */}
              {selectedCategory === 'KYC Verification' && (
                <>
                  <div className="settings-details-panel settings-kyc-panel">
                    <SettingsKycEditorBody idSuffix="" {...kycEditorProps} />
                  </div>

                  <div
                    className="settings-user-mobile-sheet settings-kyc-mobile-sheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="settings-kyc-sheet-title"
                  >
                    <div className="settings-user-mobile-sheet-inner">
                      <header className="settings-user-mobile-sheet-header">
                        <span className="settings-user-mobile-sheet-accent" aria-hidden />
                        <h2 id="settings-kyc-sheet-title" className="settings-user-mobile-sheet-title">
                          KYC Verification
                        </h2>
                        <button
                          type="button"
                          className="settings-user-mobile-sheet-close"
                          aria-label="Close"
                          onClick={() => setSelectedCategory('')}
                        >
                          <X size={22} />
                        </button>
                      </header>
                      <div className="settings-user-mobile-sheet-card settings-kyc-mobile-sheet-card">
                        <SettingsKycEditorBody idSuffix="-m" {...kycEditorProps} />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>

      {showNotificationModal && (
        <div
          className="settings-notification-backdrop"
          role="presentation"
          onClick={() => setShowNotificationModal(false)}
        >
          <div
            className="settings-notification-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-notifications-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-notification-sheet-head">
              <h2 id="settings-notifications-title">Notifications</h2>
              <button
                type="button"
                className="settings-notification-close"
                aria-label="Close"
                onClick={() => setShowNotificationModal(false)}
              >
                <X size={22} />
              </button>
            </div>
            <p className="settings-notification-empty">You&apos;re all caught up.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

