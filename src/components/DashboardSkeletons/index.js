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

const ESCROW_TABLE_CELL_TYPES = {
  4: ['short', 'medium', 'short', 'pill'],
  5: ['medium', 'medium', 'pill', 'short', 'short'],
  7: ['short', 'medium', 'short', 'pill', 'medium', 'short', 'pill'],
  8: ['short', 'medium', 'medium', 'short', 'medium', 'pill', 'short', 'short'],
  6: ['short', 'medium', 'medium', 'short', 'pill', 'short'],
};

export function DashboardEscrowTableSkeleton({ rows = 3, columns = 4 }) {
  const cellTypes = ESCROW_TABLE_CELL_TYPES[columns] || ESCROW_TABLE_CELL_TYPES[4];

  return (
    <div className="dashboard-escrow-table-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={`escrow-table-row-${rowIndex}`}
          className={`dashboard-escrow-table-row-skeleton${columns === 7 ? ' dashboard-escrow-table-row-skeleton--wide' : ''}${columns === 5 ? ' dashboard-escrow-table-row-skeleton--transactions' : ''}${columns === 8 ? ' dashboard-escrow-table-row-skeleton--savings-history' : ''}${columns === 6 ? ' dashboard-escrow-table-row-skeleton--trusticard-tx' : ''}`}
        >
          {cellTypes.map((type, cellIndex) => (
            <DashboardSkeletonBlock
              key={`escrow-table-cell-${rowIndex}-${cellIndex}`}
              className={`dashboard-skeleton-table-cell dashboard-skeleton-table-cell--${type}`}
              style={{ animationDelay: `${rowIndex * 0.05 + cellIndex * 0.03}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EscrowHistoryCardsSkeleton({ count = 4 }) {
  return (
    <div className="escrow-history-cards-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`escrow-history-card-skeleton-${index}`} className="escrow-history-card-skeleton">
          <div className="escrow-history-card-skeleton-top">
            <DashboardSkeletonBlock className="escrow-history-card-skeleton-id" />
            <DashboardSkeletonBlock className="escrow-history-card-skeleton-value" />
          </div>
          <div className="escrow-history-card-skeleton-bottom">
            <div className="escrow-history-card-skeleton-parties">
              <DashboardSkeletonBlock className="escrow-history-card-skeleton-avatar" />
              <DashboardSkeletonBlock className="escrow-history-card-skeleton-name" />
              <DashboardSkeletonBlock className="escrow-history-card-skeleton-arrow" />
              <DashboardSkeletonBlock className="escrow-history-card-skeleton-avatar" />
              <DashboardSkeletonBlock className="escrow-history-card-skeleton-name escrow-history-card-skeleton-name--short" />
            </div>
            <DashboardSkeletonBlock className="escrow-history-card-skeleton-status" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WalletOverviewCardsSkeleton({ count = 3 }) {
  return (
    <div className="wallet-overview-cards-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`wallet-overview-card-skeleton-${index}`} className="wallet-overview-card-skeleton">
          <div className="wallet-overview-card-skeleton-header">
            <DashboardSkeletonBlock className="wallet-overview-card-skeleton-icon" />
            <DashboardSkeletonBlock className="wallet-overview-card-skeleton-name" />
          </div>
          <div className="wallet-overview-card-skeleton-content">
            <DashboardSkeletonBlock className="wallet-overview-card-skeleton-primary" />
            <DashboardSkeletonBlock className="wallet-overview-card-skeleton-secondary" />
          </div>
          <DashboardSkeletonBlock className="wallet-overview-card-skeleton-trend" />
        </div>
      ))}
    </div>
  );
}

export function SavingsPlanCardsSkeleton({ count = 3 }) {
  return (
    <div className="savings-plan-cards-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`savings-plan-card-skeleton-${index}`} className="savings-plan-card-skeleton">
          <div className="savings-plan-card-skeleton-top">
            <DashboardSkeletonBlock
              className="savings-plan-card-skeleton-ring"
              style={{ animationDelay: `${index * 0.05}s` }}
            />
            <div className="savings-plan-card-skeleton-meta">
              <DashboardSkeletonBlock className="savings-plan-card-skeleton-name" />
              <DashboardSkeletonBlock className="savings-plan-card-skeleton-pct" />
            </div>
          </div>
          <DashboardSkeletonBlock className="savings-plan-card-skeleton-type" />
          <DashboardSkeletonBlock className="savings-plan-card-skeleton-saved" />
        </div>
      ))}
    </div>
  );
}

export function SavingsAllocationSkeleton({ legendCount = 4 }) {
  return (
    <div className="savings-allocation-skeleton" aria-busy="true" aria-live="polite">
      <div className="savings-allocation-skeleton-summary">
        <DashboardSkeletonBlock className="savings-allocation-skeleton-total" />
        <DashboardSkeletonBlock className="savings-allocation-skeleton-growth" />
        <DashboardSkeletonBlock className="savings-allocation-skeleton-period" />
      </div>
      <DashboardSkeletonBlock className="savings-allocation-skeleton-bar" />
      <ul className="savings-allocation-skeleton-legend" aria-hidden>
        {Array.from({ length: legendCount }, (_, index) => (
          <li key={`savings-allocation-legend-skeleton-${index}`} className="savings-allocation-skeleton-legend-item">
            <DashboardSkeletonBlock
              className="savings-allocation-skeleton-legend-dot"
              style={{ animationDelay: `${index * 0.05}s` }}
            />
            <DashboardSkeletonBlock className="savings-allocation-skeleton-legend-label" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SavingsHistoryMobileFeedSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <li key={`savings-history-mobile-skeleton-${index}`} className="savings-history-mobile-feed-item">
          <DashboardSkeletonBlock
            className="savings-history-mobile-feed-skeleton-icon"
            style={{ animationDelay: `${index * 0.05}s` }}
          />
          <div className="savings-history-mobile-feed-main">
            <DashboardSkeletonBlock className="savings-history-mobile-feed-skeleton-title" />
            <DashboardSkeletonBlock className="savings-history-mobile-feed-skeleton-sub" />
          </div>
          <div className="savings-history-mobile-feed-meta">
            <DashboardSkeletonBlock className="savings-history-mobile-feed-skeleton-status" />
            <DashboardSkeletonBlock className="savings-history-mobile-feed-skeleton-date" />
          </div>
        </li>
      ))}
    </>
  );
}

export function TrustiCardMyCardsSkeleton({ listCount = 3, actionCount = 5 }) {
  return (
    <div className="tc-v2-cards-layout trusticard-my-cards-skeleton" aria-busy="true" aria-live="polite">
      <div className="tc-v2-card-list-column">
        <DashboardSkeletonBlock className="trusticard-card-list-label-skeleton" />
        <div className="tc-v2-card-list">
          {Array.from({ length: listCount }, (_, index) => (
            <DashboardSkeletonBlock
              key={`trusticard-list-skeleton-${index}`}
              className="trusticard-card-list-item-skeleton"
              style={{ animationDelay: `${index * 0.05}s` }}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="trusticard-carousel-skeleton">
          <DashboardSkeletonBlock className="trusticard-card-face-skeleton" />
        </div>
        <div className="tc-v2-quick-actions trusticard-quick-actions-skeleton">
          {Array.from({ length: actionCount }, (_, index) => (
            <div key={`trusticard-action-skeleton-${index}`} className="trusticard-qaction-skeleton">
              <DashboardSkeletonBlock
                className="trusticard-qaction-ring-skeleton"
                style={{ animationDelay: `${index * 0.04}s` }}
              />
              <DashboardSkeletonBlock className="trusticard-qaction-label-skeleton" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TrustiCardTxMobileSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <li key={`trusticard-tx-mobile-skeleton-${index}`} className="tc-v2-tx-mobile-row">
          <DashboardSkeletonBlock
            className="trusticard-tx-mobile-skeleton-icon"
            style={{ animationDelay: `${index * 0.05}s` }}
          />
          <div className="tc-v2-tx-mobile-copy">
            <DashboardSkeletonBlock className="trusticard-tx-mobile-skeleton-type" />
            <DashboardSkeletonBlock className="trusticard-tx-mobile-skeleton-sub" />
          </div>
          <div className="tc-v2-tx-mobile-aside">
            <DashboardSkeletonBlock className="trusticard-tx-mobile-skeleton-status" />
            <DashboardSkeletonBlock className="trusticard-tx-mobile-skeleton-date" />
          </div>
        </li>
      ))}
    </>
  );
}

export function TrustiCardDetailsSkeleton({ fieldCount = 4 }) {
  return (
    <div className="trusticard-card-info-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: fieldCount }, (_, index) => (
        <div key={`trusticard-details-field-skeleton-${index}`} className="trusticard-card-info-field">
          <DashboardSkeletonBlock
            className="trusticard-card-info-label-skeleton"
            style={{ animationDelay: `${index * 0.05}s` }}
          />
          <DashboardSkeletonBlock className="trusticard-card-info-value-skeleton" />
        </div>
      ))}
    </div>
  );
}

export function TransactionHistoryCardsSkeleton({ count = 4 }) {
  return (
    <div className="transaction-history-cards-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, index) => (
        <div key={`transaction-history-card-skeleton-${index}`} className="transaction-history-card-skeleton">
          <div className="transaction-history-card-skeleton-top">
            <div className="transaction-history-card-skeleton-left">
              <DashboardSkeletonBlock className="transaction-history-card-skeleton-icon" />
              <DashboardSkeletonBlock className="transaction-history-card-skeleton-type" />
            </div>
            <div className="transaction-history-card-skeleton-right">
              <DashboardSkeletonBlock className="transaction-history-card-skeleton-status" />
              <DashboardSkeletonBlock className="transaction-history-card-skeleton-date" />
            </div>
          </div>
          <DashboardSkeletonBlock className="transaction-history-card-skeleton-details" />
        </div>
      ))}
    </div>
  );
}
