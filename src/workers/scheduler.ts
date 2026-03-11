import { getDigestQueue } from '@/server/queue/client';

export async function startScheduler() {
  const digestQueue = getDigestQueue();

  await digestQueue.add('hourly-digest', { period: 'hourly' }, { repeat: { pattern: '0 * * * *' }, jobId: 'hourly-digest' });
  await digestQueue.add('daily-digest', { period: 'daily' }, { repeat: { pattern: '0 8 * * *' }, jobId: 'daily-digest' });
  await digestQueue.add('weekly-digest', { period: 'weekly' }, { repeat: { pattern: '0 8 * * 1' }, jobId: 'weekly-digest' });
  await digestQueue.add('risk-overdue-reminder', { period: 'daily' }, { repeat: { pattern: '0 9 * * *' }, jobId: 'risk-overdue-reminder' });
  await digestQueue.add('audit-reminder', { period: 'daily' }, { repeat: { pattern: '0 9 * * *' }, jobId: 'audit-reminder' });
  await digestQueue.add('access-review-reminder', { period: 'weekly' }, { repeat: { pattern: '0 8 * * 1' }, jobId: 'access-review-reminder' });
  await digestQueue.add('coverage-refresh', { period: 'daily' }, { repeat: { every: 15 * 60 * 1000 }, jobId: 'coverage-refresh' });
}
