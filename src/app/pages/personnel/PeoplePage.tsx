import { useEffect, useState } from "react";
import { PageTemplate } from "@/app/components/PageTemplate";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Plus, RefreshCw, Github, Trash2 } from "lucide-react";
import { usersService, UserWithGit } from "@/services/api/users";
import { Role } from "@/services/api/types";

// ─── Role badge colour map ─────────────────────────────────────────────────

const ROLE_VARIANT: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  SUPER_ADMIN: "destructive",
  ORG_ADMIN: "destructive",
  SECURITY_OWNER: "default",
  AUDITOR: "secondary",
  CONTRIBUTOR: "secondary",
  VIEWER: "outline",
};

function roleLabel(role: string): string {
  return role
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PeoplePage() {
  const [users, setUsers] = useState<UserWithGit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersService.listUsers();
      setUsers(res.users);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name || "this user"} from the organisation?`)) return;
    try {
      await usersService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e?.message ?? "Failed to remove user");
    }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GitHub Accounts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4">
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
                              {ga.avatarUrl && (
                                <img
                                  src={ga.avatarUrl}
                                  alt={ga.githubUsername}
                                  className="w-4 h-4 rounded-full"
                                />
                              )}
                              <Github className="w-3 h-3" />
                              {ga.githubUsername}
                            </a>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(user.id, user.name ?? user.email)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
            {users.length} member{users.length !== 1 ? "s" : ""}
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
