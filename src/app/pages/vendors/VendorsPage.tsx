import { useEffect, useMemo, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Progress } from '@/app/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CreateVendorInput, VendorRecord, VendorStatus, VendorTier, vendorsService } from '@/services/api/vendors';

type TabKey = 'ALL' | 'DUE' | 'HIGH_RISK';

const statusMeta: Record<VendorStatus, { label: string; className: string }> = {
  MONITORED: { label: 'Monitored', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ASSESSMENT_DUE: { label: 'Assessment due', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  IN_REVIEW: { label: 'In review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  BLOCKED: { label: 'Blocked', className: 'bg-red-50 text-red-700 border-red-200' },
};

const tierMeta: Record<VendorTier, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  HIGH: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  CRITICAL: { label: 'Critical', className: 'bg-red-50 text-red-700 border-red-200' },
};

const emptyVendorInput: CreateVendorInput = {
  name: '',
  category: '',
  owner: '',
  website: '',
  businessCriticality: 'Business-important',
  dataClass: 'Sensitive',
};

function isDueWithinDays(isoDate: string, days: number): boolean {
  const now = new Date();
  const due = new Date(isoDate);
  const diffMs = due.getTime() - now.getTime();
  return diffMs <= days * 24 * 60 * 60 * 1000;
}

export function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | VendorStatus>('ALL');
  const [tierFilter, setTierFilter] = useState<'ALL' | VendorTier>('ALL');
  const [tab, setTab] = useState<TabKey>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selected, setSelected] = useState<VendorRecord | null>(null);
  const [form, setForm] = useState<CreateVendorInput>(emptyVendorInput);

  async function refresh() {
    const data = await vendorsService.list();
    setVendors(data);
  }

  useEffect(() => {
    refresh()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const dueSoon = vendors.filter((v) => isDueWithinDays(v.nextAssessmentAt, 30)).length;
    const highRisk = vendors.filter((v) => v.tier === 'HIGH' || v.tier === 'CRITICAL').length;
    const openFindings = vendors.reduce((sum, v) => sum + v.openFindings, 0);
    const avgScore = vendors.length > 0 ? Math.round(vendors.reduce((sum, v) => sum + v.securityScore, 0) / vendors.length) : 0;
    return { dueSoon, highRisk, openFindings, avgScore };
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return vendors
      .filter((v) => {
        if (!normalized) return true;
        return (
          v.name.toLowerCase().includes(normalized) ||
          v.category.toLowerCase().includes(normalized) ||
          v.owner.toLowerCase().includes(normalized)
        );
      })
      .filter((v) => (statusFilter === 'ALL' ? true : v.status === statusFilter))
      .filter((v) => (tierFilter === 'ALL' ? true : v.tier === tierFilter))
      .filter((v) => {
        if (tab === 'ALL') return true;
        if (tab === 'DUE') return isDueWithinDays(v.nextAssessmentAt, 30);
        return v.tier === 'HIGH' || v.tier === 'CRITICAL';
      })
      .sort((a, b) => new Date(a.nextAssessmentAt).getTime() - new Date(b.nextAssessmentAt).getTime());
  }, [vendors, search, statusFilter, tierFilter, tab]);

  async function onCreateVendor() {
    if (!form.name.trim() || !form.category.trim() || !form.owner.trim()) return;
    await vendorsService.create({
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      owner: form.owner.trim(),
      website: form.website?.trim() || undefined,
    });
    setForm(emptyVendorInput);
    setIsAddOpen(false);
    await refresh();
  }

  async function onCompleteAssessment(vendorId: string) {
    await vendorsService.completeAssessment(vendorId);
    await refresh();
    const updated = await vendorsService.list();
    setSelected(updated.find((v) => v.id === vendorId) ?? null);
  }

  return (
    <PageTemplate
      title="Vendors"
      description="Continuously monitor third-party risk, streamline assessments, and keep procurement decisions audit-ready."
      actions={
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add vendor
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Third-party risk command center
            </CardTitle>
            <CardDescription className="text-slate-600">
              Track questionnaire coverage, pending reviews, and critical vendor exposure in one workflow.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vendors</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">{vendors.length}</p>
                <Building2 className="h-5 w-5 text-slate-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">High risk</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">{stats.highRisk}</p>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assessments due (30d)</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">{stats.dueSoon}</p>
                <CalendarClock className="h-5 w-5 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Avg security score</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">{stats.avgScore}</p>
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vendor, category, owner"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  <option value="MONITORED">Monitored</option>
                  <option value="ASSESSMENT_DUE">Assessment due</option>
                  <option value="IN_REVIEW">In review</option>
                  <option value="BLOCKED">Blocked</option>
                </select>

                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="ALL">All risk tiers</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: 'ALL', label: 'All vendors' },
                { key: 'DUE', label: 'Due soon' },
                { key: 'HIGH_RISK', label: 'High risk' },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant={tab === item.key ? 'default' : 'outline'}
                  onClick={() => setTab(item.key as TabKey)}
                  className="h-8"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4">Vendor</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Tier</th>
                    <th className="py-3 pr-4">Score</th>
                    <th className="py-3 pr-4">Questionnaire</th>
                    <th className="py-3 pr-4">Open findings</th>
                    <th className="py-3 pr-4">Next review</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-0">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No vendors match this view.
                      </td>
                    </tr>
                  )}

                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-medium text-slate-900">{vendor.name}</p>
                          <p className="text-xs text-slate-500">Owner: {vendor.owner}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{vendor.category}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={tierMeta[vendor.tier].className}>{tierMeta[vendor.tier].label}</Badge>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{vendor.securityScore}</td>
                      <td className="py-3 pr-4">
                        <div className="w-28">
                          <Progress value={vendor.questionnaireCompletion} />
                          <p className="mt-1 text-xs text-slate-500">{vendor.questionnaireCompletion}%</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{vendor.openFindings}</td>
                      <td className="py-3 pr-4 text-slate-700">{new Date(vendor.nextAssessmentAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={statusMeta[vendor.status].className}>{statusMeta[vendor.status].label}</Badge>
                      </td>
                      <td className="py-3 pr-0">
                        <Button variant="ghost" className="h-8" onClick={() => setSelected(vendor)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-slate-600" />
              Immediate actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>- Trigger reassessment for vendors due in the next 30 days.</p>
            <p>- Prioritize vendors with PII data class and score below 70.</p>
            <p>- Ensure DPA is signed before moving a vendor to monitored status.</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add vendor</DialogTitle>
            <DialogDescription>Capture basic details and start the assessment workflow.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input placeholder="Vendor name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Category (e.g. Identity, Payroll)" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            <Input placeholder="Business owner" value={form.owner} onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value }))} />
            <Input placeholder="Website (optional)" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                value={form.businessCriticality}
                onChange={(e) => setForm((p) => ({ ...p, businessCriticality: e.target.value as any }))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Mission-critical">Mission-critical</option>
                <option value="Business-important">Business-important</option>
                <option value="Operational">Operational</option>
              </select>

              <select
                value={form.dataClass}
                onChange={(e) => setForm((p) => ({ ...p, dataClass: e.target.value as any }))}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="PII">PII</option>
                <option value="Sensitive">Sensitive</option>
                <option value="Internal">Internal</option>
                <option value="Public">Public</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={onCreateVendor}>Create vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.category} · Owner: {selected.owner}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4 pb-6 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-500">Risk tier</p>
                      <Badge variant="outline" className={`mt-2 ${tierMeta[selected.tier].className}`}>{tierMeta[selected.tier].label}</Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-500">Status</p>
                      <Badge variant="outline" className={`mt-2 ${statusMeta[selected.status].className}`}>{statusMeta[selected.status].label}</Badge>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Security posture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Security score</span>
                        <span>{selected.securityScore}/100</span>
                      </div>
                      <Progress value={selected.securityScore} />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>Questionnaire completion</span>
                        <span>{selected.questionnaireCompletion}%</span>
                      </div>
                      <Progress value={selected.questionnaireCompletion} />
                    </div>
                    <p className="text-xs text-slate-600">Open findings: {selected.openFindings}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Risk context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-slate-700">
                    <p><span className="text-slate-500">Business criticality:</span> {selected.businessCriticality}</p>
                    <p><span className="text-slate-500">Data class:</span> {selected.dataClass}</p>
                    <p><span className="text-slate-500">Sub-processors:</span> {selected.subprocessors}</p>
                    <p><span className="text-slate-500">DPA signed:</span> {selected.dpaSigned ? 'Yes' : 'No'}</p>
                    <p><span className="text-slate-500">Last assessment:</span> {new Date(selected.lastAssessmentAt).toLocaleDateString()}</p>
                    <p><span className="text-slate-500">Next assessment:</span> {new Date(selected.nextAssessmentAt).toLocaleDateString()}</p>
                  </CardContent>
                </Card>

                {selected.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-700">{selected.notes}</p>
                    </CardContent>
                  </Card>
                )}

                <Button className="w-full" onClick={() => onCompleteAssessment(selected.id)}>
                  Mark assessment complete
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTemplate>
  );
}
