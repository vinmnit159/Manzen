import { useState } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Shield,
  ShieldOff,
  ShieldQuestion,
  Laptop,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  UserCog,
  X,
} from "lucide-react";
import { mdmService, ManagedDevice } from "@/services/api/mdm";
import { usersService } from "@/services/api/users";
import type { UserWithGit } from "@/services/api/users";
import { QK } from "@/lib/queryKeys";
import { STALE } from "@/lib/queryClient";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusIcon({ status }: { status: "COMPLIANT" | "NON_COMPLIANT" | "UNKNOWN" | undefined }) {
  if (status === "COMPLIANT")
    return <Shield className="w-4 h-4 text-green-600" />;
  if (status === "NON_COMPLIANT")
    return <ShieldOff className="w-4 h-4 text-red-500" />;
  return <ShieldQuestion className="w-4 h-4 text-gray-400" />;
}

function ComplianceCheck({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-gray-600">{label}</span>
      {value ? (
        <span className="flex items-center gap-1 text-green-700 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Pass
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-600 font-medium">
          <XCircle className="w-3.5 h-3.5" /> Fail
        </span>
      )}
    </div>
  );
}

// ─── Reassign Owner Modal ─────────────────────────────────────────────────────

interface ReassignModalProps {
  device: ManagedDevice;
  users: UserWithGit[];
  onClose: () => void;
  onSave: (deviceId: string, ownerId: string) => Promise<void>;
}

function ReassignModal({ device, users, onClose, onSave }: ReassignModalProps) {
  const [selectedUserId, setSelectedUserId] = useState(device.ownerId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(device.id, selectedUserId);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to reassign owner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Reassign Device Owner</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {device.hostname ?? device.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Changing the owner will attribute the MDM task to the selected user.
          </p>
          <label className="block text-xs font-medium text-gray-700 mb-1">New Owner</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— select a user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-gray-50 rounded-b-lg">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !selectedUserId || selectedUserId === device.ownerId}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComputersPage() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState<string | null>(null);
  const [reassignDevice, setReassignDevice] = useState<ManagedDevice | null>(null);

  const { data: devicesData, isLoading: loading, isFetching, error: devicesError } = useQuery({
    queryKey: QK.mdmDevices(),
    queryFn: async () => {
      const res = await mdmService.listDevices();
      return res.devices;
    },
    staleTime: STALE.MDM,
  });

  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      const res = await usersService.listUsers();
      return res.users;
    },
    staleTime: STALE.USERS,
  });

  const devices: ManagedDevice[] = devicesData ?? [];
  const users: UserWithGit[] = usersData ?? [];
  const error: string | null = devicesError ? ((devicesError as any)?.message ?? "Failed to load devices") : null;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRevoke = async (device: ManagedDevice) => {
    if (!confirm(`Revoke ${device.name}? The agent will no longer be able to check in.`)) return;
    setRevoking(device.id);
    try {
      await mdmService.revokeDevice(device.id);
      // Invalidate so the cache gets fresh revocation status
      qc.invalidateQueries({ queryKey: QK.mdmDevices() });
    } catch (e: any) {
      alert(e?.message ?? "Failed to revoke device");
    } finally {
      setRevoking(null);
    }
  };

  const handleReassignOwner = async (deviceId: string, ownerId: string) => {
    await mdmService.reassignOwner(deviceId, ownerId);
    // Invalidate devices + onboarding data (MDM task credit may change)
    qc.invalidateQueries({ queryKey: QK.mdmDevices() });
    qc.invalidateQueries({ queryKey: ['onboarding'] });
  };

  const ownerLabel = (ownerId: string | null) => {
    if (!ownerId) return null;
    const u = users.find((u) => u.id === ownerId);
    return u ? (u.name || u.email) : null;
  };

  const compliant = devices.filter((d) => d.compliance?.complianceStatus === "COMPLIANT").length;
  const nonCompliant = devices.filter((d) => d.compliance?.complianceStatus === "NON_COMPLIANT").length;

  return (
    <PageTemplate
      title="Computers"
      description="Managed Mac endpoints reporting to Manzen MDM. Enroll devices from the Integrations page."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => qc.invalidateQueries({ queryKey: QK.mdmDevices() })}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {!loading && devices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Total Devices", value: devices.length, color: "text-gray-700" },
            { label: "Compliant", value: compliant, color: "text-green-700" },
            { label: "Non-Compliant", value: nonCompliant, color: "text-red-600" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading devices…
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                    No managed devices yet. Go to{" "}
                    <a href="/integrations" className="text-blue-600 underline">Integrations</a>{" "}
                    to create an enrollment token and install the agent.
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isExpanded = expanded.has(device.id);
                  const cs = device.compliance?.complianceStatus;
                  const revoked = device.enrollment?.revoked;
                  const owner = ownerLabel(device.ownerId);

                  return (
                    <>
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <div className="text-sm font-mono font-medium text-gray-900">
                                {device.hostname ?? device.name}
                              </div>
                              {device.serialNumber && (
                                <div className="text-xs text-gray-400">{device.serialNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {device.osType === "darwin" ? "macOS" : device.osType ?? "—"}{" "}
                          <span className="text-gray-400">{device.osVersion}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {owner ?? <span className="text-gray-300 italic">unassigned</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.enrollment?.lastSeenAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(device.enrollment.lastSeenAt)}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={cs} />
                            <span className="text-xs font-medium text-gray-700">
                              {cs === "COMPLIANT" ? "Compliant"
                                : cs === "NON_COMPLIANT" ? "Non-compliant"
                                : "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={revoked ? "destructive" : "default"}>
                            {revoked ? "Revoked" : "Active"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(device.id)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Details
                            </button>
                            <button
                              onClick={() => setReassignDevice(device)}
                              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                              title="Reassign owner"
                            >
                              <UserCog className="w-3.5 h-3.5" />
                            </button>
                            {!revoked && (
                              <button
                                onClick={() => handleRevoke(device)}
                                disabled={revoking === device.id}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                title="Revoke device"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && device.compliance && (
                        <tr key={`${device.id}-detail`} className="bg-blue-50">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-0 divide-y divide-blue-100">
                              <ComplianceCheck label="Disk Encryption (A.8.24)" value={device.compliance.diskEncryptionEnabled} />
                              <ComplianceCheck label="Screen Lock (A.5.15)" value={device.compliance.screenLockEnabled} />
                              <ComplianceCheck label="Firewall (A.8.20)" value={device.compliance.firewallEnabled} />
                              <ComplianceCheck label="Antivirus (A.8.7)" value={device.compliance.antivirusEnabled} />
                              <ComplianceCheck label="System Integrity (A.8.7)" value={device.compliance.systemIntegrityEnabled} />
                              <ComplianceCheck label="Auto Updates (A.8.8)" value={device.compliance.autoUpdateEnabled} />
                              <ComplianceCheck label="Gatekeeper" value={device.compliance.gatekeeperEnabled} />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Last checked: {new Date(device.compliance.lastCheckedAt).toLocaleString()}
                            </p>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && devices.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
            {devices.length} managed device{devices.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>

      {reassignDevice && (
        <ReassignModal
          device={reassignDevice}
          users={users}
          onClose={() => setReassignDevice(null)}
          onSave={handleReassignOwner}
        />
      )}
    </PageTemplate>
  );
}
