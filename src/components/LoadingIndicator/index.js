import React from 'react';
import './index.css';

const LoadingIndicator = ({ size = 'md' }) => {
  return (
    <span className={`loading-indicator loading-indicator-${size}`} aria-label="Loading" role="status">
      <span className="loading-indicator-dot" />
      <span className="loading-indicator-dot" />
      <span className="loading-indicator-dot" />
    </span>
  );
};

export default LoadingIndicator;
