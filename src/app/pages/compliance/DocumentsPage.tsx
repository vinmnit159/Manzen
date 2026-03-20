import { useEffect, useState, useMemo } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  FileText,
  Loader2,
  ShieldCheck,
  Cpu,
  Download,
  Plus,
} from 'lucide-react';
import { evidenceService } from '@/services/api/evidence';
import { controlsService } from '@/services/api/controls';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';

import {
  EvidenceDetailPanel,
  EvidenceItem,
  ControlOption,
  typeVariant,
  controlStatusColor,
} from './documents/EvidenceDetailPanel';
import { UploadEvidenceModal } from './documents/UploadEvidenceModal';

/**
 * Maps an ISO control reference prefix to a canonical framework slug.
 */
function isoReferenceToFrameworkSlug(
  isoRef: string | undefined | null,
): string | null {
  if (!isoRef) return null;
  const ref = isoRef.trim().toUpperCase();
  if (ref.startsWith('A.') || ref.startsWith('ISO')) return 'iso-27001';
  if (
    ref.startsWith('CC') ||
    ref.startsWith('A1') ||
    ref.startsWith('C1') ||
    ref.startsWith('P') ||
    ref.startsWith('PI')
  )
    return 'soc-2';
  if (ref.startsWith('164.')) return 'hipaa';
  if (
    ref.startsWith('GV.') ||
    ref.startsWith('ID.') ||
    ref.startsWith('PR.') ||
    ref.startsWith('DE.') ||
    ref.startsWith('RS.') ||
    ref.startsWith('RC.')
  )
    return 'nist-csf';
  return null;
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    automated: number;
    manual: number;
  } | null>(null);
  const [controls, setControls] = useState<ControlOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, update, reset } = useUrlFilterState({
    defaults: { type: 'ALL', search: '', frameworks: [] as string[] },
    arrayKeys: ['frameworks'],
  });
  const filter = filters.type as 'ALL' | 'AUTOMATED' | 'FILE';
  const search = filters.search;
  const frameworkFilter = filters.frameworks;
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      evidenceService.getEvidence(),
      evidenceService.getEvidenceStats(),
      controlsService.getControls({ limit: 200 }),
    ])
      .then(([evidRes, statsRes, ctrlRes]) => {
        if (cancelled) return;
        setEvidence((evidRes?.data ?? []) as EvidenceItem[]);
        setStats(statsRes?.data ?? null);
        const ctrlData = (ctrlRes as { data?: ControlOption[] })?.data ?? [];
        setControls(
          ctrlData.map((c) => ({
            id: c.id,
            isoReference: c.isoReference,
            title: c.title,
          })),
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) console.error('Failed to load evidence data', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []); // loadData deps are stable — no changes after mount

  const filtered = useMemo(() => {
    return evidence.filter((e) => {
      const matchesType = filter === 'ALL' || e.type === filter;
      const haystack =
        `${e.fileName ?? ''} ${e.control?.isoReference ?? ''} ${e.control?.title ?? ''} ${e.collectedBy ?? ''}`.toLowerCase();
      const matchesSearch =
        search.trim() === '' || haystack.includes(search.trim().toLowerCase());
      const matchesFramework =
        frameworkFilter.length === 0 ||
        (() => {
          const slug = isoReferenceToFrameworkSlug(
            e.control?.isoReference ?? null,
          );
          return slug !== null && frameworkFilter.includes(slug);
        })();
      return matchesType && matchesFramework && matchesSearch;
    });
  }, [evidence, filter, frameworkFilter, search]);

  const activeFilters = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: `Search: ${search.trim()}`,
            onRemove: () => update({ search: '' }),
          },
        ]
      : []),
    ...(filter !== 'ALL'
      ? [
          {
            key: 'type',
            label: `Type: ${filter}`,
            onRemove: () => update({ type: 'ALL' }),
          },
        ]
      : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `Framework: ${slug.replace(/-/g, ' ')}`,
      onRemove: () =>
        update({ frameworks: frameworkFilter.filter((item) => item !== slug) }),
    })),
  ];

  const handleDownload = async (ev: EvidenceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ev.fileUrl) return;
    setDownloading(ev.id);
    try {
      await evidenceService.downloadEvidence(
        ev.id,
        ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`,
      );
    } catch (err) {
      console.error('Failed to download evidence', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleUploaded = (newEv: EvidenceItem) => {
    setEvidence((prev) => [newEv, ...prev]);
    setStats((prev) =>
      prev ? { ...prev, total: prev.total + 1, manual: prev.manual + 1 } : prev,
    );
    setShowUpload(false);
  };

  return (
    <PageTemplate
      title="Evidence & Documents"
      description="Compliance evidence collected automatically from GitHub and uploaded manually."
    >
      {/* Upload Modal */}
      {showUpload && (
        <UploadEvidenceModal
          controls={controls}
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
        />
      )}

      {/* Evidence detail slide-over */}
      {selectedEvidence && (
        <EvidenceDetailPanel
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats + Upload button row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {stats && (
              <div className="grid grid-cols-3 gap-4 flex-1">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">Total</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <Cpu className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600">Automated</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.automated}
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-1">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600">Manual</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.manual}
                  </div>
                </Card>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors flex-shrink-0 self-start"
            >
              <Plus className="w-4 h-4" />
              Upload Evidence
            </button>
          </div>

          <PageFilterBar
            searchValue={search}
            onSearchChange={(value) => update({ search: value })}
            searchPlaceholder="Search files, controls, or collected by"
            selects={[
              {
                key: 'type',
                value: filter,
                placeholder: 'Type',
                onChange: (value) =>
                  update({ type: value as 'ALL' | 'AUTOMATED' | 'FILE' }),
                options: [
                  { value: 'ALL', label: `All (${evidence.length})` },
                  {
                    value: 'AUTOMATED',
                    label: `Automated (${evidence.filter((item) => item.type === 'AUTOMATED').length})`,
                  },
                  {
                    value: 'FILE',
                    label: `File (${evidence.filter((item) => item.type === 'FILE').length})`,
                  },
                ],
              },
            ]}
            auxiliary={
              <FrameworkFilter
                selected={frameworkFilter}
                onChange={(value) => update({ frameworks: value })}
              />
            }
            resultCount={filtered.length}
            resultLabel="evidence items"
            activeFilters={activeFilters}
            onClearAll={reset}
          />

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {[
                      'Evidence / File',
                      'Type',
                      'ISO Control',
                      'Control Status',
                      'Collected By',
                      'Date',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-sm text-gray-400"
                      >
                        No evidence records found.{' '}
                        {filter === 'ALL'
                          ? 'Connect GitHub and run a scan, or upload a file manually.'
                          : 'Try switching to "All".'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ev) => {
                      const isFile = !!ev.fileUrl;
                      const isDownloading = downloading === ev.id;

                      return (
                        <tr
                          key={ev.id}
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedEvidence(ev)}
                        >
                          {/* Evidence / File */}
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              {ev.automated ? (
                                <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className="truncate max-w-[200px]">
                                {ev.fileName ?? `evidence-${ev.id.slice(0, 8)}`}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-500 transition-opacity flex-shrink-0">
                                View →
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={typeVariant(ev.type)}>
                              {ev.type}
                            </Badge>
                          </td>

                          {/* ISO Control */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {ev.control ? (
                              <div>
                                <span className="font-mono text-blue-600 font-medium">
                                  {ev.control.isoReference}
                                </span>
                                <p className="text-xs text-gray-400 truncate max-w-[150px]">
                                  {ev.control.title}
                                </p>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* Control Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {ev.control ? (
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${controlStatusColor(ev.control.status)}`}
                              >
                                {ev.control.status.replace(/_/g, ' ')}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          {/* Collected By */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ev.collectedBy ?? 'system'}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                            {new Date(ev.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td
                            className="px-6 py-4 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isFile ? (
                              <button
                                onClick={(e) => handleDownload(ev, e)}
                                disabled={isDownloading}
                                title="Download file"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 bg-white hover:bg-green-50 hover:border-green-300 hover:text-green-700 text-gray-600 transition-colors disabled:opacity-50"
                              >
                                {isDownloading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                {isDownloading ? '…' : 'Download'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
