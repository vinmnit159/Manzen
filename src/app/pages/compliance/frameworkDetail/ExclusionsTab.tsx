import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/app/components/ui/card';
import { frameworksService, type RequirementStatusDto } from '@/services/api/frameworks';
import { XCircle } from 'lucide-react';
import { TabPlaceholder } from './shared';

export function ExclusionsTab({ slug }: { slug: string }) {
  const { data: reqsRes, isLoading } = useQuery({
    queryKey: ['frameworks', 'org-requirements', slug],
    queryFn: () => frameworksService.listOrgRequirements(slug),
  });
  const reqs: RequirementStatusDto[] = reqsRes?.data ?? [];
  const excluded = reqs.filter(r => r.applicabilityStatus === 'not_applicable');

  if (isLoading) return <TabPlaceholder icon={XCircle} text="Loading exclusions…" />;
  if (excluded.length === 0) return <TabPlaceholder icon={XCircle} text="No exclusions recorded" sub="Requirements marked N/A with justification appear here as an audit trail." />;

  return (
    <Card className="border-gray-100">
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {excluded.map(req => (
            <div key={req.id} className="flex items-start gap-3 px-4 py-3">
              <XCircle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-mono text-xs text-gray-400 mr-2">{req.code}</span>
                  {req.title}
                </p>
                {req.justification && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{req.justification}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
