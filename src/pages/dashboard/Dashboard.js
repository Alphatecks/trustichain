import React, { useMemo, useState } from 'react';
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
import uploadIllustration from '../../assets/images/illustrations/upload.png';
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
  { label: 'Proof of identity', detail: 'Proof of identity' },
  { label: 'Document upload', detail: 'Document upload' },
  { label: 'Connect Wallet', detail: 'Connect Wallet' }
];

const Dashboard = () => {
  const [currentStep, setCurrentStep] = useState(0);
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

  const activeIllustration = useMemo(() => {
    if (currentStep === 1) return uploadIllustration;
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
    advanceStep();
  };

  const stepStatus = (index) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'upcoming';
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
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

