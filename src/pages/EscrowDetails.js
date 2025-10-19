import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, User, DollarSign, Calendar, FileText, Shield } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import toast from 'react-hot-toast';
import './EscrowDetails.css';

const EscrowDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, isConnected, signer } = useWeb3();
  const [escrow, setEscrow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock escrow data - in real app, this would come from smart contract
  useEffect(() => {
    const mockEscrow = {
      id: id,
      title: 'Digital Art Purchase',
      description: 'Purchase of exclusive NFT artwork from renowned digital artist',
      amount: '0.5',
      status: 'active',
      buyer: '0x1234567890123456789012345678901234567890',
      seller: '0x9876543210987654321098765432109876543210',
      arbitrator: '0x1111111111111111111111111111111111111111',
      createdAt: '2024-01-15T10:30:00Z',
      deadline: '2024-02-15T10:30:00Z',
      terms: 'The buyer will receive the NFT artwork upon payment confirmation. The seller guarantees authenticity and ownership rights.',
      disputeReason: '',
      isBuyer: account === '0x1234567890123456789012345678901234567890',
      isSeller: account === '0x9876543210987654321098765432109876543210',
      isArbitrator: account === '0x1111111111111111111111111111111111111111',
      canRelease: false,
      canDispute: true,
      canArbitrate: false
    };

    setTimeout(() => {
      setEscrow(mockEscrow);
      setIsLoading(false);
    }, 1000);
  }, [id, account]);

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Clock className="status-icon active" />;
      case 'completed':
        return <CheckCircle className="status-icon completed" />;
      case 'disputed':
        return <AlertCircle className="status-icon disputed" />;
      case 'expired':
        return <XCircle className="status-icon expired" />;
      default:
        return <Clock className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleReleaseFunds = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate smart contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Funds released successfully!');
      // Update escrow status
      setEscrow(prev => ({ ...prev, status: 'completed' }));
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispute = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate smart contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Dispute initiated successfully!');
      // Update escrow status
      setEscrow(prev => ({ ...prev, status: 'disputed' }));
    } catch (error) {
      console.error('Error initiating dispute:', error);
      toast.error('Failed to initiate dispute');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArbitrate = async (decision) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate smart contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Arbitration decision: ${decision}`);
      // Update escrow status
      setEscrow(prev => ({ ...prev, status: decision === 'release' ? 'completed' : 'expired' }));
    } catch (error) {
      console.error('Error arbitrating:', error);
      toast.error('Failed to arbitrate');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="escrow-details">
        <div className="page-header">
          <button onClick={() => navigate('/my-escrows')} className="back-button">
            <ArrowLeft className="back-icon" />
            Back to My Escrows
          </button>
          <h1 className="page-title">Escrow Details</h1>
        </div>
        <div className="connect-prompt">
          <p>Please connect your wallet to view escrow details.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="escrow-details">
        <div className="page-header">
          <button onClick={() => navigate('/my-escrows')} className="back-button">
            <ArrowLeft className="back-icon" />
            Back to My Escrows
          </button>
          <h1 className="page-title">Escrow Details</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading escrow details...</p>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="escrow-details">
        <div className="page-header">
          <button onClick={() => navigate('/my-escrows')} className="back-button">
            <ArrowLeft className="back-icon" />
            Back to My Escrows
          </button>
          <h1 className="page-title">Escrow Details</h1>
        </div>
        <div className="error-state">
          <p>Escrow not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="escrow-details">
      <div className="page-header">
        <button onClick={() => navigate('/my-escrows')} className="back-button">
          <ArrowLeft className="back-icon" />
          Back to My Escrows
        </button>
        <h1 className="page-title">{escrow.title}</h1>
        <div className={`status-badge ${escrow.status}`}>
          {getStatusIcon(escrow.status)}
          <span>{getStatusText(escrow.status)}</span>
        </div>
      </div>

      <div className="details-container">
        <div className="details-main">
          <div className="info-section">
            <h3 className="section-title">
              <FileText className="section-icon" />
              Transaction Information
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Amount</label>
                <div className="info-value">
                  <DollarSign className="value-icon" />
                  {escrow.amount} ETH
                </div>
              </div>
              <div className="info-item">
                <label>Created</label>
                <div className="info-value">
                  <Calendar className="value-icon" />
                  {formatDate(escrow.createdAt)}
                </div>
              </div>
              <div className="info-item">
                <label>Deadline</label>
                <div className="info-value">
                  <Calendar className="value-icon" />
                  {formatDate(escrow.deadline)}
                </div>
              </div>
            </div>
          </div>

          <div className="participants-section">
            <h3 className="section-title">
              <User className="section-icon" />
              Participants
            </h3>
            <div className="participants-grid">
              <div className="participant">
                <label>Buyer</label>
                <div className="participant-address">
                  {formatAddress(escrow.buyer)}
                  {escrow.isBuyer && <span className="you-badge">You</span>}
                </div>
              </div>
              <div className="participant">
                <label>Seller</label>
                <div className="participant-address">
                  {formatAddress(escrow.seller)}
                  {escrow.isSeller && <span className="you-badge">You</span>}
                </div>
              </div>
              <div className="participant">
                <label>Arbitrator</label>
                <div className="participant-address">
                  {formatAddress(escrow.arbitrator)}
                  {escrow.isArbitrator && <span className="you-badge">You</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="terms-section">
            <h3 className="section-title">
              <Shield className="section-icon" />
              Terms & Conditions
            </h3>
            <div className="terms-content">
              <p>{escrow.terms}</p>
            </div>
          </div>

          {escrow.status === 'disputed' && (
            <div className="dispute-section">
              <h3 className="section-title">
                <AlertCircle className="section-icon" />
                Dispute Information
              </h3>
              <div className="dispute-content">
                <p>This escrow is currently under dispute. An arbitrator will review the case and make a decision.</p>
                {escrow.isArbitrator && (
                  <div className="arbitration-actions">
                    <button
                      onClick={() => handleArbitrate('release')}
                      disabled={isProcessing}
                      className="arbitrate-button release"
                    >
                      Release Funds to Seller
                    </button>
                    <button
                      onClick={() => handleArbitrate('refund')}
                      disabled={isProcessing}
                      className="arbitrate-button refund"
                    >
                      Refund to Buyer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="details-sidebar">
          <div className="action-card">
            <h4>Actions</h4>
            <div className="action-buttons">
              {escrow.status === 'active' && escrow.canRelease && (
                <button
                  onClick={handleReleaseFunds}
                  disabled={isProcessing}
                  className="action-button primary"
                >
                  {isProcessing ? 'Processing...' : 'Release Funds'}
                </button>
              )}
              
              {escrow.status === 'active' && escrow.canDispute && (
                <button
                  onClick={handleDispute}
                  disabled={isProcessing}
                  className="action-button warning"
                >
                  {isProcessing ? 'Processing...' : 'Initiate Dispute'}
                </button>
              )}
            </div>
          </div>

          <div className="status-card">
            <h4>Status Information</h4>
            <div className="status-info">
              <div className="status-item">
                <span className="status-label">Current Status:</span>
                <span className={`status-value ${escrow.status}`}>
                  {getStatusText(escrow.status)}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Your Role:</span>
                <span className="status-value">
                  {escrow.isBuyer ? 'Buyer' : escrow.isSeller ? 'Seller' : escrow.isArbitrator ? 'Arbitrator' : 'Observer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowDetails;
