import { riskEngineContracts } from './contracts';

type HandlerName =
  | 'getSnapshot'
  | 'listSignals'
  | 'listTestResults'
  | 'listEvidence'
  | 'listGeneratedRisks'
  | 'listProviderStatuses'
  | 'listScanRuns'
  | 'listEvents'
  | 'runEvaluation'
  | 'updateStakeholders';

export interface EndpointRouteDefinition {
  method: 'GET' | 'POST' | 'PATCH';
  url: string;
  handlerName: HandlerName;
  schema: {
    body?: unknown;
    response: unknown;
  };
}

export const riskEngineRoutes: EndpointRouteDefinition[] = [
  {
    method: 'GET',
    url: riskEngineContracts.getSnapshot.path,
    handlerName: 'getSnapshot',
    schema: { response: riskEngineContracts.getSnapshot.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listSignals.path,
    handlerName: 'listSignals',
    schema: { response: riskEngineContracts.listSignals.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listTestResults.path,
    handlerName: 'listTestResults',
    schema: { response: riskEngineContracts.listTestResults.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listEvidence.path,
    handlerName: 'listEvidence',
    schema: { response: riskEngineContracts.listEvidence.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listGeneratedRisks.path,
    handlerName: 'listGeneratedRisks',
    schema: { response: riskEngineContracts.listGeneratedRisks.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listProviderStatuses.path,
    handlerName: 'listProviderStatuses',
    schema: { response: riskEngineContracts.listProviderStatuses.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listScanRuns.path,
    handlerName: 'listScanRuns',
    schema: { response: riskEngineContracts.listScanRuns.response },
  },
  {
    method: 'GET',
    url: riskEngineContracts.listEvents.path,
    handlerName: 'listEvents',
    schema: { response: riskEngineContracts.listEvents.response },
  },
  {
    method: 'POST',
    url: riskEngineContracts.runEvaluation.path,
    handlerName: 'runEvaluation',
    schema: {
      body: riskEngineContracts.runEvaluation.body,
      response: riskEngineContracts.runEvaluation.response,
    },
  },
  {
    method: 'PATCH',
    url: riskEngineContracts.updateStakeholders.path,
    handlerName: 'updateStakeholders',
    schema: {
      body: riskEngineContracts.updateStakeholders.body,
      response: riskEngineContracts.updateStakeholders.response,
    },
  },
];
