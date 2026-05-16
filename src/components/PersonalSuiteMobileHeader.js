import React from 'react';
import { Bell, KeyRound, Menu } from 'lucide-react';
import { useTrustiscore, formatTrustiscoreBadgeText } from '../context/TrustiscoreContext';
import HeaderProfileAvatarNav from './HeaderProfileAvatarNav';
import HeaderProfileVerifyBadge from './HeaderProfileVerifyBadge';
import LoadingIndicator from './LoadingIndicator';
import verifyBadge from '../assets/images/icons/verify.png';

/**
 * Shared mobile header for Personal / dual-mode dashboard routes.
 * Mirrors the main Dashboard mobile strip: avatar | TrustiScore or KYC | bell + menu.
 */
export default function PersonalSuiteMobileHeader({
  variant = 'personal',
  className,
  userAvatar,
  userInitials,
  userFullName,
  /** Personal: badge + qualifies for TrustiScore chip */
  personalVerificationComplete = false,
  /** Business: badge on avatar */
  businessVerificationComplete = false,
  businessLogoUrl,
  businessName,
  businessAvatarLoading = false,
  onOpenNotifications,
  onToggleMobileMenu,
  /** 'trustiscore' — default center chip; 'profile' — name + optional subtitle (matches compact savings-style header). */
  centerMode = 'trustiscore',
  profileSubtitle,
}) {
  const { score: trustiscoreScore, isLoading: isTrustiscoreLoading, openTrustiscoreModal } = useTrustiscore();
  const trustiscoreBadgeText = formatTrustiscoreBadgeText(trustiscoreScore, isTrustiscoreLoading);

  const isBusiness = variant === 'business';

  const showTrustiscoreChip = isBusiness || personalVerificationComplete;
  const verifyShow = isBusiness ? businessVerificationComplete : personalVerificationComplete;

  const rootClass = ['mobile-dashboard-header', 'suite-mobile-header', centerMode === 'profile' ? 'suite-mobile-header--profile' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <div className="mobile-header-left">
        <HeaderProfileAvatarNav variant="mobile">
          {isBusiness ? (
            <>
              {businessLogoUrl ? (
                <img src={businessLogoUrl} alt={businessName || 'Business'} />
              ) : businessAvatarLoading ? (
                <LoadingIndicator size="sm" />
              ) : (
                businessName ? businessName.charAt(0).toUpperCase() : '—'
              )}
            </>
          ) : userAvatar ? (
            <img src={userAvatar} alt={userFullName || 'Profile'} />
          ) : (
            userInitials
          )}
          <HeaderProfileVerifyBadge show={verifyShow} mobile />
        </HeaderProfileAvatarNav>
      </div>
      <div className="mobile-header-trustiscore-slot">
        {!isBusiness && centerMode === 'profile' ? (
          <div className="suite-mobile-header-profile">
            <div className="suite-mobile-header-profile-name-row">
              <span className="suite-mobile-header-profile-name">{userFullName}</span>
              {verifyShow ? <img src={verifyBadge} alt="" className="suite-mobile-header-profile-verified-img" /> : null}
            </div>
            {profileSubtitle ? <span className="suite-mobile-header-profile-tagline">{profileSubtitle}</span> : null}
          </div>
        ) : showTrustiscoreChip ? (
          <button
            type="button"
            className="header-trustiscore-box mobile-dashboard-header-trustiscore"
            role="status"
            aria-label={`TrustiScore ${trustiscoreBadgeText}`}
            onClick={openTrustiscoreModal}
          >
            <span className="header-trustiscore-label">TrustiScore</span>
            <span className="header-trustiscore-value">{trustiscoreBadgeText}</span>
          </button>
        ) : (
          <button type="button" className="kyc-status mobile-dashboard-header-kyc">
            <KeyRound size={14} />
            <span>KYC</span>
            <span>Unverified</span>
          </button>
        )}
      </div>
      <div className="mobile-header-right">
        <button type="button" className="mobile-header-bell" onClick={onOpenNotifications}>
          <Bell size={20} />
        </button>
        <button type="button" className="mobile-header-menu" onClick={onToggleMobileMenu}>
          <Menu size={20} />
        </button>
      </div>
    </div>
  );
}
