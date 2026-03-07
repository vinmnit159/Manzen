import { RiskLevel } from './types';

export function riskLevelVariant(level: string): 'destructive' | 'secondary' | 'outline' {
  if (level === RiskLevel.CRITICAL || level === RiskLevel.HIGH) return 'destructive';
  if (level === RiskLevel.MEDIUM) return 'secondary';
  return 'outline';
}

export function riskStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'OPEN' || status === 'BLOCKED') return 'destructive';
  if (status === 'IN_PROGRESS' || status === 'READY_FOR_VERIFICATION') return 'secondary';
  if (status === 'VERIFIED' || status === 'MITIGATED' || status === 'CLOSED') return 'default';
  return 'outline';
}

export function trendLabel(trend: 'up' | 'flat' | 'down') {
  if (trend === 'up') return 'Escalating';
  if (trend === 'down') return 'Improving';
  return 'Stable';
}
