import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { createEvaluator } from "./evaluator";
import {
  EVALUATION_TIME_LIMIT,
  LATE_AFTER,
  REPLACE_AFTER,
} from "./evaluator.constants";
import type { EvaluationOutcome, EvaluationReply } from "./evaluator.types";

/** The parts of a `Worker` that the evaluator uses, with the calls recorded, so that a spec answers by calling the handler itself */
type FakeWorker = {
  postMessage: jest.Mock<void, [Sketch]>;
  terminate: jest.Mock<void, []>;
  onmessage: ((event: MessageEvent<EvaluationReply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
};

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const engine = createEngine();

/**
 * Makes a sketch of its own from another one: a different config text, so that it differs from it, and its own dependency objects.
 * @param sketch The sketch to copy.
 * @param mark Written at the end of the config text.
 * @returns The sketch.
 */
function variant(sketch: Sketch, mark: string): Sketch {
  return {
    config: `${sketch.config}\n// ${mark}`,
    tree: sketch.tree,
    dependencies: sketch.dependencies.map((dependency) => ({ ...dependency })),
  };
}

const SKETCH_A = QUICK_START;
const SKETCH_B = variant(QUICK_START, "b");
const SKETCH_C = variant(QUICK_START, "c");

/**
 * Builds what a worker answers for a sketch: its evaluation without the sketch, as a copy, as `postMessage` delivers it.
 * @param sketch The sketch that was asked for.
 * @returns The reply.
 */
function replyFor(sketch: Sketch): EvaluationReply {
  const { sketch: _sketch, ...reply } = engine.evaluate(sketch);

  return structuredClone(reply);
}

/**
 * Makes the worker answer a sketch, as the handler of the evaluator receives it.
 * @param worker The worker that answers.
 * @param sketch The sketch that it answers.
 */
function answer(worker: FakeWorker, sketch: Sketch): void {
  if (worker.onmessage === null) {
    throw new Error("The evaluator has no handler for the messages");
  }
  worker.onmessage(new MessageEvent("message", { data: replyFor(sketch) }));
}

/**
 * The two ways that a worker fails, which the evaluator listens to, and what makes each one happen
 * @param worker
 */
const FAILURES: [string, (worker: FakeWorker) => void][] = [
  [
    "onerror",
    (worker) => worker.onerror?.(new ErrorEvent("error", { message: "boom" })),
  ],
  [
    "onmessageerror",
    (worker) => worker.onmessageerror?.(new MessageEvent("messageerror")),
  ],
];

/**
 * Narrows an outcome to its kind.
 * @param outcome What was reported.
 * @param kind The kind that it must have.
 * @returns The outcome.
 */
function pick<Kind extends EvaluationOutcome["kind"]>(
  outcome: EvaluationOutcome | undefined,
  kind: Kind
): Extract<EvaluationOutcome, { kind: Kind }> {
  if (outcome?.kind !== kind) {
    throw new Error(
      `Expected the outcome ${kind}, got ${String(outcome?.kind)}`
    );
  }
  return outcome as Extract<EvaluationOutcome, { kind: Kind }>;
}

/**
 * Reads the handlers of a worker, which the evaluator clears before it stops the worker.
 * @param worker The worker.
 * @returns Each handler, `null` when it was cleared.
 */
function handlersOf(worker: FakeWorker): {
  onmessage: unknown;
  onerror: unknown;
  onmessageerror: unknown;
} {
  return {
    onmessage: worker.onmessage,
    onerror: worker.onerror,
    onmessageerror: worker.onmessageerror,
  };
}

/**
 * Tells for each item whether it is the same object as the one at its position.
 * @param actual The items to check.
 * @param expected The objects they must be.
 * @returns One answer for each expected object.
 */
function identities<Item>(
  actual: readonly Item[],
  expected: readonly Item[]
): boolean[] {
  return expected.map((item, index) => actual[index] === item);
}

/** The handlers of a worker that the evaluator stopped */
const CLEARED = { onmessage: null, onerror: null, onmessageerror: null };

/**
 * Creates an evaluator over fake workers.
 * @param prepare Called with each worker that the evaluator creates.
 * @returns The evaluator, what it reported, how it created workers and the workers it created, in order.
 */
function setup(prepare?: (worker: FakeWorker) => void): {
  evaluator: ReturnType<typeof createEvaluator>;
  onOutcome: jest.Mock<void, [EvaluationOutcome]>;
  spawn: jest.Mock<Worker, []>;
  workers: FakeWorker[];
} {
  const workers: FakeWorker[] = [];
  const onOutcome = jest.fn<void, [EvaluationOutcome]>();
  const spawn = jest.fn<Worker, []>(() => {
    const worker: FakeWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null,
      onmessageerror: null,
    };

    prepare?.(worker);
    workers.push(worker);
    return worker as unknown as Worker;
  });

  return {
    evaluator: createEvaluator(onOutcome, spawn),
    onOutcome,
    spawn,
    workers,
  };
}

/**
 * Lists what was reported, in order.
 * @param onOutcome The listener of the evaluator.
 * @returns The outcomes.
 */
function reported(
  onOutcome: jest.Mock<void, [EvaluationOutcome]>
): EvaluationOutcome[] {
  return onOutcome.mock.calls.map(([outcome]) => outcome);
}

/**
 * Lists the sketches that a worker received, in order.
 * @param worker The worker.
 * @returns The sketches.
 */
function posted(worker: FakeWorker): Sketch[] {
  return worker.postMessage.mock.calls.map(([sketch]) => sketch);
}

describe("evaluator", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("createEvaluator", () => {
    it("should create no worker and set no timer until it is asked for a sketch", () => {
      // Act
      const { spawn, onOutcome } = setup();
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT);

      // Assert
      expect(spawn).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
      expect(onOutcome).not.toHaveBeenCalled();
    });

    describe("when no spawn function is given", () => {
      it("should evaluate in the worker of the playground, whose evaluation has the objects of the sketch", () => {
        // Arrange
        const onOutcome = jest.fn<void, [EvaluationOutcome]>();
        const evaluator = createEvaluator(onOutcome);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        const { sketch, evaluation } = pick(
          reported(onOutcome)[0],
          "evaluated"
        );

        expect(onOutcome).toHaveBeenCalledTimes(1);
        expect(sketch).toBe(SKETCH_B);
        expect(evaluation.sketch).toBe(SKETCH_B);
        expect(evaluation.dependencies[0].dependency).toBe(
          SKETCH_B.dependencies[0]
        );
      });

      it("should report the evaluation that the engine makes, and leave no timer", () => {
        // Arrange
        const onOutcome = jest.fn<void, [EvaluationOutcome]>();
        const evaluator = createEvaluator(onOutcome);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        const { evaluation } = pick(reported(onOutcome)[0], "evaluated");

        expect(evaluation).toEqual(engine.evaluate(SKETCH_B));
        expect(jest.getTimerCount()).toBe(0);
      });

      it("should report the sketch as stopped by an error, without throwing, when the engine throws in the worker", () => {
        // Arrange
        const onOutcome = jest.fn<void, [EvaluationOutcome]>();
        const evaluator = createEvaluator(onOutcome);

        // Act
        jest.isolateModules(() => {
          // The script of the worker loads with the worker, so it takes this engine
          jest.doMock<{ createEngine: typeof createEngine }>(
            "@/domains/evaluation/helpers/engine",
            () => ({
              createEngine: () => ({
                evaluate: () => {
                  throw new Error("An engine bug");
                },
              }),
            })
          );
          evaluator.evaluate(SKETCH_B);
        });
        // The mock outlives the isolated modules, and a later worker of this file would take it
        jest.dontMock("@/domains/evaluation/helpers/engine");

        // Assert
        const outcomes = reported(onOutcome);

        expect(outcomes).toHaveLength(1);
        expect(pick(outcomes[0], "stopped").sketch).toBe(SKETCH_B);
        expect(pick(outcomes[0], "stopped").reason).toBe("error");
        expect(jest.getTimerCount()).toBe(0);
      });
    });
  });

  describe("evaluate", () => {
    describe("when the worker is free", () => {
      it("should create the worker and send it the sketch", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();

        // Act
        evaluator.evaluate(SKETCH_A);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(1);
        expect(posted(workers[0])).toHaveLength(1);
        expect(posted(workers[0])[0]).toBe(SKETCH_A);
      });

      it("should report nothing until the worker answers", () => {
        // Arrange
        const { evaluator, onOutcome } = setup();

        // Act
        evaluator.evaluate(SKETCH_A);

        // Assert
        expect(onOutcome).not.toHaveBeenCalled();
      });

      it("should send the next sketch to the same worker once it has answered", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        answer(workers[0], SKETCH_A);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(1);
        expect(posted(workers[0])).toHaveLength(2);
        expect(posted(workers[0])[1]).toBe(SKETCH_B);
        expect(workers[0].terminate).not.toHaveBeenCalled();
      });
    });

    describe("when the worker answers", () => {
      it("should report the sketch that was asked for, the same object", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_B);

        // Act
        answer(workers[0], SKETCH_B);

        // Assert
        const outcome = pick(reported(onOutcome)[0], "evaluated");

        expect(onOutcome).toHaveBeenCalledTimes(1);
        expect(outcome.sketch).toBe(SKETCH_B);
        expect(outcome.evaluation.sketch).toBe(SKETCH_B);
        expect(outcome.evaluation.sketch).not.toBe(SKETCH_A);
      });

      it("should give each result the dependency of the sketch at its position, and not the copy that came back", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_B);

        // Act
        answer(workers[0], SKETCH_B);

        // Assert
        const { evaluation } = pick(reported(onOutcome)[0], "evaluated");

        expect(evaluation.dependencies).toHaveLength(
          SKETCH_B.dependencies.length
        );
        expect(
          identities(
            evaluation.dependencies.map(({ dependency }) => dependency),
            SKETCH_B.dependencies
          )
        ).toEqual(SKETCH_B.dependencies.map(() => true));
      });

      it("should report the evaluation that the worker made, without changing what it says", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_B);

        // Act
        answer(workers[0], SKETCH_B);

        // Assert
        const { evaluation } = pick(reported(onOutcome)[0], "evaluated");

        expect(evaluation).toEqual(engine.evaluate(SKETCH_B));
        expect(
          evaluation.dependencies.map(({ verdict }) => verdict.status)
        ).toContain("disallowed");
      });

      it("should accept an answer that arrives before postMessage returns", () => {
        // Arrange
        const { evaluator, onOutcome } = setup((worker) => {
          worker.postMessage.mockImplementation((asked) =>
            answer(worker, asked)
          );
        });

        // Act
        evaluator.evaluate(SKETCH_A);

        // Assert
        const { sketch } = pick(reported(onOutcome)[0], "evaluated");

        expect(onOutcome).toHaveBeenCalledTimes(1);
        expect(sketch).toBe(SKETCH_A);
      });

      it("should stop its timers when it has no sketch left to evaluate", () => {
        // Arrange
        const { evaluator, workers } = setup();
        evaluator.evaluate(SKETCH_A);

        expect(jest.getTimerCount()).toBeGreaterThan(0);

        // Act
        answer(workers[0], SKETCH_A);

        // Assert
        expect(jest.getTimerCount()).toBe(0);
      });
    });

    describe("when the worker is busy", () => {
      it("should keep the sketch waiting, with no new worker and no message, while the running one has run less than REPLACE_AFTER", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER - 1);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(1);
        expect(workers[0].terminate).not.toHaveBeenCalled();
        expect(posted(workers[0])).toHaveLength(1);
      });

      it("should keep only the latest sketch that waited", () => {
        // Arrange
        const { evaluator, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);
        evaluator.evaluate(SKETCH_C);

        // Act
        answer(workers[0], SKETCH_A);

        // Assert
        expect(posted(workers[0])).toHaveLength(2);
        expect(posted(workers[0])[1]).toBe(SKETCH_C);
      });

      it("should report the sketch that ran as the one that was asked for, and then send the one that waited", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);

        // Act
        answer(workers[0], SKETCH_A);

        // Assert
        const outcome = pick(reported(onOutcome)[0], "evaluated");

        expect(onOutcome).toHaveBeenCalledTimes(1);
        expect(outcome.sketch).toBe(SKETCH_A);
        expect(outcome.evaluation.sketch).toBe(SKETCH_A);
        expect(onOutcome.mock.invocationCallOrder[0]).toBeLessThan(
          workers[0].postMessage.mock.invocationCallOrder[1]
        );
      });

      it("should report the sketch that waited when its turn is answered, and stop there", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);
        answer(workers[0], SKETCH_A);

        // Act
        answer(workers[0], SKETCH_B);

        // Assert
        const outcomes = reported(onOutcome);

        expect(outcomes).toHaveLength(2);
        expect(pick(outcomes[1], "evaluated").sketch).toBe(SKETCH_B);
        expect(pick(outcomes[1], "evaluated").evaluation.sketch).toBe(SKETCH_B);
        expect(posted(workers[0])).toHaveLength(2);
        expect(jest.getTimerCount()).toBe(0);
      });

      it("should send the sketch that waited to a new worker, and stop the old one, when the running evaluation reaches REPLACE_AFTER", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER / 2);
        evaluator.evaluate(SKETCH_B);

        // Act
        jest.advanceTimersByTime(REPLACE_AFTER / 2);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(2);
        expect(handlersOf(workers[0])).toEqual(CLEARED);
        expect(workers[0].terminate).toHaveBeenCalledTimes(1);
        expect(posted(workers[1])).toEqual([SKETCH_B]);
      });

      it("should not send the sketch that waited before the running evaluation reaches REPLACE_AFTER", () => {
        // Arrange
        const { evaluator, spawn } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER / 2);
        evaluator.evaluate(SKETCH_B);

        // Act
        jest.advanceTimersByTime(REPLACE_AFTER / 2 - 1);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(1);
      });

      it("should send the latest of the sketches that waited when the replacement comes", () => {
        // Arrange
        const { evaluator, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);
        evaluator.evaluate(SKETCH_C);

        // Act
        jest.advanceTimersByTime(REPLACE_AFTER);

        // Assert
        expect(posted(workers[1])).toEqual([SKETCH_C]);
      });

      it("should not replace the worker when the running evaluation answers before REPLACE_AFTER, and send the sketch that waited to the same one", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);
        answer(workers[0], SKETCH_A);

        // Act
        jest.advanceTimersByTime(REPLACE_AFTER);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(1);
        expect(posted(workers[0])).toEqual([SKETCH_A, SKETCH_B]);
      });
    });

    describe("when the system clock changes while an evaluation runs", () => {
      it("should not replace the running evaluation when the clock moves forward before it has run for REPLACE_AFTER", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.setSystemTime(Date.now() + REPLACE_AFTER);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(1);
        expect(workers[0].terminate).not.toHaveBeenCalled();
        expect(posted(workers[0])).toEqual([SKETCH_A]);
      });

      it("should replace the running evaluation once it has run for REPLACE_AFTER when the clock moves back", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.setSystemTime(Date.now() - 10_000);
        evaluator.evaluate(SKETCH_B);

        // Act
        jest.advanceTimersByTime(REPLACE_AFTER);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(2);
        expect(posted(workers[1])).toEqual([SKETCH_B]);
      });
    });

    describe("when the running evaluation has run for REPLACE_AFTER", () => {
      it("should stop the worker, handlers first, and send nothing more to it", () => {
        // Arrange
        const { evaluator, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        expect(workers[0].terminate).toHaveBeenCalledTimes(1);
        expect(handlersOf(workers[0])).toEqual(CLEARED);
        expect(posted(workers[0])).toHaveLength(1);
      });

      it("should send the sketch to a new worker, which it keeps", () => {
        // Arrange
        const { evaluator, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER);

        // Act
        evaluator.evaluate(SKETCH_B);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(2);
        expect(posted(workers[1])).toHaveLength(1);
        expect(posted(workers[1])[0]).toBe(SKETCH_B);
        expect(workers[1].terminate).not.toHaveBeenCalled();
      });

      it("should report only the sketch of the new worker, and nothing of the one that was replaced", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER);
        evaluator.evaluate(SKETCH_C);

        // Act
        answer(workers[1], SKETCH_C);

        // Assert
        const outcomes = reported(onOutcome).filter(
          ({ kind }) => kind === "evaluated"
        );

        expect(outcomes).toHaveLength(1);
        expect(pick(outcomes[0], "evaluated").sketch).toBe(SKETCH_C);
        expect(posted(workers[1])).toHaveLength(1);
        expect(posted(workers[0])).toHaveLength(1);
      });

      it("should report the new sketch when its worker answers, with the objects of that sketch", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER);
        evaluator.evaluate(SKETCH_B);

        // Act
        answer(workers[1], SKETCH_B);

        // Assert
        const outcome = pick(reported(onOutcome).at(-1), "evaluated");

        expect(outcome.sketch).toBe(SKETCH_B);
        expect(outcome.evaluation.dependencies[0].dependency).toBe(
          SKETCH_B.dependencies[0]
        );
      });

      it("should stop the time limit of the replaced evaluation and start the one of the new sketch", () => {
        // Arrange
        const { evaluator, onOutcome } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(REPLACE_AFTER);
        evaluator.evaluate(SKETCH_B);

        // Act
        jest.advanceTimersByTime(EVALUATION_TIME_LIMIT - REPLACE_AFTER);
        const beforeItsLimit = reported(onOutcome).filter(
          ({ kind }) => kind === "stopped"
        );
        jest.advanceTimersByTime(REPLACE_AFTER);

        // Assert
        const stopped = reported(onOutcome).filter(
          ({ kind }) => kind === "stopped"
        );

        expect(beforeItsLimit).toEqual([]);
        expect(stopped).toHaveLength(1);
        expect(pick(stopped[0], "stopped").sketch).toBe(SKETCH_B);
      });
    });
  });

  describe("late", () => {
    it("should report that it is late once, when it has been busy for LATE_AFTER", () => {
      // Arrange
      const { evaluator, onOutcome } = setup();
      evaluator.evaluate(SKETCH_A);

      // Act
      jest.advanceTimersByTime(LATE_AFTER - 1);
      const early = reported(onOutcome);
      jest.advanceTimersByTime(1);
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT / 2);

      // Assert
      expect(early).toEqual([]);
      expect(reported(onOutcome)).toEqual([{ kind: "late" }]);
    });

    it("should not report it when the worker answers before LATE_AFTER", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      jest.advanceTimersByTime(LATE_AFTER - 1);

      // Act
      answer(workers[0], SKETCH_A);
      jest.advanceTimersByTime(LATE_AFTER * 2);

      // Assert
      expect(reported(onOutcome).map(({ kind }) => kind)).toEqual([
        "evaluated",
      ]);
    });

    it("should report it again in the next busy period", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      jest.advanceTimersByTime(LATE_AFTER);
      answer(workers[0], SKETCH_A);

      // Act
      evaluator.evaluate(SKETCH_B);
      jest.advanceTimersByTime(LATE_AFTER);

      // Assert
      expect(reported(onOutcome).map(({ kind }) => kind)).toEqual([
        "late",
        "evaluated",
        "late",
      ]);
    });

    it("should not report it again while it is still busy across a replacement", () => {
      // Arrange
      const { evaluator, onOutcome, spawn } = setup();
      evaluator.evaluate(SKETCH_A);
      jest.advanceTimersByTime(REPLACE_AFTER);

      // Act
      evaluator.evaluate(SKETCH_B);
      jest.advanceTimersByTime(LATE_AFTER * 3);

      // Assert
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(reported(onOutcome)).toEqual([{ kind: "late" }]);
    });

    it("should not report it again when the sketch that waited replaces the late evaluation", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      evaluator.evaluate(SKETCH_B);
      jest.advanceTimersByTime(LATE_AFTER);

      // Act
      answer(workers[1], SKETCH_B);
      jest.advanceTimersByTime(LATE_AFTER * 3);

      // Assert
      expect(reported(onOutcome).map(({ kind }) => kind)).toEqual([
        "late",
        "evaluated",
      ]);
      expect(pick(reported(onOutcome)[1], "evaluated").sketch).toBe(SKETCH_B);
    });

    it("should count LATE_AFTER from the moment it became busy, and not from each sketch", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      jest.advanceTimersByTime(LATE_AFTER - 100);
      evaluator.evaluate(SKETCH_B);
      answer(workers[0], SKETCH_A);

      // Act
      jest.advanceTimersByTime(100);

      // Assert
      expect(reported(onOutcome).map(({ kind }) => kind)).toEqual([
        "evaluated",
        "late",
      ]);
    });
  });

  describe("time limit", () => {
    it("should stop at EVALUATION_TIME_LIMIT and report the sketch that ran, with the reason time-limit", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setup();
      evaluator.evaluate(SKETCH_A);

      // Act
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT - 1);
      const before = reported(onOutcome).map(({ kind }) => kind);
      jest.advanceTimersByTime(1);

      // Assert
      const outcomes = reported(onOutcome);

      expect(before).toEqual(["late"]);
      expect(outcomes).toHaveLength(2);
      expect(pick(outcomes[1], "stopped").sketch).toBe(SKETCH_A);
      expect(pick(outcomes[1], "stopped").reason).toBe("time-limit");
      expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    });

    it("should count the limit of a sketch that waited from when it replaced the running one", () => {
      // Arrange
      const { evaluator, onOutcome } = setup();
      evaluator.evaluate(SKETCH_A);
      evaluator.evaluate(SKETCH_B);
      evaluator.evaluate(SKETCH_C);
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT);
      const stoppedAtTheLimitOfTheFirst = reported(onOutcome).some(
        ({ kind }) => kind === "stopped"
      );

      // Act
      jest.advanceTimersByTime(REPLACE_AFTER);

      // Assert
      const stopped = pick(reported(onOutcome).at(-1), "stopped");

      expect(stoppedAtTheLimitOfTheFirst).toBe(false);
      expect(stopped.sketch).toBe(SKETCH_C);
      expect(stopped.reason).toBe("time-limit");
    });

    it("should stop the worker, handlers first, and leave no timer", () => {
      // Arrange
      const { evaluator, workers } = setup();
      evaluator.evaluate(SKETCH_A);

      // Act
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT);

      // Assert
      expect(handlersOf(workers[0])).toEqual(CLEARED);
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should start a new worker with the next request", () => {
      // Arrange
      const { evaluator, onOutcome, spawn, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT);

      // Act
      evaluator.evaluate(SKETCH_C);
      answer(workers[1], SKETCH_C);

      // Assert
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(posted(workers[1])).toHaveLength(1);
      expect(posted(workers[1])[0]).toBe(SKETCH_C);
      expect(pick(reported(onOutcome).at(-1), "evaluated").sketch).toBe(
        SKETCH_C
      );
    });
  });

  describe("when the worker fails", () => {
    describe.each(FAILURES)("with %s", (_name, fail) => {
      it("should report the sketch that ran as stopped by an error", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);

        // Act
        fail(workers[0]);

        // Assert
        const outcomes = reported(onOutcome);

        expect(outcomes).toHaveLength(1);
        expect(pick(outcomes[0], "stopped").sketch).toBe(SKETCH_A);
        expect(pick(outcomes[0], "stopped").reason).toBe("error");
      });

      it("should report the last sketch that was asked for when others were waiting", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);

        // Act
        fail(workers[0]);

        // Assert
        const outcomes = reported(onOutcome);

        expect(outcomes).toHaveLength(1);
        expect(pick(outcomes[0], "stopped").sketch).toBe(SKETCH_B);
        expect(pick(outcomes[0], "stopped").reason).toBe("error");
      });

      it("should stop the worker, handlers first, and every timer, so that nothing else is reported", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);

        // Act
        fail(workers[0]);
        jest.advanceTimersByTime(EVALUATION_TIME_LIMIT);

        // Assert
        expect(workers[0].terminate).toHaveBeenCalledTimes(1);
        expect(handlersOf(workers[0])).toEqual(CLEARED);
        expect(onOutcome).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
      });

      it("should start a new worker with the next request, and forget the sketch that waited", () => {
        // Arrange
        const { evaluator, onOutcome, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        evaluator.evaluate(SKETCH_B);
        fail(workers[0]);

        // Act
        evaluator.evaluate(SKETCH_C);
        answer(workers[1], SKETCH_C);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(2);
        expect(posted(workers[1])).toHaveLength(1);
        expect(posted(workers[1])[0]).toBe(SKETCH_C);
        expect(pick(reported(onOutcome).at(-1), "evaluated").sketch).toBe(
          SKETCH_C
        );
      });

      it("should not report that it is late when it stopped before LATE_AFTER", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        jest.advanceTimersByTime(LATE_AFTER - 1);

        // Act
        fail(workers[0]);
        jest.advanceTimersByTime(LATE_AFTER * 2);

        // Assert
        expect(reported(onOutcome).map(({ kind }) => kind)).toEqual([
          "stopped",
        ]);
      });

      it("should report nothing, and drop the worker, when nothing is running", () => {
        // Arrange
        const { evaluator, onOutcome, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        answer(workers[0], SKETCH_A);

        // Act
        fail(workers[0]);

        // Assert
        expect(reported(onOutcome).map(({ kind }) => kind)).toEqual([
          "evaluated",
        ]);
        expect(workers[0].terminate).toHaveBeenCalledTimes(1);
        expect(handlersOf(workers[0])).toEqual(CLEARED);
      });

      it("should start a new worker with the next request after it dropped one with nothing running", () => {
        // Arrange
        const { evaluator, onOutcome, spawn, workers } = setup();
        evaluator.evaluate(SKETCH_A);
        answer(workers[0], SKETCH_A);
        fail(workers[0]);

        // Act
        evaluator.evaluate(SKETCH_B);
        answer(workers[1], SKETCH_B);

        // Assert
        expect(spawn).toHaveBeenCalledTimes(2);
        expect(posted(workers[0])).toHaveLength(1);
        expect(posted(workers[1])[0]).toBe(SKETCH_B);
        expect(pick(reported(onOutcome).at(-1), "evaluated").sketch).toBe(
          SKETCH_B
        );
      });
    });
  });

  describe("when a worker cannot be created", () => {
    /** The `reportError` of the browser, which jsdom does not have */
    let reportErrorMock: jest.Mock<void, [unknown]>;

    beforeEach(() => {
      reportErrorMock = jest.fn();
      Object.defineProperty(globalThis, "reportError", {
        value: reportErrorMock,
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(globalThis, "reportError");
    });

    /**
     * Creates an evaluator whose spawn function throws for the workers at the given positions, as the `Worker` constructor of Chromium does for a script of another origin.
     * @param failing The positions of the workers that cannot be created, from 0.
     * @returns What `setup` returns.
     */
    function setupFailingSpawn(
      failing: readonly number[]
    ): ReturnType<typeof setup> {
      let created = 0;

      return setup(() => {
        created += 1;
        if (failing.includes(created - 1)) {
          throw new DOMException("Script cannot be accessed", "SecurityError");
        }
      });
    }

    it("should report the first sketch as stopped by an error, without throwing, and leave no timer", () => {
      // Arrange
      const { evaluator, onOutcome } = setupFailingSpawn([0]);

      // Act
      const evaluate = (): void => evaluator.evaluate(SKETCH_A);

      // Assert
      expect(evaluate).not.toThrow();

      const outcomes = reported(onOutcome);

      expect(outcomes).toHaveLength(1);
      expect(pick(outcomes[0], "stopped").sketch).toBe(SKETCH_A);
      expect(pick(outcomes[0], "stopped").reason).toBe("error");
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should report the sketch that replaces a running one as stopped by an error, and report nothing more", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setupFailingSpawn([1]);
      evaluator.evaluate(SKETCH_A);
      evaluator.evaluate(SKETCH_B);

      // Act
      jest.advanceTimersByTime(REPLACE_AFTER);
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT * 2);

      // Assert
      const outcomes = reported(onOutcome);

      expect(workers[0].terminate).toHaveBeenCalledTimes(1);
      expect(outcomes.map(({ kind }) => kind)).toEqual(["late", "stopped"]);
      expect(pick(outcomes[1], "stopped").sketch).toBe(SKETCH_B);
      expect(pick(outcomes[1], "stopped").reason).toBe("error");
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should report the error as one that nothing caught, so that the developer tools show it", () => {
      // Arrange
      const { evaluator } = setupFailingSpawn([0]);

      // Act
      evaluator.evaluate(SKETCH_A);

      // Assert
      expect(reportErrorMock).toHaveBeenCalledTimes(1);
      expect(reportErrorMock.mock.calls[0][0]).toBeInstanceOf(DOMException);
      expect((reportErrorMock.mock.calls[0][0] as DOMException).name).toBe(
        "SecurityError"
      );
    });

    it("should try a new worker with the next request", () => {
      // Arrange
      const { evaluator, onOutcome, spawn, workers } = setupFailingSpawn([0]);
      evaluator.evaluate(SKETCH_A);

      // Act
      evaluator.evaluate(SKETCH_B);
      answer(workers[0], SKETCH_B);

      // Assert
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(posted(workers[0])).toEqual([SKETCH_B]);
      expect(pick(reported(onOutcome).at(-1), "evaluated").sketch).toBe(
        SKETCH_B
      );
    });
  });

  describe("dispose", () => {
    it("should stop the worker, handlers first, while a sketch runs and another waits", () => {
      // Arrange
      const { evaluator, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      evaluator.evaluate(SKETCH_B);

      // Act
      evaluator.dispose();

      // Assert
      expect(workers[0].terminate).toHaveBeenCalledTimes(1);
      expect(handlersOf(workers[0])).toEqual(CLEARED);
    });

    it("should clear every timer and report nothing, not even that it is late or that it stopped", () => {
      // Arrange
      const { evaluator, onOutcome } = setup();
      evaluator.evaluate(SKETCH_A);
      evaluator.evaluate(SKETCH_B);

      // Act
      evaluator.dispose();
      const timers = jest.getTimerCount();
      jest.advanceTimersByTime(EVALUATION_TIME_LIMIT * 2);

      // Assert
      expect(timers).toBe(0);
      expect(onOutcome).not.toHaveBeenCalled();
    });

    it("should start a new worker with the next request, and forget the sketch that waited", () => {
      // Arrange
      const { evaluator, onOutcome, spawn, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      evaluator.evaluate(SKETCH_B);
      evaluator.dispose();

      // Act
      evaluator.evaluate(SKETCH_C);
      answer(workers[1], SKETCH_C);

      // Assert
      expect(spawn).toHaveBeenCalledTimes(2);
      expect(posted(workers[1])).toHaveLength(1);
      expect(posted(workers[1])[0]).toBe(SKETCH_C);
      expect(reported(onOutcome)).toHaveLength(1);
      expect(pick(reported(onOutcome)[0], "evaluated").sketch).toBe(SKETCH_C);
    });

    it("should stop the worker that has answered and is free", () => {
      // Arrange
      const { evaluator, onOutcome, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      answer(workers[0], SKETCH_A);

      // Act
      evaluator.dispose();

      // Assert
      expect(workers[0].terminate).toHaveBeenCalledTimes(1);
      expect(onOutcome).toHaveBeenCalledTimes(1);
    });

    it("should do nothing when no sketch was ever asked for", () => {
      // Arrange
      const { evaluator, onOutcome, spawn } = setup();

      // Act
      evaluator.dispose();

      // Assert
      expect(spawn).not.toHaveBeenCalled();
      expect(onOutcome).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it("should do nothing more when it is disposed twice", () => {
      // Arrange
      const { evaluator, workers } = setup();
      evaluator.evaluate(SKETCH_A);
      evaluator.dispose();

      // Act
      evaluator.dispose();

      // Assert
      expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    });
  });
});
