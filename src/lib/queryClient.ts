import { QueryClient } from '@tanstack/react-query';

// ─── Stale times per data category ────────────────────────────────────────────
//
// These control how long cached data is considered "fresh".
// While fresh → served instantly from cache, no background refetch.
// After stale → served from cache immediately (no loading flash) but a
// background refetch happens automatically (stale-while-revalidate).
//
export const STALE = {
  /** Dashboard KPIs and activity feed — 30 s */
  DASHBOARD: 30_000,
  /** Activity logs — 20 s (frequent writes) */
  ACTIVITY: 20_000,
  /** ISO controls list — 3 min */
  CONTROLS: 3 * 60_000,
  /** Policies list — 5 min */
  POLICIES: 5 * 60_000,
  /** Risks list and overview — 2 min */
  RISKS: 2 * 60_000,
  /** MDM devices — 1 min */
  MDM: 60_000,
  /** Users / personnel — 5 min */
  USERS: 5 * 60_000,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve stale data instantly while refreshing in background
      staleTime: STALE.DASHBOARD,
      // Keep unused cache entries for 10 min before garbage collection
      gcTime: 10 * 60_000,
      // Retry failed requests once (avoids hammering on auth errors)
      retry: 1,
      // Don't refetch just because the window regained focus in dev
      refetchOnWindowFocus: true,
    },
  },
});
