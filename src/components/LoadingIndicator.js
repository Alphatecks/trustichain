import React from 'react';
import './LoadingIndicator.css';

const LoadingIndicator = ({ size = 'md' }) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoadingIndicator.js:6',message:'LoadingIndicator rendered',data:{size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return (
    <span className={`loading-indicator loading-indicator-${size}`} aria-label="Loading" role="status">
      <span className="loading-indicator-dot" />
      <span className="loading-indicator-dot" />
      <span className="loading-indicator-dot" />
    </span>
  );
};

export default LoadingIndicator;
