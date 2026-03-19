import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield } from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from '@/app/features/notifications/useNotifications';
import { notificationEventDefinitions } from '@/app/features/notifications/notificationHelpers';
import {
  remediationService,
  TenantPolicy,
  UpdateTenantPolicyRequest,
} from '@/services/api/remediation';

const COMPLIANCE_EVENT_TYPES = [
  'control.assigned',
  'audit.created',
  'audit.reminder',
  'framework.activated',
  'framework.coverage_drop',
];

const SEVERITY_OPTIONS: Array<{
  value: TenantPolicy['maxAutoFixSeverity'];
  label: string;
  description: string;
}> = [
  {
    value: 'LOW',
    label: 'Low only',
    description: 'Only auto-fix low severity findings',
  },
  {
    value: 'MEDIUM',
    label: 'Medium and below',
    description: 'Auto-fix low and medium severity findings',
  },
  {
    value: 'HIGH',
    label: 'High and below',
    description: 'Auto-fix low, medium, and high severity findings',
  },
  {
    value: 'CRITICAL',
    label: 'All severities',
    description: 'Auto-fix any severity (use with caution)',
  },
];

const APPROVAL_CHANNEL_OPTIONS: Array<{
  value: TenantPolicy['defaultApprovalChannel'];
  label: string;
}> = [
  { value: 'manual', label: 'Manual (in-app review)' },
  { value: 'slack', label: 'Slack' },
  { value: 'jira', label: 'Jira' },
];

// ── Remediation Policy Section ────────────────────────────────────────────────

function RemediationPolicySection() {
  const queryClient = useQueryClient();

  const policyQuery = useQuery({
    queryKey: ['remediation-policy'],
    queryFn: () => remediationService.getPolicy(),
  });

  // Local form state — initialized from loaded policy
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [maxSeverity, setMaxSeverity] =
    useState<TenantPolicy['maxAutoFixSeverity']>('MEDIUM');
  const [allowProdCritical, setAllowProdCritical] = useState(false);
  const [requireApprovalForProd, setRequireApprovalForProd] = useState(true);
  const [approvalChannel, setApprovalChannel] =
    useState<TenantPolicy['defaultApprovalChannel']>('manual');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (policyQuery.data && !initialized) {
      setAutoFixEnabled(policyQuery.data.autoFixEnabled);
      setMaxSeverity(policyQuery.data.maxAutoFixSeverity);
      setAllowProdCritical(policyQuery.data.allowProductionCriticalAutoFix);
      setRequireApprovalForProd(policyQuery.data.requireApprovalForProduction);
      setApprovalChannel(policyQuery.data.defaultApprovalChannel ?? 'manual');
      setInitialized(true);
    }
    // If no policy exists yet, keep defaults
    if (policyQuery.data === null && !initialized) {
      setInitialized(true);
    }
  }, [policyQuery.data, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTenantPolicyRequest) =>
      remediationService.updatePolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-policy'] });
    },
  });

  function handleSave() {
    updateMutation.mutate({
      autoFixEnabled,
      maxAutoFixSeverity: maxSeverity,
      allowProductionCriticalAutoFix: allowProdCritical,
      requireApprovalForProduction: requireApprovalForProd,
      defaultApprovalChannel: approvalChannel,
    });
  }

  if (policyQuery.isLoading || !initialized) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Auto-fix master toggle */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4">
        <div>
          <Label htmlFor="auto-fix-enabled" className="text-sm font-medium">
            Enable automated remediation
          </Label>
          <p className="text-sm text-gray-500 mt-0.5">
            Allow the remediation engine to automatically fix findings without
            manual intervention, subject to the rules below.
          </p>
        </div>
        <Switch
          id="auto-fix-enabled"
          checked={autoFixEnabled}
          onCheckedChange={setAutoFixEnabled}
        />
      </div>

      {/* Severity cap */}
      <div
        className={`space-y-2 transition-opacity ${!autoFixEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Label className="text-sm font-medium">
          Maximum severity for auto-fix
        </Label>
        <p className="text-xs text-gray-500 mb-2">
          Findings above this severity require human approval before execution.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMaxSeverity(opt.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                maxSeverity === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Production guardrails */}
      <div
        className={`space-y-3 transition-opacity ${!autoFixEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Label className="text-sm font-medium">Production guardrails</Label>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4">
            <div>
              <Label htmlFor="require-approval-prod" className="text-sm">
                Require approval for production resources
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                Always require human approval before auto-fixing resources
                tagged as production environments.
              </p>
            </div>
            <Switch
              id="require-approval-prod"
              checked={requireApprovalForProd}
              onCheckedChange={setRequireApprovalForProd}
            />
          </div>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-orange-50 bg-orange-50 p-4">
            <div>
              <Label
                htmlFor="allow-prod-critical"
                className="text-sm text-orange-800"
              >
                Allow critical auto-fix in production
              </Label>
              <p className="text-sm text-orange-700 mt-0.5">
                Permit the engine to auto-fix critical severity findings even on
                production resources. This overrides the approval requirement
                above. Use with caution.
              </p>
            </div>
            <Switch
              id="allow-prod-critical"
              checked={allowProdCritical}
              onCheckedChange={setAllowProdCritical}
            />
          </div>
        </div>
      </div>

      {/* Default approval channel */}
      <div
        className={`space-y-2 transition-opacity ${!autoFixEnabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <Label className="text-sm font-medium">Default approval channel</Label>
        <p className="text-xs text-gray-500 mb-2">
          Where approval requests are sent when human review is required.
        </p>
        <div className="flex gap-2">
          {APPROVAL_CHANNEL_OPTIONS.map((opt) => (
            <button
              key={opt.value ?? 'none'}
              onClick={() => setApprovalChannel(opt.value)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                approvalChannel === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-100 text-gray-700 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {updateMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save remediation policy
        </Button>
        {updateMutation.isSuccess && (
          <p className="text-sm text-green-600">Saved.</p>
        )}
        {updateMutation.isError && (
          <p className="text-sm text-red-600">Save failed. Please try again.</p>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ComplianceSettingsPage() {
  const preferencesQuery = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  return (
    <PageTemplate
      title="Compliance Settings"
      description="Configure compliance module settings and preferences."
    >
      <div className="space-y-6 max-w-4xl">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notifications
          </h2>
          {preferencesQuery.isLoading || !preferencesQuery.data ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {notificationEventDefinitions
                .filter((definition) =>
                  COMPLIANCE_EVENT_TYPES.includes(definition.eventType),
                )
                .map((definition) => {
                  const preference = preferencesQuery.data.find(
                    (item) => item.eventType === definition.eventType,
                  );
                  if (!preference) return null;
                  return (
                    <div
                      key={definition.eventType}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4"
                    >
                      <div>
                        <Label htmlFor={definition.eventType}>
                          {definition.label}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {definition.description}
                        </p>
                      </div>
                      <Switch
                        id={definition.eventType}
                        checked={preference.inAppEnabled}
                        onCheckedChange={(checked) =>
                          updatePreference.mutate({
                            eventType: definition.eventType,
                            body: { inAppEnabled: checked },
                          })
                        }
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Framework Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-mapping">Auto-map controls</Label>
                <p className="text-sm text-gray-500">
                  Automatically map controls to frameworks
                </p>
              </div>
              <Switch id="auto-mapping" defaultChecked />
            </div>
          </div>
        </Card>

        {/* Remediation Policy — TenantPolicy guardrails */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Remediation Policy
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            Control how the automated remediation engine behaves for your
            organization. These settings govern when fixes can be applied
            automatically versus when human approval is required.
          </p>
          <RemediationPolicySection />
        </Card>
      </div>
    </PageTemplate>
  );
}
