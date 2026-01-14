import React from 'react';
import './index.css';

const TransactionSummaryModal = ({ open, onClose, transaction }) => {
  if (!open || !transaction) return null;

  return (
    <div className="ts-modal-overlay">
      <div className="ts-modal">
        <button className="ts-modal-close" onClick={onClose}>&times;</button>
        <h2>Transaction Summary</h2>
        <div className="ts-modal-content">
          <div><strong>ID:</strong> {transaction.id || 'N/A'}</div>
          <div><strong>Type:</strong> {transaction.type || 'N/A'}</div>
          <div><strong>Status:</strong> {transaction.status || 'N/A'}</div>
          <div><strong>Date:</strong> {transaction.date || 'N/A'}</div>
          <div><strong>Amount:</strong> {transaction.amount ? (typeof transaction.amount === 'object' ? JSON.stringify(transaction.amount) : transaction.amount) : 'N/A'}</div>
          {/* Add more fields as needed */}
        </div>
      </div>
    </div>
  );
};

export default TransactionSummaryModal;
