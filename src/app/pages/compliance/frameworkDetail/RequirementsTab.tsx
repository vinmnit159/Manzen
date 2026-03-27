import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { frameworksService, type RequirementStatusDto } from '@/services/api/frameworks';
import { usersService } from '@/services/api/users';
import { Loader2, ListChecks, User, Calendar, XCircle, CheckCircle2 } from 'lucide-react';
import { applicabilityBadge, reviewBadge, TabPlaceholder } from './shared';

export function RequirementsTab({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const [ownerDialog, setOwnerDialog] = useState<RequirementStatusDto | null>(null);
  const [applicabilityDialog, setApplicabilityDialog] = useState<RequirementStatusDto | null>(null);
  const [applicabilityJustification, setApplicabilityJustification] = useState('');
  const [ownerInput, setOwnerInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');

  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];

  const ownerMutation = useMutation({
    mutationFn: (r: RequirementStatusDto) =>
      frameworksService.updateRequirementOwner(r.id, {
        ownerId: ownerInput || null,
        dueDate: dueDateInput || null,
      }),
    onSuccess: () => {
      setOwnerDialog(null);
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
    },
  });

  const applicabilityMutation = useMutation({
    mutationFn: ({ r, status, justification }: { r: RequirementStatusDto; status: 'applicable' | 'not_applicable'; justification?: string }) =>
      frameworksService.updateApplicability(r.id, { applicabilityStatus: status, justification }),
    onSuccess: () => {
      setApplicabilityDialog(null);
      setApplicabilityJustification('');
      qc.invalidateQueries({ queryKey: ['frameworks', 'org-requirements', slug] });
      qc.invalidateQueries({ queryKey: ['frameworks', 'coverage', slug] });
    },
  });

  if (isLoading) return <TabPlaceholder icon={ListChecks} text="Loading requirements…" />;

  if (reqs.length === 0) {
    return (
      <TabPlaceholder
        icon={ListChecks}
        text="No requirements loaded yet"
        sub="Activate this framework to load requirements for your organization."
      />
    );
  }

  const byDomain = reqs.reduce<Record<string, RequirementStatusDto[]>>((acc, r) => {
    const d = r.domain ?? 'General';
    if (!acc[d]) acc[d] = [];
    acc[d].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{reqs.length} requirements · {reqs.filter(r => r.applicabilityStatus === 'not_applicable').length} marked N/A</span>
        <span className="text-gray-400">Click a row to assign owner or mark N/A</span>
      </div>

      {Object.entries(byDomain).map(([domain, items]) => (
        <Card key={domain} className="border-gray-100">
          <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{domain}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {items.map(req => (
                <div
                  key={req.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setOwnerDialog(req);
                    setOwnerInput(req.ownerId ?? '');
                    setDueDateInput(req.dueDate ? req.dueDate.substring(0, 10) : '');
                  }}
                >
                  <span className="font-mono text-xs text-gray-400 w-16 shrink-0 mt-0.5">{req.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{req.title}</p>
                    {req.ownerId && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> {req.ownerId}
                        {req.dueDate && <><Calendar className="w-3 h-3 ml-1.5" /> {new Date(req.dueDate).toLocaleDateString()}</>}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {reviewBadge(req.reviewStatus)}
                    {applicabilityBadge(req.applicabilityStatus)}
                    {req.applicabilityStatus === 'applicable' ? (
                      <button
                        className="text-xs text-gray-300 hover:text-gray-500 px-1"
                        onClick={e => {
                          e.stopPropagation();
                          setApplicabilityDialog(req);
                          setApplicabilityJustification(req.justification ?? '');
                        }}
                        title="Mark N/A"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="text-xs text-gray-300 hover:text-blue-500 px-1"
                        onClick={e => {
                          e.stopPropagation();
                          applicabilityMutation.mutate({ r: req, status: 'applicable' });
                        }}
                        title="Mark applicable"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Owner assignment dialog */}
      <Dialog open={!!ownerDialog} onOpenChange={() => setOwnerDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign owner & due date</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">{ownerDialog?.code}</span>{' '}
              {ownerDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label htmlFor="owner" className="text-sm font-medium">Owner</Label>
              <select
                id="owner"
                value={ownerInput}
                onChange={e => setOwnerInput(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Select a user —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium">Due date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDateInput}
                onChange={e => setDueDateInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setOwnerDialog(null)}>Cancel</Button>
            <Button
              onClick={() => ownerDialog && ownerMutation.mutate(ownerDialog)}
              disabled={ownerMutation.isPending}
            >
              {ownerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!applicabilityDialog} onOpenChange={() => setApplicabilityDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark requirement not applicable</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-mono text-xs text-gray-500">{applicabilityDialog?.code}</span>{' '}
              {applicabilityDialog?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="na-justification" className="text-sm font-medium">Justification</Label>
            <Textarea
              id="na-justification"
              rows={4}
              value={applicabilityJustification}
              onChange={(e) => setApplicabilityJustification(e.target.value)}
              placeholder="Explain why this requirement does not apply to your organization."
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setApplicabilityDialog(null)}>Cancel</Button>
            <Button
              onClick={() => applicabilityDialog && applicabilityMutation.mutate({
                r: applicabilityDialog,
                status: 'not_applicable',
                justification: applicabilityJustification.trim(),
              })}
              disabled={applicabilityMutation.isPending || !applicabilityJustification.trim()}
            >
              {applicabilityMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Save exclusion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
