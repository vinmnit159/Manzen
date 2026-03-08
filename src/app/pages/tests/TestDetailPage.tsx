import { useParams } from 'react-router';
import { TestDetailPanel } from './TestDetailPanel';

export function TestDetailPage() {
  const { testId } = useParams<{ testId: string }>();

  if (!testId) {
    return (
      <div className="p-8 text-center text-gray-500">
        No test ID provided.
      </div>
    );
  }

  return <TestDetailPanel testId={testId} pageMode />;
}
