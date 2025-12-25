import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Transactions from '../transactions/Transactions';

// Savings component - simply renders Transactions which will show savings screen
// when route is /savings
const Savings = () => {
  const location = useLocation();
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/a00a5740-ea9a-4e7a-a021-4868da9e4ca2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Savings.js:12',message:'Savings component mounted',data:{pathname:location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  }, [location.pathname]);
  // #endregion
  
  return <Transactions />;
};

export default Savings;

