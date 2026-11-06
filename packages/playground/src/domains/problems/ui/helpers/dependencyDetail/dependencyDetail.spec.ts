import type { SketchDependency } from "@/contract";
import type {
  ConfigToken,
  DependencyVerdict,
  FileDescription,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type { DependencyDetailFacts } from "@/domains/problems/helpers/problemSelectors";

import { toDependencyDetail } from "./dependencyDetail";

const CHECKOUT = "src/modules/checkout/index.js";

const SPEC_FILE = "src/components/atoms/Button/Button.spec.js";

const POLICY_RANGE: TextRange = { from: 40, to: 90, line: 3, column: 9 };

const DEFAULT_RANGE: TextRange = { from: 100, to: 110, line: 8, column: 5 };

const DEPENDENCY: SketchDependency = {
  from: CHECKOUT,
  target: { kind: "node", path: SPEC_FILE },
  syntax: "import",
  importKind: "value",
  specifiers: [{ kind: "named", name: "renderButton" }],
};

const DESCRIPTION: FileDescription = {
  element: {
    types: ["component"],
    path: "src/components/atoms/Button",
    captured: null,
  },
  file: { categories: ["test"] },
  module: { origin: "local" },
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
  overrides: Partial<Pick<DependencyDetailFacts, "description" | "policy">> & {
    verdict?: DependencyVerdict;
    dependency?: SketchDependency;
  } = {}
): DependencyDetailFacts {
  const { verdict = DISALLOWED, dependency = DEPENDENCY, ...rest } = overrides;

  return {
    subject: { kind: "dependency", ref: { path: CHECKOUT, index: 2 } },
    result: {
      dependency,
      ref: { path: CHECKOUT, index: 2 },
      source: "../../components/atoms/Button/Button.spec",
      verdict,
    },
    description: DESCRIPTION,
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

    describe("the facts", () => {
      it("should list where it points to, the element and the file categories, the kind and the syntax of the mockup", () => {
        // Act
        const { facts } = toDependencyDetail(createFacts());

        // Assert
        expect(facts).toEqual([
          { label: "to", value: SPEC_FILE },
          { label: "element", value: "component" },
          { label: "file", value: "test" },
          { label: "kind", value: "value" },
          { label: "syntax", value: "import" },
        ]);
      });

      it("should point to the name of an external module and have no element and no file", () => {
        // Act
        const { facts } = toDependencyDetail(
          createFacts({
            dependency: {
              ...DEPENDENCY,
              target: { kind: "external", name: "react" },
            },
            description: undefined,
          })
        );

        // Assert
        expect(facts).toEqual([
          { label: "to", value: "react" },
          { label: "element", value: null },
          { label: "file", value: null },
          { label: "kind", value: "value" },
          { label: "syntax", value: "import" },
        ]);
      });

      it("should join the types of the element and the categories of the file", () => {
        // Act
        const { facts } = toDependencyDetail(
          createFacts({
            description: {
              ...DESCRIPTION,
              element: { ...DESCRIPTION.element, types: ["component", "atom"] },
              file: { categories: ["test", "style"] },
            },
          })
        );

        // Assert
        expect(facts[1]).toEqual({
          label: "element",
          value: "component, atom",
        });
        expect(facts[2]).toEqual({ label: "file", value: "test, style" });
      });

      it.each<
        [
          string,
          FileDescription["element"]["types"],
          FileDescription["file"]["categories"],
        ]
      >([
        ["null", null, null],
        ["empty", [], []],
      ])(
        "should have no element and no file when the plugin gives %s lists",
        (_title, types, categories) => {
          // Act
          const { facts } = toDependencyDetail(
            createFacts({
              description: {
                ...DESCRIPTION,
                element: { ...DESCRIPTION.element, types },
                file: { categories },
              },
            })
          );

          // Assert
          expect(facts[1].value).toBeNull();
          expect(facts[2].value).toBeNull();
        }
      );

      it("should have no element and no file for a file that the evaluation did not describe", () => {
        // Act
        const { facts } = toDependencyDetail(
          createFacts({ description: undefined })
        );

        // Assert
        expect(facts[1].value).toBeNull();
        expect(facts[2].value).toBeNull();
      });

      it("should say type for a type import", () => {
        // Act
        const { facts } = toDependencyDetail(
          createFacts({ dependency: { ...DEPENDENCY, importKind: "type" } })
        );

        // Assert
        expect(facts[3]).toEqual({ label: "kind", value: "type" });
      });

      it.each<[SketchDependency["syntax"], string]>([
        ["import", "import"],
        ["export-from", "export … from"],
        ["require", "require()"],
        ["dynamic-import", "import()"],
      ])(
        "should label the syntax %s as %s, as the picker does",
        (syntax, label) => {
          // Act
          const { facts } = toDependencyDetail(
            createFacts({ dependency: { ...DEPENDENCY, syntax } })
          );

          // Assert
          expect(facts[4]).toEqual({ label: "syntax", value: label });
        }
      );
    });

    describe("the card of the policy", () => {
      it("should be headed by the index of the policy as a comment, hold its text in pieces and open the config at its range from the dependency", () => {
        // Act
        const { policy } = toDependencyDetail(createFacts());

        // Assert
        expect(policy).toEqual({
          heading: "// policies[2]",
          tokens: POLICY_TOKENS,
          target: {
            kind: "config",
            range: POLICY_RANGE,
            dependency: { path: CHECKOUT, index: 2 },
          },
        });
      });

      it("should be headed by the default when the default decided", () => {
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
        expect(policy?.heading).toBe("// default");
        expect(policy?.tokens).toEqual([
          { kind: "string", text: '"disallow"' },
        ]);
        expect(policy?.target).toEqual({
          kind: "config",
          range: DEFAULT_RANGE,
          dependency: { path: CHECKOUT, index: 2 },
        });
      });

      it("should be headed by the first policy as policies[0]", () => {
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
        expect(policy?.heading).toBe("// policies[0]");
      });
    });
  });
});
