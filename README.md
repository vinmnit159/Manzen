# CloudAnzen Web App

React frontend for CloudAnzen — an AI-driven governance, compliance, risk, and audit readiness platform.

- **Live app:** `https://app.cloudanzen.com`
- **Backend API:** `https://api.cloudanzen.com`
- **Backend repo:** `https://github.com/vinmnit159/isms-backend`

## Architecture

```text
React SPA (this repo)
  ├── Route-level auth guard + error boundaries
  ├── Role-aware navigation + sidebar
  ├── Typed API service layer (per-domain)
  ├── TanStack Query (caching, dedup, retry)
  └── Code-split: 60+ lazy-loaded routes
        |
        v
Backend API (api.cloudanzen.com)
  ├── REST API (/api/*)
  ├── MCP Server (/api/mcp)
  └── Worker services (scans, notifications)
```

## Features

### Compliance & Governance
- **Frameworks** — Activate ISO 27001, SOC 2, NIST, etc. with coverage tracking and gap analysis
- **Controls** — Security control library with effectiveness scoring, status history, and framework mapping
- **Policies** — Policy lifecycle management with versioning, approval workflows, and employee acceptance
- **Audits** — Schedule internal/external audits, manage audit controls, findings, and final reports
- **Tests** — Automated + manual compliance tests with scheduling, evidence linking, and pass/fail tracking
- **Evidence** — Collect and manage evidence files, link to controls and tests, automated evidence collection
- **Findings** — Audit and automated findings with severity tracking and remediation workflows

### Risk Management
- **Risk Register** — Full risk lifecycle (identify, assess, treat, monitor)
- **Risk Engine** — Automated risk scoring based on asset compliance data
- **Action Tracker** — Track risk treatment actions and remediation progress
- **Risk Library** — Pre-built risk templates for common compliance frameworks

### Asset & Vendor Management
- **Asset Inventory** — IT assets with classification, vulnerability tracking, and compliance status
- **Code Changes** — GitHub commit and PR tracking
- **Security Alerts** — Aggregated security findings from integrated tools
- **Vendor Management** — Third-party vendor risk assessments and monitoring

### Integrations (60+ providers)
- **Cloud:** AWS, GCP, Azure
- **Identity:** Okta, Azure AD, JumpCloud
- **Code Security:** GitHub, Snyk, SonarQube, Veracode, Checkmarx
- **Monitoring:** Datadog, New Relic, PagerDuty, OpsGenie
- **Productivity:** Slack, Notion, Google Drive, Intercom
- **MDM:** Fleet, custom agent enrollment
- **Secrets:** HashiCorp Vault, AWS Secrets Manager, Certificate Manager
- **And more** via the Partner API for custom integrations

### Trust Center
- **Public Trust Portal** — Shareable compliance status page at `/trust/:orgSlug`
- **Document Sharing** — Publish compliance documents for customers
- **Access Requests** — Customer-initiated NDA-gated document requests
- **Questionnaires** — AI-assisted security questionnaire responses

### AI
- **Questionnaire Assistant** — RAG-powered answers using your compliance data
- **Evidence Synthesis** — Auto-generate evidence summaries from connected tools
- **Knowledge Base** — Upload and index documents for AI retrieval

### Personnel & Onboarding
- **People** — Employee directory with security task tracking
- **Computers** — MDM-enrolled device compliance
- **Security Tasks** — Policy acceptance, MDM enrollment, security training

### Reports
- **Compliance Reports** — SOC 2, ISO 27001, executive summary, and custom reports
- **Report Viewer** — Interactive report with charts, controls, risks, and evidence

### Settings
- **Profile & Notifications** — User preferences and notification channels
- **Users & Roles** — RBAC user management with invite workflow
- **MCP** — AI agent access management (API keys, execution logs, tool permissions)
- **Module Settings** — Per-module configuration (compliance, risk, privacy, assets, personnel, trust center)

## Tech stack

- **Framework:** React 19 + TypeScript (strict mode)
- **Build:** Vite 6 with manual chunk splitting
- **Routing:** React Router 7 (lazy-loaded routes)
- **Data Fetching:** TanStack React Query (per-category stale times)
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI primitives + shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React
- **Toasts:** Sonner

## Configuration

Set the backend URL in `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

If unset, the API client defaults to `https://api.cloudanzen.com`.

## Local development

```bash
npm install
npm run dev
```

App runs on `http://localhost:5173`.

### Quality checks
```bash
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint with zero warnings
npm test -- --run    # Run test suite
npm run build        # Production build
```

## Project structure

```
src/
├── app/
│   ├── routes.ts                  # Browser router, lazy imports, auth guard
│   ├── App.tsx                    # Root: QueryClient, ConfirmDialog, ErrorBoundary
│   ├── authGuard.ts               # requireAuth() route loader
│   ├── components/
│   │   ├── Layout.tsx             # Shell: sidebar + route error boundary + Suspense
│   │   ├── ErrorBoundary.tsx      # Class component with production error reporting
│   │   ├── PageTemplate.tsx       # Consistent page header + actions wrapper
│   │   ├── Sidebar.tsx            # Role-aware navigation sidebar
│   │   ├── settings/              # Settings layout + navigation
│   │   └── ui/                    # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── hooks/
│   │   └── useConfirmDialog.tsx   # Promise-based confirm dialog (replaces window.confirm)
│   ├── pages/
│   │   ├── auth/                  # Login, Register, SSO callback
│   │   ├── compliance/            # Frameworks, Policies, Documents, Audits, Findings
│   │   ├── controls/              # Controls table, detail panel, filters
│   │   ├── risk/                  # Risk overview, register, detail, engine, action tracker
│   │   ├── tests/                 # Test list, detail panel with runs/history/evidence
│   │   ├── assets/                # Inventory, code changes, vulnerabilities, alerts
│   │   ├── vendors/               # Vendor risk management
│   │   ├── integrations/          # 60+ integration cards, Partner API
│   │   ├── reports/               # Report list + interactive viewer
│   │   ├── ai/                    # Questionnaire assistant, knowledge base
│   │   ├── personnel/             # People, computers, access management
│   │   ├── customer-trust/        # Trust center admin, settings
│   │   ├── trust/                 # Public trust portal
│   │   ├── settings/              # MCP settings page
│   │   └── ...                    # Other pages
│   └── features/
│       └── notifications/         # Notification hooks and preferences
├── services/
│   └── api/
│       ├── client.ts              # ApiClient singleton (typed, auto-auth, error handling)
│       ├── mcp.ts                 # MCP settings, keys, and logs service
│       └── ...                    # Per-domain service files
├── lib/
│   ├── queryKeys.ts               # Centralized React Query key factory
│   ├── queryClient.ts             # Query client with per-category stale times
│   ├── constants.ts               # UI timing constants (toast durations, etc.)
│   └── format-date.ts             # Shared date formatting utilities
└── tests/                         # Unit + integration tests
```

## Auth model

- JWT token stored in `sessionStorage` (migrated from legacy `localStorage` on first load).
- `requireAuth()` route loader redirects to `/login` if token is missing.
- API client attaches `Authorization: Bearer <token>`, sends `credentials: 'include'`, and clears session on `401`.

## Build & deploy

```bash
npm run build
```

Production build outputs to `dist/` — static assets deployed via Railway.

Pull requests must pass `lint`, `typecheck`, `test`, and `build`.
