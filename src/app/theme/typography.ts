/**
 * Standardized typography classes.
 *
 * Use these constants instead of repeating `text-2xl font-semibold text-foreground`
 * throughout the app. This ensures a consistent type hierarchy and makes it easy
 * to adjust globally.
 *
 * Usage:
 *   import { TEXT } from '@/app/theme/typography';
 *   <h1 className={TEXT.pageTitle}>Dashboard</h1>
 */
export const TEXT = {
  /** Page-level headings (e.g. "Risk Register", "Frameworks") */
  pageTitle: 'text-2xl font-semibold text-foreground',
  /** Section headings within a page */
  sectionTitle: 'text-lg font-semibold text-foreground',
  /** Card or panel headings */
  cardTitle: 'text-base font-medium text-foreground',
  /** Form labels, table headers */
  label: 'text-sm font-medium text-foreground',
  /** Default body text */
  body: 'text-sm text-muted-foreground',
  /** Small supporting text, timestamps */
  caption: 'text-xs text-muted-foreground',
  /** Uppercase category labels, section dividers */
  overline: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
} as const;
