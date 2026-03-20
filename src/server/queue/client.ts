import { Queue } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';

export const QUEUES = {
  NOTIFICATION_DELIVERY: 'notification-delivery',
  DIGEST: 'digest',
} as const;

export function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not configured');
  }

  return {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
  } satisfies ConnectionOptions;
}

export function getNotificationQueue() {
  return new Queue(QUEUES.NOTIFICATION_DELIVERY, {
    connection: getRedisConnection(),
  });
}

export function getDigestQueue() {
  return new Queue(QUEUES.DIGEST, { connection: getRedisConnection() });
}

export function getQueueJobOptions() {
  return {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  };
}
