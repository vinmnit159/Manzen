import { describe, it, expect } from 'vitest';
import {
  computeRating,
  computePercentage,
  isRetakeRecommended,
  computeStreakBonus,
  computeTopicSummaries,
  getTopicLabel,
  getTakeawaysForMistakes,
  buildAttemptPayload,
  SCORE_CORRECT,
  SCORE_BEST_PRACTICE,
  SCORE_REPORT_BONUS,
  SCORE_WRONG,
  SCORE_HIGH_RISK,
  STREAK_BONUS,
  STREAK_THRESHOLD,
  TOPIC_LABELS,
  KEY_TAKEAWAYS,
} from '@/app/features/security-quest/lib/scoring';
import type { QuestState } from '@/app/features/security-quest/lib/types';

// ── Score constants ──────────────────────────────────────────────────────────

describe('Score constants', () => {
  it('has expected constant values', () => {
    expect(SCORE_CORRECT).toBe(100);
    expect(SCORE_BEST_PRACTICE).toBe(150);
    expect(SCORE_REPORT_BONUS).toBe(50);
    expect(SCORE_WRONG).toBe(0);
    expect(SCORE_HIGH_RISK).toBe(-50);
    expect(STREAK_BONUS).toBe(25);
    expect(STREAK_THRESHOLD).toBe(3);
  });
});

// ── computeRating ─────────────────────────────────────────────────────────────

describe('computeRating', () => {
  it('returns Security Champion for >= 90%', () => {
    expect(computeRating(900, 1000)).toBe('Security Champion');
    expect(computeRating(1000, 1000)).toBe('Security Champion');
    expect(computeRating(90, 100)).toBe('Security Champion');
  });

  it('returns Strong Defender for 70–89%', () => {
    expect(computeRating(70, 100)).toBe('Strong Defender');
    expect(computeRating(89, 100)).toBe('Strong Defender');
    expect(computeRating(750, 1000)).toBe('Strong Defender');
  });

  it('returns Needs Reinforcement for 50–69%', () => {
    expect(computeRating(50, 100)).toBe('Needs Reinforcement');
    expect(computeRating(69, 100)).toBe('Needs Reinforcement');
  });

  it('returns Retake Recommended for < 50%', () => {
    expect(computeRating(0, 100)).toBe('Retake Recommended');
    expect(computeRating(49, 100)).toBe('Retake Recommended');
    expect(computeRating(1, 100)).toBe('Retake Recommended');
  });

  it('returns Retake Recommended when maxPossible is 0', () => {
    expect(computeRating(0, 0)).toBe('Retake Recommended');
    expect(computeRating(100, 0)).toBe('Retake Recommended');
  });

  it('returns Retake Recommended when maxPossible is negative', () => {
    expect(computeRating(100, -1)).toBe('Retake Recommended');
  });
});

// ── computePercentage ────────────────────────────────────────────────────────

describe('computePercentage', () => {
  it('returns 0 when maxPossible is 0', () => {
    expect(computePercentage(0, 0)).toBe(0);
    expect(computePercentage(100, 0)).toBe(0);
  });

  it('returns rounded percentage', () => {
    expect(computePercentage(1, 3)).toBe(33);
    expect(computePercentage(2, 3)).toBe(67);
    expect(computePercentage(100, 100)).toBe(100);
    expect(computePercentage(0, 100)).toBe(0);
  });

  it('returns 50 for exactly half', () => {
    expect(computePercentage(50, 100)).toBe(50);
  });
});

// ── isRetakeRecommended ──────────────────────────────────────────────────────

describe('isRetakeRecommended', () => {
  it('returns true when score < 50%', () => {
    expect(isRetakeRecommended(49, 100)).toBe(true);
    expect(isRetakeRecommended(0, 100)).toBe(true);
  });

  it('returns false when score >= 50%', () => {
    expect(isRetakeRecommended(50, 100)).toBe(false);
    expect(isRetakeRecommended(100, 100)).toBe(false);
  });

  it('returns true when maxPossible is 0', () => {
    expect(isRetakeRecommended(0, 0)).toBe(true);
  });
});

// ── computeStreakBonus ───────────────────────────────────────────────────────

describe('computeStreakBonus', () => {
  it('returns 0 for streaks not divisible by STREAK_THRESHOLD', () => {
    expect(computeStreakBonus(0)).toBe(0);
    expect(computeStreakBonus(1)).toBe(0);
    expect(computeStreakBonus(2)).toBe(0);
    expect(computeStreakBonus(4)).toBe(0);
    expect(computeStreakBonus(5)).toBe(0);
  });

  it('returns STREAK_BONUS at exact multiples of STREAK_THRESHOLD', () => {
    expect(computeStreakBonus(3)).toBe(STREAK_BONUS);
    expect(computeStreakBonus(6)).toBe(STREAK_BONUS);
    expect(computeStreakBonus(9)).toBe(STREAK_BONUS);
  });
});

// ── computeTopicSummaries ────────────────────────────────────────────────────

describe('computeTopicSummaries', () => {
  it('returns empty array for empty maps', () => {
    expect(computeTopicSummaries({}, {})).toEqual([]);
  });

  it('marks a topic as strength when correct/total >= 0.7', () => {
    const summaries = computeTopicSummaries({ phishing: 7 }, { phishing: 3 });
    const phishing = summaries.find(s => s.topic === 'phishing');
    expect(phishing?.isStrength).toBe(true);
    expect(phishing?.correct).toBe(7);
    expect(phishing?.incorrect).toBe(3);
  });

  it('marks a topic as weakness when correct/total < 0.7', () => {
    const summaries = computeTopicSummaries({ phishing: 2 }, { phishing: 8 });
    const phishing = summaries.find(s => s.topic === 'phishing');
    expect(phishing?.isStrength).toBe(false);
  });

  it('marks topic as strength when total is 0', () => {
    // A topic only in correctByTopic but with 0 incorrect
    const summaries = computeTopicSummaries({ phishing: 0 }, {});
    const phishing = summaries.find(s => s.topic === 'phishing');
    expect(phishing?.isStrength).toBe(true);
  });

  it('unions topics from both maps', () => {
    const summaries = computeTopicSummaries(
      { phishing: 2 },
      { malware: 3 },
    );
    const topics = summaries.map(s => s.topic);
    expect(topics).toContain('phishing');
    expect(topics).toContain('malware');
  });

  it('fills missing counts with 0', () => {
    const summaries = computeTopicSummaries({ phishing: 3 }, {});
    const phishing = summaries.find(s => s.topic === 'phishing');
    expect(phishing?.incorrect).toBe(0);
  });
});

// ── getTopicLabel ─────────────────────────────────────────────────────────────

describe('getTopicLabel', () => {
  it('returns mapped label for known topics', () => {
    expect(getTopicLabel('phishing')).toBe(TOPIC_LABELS['phishing']);
    expect(getTopicLabel('malware')).toBe(TOPIC_LABELS['malware']);
    expect(getTopicLabel('mfa-methods')).toBe(TOPIC_LABELS['mfa-methods']);
  });

  it('returns raw key for unknown topics', () => {
    expect(getTopicLabel('unknown-topic')).toBe('unknown-topic');
  });
});

// ── getTakeawaysForMistakes ───────────────────────────────────────────────────

describe('getTakeawaysForMistakes', () => {
  it('returns takeaways for topics with mistakes', () => {
    const result = getTakeawaysForMistakes({ phishing: 2, malware: 1 });
    expect(result).toContain(KEY_TAKEAWAYS['phishing']);
    expect(result).toContain(KEY_TAKEAWAYS['malware']);
  });

  it('excludes topics with 0 mistakes', () => {
    const result = getTakeawaysForMistakes({ phishing: 0, malware: 1 });
    expect(result).not.toContain(KEY_TAKEAWAYS['phishing']);
    expect(result).toContain(KEY_TAKEAWAYS['malware']);
  });

  it('filters out undefined takeaways for unknown topics', () => {
    const result = getTakeawaysForMistakes({ 'unknown-topic': 5 });
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no mistakes', () => {
    expect(getTakeawaysForMistakes({})).toEqual([]);
  });
});

// ── buildAttemptPayload ───────────────────────────────────────────────────────

describe('buildAttemptPayload', () => {
  const baseState: QuestState = {
    phase: 'summary',
    startedAt: '2026-01-01T00:00:00Z',
    completedAt: '2026-01-01T01:00:00Z',
    currentModuleId: null,
    currentInteractionIndex: 0,
    moduleProgress: {},
    answers: {
      q1: {
        interactionId: 'q1',
        selectedOptionIds: ['a'],
        scoreEarned: 100,
        maxPossibleScore: 100,
        wasCorrect: true,
        wasBestPractice: false,
        topicTags: ['phishing'],
        timestamp: 1000,
      },
    },
    score: 300,
    maxPossibleScore: 400,
    streak: 2,
    bestStreak: 4,
    moduleScores: { mod1: 300 },
    moduleMaxScores: { mod1: 400 },
    badges: ['badge1', 'badge2'],
    mistakesByTopic: { malware: 1 },
    correctByTopic: { phishing: 3 },
    timeSpentMs: 60000,
    finalRating: null,
    completionReady: true,
    interactionState: {},
    feedbackShown: false,
    feedbackData: null,
  };

  it('computes correct percentage from state', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.percentage).toBe(75); // 300/400 = 75%
  });

  it('computes correct final rating', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.finalRating).toBe('Strong Defender'); // 75% → Strong Defender
  });

  it('sets retakeRecommended correctly', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.retakeRecommended).toBe(false); // 75% >= 50%
  });

  it('sets retakeRecommended=true for low score', () => {
    const lowState = { ...baseState, score: 40, maxPossibleScore: 100 };
    const payload = buildAttemptPayload(lowState);
    expect(payload.retakeRecommended).toBe(true);
  });

  it('copies module scores and badges', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.moduleScores).toEqual({ mod1: 300 });
    expect(payload.badgeUnlocks).toEqual(['badge1', 'badge2']);
  });

  it('maps answers to selectedOptionIds only', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.selectedAnswers).toEqual({ q1: ['a'] });
  });

  it('copies topic data', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.incorrectAnswersByTopic).toEqual({ malware: 1 });
    expect(payload.correctAnswersByTopic).toEqual({ phishing: 3 });
  });

  it('preserves timeSpentMs', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.timeSpentMs).toBe(60000);
  });

  it('sets version to 1.0.0', () => {
    const payload = buildAttemptPayload(baseState);
    expect(payload.version).toBe('1.0.0');
  });
});
