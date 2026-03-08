type WorkflowDeliveryKind = 'slack' | 'jira' | 'github-actions' | 'siem';

export interface WorkflowDeliveryLogEntry {
  id: string;
  testId: string;
  kind: WorkflowDeliveryKind;
  status: 'sent' | 'failed' | 'skipped';
  summary: string;
  destination: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

interface SlackConfig {
  webhookUrl?: string;
  channel?: string;
}

interface JiraConfig {
  baseUrl?: string;
  projectKey?: string;
  email?: string;
  apiToken?: string;
  issueType?: string;
}

interface GithubActionsConfig {
  token?: string;
  owner?: string;
  repo?: string;
  apiUrl?: string;
  dispatchEvent?: string;
}

interface SiemConfig {
  webhookUrl?: string;
  splunkHecUrl?: string;
  splunkHecToken?: string;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSlackConfig(): SlackConfig {
  return {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_DEFAULT_CHANNEL,
  };
}

function getJiraConfig(): JiraConfig {
  return {
    baseUrl: process.env.JIRA_BASE_URL,
    projectKey: process.env.JIRA_PROJECT_KEY,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    issueType: process.env.JIRA_ISSUE_TYPE ?? 'Task',
  };
}

function getGithubActionsConfig(): GithubActionsConfig {
  return {
    token: process.env.GITHUB_ACTIONS_TOKEN ?? process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_ACTIONS_OWNER,
    repo: process.env.GITHUB_ACTIONS_REPO,
    apiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com',
    dispatchEvent: process.env.GITHUB_ACTIONS_DISPATCH_EVENT ?? 'test-workflow',
  };
}

function getSiemConfig(): SiemConfig {
  return {
    webhookUrl: process.env.SIEM_WEBHOOK_URL,
    splunkHecUrl: process.env.SPLUNK_HEC_URL,
    splunkHecToken: process.env.SPLUNK_HEC_TOKEN,
  };
}

const deliveryLog: WorkflowDeliveryLogEntry[] = [];
const dispatchedEscalations = new Set<string>();

function record(entry: Omit<WorkflowDeliveryLogEntry, 'id' | 'createdAt'>) {
  const full: WorkflowDeliveryLogEntry = { id: makeId('delivery'), createdAt: nowIso(), ...entry };
  deliveryLog.unshift(full);
  return full;
}

function authHeader(user: string, token: string) {
  return `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`;
}

export function listWorkflowDeliveryLog(testId?: string) {
  return testId ? deliveryLog.filter((entry) => entry.testId === testId) : [...deliveryLog];
}

async function postJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function sendSlackNotification(params: { testId: string; title: string; body: string; severity?: string }) {
  const config = getSlackConfig();
  if (!config.webhookUrl) {
    return record({ testId: params.testId, kind: 'slack', status: 'skipped', destination: 'slack', summary: 'Slack webhook not configured' });
  }

  try {
    await postJson(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: config.channel,
        text: `${params.title}\n${params.body}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: params.title } },
          { type: 'section', text: { type: 'mrkdwn', text: params.body } },
          { type: 'context', elements: [{ type: 'mrkdwn', text: `Severity: ${params.severity ?? 'info'}` }] },
        ],
      }),
    });
    return record({ testId: params.testId, kind: 'slack', status: 'sent', destination: config.channel ?? 'slack-webhook', summary: params.title });
  } catch (error) {
    return record({ testId: params.testId, kind: 'slack', status: 'failed', destination: config.channel ?? 'slack-webhook', summary: params.title, details: { error: error instanceof Error ? error.message : String(error) } });
  }
}

export async function createJiraTicket(params: { testId: string; summary: string; description: string; labels?: string[] }) {
  const config = getJiraConfig();
  if (!config.baseUrl || !config.projectKey || !config.email || !config.apiToken) {
    return record({ testId: params.testId, kind: 'jira', status: 'skipped', destination: 'jira', summary: 'Jira credentials not configured' });
  }

  try {
    const data = await postJson(`${config.baseUrl.replace(/\/$/, '')}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(config.email, config.apiToken),
        Accept: 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: config.projectKey },
          summary: params.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [{ type: 'paragraph', content: [{ type: 'text', text: params.description }] }],
          },
          issuetype: { name: config.issueType },
          labels: params.labels ?? [],
        },
      }),
    });
    return record({ testId: params.testId, kind: 'jira', status: 'sent', destination: config.projectKey, summary: params.summary, details: typeof data === 'object' && data ? data as Record<string, unknown> : undefined });
  } catch (error) {
    return record({ testId: params.testId, kind: 'jira', status: 'failed', destination: config.projectKey, summary: params.summary, details: { error: error instanceof Error ? error.message : String(error) } });
  }
}

export async function triggerGithubActionsWorkflow(params: { testId: string; eventType?: string; clientPayload: Record<string, unknown> }) {
  const config = getGithubActionsConfig();
  if (!config.token || !config.owner || !config.repo) {
    return record({ testId: params.testId, kind: 'github-actions', status: 'skipped', destination: 'github-actions', summary: 'GitHub Actions dispatch not configured' });
  }

  const url = `${config.apiUrl}/repos/${config.owner}/${config.repo}/dispatches`;
  try {
    await postJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'manzen-test-workflows',
      },
      body: JSON.stringify({
        event_type: params.eventType ?? config.dispatchEvent,
        client_payload: params.clientPayload,
      }),
    });
    return record({ testId: params.testId, kind: 'github-actions', status: 'sent', destination: `${config.owner}/${config.repo}`, summary: `Triggered ${params.eventType ?? config.dispatchEvent}` });
  } catch (error) {
    return record({ testId: params.testId, kind: 'github-actions', status: 'failed', destination: `${config.owner}/${config.repo}`, summary: `Triggered ${params.eventType ?? config.dispatchEvent}`, details: { error: error instanceof Error ? error.message : String(error) } });
  }
}

export async function forwardSiemEvent(params: { testId: string; event: Record<string, unknown>; summary: string }) {
  const config = getSiemConfig();
  if (!config.webhookUrl && !(config.splunkHecUrl && config.splunkHecToken)) {
    return record({ testId: params.testId, kind: 'siem', status: 'skipped', destination: 'siem', summary: 'SIEM endpoint not configured' });
  }

  try {
    if (config.splunkHecUrl && config.splunkHecToken) {
      await postJson(config.splunkHecUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Splunk ${config.splunkHecToken}`,
        },
        body: JSON.stringify({ event: params.event, source: 'manzen-tests', sourcetype: 'manzen:test-failure' }),
      });
      return record({ testId: params.testId, kind: 'siem', status: 'sent', destination: 'splunk-hec', summary: params.summary });
    }

    await postJson(config.webhookUrl!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params.event),
    });
    return record({ testId: params.testId, kind: 'siem', status: 'sent', destination: config.webhookUrl!, summary: params.summary });
  } catch (error) {
    return record({ testId: params.testId, kind: 'siem', status: 'failed', destination: config.splunkHecUrl ?? config.webhookUrl ?? 'siem', summary: params.summary, details: { error: error instanceof Error ? error.message : String(error) } });
  }
}

export async function maybeDispatchEscalation(params: { escalationKey: string; testId: string; stage: 'OWNER' | 'MANAGER' | 'CISO'; message: string }) {
  if (dispatchedEscalations.has(params.escalationKey)) return;
  dispatchedEscalations.add(params.escalationKey);
  await Promise.all([
    sendSlackNotification({ testId: params.testId, title: `${params.stage} escalation`, body: params.message, severity: 'warning' }),
    createJiraTicket({ testId: params.testId, summary: `${params.stage} escalation for overdue test`, description: params.message, labels: ['test-escalation', params.stage.toLowerCase()] }),
  ]);
}
