import type {
  DependencyDescription,
  ElementDescription,
  DependencyMatchResult,
  DependencySelector,
  ElementsSelector,
  Matcher,
} from "@boundaries/elements";

import type {
  debugDescription,
  printDependenciesRuleResult,
  warn,
  warnOnce,
} from "../../src/Debug/Debug";
import type { SettingsNormalized } from "../../src/Shared";
import { SETTINGS } from "../../src/Shared";

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
  warn: typeof warn;
  warnOnce: typeof warnOnce;
};

const loadDebugModule = (): DebugModule => {
  jest.resetModules();
  return require("../../src/Debug/Debug") as DebugModule;
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

  it("should log warn messages with color", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const debugModule = loadDebugModule();

    debugModule.warn("Warning");

    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("[boundaries]")
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("[warning]")
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Warning")
    );
  });

  it("should warn once for identical messages", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const debugModule = loadDebugModule();

    expect(debugModule.warnOnce("Only once")).toBe(true);
    expect(debugModule.warnOnce("Only once")).toBe(false);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("[boundaries]")
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("[warning]")
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("Only once")
    );
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'Description of file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls[0][0]).toContain(
      '"path": "src/components/Component.ts"'
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

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'Description of file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls[1][0]).toContain(
      'Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'Description of file "src/components/Component.ts":'
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'Description of file "src/components/Component.ts":'
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls.flat().join("\n")).not.toContain(
      'Description of dependency "../helpers/Helper" in file "src/components/Component.ts":'
    );
    expect(consoleSpy.mock.calls[0][0]).toContain(
      'Description of file "src/components/Component.ts":'
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      "Dependency did not match any rule, and default policy is to deny."
    );
    expect(consoleSpy.mock.calls[0][0]).toContain('"dependency"');
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

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      "Rule at index 2 reported a violation"
    );
    expect(consoleSpy.mock.calls[0][0]).toContain('"selector"');
    expect(consoleSpy.mock.calls[0][0]).toContain('"index": 2');
  });

  it("should print rule selector with full match result details", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings();

    debugModule.printDependenciesRuleResult(
      {
        isMatch: true,
        from: { selector: { type: "components" } },
        to: { selector: { type: "helpers" } },
        dependency: { selector: { kind: "import" } },
      } as unknown as DependencyMatchResult,
      3,
      createDependencyDescription(),
      settings,
      createMatcher({ isMatch: true } as DependencyMatchResult)
    );

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain(
      "Rule at index 3 reported a violation"
    );
    expect(consoleSpy.mock.calls[0][0]).toContain('"from"');
    expect(consoleSpy.mock.calls[0][0]).toContain('"to"');
    expect(consoleSpy.mock.calls[0][0]).toContain('"dependency"');
  });

  it("should not print rule results when file description is filtered out", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: { files: [] },
        messages: { files: true, dependencies: true, violations: true },
      },
    });

    debugModule.printDependenciesRuleResult(
      { isMatch: true } as DependencyMatchResult,
      1,
      createDependencyDescription(),
      settings,
      createMatcher(null)
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should not print rule results when dependency is filtered out", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: { dependencies: [] },
        messages: { files: true, dependencies: true, violations: true },
      },
    });

    debugModule.printDependenciesRuleResult(
      { isMatch: true } as DependencyMatchResult,
      1,
      createDependencyDescription(),
      settings,
      createMatcher(null)
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should skip dependency debug when from file is filtered out", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const debugModule = loadDebugModule();
    const settings = createSettings({
      debug: {
        enabled: true,
        filter: {
          files: [{ type: "nonexistent" }],
          dependencies: [
            { from: [{ type: "components" }] },
          ] as unknown as DependencySelector[],
        },
        messages: { files: true, dependencies: true, violations: true },
      },
    });
    const matcher = createMatcher(null);

    debugModule.debugDescription(
      createDependencyDescription(),
      settings,
      matcher
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
