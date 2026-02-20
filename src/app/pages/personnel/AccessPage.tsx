import { useEffect, useState, useCallback } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Github,
  RefreshCw,
  Link2,
  Unlink,
  AlertCircle,
  CheckCircle2,
  User,
} from "lucide-react";
import { usersService, GitHubMember, UserWithGit } from "@/services/api/users";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MappingState {
  /** githubUsername → userId being saved right now */
  saving: string | null;
  /** githubUsername → error message */
  errors: Record<string, string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccessPage() {
  const [members, setMembers] = useState<GitHubMember[]>([]);
  const [users, setUsers] = useState<UserWithGit[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<MappingState>({ saving: null, errors: {} });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, usersRes] = await Promise.all([
        usersService.getGitHubMembers(),
        usersService.listUsers(),
      ]);
      setMembers(membersRes.members);
      setConnected(membersRes.connected);
      setUsers(usersRes.users);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map a GitHub account to an ISMS user
  const handleMap = async (member: GitHubMember, userId: string) => {
    if (!userId) return;
    setMapping((prev) => ({ ...prev, saving: member.githubUsername }));
    try {
      await usersService.mapGitAccount({
        userId,
        githubUsername: member.githubUsername,
        githubId: member.githubId,
        avatarUrl: member.avatarUrl ?? undefined,
        profileUrl: member.profileUrl ?? undefined,
      });
      // Re-fetch to get updated mapping state
      const res = await usersService.getGitHubMembers();
      setMembers(res.members);
      setMapping((prev) => {
        const { [member.githubUsername]: _, ...errs } = prev.errors;
        return { saving: null, errors: errs };
      });
    } catch (e: any) {
      setMapping((prev) => ({
        saving: null,
        errors: { ...prev.errors, [member.githubUsername]: e?.message ?? "Failed to map" },
      }));
    }
  };

  // Unmap a GitHub account
  const handleUnmap = async (member: GitHubMember) => {
    if (!member.mappedUserId) return;

    // Find the UserGitAccount id from the linked users list
    const user = users.find((u) => u.id === member.mappedUserId);
    const gitAccount = user?.gitAccounts.find(
      (ga) => ga.githubUsername === member.githubUsername
    );
    if (!gitAccount) return;

    setMapping((prev) => ({ ...prev, saving: member.githubUsername }));
    try {
      await usersService.unmapGitAccount(gitAccount.id);
      const res = await usersService.getGitHubMembers();
      setMembers(res.members);
      // Refresh users too so PeoplePage gitAccounts stay consistent if re-visited
      const usersRes = await usersService.listUsers();
      setUsers(usersRes.users);
      setMapping((prev) => ({ saving: null, errors: prev.errors }));
    } catch (e: any) {
      setMapping((prev) => ({
        saving: null,
        errors: { ...prev.errors, [member.githubUsername]: e?.message ?? "Failed to unmap" },
      }));
    }
  };

  const mappedUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : undefined;

  return (
    <PageTemplate
      title="Access Management"
      description="GitHub accounts connected to this organisation and their ISMS user mappings."
      actions={
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* Integration banner */}
      {!loading && !connected && (
        <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">GitHub integration not connected.</span> Go to{" "}
            <a href="/integrations" className="underline font-medium">
              Integrations
            </a>{" "}
            to connect your GitHub account or organisation to see members here.
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <Card>
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Github className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">GitHub Accounts</h3>
          {connected && (
            <Badge variant="default" className="ml-auto text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GitHub Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mapped ISMS User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Map to User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                    {connected
                      ? "No GitHub members found. You may need to trigger a scan."
                      : "Connect GitHub to see members."}
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const linked = mappedUser(member.mappedUserId);
                  const isSaving = mapping.saving === member.githubUsername;
                  const memberError = mapping.errors[member.githubUsername];

                  return (
                    <tr key={member.githubUsername} className="hover:bg-gray-50">
                      {/* GitHub account */}
                      <td className="px-6 py-4">
                        <a
                          href={member.profileUrl ?? `https://github.com/${member.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 group"
                        >
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.githubUsername}
                              className="w-7 h-7 rounded-full border border-gray-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <Github className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 group-hover:underline">
                            {member.githubUsername}
                          </span>
                        </a>
                      </td>

                      {/* Mapped user */}
                      <td className="px-6 py-4">
                        {linked ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {linked.name ?? linked.email}
                              </div>
                              {linked.name && (
                                <div className="text-xs text-gray-500">{linked.email}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not mapped</span>
                        )}
                      </td>

                      {/* Dropdown to select user */}
                      <td className="px-6 py-4">
                        {memberError && (
                          <p className="text-xs text-red-600 mb-1">{memberError}</p>
                        )}
                        <select
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 min-w-[180px]"
                          defaultValue={member.mappedUserId ?? ""}
                          disabled={isSaving}
                          onChange={(e) => {
                            const uid = e.target.value;
                            if (uid) handleMap(member, uid);
                          }}
                        >
                          <option value="">— Select user —</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name ? `${u.name} (${u.email})` : u.email}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {linked ? (
                            <button
                              onClick={() => handleUnmap(member)}
                              disabled={isSaving}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              <Unlink className="w-3 h-3" />
                              Unmap
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Link2 className="w-3 h-3" />
                              Not linked
                            </span>
                          )}
                          {isSaving && (
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && members.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
            <span>{members.length} GitHub account{members.length !== 1 ? "s" : ""}</span>
            <span>{members.filter((m) => m.mappedUserId).length} mapped</span>
            <span>{members.filter((m) => !m.mappedUserId).length} unmapped</span>
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
