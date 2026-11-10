import { createEngine } from "@/domains/evaluation/helpers/engine";

import type { EvaluationScope } from "./evaluator.types";

/**
 * Answers each sketch that reaches a worker with its evaluation, from one engine for the life of the worker, so that a sketch that keeps the config text of the last one does not read it again. The reply leaves out the sketch, which the evaluator already has.
 * @param scope The side of the worker: `self` in the script of the worker.
 */
export function serveEvaluations(scope: EvaluationScope): void {
  const engine = createEngine();

  scope.onmessage = ({ data }) => {
    const { sketch: _sketch, ...evaluation } = engine.evaluate(data);

    scope.postMessage(evaluation);
  };
}
