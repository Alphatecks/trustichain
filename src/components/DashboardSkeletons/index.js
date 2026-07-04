import React from 'react';
import './index.css';

export function DashboardSkeletonBlock({ className = '', style }) {
  return <span className={`dashboard-skeleton-block ${className}`.trim()} style={style} aria-hidden />;
}

export function DashboardBalanceSkeleton({ mobile = false }) {
  return (
    <div
      className={`dashboard-balance-skeleton${mobile ? ' dashboard-balance-skeleton--mobile' : ''}`}
      aria-busy="true"
      aria-live="polite"
    >
      <DashboardSkeletonBlock className="dashboard-skeleton-balance-primary" />
      <DashboardSkeletonBlock className="dashboard-skeleton-balance-secondary" />
    </div>
  );
}

export function DashboardMetricValuesSkeleton({
  mobile = false,
  inline = false,
  withSubvalue = true,
  wideSubvalue = false,
}) {
  return (
    <div
      className={`dashboard-metric-values-skeleton${mobile ? ' dashboard-metric-values-skeleton--mobile' : ''}${inline ? ' dashboard-metric-values-skeleton--inline' : ''}`}
      aria-busy="true"
      aria-live="polite"
    >
      <DashboardSkeletonBlock className="dashboard-skeleton-metric-value" />
      {withSubvalue ? (
        <DashboardSkeletonBlock
          className={`dashboard-skeleton-metric-subvalue${wideSubvalue ? ' dashboard-skeleton-metric-subvalue--wide' : ''}`}
        />
      ) : null}
    </div>
  );
}

export function DashboardExchangeRatesSkeleton({ count = 5, mobile = false }) {
  return (
    <div className="dashboard-exchange-rates-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`rate-skeleton-${index}`} className="dashboard-exchange-rate-row-skeleton">
          <DashboardSkeletonBlock
            className="dashboard-skeleton-rate-flag"
            style={{ animationDelay: `${index * 0.06}s` }}
          />
          <DashboardSkeletonBlock
            className="dashboard-skeleton-rate-code"
            style={{ animationDelay: `${index * 0.06 + 0.04}s` }}
          />
          <DashboardSkeletonBlock
            className="dashboard-skeleton-rate-value"
            style={{ animationDelay: `${index * 0.06 + 0.08}s` }}
          />
          <DashboardSkeletonBlock
            className="dashboard-skeleton-rate-change"
            style={{ animationDelay: `${index * 0.06 + 0.1}s` }}
          />
        </div>
      ))}
    </div>
  );
}

export function DashboardWalletListSkeleton({ count = 4 }) {
  return (
    <div className="dashboard-wallet-list-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`wallet-skeleton-${index}`} className="dashboard-wallet-row-skeleton">
          <div className="dashboard-wallet-row-skeleton-left">
            <DashboardSkeletonBlock
              className="dashboard-skeleton-wallet-icon"
              style={{ animationDelay: `${index * 0.05}s` }}
            />
            <div className="dashboard-wallet-row-skeleton-text">
              <DashboardSkeletonBlock className="dashboard-skeleton-wallet-name" />
              <DashboardSkeletonBlock className="dashboard-skeleton-wallet-crypto" />
            </div>
          </div>
          <div className="dashboard-wallet-row-skeleton-right">
            <DashboardSkeletonBlock className="dashboard-skeleton-wallet-amount" />
            <DashboardSkeletonBlock className="dashboard-skeleton-wallet-change" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardEscrowListSkeleton({ count = 3, mobile = false }) {
  return (
    <div className="dashboard-escrow-list-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`escrow-skeleton-${index}`} className="dashboard-escrow-card-skeleton">
          <DashboardSkeletonBlock className="dashboard-skeleton-escrow-id" />
          <div className="dashboard-escrow-parties-skeleton">
            <DashboardSkeletonBlock className="dashboard-skeleton-escrow-avatar" />
            <DashboardSkeletonBlock className="dashboard-skeleton-escrow-name" />
            <DashboardSkeletonBlock className="dashboard-skeleton-escrow-arrow" />
            <DashboardSkeletonBlock className="dashboard-skeleton-escrow-avatar" />
            <DashboardSkeletonBlock className="dashboard-skeleton-escrow-name" />
          </div>
          <DashboardSkeletonBlock className="dashboard-skeleton-escrow-amount" />
          {mobile ? <DashboardSkeletonBlock className="dashboard-skeleton-escrow-status" /> : null}
        </div>
      ))}
    </div>
  );
}

export function DashboardEscrowTableSkeleton({ rows = 3 }) {
  return (
    <div className="dashboard-escrow-table-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`escrow-table-row-${rowIndex}`} className="dashboard-escrow-table-row-skeleton">
          <DashboardSkeletonBlock className="dashboard-skeleton-table-cell dashboard-skeleton-table-cell--short" />
          <DashboardSkeletonBlock className="dashboard-skeleton-table-cell dashboard-skeleton-table-cell--medium" />
          <DashboardSkeletonBlock className="dashboard-skeleton-table-cell dashboard-skeleton-table-cell--short" />
          <DashboardSkeletonBlock className="dashboard-skeleton-table-cell dashboard-skeleton-table-cell--pill" />
        </div>
      ))}
    </div>
  );
}
