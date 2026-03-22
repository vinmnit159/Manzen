/**
 * Manzen Design System — Theme Exports
 *
 * Central barrel for all design tokens, semantic colors, and style constants.
 * Import from '@/app/theme' in any component or page.
 *
 * Usage:
 *   import { semantic, getStatusColors, TEXT, ICON, CARD, SPACING } from '@/app/theme';
 */

export {
  semantic,
  getStatusTier,
  getStatusColors,
  getSeverityColors,
  getCategoryColor,
  categoryColors,
  type SemanticColor,
  type SemanticTier,
} from './semantic-colors';

export { TEXT } from './typography';
export { ICON } from './icon-sizes';
export { CARD } from './card-tiers';
export { SPACING } from './spacing';
