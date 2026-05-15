import React from 'react';
import verifyBadge from '../../assets/images/icons/verify.png';

/**
 * Verification check stacked on the bottom-right of `.user-avatar` / `.mobile-user-avatar`
 * (parent must be `position: relative`; see Dashboard.css).
 */
export default function HeaderProfileVerifyBadge({ show = true, mobile = false }) {
  if (!show) return null;
  const cls = mobile
    ? 'user-avatar-verify-badge user-avatar-verify-badge--mobile'
    : 'user-avatar-verify-badge';

  return (
    <span className={cls} aria-label="Verified" role="img">
      <img src={verifyBadge} alt="" />
    </span>
  );
}
