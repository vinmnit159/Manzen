/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { useHasRole } from '@/hooks/useCurrentUser';
import { adminService, OrgListDto, OrgDetailDto } from '@/services/api/admin';
import { Search, Plus, Building2, Users, Shield, ChevronRight, Loader2, Eye } from 'lucide-react';
import { fmtDate } from '@/lib/format-date';

export function AdminOrganizationsPage() {
  const isSuperAdmin = useHasRole('SUPER_ADMIN');
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: () => adminService.listOrganizations(),
    enabled: isSuperAdmin,
  });

  const { data: orgDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'organizations', selectedOrgId],
    queryFn: () => adminService.getOrganization(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  if (!isSuperAdmin) {
    return (
      <PageTemplate title="Access Denied">
        <p className="text-muted-foreground">SUPER_ADMIN role required.</p>
      </PageTemplate>
    );
  }

  const list = orgs?.data ?? [];
  const filtered = list.filter(
    (o) => o.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageTemplate
      title="Organizations"
      description="Manage customer organizations, create new orgs, and view their compliance posture."
      actions={
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Organization
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{list.length}</div>
            <div className="text-xs text-muted-foreground">Organizations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{list.reduce((s, o) => s + o.userCount, 0)}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{list.reduce((s, o) => s + o.activeFrameworks, 0)}</div>
            <div className="text-xs text-muted-foreground">Active Frameworks</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((org) => (
            <Card
              key={org.id}
              className={`cursor-pointer hover:border-primary/50 transition-colors ${selectedOrgId === org.id ? 'border-primary' : ''}`}
              onClick={() => setSelectedOrgId(org.id)}
            >
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{org.name}</div>
                  <div className="text-xs text-muted-foreground">Created {fmtDate(org.createdAt)}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {org.userCount}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" /> {org.activeFrameworks} fw
                </div>
                <Badge variant="outline">{org.controlCount} controls</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No organizations found.</p>
          )}
        </div>
      )}

      {/* Detail dialog */}
      <OrgDetailDialog
        detail={orgDetail?.data ?? null}
        loading={detailLoading}
        open={!!selectedOrgId}
        onClose={() => setSelectedOrgId(null)}
      />

      {/* Create dialog */}
      <CreateOrgDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['admin', 'organizations'] });
          setShowCreate(false);
        }}
      />
    </PageTemplate>
  );
}

// ── Org Detail Dialog ─────────────────────────────────────────────────────────

function OrgDetailDialog({
  detail,
  loading,
  open,
  onClose,
}: {
  detail: OrgDetailDto | null;
  loading: boolean;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {loading || !detail ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {detail.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{detail.counts.controls}</div>
                  <div className="text-xs text-muted-foreground">Controls</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{detail.counts.policies}</div>
                  <div className="text-xs text-muted-foreground">Policies</div>
                </div>
                <div className="text-center p-2 bg-muted rounded">
                  <div className="text-lg font-bold">{detail.counts.risks}</div>
                  <div className="text-xs text-muted-foreground">Risks</div>
                </div>
              </div>

              {/* Users */}
              <div>
                <div className="text-sm font-medium mb-2">Users ({detail.users.length})</div>
                <div className="border rounded divide-y max-h-40 overflow-y-auto">
                  {detail.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="flex-1">{u.name || u.email}</span>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                      <Badge variant="outline">{u.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frameworks */}
              <div>
                <div className="text-sm font-medium mb-2">Frameworks ({detail.frameworks.length})</div>
                {detail.frameworks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No frameworks activated.</p>
                ) : (
                  <div className="border rounded divide-y max-h-40 overflow-y-auto">
                    {detail.frameworks.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="flex-1 font-medium">{f.name} {f.version}</span>
                        <Badge variant={f.status === 'active' ? 'default' : 'secondary'}>{f.status}</Badge>
                        {f.activatedAt && <span className="text-xs text-muted-foreground">{fmtDate(f.activatedAt)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Create Org Dialog ─────────────────────────────────────────────────────────

function CreateOrgDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    organizationName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => adminService.createOrganization(form),
    onSuccess: () => {
      setForm({ organizationName: '', adminName: '', adminEmail: '', adminPassword: '' });
      setError('');
      onCreated();
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to create organization');
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Organization Name</label>
            <Input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Admin Name</label>
            <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Admin Email</label>
            <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Admin Password</label>
            <Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.organizationName || !form.adminEmail || !form.adminPassword}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Create Organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
