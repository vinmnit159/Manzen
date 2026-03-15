import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { trustCenterService } from '@/services/api/trustCenter';

import { BASE_URL, TABS, TabKey } from './trustCenter/helpers';
import { DocumentsTab } from './trustCenter/DocumentsTab';
import { AnnouncementsTab } from './trustCenter/AnnouncementsTab';
import { AccessRequestsTab } from './trustCenter/AccessRequestsTab';
import { QuestionnairesTab } from './trustCenter/QuestionnairesTab';

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TrustCenterPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('documents');

  // Get settings to show portal link
  const { data: settingsData } = useQuery({
    queryKey: ['trust-settings'],
    queryFn:  () => trustCenterService.getSettings(),
  });
  const settings = settingsData?.data?.settings;
  const portalUrl = settings?.orgSlug ? `${BASE_URL}/trust/${settings.orgSlug}` : null;

  return (
    <PageTemplate
      title="Trust Center"
      description="Manage documents, announcements, and customer access for your trust portal."
      actions={
        portalUrl && settings?.enabled ? (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-1.5" /> View Live Portal
            </Button>
          </a>
        ) : undefined
      }
    >
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'documents'       && <DocumentsTab />}
      {activeTab === 'announcements'   && <AnnouncementsTab />}
      {activeTab === 'access-requests' && <AccessRequestsTab />}
      {activeTab === 'questionnaires'  && <QuestionnairesTab />}
    </PageTemplate>
  );
}
