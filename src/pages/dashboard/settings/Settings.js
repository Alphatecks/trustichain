import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Repeat,
  Briefcase,
  Settings as SettingsIcon,
  HelpCircle,
  Search,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Pencil,
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
import LoadingIndicator from '../../../components/LoadingIndicator';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: 'Beta' }
];

const supportNav = [
  { label: 'Settings', icon: SettingsIcon },
  { label: 'Security', icon: ShieldCheck }
];

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Personal');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(false);
  const [formattedToday, setFormattedToday] = useState('');
  const [kycComplete] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('User');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  // User profile form state
  const [firstName, setFirstName] = useState('Shivani');
  const [lastName, setLastName] = useState('Chauhan');
  const [email, setEmail] = useState('helloshivani24@gmail.com');
  const [language, setLanguage] = useState('English');
  const [profileImage, setProfileImage] = useState(null);
  
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

  const handleNavClick = (item) => {
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
    if (item.label === 'Settings') {
      navigate('/settings');
    } else if (item.label === 'Security') {
      navigate('/security');
    }
  };

  const handleSave = () => {
    console.log('Save settings:', {
      firstName,
      lastName,
      email,
      language
    });
    // Placeholder - no actual API call
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
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

  return (
    <div className="dashboard settings-dashboard">
      {/* Sidebar */}
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
              <button type="button" className="sidebar-logout">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main">
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
                {kycComplete ? (
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
                  className={`settings-category-btn ${selectedCategory === 'Business Suite' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('Business Suite')}
                >
                  <Briefcase size={18} />
                  Business Suite
                </button>
                <button
                  type="button"
                  className={`settings-category-btn ${selectedCategory === 'KYC Verification' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('KYC Verification')}
                >
                  <ShieldCheck size={18} />
                  KYC Verification
                </button>
              </div>

              {/* Right Panel - User Profile Details */}
              {selectedCategory === 'User' && (
                <div className="settings-details-panel">
                  {/* Profile Image Section */}
                  <div className="settings-profile-image-section">
                    <div className="settings-profile-image-wrapper">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="settings-profile-image" />
                      ) : (
                        <div className="settings-profile-image-placeholder">
                          {userInitials}
                        </div>
                      )}
                      <label className="settings-profile-edit-btn">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        <Pencil size={14} />
                      </label>
                    </div>
                    <h3 className="settings-upload-text">Upload your Image</h3>
                  </div>

                  {/* User Information Fields */}
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

                    {/* Save Button */}
                    <div className="settings-form-actions">
                      <button
                        type="button"
                        className="settings-save-btn"
                        onClick={handleSave}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* KYC Verification Section */}
              {selectedCategory === 'KYC Verification' && (
                <div className="settings-details-panel">
                  {/* Selfie Section */}
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
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSelfieImage(reader.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
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

                  {/* Proof of Identity Section */}
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

                  {/* Document Upload Section */}
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
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFrontNidImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="front-nid-upload"
                          />
                          <label htmlFor="front-nid-upload" className="settings-kyc-document-upload-label"></label>
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
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setBackNidImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="back-nid-upload"
                          />
                          <label htmlFor="back-nid-upload" className="settings-kyc-document-upload-label"></label>
                        </div>
                      </div>
                      <div className="settings-kyc-document-item">
                        <label className="settings-kyc-document-label">selfie</label>
                        <div className="settings-kyc-document-upload">
                          {selfieDocImage ? (
                            <img src={selfieDocImage} alt="Selfie" className="settings-kyc-document-image" />
                          ) : (
                            <div className="settings-kyc-document-placeholder">
                              <Upload size={24} />
                              <span>Upload</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setSelfieDocImage(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="selfie-doc-upload"
                          />
                          <label htmlFor="selfie-doc-upload" className="settings-kyc-document-upload-label"></label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Settings Section */}
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
                </div>
              )}
            </div>
          </main>
    </div>
  );
};

export default Settings;

