import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Layers3, Rocket } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { testsService, type TestTemplate } from '@/services/api/tests';

export function TestLibraryPage() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useQuery<TestTemplate[]>({
    queryKey: ['tests', 'library'],
    queryFn: async () => {
      const res = await testsService.getLibrary();
      return res.data ?? [];
    },
  });

  const createSuite = useMutation({
    mutationFn: (templateId: string) => testsService.createSuiteFromTemplate(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: ['tests', 'library'] });
    },
  });

  return (
    <PageTemplate title="Test Library" description="Pre-built compliance test suites for enterprise frameworks.">
      {isLoading ? (
        <Card className="p-10 text-center text-sm text-gray-500">Loading test templates...</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{template.framework}</p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900">{template.name}</h2>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <BookOpen className="h-5 w-5 text-slate-700" />
                </div>
              </div>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Cadence</p>
                  <p className="mt-1 font-medium text-gray-900">{template.recurrenceRule}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Type</p>
                  <p className="mt-1 font-medium text-gray-900">{template.type}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Mapped controls</p>
                <div className="flex flex-wrap gap-2">
                  {template.controls.map((control) => (
                    <span key={control} className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                      <Layers3 className="mr-1 h-3 w-3" />
                      {control}
                    </span>
                  ))}
                </div>
              </div>
              <Button onClick={() => createSuite.mutate(template.id)} disabled={createSuite.isPending} className="w-full">
                <Rocket className="mr-2 h-4 w-4" />
                {createSuite.isPending ? 'Creating suite...' : 'Create Test Suite'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}
