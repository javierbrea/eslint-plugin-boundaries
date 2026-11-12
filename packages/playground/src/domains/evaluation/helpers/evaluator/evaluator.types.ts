import type { Sketch } from "@/contract";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";

/** What the worker sends back for a sketch: its evaluation without the sketch, which the evaluator already has. */
export type EvaluationReply = Omit<Evaluation, "sketch">;

/** The side of the worker that the script of the worker hands to `serveEvaluations`: `self` in a worker. */
export type EvaluationScope = {
  /** Called with each sketch to evaluate. */
  onmessage: ((event: MessageEvent<Sketch>) => void) | null;
  /** Sends a reply to the evaluator. */
  postMessage(reply: EvaluationReply): void;
};

/** Creates the worker that evaluates sketches. */
export type SpawnWorker = () => Worker;

/** Why an evaluation stopped: it took longer than the limit, or the worker failed, such as when its script could not load. */
export type StopReason = "time-limit" | "error";

/** How the evaluation on screen stands to the sketch on screen. `current`: it is the evaluation of that sketch. `pending`: a newer one is on its way, or waits out the delay of an edit of the config. `late`: the evaluator has been busy for `LATE_AFTER` milliseconds, or the last evaluation was stopped and a newer one is on its way. `stopped`: the evaluation of the sketch took longer than `EVALUATION_TIME_LIMIT` and was stopped. `failed`: the worker failed while it evaluated the sketch. The evaluation on screen, if any, is an older one in every status but `current`. */
export type EvaluationStatus =
  | "current"
  | "pending"
  | "late"
  | "stopped"
  | "failed";

/** What the evaluator reports. */
export type EvaluationOutcome =
  | {
      /** A sketch was evaluated. It may be older than the last one asked for, which the evaluator evaluates next. */
      readonly kind: "evaluated";
      /** The sketch that was asked for, the same object. */
      readonly sketch: Sketch;
      /** Its evaluation, whose `sketch` and whose dependencies are the objects of `sketch`. */
      readonly evaluation: Evaluation;
    }
  | {
      /** The evaluator has been busy for `LATE_AFTER` milliseconds. It reports it once each time it becomes busy, and it is busy until the last sketch asked for is evaluated or stopped. */
      readonly kind: "late";
    }
  | {
      /** The evaluator stopped its worker, and evaluates nothing until it is asked again. */
      readonly kind: "stopped";
      /** The last sketch that was asked for, which is left without an evaluation. */
      readonly sketch: Sketch;
      readonly reason: StopReason;
    };

/** Evaluates sketches in a worker, one at a time and the newest first, and reports what happens to them. */
export type Evaluator = {
  /**
   * Asks for the evaluation of a sketch. It starts at once when the worker is free. While an evaluation runs, the sketch waits for it to end, in the place of any sketch that was waiting, but no longer than until that evaluation has run for `REPLACE_AFTER` milliseconds: then the worker is stopped, and a new one starts with the sketch.
   * @param sketch The sketch to evaluate.
   */
  readonly evaluate: (sketch: Sketch) => void;
  /** Stops the worker and forgets every sketch that was asked for. It reports nothing, and the next request starts a new worker. */
  readonly dispose: () => void;
};

/** Creates an evaluator that reports to a listener. */
export type EvaluatorFactory = (
  onOutcome: (outcome: EvaluationOutcome) => void
) => Evaluator;
