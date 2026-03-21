/**
 * engineerACards.tsx
 *
 * Re-exports from the data module. Card config data (the large ENGINEER_A_CARDS
 * array and workflow runtime config) lives in engineerACards.data.tsx; this
 * barrel keeps existing import paths working without changes.
 */
export {
  ENGINEER_A_CARDS,
  workflowRuntimeConfigForEngineerACard,
} from './engineerACards.data';
