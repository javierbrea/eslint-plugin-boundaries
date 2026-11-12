import type { Sketch } from "@/contract";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";

import {
  EVALUATION_TIME_LIMIT,
  LATE_AFTER,
  REPLACE_AFTER,
} from "./evaluator.constants";
import type {
  EvaluationOutcome,
  EvaluationReply,
  Evaluator,
  SpawnWorker,
  StopReason,
} from "./evaluator.types";
import { spawnWorker } from "./spawnWorker";

/** The evaluation that the worker is running. */
type Running = {
  /** The sketch it evaluates. */
  readonly sketch: Sketch;
  /** When it started, from `performance.now()`, which a change of the system clock does not move. */
  readonly startedAt: number;
  /** The timer that stops it at the time limit. */
  readonly limit: ReturnType<typeof setTimeout>;
};

/**
 * Gives back to an evaluation the objects of the sketch it was asked for, which the worker received and answered as copies, so that the evaluation of a sketch has the same objects as the sketch on screen.
 * @param sketch The sketch that was asked for.
 * @param reply The evaluation that the worker sent for it.
 * @returns The evaluation, with `sketch` and the dependency of each result taken from the sketch.
 */
function restore(sketch: Sketch, reply: EvaluationReply): Evaluation {
  return {
    ...reply,
    sketch,
    // The engine gives a result for each dependency, in the order of the sketch
    dependencies: reply.dependencies.map((result, index) => ({
      ...result,
      dependency: sketch.dependencies[index],
    })),
  };
}

/**
 * Creates an evaluator. Its worker is created with the first request, and again with the first request after it stopped one, so that creating an evaluator costs nothing until it is asked for an evaluation.
 * @param onOutcome Called with what happens to the sketches asked for.
 * @param spawn Creates the worker. The script of the playground's worker unless a spec passes another one.
 * @returns The evaluator.
 */
export function createEvaluator(
  onOutcome: (outcome: EvaluationOutcome) => void,
  spawn: SpawnWorker = spawnWorker
): Evaluator {
  let worker: Worker | undefined;
  let running: Running | undefined;
  let waiting: Sketch | undefined;
  let lateTimer: ReturnType<typeof setTimeout> | undefined;
  let replaceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Forgets the evaluation that runs, and stops its time limit and the timer that would replace it.
   * @returns The sketch it evaluated.
   */
  function endRunning(): Sketch {
    const { sketch, limit } = running as Running;

    clearTimeout(limit);
    clearTimeout(replaceTimer);
    replaceTimer = undefined;
    running = undefined;
    return sketch;
  }

  /** Stops the worker. Its handlers go first, so that nothing it had already sent reaches the evaluator. */
  function stopWorker(): void {
    if (worker !== undefined) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      worker = undefined;
    }
  }

  /** Marks the evaluator free: it is no longer late. */
  function settle(): void {
    clearTimeout(lateTimer);
    lateTimer = undefined;
  }

  /**
   * Stops the worker and every sketch asked for, and reports the last one stopped.
   * @param reason Why it stops.
   */
  function stopAll(reason: StopReason): void {
    if (running === undefined) {
      // A worker that fails with nothing to evaluate leaves nothing to report: the next request starts another one
      stopWorker();
      return;
    }

    const asked = waiting ?? running.sketch;

    endRunning();
    waiting = undefined;
    stopWorker();
    settle();
    onOutcome({ kind: "stopped", sketch: asked, reason });
  }

  /**
   * Reports the evaluation that the worker sent, and evaluates the sketch that waited for it.
   * @param event The message of the worker.
   * @param event.data The evaluation of the sketch that runs.
   */
  function receive({ data }: MessageEvent<EvaluationReply>): void {
    const sketch = endRunning();
    const next = waiting;

    waiting = undefined;
    if (next === undefined) {
      settle();
    }
    onOutcome({ kind: "evaluated", sketch, evaluation: restore(sketch, data) });
    if (next !== undefined) {
      evaluate(next);
    }
  }

  /**
   * Sends a sketch to the worker, which is created when there is none.
   * @param sketch The sketch to evaluate.
   */
  function post(sketch: Sketch): void {
    if (worker === undefined) {
      try {
        worker = spawn();
      } catch (error) {
        // A worker that cannot be created fails as one whose script does not load: Chromium throws here for a script of another origin, and inside a sandboxed iframe. The error is reported as uncaught, as the one of a worker that fails, so that the developer tools show it
        reportError(error);
        settle();
        onOutcome({ kind: "stopped", sketch, reason: "error" });
        return;
      }
      worker.onmessage = receive;
      // The error is not cancelled, so the browser also reports it as uncaught: the developer tools show nothing of an error that the page cancels, and it is the only trace of a bug of the engine
      worker.onerror = () => stopAll("error");
      worker.onmessageerror = () => stopAll("error");
    }
    running = {
      sketch,
      startedAt: performance.now(),
      limit: setTimeout(() => stopAll("time-limit"), EVALUATION_TIME_LIMIT),
    };
    lateTimer ??= setTimeout(() => onOutcome({ kind: "late" }), LATE_AFTER);
    // The state is ready before the message goes, in case the reply comes back at once
    worker.postMessage(sketch);
  }

  /**
   * Stops the worker and the evaluation that runs, and sends a sketch to a new worker.
   * @param sketch The sketch to evaluate.
   */
  function replaceWith(sketch: Sketch): void {
    endRunning();
    waiting = undefined;
    stopWorker();
    post(sketch);
  }

  /**
   * Asks for the evaluation of a sketch. A sketch that waits for a short evaluation replaces it when it has run for `REPLACE_AFTER`, if it has not ended by then, so that it never waits behind a long one.
   * @param sketch The sketch to evaluate.
   */
  function evaluate(sketch: Sketch): void {
    if (running === undefined) {
      post(sketch);
      return;
    }

    const elapsed = performance.now() - running.startedAt;

    if (elapsed < REPLACE_AFTER) {
      waiting = sketch;
      replaceTimer ??= setTimeout(
        () => replaceWith(waiting as Sketch),
        REPLACE_AFTER - elapsed
      );
    } else {
      replaceWith(sketch);
    }
  }

  return {
    evaluate,
    dispose: () => {
      if (running !== undefined) {
        endRunning();
      }
      waiting = undefined;
      stopWorker();
      settle();
    },
  };
}
