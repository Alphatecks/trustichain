import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, CheckCircle, XCircle, AlertCircle, Filter } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';
import './MyEscrows.css';

const MyEscrows = () => {
  const { account, isConnected } = useWeb3();
  const [escrows, setEscrows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real app, this would come from smart contract
  useEffect(() => {
    const mockEscrows = [
      {
        id: '1',
        title: 'Digital Art Purchase',
        amount: '0.5',
        status: 'active',
        buyer: '0x1234...5678',
        seller: '0x8765...4321',
        createdAt: '2024-01-15',
        deadline: '2024-02-15',
        description: 'Purchase of NFT artwork'
      },
      {
        id: '2',
        title: 'Web Development Service',
        amount: '2.0',
        status: 'completed',
        buyer: '0x1111...2222',
        seller: account,
        createdAt: '2024-01-10',
        deadline: '2024-01-25',
        description: 'Full-stack web development project'
      },
      {
        id: '3',
        title: 'Consulting Services',
        amount: '1.5',
        status: 'disputed',
        buyer: account,
        seller: '0x3333...4444',
        createdAt: '2024-01-05',
        deadline: '2024-01-20',
        description: 'Blockchain consulting for 2 weeks'
      },
      {
        id: '4',
        title: 'Smart Contract Audit',
        amount: '3.0',
        status: 'expired',
        buyer: '0x5555...6666',
        seller: account,
        createdAt: '2023-12-20',
        deadline: '2024-01-05',
        description: 'Security audit of DeFi protocol'
      }
    ];

    setTimeout(() => {
      setEscrows(mockEscrows);
      setIsLoading(false);
    }, 1000);
  }, [account]);

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

  const filteredEscrows = escrows.filter(escrow => {
    if (filter === 'all') return true;
    return escrow.status === filter;
  });

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="my-escrows">
        <div className="page-header">
          <h1 className="page-title">My Escrows</h1>
          <p className="page-description">Connect your wallet to view your escrow transactions</p>
        </div>
        <div className="connect-prompt">
          <p>Please connect your wallet to view your escrow transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-escrows">
      <div className="page-header">
        <h1 className="page-title">My Escrows</h1>
        <p className="page-description">
          Manage your escrow transactions and track their status
        </p>
      </div>

      <div className="escrows-controls">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({escrows.length})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({escrows.filter(e => e.status === 'active').length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({escrows.filter(e => e.status === 'completed').length})
          </button>
          <button
            className={`filter-tab ${filter === 'disputed' ? 'active' : ''}`}
            onClick={() => setFilter('disputed')}
          >
            Disputed ({escrows.filter(e => e.status === 'disputed').length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your escrows...</p>
        </div>
      ) : filteredEscrows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Filter />
          </div>
          <h3>No escrows found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't created any escrow transactions yet."
              : `No ${filter} escrows found.`
            }
          </p>
          <Link to="/create" className="create-button">
            Create Your First Escrow
          </Link>
        </div>
      ) : (
        <div className="escrows-grid">
          {filteredEscrows.map((escrow) => (
            <div key={escrow.id} className="escrow-card">
              <div className="escrow-header">
                <div className="escrow-title">
                  <h3>{escrow.title}</h3>
                  <div className={`status-badge ${escrow.status}`}>
                    {getStatusIcon(escrow.status)}
                    <span>{getStatusText(escrow.status)}</span>
                  </div>
                </div>
                <div className="escrow-amount">
                  {escrow.amount} ETH
                </div>
              </div>

              <div className="escrow-content">
                <p className="escrow-description">{escrow.description}</p>
                
                <div className="escrow-details">
                  <div className="detail-row">
                    <span className="detail-label">Buyer:</span>
                    <span className="detail-value">{formatAddress(escrow.buyer)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Seller:</span>
                    <span className="detail-value">{formatAddress(escrow.seller)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(escrow.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Deadline:</span>
                    <span className="detail-value">{formatDate(escrow.deadline)}</span>
                  </div>
                </div>
              </div>

              <div className="escrow-actions">
                <Link 
                  to={`/escrow/${escrow.id}`}
                  className="view-button"
                >
                  <Eye className="button-icon" />
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEscrows;
