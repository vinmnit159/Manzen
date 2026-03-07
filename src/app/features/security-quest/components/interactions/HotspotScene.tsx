import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { HotspotSceneConfig, HotspotZone, UserAnswer, FeedbackData } from '../../lib/types';
import { MascotHelper } from '../MascotHelper';

interface HotspotSceneProps {
  config: HotspotSceneConfig;
  onAnswer: (answer: UserAnswer, feedback: FeedbackData) => void;
  disabled?: boolean;
}

interface ZoneResult {
  zone: HotspotZone;
  found: boolean;
}

export function HotspotScene({ config, onAnswer, disabled }: HotspotSceneProps) {
  const [clickedZones, setClickedZones] = useState<Set<string>>(new Set());
  const [currentFeedback, setCurrentFeedback] = useState<HotspotZone | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const riskZones = config.zones.filter(z => z.isRisk);
  const risksFound = riskZones.filter(z => clickedZones.has(z.id)).length;

  const handleZoneClick = (zone: HotspotZone) => {
    if (submitted || disabled || clickedZones.has(zone.id)) return;

    setClickedZones(prev => new Set([...prev, zone.id]));
    setCurrentFeedback(zone);
  };

  const dismissZoneFeedback = () => {
    setCurrentFeedback(null);

    // Auto-submit when enough risks are found
    const newRisksFound = riskZones.filter(z => clickedZones.has(z.id)).length;
    if (newRisksFound >= config.requiredFinds && !submitted) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);

    const totalScore = riskZones
      .filter(z => clickedZones.has(z.id))
      .reduce((sum, z) => sum + z.scoreImpact, 0);
    const maxScore = riskZones.reduce((sum, z) => sum + z.scoreImpact, 0);
    const allFound = risksFound >= riskZones.length;

    const answer: UserAnswer = {
      interactionId: config.id,
      selectedOptionIds: Array.from(clickedZones),
      scoreEarned: totalScore,
      maxPossibleScore: maxScore,
      wasCorrect: risksFound >= config.requiredFinds,
      wasBestPractice: allFound,
      topicTags: config.topicTags,
      timestamp: Date.now(),
    };

    const feedback: FeedbackData = {
      type: allFound ? 'best-practice' : risksFound >= config.requiredFinds ? 'correct' : 'incorrect',
      title: allFound
        ? `All ${riskZones.length} risks found!`
        : `${risksFound}/${riskZones.length} risks found.`,
      explanation: allFound
        ? 'Excellent attention to detail. You caught every security risk in the scene.'
        : `You found ${risksFound} out of ${riskZones.length} risks. ${riskZones.filter(z => !clickedZones.has(z.id)).map(z => z.label).join(', ')} were also risks.`,
      scoreChange: totalScore,
    };

    onAnswer(answer, feedback);
  };

  return (
    <div className="space-y-4">
      {config.mascotHint && (
        <MascotHelper message={config.mascotHint} variant="info" compact />
      )}

      {config.context && (
        <p className="text-sm text-gray-600 leading-relaxed">{config.context}</p>
      )}

      <h3 className="text-base font-semibold text-gray-900">{config.question}</h3>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">Risks found: {risksFound}/{riskZones.length}</span>
        {risksFound >= config.requiredFinds && !submitted && (
          <span className="text-emerald-600 font-medium">Minimum reached</span>
        )}
      </div>

      {/* Scene container */}
      <div
        className="relative rounded-xl border-2 border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden"
        style={{ minHeight: 320 }}
        role="img"
        aria-label={config.sceneAltText}
      >
        {/* Scene description for visual context */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <p className="text-xs text-slate-500 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
            {config.sceneDescription}
          </p>
        </div>

        {/* Clickable zones */}
        {config.zones.map((zone) => {
          const isClicked = clickedZones.has(zone.id);
          return (
            <button
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              disabled={isClicked || submitted || disabled}
              aria-label={isClicked ? `${zone.label} — ${zone.isRisk ? 'Risk identified' : 'Not a risk'}` : `Inspect: ${zone.label}`}
              className={`
                absolute rounded-lg border-2 transition-all
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
                ${isClicked
                  ? zone.isRisk
                    ? 'border-red-400 bg-red-100/60'
                    : 'border-emerald-400 bg-emerald-100/60'
                  : 'border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer'}
                ${(submitted || disabled) && !isClicked ? 'opacity-50' : ''}
              `}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-1">
                {isClicked ? (
                  zone.isRisk ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                  )
                ) : (
                  <span className="text-xs text-slate-400 text-center leading-tight">{zone.label}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Zone feedback overlay */}
      {currentFeedback && (
        <div className={`rounded-xl border p-3 ${currentFeedback.isRisk ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium ${currentFeedback.isRisk ? 'text-red-800' : 'text-emerald-800'}`}>
                {currentFeedback.feedbackTitle}
              </p>
              <p className="text-xs text-gray-600 mt-1">{currentFeedback.feedbackExplanation}</p>
            </div>
            <button
              onClick={dismissZoneFeedback}
              className="flex-shrink-0 p-1 rounded hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Submit button for manual completion */}
      {!submitted && risksFound >= config.requiredFinds && !currentFeedback && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Done — Submit Findings
          </button>
        </div>
      )}

      {/* Keyboard accessible list fallback */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-600">
          Accessible list view
        </summary>
        <div className="mt-2 space-y-1.5">
          {config.zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              disabled={clickedZones.has(zone.id) || submitted || disabled}
              className={`
                w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-400
                ${clickedZones.has(zone.id)
                  ? zone.isRisk
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}
              `}
            >
              {zone.label}
              {clickedZones.has(zone.id) && (
                <span className="ml-2 font-medium">
                  {zone.isRisk ? '(Risk found)' : '(Not a risk)'}
                </span>
              )}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
