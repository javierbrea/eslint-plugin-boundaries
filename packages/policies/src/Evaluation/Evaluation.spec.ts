import { normalizeDependenciesRuleOptions } from "@boundaries/config";
import type {
  DependenciesPolicy,
  DependenciesPolicyNormalized,
  DependenciesRuleOptions,
  SettingsNormalized,
} from "@boundaries/config";
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

import { getMatcher } from "../Descriptions";
import {
  customErrorMessage,
  dependenciesRuleDefaultErrorMessage,
} from "../Messages";

import {
  buildErrorMessage,
  evaluateDependency,
  evaluatePolicies,
  getDependencySkipReason,
  resolveCustomMessage,
} from "./Evaluation";

jest.mock("../Descriptions");
jest.mock("../Messages");

const getMatcherMock = jest.mocked(getMatcher);
const customErrorMessageMock = jest.mocked(customErrorMessage);
const dependenciesRuleDefaultErrorMessageMock = jest.mocked(
  dependenciesRuleDefaultErrorMessage
);

/**
 * Normalizes policies as the rules do before evaluating them.
 * @param policies - The policies, as the user writes them.
 * @returns The normalized policies.
 */
function normalizePolicies(policies: DependenciesPolicy[]) {
  return normalizeDependenciesRuleOptions({ policies }).policies;
}

/**
 * Normalizes the options of the dependencies rule.
 * @param options - The options, as the user writes them.
 * @returns The normalized options.
 */
function normalizeOptions(options?: DependenciesRuleOptions) {
  return normalizeDependenciesRuleOptions(options);
}

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
    elementsSingleMatch: false,
    filesSingleMatch: false,
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
  const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
  values.forEach((v) => fn.mockReturnValueOnce(v));
};

/**
 * Evaluates normalized policies with a given matcher and the default options.
 * @param policies - The normalized policies.
 * @param dependency - The dependency description.
 * @param matcher - The matcher that `getMatcher` returns.
 * @param settings - The normalized settings.
 * @returns The evaluation.
 */
function evaluateWithMatcher(
  policies: DependenciesPolicyNormalized[],
  dependency: DependencyDescription,
  matcher: Matcher,
  settings: SettingsNormalized
) {
  getMatcherMock.mockReturnValue(matcher);
  return evaluatePolicies(
    settings,
    { ...normalizeOptions(), policies },
    dependency
  );
}

describe("Evaluation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    customErrorMessageMock.mockImplementation(
      (message: string) => `custom-message::${message}`
    );
    dependenciesRuleDefaultErrorMessageMock.mockReturnValue("default-message");
  });

  describe("evaluatePolicies", () => {
    it("returns the default effect when there are no policies", () => {
      const matcher = createMatcher();

      const result = evaluateWithMatcher(
        normalizePolicies([]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        policyIndex: null,
        match: null,
        message: "default-message",
        diagnostics: [],
      });
    });

    it("returns allowed:true on allow match", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: "allow" }]);

      const result = evaluateWithMatcher(
        normalizePolicies([
          {
            from: { element: { type: "component" } },
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: true,
        policyIndex: 0,
        match: { matched: "allow" },
        diagnostics: [],
      });
    });

    it("returns allowed:false on disallow match", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: "disallow" }]);

      const result = evaluateWithMatcher(
        normalizePolicies([
          { disallow: [{ to: [{ element: [{ type: "x" }] }] }] },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        policyIndex: 0,
        match: { matched: "disallow" },
        message: "default-message",
        diagnostics: [],
      });
    });

    it("does not evaluate allow when disallow matched within the same rule", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      // disallow matches → allow should not be called
      setMatcherReturns(matcher, [{ matched: true }]);

      const result = evaluateWithMatcher(
        normalizePolicies([
          {
            disallow: [{ to: [{ element: [{ type: "x" }] }] }],
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        policyIndex: 0,
        match: { matched: true },
        message: "default-message",
        diagnostics: [],
      });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("uses last-write-wins across multiple rules", () => {
      const matcher = createMatcher();
      // rule 0 disallow matches, rule 1 allow matches → final allowed
      setMatcherReturns(matcher, [{ rule: 0 }, { rule: 1 }]);

      const result = evaluateWithMatcher(
        normalizePolicies([
          { disallow: [{ to: [{ element: [{ type: "x" }] }] }] },
          { allow: [{ to: [{ element: [{ type: "x" }] }] }] },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: true,
        policyIndex: 1,
        match: { rule: 1 },
        diagnostics: [],
      });
    });

    it("iterates multiple disallow entries until a match is found", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      setMatcherReturns(matcher, [null, { matched: "second" }]);

      const result = evaluateWithMatcher(
        normalizePolicies([
          {
            disallow: [
              { to: [{ element: [{ type: "x" }] }] },
              { to: [{ element: [{ type: "y" }] }] },
            ],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result).toEqual({
        allowed: false,
        policyIndex: 0,
        match: { matched: "second" },
        message: "default-message",
        diagnostics: [],
      });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("memoizes normalized rule options between calls for the same rule reference", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValue(null);

      const [rule] = normalizePolicies([
        { allow: [{ to: [{ element: [{ type: "x" }] }] }] },
      ]);
      evaluateWithMatcher(
        [rule],
        createDependencyDescription(),
        matcher,
        createSettings()
      );
      evaluateWithMatcher(
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

    it("returns a warning diagnostic with the path of the policy when the matcher throws an error", () => {
      const matcher = createMatcher();
      jest
        .mocked(matcher.getDependencySelectorMatchingDescription)
        .mockReturnValueOnce(null)
        .mockImplementationOnce(() => {
          throw new Error("boom");
        });

      const result = evaluateWithMatcher(
        normalizePolicies([
          { allow: [{ to: [{ element: [{ type: "x" }] }] }] },
          { allow: [{ to: [{ element: [{ type: "y" }] }] }] },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result.diagnostics).toEqual([
        {
          level: "warning",
          title: expect.stringContaining(
            "Error occurred while matching dependency"
          ),
          detail: expect.stringContaining('"error":{"message":"boom"'),
          paths: [["policies", 1]],
        },
      ]);
      expect(result.diagnostics[0].detail).toContain(
        '"selector":{"to":[{"element":[{"type":"y"}]}]}'
      );
    });

    it("returns a warning diagnostic with the thrown value when the matcher throws something that is not an error", () => {
      const matcher = createMatcher();
      jest
        .mocked(matcher.getDependencySelectorMatchingDescription)
        .mockImplementationOnce(() => {
          throw "boom";
        });

      const result = evaluateWithMatcher(
        normalizePolicies([
          { allow: [{ to: [{ element: [{ type: "x" }] }] }] },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(result.diagnostics).toEqual([
        expect.objectContaining({
          detail: expect.stringContaining('"error":"boom"'),
          paths: [["policies", 0]],
        }),
      ]);
    });

    // The matcher rejects a selector with a key whose value is undefined, so a merged selector has only the keys that one of its sides has
    it("merges element selectors without adding keys that neither side has", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: [{ to: [{ element: [{ path: "**/index.js" }] }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        to: [{ element: [{ type: "helper", path: "**/index.js" }] }],
      });
    });

    it("merges file selectors without adding keys that neither side has", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ file: [{ categories: ["ui"] }] }],
            allow: [{ from: [{ file: [{ path: "**/*.tsx" }] }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        from: [{ file: [{ categories: ["ui"], path: "**/*.tsx" }] }],
      });
    });

    it("merges module selectors without adding keys that neither side has", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ module: [{ origin: "external" }] }],
            allow: [{ to: [{ module: [{ source: "react" }] }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        to: [{ module: [{ origin: "external", source: "react" }] }],
      });
    });

    it("merges parent selectors without adding keys that neither side has", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [
              {
                element: [{ type: "component", parent: [{ type: "module" }] }],
              },
            ],
            allow: [
              { from: [{ element: [{ parent: [{ category: "feature" }] }] }] },
            ],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        from: [
          {
            element: [
              {
                type: "component",
                parent: [{ type: "module", category: "feature" }],
              },
            ],
          },
        ],
      });
    });

    it("merges dependency selectors without adding keys that neither side has", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            dependency: [{ kind: "type" }],
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        dependency: [{ kind: "type", source: "@scope/x" }],
      });
    });

    it("uses the captured values of the entry element selector when the captured values of one side are a list", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValue(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [
              {
                element: [
                  {
                    type: "component",
                    captured: [{ family: "atoms" }, { family: "molecules" }],
                  },
                ],
              },
            ],
            allow: [{ from: [{ element: [{ captured: { area: "ui" } }] }] }],
          },
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
                    element: [{ captured: [{ area: "ui" }, { area: "core" }] }],
                  },
                ],
              },
            ],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        from: [{ element: [{ type: "component", captured: { area: "ui" } }] }],
      });
      expect(fn.mock.calls[1][1]).toStrictEqual({
        from: [
          {
            element: [
              {
                type: "component",
                captured: [{ area: "ui" }, { area: "core" }],
              },
            ],
          },
        ],
      });
    });

    it("uses the captured values of the entry file selector when the captured values of one side are a list", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValue(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [
              {
                file: [
                  {
                    categories: ["ui"],
                    captured: [{ scope: "front" }, { scope: "back" }],
                  },
                ],
              },
            ],
            allow: [{ from: [{ file: [{ captured: { team: "core" } }] }] }],
          },
          {
            from: [
              { file: [{ categories: ["ui"], captured: { scope: "front" } }] },
            ],
            allow: [
              {
                from: [
                  {
                    file: [{ captured: [{ team: "core" }, { team: "web" }] }],
                  },
                ],
              },
            ],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        from: [{ file: [{ categories: ["ui"], captured: { team: "core" } }] }],
      });
      expect(fn.mock.calls[1][1]).toStrictEqual({
        from: [
          {
            file: [
              {
                categories: ["ui"],
                captured: [{ team: "core" }, { team: "web" }],
              },
            ],
          },
        ],
      });
    });

    it("uses the captured values of the entry parent selector when the captured values of one side are a list", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValue(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [
              {
                element: [
                  {
                    parent: [
                      {
                        type: "module",
                        captured: [{ area: "primary" }, { area: "secondary" }],
                      },
                    ],
                  },
                ],
              },
            ],
            allow: [
              {
                from: [
                  { element: [{ parent: [{ captured: { layer: "ui" } }] }] },
                ],
              },
            ],
          },
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
                          { captured: [{ layer: "ui" }, { layer: "core" }] },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      expect(fn.mock.calls[0][1]).toStrictEqual({
        from: [
          {
            element: [
              { parent: [{ type: "module", captured: { layer: "ui" } }] },
            ],
          },
        ],
      });
      expect(fn.mock.calls[1][1]).toStrictEqual({
        from: [
          {
            element: [
              {
                parent: [
                  {
                    type: "module",
                    captured: [{ layer: "ui" }, { layer: "core" }],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it("merges outer from element selector into object entry allow", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "component" }] }],
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ element: [{ type: "helper" }] }],
            disallow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            dependency: [{ kind: "type" }],
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            dependency: [{ kind: "type" }],
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          { allow: [{ dependency: [{ source: "@scope/x" }] }] },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
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
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ file: [{ categories: ["ui"] }] }],
            allow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "component" }] }],
            allow: [{ from: [{ file: [{ categories: ["ui"] }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ module: [{ origin: "external" }] }],
            allow: [{ to: [{ module: [{ source: "@scope/x" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ module: [{ origin: "external" }] }],
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: [{ to: [{ module: [{ origin: "external" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
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
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            dependency: [{ relationship: { from: "sibling" } }],
            allow: [{ dependency: [{ relationship: { to: "child" } }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            dependency: [{ relationship: { from: "sibling" } }],
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            dependency: [{ source: "@scope/x" }],
            allow: [{ dependency: [{ relationship: { to: "child" } }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
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
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [
              { file: [{ categories: ["ui"], captured: { scope: "front" } }] },
            ],
            allow: [{ from: [{ file: [{ categories: ["feature"] }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [
              {
                element: [{ type: "component", captured: { family: "atoms" } }],
              },
            ],
            allow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
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
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "a", parent: [{ type: "module" }] }] }],
            allow: [{ from: [{ element: [{ type: "a", parent: null }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "a", parent: null }] }],
            allow: [{ from: [{ element: [{ type: "b" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
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
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "a", parent: [{ type: "module" }] }] }],
            allow: [{ from: [{ element: [{ type: "a" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
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
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "component" }] }],
            allow: [{ from: [{ file: [{ categories: ["ui"] }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ file: [{ categories: ["ui"] }] }],
            allow: [{ from: [{ element: [{ type: "component" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "component" }] }],
            allow: ["helper"],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;

      expect(selector.from).toEqual([{ element: [{ type: "component" }] }]);
      expect(selector.to).toEqual([{ element: [{ type: "helper" }] }]);
    });

    it("treats legacy string entry as the 'from' selector when outer to is present and outer from is absent", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: ["component"],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;

      expect(selector.from).toEqual([{ element: [{ type: "component" }] }]);
      expect(selector.to).toEqual([{ element: [{ type: "helper" }] }]);
    });

    it("treats a bare entry as the 'to' selector when neither outer from nor outer to is present", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      // No `from`/`to` at the policy level — e.g. `{ allow: { element: { type: "shared" } } }`,
      // a "universal" policy scoping only the dependency target. `allow`/`disallow` have
      // always meant "to" (see the v5-to-v6 migration guide), never "from".
      evaluateWithMatcher(
        normalizePolicies([
          {
            allow: [{ element: [{ type: "shared" }] }],
          },
        ]),
        createDependencyDescription(),
        matcher,
        createSettings()
      );

      const selector = fn.mock
        .calls[0][1] as DependencySingleSelectorNormalized;

      expect(selector.to).toEqual([{ element: [{ type: "shared" }] }]);
      // `toBeUndefined()` would also pass on a present-but-`undefined` `from`,
      // which is exactly the shape `@boundaries/elements` rejects as invalid
      // (see the comment in `buildEntrySelector`) — assert it is absent
      // entirely instead.
      expect("from" in selector).toBe(false);
    });

    it("applies legacy importKind by adding kind to entry dependency selectors", () => {
      const matcher = createMatcher();
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            importKind: "type",
            allow: [{ dependency: [{ source: "@scope/x" }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          {
            importKind: "type",
            allow: [{ to: [{ element: [{ type: "helper" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          { allow: [{ to: [{ element: [{ type: "helper" }] }] }] },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      const dependency = createDependencyDescription({
        from: createEntityDescription({
          element: { captured: { family: "atoms" } },
        }),
        to: createEntityDescription({
          element: { captured: { team: "core" } },
        }),
      });

      evaluateWithMatcher(
        normalizePolicies([
          {
            from: [{ element: [{ type: "a" }] }],
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      const dependency = createDependencyDescription({
        from: createEntityDescription({
          element: { captured: { family: "atoms" } },
        }),
        to: createEntityDescription({
          element: { captured: { team: "core" } },
        }),
      });

      evaluateWithMatcher(
        normalizePolicies([
          {
            to: [{ element: [{ type: "helper" }] }],
            allow: [{ to: [{ element: [{ type: "x" }] }] }],
          },
        ]),
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
      const fn = jest.mocked(matcher.getDependencySelectorMatchingDescription);
      fn.mockReturnValueOnce(null);

      evaluateWithMatcher(
        normalizePolicies([
          { allow: [{ to: [{ element: [{ type: "x" }] }] }] },
        ]),
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
        resolveCustomMessage(0, normalizeOptions({ policies: [{}] }))
      ).toBeUndefined();
    });

    it("returns the policy message when available", () => {
      const result = resolveCustomMessage(
        1,
        normalizeOptions({
          message: "global",
          policies: [{}, { message: "policy-msg" }],
        })
      );

      expect(result).toBe("policy-msg");
    });

    it("falls back to the options message when there is no policy message", () => {
      const result = resolveCustomMessage(
        0,
        normalizeOptions({ message: "global", policies: [{}] })
      );

      expect(result).toBe("global");
    });

    it("returns the options message when policyIndex is null", () => {
      const result = resolveCustomMessage(
        null,
        normalizeOptions({
          message: "global",
          policies: [{ message: "policy" }],
        })
      );

      expect(result).toBe("global");
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

  describe("evaluatePolicies messages and default", () => {
    it("allows a dependency that no policy matches when the default is allow", () => {
      const matcher = createMatcher();
      getMatcherMock.mockReturnValue(matcher);

      const result = evaluatePolicies(
        createSettings(),
        normalizeOptions({ default: "allow", policies: [] }),
        createDependencyDescription()
      );

      expect(result).toEqual({
        allowed: true,
        policyIndex: null,
        match: null,
        diagnostics: [],
      });
      expect(dependenciesRuleDefaultErrorMessageMock).not.toHaveBeenCalled();
    });

    it("builds the custom message of the deciding policy", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: true }]);
      getMatcherMock.mockReturnValue(matcher);
      const dependency = createDependencyDescription();

      const result = evaluatePolicies(
        createSettings(),
        normalizeOptions({
          message: "global",
          policies: [
            {
              disallow: [{ to: [{ element: [{ type: "x" }] }] }],
              message: "policy-level",
            },
          ],
        }),
        dependency
      );

      expect(result.message).toBe("custom-message::policy-level");
      expect(customErrorMessageMock).toHaveBeenCalledWith(
        "policy-level",
        dependency,
        0,
        { matched: true }
      );
    });

    it("builds the options message when no policy matches and the default is disallow", () => {
      const matcher = createMatcher();
      getMatcherMock.mockReturnValue(matcher);

      const result = evaluatePolicies(
        createSettings(),
        normalizeOptions({ message: "global", policies: [] }),
        createDependencyDescription()
      );

      expect(result.message).toBe("custom-message::global");
    });

    it("keeps the deciding policy and its match when the dependency is allowed", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [null, { matched: "allow" }]);
      getMatcherMock.mockReturnValue(matcher);

      const result = evaluatePolicies(
        createSettings(),
        normalizeOptions({
          policies: [
            { disallow: [{ to: [{ element: [{ type: "x" }] }] }] },
            { allow: [{ to: [{ element: [{ type: "y" }] }] }] },
          ],
        }),
        createDependencyDescription()
      );

      expect(result).toEqual({
        allowed: true,
        policyIndex: 1,
        match: { matched: "allow" },
        diagnostics: [],
      });
    });
  });

  describe("getDependencySkipReason", () => {
    const localDependency = (
      overrides: Partial<DependencyDescription> = {}
    ): DependencyDescription =>
      createDependencyDescription({
        to: createEntityDescription({ module: { origin: ORIGINS_MAP.LOCAL } }),
        ...overrides,
      });

    it("returns null for a local dependency between known files", () => {
      expect(getDependencySkipReason(undefined, localDependency())).toBeNull();
    });

    it("returns from-ignored when the importing file is ignored", () => {
      const dependency = localDependency({
        from: createEntityDescription({ file: { isIgnored: true } }),
      });

      expect(getDependencySkipReason({}, dependency)).toBe("from-ignored");
    });

    it("returns from-unknown when the importing file is unknown", () => {
      const dependency = localDependency({
        from: createEntityDescription({
          element: { isUnknown: true },
          file: { isUnknown: true },
        }),
      });

      expect(getDependencySkipReason({}, dependency)).toBe("from-unknown");
    });

    it("returns null when the importing file has a category but no element", () => {
      const dependency = localDependency({
        from: createEntityDescription({ element: { isUnknown: true } }),
      });

      expect(getDependencySkipReason({}, dependency)).toBeNull();
    });

    it("returns to-ignored when the target is a local ignored file, even with checkAllOrigins", () => {
      const dependency = localDependency({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      expect(
        getDependencySkipReason({ checkAllOrigins: true }, dependency)
      ).toBe("to-ignored");
    });

    it("returns not-local for an external target when checkAllOrigins is not set", () => {
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.EXTERNAL },
        }),
      });

      expect(getDependencySkipReason(undefined, dependency)).toBe("not-local");
    });

    it("returns null for an ignored external target when checkAllOrigins is true", () => {
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          file: { isIgnored: true },
          module: { origin: ORIGINS_MAP.CORE },
        }),
      });

      expect(
        getDependencySkipReason({ checkAllOrigins: true }, dependency)
      ).toBeNull();
    });

    it("returns unknown-local for an unknown local target when checkUnknownLocals is false", () => {
      const dependency = localDependency({
        to: createEntityDescription({
          element: { isUnknown: true },
          file: { isUnknown: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      expect(
        getDependencySkipReason({ checkUnknownLocals: false }, dependency)
      ).toBe("unknown-local");
      expect(getDependencySkipReason(undefined, dependency)).toBe(
        "unknown-local"
      );
    });

    it("returns null for an unknown local target when checkUnknownLocals is true", () => {
      const dependency = localDependency({
        to: createEntityDescription({
          element: { isUnknown: true },
          file: { isUnknown: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      expect(
        getDependencySkipReason({ checkUnknownLocals: true }, dependency)
      ).toBeNull();
    });

    it("returns null for a local target with a category but no element", () => {
      const dependency = localDependency({
        to: createEntityDescription({
          element: { isUnknown: true },
          module: { origin: ORIGINS_MAP.LOCAL },
        }),
      });

      expect(getDependencySkipReason({}, dependency)).toBeNull();
    });

    it("returns internal for a dependency inside an element when checkInternals is false", () => {
      const dependency = localDependency({
        dependency: {
          ...createDependencyDescription().dependency,
          relationship: {
            from: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
            to: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
          },
        },
      });

      expect(getDependencySkipReason({}, dependency)).toBe("internal");
      expect(getDependencySkipReason(undefined, dependency)).toBe("internal");
    });

    it("returns null for a dependency inside an element when checkInternals is true", () => {
      const dependency = localDependency({
        dependency: {
          ...createDependencyDescription().dependency,
          relationship: {
            from: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
            to: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
          },
        },
      });

      expect(
        getDependencySkipReason({ checkInternals: true }, dependency)
      ).toBeNull();
    });
  });

  describe("evaluateDependency", () => {
    it("returns the skip reason without evaluating the policies", () => {
      const dependency = createDependencyDescription({
        to: createEntityDescription({
          module: { origin: ORIGINS_MAP.EXTERNAL },
        }),
      });

      const result = evaluateDependency(
        createSettings(),
        normalizeOptions({ policies: [] }),
        dependency
      );

      expect(result).toEqual({ checked: false, reason: "not-local" });
      expect(getMatcherMock).not.toHaveBeenCalled();
    });

    it("returns the evaluation of the policies of a checked dependency", () => {
      const matcher = createMatcher();
      setMatcherReturns(matcher, [{ matched: "disallow" }]);
      getMatcherMock.mockReturnValue(matcher);

      const result = evaluateDependency(
        createSettings(),
        normalizeOptions({
          policies: [{ disallow: [{ to: [{ element: [{ type: "x" }] }] }] }],
        }),
        createDependencyDescription()
      );

      expect(result).toEqual({
        checked: true,
        allowed: false,
        policyIndex: 0,
        match: { matched: "disallow" },
        message: "default-message",
        diagnostics: [],
      });
    });
  });
});
