import type {
  DependencyDescription,
  ElementDescription,
  DependencyMatchResult,
  DependencySelector,
  ElementsSelector,
  Matcher,
} from "@boundaries/elements";

import type { SettingsNormalized } from "../../src/Settings";
import { SETTINGS } from "../../src/Settings";
import type {
  debugDescription,
  printDependenciesRuleResult,
  success,
  warn,
  warnOnce,
} from "../../src/Support/Debug";

jest.mock("chalk", () => ({
  __esModule: true,
  default: {
    hex: () => (text: string) => text,
    blue: (text: string) => text,
    green: (text: string) => text,
    gray: (text: string) => text,
    yellow: (text: string) => text,
  },
}));

const createSettings = (
  overrides: Partial<SettingsNormalized> = {}
): SettingsNormalized => {
  const baseSettings: SettingsNormalized = {
    elementDescriptors: [],
    elementTypeNames: [],
    ignorePaths: undefined,
    includePaths: undefined,
    rootPath: process.cwd(),
    dependencyNodes: [],
    legacyTemplates: true,
    cache: true,
    flagAsExternal: {},
    debug: {
      enabled: true,
      filter: {},
      messages: {
        files: true,
        dependencies: true,
        violations: true,
      },
    },
  };

  return {
    ...baseSettings,
    ...overrides,
    debug: {
      ...baseSettings.debug,
      ...overrides.debug,
      filter: {
        ...baseSettings.debug.filter,
        ...overrides.debug?.filter,
      },
    },
  };
};

const createMatcher = (result: unknown): Matcher =>
  ({
    getSelectorMatchingDescription: jest.fn().mockReturnValue(result),
  }) as unknown as Matcher;

const createFileDescription = (path: string): ElementDescription => ({
  path,
  type: "components",
  category: null,
  captured: null,
  elementPath: "src/components",
  internalPath: "Component.ts",
  parents: [],
  origin: "local",
  isIgnored: false,
  isUnknown: false,
});

const createDependencyDescription = (): DependencyDescription => {
  const fileDescription = createFileDescription("src/components/Component.ts");
  const dependencyElement: ElementDescription = {
    path: "src/helpers/Helper.ts",
    type: "helpers",
    category: null,
    captured: null,
    elementPath: "src/helpers",
    internalPath: "Helper.ts",
    parents: [],
    origin: "local",
    isIgnored: false,
    isUnknown: false,
  };

  return {
    from: fileDescription,
    to: dependencyElement,
    dependency: {
      source: "../helpers/Helper",
      module: null,
      kind: "type",
      nodeKind: "import",
      relationship: {
        from: null,
        to: null,
      },
      specifiers: ["Helper"],
    },
  };
};

type DebugModule = {
  debugDescription: typeof debugDescription;
  printDependenciesRuleResult: typeof printDependenciesRuleResult;
  success: typeof success;
  warn: typeof warn;
  warnOnce: typeof warnOnce;
};

const loadDebugModule = (): DebugModule => {
  jest.resetModules();
  return require("../../src/Support/Debug") as DebugModule;
};

describe("Debug", () => {
  const originalDebugEnv = process.env[SETTINGS.DEBUG];

  beforeEach(() => {
    delete process.env[SETTINGS.DEBUG];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalDebugEnv === undefined) {
      delete process.env[SETTINGS.DEBUG];
      return;
    }
    process.env[SETTINGS.DEBUG] = originalDebugEnv;
  });

  it("should log warn and success messages with color", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();

    debugModule.warn("Warning");
    debugModule.success("Success");

    expect(consoleSpy).toHaveBeenNthCalledWith(1, "Warning");
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "Success");
  });

  it("should warn once for identical messages", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();

    expect(debugModule.warnOnce("Only once")).toBe(true);
    expect(debugModule.warnOnce("Only once")).toBe(false);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith("Only once");
  });

  it("should not log when debug is disabled", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: false,
        filter: {},
        messages: { files: true, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher(null);

    debugModule.debugDescription(
      createFileDescription("src/components/Component.ts"),
      settings,
      matcher
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should log file descriptions only once", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings();
    const matcher = createMatcher(null);
    const description = createFileDescription("src/components/Component.ts");

    debugModule.debugDescription(description, settings, matcher);
    debugModule.debugDescription(description, settings, matcher);

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      '[boundaries][debug]: Description of file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls[2][0]).toContain(
      '\n    "path": "src/components/Component.ts"'
    );
  });

  it("should skip file logs when the file filter is empty", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: { files: [] },
        messages: { files: true, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher(null);

    debugModule.debugDescription(
      createFileDescription("src/components/Component.ts"),
      settings,
      matcher
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should use the matcher to filter file logs", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: { files: [{ type: "components" } as ElementsSelector] },
        messages: { files: true, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher(null);

    debugModule.debugDescription(
      createFileDescription("src/components/Component.ts"),
      settings,
      matcher
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should log dependency descriptions and dedupe them", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings();
    const matcher = createMatcher({ isMatch: true } as DependencyMatchResult);
    const description = createDependencyDescription();

    debugModule.debugDescription(description, settings, matcher);
    debugModule.debugDescription(description, settings, matcher);

    expect(consoleSpy).toHaveBeenCalledTimes(8);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      '[boundaries][debug]: Description of file "src/components/Component.ts":'
    );
    expect(consoleSpy).toHaveBeenNthCalledWith(
      5,
      '[boundaries][debug]: Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
    );
  });

  it("should skip dependency logs when the dependency filter is empty", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: { dependencies: [] },
        messages: { files: true, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher({ isMatch: true } as DependencyMatchResult);

    debugModule.debugDescription(
      createDependencyDescription(),
      settings,
      matcher
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      '[boundaries][debug]: Description of file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      'Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
    );
  });

  it("should skip dependency logs when matcher does not match", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: {
          dependencies: [
            {
              from: [{ type: "components" }],
              to: [{ type: "helpers" }],
            } as DependencySelector,
          ],
        },
        messages: { files: true, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher({
      isMatch: false,
      from: null,
      to: null,
    } as DependencyMatchResult);

    debugModule.debugDescription(
      createDependencyDescription(),
      settings,
      matcher
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      '[boundaries][debug]: Description of file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      'Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
    );
  });

  it("should skip dependency logs when dependency messages are disabled", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: {},
        messages: { files: true, dependencies: false, violations: true },
      },
    });
    const matcher = createMatcher({ isMatch: true } as DependencyMatchResult);

    debugModule.debugDescription(
      createDependencyDescription(),
      settings,
      matcher
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      'Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
    );
  });

  it("should skip file logs when file messages are disabled", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: {},
        messages: { files: false, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher({ isMatch: true } as DependencyMatchResult);

    debugModule.debugDescription(
      createDependencyDescription(),
      settings,
      matcher
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy.mock.calls.flat().join("\n")).toContain(
      'Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      'Description of file "src/components/Component.ts":'
    );
  });

  it("should skip rule result logs when violation messages are disabled", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: {},
        messages: { files: true, dependencies: true, violations: false },
      },
    });

    debugModule.printDependenciesRuleResult(
      { isMatch: true } as DependencyMatchResult,
      1,
      createDependencyDescription(),
      settings,
      createMatcher({ isMatch: true } as DependencyMatchResult)
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should print default deny message when rule index is null", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings();

    debugModule.printDependenciesRuleResult(
      null,
      null,
      createDependencyDescription(),
      settings,
      createMatcher({ isMatch: true } as DependencyMatchResult)
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      "Dependency did not match any rule, and default policy is to deny."
    );
    expect(consoleSpy.mock.calls[2][0]).toContain('"dependency"');
  });

  it("should print rule selector details for a matched rule", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings();

    debugModule.printDependenciesRuleResult(
      {
        isMatch: true,
        from: { selector: { type: "components" } },
        to: null,
        dependency: { selector: { kind: "type" } },
      } as unknown as DependencyMatchResult,
      2,
      createDependencyDescription(),
      settings,
      createMatcher({ isMatch: true } as DependencyMatchResult)
    );

    expect(consoleSpy).toHaveBeenCalledTimes(4);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      "Rule at index 2 reported a violation"
    );
    expect(consoleSpy.mock.calls[2][0]).toContain('"selector"');
    expect(consoleSpy.mock.calls[2][0]).toContain('"index": 2');
  });
});
