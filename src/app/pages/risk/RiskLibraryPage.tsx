import { useMemo, useState } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { riskCenterService } from '@/services/api/riskCenter';
import { riskLevelVariant } from '@/services/api/riskFormatting';

export function RiskLibraryPage() {
  const [query, setQuery] = useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: QK.riskLibrary(),
    queryFn: () => riskCenterService.getRiskLibrary(),
    staleTime: STALE.RISKS,
  });

  const filtered = useMemo(() => {
    return data.filter((item) => `${item.title} ${item.category} ${item.frameworks.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);

  return (
    <PageTemplate title="Risk Library" description="Canonical risk patterns mapped to controls, frameworks, and automation coverage.">
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search templates, frameworks, or categories" />
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-500">{item.category} risk pattern</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={riskLevelVariant(item.defaultImpact)}>{item.defaultImpact}</Badge>
                    <Badge variant="outline">{item.automationLevel}</Badge>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.frameworks.map((framework) => <Badge key={framework} variant="outline">{framework}</Badge>)}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Mapped controls</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.controls.map((control) => <Badge key={control} variant="secondary">{control}</Badge>)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Observed {item.count} time{item.count === 1 ? '' : 's'}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
