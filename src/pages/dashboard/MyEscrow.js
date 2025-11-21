import React, { useState } from 'react';
import {
  DollarSign,
  Layers,
  Users,
  CheckCircle,
  ChevronDown,
  Plus,
  Calendar,
  MoreVertical,
  TrendingUp,
  X,
  CreditCard,
  FileText,
  ArrowRight
} from 'lucide-react';
import MyEscrowLayout from './MyEscrowLayout';
import './MyEscrow.css';

const MyEscrow = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedMonth] = useState('This month');
  const [showCreateEscrowModal, setShowCreateEscrowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedEscrowType, setSelectedEscrowType] = useState('Freelancing');
  const [formData, setFormData] = useState({
    payerWallet: '',
    payerEmail: '',
    payerName: '',
    payerPhone: '',
    counterpartyWallet: '',
    counterpartyEmail: '',
    counterpartyName: '',
    counterpartyPhone: ''
  });

  const categories = ['All', 'Freelance', 'Product purchase', 'Real estate', 'Custom'];

  const escrowData = [
    {
      id: '#ESC-2024-001',
      parties: { from: 'John Smith', to: 'Sarah Wilson' },
      amount: { crypto: '5,000 XRP', usd: '≈ $2,715.00' },
      status: 'Pending',
      progress: 60,
      created: '21.03.2021',
      action: 'Release'
    },
    {
      id: '#ESC-2024-002',
      parties: { from: 'John Smith', to: 'Sarah Wilson' },
      amount: { crypto: '5,000 XRP', usd: '≈ $2,715.00' },
      status: 'Pending',
      progress: 60,
      created: '21.03.2021',
      action: 'Release'
    },
    {
      id: '#ESC-2024-003',
      parties: { from: 'John Smith', to: 'Sarah Wilson' },
      amount: { crypto: '5,000 XRP', usd: '≈ $2,715.00' },
      status: 'Pending',
      progress: 60,
      created: '21.03.2021',
      action: 'Release'
    },
    {
      id: '#ESC-2024-004',
      parties: { from: 'John Smith', to: 'Sarah Wilson' },
      amount: { crypto: '5,000 XRP', usd: '≈ $2,715.00' },
      status: 'Pending',
      progress: 60,
      created: '21.03.2021',
      action: 'Release'
    },
    {
      id: '#ESC-2024-005',
      parties: { from: 'John Smith', to: 'Sarah Wilson' },
      amount: { crypto: '5,000 XRP', usd: '≈ $2,715.00' },
      status: 'Pending',
      progress: 60,
      created: '21.03.2021',
      action: 'Release'
    }
  ];

  return (
    <MyEscrowLayout>
      <div className="my-escrow-page">
      {/* Header Section */}
      <div className="escrow-header">
        <div className="escrow-breadcrumb">
          <span className="breadcrumb-item">General</span>
          <span className="breadcrumb-divider">›</span>
          <span className="breadcrumb-item active">My Escrow</span>
        </div>
        <div className="escrow-header-actions">
          <div className="escrow-month-dropdown">
            <span>{selectedMonth}</span>
            <ChevronDown size={16} />
          </div>
          <button type="button" className="create-escrow-btn" onClick={() => setShowCreateEscrowModal(true)}>
            <Plus size={18} />
            Create Escrow
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="escrow-metrics">
        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <DollarSign size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Total Escrowed Amount</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">$45,280</div>
            <div className="metric-subtitle">$16,789 locked</div>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+3.1%</span>
          </div>
        </div>

        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <Layers size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Total Escrow</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">45</div>
            <div className="metric-subtitle">This month</div>
          </div>
          <div className="metric-trend positive">
            <TrendingUp size={14} />
            <span>+3.1%</span>
          </div>
        </div>

        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <Users size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Active Escrow</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">23</div>
            <div className="metric-subtitle">This month</div>
          </div>
        </div>

        <div className="escrow-metric-card">
          <div className="metric-header-row">
            <div className="metric-icon metric-icon-small">
              <CheckCircle size={12} />
            </div>
            <h3 className="metric-label metric-label-small metric-label-blue">Completed Escrow</h3>
          </div>
          <div className="metric-content">
            <div className="metric-value">7</div>
            <div className="metric-subtitle">This month</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="escrow-filters">
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="secondary-filters">
          <div className="industry-dropdown">
            <span>All industries</span>
            <ChevronDown size={16} />
          </div>
          <div className="date-filter">
            <span>November</span>
            <Calendar size={16} />
          </div>
        </div>
      </div>

      {/* Escrow Table */}
      <div className="escrow-table-container">
        <table className="escrow-data-table">
          <thead>
            <tr>
              <th>Escrow ID</th>
              <th>Parties</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {escrowData.map((escrow, index) => (
              <tr key={`escrow-${index}`}>
                <td className="escrow-id">{escrow.id}</td>
                <td className="escrow-parties" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span className="party-from" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{escrow.parties.from}</span>
                  <span className="party-arrow" style={{ color: 'var(--text-muted)' }}>›</span>
                  <span className="party-to" style={{ color: 'var(--blue-600)', fontWeight: 500 }}>{escrow.parties.to}</span>
                </td>
                <td className="escrow-amount">
                  <span className="amount-single-line">
                    <span className="amount-crypto">{escrow.amount.crypto}</span>
                    <span className="amount-separator"> </span>
                    <span className="amount-usd">{escrow.amount.usd}</span>
                  </span>
                </td>
                <td>
                  <button type="button" className={`status-btn ${escrow.status.toLowerCase()}`}>
                    {escrow.status}
                  </button>
                </td>
                <td className="escrow-progress">
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar" style={{ width: `${escrow.progress}%` }}></div>
                  </div>
                  <span className="progress-text">{escrow.progress}%</span>
                </td>
                <td className="escrow-created">{escrow.created}</td>
                <td className="escrow-action">
                  <button type="button" className="release-btn">{escrow.action}</button>
                  <button type="button" className="action-menu-btn">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Escrow Modal */}
      {showCreateEscrowModal && (
        <div className="create-escrow-modal-overlay" onClick={() => setShowCreateEscrowModal(false)}>
          <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - NO border-bottom */}
            <div className="create-escrow-modal-header">
              <h2>Create Escrow</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowCreateEscrowModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Step Indicator with vertical divider */}
            <div className="create-escrow-steps">
              <div className={`step-indicator ${currentStep === 1 ? 'active' : ''}`}>
                <div className="step-icon">
                  <CreditCard size={20} />
                </div>
                <div className="step-content">
                  <span className="step-number">Step 1/3</span>
                  <span className="step-title">Type/ Counterparty</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${currentStep === 2 ? 'active' : ''}`}>
                <div className="step-icon">
                  <FileText size={20} />
                </div>
                <div className="step-content">
                  <span className="step-number">Step 2/3</span>
                  <span className="step-title">Terms</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${currentStep === 3 ? 'active' : ''}`}>
                <div className="step-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="step-content">
                  <span className="step-number">Step 3/3</span>
                  <span className="step-title">Confirmation</span>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="create-escrow-modal-content">
              {currentStep === 1 && (
                <>
                  {/* Escrow Type Section - Horizontal buttons */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Type</h3>
                    <div className="escrow-type-buttons">
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Freelancing' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Freelancing')}
                      >
                        {selectedEscrowType === 'Freelancing' && <CheckCircle size={18} />}
                        {selectedEscrowType !== 'Freelancing' && <Plus size={18} />}
                        Freelancing
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Real Estate' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Real Estate')}
                      >
                        {selectedEscrowType === 'Real Estate' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Real Estate
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Product purchase' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Product purchase')}
                      >
                        {selectedEscrowType === 'Product purchase' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Product purchase
                      </button>
                      <button
                        type="button"
                        className={`escrow-type-btn ${selectedEscrowType === 'Custom' ? 'active' : ''}`}
                        onClick={() => setSelectedEscrowType('Custom')}
                      >
                        {selectedEscrowType === 'Custom' ? <CheckCircle size={18} /> : <Plus size={18} />}
                        Custom
                      </button>
                    </div>
                  </div>

                  {/* Escrow Counterparty Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Counterparty</h3>
                    <div className="counterparty-form-grid">
                      {/* Left Column - Payer's Information */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Payers (You) XRP Wallet Address <span className="required">*</span></label>
                          <input
                            type="text"
                            placeholder="••••••••••••••••"
                            value={formData.payerWallet}
                            onChange={(e) => setFormData({ ...formData, payerWallet: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Your Email</label>
                          <input
                            type="email"
                            placeholder="Enter your Email"
                            value={formData.payerEmail}
                            onChange={(e) => setFormData({ ...formData, payerEmail: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Counterparty XRP Wallet Address <span className="required">*</span></label>
                          <input
                            type="text"
                            placeholder="••••••••••••••••"
                            value={formData.counterpartyWallet}
                            onChange={(e) => setFormData({ ...formData, counterpartyWallet: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            placeholder="Enter your Email"
                            value={formData.counterpartyEmail}
                            onChange={(e) => setFormData({ ...formData, counterpartyEmail: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Right Column - Names and Phone Numbers */}
                      <div className="form-column">
                        <div className="form-group">
                          <label>Your Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={formData.payerName}
                            onChange={(e) => setFormData({ ...formData, payerName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Your Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter your Number"
                            value={formData.payerPhone}
                            onChange={(e) => setFormData({ ...formData, payerPhone: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            placeholder="Enter your name"
                            value={formData.counterpartyName}
                            onChange={(e) => setFormData({ ...formData, counterpartyName: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input
                            type="tel"
                            placeholder="Enter your Number"
                            value={formData.counterpartyPhone}
                            onChange={(e) => setFormData({ ...formData, counterpartyPhone: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {currentStep === 1 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  <span>Submit and Next</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </MyEscrowLayout>
  );
};

export default MyEscrow;

