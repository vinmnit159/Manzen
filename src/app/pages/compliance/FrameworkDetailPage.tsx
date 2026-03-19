import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  ArrowLeft,
  ShieldCheck,
  FlaskConical,
  FileText,
  AlertTriangle,
  XCircle,
  LayoutDashboard,
  ListChecks,
  FileBox,
  Gauge,
} from 'lucide-react';
import { frameworksService } from '@/services/api/frameworks';

import { OverviewTab } from './frameworkDetail/OverviewTab';
import { RequirementsTab } from './frameworkDetail/RequirementsTab';
import { ControlsTab } from './frameworkDetail/ControlsTab';
import { TestsTab } from './frameworkDetail/TestsTab';
import { PoliciesTab } from './frameworkDetail/PoliciesTab';
import { GapsTab } from './frameworkDetail/GapsTab';
import { ExclusionsTab } from './frameworkDetail/ExclusionsTab';
import { ExportsTab } from './frameworkDetail/ExportsTab';

export function FrameworkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultTab = (location.state as any)?.tab ?? 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);

  const { data: fwRes, isLoading: fwLoading } = useQuery({
    queryKey: ['frameworks', 'detail', slug],
    queryFn: () => frameworksService.getFramework(slug!),
    enabled: !!slug,
  });

  const fw = fwRes?.data;

  // F4: Replace full-page spinner with a skeleton shell so the page structure
  // is visible immediately while framework metadata loads. Each tab renders
  // its own per-section loading state once the shell is mounted.
  if (fwLoading) {
    return (
      <PageTemplate title="Framework">
        <div className="animate-pulse space-y-5">
          {/* Back button skeleton */}
          <div className="h-8 w-32 rounded-md bg-gray-100" />
          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-6 w-56 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-100" />
          </div>
          {/* Tab list skeleton */}
          <div className="flex gap-2 flex-wrap">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-gray-100" />
            ))}
          </div>
          {/* Tab content skeleton */}
          <div className="space-y-3 pt-2">
            <div className="h-32 w-full rounded-xl bg-gray-100" />
            <div className="h-24 w-full rounded-xl bg-gray-100" />
            <div className="h-24 w-2/3 rounded-xl bg-gray-100" />
          </div>
        </div>
      </PageTemplate>
    );
  }

  if (!fw) {
    return (
      <PageTemplate title="Framework not found">
        <Card className="border-gray-200">
          <CardContent className="py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">
              Framework "{slug}" not found
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/compliance/frameworks')}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Frameworks
            </Button>
          </CardContent>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={fw.name}
      description={`v${fw.version} · ${fw.description ?? ''}`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-gray-500"
        onClick={() => navigate('/compliance/frameworks')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> All frameworks
      </Button>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <TabsList className="rounded-xl bg-slate-100 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-1.5 text-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="requirements"
            className="flex items-center gap-1.5 text-xs"
          >
            <ListChecks className="w-3.5 h-3.5" /> Requirements
          </TabsTrigger>
          <TabsTrigger
            value="controls"
            className="flex items-center gap-1.5 text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Controls
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className="flex items-center gap-1.5 text-xs"
          >
            <FlaskConical className="w-3.5 h-3.5" /> Tests
          </TabsTrigger>
          <TabsTrigger
            value="policies"
            className="flex items-center gap-1.5 text-xs"
          >
            <FileText className="w-3.5 h-3.5" /> Policies
          </TabsTrigger>
          <TabsTrigger
            value="gaps"
            className="flex items-center gap-1.5 text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Gaps
          </TabsTrigger>
          <TabsTrigger
            value="exclusions"
            className="flex items-center gap-1.5 text-xs"
          >
            <XCircle className="w-3.5 h-3.5" /> Exclusions
          </TabsTrigger>
          <TabsTrigger
            value="exports"
            className="flex items-center gap-1.5 text-xs"
          >
            <FileBox className="w-3.5 h-3.5" /> Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab slug={slug!} />
        </TabsContent>
        <TabsContent value="requirements" className="mt-0">
          <RequirementsTab slug={slug!} />
        </TabsContent>
        <TabsContent value="controls" className="mt-0">
          <ControlsTab slug={slug!} />
        </TabsContent>
        <TabsContent value="tests" className="mt-0">
          <TestsTab slug={slug!} />
        </TabsContent>
        <TabsContent value="policies" className="mt-0">
          <PoliciesTab slug={slug!} />
        </TabsContent>
        <TabsContent value="gaps" className="mt-0">
          <GapsTab slug={slug!} />
        </TabsContent>
        <TabsContent value="exclusions" className="mt-0">
          <ExclusionsTab slug={slug!} />
        </TabsContent>
        <TabsContent value="exports" className="mt-0">
          <ExportsTab slug={slug!} />
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
