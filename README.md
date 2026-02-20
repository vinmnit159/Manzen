# Manzen — ISMS Web UI

The React frontend for the Manzen Information Security Management System. A lightweight ISO 27001 compliance tool for small organisations. Built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui**.

**Live app:** `https://isms.bitcoingames1346.com`  
**Backend repo:** [isms-backend](https://github.com/vinmnit159/isms-backend)  
**MDM agent repo:** [manzen-mdm-agent](https://github.com/vinmnit159/manzen-mdm-agent)

---

## What it does

Manzen gives security teams a single dashboard to manage:

- **Risks** — create, score, and track ISO 27001 risks with treatment plans
- **Controls** — Statement of Applicability (SOA) for all 93 Annex A controls
- **Assets** — inventory of endpoints, cloud, SaaS, repos, databases
- **Evidence** — upload and track evidence linked to controls
- **Policies** — manage and version policy documents
- **Audits** — internal and external audit findings
- **People** — org members with roles and linked GitHub accounts
- **Computers** — live MDM device dashboard (powered by manzen-mdm-agent)
- **Access** — GitHub account → ISMS user mapping
- **Integrations** — GitHub (evidence collection) + Manzen MDM Agent (device compliance)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Language | TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS |
| Component library | shadcn/ui (Radix UI primitives) |
| Routing | React Router v7 |
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
│   ├── app/
│   │   ├── App.tsx                  # Thin wrapper: <RouterProvider router={router} />
│   │   ├── routes.ts                # All routes defined here with requireAuth() guard
│   │   │
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Outer shell: Sidebar + Header + <Outlet />
│   │   │   ├── Sidebar.tsx          # Left nav — section groups and links
│   │   │   ├── Header.tsx           # Top bar — org name, user menu
│   │   │   ├── PageTemplate.tsx     # Standard page wrapper: title + description + actions slot
│   │   │   └── ui/                  # shadcn/ui components (Button, Card, Badge, Dialog, etc.)
│   │   │
│   │   └── pages/
│   │       ├── HomePage.tsx                      # Dashboard: risk summary, activity feed
│   │       ├── IntegrationsPage.tsx              # GitHub + Manzen MDM Agent integration cards
│   │       ├── SetupFormPage.tsx                 # First-run org + admin setup wizard
│   │       │
│   │       ├── auth/
│   │       │   ├── LoginPage.tsx                 # Email/password + Google SSO login
│   │       │   ├── RegisterPage.tsx              # Account registration
│   │       │   └── AuthCallbackPage.tsx          # Handles OAuth redirect, stores JWT
│   │       │
│   │       ├── personnel/
│   │       │   ├── PeoplePage.tsx                # Org members — roles, GitHub accounts, remove
│   │       │   ├── ComputersPage.tsx             # MDM device list — compliance per check
│   │       │   ├── AccessPage.tsx                # GitHub member → ISMS user mapping
│   │       │   └── SettingsPage.tsx
│   │       │
│   │       ├── risk/
│   │       │   ├── OverviewPage.tsx              # Risk dashboard: counts by level and status
│   │       │   ├── RisksPage.tsx                 # Full risk register table
│   │       │   ├── RiskLibraryPage.tsx
│   │       │   ├── ActionTrackerPage.tsx
│   │       │   └── SnapshotPage.tsx
│   │       │
│   │       ├── compliance/
│   │       │   ├── ControlsPage.tsx              # ISO 27001 Annex A SOA
│   │       │   ├── PoliciesPage.tsx              # Policy documents with upload
│   │       │   ├── AuditsPage.tsx                # Audit list and findings
│   │       │   ├── DocumentsPage.tsx
│   │       │   └── FrameworksPage.tsx
│   │       │
│   │       ├── assets/
│   │       │   ├── InventoryPage.tsx             # Asset inventory
│   │       │   ├── CodeChangesPage.tsx           # GitHub commit activity
│   │       │   ├── VulnerabilitiesPage.tsx
│   │       │   └── SecurityAlertsPage.tsx
│   │       │
│   │       └── controls/
│   │           ├── ControlsPage.tsx              # Detailed controls with filter/sort
│   │           ├── ControlsTable.tsx
│   │           ├── ControlsFilter.tsx
│   │           └── ColumnSelector.tsx
│   │
│   └── services/
│       └── api/
│           ├── client.ts            # Base fetch wrapper — attaches JWT, handles errors
│           ├── types.ts             # Shared TypeScript types (User, Role, Asset, Risk…)
│           ├── index.ts             # Re-exports all services and types
│           ├── auth.ts             # authService — login, register, me, logout
│           ├── assets.ts           # assetsService
│           ├── risks.ts            # risksService
│           ├── controls.ts         # controlsService
│           ├── evidence.ts         # evidenceService
│           ├── policies.ts         # policiesService
│           ├── audits.ts           # auditsService
│           ├── integrations.ts     # integrationsService — GitHub OAuth + scan
│           ├── users.ts            # usersService — users + GitHub account mapping
│           ├── mdm.ts              # mdmService — enrollment tokens + managed devices
│           ├── activityLogs.ts     # activityLogsService
│           ├── dashboard.ts        # dashboardService
│           └── setup.ts            # setupService — first-run wizard
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

All other routes render inside `<Layout>` (sidebar + header) and require authentication.

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

## Service layer

Each file in `src/services/api/` wraps one domain of the backend API with fully typed request and response types. Pages import from the service layer — never from `client.ts` directly.

### `usersService` (`users.ts`)
- `listUsers()` — fetch all org members with their linked GitHub accounts
- `updateUser(id, { role, name })` — change a user's role (admin only)
- `deleteUser(id)` — remove user from org
- `getGitHubMembers()` — live GitHub org members with `mappedUserId` field
- `mapGitAccount({ userId, githubUsername, ... })` — link GitHub → ISMS user
- `unmapGitAccount(id)` — remove a GitHub link

### `mdmService` (`mdm.ts`)
- `createToken(label?)` — create enrollment token, returns install command
- `listTokens()` — all tokens with used/pending status
- `deleteToken(id)` — revoke a token
- `listDevices()` — all enrolled Mac devices with compliance snapshot
- `getDeviceCheckins(deviceId)` — audit history for a device
- `revokeDevice(id)` — prevent a device from checking in
- `getOverview()` — `{ total, compliant, nonCompliant, unknown }` counts

### `integrationsService` (`integrations.ts`)
- `getStatus()` — GitHub integration status + repo list
- `getConnectUrl()` — URL to start GitHub OAuth
- `triggerScan()` — kick off an immediate repo scan
- `getGitHubRepos()` — repos with scan results
- `disconnect()` — remove GitHub integration

---

## Authentication flow

1. User visits `/login`, enters email + password (or clicks Google)
2. On success, `authService.login()` stores the JWT in `localStorage` as `isms_token`
3. Every subsequent API call sends `Authorization: Bearer <token>`
4. On `401`, the client clears the token and the router redirects to `/login`
5. For Google SSO, the user is redirected to `/auth/callback?token=<jwt>` which stores the token then navigates to `/`

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

3. Add a sidebar link in `src/app/components/Sidebar.tsx` if needed.

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

## MDM integration (Computers page)

The `ComputersPage` connects to `mdmService.listDevices()` which returns `ENDPOINT` assets that have at least one `DeviceEnrollment` record. Each device row shows:

- Hostname, OS type and version, serial number
- Last seen timestamp (from `DeviceEnrollment.lastSeenAt`)
- Overall compliance badge (`COMPLIANT` / `NON_COMPLIANT` / `UNKNOWN`)
- Expandable row with per-check detail (disk encryption, screen lock, firewall, SIP, auto-updates, Gatekeeper, antivirus)
- Revoke button (marks enrollment as revoked, agent can no longer check in)

To enroll a device, go to **Integrations → Manzen MDM Agent → Create Enrollment Token**, copy the displayed install command, and run it on the target Mac.

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
