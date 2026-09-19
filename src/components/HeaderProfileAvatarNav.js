import React from 'react';
import { useNavigate } from 'react-router-dom';

const loadProfilePage = () => import('../pages/dashboard/profile/Profile');

/**
 * Wraps header avatar markup so tapping opens the Profile route (desktop + mobile shells).
 */
export default function HeaderProfileAvatarNav({ variant = 'desktop', className = '', children }) {
  const navigate = useNavigate();
  const base =
    variant === 'mobile'
      ? 'mobile-user-avatar mobile-profile-avatar-nav'
      : 'user-avatar header-profile-avatar-nav';

  return (
    <button
      type="button"
      className={[base, className].filter(Boolean).join(' ')}
      onMouseEnter={loadProfilePage}
      onFocus={loadProfilePage}
      onClick={() => {
        loadProfilePage();
        navigate('/profile');
      }}
      aria-label="Open profile"
    >
      {children}
    </button>
  );
}
