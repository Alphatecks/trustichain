import React, { useState } from 'react';
import {
  FileText,
  Users,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Calendar,
  ChevronDown
} from 'lucide-react';
import '../LoadingIndicator/index.css';

const AddPayrollModal = ({ isOpen, onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [payrollData, setPayrollData] = useState({
    companyName: '',
    payrollCycle: 'Weekly',
    startDate: '',
    companyDescription: '',
    companyEmail: '',
    cycleDate: '',
    endDate: ''
  });

  const [membersData, setMembersData] = useState({
    // This will be populated when we add members
  });

  const [paymentData, setPaymentData] = useState({
    currency: '',
    salaryAmount: '',
    allowanceAllocation: false,
    defaultSalaryType: '',
    disbursementMode: 'Auto Release',
    addAmount: ''
  });

  const handleInputChange = (field, value) => {
    if (currentStep === 1) {
      setPayrollData(prev => ({ ...prev, [field]: value }));
    } else if (currentStep === 2) {
      setMembersData(prev => ({ ...prev, [field]: value }));
    } else if (currentStep === 3) {
      // Some fields in Step 3 belong to payrollData (payrollCycle, startDate, companyDescription, endDate)
      if (['payrollCycle', 'startDate', 'companyDescription', 'endDate'].includes(field)) {
        setPayrollData(prev => ({ ...prev, [field]: value }));
      } else {
        setPaymentData(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleCloseModal = () => {
    setCurrentStep(1);
    setPayrollData({
      companyName: '',
      payrollCycle: 'Weekly',
      startDate: '',
      companyDescription: '',
      companyEmail: '',
      cycleDate: '',
      endDate: ''
    });
    setMembersData({});
    setPaymentData({
      currency: '',
      salaryAmount: '',
      allowanceAllocation: false,
      defaultSalaryType: '',
      disbursementMode: 'Auto Release',
      addAmount: ''
    });
    onCancel();
  };

  const handleSubmitAndNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission
      onSuccess({
        ...payrollData,
        ...membersData,
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
          <h2>Add new payroll</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator - Mobile Card Style */}
        <div className="create-escrow-steps-mobile">
          {currentStep === 1 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <FileText size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 1/3</span>
                <span className="step-title-mobile">Payroll Details</span>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <Users size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 2/3</span>
                <span className="step-title-mobile">Members</span>
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
              {currentStep > 1 ? <CheckCircle size={20} /> : <FileText size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 1/3</span>
              <span className="step-title">Payroll Details</span>
            </div>
          </div>
          <div className="step-divider"></div>
          <div
            className={`step-indicator ${
              currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''
            }`}
          >
            <div className="step-icon">
              {currentStep > 2 ? <CheckCircle size={20} /> : <Users size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 2/3</span>
              <span className="step-title">Members</span>
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
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Payroll Detail</h3>
                <div className="counterparty-form-grid">
                  <div className="form-column">
                    <div className="form-group">
                      <label>Company Name</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Add Date"
                          value={payrollData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Payroll cycle</label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="payrollCycle"
                            value="Weekly"
                            checked={payrollData.payrollCycle === 'Weekly'}
                            onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                          />
                          <span>Weekly</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="payrollCycle"
                            value="Bi-weekly"
                            checked={payrollData.payrollCycle === 'Bi-weekly'}
                            onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                          />
                          <span>Bi-weekly</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="payrollCycle"
                            value="Other"
                            checked={payrollData.payrollCycle === 'Other'}
                            onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                          />
                          <span>Other</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Start Date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={payrollData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Company Description</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Enter details"
                        value={payrollData.companyDescription}
                        onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="form-column">
                    <div className="form-group">
                      <label>Company email</label>
                      <input
                        type="email"
                        placeholder="Enter Email"
                        value={payrollData.companyEmail}
                        onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cycle Date</label>
                      <div className="select-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={payrollData.cycleDate}
                          onChange={(e) => handleInputChange('cycleDate', e.target.value)}
                        />
                        <ChevronDown size={18} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={payrollData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
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
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Members</h3>
                <div className="counterparty-form-grid">
                  <div className="form-column">
                    <div className="form-group">
                      <label>Add team members</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        You can add team members after creating the payroll.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="escrow-form-section">
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Compliance & Documentation</h3>
                <div className="counterparty-form-grid">
                  <div className="form-column">
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        className="form-input readonly"
                        value={payrollData.companyName}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Payroll cycle</label>
                      <div className="radio-group">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="payrollCycle"
                            value="Weekly"
                            checked={payrollData.payrollCycle === 'Weekly'}
                            onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                          />
                          <span>Weekly</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="payrollCycle"
                            value="Bi-weekly"
                            checked={payrollData.payrollCycle === 'Bi-weekly'}
                            onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                          />
                          <span>Bi-weekly</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="payrollCycle"
                            value="Other"
                            checked={payrollData.payrollCycle === 'Other'}
                            onChange={(e) => handleInputChange('payrollCycle', e.target.value)}
                          />
                          <span>Other</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Start Date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={payrollData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Company Description</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Enter details"
                        value={payrollData.companyDescription}
                        onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Add Date"
                          value={paymentData.currency}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                        />
                        <ChevronDown size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Salary Amount</label>
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={paymentData.salaryAmount}
                        onChange={(e) => handleInputChange('salaryAmount', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Allowance Allocation</label>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Enable Allowances</span>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={paymentData.allowanceAllocation}
                            onChange={(e) => handleInputChange('allowanceAllocation', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="form-column">
                    <div className="form-group">
                      <label>Company email</label>
                      <input
                        type="text"
                        className="form-input readonly"
                        value={payrollData.companyEmail}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Cycle Date</label>
                      <input
                        type="text"
                        className="form-input readonly"
                        value={payrollData.cycleDate}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={payrollData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Default Salary Type</label>
                      <div className="select-input-wrapper">
                        <input
                          type="text"
                          placeholder="Select"
                          value={paymentData.defaultSalaryType}
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
                            checked={paymentData.disbursementMode === 'Auto Release'}
                            onChange={(e) => handleInputChange('disbursementMode', e.target.value)}
                          />
                          <span>Auto Release</span>
                        </label>
                        <label className="radio-option">
                          <input
                            type="radio"
                            name="disbursementMode"
                            value="Manual Release"
                            checked={paymentData.disbursementMode === 'Manual Release'}
                            onChange={(e) => handleInputChange('disbursementMode', e.target.value)}
                          />
                          <span>Manual Release</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Add Amount</label>
                      <input
                        type="text"
                        placeholder="Add amount"
                        value={paymentData.addAmount}
                        onChange={(e) => handleInputChange('addAmount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
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
                <span>Save and Lock</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPayrollModal;
