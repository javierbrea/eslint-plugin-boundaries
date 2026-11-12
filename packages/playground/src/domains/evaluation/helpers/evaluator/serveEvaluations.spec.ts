import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import type { EvaluationReply, EvaluationScope } from "./evaluator.types";
import { serveEvaluations } from "./serveEvaluations";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

/** The quick-start project with the rule off, so that no dependency is evaluated */
const RULE_OFF: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    '"boundaries/dependencies": [2,',
    '"boundaries/dependencies": ["off",'
  ),
};

/**
 * Creates the side of a worker that a script serves, with its replies recorded.
 * @returns The scope and the function that records its replies.
 */
function createScope(): {
  scope: EvaluationScope;
  replies: jest.Mock<void, [EvaluationReply]>;
} {
  const replies = jest.fn<void, [EvaluationReply]>();

  return { scope: { onmessage: null, postMessage: replies }, replies };
}

/**
 * Sends a sketch to the scope, as the page does.
 * @param scope The scope that is served.
 * @param sketch The sketch to evaluate.
 */
function send(scope: EvaluationScope, sketch: Sketch): void {
  if (scope.onmessage === null) {
    throw new Error("The scope has no handler for the messages");
  }
  scope.onmessage(new MessageEvent("message", { data: sketch }));
}

/**
 * Evaluates a sketch with an engine of its own, and drops the sketch from the evaluation, as the worker does.
 * @param sketch The sketch.
 * @returns What the worker must reply.
 */
function evaluateAlone(sketch: Sketch): EvaluationReply {
  const { sketch: _sketch, ...reply } = createEngine().evaluate(sketch);

  return reply;
}

describe("serveEvaluations", () => {
  it("should wait for the first sketch with nothing sent", () => {
    // Arrange
    const { scope, replies } = createScope();

    // Act
    serveEvaluations(scope);

    // Assert
    expect(scope.onmessage).toEqual(expect.any(Function));
    expect(replies).not.toHaveBeenCalled();
  });

  it("should answer a sketch with the evaluation of the engine, without the sketch", () => {
    // Arrange
    const { scope, replies } = createScope();
    serveEvaluations(scope);

    // Act
    send(scope, QUICK_START);

    // Assert
    expect(replies).toHaveBeenCalledTimes(1);
    expect(replies.mock.calls[0][0]).toEqual(evaluateAlone(QUICK_START));
    expect(replies.mock.calls[0][0]).not.toHaveProperty("sketch");
    expect(
      replies.mock.calls[0][0].dependencies.map(({ verdict }) => verdict.status)
    ).toContain("disallowed");
  });

  it("should answer each sketch it receives with its own evaluation, in order", () => {
    // Arrange
    const { scope, replies } = createScope();
    serveEvaluations(scope);

    // Act
    send(scope, QUICK_START);
    send(scope, RULE_OFF);

    // Assert
    expect(replies).toHaveBeenCalledTimes(2);
    expect(replies.mock.calls[0][0]).toEqual(evaluateAlone(QUICK_START));
    expect(replies.mock.calls[1][0]).toEqual(evaluateAlone(RULE_OFF));
    expect(replies.mock.calls[1][0].notEvaluated).toBe("rule-off");
  });

  it("should keep one engine for as long as it serves, so that the same sketch is evaluated once", () => {
    // Arrange
    const { scope, replies } = createScope();
    serveEvaluations(scope);

    // Act
    send(scope, QUICK_START);
    send(scope, QUICK_START);

    // Assert
    expect(replies.mock.calls[1][0].files).toBe(replies.mock.calls[0][0].files);
    expect(replies.mock.calls[1][0].dependencies).toBe(
      replies.mock.calls[0][0].dependencies
    );
  });

  it("should give each scope its own engine", () => {
    // Arrange
    const first = createScope();
    const second = createScope();
    serveEvaluations(first.scope);
    serveEvaluations(second.scope);

    // Act
    send(first.scope, QUICK_START);
    send(second.scope, QUICK_START);

    // Assert
    expect(second.replies.mock.calls[0][0].files).not.toBe(
      first.replies.mock.calls[0][0].files
    );
  });
});
