import { normalizeConfig } from "@boundaries/config";
import type {
  DependenciesRuleOptionsNormalized,
  Diagnostic,
  SettingsNormalized,
} from "@boundaries/config";
import { Elements } from "@boundaries/elements";
import type {
  DependencyDescription,
  DependencyDescriptorOptions,
} from "@boundaries/elements";

import {
  describeDependency,
  describeEntity,
  getMatcher,
} from "../Descriptions";
import {
  DEPENDENCY_SKIP_REASONS_MAP,
  evaluateDependency,
  evaluatePolicies,
} from "../Evaluation";

import { Policies } from "./Policies";

/**
 * The settings of the quick-start guide of the docs.
 */
const QUICK_START_SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module", pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
    { pattern: "**/*.css", category: "style" },
  ],
};

/**
 * The policies of the quick-start guide of the docs.
 */
const QUICK_START_POLICIES = [
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
];

/**
 * Normalizes the quick-start settings with some policies of the dependencies rule.
 * @param policies The policies of the dependencies rule.
 * @returns The normalized settings and options of the dependencies rule.
 */
function normalize(policies: unknown[] = QUICK_START_POLICIES): {
  settings: SettingsNormalized;
  options: DependenciesRuleOptionsNormalized;
} {
  const { settings, rules } = normalizeConfig(
    {
      settings: QUICK_START_SETTINGS,
      rules: {
        "boundaries/dependencies": [2, { default: "disallow", policies }],
      },
    },
    { rootPath: "/repo" }
  ).value;
  return {
    settings,
    options: rules.dependencies?.options as DependenciesRuleOptionsNormalized,
  };
}

const HELPER_IMPORTING_A_COMPONENT: DependencyDescriptorOptions = {
  from: "/repo/src/helpers/format/index.js",
  to: "/repo/src/components/atoms/Price/index.js",
  source: "../../components/atoms/Price",
  kind: "value",
  nodeKind: "import",
  specifiers: ["Price"],
};

const COMPONENT_IMPORTING_A_HELPER: DependencyDescriptorOptions = {
  from: "/repo/src/components/atoms/Price/index.js",
  to: "/repo/src/helpers/format/index.js",
  source: "../../../helpers/format",
  kind: "value",
  nodeKind: "import",
};

const MODULE_IMPORTING_A_TEST: DependencyDescriptorOptions = {
  from: "/repo/src/modules/cart/index.js",
  to: "/repo/src/components/atoms/Price/Price.spec.js",
  source: "../../components/atoms/Price/Price.spec",
  kind: "value",
  nodeKind: "import",
};

const COMPONENT_IMPORTING_A_PACKAGE: DependencyDescriptorOptions = {
  from: "/repo/src/components/atoms/Price/index.js",
  source: "react",
  kind: "value",
  nodeKind: "import",
};

/**
 * Policies whose last one disallows importing test files with a custom message that fails to render, since it calls an unknown helper.
 */
const POLICIES_WITH_A_BROKEN_MESSAGE = [
  ...QUICK_START_POLICIES.slice(0, 2),
  {
    disallow: { to: { file: { categories: "test" } } },
    message: "{{ unknownHelper from }}",
  },
];

/**
 * Returns the error that a function throws.
 * @param fn The function.
 * @returns The error that the function throws.
 */
function getThrownError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error("The function did not throw");
}

/**
 * Returns diagnostics with the stack of the error in their detail left out, since the stack can name the caller of the evaluation: the method of the class or the function of the module.
 * @param diagnostics The diagnostics of an evaluation.
 * @returns The diagnostics, with their detail parsed and without the stack of the error.
 */
function withoutErrorStacks(diagnostics: Diagnostic[]) {
  return diagnostics.map(({ detail, ...diagnostic }) => {
    const { error, ...data } = JSON.parse(String(detail).slice(0, -1));
    return { ...diagnostic, detail: { ...data, error: error.message } };
  });
}

describe("Policies", () => {
  let settings: SettingsNormalized;
  let options: DependenciesRuleOptionsNormalized;
  let policies: Policies;

  beforeEach(() => {
    jest.restoreAllMocks();
    ({ settings, options } = normalize());
    policies = new Policies();
  });

  describe("getMatcher", () => {
    it("should return the same matcher for the same settings object", () => {
      const matcher = policies.getMatcher(settings);

      expect(policies.getMatcher(settings)).toBe(matcher);
    });

    it("should build the matcher of a settings object only once", () => {
      const elementsGetMatcher = jest.spyOn(Elements.prototype, "getMatcher");

      policies.getMatcher(settings);
      policies.getMatcher(settings);

      expect(elementsGetMatcher).toHaveBeenCalledTimes(1);
    });

    it("should return the same matcher for settings objects with equal content", () => {
      const { settings: equalSettings } = normalize();

      const matcher = policies.getMatcher(settings);

      expect(equalSettings).not.toBe(settings);
      expect(equalSettings).toEqual(settings);
      expect(policies.getMatcher(equalSettings)).toBe(matcher);
    });

    it("should return different matchers for settings with different descriptors", () => {
      const otherSettings = {
        ...settings,
        elementDescriptors: settings.elementDescriptors.slice(1),
      };

      const matcher = policies.getMatcher(settings);

      expect(policies.getMatcher(otherSettings)).not.toBe(matcher);
    });

    it("should never share a matcher with another instance", () => {
      const otherPolicies = new Policies();

      const matcher = policies.getMatcher(settings);

      expect(otherPolicies.getMatcher(settings)).not.toBe(matcher);
    });

    it("should never share a matcher with the functions of the module", () => {
      const moduleMatcher = getMatcher(settings);

      const matcher = policies.getMatcher(settings);

      expect(matcher).not.toBe(moduleMatcher);
    });
  });

  describe("describeEntity", () => {
    it("should return what describeEntity returns", () => {
      const filePath = "/repo/src/components/atoms/Price/Price.spec.js";

      const description = policies.describeEntity(settings, filePath);

      expect(description).toEqual(describeEntity(settings, filePath));
      expect(description.element.types).toEqual(["component"]);
      expect(description.file.categories).toEqual(["test"]);
    });

    it("should describe the file with the matcher of the instance", () => {
      const filePath = "/repo/src/helpers/format/index.js";
      const instanceDescribeEntity = jest.spyOn(
        policies.getMatcher(settings),
        "describeEntity"
      );
      const moduleDescribeEntity = jest.spyOn(
        getMatcher(settings),
        "describeEntity"
      );

      policies.describeEntity(settings, filePath);

      expect(instanceDescribeEntity).toHaveBeenCalledWith(filePath);
      expect(moduleDescribeEntity).not.toHaveBeenCalled();
    });
  });

  describe("describeDependency", () => {
    it("should return what describeDependency returns", () => {
      const description = policies.describeDependency(
        settings,
        HELPER_IMPORTING_A_COMPONENT
      );

      expect(description).toEqual(
        describeDependency(settings, HELPER_IMPORTING_A_COMPONENT)
      );
      expect(description.from.element.types).toEqual(["helper"]);
      expect(description.to.element.types).toEqual(["component"]);
      expect(description.dependency.specifiers).toEqual(["Price"]);
    });

    it("should describe the dependency with the matcher of the instance", () => {
      const instanceDescribeDependency = jest.spyOn(
        policies.getMatcher(settings),
        "describeDependency"
      );
      const moduleDescribeDependency = jest.spyOn(
        getMatcher(settings),
        "describeDependency"
      );

      policies.describeDependency(settings, HELPER_IMPORTING_A_COMPONENT);

      expect(instanceDescribeDependency).toHaveBeenCalledWith(
        HELPER_IMPORTING_A_COMPONENT
      );
      expect(moduleDescribeDependency).not.toHaveBeenCalled();
    });
  });

  describe("evaluatePolicies", () => {
    it.each([
      {
        name: "a helper importing a component, which no policy allows",
        dependency: HELPER_IMPORTING_A_COMPONENT,
        expected: {
          allowed: false,
          policyIndex: null,
          message:
            'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
        },
      },
      {
        name: "a component importing a helper, which a policy allows",
        dependency: COMPONENT_IMPORTING_A_HELPER,
        expected: { allowed: true, policyIndex: 0 },
      },
      {
        name: "a module importing a test file, which a policy disallows",
        dependency: MODULE_IMPORTING_A_TEST,
        expected: {
          allowed: false,
          policyIndex: 2,
          message:
            'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
        },
      },
    ])(
      "should return what evaluatePolicies returns for $name",
      ({ dependency, expected }) => {
        const description = describeDependency(settings, dependency);

        const evaluation = policies.evaluatePolicies(
          settings,
          options,
          description
        );

        expect(evaluation).toEqual(
          evaluatePolicies(settings, options, description)
        );
        expect(evaluation).toMatchObject(expected);
      }
    );

    it("should return the diagnostics that evaluatePolicies returns when a selector fails to match", () => {
      ({ settings, options } = normalize([
        {
          from: { element: { type: "component" } },
          allow: { to: { element: { type: "{{#if}}" } } },
        },
      ]));
      const description = describeDependency(
        settings,
        COMPONENT_IMPORTING_A_HELPER
      );
      const moduleEvaluation = evaluatePolicies(settings, options, description);

      const evaluation = policies.evaluatePolicies(
        settings,
        options,
        description
      );

      expect(withoutErrorStacks(evaluation.diagnostics)).toEqual(
        withoutErrorStacks(moduleEvaluation.diagnostics)
      );
      expect(evaluation).toEqual({
        ...moduleEvaluation,
        diagnostics: expect.any(Array),
      });
      expect(evaluation.diagnostics).toEqual([
        expect.objectContaining({
          level: "warning",
          paths: [["policies", 0]],
          detail: expect.stringContaining("Parse error on line 1"),
        }),
      ]);
    });

    it("should throw the error that evaluatePolicies throws when a custom message fails to render", () => {
      ({ settings, options } = normalize(POLICIES_WITH_A_BROKEN_MESSAGE));
      const description = describeDependency(settings, MODULE_IMPORTING_A_TEST);
      const moduleError = getThrownError(() =>
        evaluatePolicies(settings, options, description)
      );

      const error = getThrownError(() =>
        policies.evaluatePolicies(settings, options, description)
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(moduleError.message);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause).toEqual(moduleError.cause);
      expect(error.message).toBe(
        'The custom message "{{ unknownHelper from }}" of the policy at index 2 failed to render: Missing helper: "unknownHelper"'
      );
    });

    it("should match the dependency with the matcher of the instance", () => {
      const description = describeDependency(
        settings,
        COMPONENT_IMPORTING_A_HELPER
      );
      const instanceMatch = jest.spyOn(
        policies.getMatcher(settings),
        "getDependencySelectorMatchingDescription"
      );
      const moduleMatch = jest.spyOn(
        getMatcher(settings),
        "getDependencySelectorMatchingDescription"
      );

      policies.evaluatePolicies(settings, options, description);

      expect(instanceMatch).toHaveBeenCalled();
      expect(moduleMatch).not.toHaveBeenCalled();
    });
  });

  describe("evaluateDependency", () => {
    it.each([
      {
        name: "a helper importing a component, which no policy allows",
        dependency: HELPER_IMPORTING_A_COMPONENT,
        expected: { checked: true, allowed: false, policyIndex: null },
      },
      {
        name: "a component importing a helper, which a policy allows",
        dependency: COMPONENT_IMPORTING_A_HELPER,
        expected: { checked: true, allowed: true, policyIndex: 0 },
      },
      {
        name: "a module importing a test file, which a policy disallows",
        dependency: MODULE_IMPORTING_A_TEST,
        expected: { checked: true, allowed: false, policyIndex: 2 },
      },
      {
        name: "a component importing a package, which the rule skips",
        dependency: COMPONENT_IMPORTING_A_PACKAGE,
        expected: {
          checked: false,
          reason: DEPENDENCY_SKIP_REASONS_MAP.NOT_LOCAL,
        },
      },
    ])(
      "should return what evaluateDependency returns for $name",
      ({ dependency, expected }) => {
        const description = describeDependency(settings, dependency);

        const evaluation = policies.evaluateDependency(
          settings,
          options,
          description
        );

        expect(evaluation).toEqual(
          evaluateDependency(settings, options, description)
        );
        expect(evaluation).toMatchObject(expected);
      }
    );

    it("should throw the error that evaluateDependency throws when a custom message fails to render", () => {
      ({ settings, options } = normalize(POLICIES_WITH_A_BROKEN_MESSAGE));
      const description = describeDependency(settings, MODULE_IMPORTING_A_TEST);
      const moduleError = getThrownError(() =>
        evaluateDependency(settings, options, description)
      );

      const error = getThrownError(() =>
        policies.evaluateDependency(settings, options, description)
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(moduleError.message);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error.cause).toEqual(moduleError.cause);
      expect(error.message).toBe(
        'The custom message "{{ unknownHelper from }}" of the policy at index 2 failed to render: Missing helper: "unknownHelper"'
      );
    });

    it("should build no matcher for a dependency that the rule skips", () => {
      const description: DependencyDescription = describeDependency(
        settings,
        COMPONENT_IMPORTING_A_PACKAGE
      );
      const elementsGetMatcher = jest.spyOn(Elements.prototype, "getMatcher");

      const evaluation = policies.evaluateDependency(
        settings,
        options,
        description
      );

      expect(evaluation).toEqual({
        checked: false,
        reason: DEPENDENCY_SKIP_REASONS_MAP.NOT_LOCAL,
      });
      expect(elementsGetMatcher).not.toHaveBeenCalled();
    });

    it("should build the matcher of the instance for a dependency that the rule checks", () => {
      const description = describeDependency(
        settings,
        COMPONENT_IMPORTING_A_HELPER
      );
      const elementsGetMatcher = jest.spyOn(Elements.prototype, "getMatcher");

      policies.evaluateDependency(settings, options, description);

      expect(elementsGetMatcher).toHaveBeenCalledTimes(1);
      expect(elementsGetMatcher).toHaveReturnedWith(
        policies.getMatcher(settings)
      );
    });
  });
});
