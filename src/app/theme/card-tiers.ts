/** Card design tiers — use these instead of ad-hoc shadow/border combos */
export const CARD = {
  /** Flat — inline content, no elevation */
  flat: 'border border-border rounded-lg',
  /** Elevated — default for sections and panels */
  elevated: 'border border-border rounded-xl shadow-sm',
  /** Modal — overlays and popover cards */
  modal: 'rounded-xl shadow-lg',
} as const;
