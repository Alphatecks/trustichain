import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import LoadingIndicator from '../LoadingIndicator';
import { persistTrustitagFromProfileResponse, extractTrustitagFromLoginResponse } from '../../utils/trustitag';
import './EditTrustitagModal.css';

const MAX_LEN = 64;

/** Allowed chars: letters, numbers, dot, underscore, hyphen (common handle-style tags). */
const TRUSTITAG_PATTERN = /^[a-zA-Z0-9._-]+$/;

async function fetchProfileTrustitagAfterSave() {
  const token = localStorage.getItem('token');
  if (!token) return '';
  const res = await fetch(getApiUrl('api/user/profile'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) return '';
  persistTrustitagFromProfileResponse(json);
  return extractTrustitagFromLoginResponse(json) || '';
}

export default function EditTrustitagModal({ isOpen, initialTrustitag = '', onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setValue(typeof initialTrustitag === 'string' ? initialTrustitag : '');
  }, [isOpen, initialTrustitag]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSave = useCallback(async () => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      toast.error('Enter your Trustitag');
      return;
    }
    if (trimmed.length > MAX_LEN) {
      toast.error(`Trustitag must be at most ${MAX_LEN} characters`);
      return;
    }
    if (!TRUSTITAG_PATTERN.test(trimmed)) {
      toast.error('Use only letters, numbers, dots, underscores, or hyphens');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in again');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(getApiUrl('api/user/trustitag'), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trustitag: trimmed }),
      });

      const json = await res.json().catch(() => ({}));

      let nextTag = '';
      if (res.ok && json?.success) {
        persistTrustitagFromProfileResponse(json);
        nextTag = extractTrustitagFromLoginResponse(json) || '';
      }

      if (!nextTag && res.ok && json?.success) {
        nextTag = await fetchProfileTrustitagAfterSave();
      }

      if (res.ok && json?.success && nextTag) {
        toast.success(json?.message || 'Trustitag updated');
        onSaved?.(nextTag);
        onClose();
        return;
      }

      const msg =
        (typeof json?.message === 'string' && json.message) ||
        (typeof json?.error === 'string' && json.error) ||
        (!res.ok && res.status === 405 ? 'Updating Trustitag is not supported on this server.' : '') ||
        'Could not update Trustitag';
      toast.error(msg);
    } catch {
      toast.error('Could not update Trustitag');
    } finally {
      setSaving(false);
    }
  }, [value, onClose, onSaved]);

  if (!isOpen) return null;

  const trimmed = String(value || '').trim();
  const saveDisabled = saving || !trimmed || trimmed === String(initialTrustitag || '').trim();

  return (
    <div
      className="edit-trustitag-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-trustitag-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="edit-trustitag-card" onClick={(e) => e.stopPropagation()}>
        <div className="edit-trustitag-card-head">
          <h2 id="edit-trustitag-modal-title" className="edit-trustitag-title">
            Edit Trustitag
          </h2>
          <button type="button" className="edit-trustitag-dismiss" onClick={() => !saving && onClose()} aria-label="Close">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <p className="edit-trustitag-lead">
          Others can send to you using this tag instead of a long wallet address.
        </p>

        <label className="edit-trustitag-label" htmlFor="edit-trustitag-input">
          Trustitag
        </label>
        <input
          id="edit-trustitag-input"
          type="text"
          className="edit-trustitag-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="your-trustitag"
          maxLength={MAX_LEN}
          autoComplete="off"
          disabled={saving}
        />

        <div className="edit-trustitag-actions">
          <button type="button" className="edit-trustitag-btn edit-trustitag-btn--ghost" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="edit-trustitag-btn edit-trustitag-btn--primary" disabled={saveDisabled} onClick={handleSave}>
            {saving ? <LoadingIndicator size="sm" /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
