import React from 'react';
import { ArrowRight, Award } from 'lucide-react';
import type { UseSecurityQuestReturn } from '../hooks/useSecurityQuest';
import type { InteractionConfig, UserAnswer, FeedbackData } from '../lib/types';
import { FeedbackPanel } from './FeedbackPanel';
import { MascotHelper } from './MascotHelper';
import { MultipleChoiceCard } from './interactions/MultipleChoiceCard';
import { CardSortBoard } from './interactions/CardSortBoard';
import { HotspotScene } from './interactions/HotspotScene';
import { InboxSimulator } from './interactions/InboxSimulator';
import { BranchingScenario } from './interactions/BranchingScenario';
import { TimedChallenge } from './interactions/TimedChallenge';
import { InfoCard } from './interactions/InfoCard';

interface QuestShellProps {
  quest: UseSecurityQuestReturn;
}

function InteractionRenderer({
  config,
  onAnswer,
  onInfoContinue,
}: {
  config: InteractionConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  onInfoContinue: () => void;
}) {
  switch (config.type) {
    case 'multiple-choice':
      return <MultipleChoiceCard config={config} onAnswer={onAnswer} />;
    case 'sort':
      return <CardSortBoard config={config} onAnswer={onAnswer} />;
    case 'hotspot-scene':
      return <HotspotScene config={config} onAnswer={onAnswer} />;
    case 'inbox':
      return <InboxSimulator config={config} onAnswer={onAnswer} />;
    case 'branching-scenario':
      return <BranchingScenario config={config} onAnswer={onAnswer} />;
    case 'timed-decision':
      return <TimedChallenge config={config} onAnswer={onAnswer} />;
    case 'info-card':
      return <InfoCard config={config} onContinue={onInfoContinue} />;
    default:
      return <p className="text-sm text-gray-500">Unknown interaction type.</p>;
  }
}

export function QuestShell({ quest }: QuestShellProps) {
  const {
    state,
    currentModule,
    currentInteraction,
    isLastInteraction,
    recordAnswer,
    dismissFeedback,
    nextInteraction,
    completeModule,
    completeQuest,
    enterModule,
  } = quest;

  // ── Badge unlock toast ──────────────────────────────────────────────────
  const [newBadge, setNewBadge] = React.useState<string | null>(null);

  // ── Module selection screen (between modules) ───────────────────────────
  if (!currentModule) {
    // Find the next available module
    const nextModuleId = Object.entries(state.moduleProgress).find(
      ([, status]) => status === 'available',
    )?.[0];

    if (!nextModuleId) {
      // All modules complete — trigger quest completion
      return (
        <div className="max-w-xl mx-auto space-y-4 py-4">
          <MascotHelper
            message="All modules complete. Let's see your results."
            variant="success"
          />
          <div className="flex justify-center">
            <button
              onClick={() => completeQuest()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              autoFocus
            >
              View Results
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto space-y-4 py-4">
        <MascotHelper message="Ready for the next module?" variant="info" />
        <div className="flex justify-center">
          <button
            onClick={() => enterModule(nextModuleId)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            autoFocus
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Active module ───────────────────────────────────────────────────────

  const handleAnswer = (answer: UserAnswer, feedback: FeedbackData) => {
    recordAnswer(answer, feedback);
  };

  const handleInfoContinue = () => {
    if (isLastInteraction) {
      handleModuleComplete();
    } else {
      nextInteraction();
    }
  };

  const handleFeedbackContinue = () => {
    dismissFeedback();
    if (isLastInteraction) {
      handleModuleComplete();
    } else {
      nextInteraction();
    }
  };

  const handleModuleComplete = () => {
    // Show badge unlock briefly
    const badgeIds = currentModule.badgeIds;
    if (badgeIds.length > 0) {
      setNewBadge(badgeIds[0]);
      setTimeout(() => setNewBadge(null), 2000);
    }
    completeModule(currentModule.id);
  };

  return (
    <div className="space-y-5">
      {/* Module header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
            {currentModule.shortTitle}
          </p>
          <h2 className="text-lg font-bold text-gray-900">
            {currentModule.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {currentModule.objective}
          </p>
        </div>
        <div className="text-xs text-gray-400 font-mono whitespace-nowrap">
          {state.currentInteractionIndex + 1}/
          {currentModule.interactions.length}
        </div>
      </div>

      {/* Module progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{
            width: `${((state.currentInteractionIndex + (state.feedbackShown ? 1 : 0)) / currentModule.interactions.length) * 100}%`,
          }}
        />
      </div>

      {/* Module intro mascot (first interaction only) */}
      {state.currentInteractionIndex === 0 &&
        !state.feedbackShown &&
        currentModule.mascotIntro && (
          <MascotHelper message={currentModule.mascotIntro} />
        )}

      {/* Active interaction or feedback */}
      {state.feedbackShown && state.feedbackData ? (
        <FeedbackPanel
          feedback={state.feedbackData}
          onContinue={handleFeedbackContinue}
          continueLabel={isLastInteraction ? 'Complete Module' : 'Next'}
        />
      ) : currentInteraction ? (
        <InteractionRenderer
          key={currentInteraction.id}
          config={currentInteraction}
          onAnswer={handleAnswer}
          onInfoContinue={handleInfoContinue}
        />
      ) : null}

      {/* Badge unlock toast */}
      {newBadge && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-300 shadow-lg animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
          <Award className="w-6 h-6 text-amber-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Badge Unlocked!
            </p>
            <p className="text-xs text-amber-700">{newBadge}</p>
          </div>
        </div>
      )}
    </div>
  );
}
