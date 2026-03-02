import React, { useState, useEffect } from 'react';
import { X, Users, Calendar, Mail, User, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../../utils/config';
import './TeamDetailModal.css';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

const TeamDetailModal = ({ isOpen, onClose, team, loading, onMemberRemoved }) => {
  const [viewingMember, setViewingMember] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setViewingMember(null);
      setRemovingMemberId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (viewingMember) setViewingMember(null);
      else onClose();
    }
  };

  const handleRemoveMember = async (member) => {
    const teamId = team?.id;
    const memberRowId = member?.id ?? member?.memberId ?? member?.userId;
    if (!teamId || !memberRowId) {
      toast.error('Cannot remove: missing team or member id.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in.');
      return;
    }
    setRemovingMemberId(memberRowId);
    try {
      const res = await fetch(getApiUrl(`api/business-suite/teams/${teamId}/members/${memberRowId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success) {
        toast.success(result?.message ?? 'Team member removed successfully.');
        if (viewingMember && (viewingMember?.id ?? viewingMember?.memberId ?? viewingMember?.userId) === memberRowId) {
          setViewingMember(null);
        }
        onMemberRemoved?.();
      } else {
        toast.error(result?.message ?? 'Failed to remove member.');
      }
    } catch (err) {
      console.error('Remove member error:', err);
      toast.error('Failed to remove member.');
    } finally {
      setRemovingMemberId(null);
    }
  };

  return (
    <div className="team-detail-modal-overlay" onClick={handleOverlayClick}>
      <div className="team-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="team-detail-modal-header">
          <h2 className="team-detail-modal-title">Team details</h2>
          <button type="button" className="team-detail-modal-close" onClick={() => (viewingMember ? setViewingMember(null) : onClose())} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="team-detail-modal-body">
          {loading ? (
            <div className="team-detail-loading">Loading...</div>
          ) : !team ? (
            <div className="team-detail-empty">No team data</div>
          ) : (
            <>
              <div className="team-detail-info">
                <div className="team-detail-name">{team.name}</div>
                <div className="team-detail-meta">
                  <span className="team-detail-meta-item">
                    <Calendar size={16} />
                    Next date: {team.nextDate ?? '—'}
                  </span>
                  <span className="team-detail-meta-item">
                    Created {formatDate(team.createdAt)}
                  </span>
                  {team.updatedAt && (
                    <span className="team-detail-meta-item">
                      Updated {formatDate(team.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className="team-detail-members-section">
                <h3 className="team-detail-members-title">
                  <Users size={20} />
                  Members ({Array.isArray(team.members) ? team.members.length : 0})
                </h3>
                {!Array.isArray(team.members) || team.members.length === 0 ? (
                  <div className="team-detail-members-empty">No members</div>
                ) : (
                  <ul className="team-detail-members-list">
                    {team.members.map((m) => (
                      <li key={m.id || m.userId} className="team-detail-member-item">
                        <div className="team-detail-member-avatar">
                          <User size={18} />
                        </div>
                        <div className="team-detail-member-info">
                          <div className="team-detail-member-name">{m.fullName ?? '—'}</div>
                          <div className="team-detail-member-email">
                            <Mail size={14} />
                            {m.email ?? '—'}
                          </div>
                          {m.addedAt && (
                            <div className="team-detail-member-added">
                              Added {formatDate(m.addedAt)}
                            </div>
                          )}
                        </div>
                        <div className="team-detail-member-actions">
                          <button
                            type="button"
                            className="team-detail-member-view-btn"
                            onClick={() => setViewingMember(m)}
                            aria-label={`View ${m.fullName ?? 'member'}`}
                          >
                            <Eye size={16} />
                            View
                          </button>
                          <button
                            type="button"
                            className="team-detail-member-remove-btn"
                            onClick={() => handleRemoveMember(m)}
                            disabled={removingMemberId === (m?.id ?? m?.memberId ?? m?.userId)}
                            aria-label={`Remove ${m.fullName ?? 'member'}`}
                          >
                            <Trash2 size={16} />
                            {removingMemberId === (m?.id ?? m?.memberId ?? m?.userId) ? 'Removing…' : 'Remove'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
        {viewingMember && (
          <div className="team-detail-member-view-overlay" onClick={() => setViewingMember(null)}>
            <div className="team-detail-member-view-panel" onClick={(e) => e.stopPropagation()}>
              <div className="team-detail-member-view-header">
                <h3 className="team-detail-member-view-title">Member details</h3>
                <button type="button" className="team-detail-modal-close" onClick={() => setViewingMember(null)} aria-label="Close">
                  <X size={24} />
                </button>
              </div>
              <div className="team-detail-member-view-body">
                <div className="team-detail-member-avatar team-detail-member-view-avatar">
                  <User size={24} />
                </div>
                <div className="team-detail-member-view-name">{viewingMember.fullName ?? '—'}</div>
                <div className="team-detail-member-view-row">
                  <Mail size={18} />
                  <span>{viewingMember.email ?? '—'}</span>
                </div>
                {viewingMember.addedAt && (
                  <div className="team-detail-member-view-row">
                    <Calendar size={18} />
                    <span>Added {formatDate(viewingMember.addedAt)}</span>
                  </div>
                )}
                <button type="button" className="team-detail-member-view-back" onClick={() => setViewingMember(null)}>
                  Back to team
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamDetailModal;
