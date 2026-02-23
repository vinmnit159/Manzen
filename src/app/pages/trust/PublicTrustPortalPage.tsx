/**
 * PublicTrustPortalPage — /trust/:orgSlug
 *
 * Fully public page (no auth required).
 * Renders the customer-facing trust center for an organisation.
 */
import { useState } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, FileText, Download, Lock, Mail, CheckCircle2, AlertTriangle,
  Award, Info, Megaphone, ExternalLink, FileQuestion, ChevronDown, Globe,
} from 'lucide-react';
import {
  trustCenterService,
  PublicTrustDocument, TrustDocumentCategory, TrustAnnouncementType,
  PublicAccessRequestPayload,
} from '@/services/api/trustCenter';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const DOC_CATEGORY_LABELS: Record<TrustDocumentCategory, string> = {
  POLICY:      'Policy',
  REPORT:      'Report',
  CERTIFICATE: 'Certificate',
  WHITEPAPER:  'Whitepaper',
  OTHER:       'Other',
};

const DOC_CATEGORY_COLORS: Record<TrustDocumentCategory, string> = {
  POLICY:      'bg-blue-50 text-blue-700',
  REPORT:      'bg-purple-50 text-purple-700',
  CERTIFICATE: 'bg-green-50 text-green-700',
  WHITEPAPER:  'bg-gray-100 text-gray-600',
  OTHER:       'bg-gray-100 text-gray-600',
};

const ANNOUNCEMENT_COLORS: Record<TrustAnnouncementType, { bg: string; icon: React.ReactNode }> = {
  SECURITY_UPDATE: { bg: 'border-l-blue-500',  icon: <Shield className="w-4 h-4 text-blue-500" /> },
  INCIDENT:        { bg: 'border-l-red-500',   icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  CERTIFICATION:   { bg: 'border-l-green-500', icon: <Award className="w-4 h-4 text-green-500" /> },
  GENERAL:         { bg: 'border-l-gray-400',  icon: <Info className="w-4 h-4 text-gray-400" /> },
};

// ── Access Request Modal ──────────────────────────────────────────────────────

function AccessRequestModal({
  orgSlug,
  document,
  primaryColor,
  onClose,
}: {
  orgSlug:      string;
  document:     PublicTrustDocument | null; // null = general access
  primaryColor: string;
  onClose:      () => void;
}) {
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [company,   setCompany]   = useState('');
  const [purpose,   setPurpose]   = useState('');
  const [ndaSigned, setNdaSigned] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  const needsNda = document?.requiresNda ?? false;

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--tc-color)] bg-white';

  async function handleSubmit() {
    if (!name.trim()) return setError('Your name is required');
    if (!email.trim() || !email.includes('@')) return setError('Valid email is required');
    if (needsNda && !ndaSigned) return setError('You must accept the NDA to request access');
    setError('');
    setSaving(true);
    try {
      const payload: PublicAccessRequestPayload = {
        requesterName:  name.trim(),
        requesterEmail: email.trim(),
        company:        company.trim() || undefined,
        purpose:        purpose.trim() || undefined,
        documentId:     document?.id,
        ndaSigned,
      };
      await trustCenterService.submitAccessRequest(orgSlug, payload);
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to submit request. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Request Submitted</h3>
            <p className="text-sm text-gray-500 mb-5">We'll review your request and respond via email shortly.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700">Close</button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                {document ? `Request Access — ${document.name}` : 'Request Access'}
              </h3>
              {document && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {needsNda ? 'This document requires NDA acceptance.' : 'We will review your request.'}
                </p>
              )}
            </div>
            <div className="px-6 py-5 space-y-3">
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-red-400">*</span></label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Work Email <span className="text-red-400">*</span></label>
                <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                <input className={inputCls} value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Purpose / Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={3} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Briefly describe why you need this document…" />
              </div>
              {needsNda && (
                <label className="flex items-start gap-2.5 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0" checked={ndaSigned} onChange={e => setNdaSigned(e.target.checked)} />
                  <span className="text-xs text-amber-800">
                    I agree to the Non-Disclosure Agreement and understand that the requested document is confidential and must not be shared with third parties.
                  </span>
                </label>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Questionnaire Modal ───────────────────────────────────────────────────────

function QuestionnaireModal({ orgSlug, primaryColor, onClose }: { orgSlug: string; primaryColor: string; onClose: () => void }) {
  const [email,   setEmail]   = useState('');
  const [type,    setType]    = useState('STANDARD');
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2';

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) return setError('Valid email is required');
    setError('');
    setSaving(true);
    try {
      await trustCenterService.submitQuestionnaireRequest(orgSlug, { requesterEmail: email.trim(), questionnaireType: type });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? 'Failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Request Received</h3>
            <p className="text-sm text-gray-500 mb-5">We'll prepare your security questionnaire and email it to you.</p>
            <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700">Close</button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Request Security Questionnaire</h3>
              <p className="text-xs text-gray-500 mt-0.5">We'll respond with a completed questionnaire via email.</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Your Email <span className="text-red-400">*</span></label>
                <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="security@yourcompany.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Questionnaire Type</label>
                <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
                  <option value="STANDARD">Standard Security Questionnaire</option>
                  <option value="SOC2">SOC 2 Questionnaire</option>
                  <option value="ISO27001">ISO 27001 Questionnaire</option>
                  <option value="CUSTOM">Custom / CAIQ</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {saving ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Compliance Donut ──────────────────────────────────────────────────────────

function ComplianceDonut({ pct, color }: { pct: number; color: string }) {
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg width="96" height="96" className="rotate-[-90deg]">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PublicTrustPortalPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [accessDoc,      setAccessDoc]      = useState<PublicTrustDocument | 'general' | null>(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [expandedAnn,    setExpandedAnn]    = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-trust', orgSlug],
    queryFn:  () => trustCenterService.getPublicPortal(orgSlug!),
    enabled:  !!orgSlug,
    retry: false,
  });

  const portal = data?.data;
  const primaryColor = portal?.settings?.primaryColor ?? '#2563eb';

  // CSS variable injection for brand color
  const styleVars = { '--tc-color': primaryColor } as React.CSSProperties;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Loading trust portal…</p>
        </div>
      </div>
    );
  }

  if (isError || !portal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-4">
          <Shield className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Trust Center Not Found</h1>
          <p className="text-sm text-gray-500">This organisation's trust portal is not available or has not been enabled yet.</p>
        </div>
      </div>
    );
  }

  const { settings, documents, announcements, metricsSnapshot, lastAudit } = portal;

  // Split documents into public-immediate and NDA-gated
  const freeDocuments = documents.filter(d => !d.requiresNda);
  const ndaDocuments  = documents.filter(d => d.requiresNda);

  const publishedAnnouncements = announcements;

  return (
    <div className="min-h-screen bg-gray-50" style={styleVars}>

      {/* ── Header / Hero ─────────────────────────────────────────────── */}
      <header className="text-white py-12 px-4" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{settings.orgName}</h1>
              <p className="text-sm opacity-80">Security & Trust Center</p>
            </div>
          </div>
          {settings.description && (
            <p className="text-sm opacity-90 max-w-2xl leading-relaxed">{settings.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-6">
            {settings.securityEmail && (
              <a
                href={`mailto:${settings.securityEmail}`}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" /> {settings.securityEmail}
              </a>
            )}
            <button
              onClick={() => setShowQuestModal(true)}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <FileQuestion className="w-4 h-4" /> Request Questionnaire
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Compliance Status ──────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: primaryColor }} /> Compliance Status
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Compliance % donut */}
            {metricsSnapshot ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center">
                <div className="relative mb-2">
                  <ComplianceDonut pct={metricsSnapshot.compliancePercentage} color={primaryColor} />
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900" style={{ transform: 'rotate(0deg)' }}>
                    {metricsSnapshot.compliancePercentage}%
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-700 mt-1">ISO 27001 Compliance</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {metricsSnapshot.completedControls}/{metricsSnapshot.controlCount} controls
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center min-h-[130px]">
                <p className="text-sm text-gray-400">Compliance data not yet published</p>
              </div>
            )}

            {/* Last Audit */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Last Audit</p>
              {lastAudit ? (
                <>
                  <p className="text-sm font-semibold text-gray-900 truncate">{lastAudit.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{lastAudit.type.toLowerCase()} audit</p>
                  <p className="text-xs text-gray-400 mt-2">{fmt(lastAudit.closedAt)}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No completed audits yet</p>
              )}
            </div>

            {/* Certifications card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Certifications</p>
              {documents.filter(d => d.category === 'CERTIFICATE').length > 0 ? (
                <div className="space-y-1.5">
                  {documents.filter(d => d.category === 'CERTIFICATE').slice(0, 3).map(cert => (
                    <div key={cert.id} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primaryColor }} />
                      <span className="text-xs text-gray-700 truncate">{cert.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No certificates published</p>
              )}
            </div>

            {/* Security commitments / contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Security Contact</p>
              {settings.securityEmail ? (
                <a href={`mailto:${settings.securityEmail}`} className="flex items-center gap-2 text-sm hover:underline" style={{ color: primaryColor }}>
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{settings.securityEmail}</span>
                </a>
              ) : (
                <p className="text-sm text-gray-400">Not provided</p>
              )}
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                For security disclosures, reports, or compliance inquiries.
              </p>
            </div>
          </div>
        </section>

        {/* ── Documents ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: primaryColor }} /> Documents
          </h2>

          {documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500">No documents published yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Free documents */}
              {freeDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Publicly Available
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {freeDocuments.map(doc => (
                      <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                            <FileText className="w-4 h-4" style={{ color: primaryColor }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${DOC_CATEGORY_COLORS[doc.category]}`}>{DOC_CATEGORY_LABELS[doc.category]}</span>
                              {doc.version && <span className="text-xs text-gray-400">{doc.version}</span>}
                            </div>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors text-white flex-shrink-0"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NDA-gated documents */}
              {ndaDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 mt-4 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Requires NDA / Access Request
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ndaDocuments.map(doc => (
                      <div key={doc.id} className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-4 h-4 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${DOC_CATEGORY_COLORS[doc.category]}`}>{DOC_CATEGORY_LABELS[doc.category]}</span>
                              <span className="text-xs text-amber-600 font-medium">NDA required</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setAccessDoc(doc)}
                          className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border-2 transition-colors flex-shrink-0"
                          style={{ borderColor: primaryColor, color: primaryColor }}
                        >
                          Request Access
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Announcements ─────────────────────────────────────────── */}
        {publishedAnnouncements.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5" style={{ color: primaryColor }} /> Security Updates
            </h2>
            <div className="space-y-3">
              {publishedAnnouncements.map(ann => {
                const meta = ANNOUNCEMENT_COLORS[ann.type];
                const isExpanded = expandedAnn === ann.id;
                return (
                  <div key={ann.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm border-l-4 ${meta.bg}`}>
                    <button
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                      onClick={() => setExpandedAnn(isExpanded ? null : ann.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {meta.icon}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ann.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmt(ann.createdAt)}</p>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{ann.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Request Access / Questionnaire CTA ────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <FileQuestion className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Need More Information?</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
            Request a security questionnaire or contact our security team for compliance-related inquiries.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowQuestModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <FileQuestion className="w-4 h-4" /> Request Security Questionnaire
            </button>
            {settings.securityEmail && (
              <a
                href={`mailto:${settings.securityEmail}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-opacity hover:opacity-80"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                <Mail className="w-4 h-4" /> Contact Security Team
              </a>
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-10 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} {settings.orgName}. All rights reserved.</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Powered by ISMS Platform
          </span>
        </div>
      </footer>

      {/* Modals */}
      {accessDoc !== null && (
        <AccessRequestModal
          orgSlug={orgSlug!}
          document={accessDoc === 'general' ? null : accessDoc}
          primaryColor={primaryColor}
          onClose={() => setAccessDoc(null)}
        />
      )}
      {showQuestModal && (
        <QuestionnaireModal
          orgSlug={orgSlug!}
          primaryColor={primaryColor}
          onClose={() => setShowQuestModal(false)}
        />
      )}
    </div>
  );
}
