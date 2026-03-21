import {
  AlertTriangle,
  Lightbulb,
  ClipboardCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { TestRecord } from '@/services/api/tests';
import { findingsService, type FindingRecord } from '@/services/api/findings';
import {
  remediationService,
  type RemediationAction,
} from '@/services/api/remediation';
import { STATUS_CONFIG } from './constants';
import { fmtDate } from '@/lib/format-date';
import { getProviderLabel } from './scanRegistry';

// ── Live remediation panel (shown when autoRemediationSupported=true) ──────────

const ACTIVE_STATUSES: RemediationAction['status'][] = [
  'PENDING',
  'DRY_RUN_READY',
  'AWAITING_APPROVAL',
  'APPROVED',
  'EXECUTING',
];

function statusLabel(status: RemediationAction['status']) {
  switch (status) {
    case 'PENDING':
      return 'Pending dry run';
    case 'DRY_RUN_READY':
      return 'Dry run ready';
    case 'AWAITING_APPROVAL':
      return 'Awaiting approval';
    case 'APPROVED':
      return 'Approved — ready to execute';
    case 'EXECUTING':
      return 'Executing…';
    case 'SUCCEEDED':
      return 'Succeeded';
    case 'FAILED':
      return 'Failed';
    case 'ROLLED_BACK':
      return 'Rolled back';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

function statusColor(status: RemediationAction['status']) {
  if (status === 'SUCCEEDED')
    return 'text-green-700 bg-green-50 border-green-200';
  if (status === 'FAILED' || status === 'ROLLED_BACK')
    return 'text-red-700 bg-red-50 border-red-200';
  if (status === 'EXECUTING' || status === 'APPROVED')
    return 'text-blue-700 bg-blue-50 border-blue-200';
  if (status === 'AWAITING_APPROVAL')
    return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-gray-700 bg-gray-50 border-gray-200';
}

function LiveRemediationPanel({ finding }: { finding: FindingRecord }) {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['remediation-actions', finding.id],
    queryFn: () => remediationService.listActions(finding.id),
    refetchInterval: (q) => {
      const data = q.state.data as RemediationAction[] | undefined;
      return data?.some((a) => ACTIVE_STATUSES.includes(a.status))
        ? 3000
        : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading remediation status…
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-2">
        No automated remediation actions available for this finding yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`rounded-lg border p-3 text-sm ${statusColor(action.status)}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Zap className="w-4 h-4" />
              {action.provider} — {action.actionType}
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border">
              {statusLabel(action.status)}
            </span>
          </div>
          {action.latestExecution?.diffJson && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs opacity-70 hover:opacity-100">
                View dry-run diff
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <p className="font-semibold mb-1 opacity-60">Before</p>
                  <pre className="whitespace-pre-wrap break-all bg-white/50 rounded p-2 border">
                    {JSON.stringify(
                      action.latestExecution.diffJson.before,
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold mb-1 opacity-60">After</p>
                  <pre className="whitespace-pre-wrap break-all bg-white/50 rounded p-2 border">
                    {JSON.stringify(
                      action.latestExecution.diffJson.after,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            </details>
          )}
          {action.latestExecution?.riskSummary && (
            <p className="mt-2 text-xs opacity-80">
              {action.latestExecution.riskSummary}
            </p>
          )}
          {action.lastError && (
            <p className="mt-2 text-xs text-red-600">{action.lastError}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AutoRemediationSection({ testId }: { testId: string }) {
  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['test-findings', testId],
    queryFn: () => findingsService.listByTestId(testId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Checking remediation engine…
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="w-4 h-4" />
          Automated remediation is available
        </div>
        <p className="mt-1 text-xs opacity-80">
          No open findings detected. Run a scan to trigger the remediation
          engine when issues are found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="w-4 h-4" />
          Automated remediation is available for {findings.length} finding
          {findings.length !== 1 ? 's' : ''}
        </div>
        <p className="mt-1 text-xs opacity-80">
          Use the Findings page to run dry runs, request approval, and execute
          automated fixes.
        </p>
      </div>
      {findings.map((finding) => (
        <div key={finding.id} className="space-y-2">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                finding.severity === 'CRITICAL'
                  ? 'bg-red-100 text-red-700'
                  : finding.severity === 'HIGH'
                    ? 'bg-orange-100 text-orange-700'
                    : finding.severity === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
              }`}
            >
              {finding.severity}
            </span>
            {finding.title}
          </p>
          <LiveRemediationPanel finding={finding} />
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function RemediationGuide({ test }: { test: TestRecord }) {
  // When autoRemediationSupported=true, show live engine status instead of static steps
  if (test.autoRemediationSupported && test.type !== 'Document') {
    return <AutoRemediationSection testId={test.id} />;
  }

  const isAutomated = test.type !== 'Document';
  const isFailing =
    test.lastResult === 'Fail' || test.status === 'Needs_remediation';
  const isOverdue = test.status === 'Overdue';
  const providerLabel = test.integration?.provider
    ? getProviderLabel(test.integration.provider)
    : null;

  const steps: Array<{
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }> = [];

  if (isFailing && isAutomated) {
    steps.push({
      title: 'Investigate the failing scan result',
      description: `Review the latest scan output from ${providerLabel ?? 'the integration'}. Check the Scan Run History section above for the detailed failure summary and root cause.`,
      severity: 'critical',
    });
  } else if (isFailing) {
    steps.push({
      title: 'Review the test requirements',
      description: `This test requires manual verification. Review the linked controls and evidence requirements to understand what compliance gap exists.`,
      severity: 'critical',
    });
  } else if (isOverdue) {
    steps.push({
      title: 'Acknowledge the overdue status',
      description: `This test was due on ${fmtDate(test.dueDate)} and is now overdue. Prioritize completing this test to avoid compliance drift.`,
      severity: 'warning',
    });
  } else {
    steps.push({
      title: 'Review current test status',
      description: `This test is currently ${STATUS_CONFIG[test.status]?.label ?? test.status}. Review linked controls and evidence to ensure continued compliance.`,
      severity: 'info',
    });
  }

  if (test.controls.length > 0) {
    const controlNames = test.controls
      .map((c) => c.control.isoReference)
      .join(', ');
    steps.push({
      title: 'Verify linked control implementation',
      description: `Ensure the following controls are fully implemented: ${controlNames}. Check each control's status and verify its implementation aligns with the test requirements.`,
      severity: test.controls.some((c) => c.control.status !== 'IMPLEMENTED')
        ? 'warning'
        : 'info',
    });
  } else {
    steps.push({
      title: 'Map relevant controls',
      description:
        'No controls are linked to this test. Use the Controls section below to link the applicable ISO/SOC controls that this test validates.',
      severity: 'warning',
    });
  }

  if (test.evidences.length === 0) {
    steps.push({
      title: 'Collect and attach evidence',
      description:
        'No evidence is currently attached. Gather the required documentation, screenshots, or automated reports that prove compliance and attach them using the Evidence section below.',
      severity: 'warning',
    });
  } else if (isFailing) {
    steps.push({
      title: 'Update evidence with remediation proof',
      description: `Current evidence (${test.evidences.length} items) may reflect the pre-remediation state. After fixing the issue, collect fresh evidence showing the resolved state and attach it.`,
      severity: 'warning',
    });
  } else {
    steps.push({
      title: 'Verify evidence freshness',
      description: `${test.evidences.length} evidence item(s) attached. Ensure the latest evidence is still current and reflects the actual state of the system.`,
      severity: 'info',
    });
  }

  if (isAutomated && isFailing) {
    steps.push({
      title: `Apply the fix in ${providerLabel ?? 'the integration'}`,
      description: `Make the necessary configuration changes directly in ${providerLabel ?? 'the connected system'}. Common fixes include updating security policies, enabling required features, or patching vulnerable components.`,
      severity: 'critical',
    });
    steps.push({
      title: 'Re-run the automated scan',
      description:
        'After applying the fix, trigger a new scan using the "Run Scan Now" button above. Wait for the scan to complete and verify the result changes to Pass.',
      severity: 'info',
    });
  }

  if (test.frameworks.length > 0) {
    steps.push({
      title: 'Confirm framework alignment',
      description: `This test maps to: ${test.frameworks.map((f) => f.frameworkName).join(', ')}. Verify that remediation actions satisfy the requirements of all linked frameworks.`,
      severity: 'info',
    });
  }

  if (!isAutomated) {
    steps.push({
      title: 'Mark the test as complete',
      description:
        'Once all controls are implemented, evidence is collected, and the compliance gap is resolved, use the "Mark Complete" button to close this test cycle.',
      severity: 'info',
    });
  }

  if (test.audits.length > 0) {
    steps.push({
      title: 'Document for audit readiness',
      description: `This test is linked to ${test.audits.length} audit(s). Ensure all remediation actions and evidence are thoroughly documented for the auditor.`,
      severity: 'info',
    });
  }

  const severityIcon = (sev: string) => {
    if (sev === 'critical')
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (sev === 'warning')
      return <Lightbulb className="w-4 h-4 text-amber-500" />;
    return <ClipboardCheck className="w-4 h-4 text-blue-500" />;
  };

  const severityBg = (sev: string) => {
    if (sev === 'critical') return 'border-red-200 bg-red-50/50';
    if (sev === 'warning') return 'border-amber-200 bg-amber-50/50';
    return 'border-gray-100 bg-gray-50/50';
  };

  return (
    <div className="space-y-3">
      {(isFailing || isOverdue) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${isFailing ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {isFailing
              ? 'This test is failing and requires remediation'
              : 'This test is overdue and needs attention'}
          </div>
          <p className="mt-1 text-xs opacity-80">
            Follow the steps below to resolve the issue and bring this test back
            into compliance.
          </p>
        </div>
      )}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={`rounded-lg border p-3 ${severityBg(step.severity)}`}
          >
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {severityIcon(step.severity)}
                  <p className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
