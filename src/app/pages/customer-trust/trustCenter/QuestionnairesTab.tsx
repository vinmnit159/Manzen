import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileQuestion, ExternalLink } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import { trustCenterService } from '@/services/api/trustCenter';
import { fmt } from './helpers';

// ── Questionnaires Tab ────────────────────────────────────────────────────────

export function QuestionnairesTab() {
  const qc = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trust-questionnaires'],
    queryFn:  () => trustCenterService.listQuestionnaireRequests(),
  });
  const items = data?.data ?? [];

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleComplete(id: string) {
    if (!editUrl.trim()) return showToast('error', 'Response file URL is required');
    setActing(id);
    try {
      await trustCenterService.updateQuestionnaireRequest(id, { status: 'COMPLETED', responseFileUrl: editUrl.trim() });
      qc.invalidateQueries({ queryKey: ['trust-questionnaires'] });
      setEditId(null);
      setEditUrl('');
      showToast('success', 'Questionnaire marked complete');
    } catch (e: any) {
      showToast('error', e?.message ?? 'Failed');
    } finally {
      setActing(null);
    }
  }

  const statusColor: Record<string, string> = {
    PENDING:     'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    COMPLETED:   'bg-green-50 text-green-700',
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
      )}
      <p className="text-sm text-gray-500 mb-4">Manage inbound security questionnaire requests from customers</p>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileQuestion className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-600">No questionnaire requests yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Requester', 'Type', 'Status', 'Requested', 'Response', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{item.requesterEmail}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs capitalize">{item.questionnaireType}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(item.createdAt)}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.responseFileUrl
                        ? <a href={item.responseFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />View</a>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {item.status !== 'COMPLETED' && (
                        editId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Response URL…"
                              value={editUrl}
                              onChange={e => setEditUrl(e.target.value)}
                            />
                            <button onClick={() => handleComplete(item.id)} disabled={acting === item.id} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                              {acting === item.id ? '…' : 'Save'}
                            </button>
                            <button onClick={() => { setEditId(null); setEditUrl(''); }} className="px-2 py-1 text-xs border rounded hover:bg-gray-50">
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditId(item.id); setEditUrl(''); }} className="text-xs text-blue-600 hover:underline">
                            Attach Response
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
