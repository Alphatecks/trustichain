import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, CheckCircle, AlertTriangle, ArrowLeftRight, Megaphone, HeartHandshake } from 'lucide-react';
import {
  getNotificationId,
  getNotificationSummaryLine,
  getNotificationDetailText,
  getNotificationCta,
  hasExpandableContent,
} from '../../utils/notificationItemHelpers';

/* One left glyph per item (mock): blue icon in light blue circle; shape varies by type. */
const getNotificationIconConfig = (type) => {
  const t = (type && String(type)) || '';
  if (t === 'wallet_deposit') {
    return { Icon: CheckCircle, className: 'notification-bell-type-icon' };
  }
  if (t === 'escrow_completed' || t === 'escrow_released') {
    return { Icon: HeartHandshake, className: 'notification-bell-type-icon' };
  }
  if (t === 'wallet_swap' || t === 'swap') {
    return { Icon: ArrowLeftRight, className: 'notification-bell-type-icon' };
  }
  if (t.includes('maintenance') || t === 'announcement' || t === 'system_announcement') {
    return { Icon: Megaphone, className: 'notification-bell-type-icon' };
  }
  if (t.includes('dispute') || t === 'dispute_resolved') {
    return { Icon: AlertTriangle, className: 'notification-bell-type-icon' };
  }
  return { Icon: AlertTriangle, className: 'notification-bell-type-icon' };
};

/**
 * Tappable list rows: collapsed shows a title/summary; expanded shows full text + optional CTA.
 */
function NotificationListItems({
  notifications,
  expandedNotificationId,
  onToggleExpand,
  onMarkRead,
  formatTimeAgo,
  emptyText = 'N/A',
}) {
  const navigate = useNavigate();

  if (!Array.isArray(notifications) || notifications.length === 0) {
    return (
      <div
        className="notification-list-empty"
        style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <>
      {notifications.map((n, index) => {
        const isUnread = !n?.isRead;
        const nid = getNotificationId(n, index);
        const { Icon, className } = getNotificationIconConfig(n?.type);
        const expandable = hasExpandableContent(n);
        const isExpanded = expandedNotificationId === nid;
        const summary = getNotificationSummaryLine(n);
        const detail = getNotificationDetailText(n);
        const cta = getNotificationCta(n);
        const showDetail = isExpanded && detail && detail !== 'N/A' && detail !== summary;

        const handleCta = (e) => {
          e.stopPropagation();
          if (!cta?.url) return;
          const u = cta.url.trim();
          if (/^https?:\/\//i.test(u)) {
            window.open(u, '_blank', 'noopener,noreferrer');
            return;
          }
          navigate(u.startsWith('/') ? u : `/${u}`);
        };

        const onActivate = () => {
          if (isUnread) onMarkRead(n?.id);
          if (expandable) onToggleExpand(nid);
        };

        return (
          <div
            key={nid}
            className={`notification-item ${isUnread ? 'unread' : ''} ${
              isExpanded ? 'expanded' : ''
            } ${!expandable ? 'notification-item--static' : ''}`}
            role="button"
            tabIndex={0}
            onClick={onActivate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate();
              }
            }}
            aria-expanded={expandable ? isExpanded : undefined}
          >
            <div className="notification-bell-icon" aria-hidden>
              <Icon size={20} className={className} />
              {isUnread && <span className="notification-bell-dot" />}
            </div>
            <div className="notification-content">
              <div className="notification-content-row">
                <div className="notification-message-wrapper notification-message-wrapper--text-only">
                  <div className="notification-text-stack">
                    <p className="notification-item-title">{summary}</p>
                    {showDetail && <p className="notification-detail-body">{detail}</p>}
                    {isExpanded && cta && (
                      <button
                        type="button"
                        className="notification-cta-btn"
                        onClick={handleCta}
                      >
                        {cta.label}
                      </button>
                    )}
                  </div>
                </div>
                {expandable && (
                  <ChevronDown
                    className={`notification-chevron${isExpanded ? ' notification-chevron--open' : ''}`}
                    size={20}
                    aria-hidden
                  />
                )}
              </div>
              <span className="notification-time">{formatTimeAgo(n?.createdAt)}</span>
            </div>
            {isUnread && <div className="notification-unread-dot" aria-hidden />}
          </div>
        );
      })}
    </>
  );
}

export default NotificationListItems;
