import React, { useState, useEffect, useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../utils/notificationsApi';
import NotificationListItems from '../NotificationListItems/NotificationListItems';
import '../../pages/dashboard/dashboard/Dashboard.css';

const formatTimeAgo = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const time = date.getTime();
  if (!Number.isFinite(time)) return 'N/A';
  const diffMs = Date.now() - time;
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/**
 * Shared notification sheet (same UX as Dashboard / My Escrow): opens above fixed chrome (z-index 1000).
 */
function NotificationCenterModal({ open, onClose, titleId = 'notification-center-title' }) {
  const { isSessionExpired } = useSession();
  const [notificationFilter, setNotificationFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [, setNotificationsTotal] = useState(0);
  const [, setNotificationsUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [expandedNotificationId, setExpandedNotificationId] = useState(null);

  const notificationsApiFilter = useMemo(
    () => (notificationFilter === 'Unread' ? 'unread' : 'all'),
    [notificationFilter]
  );

  useEffect(() => {
    if (!open) setExpandedNotificationId(null);
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      if (!open) return;
      if (isSessionExpired) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnreadCount(0);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnreadCount(0);
        return;
      }

      setIsLoadingNotifications(true);
      try {
        const data = await getNotifications({ token, filter: notificationsApiFilter, page: 1, pageSize: 10 });
        if (cancelled) return;
        setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        setNotificationsTotal(Number(data?.total) || 0);
        setNotificationsUnreadCount(Number(data?.unreadCount) || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        if (!cancelled) {
          setNotifications([]);
          setNotificationsTotal(0);
          setNotificationsUnreadCount(0);
        }
      } finally {
        if (!cancelled) setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
    return () => {
      cancelled = true;
    };
  }, [open, isSessionExpired, notificationsApiFilter]);

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId) return;
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await markNotificationRead({ token, id: notificationId });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') {
          return prev.filter((n) => n?.id !== notificationId);
        }
        return prev.map((n) => (n?.id === notificationId ? { ...n, isRead: true } : n));
      });
      setNotificationsUnreadCount((prev) => Math.max(0, (Number(prev) || 0) - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (isSessionExpired) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await markAllNotificationsRead({ token });
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return prev;
        if (notificationsApiFilter === 'unread') return [];
        return prev.map((n) => ({ ...n, isRead: true }));
      });
      setNotificationsUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (!open) return null;

  return (
    <div className="notification-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="notification-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-modal-header">
          <div className="notification-header-content">
            <div className="notification-header-accent" />
            <h2 id={titleId}>Notification</h2>
          </div>
          <button type="button" className="notification-close-btn" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="notification-filter-bar">
          <div className="notification-filter-buttons">
            <button
              type="button"
              className={`notification-filter-btn ${notificationFilter === 'All' ? 'active' : ''}`}
              onClick={() => setNotificationFilter('All')}
            >
              All
            </button>
            <button
              type="button"
              className={`notification-filter-btn ${notificationFilter === 'Unread' ? 'active' : ''}`}
              onClick={() => setNotificationFilter('Unread')}
            >
              Unread
            </button>
          </div>
          <button
            type="button"
            className="notification-filter-icon"
            onClick={handleMarkAllNotificationsRead}
            disabled={isLoadingNotifications}
            aria-label="Mark all as read"
          >
            <Filter size={18} />
          </button>
        </div>

        <div className="notification-list">
          <NotificationListItems
            notifications={notifications}
            expandedNotificationId={expandedNotificationId}
            onToggleExpand={(nid) => setExpandedNotificationId((p) => (p === nid ? null : nid))}
            onMarkRead={handleMarkNotificationRead}
            formatTimeAgo={formatTimeAgo}
            emptyText={"You're all caught up."}
            onBeforeCtaNavigate={onClose}
          />
        </div>
      </div>
    </div>
  );
}

export default NotificationCenterModal;
