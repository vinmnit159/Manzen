import type {
  FeedbackData,
  QuestPhase,
  QuestState,
  UserAnswer,
} from './types';
import { computeRating, computeStreakBonus } from './scoring';

// ── Actions ───────────────────────────────────────────────────────────────────

export type QuestAction =
  | { type: 'START_QUEST'; startedAt: string }
  | { type: 'SET_PHASE'; phase: QuestPhase }
  | { type: 'ENTER_MODULE'; moduleId: string }
  | { type: 'NEXT_INTERACTION' }
  | { type: 'RECORD_ANSWER'; answer: UserAnswer; feedback: FeedbackData }
  | { type: 'DISMISS_FEEDBACK' }
  | { type: 'COMPLETE_MODULE'; moduleId: string; badgeIds: string[] }
  | { type: 'UPDATE_INTERACTION_STATE'; interactionId: string; data: unknown }
  | { type: 'TICK_TIME'; deltaMs: number }
  | { type: 'COMPLETE_QUEST'; completedAt: string }
  | { type: 'RESET_QUEST' }
  | { type: 'RESTORE_STATE'; state: QuestState };

// ── Initial State ─────────────────────────────────────────────────────────────

export function createInitialState(moduleIds: string[]): QuestState {
  const moduleProgress: Record<string, string> = {};
  moduleIds.forEach((id, i) => {
    moduleProgress[id] = i === 0 ? 'available' : 'locked';
  });

  return {
    phase: 'intro',
    startedAt: null,
    completedAt: null,
    currentModuleId: null,
    currentInteractionIndex: 0,
    moduleProgress: moduleProgress as QuestState['moduleProgress'],
    answers: {},
    score: 0,
    maxPossibleScore: 0,
    streak: 0,
    bestStreak: 0,
    moduleScores: {},
    moduleMaxScores: {},
    badges: [],
    mistakesByTopic: {},
    correctByTopic: {},
    timeSpentMs: 0,
    finalRating: null,
    completionReady: false,
    interactionState: {},
    feedbackShown: false,
    feedbackData: null,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export function questReducer(state: QuestState, action: QuestAction): QuestState {
  switch (action.type) {
    case 'START_QUEST':
      return {
        ...state,
        phase: 'module',
        startedAt: action.startedAt,
        currentModuleId: Object.keys(state.moduleProgress).find(
          id => state.moduleProgress[id] === 'available',
        ) ?? null,
        currentInteractionIndex: 0,
      };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'ENTER_MODULE': {
      const newProgress = { ...state.moduleProgress };
      newProgress[action.moduleId] = 'active';
      return {
        ...state,
        phase: action.moduleId === 'final-challenge' ? 'final-challenge' : 'module',
        currentModuleId: action.moduleId,
        currentInteractionIndex: 0,
        moduleProgress: newProgress,
        feedbackShown: false,
        feedbackData: null,
      };
    }

    case 'NEXT_INTERACTION':
      return {
        ...state,
        currentInteractionIndex: state.currentInteractionIndex + 1,
        feedbackShown: false,
        feedbackData: null,
      };

    case 'RECORD_ANSWER': {
      const { answer, feedback } = action;
      const newStreak = answer.wasCorrect ? state.streak + 1 : 0;
      const streakBonus = answer.wasCorrect ? computeStreakBonus(newStreak) : 0;
      const reportBonus = feedback.reportBonus ? 50 : 0;
      const totalScoreChange = answer.scoreEarned + streakBonus + reportBonus;

      // Update topic tracking
      const newMistakes = { ...state.mistakesByTopic };
      const newCorrect = { ...state.correctByTopic };
      for (const topic of answer.topicTags) {
        if (answer.wasCorrect) {
          newCorrect[topic] = (newCorrect[topic] ?? 0) + 1;
        } else {
          newMistakes[topic] = (newMistakes[topic] ?? 0) + 1;
        }
      }

      // Update module scores
      const moduleId = state.currentModuleId ?? '';
      const newModuleScores = { ...state.moduleScores };
      const newModuleMaxScores = { ...state.moduleMaxScores };
      newModuleScores[moduleId] = (newModuleScores[moduleId] ?? 0) + totalScoreChange;
      newModuleMaxScores[moduleId] = (newModuleMaxScores[moduleId] ?? 0) + answer.maxPossibleScore;

      return {
        ...state,
        answers: { ...state.answers, [answer.interactionId]: answer },
        score: state.score + totalScoreChange,
        maxPossibleScore: state.maxPossibleScore + answer.maxPossibleScore,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        moduleScores: newModuleScores,
        moduleMaxScores: newModuleMaxScores,
        mistakesByTopic: newMistakes,
        correctByTopic: newCorrect,
        feedbackShown: true,
        feedbackData: {
          ...feedback,
          scoreChange: totalScoreChange,
        },
      };
    }

    case 'DISMISS_FEEDBACK':
      return {
        ...state,
        feedbackShown: false,
        feedbackData: null,
      };

    case 'COMPLETE_MODULE': {
      const newProgress = { ...state.moduleProgress };
      newProgress[action.moduleId] = 'complete';

      // Unlock next module
      const moduleIds = Object.keys(newProgress);
      const currentIdx = moduleIds.indexOf(action.moduleId);
      if (currentIdx >= 0 && currentIdx < moduleIds.length - 1) {
        const nextId = moduleIds[currentIdx + 1];
        if (newProgress[nextId] === 'locked') {
          newProgress[nextId] = 'available';
        }
      }

      return {
        ...state,
        moduleProgress: newProgress,
        badges: [...new Set([...state.badges, ...action.badgeIds])],
        currentModuleId: null,
        currentInteractionIndex: 0,
        feedbackShown: false,
        feedbackData: null,
      };
    }

    case 'UPDATE_INTERACTION_STATE':
      return {
        ...state,
        interactionState: {
          ...state.interactionState,
          [action.interactionId]: action.data,
        },
      };

    case 'TICK_TIME':
      return {
        ...state,
        timeSpentMs: state.timeSpentMs + action.deltaMs,
      };

    case 'COMPLETE_QUEST': {
      const rating = computeRating(state.score, state.maxPossibleScore);
      return {
        ...state,
        phase: 'summary',
        completedAt: action.completedAt,
        finalRating: rating,
        completionReady: true,
      };
    }

    case 'RESET_QUEST':
      return createInitialState(Object.keys(state.moduleProgress));

    case 'RESTORE_STATE':
      return action.state;

    default:
      return state;
  }
}
