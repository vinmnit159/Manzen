import { frameworkContracts } from './contracts';
import type { FrameworkHandlers } from './handlers';

export interface FrameworkRouteDefinition {
  method: 'GET' | 'POST' | 'PATCH';
  url: string;
  handlerName: keyof FrameworkHandlers;
  schema: {
    body?: unknown;
    response: unknown;
  };
}

export const frameworkRoutes: FrameworkRouteDefinition[] = [
  {
    method: 'GET',
    url: frameworkContracts.listCatalog.path,
    handlerName: 'listCatalog',
    schema: { response: frameworkContracts.listCatalog.response },
  },
  {
    method: 'GET',
    url: frameworkContracts.getFramework.path,
    handlerName: 'getFramework',
    schema: { response: frameworkContracts.getFramework.response },
  },
  {
    method: 'GET',
    url: frameworkContracts.listRequirements.path,
    handlerName: 'listRequirements',
    schema: { response: frameworkContracts.listRequirements.response },
  },
  {
    method: 'GET',
    url: frameworkContracts.listOrgFrameworks.path,
    handlerName: 'listOrgFrameworks',
    schema: { response: frameworkContracts.listOrgFrameworks.response },
  },
  {
    method: 'POST',
    url: frameworkContracts.activateFramework.path,
    handlerName: 'activateFramework',
    schema: {
      body: frameworkContracts.activateFramework.body,
      response: frameworkContracts.activateFramework.response,
    },
  },
  {
    method: 'PATCH',
    url: frameworkContracts.removeFramework.path,
    handlerName: 'removeFramework',
    schema: {
      body: frameworkContracts.removeFramework.body,
      response: frameworkContracts.removeFramework.response,
    },
  },
  {
    method: 'GET',
    url: frameworkContracts.checkEntitlement.path,
    handlerName: 'checkEntitlement',
    schema: { response: frameworkContracts.checkEntitlement.response },
  },
  // Phase 3 — requirement status
  {
    method: 'GET',
    url: frameworkContracts.listOrgRequirements.path,
    handlerName: 'listOrgRequirements',
    schema: { response: frameworkContracts.listOrgRequirements.response },
  },
  // Phase 4 — coverage
  {
    method: 'GET',
    url: frameworkContracts.getCoverage.path,
    handlerName: 'getCoverage',
    schema: { response: frameworkContracts.getCoverage.response },
  },
  // Phase 4 — owner assignment
  {
    method: 'PATCH',
    url: frameworkContracts.updateRequirementOwner.path,
    handlerName: 'updateRequirementOwner',
    schema: {
      body: frameworkContracts.updateRequirementOwner.body,
      response: frameworkContracts.updateRequirementOwner.response,
    },
  },
  // Phase 4 — applicability
  {
    method: 'PATCH',
    url: frameworkContracts.updateApplicability.path,
    handlerName: 'updateApplicability',
    schema: {
      body: frameworkContracts.updateApplicability.body,
      response: frameworkContracts.updateApplicability.response,
    },
  },
  // Phase 5 — billing entitlement sync
  {
    method: 'POST',
    url: frameworkContracts.syncEntitlement.path,
    handlerName: 'syncEntitlement',
    schema: {
      body: frameworkContracts.syncEntitlement.body,
      response: frameworkContracts.syncEntitlement.response,
    },
  },
  // Phase 5 — list org entitlements
  {
    method: 'GET',
    url: frameworkContracts.listEntitlements.path,
    handlerName: 'listEntitlements',
    schema: { response: frameworkContracts.listEntitlements.response },
  },
  // Phase 4 — readiness summary (must be before :frameworkSlug routes to avoid param collision)
  {
    method: 'GET',
    url: frameworkContracts.getReadinessSummary.path,
    handlerName: 'getReadinessSummary',
    schema: { response: frameworkContracts.getReadinessSummary.response },
  },
  // Phase 4 — coverage history
  {
    method: 'GET',
    url: frameworkContracts.getCoverageHistory.path,
    handlerName: 'getCoverageHistory',
    schema: { response: frameworkContracts.getCoverageHistory.response },
  },
  // Phase 3 — get all mappings for a framework
  {
    method: 'GET',
    url: frameworkContracts.getFrameworkMappings.path,
    handlerName: 'getFrameworkMappings',
    schema: { response: frameworkContracts.getFrameworkMappings.response },
  },
  // Phase 3 — confirm a suggested mapping
  {
    method: 'POST',
    url: frameworkContracts.confirmMapping.path,
    handlerName: 'confirmMapping',
    schema: {
      body: frameworkContracts.confirmMapping.body,
      response: frameworkContracts.confirmMapping.response,
    },
  },
];
