import { PageTemplate } from '@/app/components/PageTemplate';
import { FrameworkSuiteLibrary } from '@/app/components/compliance/FrameworkSuiteLibrary';

export function TestLibraryPage() {
  return (
    <PageTemplate title="Available Frameworks" description="Pre-built compliance test suites for enterprise frameworks.">
      <FrameworkSuiteLibrary />
    </PageTemplate>
  );
}
