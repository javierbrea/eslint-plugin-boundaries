import type { Rule } from "eslint";

import { getSettings, validateAndWarnRuleOptions } from "../../src/Settings";

describe("validateAndWarnRuleOptions", () => {
  const getWarnSpy = () => {
    const debugModule = jest.requireActual("../../src/Support/Debug") as {
      warnOnce: (message: string) => boolean;
    };
    return jest.spyOn(debugModule, "warnOnce").mockReturnValue(true);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should not warn when options are undefined", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      undefined,
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should not warn when rules are not an array", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        // @ts-expect-error Testing invalid runtime input
        rules: "invalid-rules",
      },
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should not warn when checkConfig is disabled", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: "components",
            allow: [{ type: "helpers" }],
            importKind: "type",
          },
        ],
      },
      "from",
      false,
      "boundaries/element-types"
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should warn when legacy selector syntax is detected", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: "components",
            allow: [{ type: "helpers" }],
          },
          {
            from: { type: "helpers" },
            allow: [{ type: "components" }],
          },
          {
            from: ["modules", "helpers"],
            allow: [{ type: "components" }],
          },
        ],
      },
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "[boundaries/element-types] Detected legacy selector syntax in 2 rule(s) at indices: 0, 2. Consider migrating to object-based selectors. See documentation for migration guide."
    );
  });

  it("should warn when legacy template syntax is detected", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: { type: "components" },
            allow: [
              {
                type: "helpers",
                captured: {
                  family: "${from.family}",
                },
              },
            ],
          },
        ],
      },
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "[boundaries/element-types] Detected legacy template syntax ${...} in 1 rule(s) at indices: 0. Consider migrating to {{...}} syntax. See documentation for details."
    );
  });

  it("should warn when deprecated rule-level importKind is detected", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: { type: "components" },
            allow: [{ type: "helpers" }],
            importKind: "type",
          },
        ],
      },
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      '[boundaries/element-types] Detected deprecated rule-level "importKind" in 1 rule(s) at indices: 0. Use selector-level "kind" instead. When both are defined, selector-level "kind" takes precedence.'
    );
  });

  it("should warn for all detected validations in deterministic order", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: "components",
            allow: [
              {
                type: "helpers",
                captured: {
                  family: "${from.family}",
                },
              },
            ],
            importKind: "type",
          },
        ],
      },
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      "[boundaries/element-types] Detected legacy selector syntax in 1 rule(s) at indices: 0. Consider migrating to object-based selectors. See documentation for migration guide."
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      "[boundaries/element-types] Detected legacy template syntax ${...} in 1 rule(s) at indices: 0. Consider migrating to {{...}} syntax. See documentation for details."
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      3,
      '[boundaries/element-types] Detected deprecated rule-level "importKind" in 1 rule(s) at indices: 0. Use selector-level "kind" instead. When both are defined, selector-level "kind" takes precedence.'
    );
  });

  it("should only warn once for the same options object", () => {
    const warnSpy = getWarnSpy();
    const options = {
      rules: [
        {
          from: "components",
          allow: [{ type: "helpers" }],
          importKind: "type",
        },
      ],
    };

    validateAndWarnRuleOptions(
      options,
      "from",
      true,
      "boundaries/element-types"
    );
    validateAndWarnRuleOptions(
      options,
      "from",
      true,
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});

describe("getSettings debug options", () => {
  const createContext = (settings: Rule.RuleContext["settings"]) => {
    return {
      settings,
    } as Rule.RuleContext;
  };

  it("should enable debug from settings and keep provided filters", () => {
    const normalized = getSettings(
      createContext({
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
            mode: "folder",
            capture: ["name"],
          },
        ],
        "boundaries/debug": {
          enabled: true,
          filter: {
            files: [{ type: "helpers" }],
            dependencies: [{ to: [{ source: "./*" }] }],
          },
        },
      })
    );

    expect(normalized.debug.enabled).toBe(true);
    expect(normalized.debug.filter.files).toEqual([{ type: "helpers" }]);
    expect(normalized.debug.filter.dependencies).toEqual([
      { to: [{ source: "./*" }] },
    ]);
  });

  it("should keep debug disabled by default", () => {
    const normalized = getSettings(
      createContext({
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
            mode: "folder",
            capture: ["name"],
          },
        ],
      })
    );

    expect(normalized.debug.enabled).toBe(false);
    expect(normalized.debug.filter.files).toBeUndefined();
    expect(normalized.debug.filter.dependencies).toBeUndefined();
  });
});
