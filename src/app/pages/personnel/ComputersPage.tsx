import { useEffect, useState, useCallback } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
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
} from "lucide-react";
import { mdmService, ManagedDevice } from "@/services/api/mdm";

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

// ─── Component ────────────────────────────────────────────────────────────────

export function ComputersPage() {
  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await mdmService.listDevices();
      setDevices(res.devices);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

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
      setDevices((prev) =>
        prev.map((d) =>
          d.id === device.id
            ? { ...d, enrollment: d.enrollment ? { ...d.enrollment, revoked: true } : null }
            : d
        )
      );
    } catch (e: any) {
      alert(e?.message ?? "Failed to revoke device");
    } finally {
      setRevoking(null);
    }
  };

  // Summary stats
  const compliant = devices.filter((d) => d.compliance?.complianceStatus === "COMPLIANT").length;
  const nonCompliant = devices.filter((d) => d.compliance?.complianceStatus === "NON_COMPLIANT").length;

  return (
    <PageTemplate
      title="Computers"
      description="Managed Mac endpoints reporting to Manzen MDM. Enroll devices from the Integrations page."
      actions={
        <Button variant="outline" size="sm" onClick={fetchDevices} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* Summary cards */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Seen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading devices…
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
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

                  return (
                    <>
                      <tr key={device.id} className="hover:bg-gray-50">
                        {/* Device */}
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

                        {/* OS */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {device.osType === "darwin" ? "macOS" : device.osType ?? "—"}{" "}
                          <span className="text-gray-400">{device.osVersion}</span>
                        </td>

                        {/* Last seen */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {device.enrollment?.lastSeenAt ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(device.enrollment.lastSeenAt)}
                            </span>
                          ) : "—"}
                        </td>

                        {/* Compliance */}
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

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={revoked ? "destructive" : "default"}>
                            {revoked ? "Revoked" : "Active"}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpand(device.id)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Details
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

                      {/* Expanded compliance detail */}
                      {isExpanded && device.compliance && (
                        <tr key={`${device.id}-detail`} className="bg-blue-50">
                          <td colSpan={6} className="px-8 py-3">
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
    </PageTemplate>
  );
}
