import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  slackService,
  SlackIntegration,
  SlackChannel,
  SlackEventLog,
  SLACK_EVENT_TYPES,
} from '@/services/api/slack';

// ─── Slack logo ───────────────────────────────────────────────────────────────

function SlackLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
      <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
    </svg>
  );
}

// ─── Event type label helper ──────────────────────────────────────────────────

function eventTypeLabel(value: string) {
  return SLACK_EVENT_TYPES.find(e => e.value === value)?.label ?? value;
}

// ─── Add Channel Modal ────────────────────────────────────────────────────────

function AddChannelModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [eventType, setEventType] = useState(SLACK_EVENT_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId.trim() || !channelName.trim()) {
      setError('Channel ID and name are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await slackService.addChannel({ channelId: channelId.trim(), channelName: channelName.trim(), eventType });
      onAdded();
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add channel mapping');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Add Channel Mapping</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slack Channel ID
              <span className="text-gray-400 font-normal ml-1">(e.g. C0123ABCDE — from channel details)</span>
            </label>
            <input
              type="text"
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="C0123ABCDE"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
            <input
              type="text"
              value={channelName}
              onChange={e => setChannelName(e.target.value)}
              placeholder="#security-alerts"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]"
            >
              {SLACK_EVENT_TYPES.map(et => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-[#4A154B] hover:bg-[#3a1039] text-white">
              {loading ? 'Adding...' : 'Add Mapping'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SlackIntegrationPage() {
  const [searchParams] = useSearchParams();
  const [integration, setIntegration] = useState<SlackIntegration | null>(null);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [events, setEvents] = useState<SlackEventLog[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const connected = searchParams.get('connected');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    if (connected === 'slack') {
      setBanner({ type: 'success', message: 'Slack workspace connected successfully!' });
    } else if (errorParam) {
      setBanner({ type: 'error', message: `Connection failed: ${errorParam}` });
    }
  }, [connected, errorParam]);

  async function load() {
    setLoading(true);
    try {
      const [statusRes, channelsRes, eventsRes] = await Promise.all([
        slackService.getStatus(),
        slackService.getChannels(),
        slackService.getEvents(1, 50),
      ]);
      setIntegration(statusRes.data);
      setChannels(channelsRes.data ?? []);
      setEvents(eventsRes.data ?? []);
      setTotalEvents(eventsRes.total ?? 0);
    } catch {
      // silently fail — might not be connected
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDisconnect() {
    if (!confirm('Disconnect Slack? This will remove all channel mappings.')) return;
    setDisconnecting(true);
    try {
      await slackService.disconnect();
      setIntegration(null);
      setChannels([]);
      setBanner({ type: 'success', message: 'Slack disconnected.' });
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message ?? 'Failed to disconnect' });
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleRemoveChannel(id: string) {
    try {
      await slackService.removeChannel(id);
      setChannels(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setBanner({ type: 'error', message: err?.message ?? 'Failed to remove mapping' });
    }
  }

  return (
    <PageTemplate title="Slack Integration" description="Connect Slack to receive ISMS notifications and interact with records directly from Slack.">
      <div className="space-y-6 max-w-4xl">

        {/* Banner */}
        {banner && (
          <div className={`p-4 rounded-lg text-sm font-medium ${banner.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {banner.message}
            <button onClick={() => setBanner(null)} className="ml-4 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Connection card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <SlackLogo className="w-12 h-12 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Slack</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Receive automated alerts for critical risks, audit findings, overdue tests, and more. Respond with interactive buttons directly from Slack.
              </p>
              {loading ? (
                <p className="text-sm text-gray-400 mt-3">Loading...</p>
              ) : integration ? (
                <div className="mt-3 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Connected to <strong>{integration.workspaceName}</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              ) : (
                <div className="mt-3">
                  <a href={slackService.getInstallUrl()}>
                    <Button className="bg-[#4A154B] hover:bg-[#3a1039] text-white gap-2">
                      <SlackLogo className="w-4 h-4" />
                      Connect Slack Workspace
                    </Button>
                  </a>
                  <p className="text-xs text-gray-400 mt-2">
                    You'll be redirected to Slack to authorize the ISMS app in your workspace.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Channel mappings — only show when connected */}
        {integration && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Channel Mappings</h3>
                <p className="text-sm text-gray-500">Route specific ISMS events to Slack channels.</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-[#4A154B] hover:bg-[#3a1039] text-white"
              >
                + Add Mapping
              </Button>
            </div>

            {channels.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                No channel mappings yet. Add one above to start receiving notifications.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Channel</th>
                      <th className="py-2 pr-4">Event Type</th>
                      <th className="py-2 pr-4">Added</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {channels.map(ch => (
                      <tr key={ch.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {ch.channelName}
                          <span className="block text-xs text-gray-400 font-normal">{ch.channelId}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {eventTypeLabel(ch.eventType)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">
                          {new Date(ch.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleRemoveChannel(ch.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Supported events reference */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Supported Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SLACK_EVENT_TYPES.map(et => (
              <div key={et.value} className="flex items-start gap-2">
                <span className="mt-0.5 w-2 h-2 rounded-full bg-[#4A154B] flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{et.label}</p>
                  <p className="text-xs text-gray-400">{et.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Event log — only show when connected */}
        {integration && (
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Event Log</h3>
            <p className="text-sm text-gray-500 mb-4">
              Recent Slack notifications and interactions ({totalEvents} total).
            </p>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No events yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Entity</th>
                      <th className="py-2">Slack User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {events.map(ev => (
                      <tr key={ev.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(ev.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            ev.actionType === 'NOTIFICATION_SENT'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-orange-50 text-orange-700'
                          }`}>
                            {ev.actionType === 'NOTIFICATION_SENT' ? 'Notification Sent' : 'Button Clicked'}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-700 text-xs">
                          {ev.entityType} <span className="text-gray-400">{ev.entityId.slice(0, 8)}…</span>
                        </td>
                        <td className="py-2 text-xs text-gray-400">
                          {ev.slackUserId ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {showAddModal && (
        <AddChannelModal
          onClose={() => setShowAddModal(false)}
          onAdded={load}
        />
      )}
    </PageTemplate>
  );
}
