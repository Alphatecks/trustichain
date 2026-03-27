import React, { useCallback, useMemo } from 'react';
import { Copy, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './TrustitagWelcomeModal.css';

const CONFETTI_COLORS = [
  '#ec4899',
  '#a855f7',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#ef4444',
  '#06b6d4',
];

/** Stable confetti layout per modal open (avoids layout thrash). */
function buildConfettiPieces(seedKey) {
  const pieces = [];
  let seed = 0;
  for (let i = 0; i < seedKey.length; i += 1) {
    seed = (seed << 5) - seed + seedKey.charCodeAt(i);
    seed |= 0;
  }
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const count = 56;
  for (let i = 0; i < count; i += 1) {
    pieces.push({
      id: i,
      left: `${8 + rnd() * 84}%`,
      delay: `${rnd() * 2.8}s`,
      duration: `${2.4 + rnd() * 2.2}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 5 + Math.floor(rnd() * 5),
      h: 6 + Math.floor(rnd() * 7),
      drift: `${-30 + rnd() * 60}px`,
      spin: rnd() > 0.5 ? 1 : -1,
    });
  }
  return pieces;
}

const TrustitagWelcomeModal = ({ isOpen, trustitag, onClose }) => {
  const handleCopy = useCallback(() => {
    if (!trustitag) return;
    const run = async () => {
      try {
        await navigator.clipboard.writeText(trustitag);
        toast.success('Trustitag copied');
      } catch {
        toast.error('Could not copy');
      }
    };
    run();
  }, [trustitag]);

  const confettiPieces = useMemo(
    () => (isOpen && trustitag ? buildConfettiPieces(trustitag) : []),
    [isOpen, trustitag]
  );

  if (!isOpen || !trustitag) return null;

  return (
    <div
      className="trustitag-welcome-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trustitag-welcome-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="trustitag-welcome-shell">
        <div className="trustitag-welcome-card" onClick={(e) => e.stopPropagation()}>
          <div className="trustitag-welcome-confetti-layer" aria-hidden>
            {confettiPieces.map((p) => (
              <span
                key={p.id}
                className="trustitag-confetti-piece"
                style={{
                  left: p.left,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                  width: p.w,
                  height: p.h,
                  background: p.color,
                  '--drift': p.drift,
                  '--spin': String(p.spin),
                }}
              />
            ))}
          </div>

          <button type="button" className="trustitag-welcome-close" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={1.75} />
          </button>

          <div className="trustitag-welcome-body">
            <div className="trustitag-welcome-hero-icon" aria-hidden>
              <span className="trustitag-welcome-emoji" role="img">
                🎉
              </span>
            </div>

            <h2 id="trustitag-welcome-title" className="trustitag-welcome-title">
              Welcome on board!
            </h2>
            <p className="trustitag-welcome-lead">
              Ready to send and receive <strong>XRP</strong> using Trustitags? Friends can send to you with yours — no long addresses.
            </p>

            <div className="trustitag-welcome-tag-section">
              <p className="trustitag-welcome-tag-label">Your Trustitag</p>
              <div className="trustitag-welcome-tag-row">
                <code className="trustitag-welcome-tag-text">{trustitag}</code>
                <button
                  type="button"
                  className="trustitag-welcome-copy"
                  onClick={handleCopy}
                  aria-label="Copy Trustitag"
                >
                  <Copy size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            <button type="button" className="trustitag-welcome-cta" onClick={onClose}>
              Let&apos;s go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustitagWelcomeModal;
