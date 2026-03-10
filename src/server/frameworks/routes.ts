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
];
