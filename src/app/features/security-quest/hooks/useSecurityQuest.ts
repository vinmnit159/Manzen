import { useReducer, useCallback, useEffect, useRef } from 'react';
import { questReducer, createInitialState } from '../lib/reducer';
import type { QuestAction, QuestState, FeedbackData, UserAnswer } from '../lib/types';
import { MODULE_IDS, getModuleById } from '../content/modules';

const STORAGE_KEY = 'manzen-security-quest-state';
const TICK_INTERVAL = 1000;

function loadSavedState(): QuestState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuestState;
    // Don't restore completed quests
    if (parsed.completionReady) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: QuestState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — non-fatal
  }
}

export function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // non-fatal
  }
}

export function useSecurityQuest() {
  const saved = useRef(loadSavedState());

  const [state, dispatch] = useReducer(
    questReducer,
    MODULE_IDS,
    (ids) => saved.current ?? createInitialState(ids),
  );

  // Persist state on every change (except summary)
  useEffect(() => {
    if (state.phase !== 'summary') {
      saveState(state);
    }
  }, [state]);

  // Time tracking ticker
  useEffect(() => {
    if (state.phase === 'intro' || state.phase === 'summary') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIME', deltaMs: TICK_INTERVAL });
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [state.phase]);

  // ── Convenience dispatchers ──────────────────────────────────────────────

  const startQuest = useCallback(() => {
    dispatch({ type: 'START_QUEST', startedAt: new Date().toISOString() });
  }, []);

  const enterModule = useCallback((moduleId: string) => {
    dispatch({ type: 'ENTER_MODULE', moduleId });
  }, []);

  const nextInteraction = useCallback(() => {
    dispatch({ type: 'NEXT_INTERACTION' });
  }, []);

  const recordAnswer = useCallback((answer: UserAnswer, feedback: FeedbackData) => {
    dispatch({ type: 'RECORD_ANSWER', answer, feedback });
  }, []);

  const dismissFeedback = useCallback(() => {
    dispatch({ type: 'DISMISS_FEEDBACK' });
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    const mod = getModuleById(moduleId);
    dispatch({
      type: 'COMPLETE_MODULE',
      moduleId,
      badgeIds: mod?.badgeIds ?? [],
    });
  }, []);

  const updateInteractionState = useCallback((interactionId: string, data: unknown) => {
    dispatch({ type: 'UPDATE_INTERACTION_STATE', interactionId, data });
  }, []);

  const completeQuest = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUEST', completedAt: new Date().toISOString() });
    clearSavedState();
  }, []);

  const resetQuest = useCallback(() => {
    clearSavedState();
    dispatch({ type: 'RESET_QUEST' });
  }, []);

  // ── Derived values ───────────────────────────────────────────────────────

  const currentModule = state.currentModuleId
    ? getModuleById(state.currentModuleId)
    : null;

  const currentInteraction = currentModule
    ? currentModule.interactions[state.currentInteractionIndex] ?? null
    : null;

  const isLastInteraction = currentModule
    ? state.currentInteractionIndex >= currentModule.interactions.length - 1
    : false;

  const completedModuleCount = Object.values(state.moduleProgress).filter(
    s => s === 'complete',
  ).length;

  const totalModuleCount = MODULE_IDS.length;

  const progressPercent = Math.round((completedModuleCount / totalModuleCount) * 100);

  return {
    state,
    dispatch,
    currentModule,
    currentInteraction,
    isLastInteraction,
    completedModuleCount,
    totalModuleCount,
    progressPercent,
    // Actions
    startQuest,
    enterModule,
    nextInteraction,
    recordAnswer,
    dismissFeedback,
    completeModule,
    updateInteractionState,
    completeQuest,
    resetQuest,
  };
}

export type UseSecurityQuestReturn = ReturnType<typeof useSecurityQuest>;
