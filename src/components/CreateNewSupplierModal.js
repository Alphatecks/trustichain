import React, { useState } from 'react';
import { X, Calendar, Info, Download, Clock, ChevronDown } from 'lucide-react';
import './LoadingIndicator.css';
import './CreateNewSupplierModal.css';

const CreateNewSupplierModal = ({ isOpen, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [supplierName, setSupplierName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('24,567.89');
  const [accountType, setAccountType] = useState('bank'); // 'bank' or 'wallet'
  const [walletType, setWalletType] = useState('');
  const [showWalletTypeDropdown, setShowWalletTypeDropdown] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [supplyDate, setSupplyDate] = useState('00/00/00');
  const [currency, setCurrency] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [bankName, setBankName] = useState('');
  const [showBankNameDropdown, setShowBankNameDropdown] = useState(false);
  const [accountName, setAccountName] = useState('');

  const handleCloseModal = () => {
    setStep(1);
    setSupplierName('');
    setDueDate('');
    setAmount('24,567.89');
    setAccountType('bank');
    setWalletType('');
    setWalletAddress('');
    setSupplyDate('00/00/00');
    setShowWalletTypeDropdown(false);
    setCurrency('');
    setBankName('');
    setAccountName('');
    setShowCurrencyDropdown(false);
    setShowBankNameDropdown(false);
    onCancel();
  };

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    onSuccess({
      supplierName,
      dueDate,
      amount,
      accountType,
      walletType,
      walletAddress,
      supplyDate,
      currency,
      bankName,
      accountName
    });
    handleCloseModal();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="create-escrow-modal-overlay" onClick={handleCloseModal}>
      <div className="create-escrow-modal create-new-supplier-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Modal Header */}
        <div className="create-escrow-modal-header">
          <div className="modal-header-back-icon"></div>
          <h2>Create New Supplier</h2>
          <button type="button" className="modal-close-btn" onClick={handleCloseModal}>
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="create-escrow-modal-content" style={{ padding: '2rem' }}>
          {step === 1 ? (
            <div className="create-supplier-section">
              {/* Supplier Name Input */}
              <div className="create-supplier-field">
                <label className="create-supplier-label">Supplier name</label>
                <input
                  type="text"
                  className="create-supplier-input"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>

              {/* Due Date Input */}
              <div className="create-supplier-field">
                <label className="create-supplier-label">Due Date</label>
                <div className="create-supplier-date-wrapper">
                  <input
                    type="text"
                    className="create-supplier-date-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="00/00/00"
                  />
                  <Calendar size={18} className="create-supplier-calendar-icon" />
                </div>
              </div>

              {/* Amount Display Section */}
              <div className="create-supplier-amount-section">
                <label className="create-supplier-amount-label">Amount</label>
                <div className="create-supplier-amount-display">
                  <div className="create-supplier-amount-value">${amount}</div>
                  <div className="create-supplier-balance-text">Balance: 24,567.89</div>
                </div>
              </div>

              {/* Next Button */}
              <button 
                type="button"
                className="create-supplier-next-btn"
                onClick={handleNextStep1}
              >
                Next
              </button>

              {/* Info Message */}
              <div className="create-supplier-info">
                <Info size={16} />
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          ) : (
            <div className="create-supplier-section">
              {/* Account Type Selection */}
              <div className="create-supplier-field">
                <label className="create-supplier-label create-supplier-label-blue">Account Type</label>
                <div className="create-supplier-account-type-buttons">
                  <button
                    type="button"
                    className={`create-supplier-account-type-btn ${accountType === 'bank' ? 'active' : ''}`}
                    onClick={() => {
                      setAccountType('bank');
                      setShowWalletTypeDropdown(false);
                      setShowCurrencyDropdown(false);
                      setShowBankNameDropdown(false);
                    }}
                  >
                    <Download size={18} />
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    className={`create-supplier-account-type-btn ${accountType === 'wallet' ? 'active' : ''}`}
                    onClick={() => {
                      setAccountType('wallet');
                      setShowCurrencyDropdown(false);
                      setShowBankNameDropdown(false);
                    }}
                  >
                    <Clock size={18} />
                    Wallet Transfer
                  </button>
                </div>
              </div>

              {accountType === 'bank' ? (
                <>
                  {/* Currency */}
                  <div className="create-supplier-field">
                    <label className="create-supplier-label">Currency</label>
                    <div className="create-supplier-dropdown-wrapper">
                      <button
                        type="button"
                        className="create-supplier-dropdown-btn"
                        onClick={() => {
                          setShowCurrencyDropdown(!showCurrencyDropdown);
                          setShowBankNameDropdown(false);
                        }}
                      >
                        <span>{currency || 'Select'}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showCurrencyDropdown && (
                        <div className="create-supplier-dropdown">
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setCurrency('USD');
                              setShowCurrencyDropdown(false);
                            }}
                          >
                            USD
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setCurrency('EUR');
                              setShowCurrencyDropdown(false);
                            }}
                          >
                            EUR
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setCurrency('GBP');
                              setShowCurrencyDropdown(false);
                            }}
                          >
                            GBP
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setCurrency('NGN');
                              setShowCurrencyDropdown(false);
                            }}
                          >
                            NGN
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Name */}
                  <div className="create-supplier-field">
                    <label className="create-supplier-label">Bank Name</label>
                    <div className="create-supplier-dropdown-wrapper">
                      <button
                        type="button"
                        className="create-supplier-dropdown-btn"
                        onClick={() => {
                          setShowBankNameDropdown(!showBankNameDropdown);
                          setShowCurrencyDropdown(false);
                        }}
                      >
                        <span>{bankName || 'Select'}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showBankNameDropdown && (
                        <div className="create-supplier-dropdown">
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setBankName('Chase Bank');
                              setShowBankNameDropdown(false);
                            }}
                          >
                            Chase Bank
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setBankName('Bank of America');
                              setShowBankNameDropdown(false);
                            }}
                          >
                            Bank of America
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setBankName('Wells Fargo');
                              setShowBankNameDropdown(false);
                            }}
                          >
                            Wells Fargo
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setBankName('Citibank');
                              setShowBankNameDropdown(false);
                            }}
                          >
                            Citibank
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="create-supplier-field">
                    <label className="create-supplier-label">Account Name</label>
                    <input
                      type="text"
                      className="create-supplier-input"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Enter account name"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Wallet Type */}
                  <div className="create-supplier-field">
                    <label className="create-supplier-label">Wallet Type</label>
                    <div className="create-supplier-dropdown-wrapper">
                      <button
                        type="button"
                        className="create-supplier-dropdown-btn"
                        onClick={() => {
                          setShowWalletTypeDropdown(!showWalletTypeDropdown);
                          setShowCurrencyDropdown(false);
                          setShowBankNameDropdown(false);
                        }}
                      >
                        <span>{walletType || 'Select'}</span>
                        <ChevronDown size={16} />
                      </button>
                      {showWalletTypeDropdown && (
                        <div className="create-supplier-dropdown">
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setWalletType('XRP wallet');
                              setShowWalletTypeDropdown(false);
                            }}
                          >
                            XRP wallet
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setWalletType('USDT wallet');
                              setShowWalletTypeDropdown(false);
                            }}
                          >
                            USDT wallet
                          </button>
                          <button
                            type="button"
                            className="create-supplier-dropdown-item"
                            onClick={() => {
                              setWalletType('USD wallet');
                              setShowWalletTypeDropdown(false);
                            }}
                          >
                            USD wallet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Wallet Address */}
                  <div className="create-supplier-field">
                    <label className="create-supplier-label">Wallet Address</label>
                    <div className="create-supplier-wallet-address-wrapper">
                      <input
                        type="text"
                        className="create-supplier-input"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter Wallet address"
                      />
                      <ChevronDown size={16} className="create-supplier-chevron-icon" />
                    </div>
                  </div>

                  {/* Supply Date */}
                  <div className="create-supplier-field">
                    <label className="create-supplier-label">Supply Date</label>
                    <div className="create-supplier-date-wrapper">
                      <input
                        type="text"
                        className="create-supplier-date-input"
                        value={supplyDate}
                        onChange={(e) => setSupplyDate(e.target.value)}
                        placeholder="00/00/00"
                      />
                      <Calendar size={18} className="create-supplier-calendar-icon" />
                    </div>
                  </div>
                </>
              )}

              {/* Next Button */}
              <button 
                type="button"
                className="create-supplier-next-btn"
                onClick={handleNextStep2}
              >
                Next
              </button>

              {/* Info Message */}
              <div className="create-supplier-info">
                <Info size={16} />
                <span>Your funds will be added to your account within seconds or refunded if there's an issue.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateNewSupplierModal;
