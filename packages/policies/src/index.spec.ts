import { normalizeConfig } from "@boundaries/config";
import type { DependenciesRuleOptionsNormalized } from "@boundaries/config";
import type { DependencyDescriptorOptions } from "@boundaries/elements";

import {
  DEPENDENCY_SKIP_REASONS_MAP,
  describeDependency,
  describeEntity,
  evaluateDependency,
} from "./index";

/**
 * The configuration of the quick-start guide of the docs.
 */
const QUICK_START_CONFIG = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*/*" },
      { type: "module", pattern: "modules/*" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      2,
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "component" } },
            allow: { to: { element: { type: "helper" } } },
          },
          {
            from: { element: { type: "module" } },
            allow: { to: { element: { types: ["component", "helper"] } } },
          },
          {
            disallow: { to: { file: { categories: "test" } } },
          },
        ],
      },
    ],
  },
};

const { settings, rules } = normalizeConfig(QUICK_START_CONFIG, {
  rootPath: "/repo",
}).value;
const options = rules.dependencies
  ?.options as DependenciesRuleOptionsNormalized;

/**
 * Describes and evaluates a dependency of the quick-start example as the dependencies rule does.
 * @param dependency The dependency, as a host without a resolver passes it.
 * @returns The evaluation of the dependency.
 */
function evaluate(dependency: Omit<DependencyDescriptorOptions, "kind">) {
  return evaluateDependency(
    settings,
    options,
    describeDependency(settings, { kind: "value", ...dependency })
  );
}

describe("policies", () => {
  describe("describeEntity", () => {
    it("should classify a file of the quick-start example", () => {
      const description = describeEntity(
        settings,
        "/repo/src/components/atoms/Price/Price.spec.js"
      );

      expect(description.element.types).toEqual(["component"]);
      expect(description.file.categories).toEqual(["test"]);
    });
  });

  describe("evaluateDependency", () => {
    it("should report what the plugin reports for a helper importing a component", () => {
      const evaluation = evaluate({
        from: "/repo/src/helpers/format/index.js",
        to: "/repo/src/components/atoms/Price/index.js",
        source: "../../components/atoms/Price",
        nodeKind: "import",
      });

      expect(evaluation).toEqual({
        checked: true,
        allowed: false,
        policyIndex: null,
        match: null,
        message:
          'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
        diagnostics: [],
      });
    });

    it("should return the policy that allows a component importing a helper", () => {
      const evaluation = evaluate({
        from: "/repo/src/components/atoms/Price/index.js",
        to: "/repo/src/helpers/format/index.js",
        source: "../../../helpers/format",
        nodeKind: "import",
      });

      expect(evaluation).toMatchObject({
        checked: true,
        allowed: true,
        policyIndex: 0,
      });
      expect(evaluation).not.toHaveProperty("message");
    });

    it("should return the policy that disallows a module importing a test file", () => {
      const evaluation = evaluate({
        from: "/repo/src/modules/cart/index.js",
        to: "/repo/src/components/atoms/Price/Price.spec.js",
        source: "../../components/atoms/Price/Price.spec",
        nodeKind: "import",
      });

      expect(evaluation).toMatchObject({
        checked: true,
        allowed: false,
        policyIndex: 2,
        message:
          'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
      });
    });

    it("should skip an external dependency, as the rule does by default", () => {
      const evaluation = evaluate({
        from: "/repo/src/components/atoms/Price/index.js",
        source: "react",
        nodeKind: "import",
      });

      expect(evaluation).toEqual({
        checked: false,
        reason: DEPENDENCY_SKIP_REASONS_MAP.NOT_LOCAL,
      });
    });
  });
});
