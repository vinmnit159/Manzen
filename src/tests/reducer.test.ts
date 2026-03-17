import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  questReducer,
  QuestAction,
} from '@/app/features/security-quest/lib/reducer';
import type { QuestState, UserAnswer, FeedbackData } from '@/app/features/security-quest/lib/types';

// ── createInitialState ────────────────────────────────────────────────────────

describe('createInitialState', () => {
  it('creates intro phase with all modules', () => {
    const state = createInitialState(['mod1', 'mod2', 'mod3']);
    expect(state.phase).toBe('intro');
    expect(state.currentModuleId).toBeNull();
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.badges).toEqual([]);
  });

  it('sets first module to available, rest to locked', () => {
    const state = createInitialState(['mod1', 'mod2', 'mod3']);
    expect(state.moduleProgress['mod1']).toBe('available');
    expect(state.moduleProgress['mod2']).toBe('locked');
    expect(state.moduleProgress['mod3']).toBe('locked');
  });

  it('handles single module', () => {
    const state = createInitialState(['only-mod']);
    expect(state.moduleProgress['only-mod']).toBe('available');
  });

  it('handles empty module list', () => {
    const state = createInitialState([]);
    expect(state.moduleProgress).toEqual({});
  });
});

// ── questReducer ──────────────────────────────────────────────────────────────

function makeState(overrides: Partial<QuestState> = {}): QuestState {
  return {
    ...createInitialState(['mod1', 'mod2']),
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<UserAnswer> = {}): UserAnswer {
  return {
    interactionId: 'q1',
    selectedOptionIds: ['opt-a'],
    scoreEarned: 100,
    maxPossibleScore: 100,
    wasCorrect: true,
    wasBestPractice: false,
    topicTags: ['phishing'],
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
  return {
    type: 'correct',
    title: 'Correct!',
    explanation: 'Great job.',
    scoreChange: 100,
    ...overrides,
  };
}

describe('questReducer', () => {
  describe('START_QUEST', () => {
    it('transitions to module phase and picks first available module', () => {
      const state = makeState();
      const next = questReducer(state, { type: 'START_QUEST', startedAt: '2026-01-01T00:00:00Z' });
      expect(next.phase).toBe('module');
      expect(next.startedAt).toBe('2026-01-01T00:00:00Z');
      expect(next.currentModuleId).toBe('mod1');
      expect(next.currentInteractionIndex).toBe(0);
    });
  });

  describe('SET_PHASE', () => {
    it('sets the phase directly', () => {
      const state = makeState();
      const next = questReducer(state, { type: 'SET_PHASE', phase: 'summary' });
      expect(next.phase).toBe('summary');
    });
  });

  describe('ENTER_MODULE', () => {
    it('sets module to active and resets interaction index', () => {
      const state = makeState({ currentInteractionIndex: 3 });
      const next = questReducer(state, { type: 'ENTER_MODULE', moduleId: 'mod1' });
      expect(next.moduleProgress['mod1']).toBe('active');
      expect(next.currentInteractionIndex).toBe(0);
      expect(next.currentModuleId).toBe('mod1');
      expect(next.feedbackShown).toBe(false);
    });

    it('sets phase to final-challenge for final-challenge module', () => {
      const state = makeState();
      const next = questReducer(state, { type: 'ENTER_MODULE', moduleId: 'final-challenge' });
      expect(next.phase).toBe('final-challenge');
    });

    it('sets phase to module for regular module', () => {
      const state = makeState({ phase: 'intro' });
      const next = questReducer(state, { type: 'ENTER_MODULE', moduleId: 'mod1' });
      expect(next.phase).toBe('module');
    });
  });

  describe('NEXT_INTERACTION', () => {
    it('increments interaction index and clears feedback', () => {
      const state = makeState({ currentInteractionIndex: 2, feedbackShown: true, feedbackData: makeFeedback() });
      const next = questReducer(state, { type: 'NEXT_INTERACTION' });
      expect(next.currentInteractionIndex).toBe(3);
      expect(next.feedbackShown).toBe(false);
      expect(next.feedbackData).toBeNull();
    });
  });

  describe('RECORD_ANSWER', () => {
    it('increases score for correct answer', () => {
      const state = makeState({ currentModuleId: 'mod1' });
      const answer = makeAnswer({ scoreEarned: 100, maxPossibleScore: 100, wasCorrect: true, topicTags: ['phishing'] });
      const feedback = makeFeedback({ reportBonus: false });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback });
      expect(next.score).toBe(100);
      expect(next.maxPossibleScore).toBe(100);
      expect(next.streak).toBe(1);
      expect(next.feedbackShown).toBe(true);
    });

    it('resets streak on wrong answer', () => {
      const state = makeState({ streak: 2, bestStreak: 2, currentModuleId: 'mod1' });
      const answer = makeAnswer({ wasCorrect: false, scoreEarned: 0, topicTags: ['phishing'] });
      const feedback = makeFeedback({ type: 'incorrect', reportBonus: false });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback });
      expect(next.streak).toBe(0);
      expect(next.bestStreak).toBe(2); // preserved
    });

    it('awards streak bonus at STREAK_THRESHOLD', () => {
      const state = makeState({ streak: 2, currentModuleId: 'mod1' });
      const answer = makeAnswer({ wasCorrect: true, scoreEarned: 100, topicTags: [] });
      const feedback = makeFeedback({ reportBonus: false });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback });
      // streak goes 2→3, triggering bonus of 25
      expect(next.score).toBe(100 + 25);
      expect(next.streak).toBe(3);
    });

    it('awards report bonus when feedback.reportBonus is true', () => {
      const state = makeState({ currentModuleId: 'mod1' });
      const answer = makeAnswer({ wasCorrect: true, scoreEarned: 100, topicTags: [] });
      const feedback = makeFeedback({ reportBonus: true });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback });
      // 100 score + 50 report bonus
      expect(next.score).toBe(150);
    });

    it('tracks correct topics', () => {
      const state = makeState({ currentModuleId: 'mod1' });
      const answer = makeAnswer({ wasCorrect: true, topicTags: ['phishing', 'malware'] });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback: makeFeedback() });
      expect(next.correctByTopic['phishing']).toBe(1);
      expect(next.correctByTopic['malware']).toBe(1);
    });

    it('tracks incorrect topics', () => {
      const state = makeState({ currentModuleId: 'mod1' });
      const answer = makeAnswer({ wasCorrect: false, scoreEarned: 0, topicTags: ['phishing'] });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback: makeFeedback({ type: 'incorrect' }) });
      expect(next.mistakesByTopic['phishing']).toBe(1);
    });

    it('accumulates module scores', () => {
      const state = makeState({ currentModuleId: 'mod1', moduleScores: { mod1: 200 } });
      const answer = makeAnswer({ scoreEarned: 100, maxPossibleScore: 100, wasCorrect: true, topicTags: [] });
      const next = questReducer(state, { type: 'RECORD_ANSWER', answer, feedback: makeFeedback() });
      expect(next.moduleScores['mod1']).toBe(300);
    });
  });

  describe('DISMISS_FEEDBACK', () => {
    it('clears feedback state', () => {
      const state = makeState({ feedbackShown: true, feedbackData: makeFeedback() });
      const next = questReducer(state, { type: 'DISMISS_FEEDBACK' });
      expect(next.feedbackShown).toBe(false);
      expect(next.feedbackData).toBeNull();
    });
  });

  describe('COMPLETE_MODULE', () => {
    it('marks module as complete and unlocks next', () => {
      const state = makeState();
      const next = questReducer(state, { type: 'COMPLETE_MODULE', moduleId: 'mod1', badgeIds: ['badge1'] });
      expect(next.moduleProgress['mod1']).toBe('complete');
      expect(next.moduleProgress['mod2']).toBe('available');
      expect(next.badges).toContain('badge1');
      expect(next.currentModuleId).toBeNull();
    });

    it('deduplicates badges', () => {
      const state = makeState({ badges: ['badge1'] });
      const next = questReducer(state, { type: 'COMPLETE_MODULE', moduleId: 'mod1', badgeIds: ['badge1', 'badge2'] });
      expect(next.badges.filter(b => b === 'badge1')).toHaveLength(1);
      expect(next.badges).toContain('badge2');
    });

    it('does not unlock next if already not locked', () => {
      const state = makeState({ moduleProgress: { mod1: 'available', mod2: 'active' } } as any);
      const next = questReducer(state, { type: 'COMPLETE_MODULE', moduleId: 'mod1', badgeIds: [] });
      expect(next.moduleProgress['mod2']).toBe('active');
    });
  });

  describe('UPDATE_INTERACTION_STATE', () => {
    it('stores arbitrary data keyed by interaction id', () => {
      const state = makeState();
      const next = questReducer(state, {
        type: 'UPDATE_INTERACTION_STATE',
        interactionId: 'hotspot-1',
        data: { found: ['zone-a'] },
      });
      expect(next.interactionState['hotspot-1']).toEqual({ found: ['zone-a'] });
    });
  });

  describe('TICK_TIME', () => {
    it('accumulates time', () => {
      const state = makeState({ timeSpentMs: 1000 });
      const next = questReducer(state, { type: 'TICK_TIME', deltaMs: 500 });
      expect(next.timeSpentMs).toBe(1500);
    });
  });

  describe('COMPLETE_QUEST', () => {
    it('transitions to summary phase and computes rating', () => {
      const state = makeState({ score: 800, maxPossibleScore: 1000 });
      const next = questReducer(state, { type: 'COMPLETE_QUEST', completedAt: '2026-01-02T00:00:00Z' });
      expect(next.phase).toBe('summary');
      expect(next.completedAt).toBe('2026-01-02T00:00:00Z');
      expect(next.completionReady).toBe(true);
      expect(next.finalRating).toBe('Strong Defender'); // 80% → Strong Defender
    });
  });

  describe('RESET_QUEST', () => {
    it('resets to initial state with same module IDs', () => {
      const state = makeState({ score: 500, streak: 5 });
      const next = questReducer(state, { type: 'RESET_QUEST' });
      expect(next.score).toBe(0);
      expect(next.streak).toBe(0);
      expect(next.phase).toBe('intro');
      expect(Object.keys(next.moduleProgress)).toEqual(['mod1', 'mod2']);
    });
  });

  describe('RESTORE_STATE', () => {
    it('replaces state with provided state', () => {
      const state = makeState();
      const restoredState = makeState({ score: 999, phase: 'summary' });
      const next = questReducer(state, { type: 'RESTORE_STATE', state: restoredState });
      expect(next.score).toBe(999);
      expect(next.phase).toBe('summary');
    });
  });

  describe('default case', () => {
    it('returns state unchanged for unknown action', () => {
      const state = makeState();
      const next = questReducer(state, { type: 'UNKNOWN' } as unknown as QuestAction);
      expect(next).toBe(state);
    });
  });
});
