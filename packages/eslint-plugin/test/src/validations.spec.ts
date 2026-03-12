import type { DependencyKind } from "@boundaries/elements";
import type { Rule } from "eslint";

import { getSettings, validateAndWarnRuleOptions } from "../../src/Settings";

describe("validateAndWarnRuleOptions", () => {
  const getWarnSpy = () => {
    const debugModule = jest.requireActual("../../src/Debug/Debug") as {
      warnOnce: (message: string) => boolean;
    };
    return jest.spyOn(debugModule, "warnOnce").mockReturnValue(true);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should not warn when options are undefined", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(undefined, "from", "boundaries/element-types");

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
            allow: ["helpers"],
          },
          {
            from: { type: "helpers" },
            allow: ["helpers"],
          },
          {
            from: ["modules", "helpers"],
            allow: ["components"],
          },
        ],
      },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Detected legacy selector syntax in 3 rule(s) at indices: 0, 1, 2."
      ),
      expect.stringContaining("Consider migrating to object-based selectors")
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
                to: {
                  type: "helpers",
                  captured: {
                    family: "${from.family}",
                  },
                },
              },
            ],
          },
        ],
      },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Detected legacy template syntax ${...} in 1 rule(s) at indices: 0."
      ),
      expect.stringContaining("Consider migrating to {{...}} syntax")
    );
  });

  it("should warn when deprecated rule-level importKind is detected", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: { type: "components" },
            allow: [{ to: { type: "helpers" } }],
            importKind: "type",
          },
        ],
      },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Detected deprecated rule-level "importKind" in 1 rule(s) at indices: 0.'
      ),
      expect.stringContaining('Use selector-level "dependency.kind" instead')
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
                to: {
                  type: "helpers",
                  captured: {
                    family: "${from.family}",
                  },
                },
              },
            ],
            importKind: "type",
          },
        ],
      },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        "Detected legacy selector syntax in 1 rule(s) at indices: 0."
      ),
      expect.stringContaining("Consider migrating to object-based selectors")
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        "Detected legacy template syntax ${...} in 1 rule(s) at indices: 0."
      ),
      expect.stringContaining("Consider migrating to {{...}} syntax")
    );
    expect(warnSpy).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        'Detected deprecated rule-level "importKind" in 1 rule(s) at indices: 0.'
      ),
      expect.stringContaining('Use selector-level "dependency.kind" instead')
    );
  });

  it("should not warn when rules is an empty array", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      { rules: [] },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should not warn when rules use only modern object-based selectors", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: { type: "components" },
            allow: [{ to: { type: "helpers" } }],
          },
        ],
      },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should warn when legacy selector syntax is detected in 'to' main key", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            to: "helpers",
          },
        ],
      },
      "to",
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Detected legacy selector syntax in 1 rule(s) at indices: 0."
      ),
      expect.stringContaining("Consider migrating to object-based selectors")
    );
  });

  it("should warn when legacy selector syntax is detected in 'target' main key", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            target: "helpers",
          },
        ],
      },
      "target",
      "boundaries/entry-point"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Detected legacy selector syntax in 1 rule(s) at indices: 0."
      ),
      expect.stringContaining("Consider migrating to object-based selectors")
    );
  });

  it("should warn when legacy selector syntax is in 'allow' but 'from' uses modern selector", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: { type: "components" },
            allow: ["helpers"],
          },
        ],
      },
      "from",
      "boundaries/element-types"
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Detected legacy selector syntax in 1 rule(s) at indices: 0."
      ),
      expect.stringContaining("Consider migrating to object-based selectors")
    );
  });

  it("should only warn once for the same options object", () => {
    const warnSpy = getWarnSpy();
    const dependencyKind: DependencyKind = "type";
    const options = {
      rules: [
        {
          from: "components",
          allow: [{ to: { type: "helpers" } }],
          importKind: dependencyKind,
        },
      ],
    };

    validateAndWarnRuleOptions(options, "from", "boundaries/element-types");
    validateAndWarnRuleOptions(options, "from", "boundaries/element-types");

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
