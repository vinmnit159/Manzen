import { useEffect, useState } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Plus,
  RefreshCw,
  Github,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  X,
  ShieldCheck,
  Laptop,
  BookOpen,
  FileText,
  ChevronRight,
} from "lucide-react";
import { usersService, UserWithGit } from "@/services/api/users";
import { onboardingService, UserOnboardingSummary } from "@/services/api/onboarding";
import { Role } from "@/services/api/types";

// ─── Role badge colour map ─────────────────────────────────────────────────

const ROLE_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  SUPER_ADMIN:    "destructive",
  ORG_ADMIN:      "destructive",
  SECURITY_OWNER: "default",
  AUDITOR:        "secondary",
  CONTRIBUTOR:    "secondary",
  VIEWER:         "outline",
};

function roleLabel(role: string): string {
  return role.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Onboarding progress mini-badge ──────────────────────────────────────────

function OnboardingBadge({ count, total }: { count: number; total: number }) {
  if (count === total) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> {count}/{total}
    </span>
  );
  if (count > 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> {count}/{total}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-400 border border-gray-200">
      <Circle className="w-3 h-3" /> {count}/{total}
    </span>
  );
}

// ─── User Detail Side Panel ──────────────────────────────────────────────────

interface TaskRowProps {
  icon: React.ElementType;
  title: string;
  done: boolean;
  inProgress?: boolean;
  detail?: string | null;
  subDetail?: string | null;
}

function TaskRow({ icon: Icon, title, done, inProgress, detail, subDetail }: TaskRowProps) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${done ? "border-green-200 bg-green-50/40" : inProgress ? "border-amber-200 bg-amber-50/30" : "border-gray-200 bg-white"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? "bg-green-100" : inProgress ? "bg-amber-100" : "bg-gray-100"}`}>
        {done
          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
          : inProgress
            ? <Clock className="w-4 h-4 text-amber-600" />
            : <Circle className="w-4 h-4 text-gray-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
          {done && <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">Completed</span>}
          {!done && inProgress && <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">In Progress</span>}
          {!done && !inProgress && <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-1.5 py-0.5">Not Started</span>}
        </div>
        {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
        {subDetail && <p className="text-xs text-gray-400 mt-0.5 font-mono">{subDetail}</p>}
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  onClose,
}: {
  user: UserOnboardingSummary;
  onClose: () => void;
}) {
  const ob = user.onboarding;
  const policyIds: string[] = (() => {
    try { return JSON.parse(ob.policyVersionAccepted ?? "[]"); } catch { return []; }
  })();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name ?? <span className="italic text-gray-400">No name</span>}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-700">Security Onboarding</span>
            <span className="text-xs font-bold text-blue-700">{ob.completedCount}/{ob.totalCount} complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${ob.allComplete ? "bg-green-500" : ob.completedCount > 0 ? "bg-blue-500" : "bg-gray-300"}`}
              style={{ width: `${Math.round((ob.completedCount / ob.totalCount) * 100)}%` }}
            />
          </div>
          {ob.allComplete && (
            <p className="text-xs text-green-700 font-medium mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> All tasks complete
            </p>
          )}
        </div>

        {/* Task detail */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Task Status</p>

          {/* Task 1 */}
          <TaskRow
            icon={FileText}
            title="Accept All Organisation Policies"
            done={ob.policyAccepted}
            detail={ob.policyAccepted ? `Accepted on ${fmtDate(ob.policyAcceptedAt)}` : undefined}
            subDetail={ob.policyAccepted && policyIds.length > 0 ? `${policyIds.length} polic${policyIds.length === 1 ? "y" : "ies"} acknowledged` : ob.policyAccepted ? undefined : "Not yet accepted"}
          />

          {/* Task 2 */}
          <TaskRow
            icon={Laptop}
            title="Install MDM Agent"
            done={ob.mdmEnrolled}
            detail={ob.mdmEnrolled ? `Enrolled on ${fmtDate(ob.mdmEnrolledAt)}` : "Awaiting device enrollment"}
            subDetail={ob.deviceId ? `Device: ${ob.deviceId}` : undefined}
          />

          {/* Task 3 */}
          <TaskRow
            icon={BookOpen}
            title="Complete Security Awareness Training"
            done={ob.trainingCompleted}
            inProgress={ob.trainingStarted && !ob.trainingCompleted}
            detail={
              ob.trainingCompleted
                ? `Completed on ${fmtDate(ob.trainingCompletedAt)}`
                : ob.trainingStarted
                  ? `Started on ${fmtDate(ob.trainingStartedAt)} — video not finished yet`
                  : "Not started"
            }
          />

          {/* User info */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User Info</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Role</p>
                <p className="font-medium text-gray-700">{roleLabel(user.role)}</p>
              </div>
              <div>
                <p className="text-gray-400">Joined</p>
                <p className="font-medium text-gray-700">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PeoplePage() {
  const [users, setUsers] = useState<UserWithGit[]>([]);
  const [onboardingMap, setOnboardingMap] = useState<Map<string, UserOnboardingSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserOnboardingSummary | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, onboardingRes] = await Promise.allSettled([
        usersService.listUsers(),
        onboardingService.listUsersOnboarding(),
      ]);

      if (usersRes.status === "fulfilled") setUsers(usersRes.value.users);
      else setError((usersRes as any).reason?.message ?? "Failed to load users");

      if (onboardingRes.status === "fulfilled" && onboardingRes.value.data) {
        const map = new Map<string, UserOnboardingSummary>();
        for (const u of onboardingRes.value.data) map.set(u.id, u);
        setOnboardingMap(map);
      }
      // Onboarding load failure is non-fatal — just leave map empty
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name || "this user"} from the organisation?`)) return;
    try {
      await usersService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Failed to remove user");
    }
  };

  const handleRowClick = (userId: string) => {
    const ob = onboardingMap.get(userId);
    if (ob) setSelectedUser(ob);
  };

  return (
    <PageTemplate
      title="People"
      description="Organisation members and their security roles."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      }
    >
      {selectedUser && (
        <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GitHub Accounts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Onboarding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">Loading users…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">No users found.</td>
                </tr>
              ) : (
                users.map((user) => {
                  const ob = onboardingMap.get(user.id);
                  const hasOnboarding = !!ob;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 ${hasOnboarding ? "cursor-pointer" : ""}`}
                      onClick={hasOnboarding ? () => handleRowClick(user.id) : undefined}
                    >
                      {/* Name / Email */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name ?? <span className="text-gray-400 italic">No name</span>}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>
                          {roleLabel(user.role)}
                        </Badge>
                      </td>

                      {/* GitHub accounts */}
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        {user.gitAccounts.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {user.gitAccounts.map((ga) => (
                              <a
                                key={ga.id}
                                href={ga.profileUrl ?? `https://github.com/${ga.githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                {ga.avatarUrl && <img src={ga.avatarUrl} alt={ga.githubUsername} className="w-4 h-4 rounded-full" />}
                                <Github className="w-3 h-3" />
                                {ga.githubUsername}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Onboarding status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasOnboarding ? (
                          <div className="flex items-center gap-2">
                            <OnboardingBadge
                              count={ob.onboarding.completedCount}
                              total={ob.onboarding.totalCount}
                            />
                            {/* Mini task icons */}
                            <div className="flex gap-0.5">
                              {[
                                { done: ob.onboarding.policyAccepted,   icon: FileText  },
                                { done: ob.onboarding.mdmEnrolled,      icon: Laptop    },
                                { done: ob.onboarding.trainingCompleted, icon: BookOpen },
                              ].map(({ done, icon: Icon }, i) => (
                                <span
                                  key={i}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center ${done ? "bg-green-100" : "bg-gray-100"}`}
                                  title={["Policies", "MDM", "Training"][i]}
                                >
                                  <Icon className={`w-3 h-3 ${done ? "text-green-600" : "text-gray-400"}`} />
                                </span>
                              ))}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleDelete(user.id, user.name ?? user.email)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
            {users.length} member{users.length !== 1 ? "s" : ""}
            {onboardingMap.size > 0 && (
              <span className="ml-2 text-gray-400">
                · {Array.from(onboardingMap.values()).filter(u => u.onboarding.allComplete).length} fully onboarded
              </span>
            )}
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
