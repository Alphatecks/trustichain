import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, FileText, Calendar, Shield } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import toast from 'react-hot-toast';
import './CreateEscrow.css';

const CreateEscrow = () => {
  const navigate = useNavigate();
  const { isConnected, account } = useWeb3();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    buyerAddress: '',
    sellerAddress: '',
    arbitratorAddress: '',
    deadline: '',
    terms: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.title || !formData.amount || !formData.buyerAddress || !formData.sellerAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate smart contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Escrow created successfully!');
      navigate('/my-escrows');
    } catch (error) {
      console.error('Error creating escrow:', error);
      toast.error('Failed to create escrow');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="create-escrow">
        <div className="page-header">
          <button onClick={() => navigate('/')} className="back-button">
            <ArrowLeft className="back-icon" />
            Back to Home
          </button>
          <h1 className="page-title">Create New Escrow</h1>
        </div>
        
        <div className="connect-wallet-prompt">
          <Shield className="prompt-icon" />
          <h2>Connect Your Wallet</h2>
          <p>You need to connect your wallet to create an escrow transaction.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="connect-button"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-escrow">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          <ArrowLeft className="back-icon" />
          Back to Home
        </button>
        <h1 className="page-title">Create New Escrow</h1>
        <p className="page-description">
          Create a secure escrow transaction protected by smart contracts
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="escrow-form">
          <div className="form-section">
            <h3 className="section-title">
              <FileText className="section-icon" />
              Transaction Details
            </h3>
            
            <div className="form-group">
              <label htmlFor="title">Transaction Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Purchase of Digital Art"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the transaction details..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (ETH) *</label>
              <div className="input-with-icon">
                <DollarSign className="input-icon" />
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.1"
                  step="0.001"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <User className="section-icon" />
              Participants
            </h3>
            
            <div className="form-group">
              <label htmlFor="buyerAddress">Buyer Address *</label>
              <input
                type="text"
                id="buyerAddress"
                name="buyerAddress"
                value={formData.buyerAddress}
                onChange={handleInputChange}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sellerAddress">Seller Address *</label>
              <input
                type="text"
                id="sellerAddress"
                name="sellerAddress"
                value={formData.sellerAddress}
                onChange={handleInputChange}
                placeholder="0x..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="arbitratorAddress">Arbitrator Address (Optional)</label>
              <input
                type="text"
                id="arbitratorAddress"
                name="arbitratorAddress"
                value={formData.arbitratorAddress}
                onChange={handleInputChange}
                placeholder="0x... (leave empty for no arbitrator)"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">
              <Calendar className="section-icon" />
              Terms & Conditions
            </h3>
            
            <div className="form-group">
              <label htmlFor="deadline">Deadline (days)</label>
              <input
                type="number"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
                max="365"
              />
            </div>

            <div className="form-group">
              <label htmlFor="terms">Terms & Conditions</label>
              <textarea
                id="terms"
                name="terms"
                value={formData.terms}
                onChange={handleInputChange}
                placeholder="Define the conditions for releasing funds..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              {isLoading ? 'Creating...' : 'Create Escrow'}
            </button>
          </div>
        </form>

        <div className="form-info">
          <div className="info-card">
            <Shield className="info-icon" />
            <h4>Security Features</h4>
            <ul>
              <li>Funds locked in smart contract</li>
              <li>Multi-signature release mechanism</li>
              <li>Arbitrator dispute resolution</li>
              <li>Automatic refund on deadline</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEscrow;
