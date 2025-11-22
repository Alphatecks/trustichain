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
  ArrowRight,
  ArrowLeft,
  Download,
  Clock,
  Coins
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

  const [termsData, setTermsData] = useState({
    releaseType: 'Manual Release',
    expectedCompletionDate: '',
    expectedReleaseDate: '',
    disputeResolutionPeriod: '',
    totalAmount: '',
    releaseConditions: '',
    milestoneDetails: '',
    milestoneAmount: '',
    milestones: []
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
              <div className={`step-indicator ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                <div className="step-icon">
                  {currentStep > 1 ? <CheckCircle size={20} /> : <CreditCard size={20} />}
                </div>
                <div className="step-content">
                  <span className="step-number">Step 1/3</span>
                  <span className="step-title">Type/ Counterparty</span>
                </div>
              </div>
              <div className="step-divider"></div>
              <div className={`step-indicator ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
                <div className="step-icon">
                  {currentStep > 2 ? <CheckCircle size={20} /> : <FileText size={20} />}
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

              {currentStep === 2 && (
                <>
                  {/* Escrow Terms Section */}
                  <div className="escrow-form-section">
                    <h3 className="section-title">Escrow Terms</h3>
                    
                    {/* Release Type Buttons */}
                    <div className="release-type-buttons">
                      <button
                        type="button"
                        className={`release-type-btn ${termsData.releaseType === 'Manual Release' ? 'active' : ''}`}
                        onClick={() => setTermsData({ ...termsData, releaseType: 'Manual Release' })}
                      >
                        <Download size={18} />
                        Manual Release
                      </button>
                      <button
                        type="button"
                        className={`release-type-btn ${termsData.releaseType === 'Time based' ? 'active' : ''}`}
                        onClick={() => setTermsData({ ...termsData, releaseType: 'Time based' })}
                      >
                        <Clock size={18} />
                        Time based
                      </button>
                      <button
                        type="button"
                        className={`release-type-btn ${termsData.releaseType === 'Milestones' ? 'active' : ''}`}
                        onClick={() => setTermsData({ ...termsData, releaseType: 'Milestones' })}
                      >
                        <Coins size={18} />
                        Milestones
                      </button>
                    </div>

                    {/* Form Fields - Manual Release */}
                    {termsData.releaseType === 'Manual Release' && (
                      <div className="terms-form-grid">
                        <div className="form-group">
                          <label>Expected Completion Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedCompletionDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedCompletionDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Dispute Resolution Period</label>
                          <div className="select-input-wrapper">
                            <select
                              value={termsData.disputeResolutionPeriod}
                              onChange={(e) => setTermsData({ ...termsData, disputeResolutionPeriod: e.target.value })}
                            >
                              <option value="">Select</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <ChevronDown size={16} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Total Amount</label>
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={termsData.totalAmount}
                            onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group form-group-full">
                          <label>Release Conditions</label>
                          <textarea
                            placeholder="Enter details"
                            value={termsData.releaseConditions}
                            onChange={(e) => setTermsData({ ...termsData, releaseConditions: e.target.value })}
                            rows={4}
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* Form Fields - Time based */}
                    {termsData.releaseType === 'Time based' && (
                      <div className="terms-form-grid">
                        <div className="form-group">
                          <label>Expected Completion Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedCompletionDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedCompletionDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Dispute Resolution Period</label>
                          <div className="select-input-wrapper">
                            <select
                              value={termsData.disputeResolutionPeriod}
                              onChange={(e) => setTermsData({ ...termsData, disputeResolutionPeriod: e.target.value })}
                            >
                              <option value="">Select</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <ChevronDown size={16} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Expected Release Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedReleaseDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedReleaseDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Total Amount</label>
                          <input
                            type="text"
                            placeholder="Add amount"
                            value={termsData.totalAmount}
                            onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Release Conditions</label>
                          <textarea
                            placeholder="Enter details"
                            value={termsData.releaseConditions}
                            onChange={(e) => setTermsData({ ...termsData, releaseConditions: e.target.value })}
                            rows={4}
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* Form Fields - Milestones */}
                    {termsData.releaseType === 'Milestones' && (
                      <div className="terms-form-grid">
                        <div className="form-group">
                          <label>Total Amount</label>
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={termsData.totalAmount}
                            onChange={(e) => setTermsData({ ...termsData, totalAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Milestone amount</label>
                          <input
                            type="text"
                            placeholder="Enter amount"
                            value={termsData.milestoneAmount}
                            onChange={(e) => setTermsData({ ...termsData, milestoneAmount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Milestone details</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.milestoneDetails}
                              onChange={(e) => setTermsData({ ...termsData, milestoneDetails: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Dispute Resolution Period</label>
                          <div className="select-input-wrapper">
                            <select
                              value={termsData.disputeResolutionPeriod}
                              onChange={(e) => setTermsData({ ...termsData, disputeResolutionPeriod: e.target.value })}
                            >
                              <option value="">select</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                            <ChevronDown size={16} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Expected Completion Date</label>
                          <div className="date-input-wrapper">
                            <input
                              type="text"
                              placeholder="Add Date"
                              value={termsData.expectedCompletionDate}
                              onChange={(e) => setTermsData({ ...termsData, expectedCompletionDate: e.target.value })}
                            />
                            <Calendar size={18} className="input-icon" />
                          </div>
                        </div>

                        <div className="form-group">
                          <button
                            type="button"
                            className="add-milestone-btn"
                            onClick={() => {
                              if (termsData.milestoneDetails && termsData.milestoneAmount) {
                                const newMilestone = {
                                  details: termsData.milestoneDetails,
                                  amount: termsData.milestoneAmount
                                };
                                setTermsData({
                                  ...termsData,
                                  milestones: [...termsData.milestones, newMilestone],
                                  milestoneDetails: '',
                                  milestoneAmount: ''
                                });
                              }
                            }}
                          >
                            <Plus size={18} />
                            <span>Add milestone</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  {/* Confirmation Step */}
                  <div className="confirmation-step">
                    {/* Escrow Type & Terms Summary */}
                    <div className="confirmation-summary-section">
                      <div className="confirmation-type-section">
                        <h3 className="confirmation-section-title">Escrow Type</h3>
                        <button className="confirmation-type-btn active" type="button">
                          {selectedEscrowType}
                        </button>
                      </div>

                      <div className="confirmation-type-section">
                        <h3 className="confirmation-section-title">Escrow Terms</h3>
                        <button className="confirmation-type-btn active" type="button">
                          {termsData.releaseType === 'Time based' && <Clock size={18} />}
                          {termsData.releaseType === 'Milestones' && <Coins size={18} />}
                          {termsData.releaseType === 'Manual Release' && <Download size={18} />}
                          <span>{termsData.releaseType}</span>
                        </button>
                      </div>
                    </div>

                    {/* Escrow Counterparty Section */}
                    <div className="confirmation-details-section">
                      <h3 className="confirmation-section-title">Escrow Counterparty</h3>
                      <div className="confirmation-field-group">
                        <label className="confirmation-label">
                          Counterparty XRP Wallet Address <span className="required">*</span>
                        </label>
                        <div className="confirmation-masked-input">
                          {formData.counterpartyXRPWallet ? formData.counterpartyXRPWallet.replace(/./g, '•') : '••••••••••••••'}
                        </div>
                      </div>
                      <div className="confirmation-info-grid">
                        <div className="confirmation-info-item">
                          <span className="confirmation-info-label">Name</span>
                          <span className="confirmation-info-value">{formData.counterpartyName}</span>
                        </div>
                        <div className="confirmation-info-item">
                          <span className="confirmation-info-label">Email</span>
                          <span className="confirmation-info-value">{formData.counterpartyEmail}</span>
                        </div>
                        <div className="confirmation-info-item">
                          <span className="confirmation-info-label">Phone Number</span>
                          <span className="confirmation-info-value">{formData.counterpartyPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Escrow Details Section */}
                    <div className="confirmation-details-section">
                      <h3 className="confirmation-section-title">Escrow Details</h3>
                      <div className="confirmation-details-list">
                        <div className="confirmation-detail-item">
                          <span className="confirmation-detail-label">Expected Completion Date</span>
                          <span className="confirmation-detail-value">
                            {termsData.expectedCompletionDate}
                            {termsData.expectedCompletionDate && <Calendar size={16} />}
                          </span>
                        </div>
                        <div className="confirmation-detail-item">
                          <span className="confirmation-detail-label">Dispute Resolution Period</span>
                          <span className="confirmation-detail-value">
                            {termsData.disputeResolutionPeriod ? `${termsData.disputeResolutionPeriod} days` : ''}
                          </span>
                        </div>
                        <div className="confirmation-details-row">
                          <div className="confirmation-detail-item">
                            <span className="confirmation-detail-label">Amount</span>
                            <span className="confirmation-detail-value">
                              {termsData.totalAmount ? `${termsData.totalAmount} XRP ($0.25 USD)` : ''}
                            </span>
                          </div>
                          <div className="confirmation-detail-item">
                            <span className="confirmation-detail-label">Escrow Fee</span>
                            <span className="confirmation-detail-value">
                              {termsData.totalAmount ? `0.5 XRP ($0.25 USD)` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="confirmation-detail-item">
                          <span className="confirmation-detail-label">Total Payment</span>
                          <span className="confirmation-detail-value">
                            {termsData.totalAmount ? `0.5 XRP ($0.25 USD)` : ''}
                          </span>
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
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="previous-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  <div className="previous-btn-icon-circle">
                    <ArrowLeft size={16} />
                  </div>
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="submit-next-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  <div className="submit-btn-icon-circle">
                    <ArrowRight size={16} />
                  </div>
                  <span>Submit and Next</span>
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="create-escrow-modal-footer">
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={() => {
                    alert('Escrow Created!');
                    setShowCreateEscrowModal(false);
                  }}
                >
                  <CheckCircle size={18} />
                  <span>Confirm</span>
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

