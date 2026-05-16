import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import './TrustiscoreSummaryModal.css';

function readSuiteRowLabel() {
  try {
    const t = localStorage.getItem('dashboard_account_type');
    if (t === 'Business Suite') return 'TrustiScore Business';
    return 'TrustiScore Personal';
  } catch {
    return 'TrustiScore Personal';
  }
}

const DONUT_R = 52;
const DONUT_C = 2 * Math.PI * DONUT_R;

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export default function TrustiscoreSummaryModal({ isOpen, onClose, score, isLoading }) {
  const [entered, setEntered] = useState(false);
  const [animatedPct, setAnimatedPct] = useState(0);

  const targetPct = useMemo(() => {
    if (isLoading || score == null || !Number.isFinite(Number(score))) return 0;
    return Math.min(100, Math.max(0, Number(score)));
  }, [score, isLoading]);

  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      setAnimatedPct(0);
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';
    const show = requestAnimationFrame(() => setEntered(true));

    let raf;
    if (isLoading) {
      setAnimatedPct(0);
      return () => {
        cancelAnimationFrame(show);
        document.body.style.overflow = '';
      };
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setAnimatedPct(targetPct);
      return () => {
        cancelAnimationFrame(show);
        document.body.style.overflow = '';
      };
    }

    setAnimatedPct(0);
    const duration = 1000;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setAnimatedPct(targetPct * easeOutCubic(p));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(show);
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, [isOpen, targetPct, isLoading]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const suiteLabel = readSuiteRowLabel();
  const dashLength = (animatedPct / 100) * DONUT_C;
  const centerText = isLoading ? '…' : `${Math.round(animatedPct)}%`;
  const badgeText = isLoading ? '…' : `${Math.round(animatedPct)}%`;

  return (
    <div
      className={`trustiscore-summary-overlay${entered ? ' is-visible' : ''}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`trustiscore-summary-card${entered ? ' is-visible' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="trustiscore-summary-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="trustiscore-summary-header">
          <div className="trustiscore-summary-header-leading">
            <span className="trustiscore-summary-accent" aria-hidden />
            <h2 id="trustiscore-summary-title">TrustiScore</h2>
          </div>
          <button type="button" className="trustiscore-summary-close" onClick={onClose} aria-label="Close">
            <X size={22} strokeWidth={2} />
          </button>
        </header>

        <div className="trustiscore-summary-chart">
          <div className="trustiscore-summary-chart-inner">
            <svg
              className="trustiscore-summary-donut"
              viewBox="0 0 120 120"
              aria-hidden
            >
              <circle
                className="trustiscore-summary-donut-track"
                cx="60"
                cy="60"
                r={DONUT_R}
                fill="none"
              />
              <circle
                className="trustiscore-summary-donut-progress"
                cx="60"
                cy="60"
                r={DONUT_R}
                fill="none"
                strokeDasharray={`${dashLength} ${DONUT_C}`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="trustiscore-summary-donut-label">{centerText}</div>
          </div>
        </div>

        <div className="trustiscore-summary-row">
          <span className="trustiscore-summary-row-label">{suiteLabel}</span>
          <span className="trustiscore-summary-row-badge">{badgeText}</span>
        </div>

        <footer className="trustiscore-summary-footer">
          <button type="button" className="trustiscore-summary-done" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
