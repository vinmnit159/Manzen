/**
 * FrameworkDetailPage.tsx
 *
 * F3: Tab components are lazy-loaded — each tab's JS chunk is only fetched
 * when that tab is first selected. Non-visible tabs are never mounted until
 * the user navigates to them, avoiding 8 parallel data fetches on page load.
 *
 * F4: Per-section error boundaries with retry affordances. Each tab is wrapped
 * in an ErrorBoundary so a failure in one tab does not crash the entire page.
 *
 * Previously all 8 tabs loaded and fetched data simultaneously on page mount.
 * Now only the active tab is mounted (via `mountedTabs` state set), so data
 * fetches are deferred until the tab is first selected.
 */

import { useState, useEffect, lazy, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { frameworksService } from '@/services/api/frameworks';

// F3: Lazy-load each tab so their JS chunks are only fetched on first selection.
const OverviewTab = lazy(() =>
  import('./frameworkDetail/OverviewTab').then((m) => ({
    default: m.OverviewTab,
  })),
);
const RequirementsTab = lazy(() =>
  import('./frameworkDetail/RequirementsTab').then((m) => ({
    default: m.RequirementsTab,
  })),
);
const ControlsTab = lazy(() =>
  import('./frameworkDetail/ControlsTab').then((m) => ({
    default: m.ControlsTab,
  })),
);
const TestsTab = lazy(() =>
  import('./frameworkDetail/TestsTab').then((m) => ({ default: m.TestsTab })),
);
const PoliciesTab = lazy(() =>
  import('./frameworkDetail/PoliciesTab').then((m) => ({
    default: m.PoliciesTab,
  })),
);
const GapsTab = lazy(() =>
  import('./frameworkDetail/GapsTab').then((m) => ({ default: m.GapsTab })),
);
const ExclusionsTab = lazy(() =>
  import('./frameworkDetail/ExclusionsTab').then((m) => ({
    default: m.ExclusionsTab,
  })),
);
const ExportsTab = lazy(() =>
  import('./frameworkDetail/ExportsTab').then((m) => ({
    default: m.ExportsTab,
  })),
);

// ── F4: Per-tab error boundary ────────────────────────────────────────────────

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class TabErrorBoundary extends Component<
  { children: ReactNode; tabName: string },
  TabErrorBoundaryState
> {
  constructor(props: { children: ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-10 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-700 mb-1">
              Failed to load {this.props.tabName}
            </p>
            <p className="text-xs text-red-500 mb-4">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

// ── Tab loading skeleton ───────────────────────────────────────────────────────

function TabSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-28 w-full rounded-xl bg-gray-100" />
      <div className="h-20 w-full rounded-xl bg-gray-100" />
      <div className="h-20 w-2/3 rounded-xl bg-gray-100" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function FrameworkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const defaultTab = (location.state as any)?.tab ?? 'overview';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // F3: Track which tabs have been visited so we only mount them once they've
  // been selected. Tabs that have never been visited are not mounted (and their
  // data fetches are not triggered) until first selection.
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(
    () => new Set([defaultTab]),
  );

  useEffect(() => {
    if ((location.state as any)?.tab) {
      const tab = (location.state as any).tab;
      setActiveTab(tab);
      setMountedTabs((prev) => new Set([...prev, tab]));
    }
  }, [location.state]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    setMountedTabs((prev) => new Set([...prev, tab]));
  }

  const { data: fwRes, isLoading: fwLoading } = useQuery({
    queryKey: ['frameworks', 'detail', slug],
    queryFn: () => frameworksService.getFramework(slug!),
    enabled: !!slug,
  });

  const fw = fwRes?.data;

  // F4: Skeleton while framework metadata loads — page structure is visible
  // immediately so the user knows the page is working.
  if (fwLoading) {
    return (
      <PageTemplate title="Framework">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-32 rounded-md bg-gray-100" />
          <div className="space-y-2">
            <div className="h-6 w-56 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-100" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-gray-100" />
            ))}
          </div>
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

  // Helper: renders a tab's content only if it has been mounted (i.e. visited).
  // Once mounted, the component stays in the DOM (avoids re-fetching on re-visit)
  // but is visually hidden by Radix Tabs when not active.
  function LazyTab({
    value,
    name,
    children,
  }: {
    value: string;
    name: string;
    children: ReactNode;
  }) {
    if (!mountedTabs.has(value)) return null;
    return (
      <TabErrorBoundary tabName={name}>
        <Suspense fallback={<TabSkeleton />}>{children}</Suspense>
      </TabErrorBoundary>
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
        onValueChange={handleTabChange}
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

        {/* F3: Each TabsContent only renders when its tab has been visited */}
        <TabsContent value="overview" className="mt-0">
          <LazyTab value="overview" name="Overview">
            <OverviewTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="requirements" className="mt-0">
          <LazyTab value="requirements" name="Requirements">
            <RequirementsTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="controls" className="mt-0">
          <LazyTab value="controls" name="Controls">
            <ControlsTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="tests" className="mt-0">
          <LazyTab value="tests" name="Tests">
            <TestsTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="policies" className="mt-0">
          <LazyTab value="policies" name="Policies">
            <PoliciesTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="gaps" className="mt-0">
          <LazyTab value="gaps" name="Gaps">
            <GapsTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="exclusions" className="mt-0">
          <LazyTab value="exclusions" name="Exclusions">
            <ExclusionsTab slug={slug!} />
          </LazyTab>
        </TabsContent>
        <TabsContent value="exports" className="mt-0">
          <LazyTab value="exports" name="Exports">
            <ExportsTab slug={slug!} />
          </LazyTab>
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
