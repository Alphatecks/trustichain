import React, { useState } from 'react';
import {
  User,
  Briefcase,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  ChevronDown,
  Download,
  Clock
} from 'lucide-react';
import '../LoadingIndicator/index.css';

const AddTeamMemberModal = ({ isOpen, onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    address: '',
    gender: ''
  });

  const [jobData, setJobData] = useState({
    jobTitle: '',
    employmentType: 'Full time',
    status: '',
    currency: '',
    salaryAmount: '',
    email: '',
    dateJoined: '',
    defaultSalaryType: '',
    disbursementMode: 'Auto Release'
  });

  const [paymentData, setPaymentData] = useState({
    accountType: 'Wallet Transfer',
    walletType: '',
    walletAddress: '',
    network: '',
    currency: '',
    bankName: '',
    accountNumber: ''
  });

  const handleInputChange = (field, value) => {
    if (currentStep === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (currentStep === 2) {
      setJobData(prev => ({ ...prev, [field]: value }));
    } else if (currentStep === 3) {
      setPaymentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCloseModal = () => {
    setCurrentStep(1);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      country: '',
      address: '',
      gender: ''
    });
    setJobData({
      jobTitle: '',
      employmentType: 'Full time',
      status: '',
      currency: '',
      salaryAmount: '',
      email: '',
      dateJoined: '',
      defaultSalaryType: '',
      disbursementMode: 'Auto Release'
    });
    setPaymentData({
      accountType: 'Wallet Transfer',
      walletType: '',
      walletAddress: '',
      network: '',
      currency: '',
      bankName: '',
      accountNumber: ''
    });
    onCancel();
  };

  const handleSubmitAndNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      onSuccess({
        ...formData,
        ...jobData,
        ...paymentData
      });
      handleCloseModal();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Add new team member</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator - Mobile Card Style */}
        <div className="create-escrow-steps-mobile">
          {currentStep === 1 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <User size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 1/3</span>
                <span className="step-title-mobile">Personal details</span>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <Briefcase size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 2/3</span>
                <span className="step-title-mobile">Job details</span>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <CheckCircle size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 3/3</span>
                <span className="step-title-mobile">Payment Details</span>
              </div>
            </div>
          )}
        </div>

        {/* Step Indicator - Desktop with vertical divider */}
        <div className="create-escrow-steps">
          <div
            className={`step-indicator ${
              currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''
            }`}
          >
            <div className="step-icon">
              {currentStep > 1 ? <CheckCircle size={20} /> : <User size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 1/3</span>
              <span className="step-title">Personal details</span>
            </div>
          </div>
          <div className="step-divider"></div>
          <div
            className={`step-indicator ${
              currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''
            }`}
          >
            <div className="step-icon">
              {currentStep > 2 ? <CheckCircle size={20} /> : <Briefcase size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 2/3</span>
              <span className="step-title">Job details</span>
            </div>
          </div>
          <div className="step-divider"></div>
          <div className={`step-indicator ${currentStep === 3 ? 'active' : ''}`}>
            <div className="step-icon">
              <CheckCircle size={20} />
            </div>
            <div className="step-content">
              <span className="step-number">Step 3/3</span>
              <span className="step-title">Payment Details</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="create-escrow-modal-content">
          {currentStep === 1 && (
            <>
              <div className="escrow-form-section">
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Personal details</h3>
                <div className="counterparty-form-grid">
                  <div className="form-column">
                    <div className="form-group">
                      <label>Name</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Add Date"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Phone Number:</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Address:</label>
                      <input
                        type="text"
                        placeholder="Enter details"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-column">
                    <div className="form-group form-group-wide">
                      <label>Email</label>
                      <div className="select-input-wrapper">
                        <input
                          type="email"
                          placeholder="Select"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group form-group-wide">
                      <label>Country:</label>
                      <div className="select-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Gender:</label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={formData.gender === 'Male'}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                          />
                          <span>Male</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={formData.gender === 'Female'}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                          />
                          <span>Female</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="gender"
                            value="Other"
                            checked={formData.gender === 'Other'}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                          />
                          <span>Other</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="escrow-form-section">
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Job details</h3>
                <div className="counterparty-form-grid">
                  {/* Left Column */}
                  <div className="form-column">
                    <div className="form-group">
                      <label>Job Title:</label>
                      <input
                        type="text"
                        placeholder="Add job title"
                        value={jobData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Employment Type:</label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="employmentType"
                            value="Full time"
                            checked={jobData.employmentType === 'Full time'}
                            onChange={(e) => handleInputChange('employmentType', e.target.value)}
                          />
                          <span>Full time</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="employmentType"
                            value="part time"
                            checked={jobData.employmentType === 'part time'}
                            onChange={(e) => handleInputChange('employmentType', e.target.value)}
                          />
                          <span>part time</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="employmentType"
                            value="contract"
                            checked={jobData.employmentType === 'contract'}
                            onChange={(e) => handleInputChange('employmentType', e.target.value)}
                          />
                          <span>contract</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group form-group-wide">
                      <label>Status</label>
                      <div className="select-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={jobData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Add Date"
                          value={jobData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Salary Amount</label>
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={jobData.salaryAmount}
                        onChange={(e) => handleInputChange('salaryAmount', e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Right Column */}
                  <div className="form-column">
                    <div className="form-group form-group-wide">
                      <label>Email</label>
                      <div className="select-input-wrapper">
                        <input
                          type="email"
                          placeholder="Select"
                          value={jobData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Date Joined</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Enter phone number"
                          value={jobData.dateJoined}
                          onChange={(e) => handleInputChange('dateJoined', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group form-group-wide">
                      <label>Default Salary Type</label>
                      <div className="select-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={jobData.defaultSalaryType}
                          onChange={(e) => handleInputChange('defaultSalaryType', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Disbursement Mode</label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="Auto Release"
                            checked={jobData.disbursementMode === 'Auto Release'}
                            onChange={(e) => handleInputChange('disbursementMode', e.target.value)}
                          />
                          <span>Auto Release</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="Manual Release"
                            checked={jobData.disbursementMode === 'Manual Release'}
                            onChange={(e) => handleInputChange('disbursementMode', e.target.value)}
                          />
                          <span>Manual Release</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="escrow-form-section">
                <h3 className="section-title" style={{ color: 'var(--blue-600)', marginBottom: '1rem' }}>Account Type</h3>
                <div className="escrow-type-buttons" style={{ marginBottom: '2rem' }}>
                  <button
                    type="button"
                    className={`escrow-type-btn ${paymentData.accountType === 'Bank Transfer' ? 'active' : ''}`}
                    onClick={() => handleInputChange('accountType', 'Bank Transfer')}
                  >
                    {paymentData.accountType === 'Bank Transfer' ? <CheckCircle size={18} /> : <Download size={18} />}
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${paymentData.accountType === 'Wallet Transfer' ? 'active' : ''}`}
                    onClick={() => handleInputChange('accountType', 'Wallet Transfer')}
                  >
                    {paymentData.accountType === 'Wallet Transfer' ? <CheckCircle size={18} /> : <Clock size={18} />}
                    Wallet Transfer
                  </button>
                </div>
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Payment details</h3>
                {paymentData.accountType === 'Bank Transfer' ? (
                  <div className="counterparty-form-grid">
                    <div className="form-column">
                      <div className="form-group">
                        <label>Currency</label>
                        <div className="select-input-wrapper">
                          <input
                            type="text"
                            placeholder="Select"
                            value={paymentData.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value)}
                          />
                          <ChevronDown size={18} className="input-icon" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Bank Name</label>
                        <input
                          type="text"
                          placeholder="Add Date"
                          value={paymentData.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={paymentData.accountNumber}
                          onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="counterparty-form-grid">
                    <div className="form-column">
                      <div className="form-group">
                        <label>Wallet Type</label>
                        <div className="select-input-wrapper">
                          <input
                            type="text"
                            placeholder="Select"
                            value={paymentData.walletType}
                            onChange={(e) => handleInputChange('walletType', e.target.value)}
                          />
                          <ChevronDown size={18} className="input-icon" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Wallet Adress</label>
                        <div className="date-input-wrapper">
                          <input
                            type="text"
                            placeholder="Add Date"
                            value={paymentData.walletAddress}
                            onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                          />
                          <Calendar size={18} className="input-icon" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Network</label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={paymentData.network}
                          onChange={(e) => handleInputChange('network', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer Buttons */}
          {currentStep === 1 && (
            <div className="create-escrow-modal-footer">
              <button
                type="button"
                className="submit-next-btn"
                onClick={handleSubmitAndNext}
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
                onClick={handlePrevious}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="submit-next-btn"
                onClick={handleSubmitAndNext}
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
                className="previous-btn"
                onClick={handlePrevious}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="submit-next-btn"
                onClick={handleSubmitAndNext}
              >
                <div className="submit-btn-icon-circle">
                  <ArrowRight size={16} />
                </div>
                <span>Submit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;
