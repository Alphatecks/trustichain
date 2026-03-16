import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/config';
import './index.css';

const BUSINESS_SUITE_PATHS = [
  '/dashboard',
  '/supplier-contract',
  '/api-keys',
  '/sandbox-environment',
  '/webhook',
];

const isBusinessSuitePath = (pathname) => {
  if (!pathname) return false;
  if (BUSINESS_SUITE_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/payroll')) return true;
  if (pathname.startsWith('/business-dispute')) return true;
  return false;
};

const isBusinessEmailSet = (result) => {
  if (!result) return false;
  const d = result.data;
  if (typeof d === 'string' && d.trim().length > 0) return true;
  if (d && typeof d === 'object') {
    if (d.hasBusinessEmail === true) return true;
    const email = d.businessEmail ?? d.email ?? d.business_email;
    if (typeof email === 'string' && email.trim().length > 0) return true;
  }
  const topEmail = result.businessEmail ?? result.email ?? result.business_email;
  if (typeof topEmail === 'string' && topEmail.trim().length > 0) return true;
  return false;
};

const BusinessEmailGate = () => {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isBusinessSuitePath(location.pathname)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    fetch(getApiUrl('api/business-suite/business-email/status'), {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
      .then((res) => res.json().catch(() => ({})).then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && !isBusinessEmailSet(data)) {
          setEmailInput('');
          setShowModal(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [location.pathname]);

  const handleSave = async () => {
    const email = (emailInput || '').trim();
    if (!email) {
      toast.error('Please enter a business email.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(getApiUrl('api/business-suite/business-email'), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessEmail: email }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.success) {
        toast.success('Business email saved.');
        setShowModal(false);
        setEmailInput('');
      } else {
        toast.error(result?.message || 'Failed to save business email.');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to save business email.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="business-email-warning-overlay" onClick={() => setShowModal(false)}>
      <div className="business-email-warning-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="business-email-warning-close" onClick={() => setShowModal(false)} aria-label="Close">
          <X size={20} />
        </button>
        <div className="business-email-warning-icon-wrap">
          <Mail size={32} className="business-email-warning-icon" />
        </div>
        <h2 className="business-email-warning-title">Business email required</h2>
        <p className="business-email-warning-message">
          You haven't set your business email as part of KYC. Some features may be limited until you add it.
        </p>
        <div className="business-email-warning-form">
          <label htmlFor="business-email-input-gate">Business email</label>
          <input
            id="business-email-input-gate"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="contact@company.com"
            className="business-email-warning-input"
          />
          <div className="business-email-warning-actions">
            <button type="button" className="business-email-warning-submit" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Set business email'}
            </button>
            <button type="button" className="business-email-warning-dismiss" onClick={() => setShowModal(false)}>
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessEmailGate;
