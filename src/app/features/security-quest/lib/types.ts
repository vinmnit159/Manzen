// ── Core Types for Security Quest ─────────────────────────────────────────────

// ── Interaction Types ─────────────────────────────────────────────────────────

export type InteractionType =
  | 'multiple-choice'
  | 'sort'
  | 'hotspot-scene'
  | 'inbox'
  | 'branching-scenario'
  | 'timed-decision'
  | 'info-card';

// ── Answer Option ─────────────────────────────────────────────────────────────

export interface AnswerOption {
  id: string;
  label: string;
  /** Optional longer description shown on the card */
  description?: string;
  /** Points awarded: +100 correct, +150 best-practice, 0 wrong, -50 high-risk */
  scoreImpact: number;
  /** Whether this is the correct or best-practice answer */
  isCorrect: boolean;
  /** Best-practice answers get highlighted differently in feedback */
  isBestPractice?: boolean;
  /** Bonus for choosing to report a suspicious event */
  reportBonus?: boolean;
  /** Topic tags for analytics: e.g. 'phishing', 'password-reuse' */
  topicTags: string[];
  /** Feedback shown after selection */
  feedbackTitle: string;
  feedbackExplanation: string;
  /** One-line takeaway for summary screen */
  takeaway?: string;
}

// ── Interaction Configs ───────────────────────────────────────────────────────

export interface MultipleChoiceConfig {
  type: 'multiple-choice';
  id: string;
  question: string;
  /** Optional context paragraph shown above options */
  context?: string;
  mascotHint?: string;
  options: AnswerOption[];
}

export interface SortConfig {
  type: 'sort';
  id: string;
  question: string;
  context?: string;
  mascotHint?: string;
  /** Items the user needs to rank/sort */
  items: SortItem[];
  /** The correct order of item IDs from best to worst (or category assignment) */
  correctOrder: string[];
  /** Feedback for correct vs incorrect ordering */
  feedbackCorrect: string;
  feedbackIncorrect: string;
  /** Points for perfect sort */
  perfectScore: number;
  /** Points for partial correctness */
  partialScore: number;
  topicTags: string[];
}

export interface SortItem {
  id: string;
  label: string;
  description?: string;
}

export interface HotspotZone {
  id: string;
  label: string;
  /** CSS percentage positions for the clickable zone */
  x: number; // % from left
  y: number; // % from top
  width: number; // % width
  height: number; // % height
  isRisk: boolean;
  feedbackTitle: string;
  feedbackExplanation: string;
  scoreImpact: number;
  topicTags: string[];
}

export interface HotspotSceneConfig {
  type: 'hotspot-scene';
  id: string;
  question: string;
  context?: string;
  mascotHint?: string;
  /** Description of the scene for screen readers */
  sceneAltText: string;
  /** CSS background or description of what the scene depicts */
  sceneDescription: string;
  zones: HotspotZone[];
  /** How many risks must be found to complete */
  requiredFinds: number;
  topicTags: string[];
}

export interface InboxMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  /** Full body shown when expanded */
  body?: string;
  timestamp: string;
  /** Whether this message is actually phishing/suspicious */
  isSuspicious: boolean;
  /** Red flags for feedback */
  redFlags: string[];
  topicTags: string[];
}

export interface InboxConfig {
  type: 'inbox';
  id: string;
  question: string;
  context?: string;
  mascotHint?: string;
  messages: InboxMessage[];
  /** Points for correctly marking suspicious */
  correctMarkScore: number;
  /** Points for correctly marking safe */
  correctSafeScore: number;
  /** Bonus for reporting */
  reportBonusScore: number;
  /** Penalty for opening suspicious */
  wrongOpenPenalty: number;
}

export interface BranchingChoice {
  id: string;
  label: string;
  description?: string;
  scoreImpact: number;
  isCorrect: boolean;
  isBestPractice?: boolean;
  reportBonus?: boolean;
  feedbackTitle: string;
  feedbackExplanation: string;
  /** If set, leads to a follow-up step */
  nextStepId?: string;
  topicTags: string[];
  /** Optional key takeaway message shown after selecting this choice */
  takeaway?: string;
}

export interface BranchingStep {
  id: string;
  narrative: string;
  mascotComment?: string;
  choices: BranchingChoice[];
}

export interface BranchingScenarioConfig {
  type: 'branching-scenario';
  id: string;
  title: string;
  context?: string;
  mascotHint?: string;
  steps: BranchingStep[];
  startStepId: string;
  topicTags: string[];
}

export interface TimedDecisionItem {
  id: string;
  scenario: string;
  context?: string;
  options: AnswerOption[];
}

export interface TimedDecisionConfig {
  type: 'timed-decision';
  id: string;
  title: string;
  context?: string;
  mascotHint?: string;
  /** Time limit in seconds */
  timeLimitSeconds: number;
  items: TimedDecisionItem[];
  topicTags: string[];
}

export interface InfoCardConfig {
  type: 'info-card';
  id: string;
  title: string;
  body: string;
  mascotComment?: string;
  /** Optional bullet points */
  bullets?: string[];
  /** Optional icon key */
  icon?: string;
}

export type InteractionConfig =
  | MultipleChoiceConfig
  | SortConfig
  | HotspotSceneConfig
  | InboxConfig
  | BranchingScenarioConfig
  | TimedDecisionConfig
  | InfoCardConfig;

// ── Module ────────────────────────────────────────────────────────────────────

export interface TrainingModule {
  id: string;
  title: string;
  shortTitle: string;
  objective: string;
  mascotIntro: string;
  mascotOutro: string;
  badgeIds: string[];
  interactions: InteractionConfig[];
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  /** Lucide icon name or SVG identifier */
  icon: string;
  moduleId: string;
}

// ── User Answer ───────────────────────────────────────────────────────────────

export interface UserAnswer {
  interactionId: string;
  selectedOptionIds: string[];
  scoreEarned: number;
  maxPossibleScore: number;
  wasCorrect: boolean;
  wasBestPractice: boolean;
  topicTags: string[];
  timestamp: number;
}

// ── Quest State ───────────────────────────────────────────────────────────────

export type FinalRating =
  | 'Security Champion'
  | 'Strong Defender'
  | 'Needs Reinforcement'
  | 'Retake Recommended';

export type ModuleStatus = 'locked' | 'available' | 'active' | 'complete';

export type QuestPhase = 'intro' | 'module' | 'final-challenge' | 'summary';

export interface QuestState {
  phase: QuestPhase;
  startedAt: string | null;
  completedAt: string | null;
  currentModuleId: string | null;
  currentInteractionIndex: number;
  moduleProgress: Record<string, ModuleStatus>;
  answers: Record<string, UserAnswer>;
  score: number;
  maxPossibleScore: number;
  streak: number;
  bestStreak: number;
  moduleScores: Record<string, number>;
  moduleMaxScores: Record<string, number>;
  badges: string[];
  mistakesByTopic: Record<string, number>;
  correctByTopic: Record<string, number>;
  timeSpentMs: number;
  finalRating: FinalRating | null;
  completionReady: boolean;
  /** Tracks which hotspot zones / inbox messages have been acted on */
  interactionState: Record<string, unknown>;
  /** Whether the user has seen feedback for current interaction */
  feedbackShown: boolean;
  feedbackData: FeedbackData | null;
}

export interface FeedbackData {
  type: 'correct' | 'incorrect' | 'best-practice' | 'info';
  title: string;
  explanation: string;
  takeaway?: string;
  scoreChange: number;
  reportBonus?: boolean;
}

// ── Analytics Payload ─────────────────────────────────────────────────────────

export interface TrainingAttemptPayload {
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  moduleScores: Record<string, number>;
  moduleMaxScores: Record<string, number>;
  selectedAnswers: Record<string, unknown>;
  incorrectAnswersByTopic: Record<string, number>;
  correctAnswersByTopic: Record<string, number>;
  badgeUnlocks: string[];
  finalRating: FinalRating;
  retakeRecommended: boolean;
  timeSpentMs: number;
  version: string;
}
