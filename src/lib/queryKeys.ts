// ─── Typed query key factory ──────────────────────────────────────────────────
//
// Centralising keys here means:
//   • No magic strings scattered across pages
//   • Prefix-based invalidation works correctly (e.g. invalidate all 'policies'
//     queries regardless of the filter params they carry)
//
export const QK = {
  // Dashboard
  complianceStats: () => ['compliance', 'stats'] as const,
  riskOverview:    () => ['risks', 'overview']    as const,
  activityLog:     (limit?: number) => ['activity', 'recent', limit] as const,

  // Controls
  controls: (filter?: object) => ['controls', 'list', filter] as const,

  // Policies
  policies: (filter?: object) => ['policies', 'list', filter] as const,

  // Risks
  risks: () => ['risks', 'list'] as const,

  // MDM / Computers
  mdmDevices: () => ['mdm', 'devices'] as const,
  mdmTokens:  () => ['mdm', 'tokens']  as const,

  // Personnel
  users: () => ['users', 'list'] as const,

  // Onboarding
  onboardingMe:    () => ['onboarding', 'me']       as const,
  onboardingUsers: () => ['onboarding', 'users']    as const,
} as const;
