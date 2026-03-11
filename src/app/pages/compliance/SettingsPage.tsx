import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useNotificationPreferences, useUpdateNotificationPreference } from '@/app/features/notifications/useNotifications';
import { notificationEventDefinitions } from '@/app/features/notifications/notificationHelpers';

const COMPLIANCE_EVENT_TYPES = [
  'control.assigned',
  'audit.created',
  'audit.reminder',
  'framework.activated',
  'framework.coverage_drop',
];

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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          {preferencesQuery.isLoading || !preferencesQuery.data ? (
            <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : (
            <div className="space-y-4">
              {notificationEventDefinitions
                .filter((definition) => COMPLIANCE_EVENT_TYPES.includes(definition.eventType))
                .map((definition) => {
                  const preference = preferencesQuery.data.find((item) => item.eventType === definition.eventType);
                  if (!preference) return null;
                  return (
                    <div key={definition.eventType} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                      <div>
                        <Label htmlFor={definition.eventType}>{definition.label}</Label>
                        <p className="text-sm text-gray-500">{definition.description}</p>
                      </div>
                      <Switch
                        id={definition.eventType}
                        checked={preference.inAppEnabled}
                        onCheckedChange={(checked) => updatePreference.mutate({ eventType: definition.eventType, body: { inAppEnabled: checked } })}
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Framework Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-mapping">Auto-map controls</Label>
                <p className="text-sm text-gray-500">Automatically map controls to frameworks</p>
              </div>
              <Switch id="auto-mapping" defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </PageTemplate>
  );
}
