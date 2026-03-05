# Manzen Web App

React frontend for Manzen ISMS.

- Live app: `https://isms.bitcoingames1346.com`
- Backend API: `https://ismsbackend.bitcoingames1346.com`
- Backend repo: `https://github.com/vinmnit159/isms-backend`

## Current architecture

```text
React SPA (this repo)
  - Route-level auth guard
  - Role-aware navigation
  - Typed API service layer
        |
        v
API Gateway (/api/*)
  - JWT auth + RBAC
  - Queue-backed scan orchestration
  - Integration proxy endpoints
        |
        v
Worker + integration services (GitHub, AWS) + Postgres/Redis/MinIO
```

## What is implemented

- Full ISMS UI domains: dashboard, risks, controls, assets, evidence, policies, audits, findings, tests, reports, trust center, onboarding, integrations.
- Dedicated auditor workspace routes under `/auditor/*`.
- Public trust portal route: `/trust/:orgSlug`.
- API contract aligned with backend route normalization:
  - Integration endpoints now use `/api/integrations/*`.

## Tech stack

- React 18 + TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind + shadcn/ui + Radix + MUI

## Configuration

Set backend base URL in `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

Notes:

- The API client reads `VITE_API_URL` (not `VITE_API_BASE_URL`).
- If unset, client defaults to `http://localhost:3000`.

## Local development

```bash
npm install
npm run dev
```

App runs on `http://localhost:5173` by default.

## Project structure (high level)

- `src/app/routes.ts` - browser router and auth guard
- `src/app/components/` - layout, sidebar, shared UI wrappers
- `src/app/pages/` - domain pages
- `src/services/api/` - typed API client and per-domain services

## Auth model

- JWT token is stored in `localStorage` (`isms_token`).
- `requireAuth()` in router redirects to `/login` if token is missing.
- API client automatically attaches `Authorization: Bearer <token>`.

## Build and deploy

```bash
npm run build
```

Generated static assets are deployed via Railway for production.
