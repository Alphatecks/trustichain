import React from 'react';
import { BusinessSuiteDashboardSkeleton } from '../DashboardSkeletons';
import './index.css';

const BusinessSuiteLoader = () => {
  return (
    <div className="business-suite-loader-overlay" aria-busy="true" aria-live="polite">
      <BusinessSuiteDashboardSkeleton />
    </div>
  );
};

export default BusinessSuiteLoader;
