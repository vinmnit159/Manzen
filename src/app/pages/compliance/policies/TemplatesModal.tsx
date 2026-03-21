/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import React, { useState, useEffect } from 'react';
import { policiesService, PolicyTemplate } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import { FileText, Search, X, AlertCircle, CheckCircle2, Plus, Loader2 } from 'lucide-react';

const CATEGORY_ORDER = ['ISMS Core', 'Technical', 'People', 'Resilience'] as const;

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  'ISMS Core':  { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  'Technical':  { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'People':     { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  'Resilience': { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
};

export function TemplatesModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (policy: Policy) => void;
}) {
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    policiesService.getTemplates().then(res => {
      if (res.success && res.data) setTemplates(res.data);
      else setError('Failed to load templates');
    }).catch(() => setError('Failed to load templates')).finally(() => setLoading(false));
  }, []);

  const handleUse = async (template: PolicyTemplate) => {
    if (creating || done.has(template.name)) return;
    setCreating(template.name);
    setCardError(null);
    try {
      const res = await policiesService.createPolicyFromTemplate({ templateName: template.name }) as any;
      const policy: Policy = res.data;
      setDone(prev => new Set([...prev, template.name]));
      onCreated(policy);
    } catch (err: unknown) {
      setCardError(err instanceof Error ? err.message : 'Failed to create policy');
    } finally {
      setCreating(null);
    }
  };

  const filtered = templates.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.isoReferences.some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  const grouped = CATEGORY_ORDER.reduce<Record<string, PolicyTemplate[]>>((acc, cat) => {
    const items = filtered.filter(t => t.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Policy Templates</h2>
            <p className="text-sm text-gray-500 mt-0.5">27 ISO 27001 templates — creates the policy with an editable .docx document attached</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category, or ISO reference…"
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Global card error banner */}
        {cardError && (
          <div className="mx-6 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {cardError}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Loading templates…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-8 h-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">No templates match your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([category, items]) => {
                const cfg = CATEGORY_CONFIG[category] ?? { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                        {category}
                      </span>
                      <span className="text-xs text-gray-400">{items.length} template{items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map(template => {
                        const isCreating = creating === template.name;
                        const isDone     = done.has(template.name);
                        return (
                          <div
                            key={template.name}
                            className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                              isDone
                                ? 'border-green-200 bg-green-50/40'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${isDone ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
                              {isDone
                                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                : <FileText className="w-4 h-4 text-blue-600" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 leading-snug">{template.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{template.description}</p>
                              {template.isoReferences.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.isoReferences.map(ref => (
                                    <span key={ref} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                      {ref}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {isDone && (
                                <p className="text-xs text-green-700 font-medium mt-1.5">Policy created — editable .docx attached</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleUse(template)}
                              disabled={isCreating || isDone || !!creating}
                              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm ${
                                isDone
                                  ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                                  : isCreating
                                    ? 'bg-blue-400 text-white cursor-wait'
                                    : creating
                                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isCreating ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating…</>
                              ) : isDone ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" />Created</>
                              ) : (
                                <><Plus className="w-3.5 h-3.5" />Use This Template</>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
