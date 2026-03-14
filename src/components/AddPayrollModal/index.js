import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Mail,
  User
} from 'lucide-react';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import '../LoadingIndicator/index.css';
import './index.css';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'XRP', 'NGN'];
const SALARY_TYPE_OPTIONS = ['Monthly', 'Weekly', 'Bi-weekly', 'Other'];

const AddPayrollModal = ({ isOpen, onCancel, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [payrollData, setPayrollData] = useState({
    name: '',
    companyName: '',
    payrollCycle: 'Weekly',
    startDate: '',
    companyEmail: '',
    cycleDate: '',
    endDate: '',
    releaseDate: '',
    payrollAmount: ''
  });

  const [membersData, setMembersData] = useState({
    // This will be populated when we add members
  });

  const [teamMembersResult, setTeamMembersResult] = useState(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState('');
  const fetchMembersTimeoutRef = useRef(null);

  const [paymentData, setPaymentData] = useState({
    currency: 'USD',
    salaryAmount: '',
    allowanceAllocation: false,
    defaultSalaryType: 'Monthly',
    disbursementMode: 'Auto Release',
    addAmount: ''
  });

  const handleInputChange = (field, value) => {
    if (currentStep === 1) {
      setPayrollData(prev => ({ ...prev, [field]: value }));
    } else if (currentStep === 2) {
      setMembersData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCloseModal = () => {
    setSubmitError('');
    setCurrentStep(1);
    setPayrollData({
      name: '',
      companyName: '',
      payrollCycle: 'Weekly',
      startDate: '',
      companyEmail: '',
      cycleDate: '',
      endDate: '',
      releaseDate: '',
      payrollAmount: ''
    });
    setMembersData({});
    setPaymentData({
      currency: 'USD',
      salaryAmount: '',
      allowanceAllocation: false,
      defaultSalaryType: 'Monthly',
      disbursementMode: 'Auto Release',
      addAmount: ''
    });
    setTeamMembersResult(null);
    setMembersError('');
    onCancel();
  };

  // Fetch team members from API when Team name (companyName) is set
  // GET api/business-suite/teams/members?name=<teamName> with Bearer token
  useEffect(() => {
    const teamName = (payrollData.companyName || '').trim();
    if (!teamName) {
      setTeamMembersResult(null);
      setMembersError('');
      return;
    }
    if (fetchMembersTimeoutRef.current) clearTimeout(fetchMembersTimeoutRef.current);
    fetchMembersTimeoutRef.current = setTimeout(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMembersError('Please sign in.');
        return;
      }
      setIsLoadingMembers(true);
      setMembersError('');
      const url = getApiUrl(`api/business-suite/teams/members?name=${encodeURIComponent(teamName)}`);
      fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then((res) => res.json().catch(() => ({})))
        .then((result) => {
          if (result?.success && result?.data) {
            setTeamMembersResult(result.data);
            setMembersError('');
          } else {
            setTeamMembersResult(null);
            setMembersError(result?.message || 'No team members found.');
          }
        })
        .catch((err) => {
          console.error('Fetch team members error:', err);
          setTeamMembersResult(null);
          setMembersError('Failed to load team members.');
        })
        .finally(() => setIsLoadingMembers(false));
    }, 400);
    return () => {
      if (fetchMembersTimeoutRef.current) clearTimeout(fetchMembersTimeoutRef.current);
    };
  }, [payrollData.companyName]);

  const handleSubmitAndNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setSubmitError('');
      setSubmitting(true);
      const members = teamMembersResult?.members ?? [];
      const totalAmount = parseFloat(payrollData.payrollAmount) || 0;
      const count = members.length || 1;
      const amountPerMember = count > 0 ? totalAmount / count : 0;
      const items = members.map((m) => ({
        counterpartyId: m.userId,
        amountUsd: Math.round(amountPerMember * 100) / 100,
      }));
      const merged = {
        ...payrollData,
        ...membersData,
        ...paymentData,
        items,
        teamId: teamMembersResult?.teamId,
        teamName: teamMembersResult?.teamName || payrollData.companyName,
      };
      try {
        if (onSuccess) {
          const result = await Promise.resolve(onSuccess(merged));
          if (result !== false) handleCloseModal();
        } else {
          handleCloseModal();
        }
      } catch (err) {
        setSubmitError(err?.message || 'Failed to create payroll');
      } finally {
        setSubmitting(false);
      }
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
      <div className="create-escrow-modal add-payroll-modal" onClick={(e) => e.stopPropagation()}>
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
                <span className="step-title-mobile">Payment Summary</span>
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
              <span className="step-title">Payment Summary</span>
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
                      <label>Payroll name</label>
                      <input
                        type="text"
                        placeholder="e.g. March 2026 Payroll"
                        value={payrollData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Team name</label>
                      <div className="date-input-wrapper">
                        <input
                          type="text"
                          placeholder="Team name"
                          value={payrollData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                        />
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
                          type="date"
                          value={payrollData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-column">
                    <div className="form-group">
                      <label>End Date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="date"
                          value={payrollData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Release date</label>
                      <div className="date-input-wrapper">
                        <input
                          type="date"
                          value={payrollData.releaseDate}
                          onChange={(e) => handleInputChange('releaseDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Amount to be paid</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={payrollData.payrollAmount}
                        onChange={(e) => handleInputChange('payrollAmount', e.target.value)}
                      />
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
                  <div className="form-column" style={{ gridColumn: '1 / -1' }}>
                    <div className="form-group">
                      <label>Team members</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                        {!payrollData.companyName?.trim()
                          ? 'Enter Team name in Step 1 to load team members.'
                          : isLoadingMembers
                            ? 'Loading team members...'
                            : membersError
                              ? membersError
                              : teamMembersResult?.members?.length
                                ? `Loaded from team "${teamMembersResult.teamName || payrollData.companyName}".`
                                : 'No members found for this team name.'}
                      </p>
                    </div>
                    {isLoadingMembers && (
                      <div className="add-payroll-members-loading">
                        <LoadingIndicator size="sm" />
                        <span>Fetching members...</span>
                      </div>
                    )}
                    {!isLoadingMembers && teamMembersResult?.members?.length > 0 && (
                      <ul className="add-payroll-members-list">
                        {teamMembersResult.members.map((m) => (
                          <li key={m.id || m.userId} className="add-payroll-member-item">
                            <User size={16} className="add-payroll-member-icon" />
                            <div className="add-payroll-member-info">
                              <span className="add-payroll-member-name">{m.fullName || '—'}</span>
                              {m.email && (
                                <span className="add-payroll-member-email">
                                  <Mail size={12} /> {m.email}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <div className="escrow-form-section">
                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Payment Summary</h3>
                <div className="payment-summary-grid">
                  <div className="payment-summary-block">
                    <h4 className="payment-summary-block-title">Payroll details (Step 1)</h4>
                    <div className="payment-summary-rows">
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">Payroll name</span>
                        <span className="payment-summary-value">{payrollData.name || '—'}</span>
                      </div>
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">Team name</span>
                        <span className="payment-summary-value">{payrollData.companyName || '—'}</span>
                      </div>
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">Payroll cycle</span>
                        <span className="payment-summary-value">{payrollData.payrollCycle || '—'}</span>
                      </div>
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">Start date</span>
                        <span className="payment-summary-value">{payrollData.startDate || '—'}</span>
                      </div>
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">End date</span>
                        <span className="payment-summary-value">{payrollData.endDate || '—'}</span>
                      </div>
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">Release date</span>
                        <span className="payment-summary-value">{payrollData.releaseDate || '—'}</span>
                      </div>
                      <div className="payment-summary-row">
                        <span className="payment-summary-label">Amount to be paid</span>
                        <span className="payment-summary-value">
                          {payrollData.payrollAmount !== '' && payrollData.payrollAmount !== undefined
                            ? `$${Number(payrollData.payrollAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="payment-summary-block">
                    <h4 className="payment-summary-block-title">Members (Step 2)</h4>
                    <p className="payment-summary-team-name">
                      {teamMembersResult?.teamName || payrollData.companyName
                        ? `Team: ${teamMembersResult?.teamName || payrollData.companyName}`
                        : null}
                    </p>
                    {teamMembersResult?.members?.length > 0 ? (
                      <ul className="add-payroll-members-list payment-summary-members">
                        {teamMembersResult.members.map((m) => (
                          <li key={m.id || m.userId} className="add-payroll-member-item">
                            <User size={16} className="add-payroll-member-icon" />
                            <div className="add-payroll-member-info">
                              <span className="add-payroll-member-name">{m.fullName || '—'}</span>
                              {m.email && (
                                <span className="add-payroll-member-email">
                                  <Mail size={12} /> {m.email}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="payment-summary-empty">No members added.</p>
                    )}
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
              {submitError && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0 0 0.5rem 0', width: '100%' }}>{submitError}</p>
              )}
              <button
                type="button"
                className="previous-btn"
                onClick={handlePrevious}
                disabled={submitting}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="submit-next-btn"
                onClick={handleSubmitAndNext}
                disabled={submitting}
              >
                <div className="submit-btn-icon-circle">
                  <ArrowRight size={16} />
                </div>
                <span>{submitting ? 'Creating...' : 'Save and Lock'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPayrollModal;
