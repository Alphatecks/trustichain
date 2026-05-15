import React, { useMemo, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Check, Phone } from 'lucide-react';
import downloadCircleIcon from '../../../assets/images/icons/download-circle-02.png';
import shareIcon from '../../../assets/images/icons/share-04.png';

const formatPreviewDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const day = d.getDate();
    const suf = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    const mon = d.toLocaleDateString('en-GB', { month: 'short' });
    const yr = d.getFullYear();
    return `${day}${suf} ${mon} ${yr}`;
  } catch {
    return iso;
  }
};

const randomInvoiceRef = (seedId) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '#';
  let n = Number(seedId) || 1;
  for (let i = 0; i < 10; i += 1) {
    n = (n * 9301 + 49297) % 233280;
    s += chars[n % chars.length];
  }
  return s;
};

function InvoiceEditorView({ listRow, issuerName, issuerLogoUrl, issuerEmail, issuerPhone, onClose }) {
  const invoiceRef = useMemo(
    () => randomInvoiceRef(listRow?.id ?? Date.now()),
    [listRow?.id]
  );

  const [companyTitle, setCompanyTitle] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [invoiceName, setInvoiceName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('');
  const [milestones, setMilestones] = useState([
    { serviceTitle: '', amount: '', description: 'Service description' },
  ]);

  useEffect(() => {
    if (!listRow) return;
    setCompanyTitle(listRow.company || '');
    setCompanyEmail('');
    setCompanyAddress('');
    setCompanyNumber('');
    setInvoiceName(listRow.name || '');
    setDueDate(listRow.dueDate ? String(listRow.dueDate).slice(0, 10) : '');
    setCurrency('');
    setMilestones([
      {
        serviceTitle: listRow.name || 'Design gig',
        amount: String(listRow.amount ?? ''),
        description: 'Service description',
      },
    ]);
  }, [listRow]);

  const addMilestone = useCallback(() => {
    setMilestones((prev) => [...prev, { serviceTitle: '', amount: '', description: '' }]);
  }, []);

  const updateMilestone = useCallback((index, field, value) => {
    setMilestones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const subtotal = useMemo(() => {
    return milestones.reduce((acc, m) => acc + (parseFloat(String(m.amount), 10) || 0), 0);
  }, [milestones]);

  const platformFee = 10;
  const total = subtotal + platformFee;

  const issuerDisplay = issuerName?.trim() || 'Your business';
  const todayLabel = formatPreviewDate(new Date().toISOString().slice(0, 10));
  const invoiceTitlePreview = invoiceName.trim() || (listRow?.name || '').trim() || '—';
  const dueDatePreview = dueDate
    ? formatPreviewDate(dueDate)
    : listRow?.dueDate
      ? formatPreviewDate(listRow.dueDate)
      : '—';

  const currencySymbol =
    currency === 'EUR'
      ? '€'
      : currency === 'GBP'
        ? '£'
        : currency === 'NGN'
          ? '₦'
          : '$';

  const handleSave = () => {
    toast.success('Invoice saved');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: invoiceTitlePreview !== '—' ? invoiceTitlePreview : 'Invoice', text: `Invoice ${invoiceRef}` });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/invoice`);
        toast.success('Link copied to clipboard');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error('Could not share');
    }
  };

  const handleDownload = () => {
    toast.success('Download will be available when invoices are exported.');
  };

  return (
    <div className="invoice-editor-view">
      <div className="invoice-editor-toolbar">
        <button type="button" className="invoice-editor-back" onClick={onClose}>
          <ArrowLeft size={18} aria-hidden />
          <span>Back to invoices</span>
        </button>
      </div>

      <div className="invoice-editor-grid">
        <section className="invoice-editor-form-card" aria-labelledby="invoice-new-title">
          <h2 id="invoice-new-title" className="invoice-editor-title">
            New Invoice
          </h2>

          <div className="invoice-editor-field-grid invoice-editor-field-grid--company">
            <label className="invoice-editor-field">
              <span className="invoice-editor-label">Company Title</span>
              <input
                type="text"
                value={companyTitle}
                onChange={(e) => setCompanyTitle(e.target.value)}
                placeholder="Select"
                autoComplete="organization"
              />
            </label>
            <label className="invoice-editor-field">
              <span className="invoice-editor-label">Company email</span>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="Select"
                autoComplete="email"
              />
            </label>
            <label className="invoice-editor-field">
              <span className="invoice-editor-label">Company Address</span>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Select"
                autoComplete="street-address"
              />
            </label>
            <label className="invoice-editor-field">
              <span className="invoice-editor-label">Number</span>
              <input
                type="text"
                value={companyNumber}
                onChange={(e) => setCompanyNumber(e.target.value)}
                placeholder="Select"
              />
            </label>
            <label className="invoice-editor-field invoice-editor-field--full">
              <span className="invoice-editor-label">Invoice name</span>
              <input
                type="text"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                placeholder="Select"
                autoComplete="off"
              />
            </label>
            <label className="invoice-editor-field">
              <span className="invoice-editor-label">Due Date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <label className="invoice-editor-field">
              <span className="invoice-editor-label">Currency</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="">Select</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
              </select>
            </label>
          </div>

          <div className="invoice-editor-section-label invoice-editor-section-label--accent">Milestone</div>
          {milestones.map((m, idx) => (
            <div key={idx} className="invoice-editor-milestone-block">
              <div className="invoice-editor-field-grid invoice-editor-field-grid--milestone-row">
                <label className="invoice-editor-field">
                  <span className="invoice-editor-label">Service Title</span>
                  <input
                    type="text"
                    value={m.serviceTitle}
                    onChange={(e) => updateMilestone(idx, 'serviceTitle', e.target.value)}
                    placeholder="Select"
                  />
                </label>
                <label className="invoice-editor-field">
                  <span className="invoice-editor-label">Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={m.amount}
                    onChange={(e) => updateMilestone(idx, 'amount', e.target.value)}
                    placeholder="Select"
                  />
                </label>
              </div>
              <label className="invoice-editor-field invoice-editor-field--full">
                <span className="invoice-editor-label">Service description</span>
                <textarea
                  rows={5}
                  value={m.description}
                  onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                  placeholder="Select"
                />
              </label>
            </div>
          ))}

          <div className="invoice-editor-form-actions">
            <button type="button" className="invoice-editor-add-milestone" onClick={addMilestone}>
              <Plus size={18} aria-hidden />
              Add milestone
            </button>
            <button type="button" className="invoice-editor-save-btn" onClick={handleSave}>
              <span className="invoice-editor-save-icon" aria-hidden>
                <Check size={16} strokeWidth={3} />
              </span>
              Save invoice
            </button>
          </div>
        </section>

        <aside className="invoice-editor-preview-column" aria-label="Invoice preview">
          <div className="invoice-editor-preview-surface">
            <div className="invoice-editor-preview-header">
              <div className="invoice-editor-preview-brand">
                <div className="invoice-editor-preview-logo" aria-hidden>
                  {issuerLogoUrl ? (
                    <img src={issuerLogoUrl} alt="" />
                  ) : (
                    <Phone size={22} />
                  )}
                </div>
                <div>
                  <div className="invoice-editor-preview-issuer">{issuerDisplay}</div>
                  <div className="invoice-editor-preview-meta">{issuerEmail || 'business@example.com'}</div>
                  <div className="invoice-editor-preview-meta">{issuerPhone || '+1 (000) 000-0000'}</div>
                </div>
              </div>
              <div className="invoice-editor-preview-header-right">
                <div className="invoice-editor-preview-meta">{companyAddress || 'Address line'}</div>
                <div className="invoice-editor-preview-meta">{todayLabel}</div>
              </div>
            </div>

            <div className="invoice-editor-preview-card">
              <div className="invoice-editor-preview-columns">
                <div>
                  <div className="invoice-editor-preview-label">Billed to</div>
                  <div className="invoice-editor-preview-strong">
                    {companyTitle.trim() || 'tech ng .org'}
                  </div>
                  <div className="invoice-editor-preview-muted">{companyEmail || 'emmanuel@gmail.com'}</div>
                  <div className="invoice-editor-preview-muted">{companyNumber || '+2334554647'}</div>
                </div>
                <div>
                  <div className="invoice-editor-preview-label">Invoice number</div>
                  <div className="invoice-editor-preview-strong">{invoiceRef}</div>
                </div>
                <div className="invoice-editor-preview-amount-block">
                  <div className="invoice-editor-preview-label">Invoice Amount</div>
                  <div className="invoice-editor-preview-total">
                    {currencySymbol}
                    {Number.isFinite(total) ? total.toLocaleString('en-US') : '0'}
                  </div>
                </div>
              </div>

              <div className="invoice-editor-preview-columns invoice-editor-preview-columns--meta">
                <div>
                  <div className="invoice-editor-preview-label">Invoice name</div>
                  <div className="invoice-editor-preview-muted">{invoiceTitlePreview}</div>
                </div>
                <div>
                  <div className="invoice-editor-preview-label">Invoice Date</div>
                  <div className="invoice-editor-preview-muted">{todayLabel}</div>
                </div>
                <div>
                  <div className="invoice-editor-preview-label">Due Date</div>
                  <div className="invoice-editor-preview-muted">{dueDatePreview}</div>
                </div>
              </div>

              <div className="invoice-editor-preview-table-wrap">
                <table className="invoice-editor-preview-table">
                  <thead>
                    <tr>
                      <th>About</th>
                      <th>Milestone</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="invoice-editor-preview-line-title">{m.serviceTitle || '—'}</div>
                          <div className="invoice-editor-preview-line-desc">{m.description || '—'}</div>
                        </td>
                        <td className="invoice-editor-preview-milestone-num">{idx + 1}</td>
                        <td className="invoice-editor-preview-line-amt">
                          {currencySymbol}
                          {Number.isFinite(Number(m.amount)) && Number(m.amount) !== 0
                            ? Number(m.amount).toLocaleString('en-US')
                            : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-editor-preview-totals">
                <div className="invoice-editor-preview-total-row">
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol}
                    {subtotal.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="invoice-editor-preview-total-row">
                  <span>Task (XPR)</span>
                  <span>
                    {currencySymbol}
                    {platformFee.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="invoice-editor-preview-total-row invoice-editor-preview-total-row--grand">
                  <span>Total</span>
                  <span>
                    {currencySymbol}
                    {total.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            <div className="invoice-editor-preview-footnotes">
              <p className="invoice-editor-preview-footnote">Terms and condition applied</p>
              <p className="invoice-editor-preview-footnote">Pay within 3 days of due date</p>
            </div>
          </div>

          <div className="invoice-editor-preview-actions">
            <button type="button" className="invoice-editor-share-btn" onClick={handleShare}>
              <img
                src={shareIcon}
                alt=""
                className="invoice-editor-share-btn-icon"
                width={18}
                height={18}
                aria-hidden
              />
              Share
            </button>
            <button type="button" className="invoice-editor-download-btn" onClick={handleDownload}>
              <img
                src={downloadCircleIcon}
                alt=""
                className="invoice-editor-download-btn-icon"
                width={18}
                height={18}
                aria-hidden
              />
              Download
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default InvoiceEditorView;
