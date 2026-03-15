import React from 'react';
import { AlertTriangle, Award, Info, FileText, Megaphone, Mail, FileQuestion } from 'lucide-react';
import { TrustDocumentCategory, TrustAnnouncementType } from '@/services/api/trustCenter';

// ── Helpers ───────────────────────────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_APP_URL || 'https://app.cloudanzen.com';

export function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const DOC_CATEGORY_LABELS: Record<TrustDocumentCategory, string> = {
  POLICY:      'Policy',
  REPORT:      'Report',
  CERTIFICATE: 'Certificate',
  WHITEPAPER:  'Whitepaper',
  OTHER:       'Other',
};

export const ANNOUNCEMENT_TYPE_META: Record<TrustAnnouncementType, { label: string; color: string; icon: React.ReactNode }> = {
  SECURITY_UPDATE: { label: 'Security Update', color: 'bg-blue-50 text-blue-700',   icon: <AlertTriangle className="w-3 h-3" /> },
  INCIDENT:        { label: 'Incident',         color: 'bg-red-50 text-red-700',     icon: <AlertTriangle className="w-3 h-3" /> },
  CERTIFICATION:   { label: 'Certification',    color: 'bg-green-50 text-green-700', icon: <Award className="w-3 h-3" /> },
  GENERAL:         { label: 'General',           color: 'bg-gray-100 text-gray-600',  icon: <Info className="w-3 h-3" /> },
};

// ── Tab bar ───────────────────────────────────────────────────────────────────

export const TABS = [
  { key: 'documents',       label: 'Documents',          icon: <FileText className="w-4 h-4" /> },
  { key: 'announcements',   label: 'Announcements',      icon: <Megaphone className="w-4 h-4" /> },
  { key: 'access-requests', label: 'Access Requests',    icon: <Mail className="w-4 h-4" /> },
  { key: 'questionnaires',  label: 'Questionnaires',     icon: <FileQuestion className="w-4 h-4" /> },
] as const;
export type TabKey = (typeof TABS)[number]['key'];
