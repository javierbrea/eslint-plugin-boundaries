import type { SketchDependency } from "@/contract";
import type {
  ConfigToken,
  DependencyVerdict,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type { DependencyDetailFacts } from "@/domains/problems/helpers/problemSelectors";
import type { DependencyRef } from "@/domains/project/helpers/sketch";

import { toDependencyDetail } from "./dependencyDetail";

const CHECKOUT = "src/modules/checkout/index.js";

const SPEC_FILE = "src/components/atoms/Button/Button.spec.js";

const SOURCE = "../../components/atoms/Button/Button.spec.js";

const POLICY_RANGE: TextRange = { from: 40, to: 90, line: 3, column: 9 };

const DEFAULT_RANGE: TextRange = { from: 100, to: 110, line: 8, column: 5 };

const DEPENDENCY: SketchDependency = {
  from: CHECKOUT,
  target: { kind: "node", path: SPEC_FILE },
  syntax: "import",
  importKind: "value",
  specifiers: [{ kind: "named", name: "renderButton" }],
};

const DISALLOWED: DependencyVerdict = {
  status: "disallowed",
  policy: { index: 2, range: POLICY_RANGE },
  message:
    'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
  level: "error",
};

/** The pieces of `{ disallow: {} }`, which the card colors */
const POLICY_TOKENS: readonly ConfigToken[] = [
  { kind: "punctuation", text: "{" },
  { kind: "plain", text: " " },
  { kind: "key", text: "disallow" },
  { kind: "punctuation", text: ":" },
  { kind: "plain", text: " " },
  { kind: "punctuation", text: "{" },
  { kind: "punctuation", text: "}" },
  { kind: "plain", text: " " },
  { kind: "punctuation", text: "}" },
];

/** The policy that decided the dependency of the mockup */
const POLICY: DependencyDetailFacts["policy"] = {
  index: 2,
  range: POLICY_RANGE,
  tokens: POLICY_TOKENS,
};

/**
 * Builds the facts of the body of the dependency tab.
 * @param overrides What differs from the dependency of the mockup, which policy 2 disallowed.
 * @returns The facts.
 */
function createFacts(
  overrides: Partial<Pick<DependencyDetailFacts, "policy">> & {
    verdict?: DependencyVerdict;
    dependency?: SketchDependency;
    ref?: DependencyRef;
  } = {}
): DependencyDetailFacts {
  const {
    verdict = DISALLOWED,
    dependency = DEPENDENCY,
    ref = { path: CHECKOUT, index: 2 },
    ...rest
  } = overrides;

  return {
    subject: { kind: "dependency", ref },
    result: {
      dependency,
      ref,
      source: SOURCE,
      description: undefined,
      verdict,
    },
    policy: POLICY,
    ...rest,
  };
}

describe("dependencyDetail", () => {
  describe("toDependencyDetail", () => {
    describe("a dependency that the rule disallows", () => {
      it("should say disallowed with the policy, in the tone and with the icon of an error, and give the message of the plugin", () => {
        // Act
        const detail = toDependencyDetail(createFacts());

        // Assert
        expect(detail.verdict).toEqual({
          icon: "cross",
          tone: "bad",
          text: "disallowed · policy 2",
        });
        expect(detail.message).toBe(
          'Dependencies to file of category "test" are not allowed. Denied by policy at index 2'
        );
      });

      it("should say disallowed by the default when the default decided", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: {
              ...DISALLOWED,
              policy: { index: null, range: DEFAULT_RANGE },
            },
          })
        );

        // Assert
        expect(detail.verdict.text).toBe("disallowed · default");
      });

      it("should use the icon and the tone of a warning when the rule is one", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({ verdict: { ...DISALLOWED, level: "warning" } })
        );

        // Assert
        expect(detail.verdict).toEqual({
          icon: "warn",
          tone: "warn",
          text: "disallowed · policy 2",
        });
      });

      it("should say a custom message when no policy is known because the message failed to render", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: {
              ...DISALLOWED,
              policy: undefined,
              message: "The message failed.",
            },
            policy: undefined,
          })
        );

        // Assert
        expect(detail.verdict.text).toBe("disallowed · custom message");
        expect(detail.message).toBe("The message failed.");
        expect(detail.policy).toBeUndefined();
      });
    });

    describe("an allowed dependency", () => {
      it("should say allowed with the policy, in the tone and with the icon of a check, and give no message", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: {
              status: "allowed",
              policy: { index: 1, range: POLICY_RANGE },
            },
          })
        );

        // Assert
        expect(detail.verdict).toEqual({
          icon: "check",
          tone: "ok",
          text: "allowed · policy 1",
        });
        expect(detail.message).toBeUndefined();
      });

      it("should say allowed by the default when the default decided", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: {
              status: "allowed",
              policy: { index: null, range: DEFAULT_RANGE },
            },
          })
        );

        // Assert
        expect(detail.verdict.text).toBe("allowed · default");
      });
    });

    describe("a dependency that is not checked", () => {
      it("should say not checked with the reason, faint, and explain the reason in a sentence", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: { status: "not-checked", reason: "not-local" },
            policy: undefined,
          })
        );

        // Assert
        expect(detail.verdict).toEqual({
          icon: "skip",
          tone: "faint",
          text: "not checked · external",
        });
        expect(detail.message).toBe(
          "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins."
        );
        expect(detail.policy).toBeUndefined();
      });

      it("should name the reason as the plugin does when it has no other name", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: { status: "not-checked", reason: "internal" },
            policy: undefined,
          })
        );

        // Assert
        expect(detail.verdict.text).toBe("not checked · internal");
      });
    });

    describe("a dependency that is not evaluated", () => {
      it("should say not evaluated, faint, with no message and no policy", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({
            verdict: { status: "not-evaluated" },
            policy: undefined,
          })
        );

        // Assert
        expect(detail.verdict).toEqual({
          icon: "skip",
          tone: "faint",
          text: "not evaluated",
        });
        expect(detail.message).toBeUndefined();
        expect(detail.policy).toBeUndefined();
      });
    });

    describe("where the dependency is", () => {
      it("should give the file that has it, its line after a colon and the source its statement writes", () => {
        // Act
        const detail = toDependencyDetail(createFacts());

        // Assert
        expect(detail.location).toEqual({
          path: CHECKOUT,
          position: ":3",
          source: SOURCE,
        });
      });

      it("should number the line from 1 whatever the index of the dependency", () => {
        // Act
        const detail = toDependencyDetail(
          createFacts({ ref: { path: "src/index.js", index: 0 } })
        );

        // Assert
        expect(detail.location.path).toBe("src/index.js");
        expect(detail.location.position).toBe(":1");
      });

      it.each<[string, DependencyVerdict]>([
        [
          "allowed",
          { status: "allowed", policy: { index: 1, range: POLICY_RANGE } },
        ],
        ["not checked", { status: "not-checked", reason: "not-local" }],
        ["not evaluated", { status: "not-evaluated" }],
      ])(
        "should give it for a dependency that is %s too",
        (_title, verdict) => {
          // Act
          const detail = toDependencyDetail(createFacts({ verdict }));

          // Assert
          expect(detail.location).toEqual({
            path: CHECKOUT,
            position: ":3",
            source: SOURCE,
          });
        }
      );
    });

    describe("the policy", () => {
      it("should be named by the index of the policy, hold its text in pieces and open the config at its range from the dependency", () => {
        // Act
        const { policy } = toDependencyDetail(createFacts());

        // Assert
        expect(policy).toEqual({
          ref: "policies[2]",
          tokens: POLICY_TOKENS,
          target: {
            kind: "config",
            range: POLICY_RANGE,
            policy: 2,
            dependency: { path: CHECKOUT, index: 2 },
          },
        });
      });

      it("should be named default when the default decided", () => {
        // Act
        const { policy } = toDependencyDetail(
          createFacts({
            policy: {
              index: null,
              range: DEFAULT_RANGE,
              tokens: [{ kind: "string", text: '"disallow"' }],
            },
          })
        );

        // Assert
        expect(policy?.ref).toBe("default");
        expect(policy?.tokens).toEqual([
          { kind: "string", text: '"disallow"' },
        ]);
        expect(policy?.target).toEqual({
          kind: "config",
          range: DEFAULT_RANGE,
          policy: null,
          dependency: { path: CHECKOUT, index: 2 },
        });
      });

      it("should be named policies[0] for the first policy", () => {
        // Act
        const { policy } = toDependencyDetail(
          createFacts({
            policy: {
              index: 0,
              range: POLICY_RANGE,
              tokens: [{ kind: "punctuation", text: "{}" }],
            },
          })
        );

        // Assert
        expect(policy?.ref).toBe("policies[0]");
      });
    });
  });
});
