import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  CheckCircle,
  Plus,
  Download,
  Clock,
  Coins,
  Calendar,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { getApiUrl } from '../../utils/config';
import toast from 'react-hot-toast';
import '../LoadingIndicator/index.css';

/**
 * Reusable Create Escrow multi-step form used in Dashboard and My Escrow.
 *
 * Props:
 * - isOpen: boolean – controls visibility
 * - onCancel: () => void – called when user closes the modal
 * - onSuccess: (data) => void – called after successful escrow creation
 */
const CreateEscrowForm = ({ isOpen, onCancel, onSuccess }) => {
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
    counterpartyPhone: '',
  });

  const [termsData, setTermsData] = useState({
    releaseType: 'Manual Release',
    expectedCompletionDate: '',
    expectedReleaseDate: '',
    disputeResolutionPeriod: '',
    totalAmount: '',
    escrowFee: '',
    releaseConditions: '',
    milestoneDetails: '',
    milestoneAmount: '',
    milestones: [],
  });

  const [exchangeRate, setExchangeRate] = useState(null); // XRP to USD rate
  const [isCreatingEscrow, setIsCreatingEscrow] = useState(false);
  const [escrowCreationStep, setEscrowCreationStep] = useState('idle'); // 'idle' | 'creating'

  // Fetch exchange rate for XRP to USD conversion (copied from MyEscrow)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const apiUrl = getApiUrl('api/exchange/rates');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result?.success && result?.data?.rates) {
            // Find XRP to USD rate
            const xrpRate = result.data.rates.find(
              (rate) =>
                (rate.from === 'XRP' && rate.to === 'USD') ||
                (rate.fromCurrency === 'XRP' && rate.toCurrency === 'USD'),
            );
            if (xrpRate) {
              setExchangeRate(xrpRate.rate || xrpRate.exchangeRate || 1);
            } else {
              // Fallback to 1 if not found
              setExchangeRate(1);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        // Fallback to 1 if error
        setExchangeRate(1);
      }
    };

    if (isOpen) {
      fetchExchangeRate();
    }
  }, [isOpen]);

  // Map escrow type to industry for API
  const getEscrowTypeMapping = (escrowType) => {
    const mapping = {
      Freelancing: 'Technology',
      'Real Estate': 'Real Estate',
      'Real estate': 'Real Estate',
      'Product purchase': 'Retail',
      Custom: 'Other',
    };
    return mapping[escrowType] || 'Other';
  };

  // Helper function to format date to ISO format
  const formatDateToISO = (dateString) => {
    if (!dateString || dateString.trim() === '') return null;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  // Helper function to format dispute resolution period
  const formatDisputePeriod = (value) => {
    if (!value || value.trim() === '') return null;
    return `${value} days`;
  };

  // Map escrow type to transaction type for API
  const mapEscrowTypeToTransactionType = (escrowType) => {
    const mapping = {
      Freelancing: 'freelance',
      'Real Estate': 'real_estate',
      'Real estate': 'real_estate',
      'Product purchase': 'product_purchase',
      Custom: 'custom',
    };
    return mapping[escrowType] || 'custom';
  };

  const resetFormState = () => {
    setEscrowCreationStep('idle');
    setIsCreatingEscrow(false);
    setCurrentStep(1);
    setSelectedEscrowType('Freelancing');
    setFormData({
      payerWallet: '',
      payerEmail: '',
      payerName: '',
      payerPhone: '',
      counterpartyWallet: '',
      counterpartyEmail: '',
      counterpartyName: '',
      counterpartyPhone: '',
    });
    setTermsData({
      releaseType: 'Manual Release',
      expectedCompletionDate: '',
      expectedReleaseDate: '',
      disputeResolutionPeriod: '',
      totalAmount: '',
      escrowFee: '',
      releaseConditions: '',
      milestoneDetails: '',
      milestoneAmount: '',
      milestones: [],
    });
  };

  // Cleanup when modal closes or component unmounts
  useEffect(() => {
    if (!isOpen) {
      setEscrowCreationStep('idle');
      setIsCreatingEscrow(false);
    }
  }, [isOpen]);

  // Handle create escrow (adapted from MyEscrow, extended with XUMM/Xaman flow)
  const handleCreateEscrow = async () => {
    try {
      setIsCreatingEscrow(true);
      setEscrowCreationStep('creating');

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H1',
          location: 'CreateEscrowForm.js:handleCreateEscrow:entry',
          message: 'Entered handleCreateEscrow',
          data: {
            currentStep,
            releaseType: termsData.releaseType,
            totalAmount: termsData.totalAmount,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      // Validate required fields
      if (!formData.payerWallet || !formData.counterpartyWallet) {
        toast.error('Please fill in all required fields');
        setIsCreatingEscrow(false);
        return;
      }

      if (!termsData.totalAmount) {
        toast.error('Please enter the total amount');
        setIsCreatingEscrow(false);
        return;
      }

      // Validate milestones if release type is Milestones
      if (
        termsData.releaseType === 'Milestones' &&
        (!termsData.milestones || termsData.milestones.length === 0)
      ) {
        toast.error('Please add at least one milestone');
        setIsCreatingEscrow(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        setIsCreatingEscrow(false);
        setEscrowCreationStep('idle');
        return;
      }

      // Map escrow type to transaction type and industry
      const transactionType = mapEscrowTypeToTransactionType(selectedEscrowType);
      const industry = getEscrowTypeMapping(selectedEscrowType);

      // Format dates
      const expectedCompletionDateISO = formatDateToISO(termsData.expectedCompletionDate);
      const expectedReleaseDateISO = formatDateToISO(termsData.expectedReleaseDate);

      // Format dispute resolution period
      const disputeResolutionPeriodFormatted = formatDisputePeriod(
        termsData.disputeResolutionPeriod,
      );

      // Determine description - use milestoneDetails, releaseConditions, or fallback
      const description =
        termsData.milestoneDetails ||
        termsData.releaseConditions ||
        `Escrow for ${selectedEscrowType}`;

      // Build base payload with common fields
      const payload = {
        payerXrpWalletAddress: formData.payerWallet,
        counterpartyXrpWalletAddress: formData.counterpartyWallet,
        amount: parseFloat(termsData.totalAmount),
        currency: 'XRP',
        transactionType: transactionType,
        industry: industry,
        description: description,
        payerEmail: formData.payerEmail || '',
        payerName: formData.payerName || '',
        counterpartyEmail: formData.counterpartyEmail || '',
        counterpartyName: formData.counterpartyName || '',
        releaseType: termsData.releaseType,
        totalAmount: parseFloat(termsData.totalAmount),
      };

      // Add date fields if provided
      if (expectedCompletionDateISO) {
        payload.expectedCompletionDate = expectedCompletionDateISO;
      }

      if (disputeResolutionPeriodFormatted) {
        payload.disputeResolutionPeriod = disputeResolutionPeriodFormatted;
      }

      // Add release type specific fields
      if (termsData.releaseType === 'Time based') {
        if (expectedReleaseDateISO) {
          payload.expectedReleaseDate = expectedReleaseDateISO;
        }
        if (termsData.releaseConditions) {
          payload.releaseConditions = termsData.releaseConditions;
        }
      } else if (termsData.releaseType === 'Manual Release') {
        if (termsData.releaseConditions) {
          payload.releaseConditions = termsData.releaseConditions;
        }
      } else if (termsData.releaseType === 'Milestones') {
        // Format milestones array
        if (termsData.milestones && termsData.milestones.length > 0) {
          payload.milestones = termsData.milestones.map((milestone) => ({
            milestoneDetails: milestone.details,
            milestoneAmount: parseFloat(milestone.amount),
          }));
        }
      }

      // Make API call
      const apiUrl = getApiUrl('api/escrow/create');
      console.log('Creating escrow:', apiUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('API Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('API Response data:', result);

        if (result?.success) {
          const responseData = result.data || {};
          const {
            xummUrl,
            xummUuid,
            escrowId,
            xrplTxHash,
            escrow,
            xrplEscrowId,
            cancelled,
            expired,
          } = responseData;

          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: 'debug-session',
              runId: 'pre-fix',
              hypothesisId: 'H2',
              location: 'CreateEscrowForm.js:handleCreateEscrow:response',
              message: 'Escrow create response summary',
              data: {
                hasXummUrl: !!xummUrl,
                hasEscrowId: !!escrowId,
                hasXrplTxHash: !!xrplTxHash,
                escrowStatus: escrow?.status || null,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion

          // Snapshot amount & rate at creation time so UI doesn't drift during polling
          const totalAmountNumber = parseFloat(termsData.totalAmount);
          const effectiveRate = exchangeRate || 1;

          // Helper to build createdEscrow object in a consistent way
          const buildCreatedEscrow = (escrowSource) => {
            const base = escrowSource || {};
            return {
              ...base,
              // Ensure xrplEscrowId is preserved even if nested differently
              xrplEscrowId:
                base.xrplEscrowId ||
                base.xrpl_escrow_id ||
                xrplEscrowId ||
                responseData.xrpl_escrow_id,
              amount: termsData.totalAmount,
              amountUsd: (totalAmountNumber * effectiveRate).toFixed(2),
            };
          };

          // Case 1: Backend already created and activated XRPL escrow (no XUMM needed)
          if (
            xrplTxHash &&
            (escrow?.status === 'active' || escrow?.status === 'ACTIVE')
          ) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: 'debug-session',
                runId: 'pre-fix',
                hypothesisId: 'H3',
                location: 'CreateEscrowForm.js:handleCreateEscrow:case1',
                message: 'Taking immediate XRPL success branch (no XUMM)',
                data: {
                  hasXrplTxHash: !!xrplTxHash,
                  escrowStatus: escrow?.status || null,
                },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion

            const createdEscrow = buildCreatedEscrow(escrow || responseData);

            toast.success('Escrow created successfully!');

            if (onSuccess) {
              onSuccess(createdEscrow);
            }

            // Reset form and close
            resetFormState();
            if (onCancel) {
              onCancel();
            }
            return;
          }

          // Case 2: XUMM/Xaman signing flow - open URL if provided (backend handles the rest)
          if (xummUrl && escrowId) {
            console.log('Xaman signing URL provided. Escrow ID:', escrowId);

            // Open XUMM/Xaman signing URL
            window.open(xummUrl, '_blank');

            // Backend handles the rest, so we can treat this as success
            // The escrow will be created once signed in Xaman
            toast.success('Escrow creation initiated. Please sign in your Xaman wallet.', {
              id: 'create-escrow',
            });

            // If escrow data is already available, use it
            if (escrow) {
              const createdEscrow = buildCreatedEscrow(escrow);
              if (onSuccess) {
                onSuccess(createdEscrow);
              }
            }

            resetFormState();
            if (onCancel) {
              onCancel();
            }
            return;
          }

          // Case 3: Unexpected response shape
          console.error(
            'Unexpected escrow create response. Missing xrplTxHash or xummUrl/escrowId.',
            responseData,
          );
          toast.error(
            'Failed to start escrow creation signing flow. Please try again.',
          );
        } else {
          toast.error(result?.message || 'Failed to create escrow');
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error response:', errorData);
        console.error('Response status:', response.status);
        toast.error(errorData?.message || errorData?.error || 'Failed to create escrow');
      }
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error('An error occurred while creating escrow');
    } finally {
      // Reset flags if not in creating state
      if (escrowCreationStep !== 'creating') {
        setIsCreatingEscrow(false);
        setEscrowCreationStep('idle');
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'pre-fix',
          hypothesisId: 'H6',
          location: 'CreateEscrowForm.js:handleCreateEscrow:finally',
          message: 'handleCreateEscrow finally block executed',
          data: {
            escrowCreationStep,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
  };

  const handleCloseModal = () => {
    resetFormState();
    if (onCancel) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header - Mobile with back icon */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Create Escrow</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator - Mobile Card Style */}
        <div className="create-escrow-steps-mobile">
          {currentStep === 1 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <CreditCard size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 1/3</span>
                <span className="step-title-mobile">Type/ Counterparty</span>
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="step-indicator-mobile active">
              <div className="step-icon-mobile">
                <FileText size={20} />
              </div>
              <div className="step-content-mobile">
                <span className="step-number-mobile">Step 2/3</span>
                <span className="step-title-mobile">Terms</span>
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
                <span className="step-title-mobile">Confirmation</span>
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
              {currentStep > 1 ? <CheckCircle size={20} /> : <CreditCard size={20} />}
            </div>
            <div className="step-content">
              <span className="step-number">Step 1/3</span>
              <span className="step-title">Type/ Counterparty</span>
            </div>
          </div>
          <div className="step-divider"></div>
          <div
            className={`step-indicator ${
              currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''
            }`}
          >
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
                <h3 className="section-title">Escrow Terms</h3>
                <div className="escrow-type-buttons">
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Freelancing' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Freelancing')}
                  >
                    {selectedEscrowType === 'Freelancing' && <CheckCircle size={18} />}
                    {selectedEscrowType !== 'Freelancing' && <Plus size={18} />}
                    Freelancing
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Real Estate' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Real Estate')}
                  >
                    {selectedEscrowType === 'Real Estate' ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    Real Estate
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Product purchase' ? 'active' : ''
                    }`}
                    onClick={() => setSelectedEscrowType('Product purchase')}
                  >
                    {selectedEscrowType === 'Product purchase' ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    Product purchase
                  </button>
                  <button
                    type="button"
                    className={`escrow-type-btn ${
                      selectedEscrowType === 'Custom' ? 'active' : ''
                    }`}
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
                      <label>
                        Payers (You) XRP Wallet Address <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="••••••••••••••••"
                        value={formData.payerWallet}
                        onChange={(e) =>
                          setFormData({ ...formData, payerWallet: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Your Email</label>
                      <input
                        type="email"
                        placeholder="Enter your Email"
                        value={formData.payerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, payerEmail: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>
                        Counterparty XRP Wallet Address <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="••••••••••••••••"
                        value={formData.counterpartyWallet}
                        onChange={(e) =>
                          setFormData({ ...formData, counterpartyWallet: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="Enter your Email"
                        value={formData.counterpartyEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, counterpartyEmail: e.target.value })
                        }
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
                        onChange={(e) =>
                          setFormData({ ...formData, payerName: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Your Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter your Number"
                        value={formData.payerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, payerPhone: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={formData.counterpartyName}
                        onChange={(e) =>
                          setFormData({ ...formData, counterpartyName: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter your Number"
                        value={formData.counterpartyPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, counterpartyPhone: e.target.value })
                        }
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
                    className={`release-type-btn ${
                      termsData.releaseType === 'Manual Release' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setTermsData({ ...termsData, releaseType: 'Manual Release' })
                    }
                  >
                    <Download size={18} />
                    Manual Release
                  </button>
                  <button
                    type="button"
                    className={`release-type-btn ${
                      termsData.releaseType === 'Time based' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setTermsData({ ...termsData, releaseType: 'Time based' })
                    }
                  >
                    <Clock size={18} />
                    Time based
                  </button>
                  <button
                    type="button"
                    className={`release-type-btn ${
                      termsData.releaseType === 'Milestones' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setTermsData({ ...termsData, releaseType: 'Milestones' })
                    }
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
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              expectedCompletionDate: e.target.value,
                            })
                          }
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Dispute Resolution Period</label>
                      <div className="select-input-wrapper">
                        <select
                          value={termsData.disputeResolutionPeriod}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              disputeResolutionPeriod: e.target.value,
                            })
                          }
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
                        onChange={(e) =>
                          setTermsData({ ...termsData, totalAmount: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group form-group-full">
                      <label>Release Conditions</label>
                      <textarea
                        placeholder="Enter details"
                        value={termsData.releaseConditions}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            releaseConditions: e.target.value,
                          })
                        }
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
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              expectedCompletionDate: e.target.value,
                            })
                          }
                        />
                        <Calendar size={18} className="input-icon" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Dispute Resolution Period</label>
                      <div className="select-input-wrapper">
                        <select
                          value={termsData.disputeResolutionPeriod}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              disputeResolutionPeriod: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              expectedReleaseDate: e.target.value,
                            })
                          }
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
                        onChange={(e) =>
                          setTermsData({ ...termsData, totalAmount: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Release Conditions</label>
                      <textarea
                        placeholder="Enter details"
                        value={termsData.releaseConditions}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            releaseConditions: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setTermsData({ ...termsData, totalAmount: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Milestone amount</label>
                      <input
                        type="text"
                        placeholder="Enter amount"
                        value={termsData.milestoneAmount}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            milestoneAmount: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Milestone details</label>
                      <input
                        type="text"
                        placeholder="Enter milestone details"
                        value={termsData.milestoneDetails}
                        onChange={(e) =>
                          setTermsData({
                            ...termsData,
                            milestoneDetails: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Dispute Resolution Period</label>
                      <div className="select-input-wrapper">
                        <select
                          value={termsData.disputeResolutionPeriod}
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              disputeResolutionPeriod: e.target.value,
                            })
                          }
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
                          onChange={(e) =>
                            setTermsData({
                              ...termsData,
                              expectedCompletionDate: e.target.value,
                            })
                          }
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
                              amount: termsData.milestoneAmount,
                            };
                            setTermsData({
                              ...termsData,
                              milestones: [...termsData.milestones, newMilestone],
                              milestoneDetails: '',
                              milestoneAmount: '',
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
              {/* Escrow Type and Terms Section - Side by Side */}
              <div
                className="escrow-form-section"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}
              >
                {/* Escrow Type Section */}
                <div>
                  <h3 className="section-title">Escrow Type</h3>
                  <div className="escrow-type-buttons">
                    <button type="button" className="escrow-type-btn active" disabled>
                      <CheckCircle size={18} />
                      {selectedEscrowType}
                    </button>
                  </div>
                </div>

                {/* Escrow Terms Section */}
                <div>
                  <h3 className="section-title">Escrow Terms</h3>
                  <div className="release-type-buttons">
                    <button type="button" className="release-type-btn active" disabled>
                      {termsData.releaseType === 'Time based' && <Clock size={18} />}
                      {termsData.releaseType === 'Milestones' && <Coins size={18} />}
                      {termsData.releaseType === 'Manual Release' && <Download size={18} />}
                      {termsData.releaseType}
                    </button>
                  </div>
                </div>
              </div>

              {/* Escrow Counterparty Section */}
              <div className="escrow-form-section" style={{ marginTop: 0 }}>
                <h3 className="section-title">Escrow Counterparty</h3>
                <div className="counterparty-form-grid">
                  {/* Left Column - Counterparty Information */}
                  <div className="form-column">
                    <div className="form-group">
                      <label>
                        Counterparty XRP Wallet Address <span className="required">*</span>
                      </label>
                      <div
                        style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                      >
                        {formData.counterpartyWallet || '—'}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <div
                        style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                      >
                        {formData.counterpartyEmail || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Names and Phone Numbers */}
                  <div className="form-column">
                    <div className="form-group">
                      <label>Name</label>
                      <div
                        style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                      >
                        {formData.counterpartyName || '—'}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <div
                        style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}
                      >
                        {formData.counterpartyPhone || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escrow Details Section */}
              <div className="escrow-form-section">
                <h3 className="section-title">Escrow Details</h3>
                <div className="terms-form-grid">
                  <div className="form-group">
                    <label>Expected Completion Date</label>
                    <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                      {termsData.expectedCompletionDate || '—'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Dispute Resolution Period</label>
                    <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                      {termsData.disputeResolutionPeriod
                        ? `${termsData.disputeResolutionPeriod} days`
                        : '—'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontWeight: 'bold', color: '#0066FF' }}>Escrow Fee</label>
                    <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                      {termsData.totalAmount
                        ? `${(
                            parseFloat(termsData.totalAmount) * 0.05
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} XRP`
                        : '—'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Total Payment</label>
                    <div style={{ padding: '0.75rem 0', fontSize: '0.95rem', color: 'inherit' }}>
                      {termsData.totalAmount ? `${termsData.totalAmount} XRP` : '—'}
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
              className="previous-btn"
              onClick={() => setCurrentStep(2)}
            >
              <div className="previous-btn-icon-circle">
                <ArrowLeft size={16} />
              </div>
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="submit-next-btn"
              onClick={handleCreateEscrow}
              disabled={isCreatingEscrow}
            >
              <div className="submit-btn-icon-circle">
                {isCreatingEscrow ? (
                  <div
                    className="loading-spinner"
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                    }}
                  ></div>
                ) : (
                  <CheckCircle size={16} />
                )}
              </div>
              <span>
                {isCreatingEscrow ? 'Creating...' : 'Confirm'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEscrowForm;

