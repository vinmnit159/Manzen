/**
 * Access → Users
 *
 * Enterprise user management with:
 * - Full user table with role badges, lifecycle status, onboarding
 * - Inline role assignment (dropdown) for admins
 * - User lifecycle: Active / Suspended / Invited
 * - Detail slide-over: role change, permissions, onboarding tasks, GitHub
 * - Invite user flow
 * - Audit log actions
 */

import React, { useState } from 'react';
import { apiClient } from '@/services/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, Plus, RefreshCw, Search, X, Shield, ShieldOff,
  ChevronRight, CheckCircle2, Clock, Circle, Github,
  AlertCircle, Loader2, UserPlus, Key, Lock, Unlock,
  Trash2, Mail, Calendar, Building2, FileText, Laptop, BookOpen,
  Edit2, Save, ArrowUpDown,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { usersService, UserWithGit } from '@/services/api/users';
import { onboardingService, UserOnboardingSummary } from '@/services/api/onboarding';
import { Role } from '@/services/api/types';
import {
  ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_CONFIG, PERMISSION_MATRIX,
  AppRole, getPermissionsForRole,
} from '@/lib/rbac/permissions';
import { RoleBadge, RequirePermission } from '@/app/components/rbac/RequirePermission';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { useCurrentUser, useHasPermission } from '@/hooks/useCurrentUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initials(name?: string | null, email?: string) {
  if (name?.trim()) {
    const p = name.trim().split(/\s+/);
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0].slice(0, 2).toUpperCase();
  }
  return (email ?? 'U').slice(0, 2).toUpperCase();
}

const ALL_ROLES: AppRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'AUDITOR', 'CONTRIBUTOR', 'VIEWER'];

// ── KPI strip card ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── User Detail Slide-over ─────────────────────────────────────────────────────

function UserDetailPanel({
  user,
  onboarding,
  onClose,
  onRoleUpdated,
}: {
  user: UserWithGit;
  onboarding?: UserOnboardingSummary;
  onClose: () => void;
  onRoleUpdated: (userId: string, newRole: Role) => void;
}) {
  const currentUser = useCurrentUser();
  const canManage = useHasPermission(PERMISSIONS.USERS_ROLES_ASSIGN);
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role as Role);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const permissions = getPermissionsForRole(user.role as AppRole);
  const ob = onboarding?.onboarding;

  const handleSaveRole = async () => {
    if (selectedRole === user.role) { setEditingRole(false); return; }
    setSaving(true);
    setSaveErr(null);
    try {
      await usersService.updateUser(user.id, { role: selectedRole });
      onRoleUpdated(user.id, selectedRole);
      setEditingRole(false);
    } catch (e: any) {
      setSaveErr(e?.message ?? 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const cfg = ROLE_CONFIG[user.role as AppRole];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-200 bg-white">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${cfg?.bg ?? 'bg-blue-50'} ${cfg?.text ?? 'text-blue-700'}`}>
            {initials(user.name, user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug">
              {user.name ?? <span className="italic text-gray-400">No name</span>}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <RoleBadge role={user.role as AppRole} />
              <span className="text-xs text-gray-400">Joined {fmtDate(user.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Permissions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.gitAccounts.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">GitHub accounts</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${ob?.allComplete ? 'text-green-600' : 'text-amber-600'}`}>
                {ob ? `${ob.completedCount}/${ob.totalCount}` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Onboarded</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="role" className="space-y-4">
            <TabsList className="rounded-xl bg-slate-100 p-1 h-auto">
              <TabsTrigger value="role">Role & Access</TabsTrigger>
              <TabsTrigger value="permissions">Permissions ({permissions.length})</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
              {user.gitAccounts.length > 0 && <TabsTrigger value="git">GitHub</TabsTrigger>}
            </TabsList>

            {/* Role & Access tab */}
            <TabsContent value="role" className="space-y-4 mt-0">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">Role Assignment</span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Current role */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Current Role</p>
                    {editingRole ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {ALL_ROLES.map(r => {
                            const rc = ROLE_CONFIG[r];
                            const isSelected = selectedRole === r;
                            return (
                              <button
                                key={r}
                                onClick={() => setSelectedRole(r as Role)}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? `${rc.bg} ${rc.border} ring-2 ring-offset-1 ring-current ${rc.text}`
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${rc.dot}`} />
                                <div>
                                  <p className={`text-xs font-semibold ${isSelected ? rc.text : 'text-gray-800'}`}>{ROLE_LABELS[r]}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">{ROLE_DESCRIPTIONS[r]}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {saveErr && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveErr}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveRole}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium transition-colors"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving…' : 'Save Role'}
                          </button>
                          <button
                            onClick={() => { setEditingRole(false); setSelectedRole(user.role as Role); setSaveErr(null); }}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <RoleBadge role={user.role as AppRole} size="md" />
                          <div>
                            <p className="text-sm text-gray-600">{ROLE_DESCRIPTIONS[user.role as AppRole]}</p>
                          </div>
                        </div>
                        {canManage && currentUser?.id !== user.id && (
                          <button
                            onClick={() => setEditingRole(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0 ml-3"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Change
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Permissions tab */}
            <TabsContent value="permissions" className="mt-0">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">Granted Permissions</span>
                  <span className="ml-auto text-xs text-gray-400">{permissions.length} total</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-1.5">
                  {permissions.map(p => (
                    <div key={p} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-100">
                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span className="text-xs font-mono text-gray-700">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Onboarding tab */}
            <TabsContent value="onboarding" className="space-y-3 mt-0">
              {!ob ? (
                <div className="text-center py-10 text-gray-400">
                  <Circle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No onboarding data available.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-blue-700">{ob.completedCount}/{ob.totalCount}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all ${ob.allComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.round((ob.completedCount / ob.totalCount) * 100)}%` }}
                    />
                  </div>

                  {[
                    { icon: FileText, title: 'Accept All Policies', done: ob.policyAccepted, detail: ob.policyAcceptedAt ? `Accepted ${fmtDate(ob.policyAcceptedAt)}` : 'Not yet accepted' },
                    { icon: Laptop,   title: 'Install MDM Agent',   done: ob.mdmEnrolled,    detail: ob.mdmEnrolledAt ? `Enrolled ${fmtDate(ob.mdmEnrolledAt)}` : 'Awaiting enrollment' },
                    { icon: BookOpen, title: 'Security Training',   done: ob.trainingCompleted, detail: ob.trainingCompleted ? `Completed ${fmtDate(ob.trainingCompletedAt)}` : ob.trainingStarted ? 'In progress' : 'Not started' },
                  ].map(({ icon: Icon, title, done, detail }) => (
                    <div key={title} className={`flex items-center gap-3 p-3 rounded-xl border ${done ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-white'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Circle className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">{title}</span>
                      </div>
                      <span className="ml-auto text-xs text-gray-500">{detail}</span>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            {/* GitHub tab */}
            {user.gitAccounts.length > 0 && (
              <TabsContent value="git" className="space-y-2 mt-0">
                {user.gitAccounts.map(ga => (
                  <div key={ga.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                    {ga.avatarUrl
                      ? <img src={ga.avatarUrl} alt={ga.githubUsername} className="w-8 h-8 rounded-full flex-shrink-0" />
                      : <Github className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    }
                    <div>
                      <a
                        href={ga.profileUrl ?? `https://github.com/${ga.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        @{ga.githubUsername}
                      </a>
                    </div>
                  </div>
                ))}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ── Invite User Modal ──────────────────────────────────────────────────────────

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.VIEWER);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      // The invite API endpoint on the external backend
      await (apiClient as any).post('/api/users/invite', { email, role });
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Invite User</h2>
            <p className="text-xs text-gray-500 mt-0.5">An email invitation will be sent with a secure signup link.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Invitation sent!</p>
            <p className="text-xs text-gray-500 text-center">An email was sent to <strong>{email}</strong> with a signup link.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Work Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Assign Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.filter(r => r !== 'SUPER_ADMIN').map(r => {
                  const rc = ROLE_CONFIG[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r as Role)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-xs ${
                        role === r
                          ? `${rc.bg} ${rc.border} ${rc.text} ring-1 ring-current`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rc.dot}`} />
                      <span className="font-medium">{ROLE_LABELS[r]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button
                type="submit"
                disabled={!email || sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AccessUsersPage() {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const canManageUsers = useHasPermission(PERMISSIONS.USERS_MANAGE);
  const canAssignRoles = useHasPermission(PERMISSIONS.USERS_ROLES_ASSIGN);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | ''>('');
  const [selectedUser, setSelectedUser] = useState<UserWithGit | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const { data: usersData, isLoading, isFetching, error } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      const res = await usersService.listUsers();
      return res.users;
    },
    staleTime: STALE.USERS,
  });

  const { data: onboardingData } = useQuery({
    queryKey: QK.onboardingUsers(),
    queryFn: async () => {
      const res = await onboardingService.listUsersOnboarding();
      return (res.data ?? []) as UserOnboardingSummary[];
    },
    staleTime: STALE.USERS,
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => usersService.updateUser(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.users() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.users() });
      setSelectedUser(null);
    },
  });

  const users: UserWithGit[] = usersData ?? [];
  const onboardingMap = new Map<string, UserOnboardingSummary>();
  for (const u of onboardingData ?? []) onboardingMap.set(u.id, u);

  // Filtered + searched users
  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || (u.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // KPIs
  const totalUsers = users.length;
  const adminCount = users.filter(u => ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'].includes(u.role)).length;
  const onboardedCount = Array.from(onboardingMap.values()).filter(u => u.onboarding.allComplete).length;
  const roleBreakdown = ALL_ROLES.map(r => ({ role: r, count: users.filter(u => u.role === r).length })).filter(x => x.count > 0);

  const handleRoleUpdated = (userId: string, newRole: Role) => {
    qc.invalidateQueries({ queryKey: QK.users() });
    // Update selected user if it's the one being edited
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name || 'this user'} from the organisation? This cannot be undone.`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="flex flex-col bg-gray-50">

      {/* Detail panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onboarding={onboardingMap.get(selectedUser.id)}
          onClose={() => setSelectedUser(null)}
          onRoleUpdated={handleRoleUpdated}
        />
      )}

      {/* Invite modal */}
      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users, roles, and access across your organisation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { qc.invalidateQueries({ queryKey: QK.users() }); }}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canManageUsers && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Invite User
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label="Total Users" value={totalUsers} />
          <KpiCard label="Privileged Users" value={adminCount} sub="Admin / Security Owner" color="text-orange-600" />
          <KpiCard label="Fully Onboarded" value={onboardedCount} sub={`${totalUsers > 0 ? Math.round((onboardedCount / totalUsers) * 100) : 0}% complete`} color="text-green-600" />
          <KpiCard label="Roles In Use" value={roleBreakdown.length} sub={roleBreakdown.map(r => ROLE_LABELS[r.role]).join(', ')} />
        </div>

        {/* Role distribution mini-bar */}
        {users.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Role Distribution</p>
            <div className="flex gap-3 flex-wrap">
              {ALL_ROLES.map(r => {
                const count = users.filter(u => u.role === r).length;
                if (!count) return null;
                const rc = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      roleFilter === r ? `${rc.bg} ${rc.text} ${rc.border} ring-2 ring-current ring-offset-1` : `bg-white border-gray-200 text-gray-600 hover:${rc.bg}`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
                    {ROLE_LABELS[r]} <span className="font-bold">{count}</span>
                  </button>
                );
              })}
              {roleFilter && (
                <button onClick={() => setRoleFilter('')} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-200 hover:bg-gray-50">
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search + table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Onboarding</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">GitHub</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  {(canManageUsers || canAssignRoles) && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                ) : error ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-red-500">{(error as any)?.message ?? 'Failed to load users'}</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No users match your search.</td></tr>
                ) : filtered.map(user => {
                  const ob = onboardingMap.get(user.id);
                  const isMe = currentUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${ROLE_CONFIG[user.role as AppRole]?.bg ?? 'bg-gray-100'} ${ROLE_CONFIG[user.role as AppRole]?.text ?? 'text-gray-600'}`}>
                            {initials(user.name, user.email)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name ?? <span className="italic text-gray-400">No name</span>}
                              {isMe && <span className="ml-1.5 text-xs text-blue-500 font-normal">(you)</span>}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        {canAssignRoles && !isMe ? (
                          <select
                            value={user.role}
                            onChange={async (e) => {
                              const newRole = e.target.value as Role;
                              await usersService.updateUser(user.id, { role: newRole });
                              qc.invalidateQueries({ queryKey: QK.users() });
                            }}
                            className="text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            style={{ borderColor: ROLE_CONFIG[user.role as AppRole]?.border.replace('border-', '') }}
                            title="Change role"
                          >
                            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        ) : (
                          <RoleBadge role={user.role as AppRole} />
                        )}
                      </td>

                      {/* Onboarding */}
                      <td className="px-4 py-3.5">
                        {ob ? (
                          <div className="flex items-center gap-1.5">
                            {ob.onboarding.allComplete
                              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                              : ob.onboarding.completedCount > 0
                                ? <Clock className="w-4 h-4 text-amber-500" />
                                : <Circle className="w-4 h-4 text-gray-300" />
                            }
                            <span className="text-xs text-gray-600 font-medium">{ob.onboarding.completedCount}/{ob.onboarding.totalCount}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* GitHub */}
                      <td className="px-4 py-3.5">
                        {user.gitAccounts.length > 0
                          ? <span className="flex items-center gap-1 text-xs text-gray-600"><Github className="w-3.5 h-3.5" />{user.gitAccounts.length}</span>
                          : <span className="text-xs text-gray-300">—</span>
                        }
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3.5 text-xs text-gray-500">{fmtDate(user.createdAt)}</td>

                      {/* Actions */}
                      {(canManageUsers || canAssignRoles) && (
                        <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="View details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            {canManageUsers && !isMe && (
                              <button
                                onClick={() => handleDelete(user.id, user.name ?? user.email)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Remove user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isLoading && users.length > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              Showing {filtered.length} of {users.length} users
              {roleFilter && <span className="ml-1 text-gray-400">· filtered by {ROLE_LABELS[roleFilter]}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
