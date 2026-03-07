import type {
  ControlTestDefinition,
  EvidenceSnapshotRecord,
  IntegrationJobExecutionRecord,
  NormalizedSignal,
  ProviderSyncStatusRecord,
  RiskEngineEventRecord,
  RiskEngineRecord,
  RiskRuleRecord,
  ScanRunRecord,
  SignalIngestionRecord,
  TestResultRecord,
} from './types';

export interface RiskEngineRepository {
  listSignals(): Promise<NormalizedSignal[]>;
  listTests(): Promise<ControlTestDefinition[]>;
  listRules(): Promise<RiskRuleRecord[]>;
  listEvidence(): Promise<EvidenceSnapshotRecord[]>;
  listIntegrationExecutions(): Promise<IntegrationJobExecutionRecord[]>;
  saveIntegrationExecutions(executions: IntegrationJobExecutionRecord[]): Promise<void>;
  listSignalIngestions(): Promise<SignalIngestionRecord[]>;
  saveSignalIngestions(records: SignalIngestionRecord[]): Promise<void>;
  listProviderStatuses(): Promise<ProviderSyncStatusRecord[]>;
  saveProviderStatuses(statuses: ProviderSyncStatusRecord[]): Promise<void>;
  listScanRuns(): Promise<ScanRunRecord[]>;
  listEvents(): Promise<RiskEngineEventRecord[]>;
  listTestResults(): Promise<TestResultRecord[]>;
  saveTestResults(results: TestResultRecord[]): Promise<void>;
  listRisks(): Promise<RiskEngineRecord[]>;
  saveRisks(risks: RiskEngineRecord[]): Promise<void>;
  saveScanRun(run: ScanRunRecord): Promise<void>;
  appendEvents(events: RiskEngineEventRecord[]): Promise<void>;
}

export class InMemoryRiskEngineRepository implements RiskEngineRepository {
  constructor(
    private readonly state: {
      signals: NormalizedSignal[];
      tests: ControlTestDefinition[];
      rules: RiskRuleRecord[];
      evidence: EvidenceSnapshotRecord[];
      integrationExecutions: IntegrationJobExecutionRecord[];
      signalIngestions: SignalIngestionRecord[];
      providerStatuses: ProviderSyncStatusRecord[];
      scanRuns: ScanRunRecord[];
      events: RiskEngineEventRecord[];
      testResults: TestResultRecord[];
      risks: RiskEngineRecord[];
    },
  ) {}

  async listSignals() { return [...this.state.signals]; }
  async listTests() { return [...this.state.tests]; }
  async listRules() { return [...this.state.rules]; }
  async listEvidence() { return [...this.state.evidence]; }
  async listIntegrationExecutions() { return [...this.state.integrationExecutions]; }
  async saveIntegrationExecutions(executions: IntegrationJobExecutionRecord[]) { this.state.integrationExecutions = [...executions, ...this.state.integrationExecutions.filter((item) => !executions.some((entry) => entry.id === item.id))]; }
  async listSignalIngestions() { return [...this.state.signalIngestions]; }
  async saveSignalIngestions(records: SignalIngestionRecord[]) { this.state.signalIngestions = [...records, ...this.state.signalIngestions.filter((item) => !records.some((entry) => entry.id === item.id))]; }
  async listProviderStatuses() { return [...this.state.providerStatuses]; }
  async saveProviderStatuses(statuses: ProviderSyncStatusRecord[]) { this.state.providerStatuses = [...statuses]; }
  async listScanRuns() { return [...this.state.scanRuns]; }
  async listEvents() { return [...this.state.events]; }
  async listTestResults() { return [...this.state.testResults]; }
  async saveTestResults(results: TestResultRecord[]) { this.state.testResults = [...results]; }
  async listRisks() { return [...this.state.risks]; }
  async saveRisks(risks: RiskEngineRecord[]) { this.state.risks = [...risks]; }
  async saveScanRun(run: ScanRunRecord) { this.state.scanRuns = [run, ...this.state.scanRuns.filter((item) => item.id !== run.id)]; }
  async appendEvents(events: RiskEngineEventRecord[]) { this.state.events = [...events, ...this.state.events]; }
}
