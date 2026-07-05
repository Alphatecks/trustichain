import React, { useState, useEffect, useRef } from 'react';
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
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import '../LoadingIndicator/index.css';
import './index.css';

const CHECK_DEBOUNCE_MS = 500;

const COUNTRY_OPTIONS = [
  'Canada',
  'France',
  'Germany',
  'Ghana',
  'India',
  'Kenya',
  'Nigeria',
  'Rwanda',
  'South Africa',
  'Uganda',
  'United Kingdom',
  'United States',
];

const AddTeamMemberModal = ({ isOpen, onCancel, onSuccess, teamId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [memberCheckResult, setMemberCheckResult] = useState(null); // null | 'found' | 'not_found'
  const [memberCheckMessage, setMemberCheckMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const checkTimeoutRef = useRef(null);
  const checkAbortRef = useRef(null);
  const countrySelectRef = useRef(null);
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [lookupMethod, setLookupMethod] = useState('personal');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    address: '',
    gender: '',
    trustitag: '',
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

  // When name or trustitag changes (step 1), debounced check if member exists and fill fields
  useEffect(() => {
    if (!isOpen || currentStep !== 1) return;

    const fullName = (formData.name || '').trim();
    const trustitag = (formData.trustitag || '').trim();
    const lookupValue = lookupMethod === 'trustitag' ? trustitag : fullName;

    if (lookupValue.length < 2) {
      setMemberCheckResult(null);
      setMemberCheckMessage('');
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      return;
    }

    setMemberCheckResult(null);
    setMemberCheckMessage('');
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }
    checkAbortRef.current?.abort();
    checkTimeoutRef.current = setTimeout(() => {
      checkTimeoutRef.current = null;
      const token = localStorage.getItem('token');
      if (!token) return;
      const requestedValue = lookupValue;
      const requestedMethod = lookupMethod;
      setIsCheckingMember(true);
      const controller = new AbortController();
      checkAbortRef.current = controller;
      const url = getApiUrl('api/business-suite/teams/members/check');
      const body =
        requestedMethod === 'trustitag'
          ? { trustitag: requestedValue }
          : { fullName: requestedValue };
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
        .then((res) => res.json().catch(() => ({})))
        .then((result) => {
          if (checkAbortRef.current !== controller) return;
          if (result?.success && result?.data?.exists === true) {
            const data = result.data;
            setFormData((prev) => {
              const currentValue =
                requestedMethod === 'trustitag'
                  ? (prev.trustitag || '').trim()
                  : (prev.name || '').trim();
              if (currentValue !== requestedValue) return prev;
              return {
                ...prev,
                ...(data.fullName != null && data.fullName !== '' && { name: String(data.fullName) }),
                ...(data.name != null && data.name !== '' && { name: String(data.name) }),
                ...(data.email != null && data.email !== '' && { email: String(data.email) }),
                ...(data.phone != null && data.phone !== '' && { phoneNumber: String(data.phone) }),
                ...(data.country != null && data.country !== '' && { country: String(data.country) }),
                ...(data.trustitag != null && data.trustitag !== '' && { trustitag: String(data.trustitag) }),
              };
            });
            setMemberCheckResult('found');
            setMemberCheckMessage(result?.message || 'User found – details filled.');
          } else {
            setMemberCheckResult('not_found');
            setMemberCheckMessage(
              result?.message ||
                (requestedMethod === 'trustitag'
                  ? 'No registered personal user found with this Trustitag. Enter details manually.'
                  : 'No registered personal user found with this full name. Enter email and phone manually.')
            );
          }
        })
        .catch((err) => {
          if (err?.name === 'AbortError' || checkAbortRef.current !== controller) return;
          setMemberCheckResult(null);
          setMemberCheckMessage('');
        })
        .finally(() => {
          if (checkAbortRef.current === controller) setIsCheckingMember(false);
        });
    }, CHECK_DEBOUNCE_MS);
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      checkAbortRef.current?.abort();
    };
  }, [isOpen, currentStep, formData.name, formData.trustitag, lookupMethod]);

  useEffect(() => {
    if (!isOpen || currentStep !== 1) {
      setCountryMenuOpen(false);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (!countryMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (countrySelectRef.current && !countrySelectRef.current.contains(event.target)) {
        setCountryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [countryMenuOpen]);

  const handleCloseModal = () => {
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkAbortRef.current?.abort();
    setShowSuccessModal(false);
    setSuccessMessage('');
    setSuccessData(null);
    setMemberCheckResult(null);
    setMemberCheckMessage('');
    setCountryMenuOpen(false);
    setLookupMethod('personal');
    setCurrentStep(1);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      country: '',
      address: '',
      gender: '',
      trustitag: '',
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

  const handleSubmitAndNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You need to be logged in.');
      return;
    }

    const payload = {
      name: formData.name ? `${formData.name}'s Team` : 'New Team',
      email: formData.email || jobData.email || '',
      phoneNumber: formData.phoneNumber || '',
      country: formData.country || '',
      address: formData.address || '',
      gender: formData.gender || '',
      trustitag: formData.trustitag || '',
      jobTitle: jobData.jobTitle || '',
      employmentType: jobData.employmentType || 'Full time',
      status: jobData.status || '',
      dateJoined: jobData.dateJoined || '',
      currency: jobData.currency || paymentData.currency || 'USD',
      defaultSalaryType: jobData.defaultSalaryType || '',
      salaryAmount: Number(jobData.salaryAmount) || 0,
      disbursementMode: jobData.disbursementMode || 'Auto Release',
      accountType: paymentData.accountType || 'Wallet Transfer',
      walletType: paymentData.walletType || '',
      walletAddress: paymentData.walletAddress || '',
      network: paymentData.network || ''
    };

    if (paymentData.accountType === 'Bank Transfer') {
      payload.accountType = 'Bank Transfer';
      delete payload.walletType;
      delete payload.walletAddress;
      delete payload.network;
    }

    // When adding to an existing team, send member payload (no team name)
    const memberPayload = teamId
      ? {
          email: formData.email || jobData.email || '',
          phoneNumber: formData.phoneNumber || '',
          country: formData.country || '',
          address: formData.address || '',
          gender: formData.gender || '',
          trustitag: formData.trustitag || '',
          jobTitle: jobData.jobTitle || '',
          employmentType: jobData.employmentType || 'Full time',
          status: jobData.status || '',
          dateJoined: jobData.dateJoined || '',
          currency: jobData.currency || paymentData.currency || 'USD',
          defaultSalaryType: jobData.defaultSalaryType || '',
          salaryAmount: Number(jobData.salaryAmount) || 0,
          disbursementMode: jobData.disbursementMode || 'Auto Release',
          accountType: paymentData.accountType || 'Wallet Transfer',
          walletType: paymentData.walletType || '',
          walletAddress: paymentData.walletAddress || '',
          network: paymentData.network || '',
          ...(formData.name && { name: formData.name }),
        }
      : null;

    if (paymentData.accountType === 'Bank Transfer' && memberPayload) {
      memberPayload.accountType = 'Bank Transfer';
      delete memberPayload.walletType;
      delete memberPayload.walletAddress;
      delete memberPayload.network;
    }

    const body = teamId ? memberPayload : payload;
    const url = teamId
      ? getApiUrl(`api/business-suite/teams/${teamId}/members`)
      : getApiUrl('api/business-suite/teams');

    setIsSubmitting(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.success) {
        setSuccessMessage(result?.message || (teamId ? 'Team member added successfully.' : 'Team created successfully.'));
        setSuccessData(result?.data || result);
        setShowSuccessModal(true);
      } else {
        toast.error(result?.message || (teamId ? 'Failed to add team member' : 'Failed to create team'));
      }
    } catch (err) {
      console.error(teamId ? 'Add member error' : 'Create team error', err);
      toast.error(teamId ? 'Failed to add team member' : 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    const data = successData;
    setSuccessData(null);
    handleCloseModal();
    onSuccess(data);
  };

  if (!isOpen) {
    return null;
  }

  if (showSuccessModal) {
    return (
      <div className="create-escrow-modal-overlay" onClick={handleSuccessDone}>
        <div className="create-escrow-modal add-team-member-success-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
          <div className="add-team-member-success-content">
            <div className="add-team-member-success-icon">
              <CheckCircle size={48} style={{ color: 'var(--green-600, #059669)' }} />
            </div>
            <h3 className="add-team-member-success-title">Success</h3>
            <p className="add-team-member-success-message">{successMessage}</p>
            <button type="button" className="submit-next-btn" onClick={handleSuccessDone} style={{ marginTop: '1rem' }}>
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal add-team-member-modal" onClick={(e) => e.stopPropagation()}>
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
                <div
                  className="add-team-member-lookup-toggle"
                  role="tablist"
                  aria-label="Member lookup method"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={lookupMethod === 'personal'}
                    className={`add-team-member-lookup-btn ${lookupMethod === 'personal' ? 'active' : ''}`}
                    onClick={() => {
                      setLookupMethod('personal');
                      setMemberCheckResult(null);
                      setMemberCheckMessage('');
                    }}
                  >
                    Personal Details
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={lookupMethod === 'trustitag'}
                    className={`add-team-member-lookup-btn ${lookupMethod === 'trustitag' ? 'active' : ''}`}
                    onClick={() => {
                      setLookupMethod('trustitag');
                      setMemberCheckResult(null);
                      setMemberCheckMessage('');
                    }}
                  >
                    Trustitag
                  </button>
                </div>

                {lookupMethod === 'trustitag' ? (
                  <>
                    <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Trustitag</h3>
                    <div className="form-group form-group-wide">
                      <label htmlFor="add-team-member-trustitag">Trustitag</label>
                      <input
                        id="add-team-member-trustitag"
                        type="text"
                        placeholder="Enter Trustitag"
                        autoComplete="off"
                        value={formData.trustitag}
                        onChange={(e) => handleInputChange('trustitag', e.target.value.trimStart())}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                      {isCheckingMember && (
                        <span className="add-team-member-check-hint" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                          Checking if user exists…
                        </span>
                      )}
                      {!isCheckingMember && memberCheckResult === 'found' && (
                        <span className="add-team-member-check-found" style={{ fontSize: '0.8rem', color: 'var(--green-600, #059669)', marginTop: '0.25rem', display: 'block' }}>
                          {memberCheckMessage}
                        </span>
                      )}
                      {!isCheckingMember && memberCheckResult === 'not_found' && (
                        <span className="add-team-member-check-not-found" style={{ fontSize: '0.8rem', color: 'var(--orange-600, #ea580c)', marginTop: '0.25rem', display: 'block' }}>
                          {memberCheckMessage}
                        </span>
                      )}
                    </div>
                  </>
                ) : null}

                <h3 className="section-title" style={{ color: 'var(--blue-600)' }}>Personal details</h3>
                <div className="counterparty-form-grid">
                  <div className="form-column">
                    {lookupMethod === 'personal' ? (
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                      {isCheckingMember && (
                        <span className="add-team-member-check-hint" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                          Checking if user exists…
                        </span>
                      )}
                      {!isCheckingMember && memberCheckResult === 'found' && (
                        <span className="add-team-member-check-found" style={{ fontSize: '0.8rem', color: 'var(--green-600, #059669)', marginTop: '0.25rem', display: 'block' }}>
                          {memberCheckMessage}
                        </span>
                      )}
                      {!isCheckingMember && memberCheckResult === 'not_found' && (
                        <span className="add-team-member-check-not-found" style={{ fontSize: '0.8rem', color: 'var(--orange-600, #ea580c)', marginTop: '0.25rem', display: 'block' }}>
                          {memberCheckMessage}
                        </span>
                      )}
                    </div>
                    ) : (
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    )}
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
                      <input
                        type="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div className="form-group form-group-wide">
                      <label>Country:</label>
                      <div
                        ref={countrySelectRef}
                        className={`add-team-member-country-select ${countryMenuOpen ? 'is-open' : ''} ${formData.country ? 'has-value' : ''}`}
                      >
                        <button
                          type="button"
                          className="add-team-member-country-trigger"
                          onClick={() => setCountryMenuOpen((open) => !open)}
                          aria-expanded={countryMenuOpen}
                          aria-haspopup="listbox"
                          aria-label="Select country"
                        >
                          <span className="add-team-member-country-value">
                            {formData.country || 'Select country'}
                          </span>
                          <ChevronDown size={18} className="add-team-member-country-chevron" aria-hidden />
                        </button>
                        {countryMenuOpen ? (
                          <div className="add-team-member-country-menu" role="listbox" aria-label="Country">
                            {COUNTRY_OPTIONS.map((country) => (
                              <button
                                key={country}
                                type="button"
                                role="option"
                                aria-selected={formData.country === country}
                                className={`add-team-member-country-option ${formData.country === country ? 'is-active' : ''}`}
                                onClick={() => {
                                  handleInputChange('country', country);
                                  setCountryMenuOpen(false);
                                }}
                              >
                                {country}
                              </button>
                            ))}
                            {formData.country && !COUNTRY_OPTIONS.includes(formData.country) ? (
                              <button
                                type="button"
                                role="option"
                                aria-selected
                                className="add-team-member-country-option is-active"
                                onClick={() => setCountryMenuOpen(false)}
                              >
                                {formData.country}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
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
                      <select
                        value={jobData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--white)', cursor: 'pointer' }}
                      >
                        <option value="">Select</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        value={jobData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--white)', cursor: 'pointer' }}
                      >
                        <option value="">Select</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="XRP">XRP</option>
                        <option value="NGN">NGN</option>
                      </select>
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
                    <div className="form-group">
                      <label>Date Joined</label>
                      <input
                        type="date"
                        value={jobData.dateJoined}
                        onChange={(e) => handleInputChange('dateJoined', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div className="form-group form-group-wide">
                      <label>Default Salary Type</label>
                      <select
                        value={jobData.defaultSalaryType}
                        onChange={(e) => handleInputChange('defaultSalaryType', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--white)', cursor: 'pointer' }}
                      >
                        <option value="">Select</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                        <option value="Annual">Annual</option>
                      </select>
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
                        <select
                          value={paymentData.walletType}
                          onChange={(e) => handleInputChange('walletType', e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--white)', cursor: 'pointer' }}
                        >
                          <option value="">Select</option>
                          <option value="XRPL">XRPL</option>
                          <option value="Ethereum">Ethereum</option>
                          <option value="Bitcoin">Bitcoin</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Wallet Address</label>
                        <input
                          type="text"
                          placeholder="Enter wallet address"
                          value={paymentData.walletAddress}
                          onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                          style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Network</label>
                        <input
                          type="text"
                          placeholder="Enter network"
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="submit-next-btn"
                onClick={handleSubmitAndNext}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                type="button"
                className="submit-next-btn"
                onClick={handleSubmitAndNext}
                disabled={isSubmitting}
              >
                <div className="submit-btn-icon-circle">
                  <ArrowRight size={16} />
                </div>
                <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTeamMemberModal;
