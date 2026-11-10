import {
  EVALUATION_TIME_LIMIT,
  type EvaluationStatus,
} from "@/domains/evaluation/helpers/evaluator";

import {
  getEvaluationNote,
  getEvaluationStatusText,
  getPendingVerdictLabel,
  isEvaluationDimmed,
} from "./evaluationStatus";

/** What the panes say when the evaluation took longer than the limit, which names it in seconds */
const STOPPED_TEXT = `The evaluation took longer than ${EVALUATION_TIME_LIMIT / 1000} seconds and was stopped. Edit the project to evaluate it again.`;

describe("evaluationStatus", () => {
  describe("isEvaluationDimmed", () => {
    it.each<[EvaluationStatus, boolean]>([
      ["current", false],
      ["pending", false],
      ["late", true],
      ["stopped", true],
      ["failed", true],
    ])(
      "should tell for the status %s that it is dimmed: %s",
      (evaluationStatus, expected) => {
        // Act
        const dimmed = isEvaluationDimmed(evaluationStatus);

        // Assert
        expect(dimmed).toBe(expected);
      }
    );
  });

  describe("getEvaluationNote", () => {
    it.each<[EvaluationStatus, boolean, string | undefined]>([
      ["current", false, undefined],
      ["current", true, undefined],
      ["pending", false, undefined],
      ["pending", true, undefined],
      ["late", false, "Evaluating the project…"],
      ["late", true, undefined],
      ["stopped", false, STOPPED_TEXT],
      ["stopped", true, STOPPED_TEXT],
      [
        "failed",
        false,
        "The evaluation could not run. Edit the project to try again.",
      ],
      [
        "failed",
        true,
        "The evaluation could not run. Edit the project to try again.",
      ],
    ])(
      "should write for the status %s, when there is an evaluation on screen (%s): %s",
      (evaluationStatus, hasEvaluation, expected) => {
        // Act
        const note = getEvaluationNote(evaluationStatus, hasEvaluation);

        // Assert
        expect(note).toBe(expected);
      }
    );
  });

  describe("getEvaluationStatusText", () => {
    it.each<[EvaluationStatus, { text: string; tone: string } | undefined]>([
      ["current", undefined],
      ["pending", undefined],
      ["late", { text: "evaluating…", tone: "faint" }],
      ["stopped", { text: "evaluation stopped", tone: "warn" }],
      ["failed", { text: "evaluation failed", tone: "bad" }],
    ])(
      "should write for the status %s the text and tone %j",
      (evaluationStatus, expected) => {
        // Act
        const text = getEvaluationStatusText(evaluationStatus);

        // Assert
        expect(text).toEqual(expected);
      }
    );
  });

  describe("getPendingVerdictLabel", () => {
    it.each<[EvaluationStatus, string | undefined]>([
      ["current", undefined],
      ["pending", undefined],
      ["late", "evaluating…"],
      ["stopped", "not evaluated"],
      ["failed", "not evaluated"],
    ])("should write for the status %s: %s", (evaluationStatus, expected) => {
      // Act
      const label = getPendingVerdictLabel(evaluationStatus);

      // Assert
      expect(label).toBe(expected);
    });
  });
});
