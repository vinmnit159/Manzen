import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { slackService, SlackIntegration, SlackChannel, SLACK_EVENT_TYPES } from '@/services/api/slack';
import { testsService } from '@/services/api/tests';

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
      <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
    </svg>
  );
}

function SlackAddChannelModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [channelId, setChannelId] = useState('');
  const [channelName, setChannelName] = useState('');
  const [eventType, setEventType] = useState(SLACK_EVENT_TYPES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId.trim() || !channelName.trim()) { setError('Channel ID and name are required'); return; }
    setLoading(true); setError('');
    try {
      await slackService.addChannel({ channelId: channelId.trim(), channelName: channelName.trim(), eventType });
      await testsService.upsertWorkflowIntegrationConfig('slack', { channel: channelName.trim() });
      onAdded(); onClose();
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Failed to add channel mapping');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">Add Channel Mapping</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slack Channel ID <span className="text-gray-400 font-normal">(e.g. C0123ABCDE)</span>
            </label>
            <input type="text" value={channelId} onChange={e => setChannelId(e.target.value)} placeholder="C0123ABCDE"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name</label>
            <input type="text" value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="#security-alerts"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select value={eventType} onChange={e => setEventType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A154B]">
              {SLACK_EVENT_TYPES.map(et => <option key={et.value} value={et.value}>{et.label}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1 bg-[#4A154B] hover:bg-[#3a1039] text-white">
              {loading ? 'Adding...' : 'Add Mapping'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SlackCard({
  slackIntegration,
  channels,
  loadingStatus,
  onDisconnect,
  onChannelsChange,
  onToast,
}: {
  slackIntegration: SlackIntegration | null;
  channels: SlackChannel[];
  loadingStatus: boolean;
  onDisconnect: () => void;
  onChannelsChange: (channels: SlackChannel[]) => void;
  onToast: (type: 'success' | 'error', msg: string) => void;
}) {
  const isConnected = !!slackIntegration;
  const [disconnecting, setDisconnecting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChannels, setShowChannels] = useState(false);

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Slack? This will remove all channel mappings.')) return;
    setDisconnecting(true);
    try {
      await slackService.disconnect();
      onDisconnect();
      onToast('success', 'Slack disconnected');
    } catch {
      onToast('error', 'Failed to disconnect Slack');
    } finally { setDisconnecting(false); }
  }

  async function handleRemoveChannel(id: string) {
    try {
      await slackService.removeChannel(id);
      onChannelsChange(channels.filter(c => c.id !== id));
    } catch {
      onToast('error', 'Failed to remove channel mapping');
    }
  }

  async function handleChannelAdded() {
    try {
      const res = await slackService.getChannels();
      onChannelsChange(res.data ?? []);
    } catch {}
  }

  const eventLabel = (v: string) => SLACK_EVENT_TYPES.find(e => e.value === v)?.label ?? v;

  return (
    <>
      <Card className="p-6 md:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
              <SlackIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Slack</h3>
              <p className="text-sm text-gray-500">Communication · Alerts &amp; interactive notifications</p>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {loadingStatus ? 'Checking...' : isConnected ? 'Connected' : 'Available'}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Receive automated alerts for critical risks, audit findings, overdue tests, and audit events.
          Respond with interactive buttons directly from Slack — accept risks, start remediation, and more.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          {['Critical Risks', 'Audit Findings', 'Overdue Tests', 'Audit Events'].map((l) => (
            <span key={l} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-100 font-medium">{l}</span>
          ))}
        </div>

        {isConnected && slackIntegration && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            Connected to workspace <strong>{slackIntegration.workspaceName}</strong> since {new Date(slackIntegration.createdAt).toLocaleDateString()}.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!loadingStatus && !isConnected && (
            <a href={slackService.getInstallUrl()}>
              <Button className="gap-2 bg-[#4A154B] hover:bg-[#3a1039] text-white">
                <SlackIcon className="w-4 h-4" />
                Connect Slack
              </Button>
            </a>
          )}
          {isConnected && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowChannels(v => !v)}>
                {showChannels ? 'Hide Channels' : `Channel Mappings (${channels.length})`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowChannels(true); setShowAddModal(true); }}
                className="bg-[#4A154B] hover:bg-[#3a1039] text-white border-0">
                + Add Mapping
              </Button>
              <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}
                className="text-red-600 border-red-200 hover:bg-red-50">
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          )}
        </div>

        {/* Channel mappings table — inline, no separate page */}
        {isConnected && showChannels && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Channel Mappings</h4>
            {channels.length === 0 ? (
              <p className="text-sm text-gray-400">No channel mappings yet. Use "+ Add Mapping" to route events to Slack channels.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="py-2 pr-4">Channel</th>
                      <th className="py-2 pr-4">Event</th>
                      <th className="py-2 pr-4">Added</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {channels.map(ch => (
                      <tr key={ch.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium text-gray-900">
                          {ch.channelName}
                          <span className="block text-xs text-gray-400 font-normal">{ch.channelId}</span>
                        </td>
                        <td className="py-2 pr-4">
                          <span className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {eventLabel(ch.eventType)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-xs text-gray-400">{new Date(ch.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => handleRemoveChannel(ch.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {showAddModal && (
        <SlackAddChannelModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleChannelAdded}
        />
      )}
    </>
  );
}
