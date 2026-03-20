import React from 'react';
import { useSecurityQuest } from '../hooks/useSecurityQuest';
import { IntroScreen } from './IntroScreen';
import { QuestShell } from './QuestShell';
import { SummaryScreen } from './SummaryScreen';
import { ProgressRail } from './ProgressRail';
import { ScorePanel } from './ScorePanel';
import { BadgeTray } from './BadgeTray';

interface SecurityQuestAppProps {
  /** Called when training starts (first interaction) */
  onTrainingStart?: () => void;
  /** Called with updated onboarding status when training is marked complete */
  onTrainingComplete?: () => Promise<void>;
}

export function SecurityQuestApp({
  onTrainingStart,
  onTrainingComplete,
}: SecurityQuestAppProps) {
  const quest = useSecurityQuest();
  const { state, startQuest, resetQuest } = quest;

  const handleStart = async () => {
    startQuest();
    try {
      await onTrainingStart?.();
    } catch {
      // non-fatal
    }
  };

  const handleComplete = async () => {
    try {
      await onTrainingComplete?.();
    } catch {
      // non-fatal, completion state is already tracked locally
    }
  };

  const handleRetake = () => {
    resetQuest();
  };

  // ── Intro phase ─────────────────────────────────────────────────────────
  if (state.phase === 'intro') {
    return (
      <div className="security-quest">
        <IntroScreen onStart={handleStart} hasProgress={!!state.startedAt} />
      </div>
    );
  }

  // ── Summary phase ───────────────────────────────────────────────────────
  if (state.phase === 'summary') {
    return (
      <div className="security-quest">
        <SummaryScreen
          state={state}
          onComplete={handleComplete}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  // ── Active training (module / final-challenge) ──────────────────────────
  return (
    <div className="security-quest space-y-4">
      {/* Top bar with progress, score, badges */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProgressRail
          moduleProgress={state.moduleProgress}
          currentModuleId={state.currentModuleId}
        />
        <div className="flex items-center gap-3 flex-shrink-0">
          <BadgeTray earnedBadgeIds={state.badges} compact />
          <ScorePanel score={state.score} streak={state.streak} />
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-2xl">
        <QuestShell quest={quest} />
      </div>
    </div>
  );
}
