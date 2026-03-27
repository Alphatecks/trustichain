import React, { useEffect, useState, useCallback } from 'react';
import { X, Copy, CheckCircle, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';
import {
  startMfaSetup,
  verifyMfaSetup,
  disableMfa,
} from '../../utils/mfaApi';
import './index.css';

const CODE_LEN = 6;

function GoogleAuthenticatorModal({
  isOpen,
  mode,
  token,
  onClose,
  onSuccess,
}) {
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setOtpauthUrl('');
    setSecret('');
    setCode('');
    setCopied(false);
    setLoading(false);
    setSetupLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !token) return undefined;

    if (mode === 'enroll') {
      setOtpauthUrl('');
      setSecret('');
      setSetupLoading(true);
      startMfaSetup(token)
        .then((data) => {
          setOtpauthUrl(data.otpauthUrl || '');
          setSecret(data.secret || '');
        })
        .catch((err) => {
          toast.error(err?.message || 'Could not load setup');
          onClose();
        })
        .finally(() => setSetupLoading(false));
    } else {
      reset();
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open enroll only refetches setup
  }, [isOpen, mode, token]);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(
      () => {
        setCopied(true);
        toast.success('Secret copied');
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.error('Could not copy')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length < CODE_LEN) {
      toast.error(`Enter the ${CODE_LEN}-digit code`);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'enroll') {
        await verifyMfaSetup(token, digits.slice(0, CODE_LEN));
        toast.success('Google Authenticator enabled');
        onSuccess?.();
        onClose();
        reset();
      } else {
        await disableMfa(token, digits.slice(0, CODE_LEN));
        toast.success('Google Authenticator disabled');
        onSuccess?.();
        onClose();
        reset();
      }
    } catch (err) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ga-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="ga-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ga-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ga-modal-header">
          <h2 id="ga-modal-title">
            {mode === 'enroll' ? 'Set up Google Authenticator' : 'Disable Google Authenticator'}
          </h2>
          <button type="button" className="ga-modal-close" aria-label="Close" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <div className="ga-modal-body">
          {mode === 'enroll' && (
            <>
              <p className="ga-modal-intro">
                Scan this QR code in <strong>Google Authenticator</strong>, or enter the secret manually.
              </p>
              {setupLoading ? (
                <div className="ga-modal-qr-loading">
                  <Loader2 size={32} className="ga-modal-spinner" />
                  <span>Preparing setup…</span>
                </div>
              ) : (
                <>
                  {otpauthUrl ? (
                    <div className="ga-modal-qr-wrap">
                      <QRCode value={otpauthUrl} size={200} level="M" />
                    </div>
                  ) : (
                    <p className="ga-modal-warning">No QR data available. Use the secret below.</p>
                  )}
                  {secret ? (
                    <div className="ga-modal-secret-row">
                      <code className="ga-modal-secret" title={secret}>
                        {secret}
                      </code>
                      <button
                        type="button"
                        className="ga-modal-copy"
                        onClick={handleCopySecret}
                        aria-label="Copy secret"
                      >
                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}

          {mode === 'disable' && (
            <p className="ga-modal-intro">
              Enter the 6-digit code from <strong>Google Authenticator</strong> to confirm.
            </p>
          )}

          <form onSubmit={handleSubmit} className="ga-modal-form">
            <label className="ga-modal-label" htmlFor="ga-code-input">
              Verification code
            </label>
            <input
              id="ga-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              maxLength={CODE_LEN}
              className="ga-modal-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LEN))}
            />
            <div className="ga-modal-actions">
              <button type="button" className="ga-modal-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="ga-modal-btn-primary" disabled={loading || setupLoading}>
                {loading ? 'Verifying…' : mode === 'enroll' ? 'Verify & enable' : 'Confirm disable'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GoogleAuthenticatorModal;
