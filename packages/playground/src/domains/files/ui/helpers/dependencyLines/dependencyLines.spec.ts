import type { Sketch, SketchDependency } from "@/contract";
import {
  alignEvaluation,
  getPendingResults,
} from "@/domains/evaluation/helpers/alignEvaluation";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { DependencyResult } from "@/domains/evaluation/helpers/engine";
import type { EvaluationStatus } from "@/domains/evaluation/helpers/evaluator";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { getDependencyLines } from "./dependencyLines";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const CHECKOUT = "src/modules/checkout/index.js";

const { evaluate } = createEngine();

/**
 * Gets the dependencies of a file with their verdicts.
 * @param path The path of the file.
 * @param sketch The sketch to evaluate. The quick-start project by default.
 * @returns The results of the file, in its order.
 */
function getResults(
  path: string,
  sketch = QUICK_START
): readonly DependencyResult[] {
  return evaluate(sketch).dependencies.filter(({ ref }) => ref.path === path);
}

/**
 * Joins the pieces of a statement as they read.
 * @param line The line.
 * @param line.tokens The pieces of its statement.
 * @returns The statement.
 */
function readStatement({
  tokens,
}: Readonly<{ tokens: readonly { text: string }[] }>): string {
  return tokens.map(({ text }) => text).join("");
}

describe("dependencyLines", () => {
  describe("getDependencyLines", () => {
    it("should write the statement of each dependency of the file, in order", () => {
      // Arrange
      const results = getResults(CHECKOUT);

      // Act
      const lines = getDependencyLines(results, "current");

      // Assert
      expect(lines.map(readStatement)).toEqual([
        'import { Button } from "../../components/atoms/Button/index.js";',
        'import { format } from "../../helpers/format/index.js";',
        'import { renderButton } from "../../components/atoms/Button/Button.spec.js";',
        'import React from "react";',
      ]);
    });

    it("should keep the pieces of the statement apart, so that the keywords and the source are colored", () => {
      // Arrange
      const [line] = getDependencyLines(getResults(CHECKOUT), "current");

      // Act
      const { tokens } = line;

      // Assert
      expect(tokens.map(({ kind }) => kind)).toEqual([
        "keyword",
        "text",
        "keyword",
        "text",
        "source",
        "text",
      ]);
    });

    it("should say which policy decided each dependency, and what the verdict looks like", () => {
      // Arrange
      const results = getResults(CHECKOUT);

      // Act
      const lines = getDependencyLines(results, "current").map(
        ({ label, icon, tone, hint }) => ({ label, icon, tone, hint })
      );

      // Assert
      expect(lines).toEqual([
        { label: "policy 1", icon: "check", tone: "ok", hint: undefined },
        { label: "policy 1", icon: "check", tone: "ok", hint: undefined },
        { label: "policy 2", icon: "cross", tone: "bad", hint: undefined },
        {
          label: "not checked · external",
          icon: "skip",
          tone: "faint",
          hint: "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins.",
        },
      ]);
    });

    it("should say default for a dependency that the default disallowed", () => {
      // Arrange
      const results = getResults("src/helpers/format/index.js");

      // Act
      const [line] = getDependencyLines(results, "current");

      // Assert
      expect(line.label).toBe("default");
      expect(line.icon).toBe("cross");
    });

    it("should say what the check and the cross mean to assistive technology, and nothing for the skip", () => {
      // Arrange
      const results = getResults(CHECKOUT);

      // Act
      const iconLabels = getDependencyLines(results, "current").map(
        ({ iconLabel }) => iconLabel
      );

      // Assert
      expect(iconLabels).toEqual([
        "allowed",
        "allowed",
        "disallowed",
        undefined,
      ]);
    });

    it("should draw a dependency that a warning disallows with the warning icon and its own words", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const results = getResults(CHECKOUT, { ...QUICK_START, config });

      // Act
      const [, , line] = getDependencyLines(results, "current");

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(line.icon).toBe("warn");
      expect(line.tone).toBe("warn");
      expect(line.iconLabel).toBe("disallowed, as a warning");
      expect(line.label).toBe("policy 2");
    });

    it("should say not evaluated, with no tooltip, while the rule is off", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["off",'
      );
      const results = getResults(CHECKOUT, { ...QUICK_START, config });

      // Act
      const lines = getDependencyLines(results, "current").map(
        ({ label, icon, tone, hint, iconLabel }) => ({
          label,
          icon,
          tone,
          hint,
          iconLabel,
        })
      );

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(lines).toHaveLength(4);
      expect(lines).toEqual(
        Array.from({ length: 4 }, () => ({
          label: "not evaluated",
          icon: "skip",
          tone: "faint",
          hint: undefined,
          iconLabel: undefined,
        }))
      );
    });

    it("should give each line an id that is its own among the dependencies of the sketch", () => {
      // Arrange
      const results = evaluate(QUICK_START).dependencies;

      // Act
      const ids = getDependencyLines(results, "current").map(({ id }) => id);

      // Assert
      expect(new Set(ids).size).toBe(9);
      expect(ids[6]).toBe("src/modules/checkout/index.js:2");
    });

    it("should write no line for a file with no dependencies", () => {
      // Act
      const lines = getDependencyLines([], "current");

      // Assert
      expect(lines).toEqual([]);
    });

    describe.each<[EvaluationStatus, boolean]>([
      ["current", false],
      ["pending", false],
      ["late", true],
      ["stopped", true],
      ["failed", true],
    ])("when the evaluation is %s", (evaluationStatus, dimmed) => {
      it("should set dimmed on every line of a dependency with a verdict as the status says", () => {
        // Arrange
        const results = getResults(CHECKOUT);

        // Act
        const lines = getDependencyLines(results, evaluationStatus);

        // Assert
        expect(lines).toHaveLength(4);
        expect(lines.map((line) => line.dimmed)).toEqual(
          Array.from({ length: 4 }, () => dimmed)
        );
      });

      it("should keep what each verdict says, whether or not the lines are dimmed", () => {
        // Arrange
        const results = getResults(CHECKOUT);

        // Act
        const lines = getDependencyLines(results, evaluationStatus).map(
          ({ dimmed: _dimmed, ...line }) => line
        );

        // Assert
        expect(lines).toEqual(
          getDependencyLines(results, "current").map(
            ({ dimmed: _dimmed, ...line }) => line
          )
        );
        expect(lines.map(({ label }) => label)).toEqual([
          "policy 1",
          "policy 1",
          "policy 2",
          "not checked · external",
        ]);
      });
    });

    describe("when a dependency has no verdict yet", () => {
      it.each<
        [
          EvaluationStatus,
          {
            icon: string | undefined;
            label: string;
            dimmed: boolean;
          },
        ]
      >([
        ["current", { icon: undefined, label: "", dimmed: false }],
        ["pending", { icon: undefined, label: "", dimmed: false }],
        ["late", { icon: "skip", label: "evaluating…", dimmed: true }],
        ["stopped", { icon: "skip", label: "not evaluated", dimmed: true }],
        ["failed", { icon: "skip", label: "not evaluated", dimmed: true }],
      ])(
        "should write the line for the status %s with no verdict, or with what the status says",
        (evaluationStatus, { icon, label, dimmed }) => {
          // Arrange
          const results = getPendingResults(QUICK_START).filter(
            ({ ref }) => ref.path === CHECKOUT
          );

          // Act
          const lines = getDependencyLines(results, evaluationStatus).map(
            ({
              icon: lineIcon,
              iconLabel,
              tone,
              label: text,
              hint,
              dimmed: d,
            }) => ({
              icon: lineIcon,
              iconLabel,
              tone,
              label: text,
              hint,
              dimmed: d,
            })
          );

          // Assert
          expect(lines).toEqual(
            Array.from({ length: 4 }, () => ({
              icon,
              iconLabel: undefined,
              tone: "faint",
              label,
              hint: undefined,
              dimmed,
            }))
          );
        }
      );

      it.each<EvaluationStatus>(["current", "late", "stopped"])(
        "should write the statement of the dependency in the line for the status %s",
        (evaluationStatus) => {
          // Arrange
          const results = getPendingResults(QUICK_START).filter(
            ({ ref }) => ref.path === CHECKOUT
          );

          // Act
          const lines = getDependencyLines(results, evaluationStatus);

          // Assert
          expect(lines.map(readStatement)).toEqual([
            'import { Button } from "../../components/atoms/Button/index.js";',
            'import { format } from "../../helpers/format/index.js";',
            'import { renderButton } from "../../components/atoms/Button/Button.spec.js";',
            'import React from "react";',
          ]);
          expect(lines.map(({ id }) => id)).toEqual([
            "src/modules/checkout/index.js:0",
            "src/modules/checkout/index.js:1",
            "src/modules/checkout/index.js:2",
            "src/modules/checkout/index.js:3",
          ]);
        }
      );

      it("should leave only the new dependency without a verdict among the ones that the last evaluation decided", () => {
        // Arrange
        const added: SketchDependency = {
          from: CHECKOUT,
          target: { kind: "external", name: "lodash" },
          syntax: "import",
          importKind: "value",
          specifiers: [{ kind: "named", name: "debounce" }],
        };
        const sketch: Sketch = {
          ...QUICK_START,
          dependencies: [...QUICK_START.dependencies, added],
        };
        const results = alignEvaluation(
          evaluate(QUICK_START),
          sketch
        ).dependencies.filter(({ ref }) => ref.path === CHECKOUT);

        // Act
        const lines = getDependencyLines(results, "late").map(
          ({ label, icon, dimmed }) => ({ label, icon, dimmed })
        );

        // Assert
        expect(lines).toEqual([
          { label: "policy 1", icon: "check", dimmed: true },
          { label: "policy 1", icon: "check", dimmed: true },
          { label: "policy 2", icon: "cross", dimmed: true },
          { label: "not checked · external", icon: "skip", dimmed: true },
          { label: "evaluating…", icon: "skip", dimmed: true },
        ]);
      });
    });
  });
});
