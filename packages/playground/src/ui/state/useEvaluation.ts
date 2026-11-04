import { useEffect, useState } from "react";

import type { Sketch } from "../../contract";
import { evaluate } from "../../engine";
import type { Evaluation } from "../../engine";

/** Milliseconds after the last change of the sketch before it is evaluated again, so that typing in the config does not evaluate each keystroke. */
export const EVALUATION_DELAY = 150;

/**
 * Evaluates the sketch with the engine, a moment after the last change. The first sketch is evaluated at once, so that the panes never render without an evaluation; until the next one is ready, the panes keep the previous one.
 * @param sketch The sketch to evaluate.
 * @returns The evaluation of the sketch, or of the one before it while an edit is waiting out the delay.
 */
export function useEvaluation(sketch: Sketch): Evaluation {
  const [evaluation, setEvaluation] = useState(() => evaluate(sketch));

  useEffect(() => {
    if (evaluation.sketch === sketch) {
      return undefined;
    }
    const timer = setTimeout(
      () => setEvaluation(evaluate(sketch)),
      EVALUATION_DELAY
    );
    // An edit that comes before the delay ends replaces this one; so does unmounting
    return () => clearTimeout(timer);
  }, [sketch, evaluation.sketch]);

  return evaluation;
}
