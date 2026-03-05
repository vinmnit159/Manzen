# Manzen — ISMS Web UI

The React frontend for the Manzen Information Security Management System. A comprehensive ISO 27001 compliance platform for organisations. Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**.

**Live app:** `https://isms.bitcoingames1346.com`  
**Backend repo:** [isms-backend](https://github.com/vinmnit159/isms-backend)  
**MDM agent repo:** [manzen-mdm-agent](https://github.com/vinmnit159/manzen-mdm-agent)

---

## What it does

Manzen gives security teams a single dashboard to manage their entire ISO 27001 compliance programme:

- **Dashboard** — live KPI cards, compliance progress, risk distribution, and recent activity feed
- **Risks** — create, score, and track ISO 27001 risks with treatment plans, action tracker, and snapshots
- **Controls** — Statement of Applicability (SOA) for all 93 Annex A controls with filter, sort, and column selection
- **Assets** — inventory of endpoints, cloud, SaaS, repos, databases, vendors, and more
- **Evidence** — upload and track evidence linked to controls
- **Policies** — manage, upload, and version policy documents
- **Audits** — full audit lifecycle (draft → planned → in-progress → completed) with per-control review and final sign-off
- **Findings** — standalone audit finding management with severity and remediation tracking
- **Tests** — manual and automated test management with run history
- **Reports** — six chart-ready report types (framework progress, risk trend, test completion, audit summary, evidence coverage, personnel compliance)
- **People** — org members with roles and linked GitHub accounts
- **Computers** — live MDM device dashboard (powered by manzen-mdm-agent)
- **Access** — GitHub account → ISMS user mapping
- **Onboarding** — guided three-step employee onboarding (accept policies, enroll device, complete training)
- **Trust Center** — admin-managed public trust portal with compliance score, documents, announcements, and access requests
- **Integrations** — 30+ third-party connectors (AWS, GitHub, Snyk, Okta, Slack, Notion, PagerDuty, and more)
- **Auditor workspace** — dedicated role-restricted audit review interface with inline findings creation

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Build tool | Vite 6 |
| Routing | React Router v7 |
| State / data fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 |
| Component library | shadcn/ui (Radix UI primitives) + MUI v7 |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Motion |
| Notifications | Sonner |
| Drag and drop | react-dnd |
| Date utilities | date-fns, react-day-picker |
| HTTP client | Native `fetch` via typed API client |
| Deployment | Static build served from Railway / any CDN |

---

## Requirements

- Node.js 18+
- npm
- A running instance of [isms-backend](https://github.com/vinmnit159/isms-backend)

---

## Local setup

```bash
git clone git@github.com:vinmnit159/Manzen.git
cd Manzen
npm install
```

Set the backend URL. Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:3000
```

If the variable is not set, the API client defaults to the production backend at `https://ismsbackend.bitcoingames1346.com`. This means you can run the frontend locally against the live backend without any configuration.

Start the dev server:

```bash
npm run dev
```

App is available at `http://localhost:5173`.

---

## Project structure

```
Manzen/
├── src/
│   ├── main.tsx                     # React root — mounts <App /> into #root
│   │
│   ├── lib/
│   │   ├── queryKeys.ts             # Centralised React Query key definitions
│   │   └── queryClient.ts           # QueryClient instance with stale time constants
│   │
│   ├── app/
│   │   ├── App.tsx                  # Thin wrapper: <RouterProvider router={router} />
│   │   ├── routes.ts                # All 40+ routes with requireAuth() guard
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Outer shell: Sidebar + Header + <Outlet />
│   │   │   ├── Sidebar.tsx          # Left nav — section groups, role-aware visibility
│   │   │   ├── Header.tsx           # Top bar — org name, user menu
│   │   │   ├── PageTemplate.tsx     # Standard page wrapper: title + description + actions slot
│   │   │   └── ui/                  # shadcn/ui components (Button, Card, Badge, Dialog, etc.)
│   │   │
│   │   └── pages/
│   │       ├── HomePage.tsx                          # Dashboard: KPIs, compliance progress, risk distribution, activity
│   │       ├── MyWorkPage.tsx                        # Personal task / work list
│   │       ├── TestsPage.tsx                         # Test management (manual + automated)
│   │       ├── ReportsPage.tsx                       # Reports dashboard with chart previews
│   │       ├── IntegrationsPage.tsx                  # All integration connection cards
│   │       ├── SetupFormPage.tsx                     # First-run org + admin setup wizard
│   │       │
│   │       ├── reports/
│   │       │   └── ReportViewerPage.tsx              # Full-screen report with chart data
│   │       │
│   │       ├── auth/
│   │       │   ├── LoginPage.tsx                     # Email/password + Google SSO login
│   │       │   ├── RegisterPage.tsx                  # Account registration
│   │       │   └── AuthCallbackPage.tsx              # OAuth redirect handler — stores JWT
│   │       │
│   │       ├── auditor/
│   │       │   ├── AuditorDashboardPage.tsx          # Auditor-only audit review with per-control status
│   │       │   └── AuditFinalReportPage.tsx          # Sign-off and final report generation
│   │       │
│   │       ├── trust/
│   │       │   └── PublicTrustPortalPage.tsx         # Public /:orgSlug portal (no auth required)
│   │       │
│   │       ├── customer-trust/
│   │       │   └── TrustCenterPage.tsx               # Admin trust center management
│   │       │
│   │       ├── compliance/
│   │       │   ├── FrameworksPage.tsx                # Framework overview
│   │       │   ├── PoliciesPage.tsx                  # Policy documents with upload
│   │       │   ├── DocumentsPage.tsx                 # Document library
│   │       │   ├── AuditsPage.tsx                    # Audit list and lifecycle management
│   │       │   ├── FindingsPage.tsx                  # Audit findings with severity and remediation
│   │       │   └── SettingsPage.tsx
│   │       │
│   │       ├── controls/
│   │       │   ├── ControlsPage.tsx                  # ISO 27001 Annex A SOA
│   │       │   ├── ControlsTable.tsx
│   │       │   ├── ControlsFilter.tsx
│   │       │   └── ColumnSelector.tsx
│   │       │
│   │       ├── risk/
│   │       │   ├── OverviewPage.tsx                  # Risk dashboard: counts by level and status
│   │       │   ├── RisksPage.tsx                     # Full risk register table
│   │       │   ├── RiskLibraryPage.tsx               # Risk template library
│   │       │   ├── ActionTrackerPage.tsx             # Risk treatment action tracking
│   │       │   └── SnapshotPage.tsx                  # Point-in-time risk snapshots
│   │       │
│   │       ├── assets/
│   │       │   ├── InventoryPage.tsx                 # Asset inventory
│   │       │   ├── CodeChangesPage.tsx               # GitHub commit activity
│   │       │   ├── VulnerabilitiesPage.tsx           # Vulnerability tracking
│   │       │   └── SecurityAlertsPage.tsx            # Security alert aggregation
│   │       │
│   │       └── personnel/
│   │           ├── PeoplePage.tsx                    # Org members — roles, GitHub accounts
│   │           ├── ComputersPage.tsx                 # MDM device list — per-check compliance
│   │           ├── AccessPage.tsx                    # GitHub member → ISMS user mapping
│   │           └── SettingsPage.tsx
│   │
│   └── services/
│       └── api/
│           ├── client.ts            # Base fetch wrapper — attaches JWT, handles errors
│           ├── types.ts             # Shared TypeScript types (User, Role, Asset, Risk…)
│           ├── index.ts             # Re-exports all services and types
│           │
│           ├── auth.ts             # authService
│           ├── assets.ts           # assetsService
│           ├── risks.ts            # risksService
│           ├── controls.ts         # controlsService
│           ├── evidence.ts         # evidenceService
│           ├── policies.ts         # policiesService
│           ├── audits.ts           # auditsService
│           ├── findings.ts         # findingsService
│           ├── tests.ts            # testsService
│           ├── reports.ts          # reportsService
│           ├── onboarding.ts       # onboardingService
│           ├── trustCenter.ts      # trustCenterService
│           ├── integrations.ts     # integrationsService — GitHub OAuth + scan
│           ├── users.ts            # usersService — users + GitHub account mapping
│           ├── mdm.ts              # mdmService — enrollment tokens + managed devices
│           ├── activityLogs.ts     # activityLogsService
│           ├── dashboard.ts        # dashboardService
│           ├── setup.ts            # setupService — first-run wizard
│           │
│           └── (30+ integration service files)
│               aws.ts, azure.ts, azuread.ts, bamboohr.ts, bigid.ts,
│               certmanager.ts, checkmarx.ts, cloudflare.ts, datadog-incidents.ts,
│               fleet.ts, gcp.ts, intercom.ts, jumpcloud.ts, lacework.ts,
│               newrelic.ts, notion.ts, okta.ts, opsgenie.ts, pagerduty.ts,
│               redash.ts, secretsmanager.ts, servicenow-incident.ts,
│               slack.ts, snyk.ts, sonarqube.ts, vault.ts, veracode.ts,
│               wiz.ts, workspace.ts, ...
│
├── index.html
├── vite.config.ts               # Path alias: @/ → src/
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Routing

All routes are defined in `src/app/routes.ts`. The `requireAuth()` loader checks for a JWT in `localStorage` under the key `isms_token` and redirects to `/login` if absent.

Public routes (no layout, no auth check):
- `/login`
- `/register`
- `/auth/callback`
- `/trust/:orgSlug` — public trust portal

All other routes render inside `<Layout>` (sidebar + header) and require authentication. The sidebar enforces role-based visibility — admin-only items are hidden from `AUDITOR`, `CONTRIBUTOR`, and `VIEWER`. The `AUDITOR` role gets a dedicated "My Audit" shortcut not visible to other roles.

---

## API client

`src/services/api/client.ts` is a thin wrapper around `fetch`. It:

1. Prepends `VITE_API_BASE_URL` (or the production URL) to every path
2. Reads the JWT from `localStorage` and sets `Authorization: Bearer <token>`
3. Parses JSON responses and throws a typed `ApiError` on non-2xx responses
4. Handles `401` responses by clearing the token and redirecting to `/login`

Usage pattern across all service files:

```typescript
// GET with optional query params
apiClient.get('/api/risks', { status: 'OPEN' })

// POST with JSON body
apiClient.post('/api/risks', { title: 'New risk', ... })

// PUT
apiClient.put('/api/risks/abc123', { status: 'MITIGATED' })

// DELETE
apiClient.delete('/api/risks/abc123')
```

---

## Authentication flow

1. User visits `/login`, enters email + password (or clicks Google)
2. On success, `authService.login()` stores the JWT in `localStorage` as `isms_token`
3. Every subsequent API call sends `Authorization: Bearer <token>`
4. On `401`, the client clears the token and the router redirects to `/login`
5. For Google SSO, the user is redirected to `/auth/callback?token=<jwt>&user=<json>` which stores the token then navigates to `/`

---

## Trust Center (public portal)

The public trust portal at `/trust/:orgSlug` is fully unauthenticated. It renders:

- Compliance donut chart (ISO 27001 implementation %)
- Last audit date and certification badges
- Public and NDA-gated document downloads
- Security announcements feed
- Access request modal (with optional NDA checkbox)
- Security questionnaire request modal

The portal data is fetched from `GET /trust/:orgSlug` on the backend — no JWT required.

---

## Auditor workspace

Users with the `AUDITOR` role see a dedicated "My Audit" shortcut in the sidebar. `AuditorDashboardPage` shows:

- Assigned audit details and date range
- KPI panels (controls reviewed, findings created, days remaining)
- Full controls review table with per-control status (`PENDING` / `COMPLIANT` / `NON_COMPLIANT` / `NOT_APPLICABLE`)
- Inline finding creation linked to specific controls
- Navigation to `AuditFinalReportPage` for sign-off

This workspace is role-restricted — other roles cannot access `/auditor/*` routes.

---

## MDM integration (Computers page)

The `ComputersPage` connects to `mdmService.listDevices()` which returns `ENDPOINT` assets that have at least one `DeviceEnrollment` record. Each device row shows:

- Hostname, OS type and version, serial number
- Last seen timestamp
- Overall compliance badge (`COMPLIANT` / `NON_COMPLIANT` / `UNKNOWN`)
- Expandable row with per-check detail (disk encryption, screen lock, firewall, SIP, auto-updates, Gatekeeper, antivirus)
- Revoke button (marks enrollment as revoked, agent can no longer check in)

To enroll a device, go to **Integrations → Manzen MDM Agent → Create Enrollment Token**, copy the displayed install command, and run it on the target Mac.

---

## Adding a new page

1. Create `src/app/pages/<section>/MyNewPage.tsx`:

```tsx
import { PageTemplate } from "@/app/components/PageTemplate";

export function MyNewPage() {
  return (
    <PageTemplate title="My Page" description="What this page does.">
      {/* content */}
    </PageTemplate>
  );
}
```

2. Import and add a route in `src/app/routes.ts`:

```typescript
import { MyNewPage } from "@/app/pages/<section>/MyNewPage";

// inside the Layout children array:
{ path: "section/my-page", Component: MyNewPage },
```

3. Add a sidebar link in `src/app/components/Sidebar.tsx` if needed, with optional `roles` restriction:

```typescript
{ label: "My Page", href: "/section/my-page", icon: SomeIcon, roles: ["ORG_ADMIN", "SECURITY_OWNER"] }
```

---

## Adding a new API service

1. Create `src/services/api/myService.ts`:

```typescript
import { apiClient } from './client';

export const myService = {
  async listItems(): Promise<{ items: Item[] }> {
    return apiClient.get('/api/my-endpoint');
  },
};
```

2. Export from `src/services/api/index.ts`:

```typescript
export { myService } from './myService';
export type { Item } from './myService';
```

---

## Build and deploy

```bash
# Development
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

The `dist/` folder is committed to the repo and served by Railway as a static site. On every push, Vite rebuilds and the new `dist/` is committed alongside the source changes.

---

## Scripts

```bash
npm run dev      # Vite dev server with HMR at localhost:5173
npm run build    # TypeScript check + Vite production build → dist/
npm run preview  # Serve dist/ locally to verify the build
```

---

## UI components

All UI primitives are in `src/app/components/ui/` and come from [shadcn/ui](https://ui.shadcn.com/). They are Radix UI components styled with Tailwind. To add a new component:

```bash
npx shadcn-ui@latest add <component-name>
```

The `PageTemplate` component in `src/app/components/PageTemplate.tsx` is the standard page wrapper used by every page. It accepts:
- `title` — page heading
- `description` — subtitle text
- `actions` — optional slot for buttons rendered top-right
- `children` — page content
