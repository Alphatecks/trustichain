import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  LogOut,
  ArrowRight,
  ArrowLeft,
  FileText,
  Briefcase as BriefcaseIcon,
  Image as ImageIcon,
  Clock,
  MessageSquare,
  Mail,
  Plus,
  Send,
  CheckCircle2,
  Info,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
  Menu
} from 'lucide-react';
import './Dashboard.css';
import './DisputeDetail.css';
import logo from '../../assets/images/icons/logo.png';
import verifyBadge from '../../assets/images/icons/verify.png';
import cloudDownloadIcon from '../../assets/images/icons/cloud-download.png';
import { useSession } from '../../context/SessionContext';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../../components/LoadingIndicator';

const sidebarNav = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false, badge: null },
  { label: 'My Escrow', icon: ShieldCheck, badge: 23 },
  { label: 'Transactions', icon: Repeat, badge: null },
  { label: 'Dispute', icon: CreditCard, badge: 23 },
  { label: 'Trusticard', icon: Briefcase, badge: null },
  { label: 'P2P trading', icon: Repeat, badge: null }
];

const supportNav = [
  { label: 'Settings', icon: Settings },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Help', icon: HelpCircle }
];

const DisputeDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { isSessionExpired } = useSession();
  const [accountType, setAccountType] = useState('Personal');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [userFullName, setUserFullName] = useState('Sarah Chen');
  const [userInitials, setUserInitials] = useState('SC');
  const [userAvatar, setUserAvatar] = useState(null);
  const [userRole, setUserRole] = useState('Personal Account');
  const [isLoadingUserProfile, setIsLoadingUserProfile] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mediatorEnabled, setMediatorEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);

  const formattedToday = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
    const day = now.getDate();
    const month = now.toLocaleDateString(undefined, { month: 'long' });
    return `${weekday}, ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} ${month}`;
  }, []);

  const evidenceItems = [
    { icon: FileText, title: 'Original Agreement', description: 'Detailed requirements and specifications', type: 'PDF • 245 KB', verified: true },
    { icon: BriefcaseIcon, title: 'Final Deliverable', description: 'Completed deliverable as delivered', type: 'PDF • 245 KB', verified: true },
    { icon: ImageIcon, title: 'Reference Images', description: 'Visual examples of desired style', type: '3 images • 245 KB', verified: true },
    { icon: Clock, title: 'Work Progress Timeline', description: 'Visual examples of desired style', type: 'PDF • 245 KB', verified: true },
    { icon: MessageSquare, title: 'Chat Screenshots', description: 'Initial communication screenshots', type: '4 images • 245 KB', verified: true },
    { icon: Mail, title: 'Email Communications', description: 'Email thread showing project discussions', type: 'PNG • 245 KB', verified: true }
  ];

  const timelineEvents = [
    { label: 'Mediation Session Started', date: '8 Sept 2025 — 5:42 PM' },
    { label: 'Initial Evidence Submitted', date: '8 Sept 2025 — 5:42 PM' },
    { label: 'Resumed Module 3 — Lesson 3.1', date: '8 Sept 2025 — 5:42 PM' },
    { label: 'Mediator Assigned', date: '8 Sept 2025 — 5:42 PM' },
    { label: 'Dispute Filed', date: '8 Sept 2025 — 5:42 PM' }
  ];

  const chatMessages = [
    { sender: 'Seller', text: 'Emma, could you please share those screenshots in the evidence section? Mike, do you have the original brief you sent? Let\'s compare both versions to understand where the miscommunication occurred.' },
    { sender: 'Mediator', text: 'Thank you, Jane. The artwork I received doesn\'t match the style and color scheme we agreed upon. I specifically requested a minimalist design with blue tones, but what I received is very complex with warm colors' }
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (isSessionExpired) {
          setIsLoadingUserProfile(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoadingUserProfile(false);
          return;
        }

        const response = await fetch(`${getApiUrl()}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUserFullName(data.user.fullName || 'Sarah Chen');
            const names = (data.user.fullName || 'Sarah Chen').split(' ');
            setUserInitials((names[0]?.[0] || '') + (names[1]?.[0] || ''));
            setUserAvatar(data.user.avatar || null);
            setUserRole(data.user.role || 'Personal Account');
          }
        }
        setIsLoadingUserProfile(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setIsLoadingUserProfile(false);
      }
    };

    fetchUserProfile();
  }, [isSessionExpired]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-dashboard-header transactions-mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-user-avatar">
            {userAvatar ? (
              <img src={userAvatar} alt={userFullName} />
            ) : (
              userInitials
            )}
          </div>
          <div className="mobile-user-info">
            <span className="mobile-user-name">
              {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userFullName}
              <img src={verifyBadge} alt="Verified" className="mobile-user-verified-icon" />
            </span>
            <span className="mobile-user-role">
              {isLoadingUserProfile ? <LoadingIndicator size="sm" /> : userRole}
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

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div className={`mobile-sidebar-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-header">
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
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-section">
            <p className="mobile-sidebar-section-label">
              {accountType === 'Business Suite' ? 'Business Suite' : 'General'}
            </p>
            <nav className="mobile-sidebar-nav">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isActive = (item.label === 'Dashboard' && location.pathname === '/dashboard') ||
                                 (item.label === 'My Escrow' && location.pathname === '/my-escrow') ||
                                 (item.label === 'Transactions' && location.pathname === '/transactions') ||
                                 (item.label === 'Dispute' && location.pathname === '/dispute') ||
                                 (item.label === 'Trusticard' && location.pathname === '/trusticard');
                const handleNavClick = () => {
                  setIsMobileMenuOpen(false);
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
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`mobile-sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={handleNavClick}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.badge && <span className="mobile-sidebar-badge">{item.badge}</span>}
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
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mobile-sidebar-bottom">
            <div className="mobile-sidebar-help-card">
              <div className="mobile-sidebar-help-icon">
                <HelpCircle size={24} />
              </div>
              <h3>Help Center</h3>
              <p>Having trouble in Trustichain? Please contact us</p>
              <button type="button" className="mobile-sidebar-help-cta">
                Contact us
              </button>
            </div>

            <div className="mobile-sidebar-trustiscore">
              <span className="mobile-sidebar-trustiscore-label">Trustiscore</span>
              <span className="mobile-sidebar-trustiscore-badge">850</span>
            </div>

            <button 
              type="button" 
              className="mobile-sidebar-logout"
              onClick={() => {
                setIsMobileMenuOpen(false);
                localStorage.removeItem('token');
                navigate('/');
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

    <div className="dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-branding">
          <img src={logo} alt="TrustiChain" className="sidebar-logo" />
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">TrustiChain</span>
            <span className="sidebar-brand-tagline">Escrow Platform</span>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Main Menu</p>
          <nav className="sidebar-nav">
            {sidebarNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.label === 'Dispute' && location.pathname.startsWith('/dispute') ||
                               (item.label === 'Trusticard' && location.pathname === '/trusticard');
              const handleNavClick = () => {
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
              <div className="user-avatar">{userInitials}</div>
            </div>
          </div>
        </header>

        <div className="dispute-detail-content">
          {/* Breadcrumb */}
          <div className="card-breadcrumb">
            <span className="breadcrumb-root">General</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-link" onClick={() => navigate('/dispute')}>Dispute</span>
            <span className="breadcrumb-divider">›</span>
            <span className="breadcrumb-current">#{id || 'DSP-2024-002'}</span>
          </div>

          {/* Party Overview Cards */}
          <div className="dispute-overview-cards">
            {/* Party 1 - Buyer */}
            <div className="dispute-party-card buyer-card">
              <div className="buyer-card-top">
                <div className="party-avatar">SC</div>
                <div className="party-info">
                  <div className="party-header-row">
                    <div className="party-name-section">
                      <h3 className="party-name">Sarah Chen</h3>
                      <p className="party-role">Buyer ( me )</p>
                    </div>
                    <span className="party-badge">Party 1</span>
                  </div>
                </div>
              </div>
              <div className="buyer-card-claims">
                <h4 className="party-claims-heading">Claims</h4>
                <p className="party-claims-text">Artwork doesn't match specifications</p>
              </div>
            </div>

            {/* Party 2 - Seller */}
            <div className="dispute-party-card seller-card">
              <div className="seller-card-top">
                <div className="party-avatar-wrapper">
                  <div className="party-avatar">SC</div>
                </div>
                <div className="party-info">
                  <div className="party-header-row">
                    <div className="party-name-section">
                      <div className="party-name-with-check">
                        <h3 className="party-name">Sarah Chen</h3>
                        <CheckCircle2 size={16} className="party-check-icon" />
                      </div>
                      <p className="party-role">Seller</p>
                    </div>
                    <span className="party-badge">Party 2</span>
                  </div>
                </div>
              </div>
              <div className="seller-card-claims">
                <h4 className="party-claims-heading">Claims</h4>
                <p className="party-claims-text">Artwork doesn't match specifications</p>
              </div>
            </div>

            {/* Details Card */}
            <div className="dispute-details-card">
              <div className="details-content-row">
                {/* Details Section */}
                <div className="details-section">
                  <div className="details-header">
                    <div className="details-indicator"></div>
                    <h4 className="details-title">Details</h4>
                  </div>
                  <div className="details-content">
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className="detail-value status-in-progress">In progress</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Case ID</span>
                      <span className="detail-value">#{id || 'DSP-2024-002'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount</span>
                      <span className="detail-value">$6,000</span>
                    </div>
                  </div>
                </div>

                {/* Mediator Section */}
                <div className="mediator-section">
                  <div className="mediator-header-section">
                    <div className="mediator-indicator"></div>
                    <h4 className="mediator-title">Mediator</h4>
                  </div>
                  <div className="mediator-content">
                    <div className="mediator-toggle-row">
                      <span className="mediator-toggle-label">Mediator</span>
                      <button 
                        type="button" 
                        className="mediator-toggle"
                        onClick={() => setMediatorEnabled(!mediatorEnabled)}
                      >
                        {mediatorEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                    {mediatorEnabled && (
                      <>
                        <h5 className="mediator-details-heading">Mediator Details</h5>
                        <div className="mediator-info-row">
                          <span className="mediator-info-label">Name</span>
                          <span className="mediator-info-value">Jane Doe</span>
                        </div>
                        <div className="mediator-info-row">
                          <span className="mediator-info-label">Status</span>
                          <span className="mediator-info-value">
                            <span className="status-dot active"></span>
                            Active
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="dispute-main-content">
            {/* Left Column */}
            <div className="dispute-left-column">
              {/* Evidence Section */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Evidence and documentation</h2>
                  <button 
                    type="button" 
                    className="add-evidence-btn"
                    onClick={() => setShowAddEvidenceModal(true)}
                  >
                    <Plus size={16} />
                    Add New Evidence
                  </button>
                </div>
                <div className="evidence-grid">
                  {evidenceItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="evidence-card">
                        <div className="evidence-icon">
                          <Icon size={20} />
                        </div>
                        <div className="evidence-content">
                          <h4 className="evidence-title">{item.title}</h4>
                          <p className="evidence-description">{item.description}</p>
                          <div className="evidence-footer">
                            <span className="evidence-type">{item.type}</span>
                            {item.verified && (
                              <span className="evidence-verified">
                                <CheckCircle2 size={14} />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="evidence-cloud-icon">
                          <img src={cloudDownloadIcon} alt="Download" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="evidence-info-message">
                  <Info size={16} />
                  <p>All submitted evidence has been verified and is currently under review by the assigned mediator. Additional documentation may be requested if needed.</p>
                </div>
              </div>

              {/* Preliminary Assessment */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Preliminary Assessment</h2>
                </div>
                <h3 className="assessment-subtitle">Key Findings</h3>
                <ul className="assessment-list">
                  <li>Initial project brief contains conflicting style requirements</li>
                  <li>Communication gaps identified in early project phases</li>
                  <li>Delivered work shows professional quality and effort</li>
                  <li>Both parties acted in good faith during transaction</li>
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="dispute-right-column">
              {/* Timeline */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Timeline</h2>
                </div>
                <div className="timeline-container">
                  {timelineEvents.map((event, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-stopper"></div>
                      <div className="timeline-content">
                        <p className="timeline-date">{event.date}</p>
                        <p className="timeline-label">{event.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Verdict */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Final Verdict</h2>
                </div>
                <button type="button" className="verdict-button pending">
                  Decision Pending
                </button>
                <p className="verdict-message">The mediator is currently reviewing all evidence and will provide a decision within 24 hours.</p>
              </div>

              {/* Dispute Chat */}
              <div className="dispute-section">
                <div className="section-header">
                  <div className="section-indicator"></div>
                  <h2 className="section-title">Dispute Chat #{id || 'DSP-2024-002'}</h2>
                </div>
                <div className="chat-containers-wrapper">
                  {/* Seller Chat */}
                  <div className="chat-container seller-chat">
                    <h3 className="chat-section-title">Seller</h3>
                    {chatMessages
                      .filter(msg => msg.sender === 'Seller')
                      .map((msg, index) => (
                        <div key={index} className="chat-message seller">
                          <span className="chat-sender">{msg.sender}:</span>
                          <p className="chat-text">{msg.text}</p>
                        </div>
                      ))}
                  </div>

                  {/* Mediator Chat */}
                  <div className="chat-container mediator-chat">
                    <h3 className="chat-section-title">Mediator</h3>
                    {chatMessages
                      .filter(msg => msg.sender === 'Mediator')
                      .map((msg, index) => (
                        <div key={index} className="chat-message mediator">
                          <span className="chat-sender">{msg.sender}:</span>
                          <p className="chat-text">{msg.text}</p>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Add message."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button type="button" className="chat-send-btn" onClick={handleSendMessage}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div className="modal-overlay" onClick={() => setShowAddEvidenceModal(false)}>
          <div className="add-evidence-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Evidence</h2>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowAddEvidenceModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <label className="evidence-upload-label">Dispute Image</label>
              <div className="evidence-upload-area">
                <Upload size={32} className="upload-icon" />
                <p className="upload-placeholder">Drop or import your img here...</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="modal-cancel-btn"
                onClick={() => setShowAddEvidenceModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="modal-add-btn"
                onClick={() => {
                  // Handle add evidence logic here
                  setShowAddEvidenceModal(false);
                }}
              >
                Add now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default DisputeDetail;
