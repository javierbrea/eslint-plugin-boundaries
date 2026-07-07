import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
  DependencySingleSelectorNormalized,
  ElementDescription,
  EntityDescription,
  FileDescription,
  Matcher,
  ModuleDescription,
} from "@boundaries/elements";
import {
  DEPENDENCY_RELATIONSHIPS_MAP,
  ORIGINS_MAP,
} from "@boundaries/elements";
import type { Rule } from "eslint";

import { warnOnce, printDependenciesRuleResult } from "../Debug";
import type { EslintLiteralNode } from "../Elements";
import { getElementsMatcher } from "../Elements";
import {
  customErrorMessage,
  dependenciesRuleDefaultErrorMessage,
} from "../Messages";
import type {
  DependenciesPolicy,
  DependenciesRuleOptions,
  RuleOptionsWithPolicies,
  SettingsNormalized,
} from "../Shared";
import { RULE_NAMES_MAP } from "../Shared";

jest.mock("../Debug", () => ({
  warnOnce: jest.fn(),
  printDependenciesRuleResult: jest.fn(),
}));

jest.mock("../Elements", () => ({
  getElementsMatcher: jest.fn(),
}));

jest.mock("../Messages", () => ({
  customErrorMessage: jest.fn((msg: string) => `custom-message::${msg}`),
  dependenciesRuleDefaultErrorMessage: jest.fn(() => `default-message`),
}));

jest.mock("./Support", () => ({
  dependencyRule: jest.fn(
    (
      meta: unknown,
      handler: (args: {
        dependency: DependencyDescription;
        node: EslintLiteralNode;
        context: Rule.RuleContext;
        settings: SettingsNormalized;
        options?: DependenciesRuleOptions;
      }) => void
    ) => ({ meta, handler })
  ),
}));

import getDependencyRule, {
  buildErrorMessage,
  evaluatePolicies,
  evaluatePoliciesAndReport,
  resolveCustomMessage,
} from "./Dependencies";
import { dependencyRule } from "./Support";

const warnOnceMock = warnOnce as jest.MockedFunction<typeof warnOnce>;
const printDependenciesRuleResultMock =
  printDependenciesRuleResult as jest.MockedFunction<
    typeof printDependenciesRuleResult
  >;
const getElementsMatcherMock = getElementsMatcher as jest.MockedFunction<
  typeof getElementsMatcher
>;
const customErrorMessageMock = customErrorMessage as jest.MockedFunction<
  typeof customErrorMessage
>;
const dependenciesRuleDefaultErrorMessageMock =
  dependenciesRuleDefaultErrorMessage as jest.MockedFunction<
    typeof dependenciesRuleDefaultErrorMessage
  >;
const dependencyRuleMock = dependencyRule as jest.MockedFunction<
  typeof dependencyRule
>;

type DependencyRuleHandler = (args: {
  dependency: DependencyDescription;
  node: EslintLiteralNode;
  context: Rule.RuleContext;
  settings: SettingsNormalized;
  options?: DependenciesRuleOptions;
}) => void;

type EntityDescriptionOverrides = {
  element?: Partial<ElementDescription>;
  file?: Partial<FileDescription>;
  module?: Partial<ModuleDescription>;
};

const createEntityDescription = (
  overrides: EntityDescriptionOverrides = {}
): EntityDescription => ({
  element: {
    path: "/repo/src/default/index.ts",
    types: ["default"],
    category: null,
    filePath: "/repo/src/default/index.ts",
    fileInternalPath: "index.ts",
    captured: null,
    parents: [],
    isIgnored: false,
    isUnknown: false,
    ...overrides.element,
  },
  file: {
    path: "/repo/src/default/index.ts",
    categories: ["default"],
    captured: null,
    isIgnored: false,
    isUnknown: false,
    ...overrides.file,
  },
  module: {
    origin: "local",
    source: null,
    internalPath: null,
    ...overrides.module,
  },
});

const createDependencyDescription = (
  overrides: Partial<DependencyDescription> = {}
): DependencyDescription => ({
  from: createEntityDescription(),
  to: createEntityDescription(),
  dependency: {
    source: "@scope/helpers",
    kind: "value",
    nodeKind: "ImportDeclaration",
    specifiers: ["foo"],
    relationship: { from: "sibling", to: "sibling" },
  },
  ...overrides,
});

const createSettings = (
  overrides: Partial<SettingsNormalized> = {}
): SettingsNormalized =>
  ({
    elementDescriptors: [],
    fileDescriptors: [],
    ignorePaths: undefined,
    includePaths: undefined,
    rootPath: "/repo",
    dependencyNodes: [],
    legacyTemplates: false,
    elementsSingleType: false,
    cache: false,
    flagAsExternal: {},
    debug: {
      enabled: false,
      filter: {},
      messages: { files: false, dependencies: false, violations: false },
    },
    ...overrides,
  }) as SettingsNormalized;

const createMatcher = (): Matcher =>
  ({
    getDependencySelectorMatchingDescription: jest.fn(),
    getEntitySelectorMatchingDescription: jest.fn(),
  }) as unknown as Matcher;

const setMatcherReturns = (
  matcher: Matcher,
  values: Array<Record<string, unknown> | null>
): void => {
  const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
  values.forEach((v) => fn.mockReturnValueOnce(v));
};

describe("Dependencies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("evaluatePolicies", () => {
    it("returns allowed when there are no rules", () => {
      const matcher = createMatcher();

      const result = evaluatePolicies(
        [],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        ruleIndex: null,
        matchResult: null,
      });
    });

    it("returns allowed:true on allow match", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: "allow" }]);

      const result = evaluatePolicies(
        [
          {
            from: { element: { type: "component" } },
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({ allowed: true });
    });

    it("returns allowed:false on disallow match", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: "disallow" }]);

      const result = evaluatePolicies(
        [{ disallow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        ruleIndex: 0,
        matchResult: { matched: "disallow" },
      });
    });

    it("does not evaluate allow when disallow matched within the same rule", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      // disallow matches → allow should not be called
      fn.mockReturnValueOnce({ matched: true });

      const result = evaluatePolicies(
        [
          {
            disallow: [{ to: [{ element: [{ type: "x" }] }] }],
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        ruleIndex: 0,
        matchResult: { matched: true },
      });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("uses last-write-wins across multiple rules", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      // rule 0 disallow matches, rule 1 allow matches → final allowed
      fn.mockReturnValueOnce({ rule: 0 }).mockReturnValueOnce({ rule: 1 });

      const result = evaluatePolicies(
        [
          { disallow: [{ to: [{ element: [{ type: "x" }] }] }] },
          { allow: [{ to: [{ element: [{ type: "x" }] }] }] },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({ allowed: true });
    });

    it("iterates multiple disallow entries until a match is found", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null).mockReturnValueOnce({ matched: "second" });

      const result = evaluatePolicies(
        [
          {
            disallow: [
              { to: [{ element: [{ type: "x" }] }] },
              { to: [{ element: [{ type: "y" }] }] },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        ruleIndex: 0,
        matchResult: { matched: "second" },
      });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("memoizes normalized rule options between calls for the same rule reference", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);

      const rule: DependenciesPolicy = {
        allow: [{ to: [{ element: [{ type: "x" }] }] }],
      };
      evaluatePolicies(
        [rule],
        createDependencyDescription(),
        matcher,
        createSettings()
      );
      evaluatePolicies(
        [rule],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      // Both invocations should have produced the same selector reference
      const firstSelector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const secondSelector = fn.mock
        .calls[1][1] as DependencySingleSelectorNormalized;
      expect(firstSelector).toBe(secondSelector);
    });

    it("merges outer from element selector into object entry allow", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "component" }] }],
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.from).toBeDefined();
      expect(selector.to).toBeDefined();
    });

    it("merges outer to selector with object entry on disallow", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            to: [{ element: [{ type: "helper" }] }],
            disallow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.from).toBeDefined();
      expect(selector.to).toBeDefined();
    });

    it("merges outer dependency selector with entry dependency", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            dependency: [{ kind: "type" }],
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.dependency).toBeDefined();
      // dependency entries combine kind + source
      const dep = selector.dependency as Array<Record<string, unknown>>;
      expect(dep[0]).toMatchObject({ kind: "type", source: "@scope/x" });
    });

    it("uses outer dependency when entry has no dependency", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            dependency: [{ kind: "type" }],
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.dependency).toEqual([{ kind: "type" }]);
    });

    it("uses entry dependency when outer dependency is undefined", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [{ allow: [{ dependency: [{ source: "@scope/x" }] }] }],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.dependency).toEqual([{ source: "@scope/x" }]);
    });

    it("merges file selectors from outer and entry", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [
              {
                file: [{ categories: ["ui"], captured: { scope: "front" } }],
              },
            ],
            allow: [
              {
                from: [
                  {
                    file: [
                      { categories: ["feature"], captured: { team: "core" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const fileEntry = (fromEntry.file as Array<Record<string, unknown>>)[0];
      expect(fileEntry.captured).toEqual({ scope: "front", team: "core" });
    });

    it("uses outer file selector when entry has no file", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ file: [{ categories: ["ui"] }] }],
            allow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      expect(fromEntry.file).toEqual([{ categories: ["ui"] }]);
    });

    it("uses entry file selector when outer has no file", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "component" }] }],
            allow: [{ from: [{ file: [{ categories: ["ui"] }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      expect(fromEntry.file).toEqual([{ categories: ["ui"] }]);
    });

    it("merges module selectors from outer and entry", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            to: [{ module: [{ origin: "external" }] }],
            allow: [{ to: [{ module: [{ source: "@scope/x" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const toEntry = (selector.to as Array<Record<string, unknown>>)[0];
      const moduleEntry = (toEntry.module as Array<Record<string, unknown>>)[0];
      expect(moduleEntry).toMatchObject({
        origin: "external",
        source: "@scope/x",
      });
    });

    it("uses outer module when entry has no module", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            to: [{ module: [{ origin: "external" }] }],
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const toEntry = (selector.to as Array<Record<string, unknown>>)[0];
      expect(toEntry.module).toEqual([{ origin: "external" }]);
    });

    it("uses entry module when outer has no module", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: [{ to: [{ module: [{ origin: "external" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const toEntry = (selector.to as Array<Record<string, unknown>>)[0];
      expect(toEntry.module).toEqual([{ origin: "external" }]);
    });

    it("merges captured values on element selectors", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [
              {
                element: [{ type: "component", captured: { family: "atoms" } }],
              },
            ],
            allow: [
              {
                from: [
                  {
                    element: [{ type: "component", captured: { area: "ui" } }],
                  },
                ],
              },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.captured).toEqual({ family: "atoms", area: "ui" });
    });

    it("merges relationship values inside dependency info selectors", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            dependency: [{ relationship: { from: "sibling" } }],
            allow: [{ dependency: [{ relationship: { to: "child" } }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const dep = selector.dependency as Array<Record<string, unknown>>;
      expect(dep[0].relationship).toEqual({ from: "sibling", to: "child" });
    });

    it("keeps outer relationship when entry dependency selector has no relationship", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            dependency: [{ relationship: { from: "sibling" } }],
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const dep = selector.dependency as Array<Record<string, unknown>>;
      expect(dep[0]).toEqual({
        relationship: { from: "sibling" },
        source: "@scope/x",
      });
    });

    it("uses entry relationship when outer dependency selector has no relationship", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            dependency: [{ source: "@scope/x" }],
            allow: [{ dependency: [{ relationship: { to: "child" } }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const dep = selector.dependency as Array<Record<string, unknown>>;
      expect(dep[0]).toEqual({
        relationship: { to: "child" },
        source: "@scope/x",
      });
    });

    it("merges parent selectors when only one side has captured values", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [
              {
                element: [
                  {
                    parent: [{ type: "module", captured: { area: "primary" } }],
                  },
                ],
              },
            ],
            allow: [
              {
                from: [{ element: [{ parent: [{ type: "module" }] }] }],
              },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      const parentEntries = elementEntry.parent as Array<
        Record<string, unknown>
      >;
      expect(parentEntries[0].captured).toEqual({ area: "primary" });
    });

    it("merges file selectors when only one side has captured values", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [
              { file: [{ categories: ["ui"], captured: { scope: "front" } }] },
            ],
            allow: [{ from: [{ file: [{ categories: ["feature"] }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const fileEntry = (fromEntry.file as Array<Record<string, unknown>>)[0];
      expect(fileEntry.categories).toEqual(["feature"]);
      expect(fileEntry.captured).toEqual({ scope: "front" });
    });

    it("merges element selectors when only one side has captured values", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [
              {
                element: [{ type: "component", captured: { family: "atoms" } }],
              },
            ],
            allow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.captured).toEqual({ family: "atoms" });
    });

    it("merges parent selectors with captured values", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [
              {
                element: [
                  {
                    parent: [{ type: "module", captured: { area: "primary" } }],
                  },
                ],
              },
            ],
            allow: [
              {
                from: [
                  {
                    element: [
                      {
                        parent: [
                          {
                            type: "module",
                            captured: { layer: "ui" },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      const parentEntries = elementEntry.parent as Array<
        Record<string, unknown>
      >;
      expect(parentEntries[0].captured).toEqual({
        area: "primary",
        layer: "ui",
      });
    });

    it("returns null parent when entry parent is null", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "a", parent: [{ type: "module" }] }] }],
            allow: [{ from: [{ element: [{ type: "a", parent: null }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.parent).toBeNull();
    });

    it("returns null parent when outer parent is null and entry has no parent", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "a", parent: null }] }],
            allow: [{ from: [{ element: [{ type: "b" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.parent).toBeNull();
    });

    it("uses entry parent when outer parent is null and entry parent is defined", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "a", parent: null }] }],
            allow: [
              {
                from: [
                  {
                    element: [{ type: "a", parent: [{ type: "module" }] }],
                  },
                ],
              },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.parent).toEqual([{ type: "module" }]);
    });

    it("uses outer parent when entry has no parent", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "a", parent: [{ type: "module" }] }] }],
            allow: [{ from: [{ element: [{ type: "a" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.parent).toEqual([{ type: "module" }]);
    });

    it("uses entry parent when outer has no parent", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "a" }] }],
            allow: [
              {
                from: [
                  { element: [{ type: "a", parent: [{ type: "module" }] }] },
                ],
              },
            ],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      const elementEntry = (
        fromEntry.element as Array<Record<string, unknown>>
      )[0];
      expect(elementEntry.parent).toEqual([{ type: "module" }]);
    });

    it("returns outer element when entry has no element", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "component" }] }],
            allow: [{ from: [{ file: [{ categories: ["ui"] }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      expect(fromEntry.element).toEqual([{ type: "component" }]);
    });

    it("returns entry element when outer has no element", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ file: [{ categories: ["ui"] }] }],
            allow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const fromEntry = (selector.from as Array<Record<string, unknown>>)[0];
      expect(fromEntry.element).toEqual([{ type: "component" }]);
    });

    it("treats legacy string entry as the 'to' selector when outer from is present", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "component" }] }],
            allow: ["helper"],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.from).toBeDefined();
      expect(selector.to).toBeDefined();
    });

    it("treats legacy string entry as the 'from' selector when outer from is absent", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: ["component"],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.from).toBeDefined();
      expect(selector.to).toBeDefined();
    });

    it("applies legacy importKind by adding kind to entry dependency selectors", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            importKind: "type",
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      const dep = selector.dependency as Array<Record<string, unknown>>;
      expect(dep[0]).toMatchObject({ kind: "type", source: "@scope/x" });
    });

    it("applies legacy importKind by injecting dependency entry when none exists", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [
          {
            importKind: "type",
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.dependency).toEqual([{ kind: "type" }]);
    });

    it("does not modify selectors when importKind is undefined", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [{ allow: [{ to: [{ element: [{ type: "helper" }] }] }] }],
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;
      expect(selector.dependency).toBeUndefined();
    });

    it("passes legacy captured template data with 'from' direction when rule has from", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      const dependency = createDependencyDescription({
        from: createEntityDescription({
          element: { captured: { family: "atoms" } },
        }),
        to: createEntityDescription({
          element: { captured: { team: "core" } },
        }),
      });

      evaluatePolicies(
        [
          {
            from: [{ element: [{ type: "a" }] }],
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ],
        dependency,
        matcher,
        createSettings({ legacyTemplates: true })
      );

      const opts = fn.mock.calls[0][2] as { extraTemplateData: unknown };
      expect(opts.extraTemplateData).toEqual({
        family: "atoms",
        from: { family: "atoms" },
        to: { team: "core" },
      });
    });

    it("passes legacy captured template data with 'to' direction when rule has no from", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      const dependency = createDependencyDescription({
        from: createEntityDescription({
          element: { captured: { family: "atoms" } },
        }),
        to: createEntityDescription({
          element: { captured: { team: "core" } },
        }),
      });

      evaluatePolicies(
        [
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ],
        dependency,
        matcher,
        createSettings({ legacyTemplates: true })
      );

      const opts = fn.mock.calls[0][2] as { extraTemplateData: unknown };
      expect(opts.extraTemplateData).toEqual({
        team: "core",
        from: { family: "atoms" },
        to: { team: "core" },
      });
    });

    it("returns empty template data when legacyTemplates is disabled", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce(null);

      evaluatePolicies(
        [{ allow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        createDependencyDescription(),
        matcher,
        createSettings({ legacyTemplates: false })
      );

      const opts = fn.mock.calls[0][2] as { extraTemplateData: unknown };
      expect(opts.extraTemplateData).toEqual({});
    });
  });

  describe("resolveCustomMessage", () => {
    it("returns undefined when neither policy message nor options message is set", () => {
      expect(
        resolveCustomMessage(0, { policies: [{ from: undefined }] })
      ).toBeUndefined();
    });

    it("returns the policy message when available", () => {
      const result = resolveCustomMessage(1, {
        message: "global",
        policies: [{}, { message: "policy-msg" }],
      });
      expect(result).toBe("policy-msg");
    });

    it("falls back to the options message when there is no policy message", () => {
      const result = resolveCustomMessage(0, {
        message: "global",
        policies: [{}],
      });
      expect(result).toBe("global");
    });

    it("returns the options message when ruleIndex is null", () => {
      const result = resolveCustomMessage(null, {
        message: "global",
        policies: [{ message: "policy" }],
      });
      expect(result).toBe("global");
    });

    it("reads from the deprecated 'rules' alias when 'policies' is not set", () => {
      const result = resolveCustomMessage(1, {
        message: "global",
        rules: [{}, { message: "rule-msg" }],
      });
      expect(result).toBe("rule-msg");
    });

    it("prefers 'policies' over 'rules' when both are set", () => {
      const result = resolveCustomMessage(0, {
        message: "global",
        policies: [{ message: "policy-msg" }],
        rules: [{ message: "rule-msg" }],
      });
      expect(result).toBe("policy-msg");
    });
  });

  describe("buildErrorMessage", () => {
    it("delegates to customErrorMessage when a custom message is provided", () => {
      const dependency = createDependencyDescription();
      const result = buildErrorMessage({
        matchResult: null,
        ruleIndex: 2,
        customMessage: "boom",
        dependency,
      });

      expect(customErrorMessageMock).toHaveBeenCalledWith(
        "boom",
        dependency,
        2,
        null
      );
      expect(result).toBe("custom-message::boom");
    });

    it("uses the default message when there is no custom message", () => {
      const dependency = createDependencyDescription();
      const result = buildErrorMessage({
        matchResult: {
          matched: true,
        } as unknown as DependencySingleSelectorMatchResult,
        ruleIndex: 0,
        customMessage: undefined,
        dependency,
      });

      expect(dependenciesRuleDefaultErrorMessageMock).toHaveBeenCalledWith(
        { matched: true },
        0,
        dependency
      );
      expect(result).toBe("default-message");
    });
  });

  describe("evaluatePoliciesAndReport", () => {
    const createReportContext = () => {
      const report = jest.fn();
      return {
        context: { report } as unknown as Rule.RuleContext,
        report,
      };
    };

    const baseNode = {} as EslintLiteralNode;

    it("does not report when a rule allows the dependency", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: true }]);
      getElementsMatcherMock.mockReturnValue(matcher);
      const { context, report } = createReportContext();

      evaluatePoliciesAndReport({
        rules: [{ allow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
      });

      expect(report).not.toHaveBeenCalled();
      expect(printDependenciesRuleResultMock).not.toHaveBeenCalled();
    });

    it("does not report when no rule matches and default policy is allow", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);
      getElementsMatcherMock.mockReturnValue(matcher);
      const { context, report } = createReportContext();

      evaluatePoliciesAndReport({
        rules: [{ allow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
        options: { default: "allow" },
      });

      expect(report).not.toHaveBeenCalled();
    });

    it("reports when no rule matches and default policy is deny", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);
      getElementsMatcherMock.mockReturnValue(matcher);
      const { context, report } = createReportContext();

      evaluatePoliciesAndReport({
        rules: [{ allow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
        options: { default: "disallow" },
      });

      expect(printDependenciesRuleResultMock).toHaveBeenCalledTimes(1);
      expect(report).toHaveBeenCalledTimes(1);
      expect(report.mock.calls[0][0]).toMatchObject({
        message: "default-message",
        node: baseNode,
      });
    });

    it("reports when a rule disallows the dependency and resolves rule-level custom message", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: true }]);
      getElementsMatcherMock.mockReturnValue(matcher);
      const { context, report } = createReportContext();

      const rules = [
        {
          disallow: [{ to: [{ element: [{ type: "x" }] }] }],
          message: "rule-level",
        },
      ];

      evaluatePoliciesAndReport({
        rules,
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
        options: {
          message: "global",
          policies: rules,
        } as RuleOptionsWithPolicies,
      });

      expect(report).toHaveBeenCalledTimes(1);
      expect(customErrorMessageMock).toHaveBeenCalledWith(
        "rule-level",
        expect.anything(),
        0,
        { matched: true }
      );
    });

    it("does not throw when options is undefined and falls back to default policy", () => {
      const matcher = createMatcher();
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);
      getElementsMatcherMock.mockReturnValue(matcher);
      const { context, report } = createReportContext();

      evaluatePoliciesAndReport({
        rules: [],
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
      });

      expect(report).toHaveBeenCalledTimes(1);
    });
  });

  describe("getDependencyRule (default export)", () => {
    const callHandler = (
      ruleName: Parameters<typeof getDependencyRule>[0],
      args: Parameters<DependencyRuleHandler>[0]
    ): void => {
      getDependencyRule(ruleName);
      const lastCall =
        dependencyRuleMock.mock.calls[dependencyRuleMock.mock.calls.length - 1];
      const handler = lastCall[1] as DependencyRuleHandler;
      handler(args);
    };

    const createCallArgs = (
      dependency: DependencyDescription,
      options?: DependenciesRuleOptions
    ) => ({
      dependency,
      node: {} as EslintLiteralNode,
      context: { report: jest.fn() } as unknown as Rule.RuleContext,
      settings: createSettings(),
      options,
    });

    const localDependency = (
      overrides: Partial<EntityDescription["element"]> = {},
      relationshipTo: "internal" | "child" | "sibling" | "parent" = "sibling"
    ): DependencyDescription =>
      createDependencyDescription({
        to: createEntityDescription({
          element: {
            isUnknown: false,
            ...overrides,
          },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
        dependency: {
          source: "./helper",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["x"],
          relationship: { from: "sibling", to: relationshipTo },
        },
      });

    it("does not emit deprecation warning when called with the default rule name", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);

      callHandler(
        undefined as unknown as Parameters<typeof getDependencyRule>[0],
        createCallArgs(localDependency(), { default: "allow" })
      );

      expect(warnOnceMock).not.toHaveBeenCalled();
    });

    it("emits deprecation warning when called with the ELEMENT_TYPES rule name", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);

      callHandler(
        RULE_NAMES_MAP.ELEMENT_TYPES,
        createCallArgs(localDependency(), { default: "allow" })
      );

      expect(warnOnceMock).toHaveBeenCalledTimes(1);
      expect(warnOnceMock.mock.calls[0][0]).toContain(
        RULE_NAMES_MAP.ELEMENT_TYPES
      );
    });

    it("skips evaluation when dependency.to.file.isIgnored is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription({
        to: createEntityDescription({ file: { isIgnored: true } }),
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, createCallArgs(dependency));

      expect(getElementsMatcherMock).not.toHaveBeenCalled();
    });

    it("still skips local dependencies with dependency.to.file.isIgnored when checkAllOrigins is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, { checkAllOrigins: true })
      );

      expect(getElementsMatcherMock).not.toHaveBeenCalled();
    });

    it("evaluates ignored external modules when checkAllOrigins is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce({ matched: true });

      const dependency = createDependencyDescription({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.EXTERNAL, source: "zod" },
        }),
        dependency: {
          source: "zod",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["z"],
          relationship: { from: "sibling", to: "sibling" },
        },
      });
      const args = createCallArgs(dependency, {
        checkAllOrigins: true,
        default: "disallow",
        policies: [
          {
            from: { element: { type: "default" } },
            allow: {
              to: { module: { origin: "external", source: "zod" } },
            },
          },
        ],
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, args);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("reports ignored external modules not covered by an allow policy when checkAllOrigins is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);

      const dependency = createDependencyDescription({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.EXTERNAL, source: "zod" },
        }),
        dependency: {
          source: "zod",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["z"],
          relationship: { from: "sibling", to: "sibling" },
        },
      });
      const args = createCallArgs(dependency, {
        checkAllOrigins: true,
        default: "disallow",
        policies: [],
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, args);

      expect(getElementsMatcherMock).toHaveBeenCalledTimes(1);
      expect(args.context.report).toHaveBeenCalledTimes(1);
    });

    it("evaluates ignored core modules when checkAllOrigins is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce({ matched: true });

      const dependency = createDependencyDescription({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.CORE, source: "fs" },
        }),
        dependency: {
          source: "fs",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["readFileSync"],
          relationship: { from: "sibling", to: "sibling" },
        },
      });
      const args = createCallArgs(dependency, {
        checkAllOrigins: true,
        default: "disallow",
        policies: [
          {
            from: { element: { type: "default" } },
            allow: {
              to: { module: { origin: "core", source: "fs" } },
            },
          },
        ],
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, args);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(args.context.report).not.toHaveBeenCalled();
    });

    it("skips evaluation when dependency.from.file.isIgnored is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription({
        from: createEntityDescription({ file: { isIgnored: true } }),
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, createCallArgs(dependency));

      expect(getElementsMatcherMock).not.toHaveBeenCalled();
    });

    it("skips non-local dependencies when checkAllOrigins is false", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          module: { origin: ORIGINS_MAP.EXTERNAL },
        }),
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, createCallArgs(dependency));

      expect(getElementsMatcherMock).not.toHaveBeenCalled();
    });

    it("evaluates non-local dependencies when checkAllOrigins is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);

      const dependency = createDependencyDescription({
        to: createEntityDescription({
          module: { origin: ORIGINS_MAP.EXTERNAL },
        }),
      });

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, {
          checkAllOrigins: true,
          default: "allow",
        })
      );

      expect(getElementsMatcherMock).toHaveBeenCalledTimes(1);
    });

    it("skips unknown local dependencies when checkUnknownLocals is false", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          element: { isUnknown: true },
          file: { isUnknown: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, createCallArgs(dependency));

      expect(getElementsMatcherMock).not.toHaveBeenCalled();
    });

    it("evaluates unknown local dependencies when checkUnknownLocals is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          element: { isUnknown: true },
          file: { isUnknown: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, {
          checkUnknownLocals: true,
          default: "allow",
        })
      );

      expect(getElementsMatcherMock).toHaveBeenCalledTimes(1);
    });

    it("skips internal dependencies when checkInternals is false", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription({
        to: createEntityDescription({ module: { origin: ORIGINS_MAP.LOCAL } }),
        dependency: {
          source: "./helper",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["x"],
          relationship: {
            from: "sibling",
            to: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
          },
        },
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, createCallArgs(dependency));

      expect(getElementsMatcherMock).not.toHaveBeenCalled();
    });

    it("evaluates internal dependencies when checkInternals is true", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);
      const dependency = createDependencyDescription({
        to: createEntityDescription({ module: { origin: ORIGINS_MAP.LOCAL } }),
        dependency: {
          source: "./helper",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["x"],
          relationship: {
            from: "sibling",
            to: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
          },
        },
      });

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, {
          checkInternals: true,
          default: "allow",
        })
      );

      expect(getElementsMatcherMock).toHaveBeenCalledTimes(1);
    });

    it("uses an empty policies array when options.policies is undefined", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValue(null);
      const dependency = localDependency();

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, { default: "allow" })
      );

      expect(getElementsMatcherMock).toHaveBeenCalledTimes(1);
      // No policies → matcher should not be invoked
      expect(fn).not.toHaveBeenCalled();
    });

    it("evaluates policies through the wrapper when configured", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce({ matched: true });

      const dependency = localDependency();

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, {
          default: "allow",
          policies: [{ disallow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        })
      );

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("falls back to the deprecated 'rules' alias when 'policies' is not set", () => {
      const matcher = createMatcher();
      getElementsMatcherMock.mockReturnValue(matcher);
      const fn = matcher.getDependencySelectorMatchingDescription as jest.Mock;
      fn.mockReturnValueOnce({ matched: true });

      const dependency = localDependency();

      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(dependency, {
          default: "allow",
          rules: [{ disallow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        })
      );

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
