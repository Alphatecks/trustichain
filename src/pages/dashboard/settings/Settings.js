import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Sun,
  Moon,
  Copy,
  DollarSign,
  Building2,
  Code,
  Box,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import '../dashboard/Dashboard.css';
import './Settings.css';
import logo from '../../../assets/images/icons/logo.png';
import { useSession } from '../../../context/SessionContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../../../context/TrustiscoreContext';
import { useSidebarNavBadges } from '../../../hooks/useSidebarNavBadges';
import { handleLogout } from '../../../utils/logout';
import LoadingIndicator from '../../../components/LoadingIndicator';
import HeaderProfileVerifyBadge from '../../../components/HeaderProfileVerifyBadge';
import HeaderProfileAvatarNav from '../../../components/HeaderProfileAvatarNav';
import PersonalSuiteMobileHeader from '../../../components/PersonalSuiteMobileHeader';
import GoogleAuthenticatorModal from '../../../components/GoogleAuthenticatorModal';
import NotificationCenterModal from '../../../components/NotificationCenterModal/NotificationCenterModal';
import { getApiUrl, API_BASE_URL } from '../../../utils/config';
import { getProfileAvatarUrl } from '../../../utils/profileAvatar';
import {
  extractTrustitagFromLoginResponse,
  persistTrustitagFromProfileResponse,
} from '../../../utils/trustitag';
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
  { label: 'My Escrow', icon: ShieldCheck, badge: null },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: null },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'Compliance', icon: FileCheck, badge: 'Beta' },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

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
  { label: 'Web hook', icon: LinkIcon, badge: null },
];

const supportNav = [{ label: 'Settings', icon: SettingsIcon }];

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

const SettingsBusinessProfileImage = ({ profileImage, businessInitials }) => (
  <div className="settings-profile-image-section">
    <div className="settings-profile-image-wrapper">
      {profileImage ? (
        <img src={profileImage} alt="Business profile" className="settings-profile-image" />
      ) : (
        <div className="settings-profile-image-placeholder">{businessInitials}</div>
      )}
    </div>
    <h3 className="settings-upload-text">Business Profile Picture</h3>
  </div>
);

const readFileAsDataUrl = (file, onResult) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => onResult(reader.result);
  reader.readAsDataURL(file);
};

/* KYC Verification (personal + business settings) — temporarily disabled
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
*/

const SettingsUserAccountForm = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  trustitag,
  isLoadingProfile,
  onCopyTrustitag,
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

    <div className="settings-form-field settings-form-field--trustitag">
      <label className="settings-form-label" htmlFor="settings-user-trustitag">
        Trustitag
      </label>
      <div className="settings-trustitag-row">
        <input
          id="settings-user-trustitag"
          type="text"
          readOnly
          className="settings-form-input settings-form-input--readonly settings-trustitag-input"
          value={
            isLoadingProfile ? '' : trustitag || ''
          }
          placeholder={isLoadingProfile ? 'Loading…' : 'Not assigned'}
        />
        {!isLoadingProfile && trustitag ? (
          <button
            type="button"
            className="settings-trustitag-copy"
            onClick={onCopyTrustitag}
            aria-label="Copy Trustitag"
          >
            <Copy size={18} />
          </button>
        ) : null}
      </div>
      <p className="settings-trustitag-hint">Share this so others can send to you without a long wallet address.</p>
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

const SettingsBusinessAccountForm = ({
  isLoadingProfile,
  businessName,
  businessEmailAddress,
  loggedInIp,
}) => (
  <div className="settings-form">
    <div className="settings-form-field">
      <label className="settings-form-label">Business Name</label>
      <input
        type="text"
        readOnly
        className="settings-form-input settings-form-input--readonly"
        value={isLoadingProfile ? '' : businessName}
        placeholder={isLoadingProfile ? 'Loading…' : 'Not available'}
      />
    </div>

    <div className="settings-form-field">
      <label className="settings-form-label">Business Email Address</label>
      <input
        type="text"
        readOnly
        className="settings-form-input settings-form-input--readonly"
        value={isLoadingProfile ? '' : businessEmailAddress}
        placeholder={isLoadingProfile ? 'Loading…' : 'Not available'}
      />
    </div>

    <div className="settings-form-field">
      <label className="settings-form-label">Logged-in IP</label>
      <input
        type="text"
        readOnly
        className="settings-form-input settings-form-input--readonly"
        value={isLoadingProfile ? '' : loggedInIp}
        placeholder={isLoadingProfile ? 'Loading…' : 'Not available'}
      />
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const { theme: dashboardTheme, setTheme: setDashboardTheme } = useTheme();
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading, openTrustiscoreModal } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);
  const getNavBadge = useSidebarNavBadges();
  const [accountType, setAccountType] = useState(() => {
    const stored = localStorage.getItem('dashboard_account_type');
    if (stored === 'Business Suite' || stored === 'Personal') return stored;
    return 'Personal';
  });
  const profileCategoryLabel = accountType === 'Business Suite' ? 'Business' : 'User';
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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  /** null | 'enroll' | 'disable' — Google Authenticator setup / disable modal */
  const [mfaModal, setMfaModal] = useState(null);
  /** Local preview (data URL) for a file chosen but not yet uploaded via Save */
  const [localPhotoPreview, setLocalPhotoPreview] = useState(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const [isSavingUserProfile, setIsSavingUserProfile] = useState(false);
  const profilePhotoInputRef = useRef(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userTrustitag, setUserTrustitag] = useState('');
  const [language, setLanguage] = useState('English');
  const [businessProfilePicture, setBusinessProfilePicture] = useState('');
  const [businessProfileName, setBusinessProfileName] = useState('');
  const [businessProfileEmailAddress, setBusinessProfileEmailAddress] = useState('');
  const [businessProfileLoggedInIp, setBusinessProfileLoggedInIp] = useState('');
  const [isLoadingBusinessProfileDetails, setIsLoadingBusinessProfileDetails] = useState(false);

  // KYC Verification state — commented out with KYC settings UI
  // const [selfieImage, setSelfieImage] = useState(null);
  // const [fullName, setFullName] = useState('TechFlow Solutions');
  // const [nidPassportNumber, setNidPassportNumber] = useState('TechFlow Solutions');
  // const [nationality, setNationality] = useState('Active');
  // const [dob, setDob] = useState('Active');
  // const [frontNidImage, setFrontNidImage] = useState(null);
  // const [backNidImage, setBackNidImage] = useState(null);
  // const [selfieDocImage, setSelfieDocImage] = useState(null);
  // const [xrpWalletAddress, setXrpWalletAddress] = useState('Trustichain Mediation');
  // const [xumm, setXumm] = useState('Trustichain Mediation');
  // const [metamask, setMetamask] = useState('$10000');

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const copyUserTrustitag = useCallback(async () => {
    if (!userTrustitag) return;
    try {
      await navigator.clipboard.writeText(userTrustitag);
      toast.success('Trustitag copied');
    } catch {
      toast.error('Could not copy Trustitag');
    }
  }, [userTrustitag]);

  const handleMainNavClick = (item) => {
    closeMobileMenu();
    if (accountType === 'Business Suite') {
      if (!businessKycComplete) return;
      const routeByLabel = {
        Dashboard: '/dashboard',
        Payroll: '/payroll',
        'Supplier Contract': '/supplier-contract',
        Invoice: '/invoice',
        Transactions: '/transactions',
        Dispute: '/business-dispute',
      };
      if (item.label === 'Compliance') {
        toast('Compliance workspace coming soon');
        return;
      }
      const targetPath = routeByLabel[item.label];
      if (!targetPath) return;
      navigate(
        targetPath,
        item.label === 'Dashboard' || item.label === 'Transactions'
          ? { state: { accountType: 'Business Suite' } }
          : undefined
      );
      return;
    }
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

  const handleDeveloperNavClick = (item) => {
    closeMobileMenu();
    if (!businessKycComplete) return;
    const developerPath =
      item.label === 'Api Keys'
        ? '/api-keys'
        : item.label === 'Sand box enviroment'
          ? '/sandbox-environment'
          : item.label === 'Web hook'
            ? '/webhook'
            : null;
    if (developerPath) navigate(developerPath);
  };

  const handleSupportNavClick = (item) => {
    closeMobileMenu();
    if (item.label === 'Settings') {
      navigate(
        '/settings',
        accountType === 'Business Suite' ? { state: { accountType: 'Business Suite' } } : undefined
      );
    }
  };

  const handleTwoFactorToggle = (nextEnabled) => {
    if (isSessionExpired) {
      toast.error('Please sign in to update Google Authenticator.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to update Google Authenticator.');
      return;
    }
    if (nextEnabled && !twoFactorEnabled) {
      setMfaModal('enroll');
      return;
    }
    if (!nextEnabled && twoFactorEnabled) {
      setMfaModal('disable');
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
            persistTrustitagFromProfileResponse(profileJson);
            setUserTrustitag(extractTrustitagFromLoginResponse(profileJson) || '');
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

  /** GET /api/user/profile — includes `mfaEnabled` for Google Authenticator / TOTP status */
  const fetchUserProfile = useCallback(async () => {
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
      setUserTrustitag('');
      setTwoFactorEnabled(false);
      setIsLoadingUserProfile(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFirstName('');
        setLastName('');
        setEmail('');
        setUserTrustitag('');
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

      const result = await response.json().catch(() => ({}));
      console.log('[Settings] GET /api/user/profile response:', {
        status: response.status,
        ok: response.ok,
        body: result,
      });

      if (response.ok) {
        if (result?.success && result?.data) {
          persistTrustitagFromProfileResponse(result);
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

          const tfaRaw =
            data.mfaEnabled ??
            data.twoFactorEnabled ??
            data.two_factor_enabled ??
            data.is2faEnabled ??
            data.googleAuthenticatorEnabled ??
            data.google_authenticator_enabled ??
            data.settings?.twoFactorEnabled ??
            data.security?.twoFactorEnabled;
          if (tfaRaw !== undefined && tfaRaw !== null) {
            setTwoFactorEnabled(Boolean(tfaRaw));
          }

          const tagRaw = data.trustitag ?? data.trustiTag ?? data.trust_itag;
          setUserTrustitag(
            typeof tagRaw === 'string' && tagRaw.trim() ? tagRaw.trim() : ''
          );
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoadingUserProfile(false);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const fetchBusinessProfileDetails = useCallback(async () => {
    if (accountType !== 'Business Suite') return;
    if (isSessionExpired) {
      setBusinessProfilePicture('');
      setBusinessProfileName('');
      setBusinessProfileEmailAddress('');
      setBusinessProfileLoggedInIp('');
      setIsLoadingBusinessProfileDetails(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setBusinessProfilePicture('');
      setBusinessProfileName('');
      setBusinessProfileEmailAddress('');
      setBusinessProfileLoggedInIp('');
      setIsLoadingBusinessProfileDetails(false);
      return;
    }

    setIsLoadingBusinessProfileDetails(true);
    try {
      const response = await fetch(getApiUrl('api/business-suite/profile/details'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success && result?.data) {
        const data = result.data;
        setBusinessProfilePicture(String(data.businessProfilePicture || '').trim());
        setBusinessProfileName(String(data.businessName || '').trim());
        setBusinessProfileEmailAddress(String(data.businessEmailAddress || '').trim());
        setBusinessProfileLoggedInIp(String(data.loggedInIp || '').trim());
      } else {
        setBusinessProfilePicture('');
        setBusinessProfileName('');
        setBusinessProfileEmailAddress('');
        setBusinessProfileLoggedInIp('');
      }
    } catch (error) {
      console.error('Error fetching business profile details:', error);
      setBusinessProfilePicture('');
      setBusinessProfileName('');
      setBusinessProfileEmailAddress('');
      setBusinessProfileLoggedInIp('');
    } finally {
      setIsLoadingBusinessProfileDetails(false);
    }
  }, [accountType, isSessionExpired]);

  useEffect(() => {
    fetchBusinessProfileDetails();
  }, [fetchBusinessProfileDetails]);

  useEffect(() => {
    const sheetOpen = selectedCategory === 'User';
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
    trustitag: userTrustitag,
    isLoadingProfile: isLoadingUserProfile,
    onCopyTrustitag: copyUserTrustitag,
    language,
    setLanguage,
    showLanguageDropdown,
    setShowLanguageDropdown,
    onSave: handleSave,
    isSaving: isSavingUserProfile,
  };

  const businessEditorProps = {
    profileImage: businessProfilePicture || businessCompanyLogoUrl || '',
    businessInitials: (() => {
      const source = (businessProfileName || businessCompanyName || '').trim();
      if (!source) return 'B';
      const parts = source.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return source.slice(0, 1).toUpperCase();
    })(),
    isLoadingProfile: isLoadingBusinessProfileDetails,
    businessName: businessProfileName,
    businessEmailAddress: businessProfileEmailAddress,
    loggedInIp: businessProfileLoggedInIp,
  };

  // const kycEditorProps = { ... }; // see commented SettingsKycEditorBody + KYC state

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
              <p className="sidebar-section-label">{accountType === 'Business Suite' ? 'Business Suite' : 'General'}</p>
              <nav className="sidebar-nav">
                {(accountType === 'Business Suite' ? businessSuiteNav : sidebarNav).map((item) => {
                  const Icon = item.icon;
                  const isDisabled = accountType === 'Business Suite' && !businessKycComplete;

                  const routeByLabel =
                    accountType === 'Business Suite'
                      ? {
                          Dashboard: '/dashboard',
                          Payroll: '/payroll',
                          'Supplier Contract': '/supplier-contract',
                          Invoice: '/invoice',
                          Transactions: '/transactions',
                          Dispute: '/business-dispute',
                        }
                      : {
                          Dashboard: '/dashboard',
                          'My Escrow': '/my-escrow',
                          Transactions: '/transactions',
                          Dispute: '/dispute',
                          Trusticard: '/trusticard',
                        };

                  const targetPath = routeByLabel[item.label];

                  const isActive = (() => {
                    if (!targetPath) return false;
                    if (targetPath === '/business-dispute') {
                      return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
                    }
                    if (targetPath === '/payroll') {
                      return location.pathname === '/payroll' || location.pathname.startsWith('/payroll/');
                    }
                    if (targetPath === '/dispute') {
                      return location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
                    }
                    return location.pathname === targetPath;
                  })();

                  const navBadge = getNavBadge(item);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => handleMainNavClick(item)}
                      disabled={isDisabled}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                      {navBadge != null && navBadge !== '' ? (
                        <span className="sidebar-badge">{navBadge}</span>
                      ) : null}
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
                    const isDisabled = !businessKycComplete;
                    const developerPath =
                      item.label === 'Api Keys'
                        ? '/api-keys'
                        : item.label === 'Sand box enviroment'
                          ? '/sandbox-environment'
                          : item.label === 'Web hook'
                            ? '/webhook'
                            : null;
                    const isActive = developerPath && location.pathname === developerPath;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                        disabled={isDisabled}
                        onClick={() => handleDeveloperNavClick(item)}
                      >
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
                  const isDisabled = accountType === 'Business Suite' && !businessKycComplete;
                  const isActive = item.label === 'Settings' && location.pathname === '/settings';
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => handleSupportNavClick(item)}
                      disabled={isDisabled}
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
                <span className="sidebar-trustiscore-badge">{trustiscoreBadgeText}</span>
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
            <PersonalSuiteMobileHeader
              variant={accountType === 'Business Suite' ? 'business' : 'personal'}
              className="settings-mobile-dashboard-header"
              userAvatar={userAvatar}
              userInitials={userInitials}
              userFullName={userFullName}
              personalVerificationComplete={accountType === 'Personal' && isKycCompleteForAccount}
              businessVerificationComplete={businessKycComplete}
              businessLogoUrl={businessCompanyLogoUrl}
              businessName={businessCompanyName}
              businessAvatarLoading={isLoadingBusinessKyc}
              onOpenNotifications={() => setShowNotificationModal(true)}
              onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
            />
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

              <div
                className="header-actions"
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end', justifySelf: 'end' }}
              >
                {isKycCompleteForAccount ? (
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
                      <img src={userAvatar} alt={userFullName || 'User'} className="user-avatar-img" />
                    ) : (
                      userInitials
                    )}
                    <HeaderProfileVerifyBadge show={isKycCompleteForAccount} />
                  </HeaderProfileAvatarNav>
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
                  aria-label={profileCategoryLabel}
                >
                  <User size={18} />
                  {profileCategoryLabel}
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
                <div className="settings-category-item settings-category-item--2fa">
                  <div className="settings-category-label settings-category-label--stacked">
                    <div className="settings-category-label-row">
                      <KeyRound size={18} aria-hidden />
                      <span>Google Authenticator</span>
                    </div>
                    <p className="settings-category-sublabel">
                      Time-based one-time codes (TOTP) from the Google Authenticator app when you sign in.
                    </p>
                  </div>
                  <label className="settings-toggle">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      disabled={isLoadingUserProfile || mfaModal != null}
                      onChange={(e) => handleTwoFactorToggle(e.target.checked)}
                      aria-label="Enable Google Authenticator for two-factor sign-in"
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="settings-category-item settings-category-item--theme">
                  <div className="settings-category-label settings-category-label--stacked">
                    <div className="settings-category-label-row">
                      {dashboardTheme === 'dark' ? (
                        <Moon size={18} aria-hidden />
                      ) : (
                        <Sun size={18} aria-hidden />
                      )}
                      <span>Theme</span>
                    </div>
                    <p className="settings-category-sublabel">
                      Light or dark appearance for the dashboard. Saved on this device.
                    </p>
                  </div>
                  <div
                    className="settings-theme-segment"
                    role="group"
                    aria-label="Dashboard theme"
                  >
                    <button
                      type="button"
                      className={`settings-theme-segment-btn${dashboardTheme === 'light' ? ' is-active' : ''}`}
                      onClick={() => setDashboardTheme('light')}
                      aria-pressed={dashboardTheme === 'light'}
                    >
                      <Sun size={16} aria-hidden />
                      Light
                    </button>
                    <button
                      type="button"
                      className={`settings-theme-segment-btn${dashboardTheme === 'dark' ? ' is-active' : ''}`}
                      onClick={() => setDashboardTheme('dark')}
                      aria-pressed={dashboardTheme === 'dark'}
                    >
                      <Moon size={16} aria-hidden />
                      Dark
                    </button>
                  </div>
                </div>
                {/* KYC Verification — disabled (personal + business suite)
                <button
                  type="button"
                  className={`settings-category-btn ${selectedCategory === 'KYC Verification' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('KYC Verification')}
                >
                  <ShieldCheck size={18} />
                  KYC Verification
                </button>
                */}
              </div>

              {/* Right Panel - User Profile Details (desktop) + full-screen sheet (mobile only via CSS) */}
              {selectedCategory === 'User' && (
                <>
                  <div className="settings-details-panel settings-user-panel">
                    {accountType === 'Business Suite' ? (
                      <SettingsBusinessProfileImage
                        profileImage={businessEditorProps.profileImage}
                        businessInitials={businessEditorProps.businessInitials}
                      />
                    ) : (
                      <SettingsUserProfileImage
                        profileImage={userEditorProps.profileImage}
                        userInitials={userEditorProps.userInitials}
                        onImageChange={userEditorProps.onImageChange}
                        fileInputRef={userEditorProps.fileInputRef}
                      />
                    )}
                    <div className="settings-user-form-desktop">
                      {accountType === 'Business Suite' ? (
                        <SettingsBusinessAccountForm
                          isLoadingProfile={businessEditorProps.isLoadingProfile}
                          businessName={businessEditorProps.businessName}
                          businessEmailAddress={businessEditorProps.businessEmailAddress}
                          loggedInIp={businessEditorProps.loggedInIp}
                        />
                      ) : (
                        <SettingsUserAccountForm
                          firstName={userEditorProps.firstName}
                          setFirstName={userEditorProps.setFirstName}
                          lastName={userEditorProps.lastName}
                          setLastName={userEditorProps.setLastName}
                          email={userEditorProps.email}
                          setEmail={userEditorProps.setEmail}
                          trustitag={userEditorProps.trustitag}
                          isLoadingProfile={userEditorProps.isLoadingProfile}
                          onCopyTrustitag={userEditorProps.onCopyTrustitag}
                          language={userEditorProps.language}
                          setLanguage={userEditorProps.setLanguage}
                          showLanguageDropdown={userEditorProps.showLanguageDropdown}
                          setShowLanguageDropdown={userEditorProps.setShowLanguageDropdown}
                          onSave={userEditorProps.onSave}
                          isSaving={userEditorProps.isSaving}
                        />
                      )}
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
                          {profileCategoryLabel}
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
                        {accountType === 'Business Suite' ? (
                          <>
                            <SettingsBusinessProfileImage
                              profileImage={businessEditorProps.profileImage}
                              businessInitials={businessEditorProps.businessInitials}
                            />
                            <SettingsBusinessAccountForm
                              isLoadingProfile={businessEditorProps.isLoadingProfile}
                              businessName={businessEditorProps.businessName}
                              businessEmailAddress={businessEditorProps.businessEmailAddress}
                              loggedInIp={businessEditorProps.loggedInIp}
                            />
                          </>
                        ) : (
                          <>
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
                              trustitag={userEditorProps.trustitag}
                              isLoadingProfile={userEditorProps.isLoadingProfile}
                              onCopyTrustitag={userEditorProps.onCopyTrustitag}
                              language={userEditorProps.language}
                              setLanguage={userEditorProps.setLanguage}
                              showLanguageDropdown={userEditorProps.showLanguageDropdown}
                              setShowLanguageDropdown={userEditorProps.setShowLanguageDropdown}
                              onSave={userEditorProps.onSave}
                              isSaving={userEditorProps.isSaving}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* KYC Verification panel — disabled (personal + business suite)
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
              */}
            </div>
          </main>

      <NotificationCenterModal
        open={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        titleId="settings-notifications-title"
      />

      <GoogleAuthenticatorModal
        isOpen={mfaModal != null}
        mode={mfaModal === 'disable' ? 'disable' : 'enroll'}
        token={typeof window !== 'undefined' ? localStorage.getItem('token') : ''}
        onClose={() => setMfaModal(null)}
        onSuccess={() => {
          void fetchUserProfile();
        }}
      />
    </div>
  );
};

export default Settings;

