import { useState, useEffect, useCallback, useRef } from 'react';

interface UseQuestTimerOptions {
  /** Total time in seconds */
  totalSeconds: number;
  /** Called when timer reaches zero */
  onTimeUp: () => void;
  /** Whether the timer should be running */
  active: boolean;
}

export function useQuestTimer({ totalSeconds, onTimeUp, active }: UseQuestTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (!active || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [active, remainingSeconds]);

  const reset = useCallback(() => {
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const percentRemaining = (remainingSeconds / totalSeconds) * 100;

  return {
    remainingSeconds,
    formattedTime,
    percentRemaining,
    isExpired: remainingSeconds <= 0,
    isUrgent: remainingSeconds <= 30,
    reset,
  };
}
