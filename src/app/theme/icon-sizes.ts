/**
 * Standardized icon size classes.
 *
 * Use these constants instead of hard-coding `w-4 h-4` etc. throughout the app.
 * This ensures consistent icon sizing and makes it easy to adjust globally.
 *
 * Usage:
 *   import { ICON } from '@/app/theme/icon-sizes';
 *   <ArrowLeft className={ICON.sm} />
 */
export const ICON = {
  /** 12px — inline with small text */
  xs: 'w-3 h-3',
  /** 16px — buttons, list items (default) */
  sm: 'w-4 h-4',
  /** 20px — section headers, nav items */
  md: 'w-5 h-5',
  /** 24px — page headers, empty states */
  lg: 'w-6 h-6',
} as const;
