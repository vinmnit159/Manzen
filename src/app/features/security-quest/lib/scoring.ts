import type { FinalRating, QuestState, TrainingAttemptPayload } from './types';

// ── Score Constants ───────────────────────────────────────────────────────────

export const SCORE_CORRECT = 100;
export const SCORE_BEST_PRACTICE = 150;
export const SCORE_REPORT_BONUS = 50;
export const SCORE_WRONG = 0;
export const SCORE_HIGH_RISK = -50;
export const STREAK_BONUS = 25;
export const STREAK_THRESHOLD = 3;

// ── Percentage-Based Ratings ──────────────────────────────────────────────────

export function computeRating(score: number, maxPossible: number): FinalRating {
  if (maxPossible <= 0) return 'Retake Recommended';
  const pct = (score / maxPossible) * 100;
  if (pct >= 90) return 'Security Champion';
  if (pct >= 70) return 'Strong Defender';
  if (pct >= 50) return 'Needs Reinforcement';
  return 'Retake Recommended';
}

export function computePercentage(score: number, maxPossible: number): number {
  if (maxPossible <= 0) return 0;
  return Math.round((score / maxPossible) * 100);
}

export function isRetakeRecommended(score: number, maxPossible: number): boolean {
  return computePercentage(score, maxPossible) < 50;
}

// ── Streak Logic ──────────────────────────────────────────────────────────────

export function computeStreakBonus(currentStreak: number): number {
  if (currentStreak > 0 && currentStreak % STREAK_THRESHOLD === 0) {
    return STREAK_BONUS;
  }
  return 0;
}

// ── Summary Generation ────────────────────────────────────────────────────────

export interface TopicSummary {
  topic: string;
  correct: number;
  incorrect: number;
  isStrength: boolean;
}

export function computeTopicSummaries(
  correctByTopic: Record<string, number>,
  mistakesByTopic: Record<string, number>,
): TopicSummary[] {
  const allTopics = new Set([
    ...Object.keys(correctByTopic),
    ...Object.keys(mistakesByTopic),
  ]);

  return Array.from(allTopics).map(topic => {
    const correct = correctByTopic[topic] ?? 0;
    const incorrect = mistakesByTopic[topic] ?? 0;
    const total = correct + incorrect;
    return {
      topic,
      correct,
      incorrect,
      isStrength: total > 0 ? correct / total >= 0.7 : true,
    };
  });
}

export const TOPIC_LABELS: Record<string, string> = {
  'security-role': 'Security Awareness',
  'password-strength': 'Password Strength',
  'password-reuse': 'Password Reuse',
  'password-manager': 'Password Managers',
  'mfa-methods': 'MFA Methods',
  'credential-stuffing': 'Credential Stuffing',
  'sim-swap': 'SIM Swap Risk',
  'phishing': 'Phishing Detection',
  'social-engineering': 'Social Engineering',
  'malware': 'Malware & Ransomware',
  'suspicious-downloads': 'Safe Downloads',
  'device-locking': 'Device Locking',
  'software-updates': 'Software Updates',
  'approved-software': 'Approved Software',
  'sensitive-data': 'Sensitive Data Handling',
  'clean-desk': 'Clean Desk / Workspace',
  'remote-privacy': 'Remote Privacy',
};

export function getTopicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic;
}

// ── Key Takeaways ─────────────────────────────────────────────────────────────

export const KEY_TAKEAWAYS: Record<string, string> = {
  'security-role': 'Every employee is part of the security perimeter.',
  'password-strength': 'Use long, random, unique passphrases for each account.',
  'password-reuse': 'Never reuse passwords across personal and work accounts.',
  'password-manager': 'A password manager catches fake sites and eliminates reuse.',
  'mfa-methods': 'Prefer authenticator apps or hardware tokens over SMS.',
  'credential-stuffing': 'Unique passwords stop attackers from reusing leaked credentials.',
  'sim-swap': 'SMS-based MFA is vulnerable to SIM swap attacks.',
  'phishing': 'Pause, check the sender domain, and verify through another channel.',
  'social-engineering': 'Urgency and authority are the top manipulation tactics.',
  'malware': 'Disconnect and report immediately if you suspect malware.',
  'suspicious-downloads': 'Only install software from approved, verified sources.',
  'device-locking': 'Lock your device every time you step away.',
  'software-updates': 'Apply updates promptly from your managed update channel.',
  'approved-software': 'Follow your company approval process before installing tools.',
  'sensitive-data': 'Share sensitive info only with those who need it, via internal tools.',
  'clean-desk': 'Clear whiteboards, lock screens, and secure printouts before leaving.',
  'remote-privacy': 'Use privacy screens, headphones, and avoid speakerphone in public.',
};

export function getTakeawaysForMistakes(mistakesByTopic: Record<string, number>): string[] {
  return Object.keys(mistakesByTopic)
    .filter(topic => (mistakesByTopic[topic] ?? 0) > 0)
    .map(topic => KEY_TAKEAWAYS[topic])
    .filter((t): t is string => t !== undefined);
}

// ── Attempt Payload Builder ───────────────────────────────────────────────────

export function buildAttemptPayload(state: QuestState): TrainingAttemptPayload {
  const percentage = computePercentage(state.score, state.maxPossibleScore);
  const rating = computeRating(state.score, state.maxPossibleScore);
  return {
    totalScore: state.score,
    maxPossibleScore: state.maxPossibleScore,
    percentage,
    moduleScores: { ...state.moduleScores },
    moduleMaxScores: { ...state.moduleMaxScores },
    selectedAnswers: Object.fromEntries(
      Object.entries(state.answers).map(([k, v]) => [k, v.selectedOptionIds]),
    ),
    incorrectAnswersByTopic: { ...state.mistakesByTopic },
    correctAnswersByTopic: { ...state.correctByTopic },
    badgeUnlocks: [...state.badges],
    finalRating: rating,
    retakeRecommended: isRetakeRecommended(state.score, state.maxPossibleScore),
    timeSpentMs: state.timeSpentMs,
    version: '1.0.0',
  };
}
