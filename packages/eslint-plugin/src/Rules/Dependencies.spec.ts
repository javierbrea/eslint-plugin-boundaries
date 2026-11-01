import { normalizeDependenciesRuleOptions } from "@boundaries/config";
import type {
  DependencyDescription,
  DependencySingleSelectorMatchResult,
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
import { evaluatePolicies, getMatcher } from "@boundaries/policies";
import type { PolicyEvaluation } from "@boundaries/policies";
import type { Rule } from "eslint";

import { warnOnce, printDependenciesRuleResult } from "../Debug";
import type { EslintDependencyNode } from "../Elements";
import type { DependenciesRuleOptions, SettingsNormalized } from "../Shared";
import { RULE_NAMES_MAP } from "../Shared";

jest.mock("@boundaries/policies", () => ({
  ...jest.requireActual("@boundaries/policies"),
  evaluatePolicies: jest.fn(),
  getMatcher: jest.fn(),
}));

jest.mock("../Debug", () => {
  const mockWarnOnce = jest.fn();
  return {
    warnOnce: mockWarnOnce,
    // Prints through the mocked warnOnce, as the real one does
    warnDiagnostics: jest.fn(
      (diagnostics: { title: string; detail?: string }[]) => {
        for (const { title, detail } of diagnostics) {
          mockWarnOnce(title, detail);
        }
      }
    ),
    printDependenciesRuleResult: jest.fn(),
  };
});

jest.mock("./Support", () => ({
  dependencyRule: jest.fn(
    (
      meta: unknown,
      handler: (args: {
        dependency: DependencyDescription;
        node: EslintDependencyNode;
        context: Rule.RuleContext;
        settings: SettingsNormalized;
        options?: DependenciesRuleOptions;
      }) => void
    ) => ({ meta, handler })
  ),
}));

import getDependencyRule, { evaluatePoliciesAndReport } from "./Dependencies";
import { dependencyRule } from "./Support";

const warnOnceMock = jest.mocked(warnOnce);
const printDependenciesRuleResultMock = jest.mocked(
  printDependenciesRuleResult
);
const evaluatePoliciesMock = jest.mocked(evaluatePolicies);
const getMatcherMock = jest.mocked(getMatcher);
const dependencyRuleMock = jest.mocked(dependencyRule);

type DependencyRuleHandler = (args: {
  dependency: DependencyDescription;
  node: EslintDependencyNode;
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

const MATCH = {
  matched: true,
} as unknown as DependencySingleSelectorMatchResult;

const ALLOWED: PolicyEvaluation = {
  allowed: true,
  policyIndex: 0,
  match: MATCH,
  diagnostics: [],
};

const DISALLOWED: PolicyEvaluation = {
  allowed: false,
  policyIndex: 0,
  match: MATCH,
  message: "violation-message",
  diagnostics: [],
};

describe("Dependencies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMatcherMock.mockReturnValue({} as Matcher);
    evaluatePoliciesMock.mockReturnValue(ALLOWED);
  });

  describe("evaluatePoliciesAndReport", () => {
    const createReportContext = () => {
      const report = jest.fn();
      return {
        context: { report } as unknown as Rule.RuleContext,
        report,
      };
    };

    const baseNode = {} as EslintDependencyNode;

    it("evaluates the policies with the options, the settings and the dependency", () => {
      const { context } = createReportContext();
      const options = normalizeDependenciesRuleOptions({ default: "allow" });
      const settings = createSettings();
      const dependency = createDependencyDescription();

      evaluatePoliciesAndReport({
        options,
        dependency,
        settings,
        context,
        node: baseNode,
      });

      expect(evaluatePoliciesMock).toHaveBeenCalledWith(
        settings,
        options,
        dependency
      );
    });

    it("does not report when the evaluation allows the dependency", () => {
      const { context, report } = createReportContext();

      evaluatePoliciesAndReport({
        options: normalizeDependenciesRuleOptions(undefined),
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
      });

      expect(report).not.toHaveBeenCalled();
      expect(printDependenciesRuleResultMock).not.toHaveBeenCalled();
    });

    it("prints the result and reports the message when the evaluation does not allow the dependency", () => {
      evaluatePoliciesMock.mockReturnValue(DISALLOWED);
      const matcher = { id: "matcher" } as unknown as Matcher;
      getMatcherMock.mockReturnValue(matcher);
      const { context, report } = createReportContext();
      const settings = createSettings();
      const dependency = createDependencyDescription();

      evaluatePoliciesAndReport({
        options: normalizeDependenciesRuleOptions(undefined),
        dependency,
        settings,
        context,
        node: baseNode,
      });

      expect(printDependenciesRuleResultMock).toHaveBeenCalledWith(
        MATCH,
        0,
        dependency,
        settings,
        matcher
      );
      expect(report).toHaveBeenCalledWith({
        message: "violation-message",
        node: baseNode,
      });
    });

    it("prints the diagnostics of the evaluation", () => {
      evaluatePoliciesMock.mockReturnValue({
        ...ALLOWED,
        diagnostics: [
          {
            level: "warning",
            title: "matching-error",
            detail: "details",
            paths: [["policies", 0]],
          },
        ],
      });
      const { context } = createReportContext();

      evaluatePoliciesAndReport({
        options: normalizeDependenciesRuleOptions(undefined),
        dependency: createDependencyDescription(),
        settings: createSettings(),
        context,
        node: baseNode,
      });

      expect(warnOnceMock).toHaveBeenCalledWith("matching-error", "details");
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
      node: {} as EslintDependencyNode,
      context: { report: jest.fn() } as unknown as Rule.RuleContext,
      settings: createSettings(),
      options,
    });

    const localDependency = (
      relationshipTo: "internal" | "child" | "sibling" | "parent" = "sibling"
    ): DependencyDescription =>
      createDependencyDescription({
        to: createEntityDescription({
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

    const externalDependency = (): DependencyDescription =>
      createDependencyDescription({
        to: createEntityDescription({
          module: { origin: ORIGINS_MAP.EXTERNAL },
        }),
      });

    it("does not emit deprecation warning when called with the default rule name", () => {
      callHandler(
        undefined as unknown as Parameters<typeof getDependencyRule>[0],
        createCallArgs(localDependency(), { default: "allow" })
      );

      expect(warnOnceMock).not.toHaveBeenCalled();
    });

    it("emits deprecation warning when called with the ELEMENT_TYPES rule name", () => {
      callHandler(
        RULE_NAMES_MAP.ELEMENT_TYPES,
        createCallArgs(localDependency(), { default: "allow" })
      );

      expect(warnOnceMock).toHaveBeenCalledTimes(1);
      expect(warnOnceMock.mock.calls[0][0]).toContain(
        RULE_NAMES_MAP.ELEMENT_TYPES
      );
    });

    it("skips the dependencies that the dependencies rule does not check", () => {
      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(localDependency(DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL))
      );

      expect(evaluatePoliciesMock).not.toHaveBeenCalled();
    });

    it("reads the check options as the user wrote them", () => {
      callHandler(
        RULE_NAMES_MAP.DEPENDENCIES,
        createCallArgs(externalDependency(), { checkAllOrigins: true })
      );

      expect(evaluatePoliciesMock).toHaveBeenCalledTimes(1);
    });

    it("does not normalize the policies when it skips the dependency, so an invalid selector does not throw", () => {
      const options = {
        policies: [{ from: { bogus: 1 }, allow: { to: { type: "a" } } }],
      } as unknown as DependenciesRuleOptions;

      const run = () =>
        callHandler(
          RULE_NAMES_MAP.DEPENDENCIES,
          createCallArgs(externalDependency(), options)
        );

      expect(run).not.toThrow();
      expect(evaluatePoliciesMock).not.toHaveBeenCalled();
    });

    it("evaluates a checked dependency with the normalized options", () => {
      const args = createCallArgs(localDependency(), {
        default: "allow",
        policies: [{ disallow: [{ to: [{ element: [{ type: "x" }] }] }] }],
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, args);

      expect(evaluatePoliciesMock).toHaveBeenCalledWith(
        args.settings,
        expect.objectContaining({
          default: "allow",
          policies: [expect.objectContaining({ disallow: expect.any(Array) })],
        }),
        args.dependency
      );
    });

    it("reports the message of a dependency that the evaluation does not allow", () => {
      evaluatePoliciesMock.mockReturnValue(DISALLOWED);
      const args = createCallArgs(localDependency());

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, args);

      expect(args.context.report).toHaveBeenCalledWith({
        message: "violation-message",
        node: args.node,
      });
    });

    it("falls back to the deprecated 'rules' alias when 'policies' is not set", () => {
      const args = createCallArgs(localDependency(), {
        default: "allow",
        rules: [{ disallow: [{ to: [{ element: [{ type: "x" }] }] }] }],
      });

      callHandler(RULE_NAMES_MAP.DEPENDENCIES, args);

      expect(evaluatePoliciesMock).toHaveBeenCalledWith(
        args.settings,
        expect.objectContaining({
          policies: [expect.objectContaining({ disallow: expect.any(Array) })],
        }),
        args.dependency
      );
    });
  });
});
