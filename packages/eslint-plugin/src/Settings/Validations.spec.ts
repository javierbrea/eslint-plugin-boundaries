import type { DependencyKind } from "@boundaries/elements";
import type { Rule } from "eslint";

import {
  DEPENDENCY_NODE_KEYS_MAP,
  RULE_NAMES_MAP,
} from "../Shared/Settings.types";
import type {
  AliasSetting,
  DebugSettingNormalized,
  DependencyNodeKey,
  DependencyNodeSelector,
  RuleOptionsRules,
} from "../Shared/Settings.types";

import type { transformLegacyTypes } from "./Settings";
import {
  deprecateAlias,
  deprecateTypes,
  getRuleMainSelector,
  getSettings,
  isAliasSetting,
  isValidDependencyNodeSelector,
  isValidElementDescriptor,
  legacyPoliciesSchema,
  rulesOptionsSchema,
  validateAdditionalDependencyNodes,
  validateAndWarnRuleOptions,
  validateDebug,
  validateDebugDependenciesFilter,
  validateDebugFilesFilter,
  validateDebugFilterSelectors,
  validateDependencyNodes,
  validateElementDescriptors,
  validateFlagAsExternal,
  validateIgnore,
  validateInclude,
  validateLegacyTemplates,
  validateRootPath,
  validateSettings,
} from "./Validations";

const getWarnSpy = () => {
  const debugModule = jest.requireActual("../../src/Debug/Debug") as {
    warnOnce: (message: string, details?: string) => boolean;
  };

  return jest.spyOn(debugModule, "warnOnce").mockReturnValue(true);
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("legacyPoliciesSchema", () => {
  it("should build schema with string, tuple and array alternatives", () => {
    const schema = legacyPoliciesSchema();

    expect(schema.anyOf).toHaveLength(3);
    expect(schema.anyOf[0]).toEqual({ type: "string" });
    expect(schema.anyOf[1]).toEqual({
      type: "array",
      items: [{ type: "string" }, { type: "object" }],
    });
    expect(schema.anyOf[2]).toEqual(
      expect.objectContaining({
        type: "array",
      })
    );
  });

  it("should include custom matcher options in tuple schema", () => {
    const matcherOptions = {
      type: "object",
      properties: {
        family: {
          type: "string",
        },
      },
    };

    const schema = legacyPoliciesSchema(matcherOptions);

    expect(schema.anyOf[1]).toEqual({
      type: "array",
      items: [{ type: "string" }, matcherOptions],
    });
  });
});

describe("rulesOptionsSchema", () => {
  it("should include modern selector keys by default", () => {
    const schema = rulesOptionsSchema();
    const root = schema[0];
    const rules = root.properties.rules as {
      items: {
        properties: Record<string, unknown>;
        anyOf: unknown[];
      };
    };

    expect(rules.items.properties.from).toBeDefined();
    expect(rules.items.properties.to).toBeDefined();
    expect(rules.items.properties.dependency).toBeDefined();
    expect(rules.items.anyOf).toEqual(
      expect.arrayContaining([
        { required: ["dependency", "allow"] },
        { required: ["dependency", "disallow"] },
      ])
    );
  });

  it("should include legacy main key when isLegacy is true", () => {
    const schema = rulesOptionsSchema({
      isLegacy: true,
      rulesMainKey: "target",
    });
    const rules = schema[0].properties.rules as {
      items: {
        properties: Record<string, unknown>;
      };
    };

    expect(rules.items.properties.target).toBeDefined();
    expect(rules.items.properties.from).toBeUndefined();
  });

  it("should include custom extra options schema", () => {
    const schema = rulesOptionsSchema({
      extraOptionsSchema: {
        checkAllOrigins: {
          type: "boolean",
        },
      },
    });

    expect(
      (schema[0].properties as Record<string, unknown>).checkAllOrigins
    ).toEqual({ type: "boolean" });
  });
});

describe("getRuleMainSelector", () => {
  const dependencyRule = {
    from: { type: "helpers" },
    to: { type: "ui" },
  } as unknown as RuleOptionsRules;

  it("should return 'from' selector when main key is from", () => {
    expect(getRuleMainSelector(dependencyRule, "from")).toEqual({
      type: "helpers",
    });
  });

  it("should return undefined for missing 'to' selector", () => {
    const fromOnlyRule = {
      from: { type: "helpers" },
    } as unknown as RuleOptionsRules;

    expect(getRuleMainSelector(fromOnlyRule, "to")).toBeUndefined();
  });

  it("should return 'to' selector when present", () => {
    expect(getRuleMainSelector(dependencyRule, "to")).toEqual({
      type: "ui",
    });
  });

  it("should return 'target' selector when main key is target", () => {
    const entryPointRule = {
      target: { type: "ui" },
    } as unknown as RuleOptionsRules;

    expect(getRuleMainSelector(entryPointRule, "target")).toEqual({
      type: "ui",
    });
  });

  it("should return undefined for missing 'from' and 'target' selectors", () => {
    const entryPointRule = {
      target: { type: "ui" },
    } as unknown as RuleOptionsRules;

    expect(getRuleMainSelector(entryPointRule, "from")).toBeUndefined();
    expect(getRuleMainSelector(dependencyRule, "target")).toBeUndefined();
  });
});

describe("validateAndWarnRuleOptions", () => {
  it("should not warn when options are undefined", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(undefined, "from", RULE_NAMES_MAP.DEPENDENCIES);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should not warn when rules are not an array", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: "invalid-rules",
      } as unknown as Parameters<typeof validateAndWarnRuleOptions>[0],
      "from",
      RULE_NAMES_MAP.DEPENDENCIES
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should not warn when rules are missing", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions({}, "from", RULE_NAMES_MAP.DEPENDENCIES);

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should use default main key when omitted", () => {
    const warnSpy = getWarnSpy();

    validateAndWarnRuleOptions(
      {
        rules: [
          {
            from: "components",
            allow: [{ to: { type: "helpers" } }],
          },
        ],
      },
      undefined,
      RULE_NAMES_MAP.DEPENDENCIES
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Detected legacy selector syntax"),
      expect.any(String)
    );
  });

  it("should not warn for modern selector syntax with no deprecated fields", () => {
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
      RULE_NAMES_MAP.DEPENDENCIES
    );

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should warn for legacy selector, legacy template and deprecated importKind", () => {
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
      RULE_NAMES_MAP.DEPENDENCIES
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

  it("should only warn once for same options object", () => {
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

    validateAndWarnRuleOptions(options, "from", RULE_NAMES_MAP.DEPENDENCIES);
    validateAndWarnRuleOptions(options, "from", RULE_NAMES_MAP.DEPENDENCIES);

    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});

describe("isValidElementDescriptor", () => {
  it("should return false for missing descriptor", () => {
    const warnSpy = getWarnSpy();

    expect(isValidElementDescriptor(undefined)).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should return true for legacy string descriptor and warn", () => {
    const warnSpy = getWarnSpy();

    expect(isValidElementDescriptor("helpers")).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should validate all object descriptor branches", () => {
    const warnSpy = getWarnSpy();

    expect(isValidElementDescriptor(1)).toBe(false);
    expect(isValidElementDescriptor({ pattern: "src/*" })).toBe(false);
    expect(
      isValidElementDescriptor({
        type: 1,
        pattern: "src/*",
      })
    ).toBe(false);
    expect(
      isValidElementDescriptor({
        category: 1,
        pattern: "src/*",
      })
    ).toBe(false);
    expect(
      isValidElementDescriptor({
        type: "helpers",
        mode: "invalid",
        pattern: "src/*",
      })
    ).toBe(false);
    expect(
      isValidElementDescriptor({
        type: "helpers",
        pattern: true,
      })
    ).toBe(false);
    expect(
      isValidElementDescriptor({
        type: "helpers",
        pattern: "src/*",
        capture: "name",
      })
    ).toBe(false);

    expect(
      isValidElementDescriptor({
        type: "helpers",
        pattern: ["src/helpers/*"],
        capture: ["name"],
        mode: "folder",
      })
    ).toBe(true);

    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateElementDescriptors", () => {
  it("should return undefined for missing elements", () => {
    const warnSpy = getWarnSpy();

    expect(validateElementDescriptors(undefined)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should filter invalid descriptors", () => {
    const warnSpy = getWarnSpy();

    const result = validateElementDescriptors([
      {
        type: "helpers",
        pattern: "src/helpers/*",
      },
      {
        type: 1,
        pattern: "src/helpers/*",
      },
    ]);

    expect(result).toEqual([
      {
        type: "helpers",
        pattern: "src/helpers/*",
      },
    ]);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateDependencyNodes", () => {
  it("should return undefined when dependency nodes are not provided", () => {
    expect(validateDependencyNodes(undefined)).toBeUndefined();
  });

  it("should return undefined and warn when format is invalid", () => {
    const warnSpy = getWarnSpy();

    // @ts-expect-error Testing invalid runtime input
    expect(validateDependencyNodes("import")).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should filter unsupported node keys and keep valid keys", () => {
    const warnSpy = getWarnSpy();

    const result = validateDependencyNodes([
      DEPENDENCY_NODE_KEYS_MAP.IMPORT,
      "invalid",
      DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
    ] as unknown as DependencyNodeKey[]);

    expect(result).toEqual([
      DEPENDENCY_NODE_KEYS_MAP.IMPORT,
      DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
    ]);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateLegacyTemplates", () => {
  it("should return undefined when value is undefined", () => {
    expect(validateLegacyTemplates(undefined)).toBeUndefined();
  });

  it("should return boolean values", () => {
    expect(validateLegacyTemplates(true)).toBe(true);
    expect(validateLegacyTemplates(false)).toBe(false);
  });

  it("should warn and return undefined for invalid value", () => {
    const warnSpy = getWarnSpy();

    expect(validateLegacyTemplates("true")).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("isValidDependencyNodeSelector", () => {
  it("should return false and warn for invalid selector", () => {
    const warnSpy = getWarnSpy();

    expect(
      isValidDependencyNodeSelector({
        selector: 1,
      })
    ).toBe(false);

    expect(warnSpy).toHaveBeenCalled();
  });

  it("should return true and warn when valid selector has no name", () => {
    const warnSpy = getWarnSpy();

    expect(
      isValidDependencyNodeSelector({
        selector: "ImportDeclaration > Literal",
        kind: "value",
      })
    ).toBe(true);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Consider adding a "name" property'),
      expect.any(String)
    );
  });

  it("should return true for valid selector with name", () => {
    const warnSpy = getWarnSpy();

    expect(
      isValidDependencyNodeSelector({
        selector: "ImportDeclaration > Literal",
        kind: "type",
        name: "custom-import",
      })
    ).toBe(true);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("validateAdditionalDependencyNodes", () => {
  it("should return undefined when setting is missing", () => {
    expect(validateAdditionalDependencyNodes(undefined)).toBeUndefined();
  });

  it("should return undefined and warn for invalid setting format", () => {
    const warnSpy = getWarnSpy();

    expect(validateAdditionalDependencyNodes({})).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should filter invalid selectors", () => {
    const warnSpy = getWarnSpy();

    const result = validateAdditionalDependencyNodes([
      {
        selector: "ImportDeclaration > Literal",
        kind: "value",
        name: "import",
      },
      {
        selector: "CallExpression > Literal",
        kind: "invalid",
      },
    ]);

    expect(result).toEqual([
      {
        selector: "ImportDeclaration > Literal",
        kind: "value",
        name: "import",
      },
    ]);
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("isAliasSetting", () => {
  it("should return true for objects with string values", () => {
    expect(
      isAliasSetting({
        "@core": "./src/core",
      })
    ).toBe(true);
  });

  it("should return false for invalid alias values", () => {
    expect(
      isAliasSetting({
        "@core": 1,
      })
    ).toBe(false);
    expect(isAliasSetting("@core")).toBe(false);
  });
});

describe("deprecateAlias", () => {
  it("should warn when aliases are provided", () => {
    const warnSpy = getWarnSpy();

    deprecateAlias({
      "@core": "./src/core",
    });

    expect(warnSpy).toHaveBeenCalled();
  });

  it("should not warn when aliases are missing", () => {
    const warnSpy = getWarnSpy();

    deprecateAlias(undefined);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("deprecateTypes", () => {
  it("should warn when types are provided", () => {
    const warnSpy = getWarnSpy();

    deprecateTypes(["helpers"]);

    expect(warnSpy).toHaveBeenCalled();
  });

  it("should not warn for falsy types", () => {
    const warnSpy = getWarnSpy();

    deprecateTypes(undefined);

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("validateIgnore", () => {
  it("should return string or string[] values", () => {
    expect(validateIgnore("src/**/*.test.ts")).toBe("src/**/*.test.ts");
    expect(validateIgnore(["src/**/*.test.ts"])).toEqual(["src/**/*.test.ts"]);
  });

  it("should warn for invalid values", () => {
    const warnSpy = getWarnSpy();

    expect(validateIgnore(["valid", 1])).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateInclude", () => {
  it("should return string or string[] values", () => {
    expect(validateInclude("src/**/*")).toBe("src/**/*");
    expect(validateInclude(["src/**/*"])).toEqual(["src/**/*"]);
  });

  it("should warn for invalid values", () => {
    const warnSpy = getWarnSpy();

    expect(validateInclude(["valid", 1])).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateRootPath", () => {
  it("should return valid root path", () => {
    expect(validateRootPath("packages/eslint-plugin")).toBe(
      "packages/eslint-plugin"
    );
  });

  it("should warn for invalid root path", () => {
    const warnSpy = getWarnSpy();

    expect(validateRootPath(1)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateFlagAsExternal", () => {
  it("should return undefined when setting is missing", () => {
    expect(validateFlagAsExternal(undefined)).toBeUndefined();
  });

  it("should warn when value is not an object", () => {
    const warnSpy = getWarnSpy();

    expect(validateFlagAsExternal(true)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should keep valid values and skip invalid ones", () => {
    const warnSpy = getWarnSpy();

    const result = validateFlagAsExternal({
      unresolvableAlias: true,
      inNodeModules: "yes",
      outsideRootPath: false,
      customSourcePatterns: ["@scope/*", 1],
    });

    expect(result).toEqual({
      unresolvableAlias: true,
      outsideRootPath: false,
    });
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("should keep all values when all fields are valid", () => {
    expect(
      validateFlagAsExternal({
        unresolvableAlias: false,
        inNodeModules: true,
        outsideRootPath: true,
        customSourcePatterns: ["@scope/*"],
      })
    ).toEqual({
      unresolvableAlias: false,
      inNodeModules: true,
      outsideRootPath: true,
      customSourcePatterns: ["@scope/*"],
    });
  });

  it("should warn for invalid unresolvableAlias and outsideRootPath booleans", () => {
    const warnSpy = getWarnSpy();

    const result = validateFlagAsExternal({
      unresolvableAlias: "invalid",
      outsideRootPath: "invalid",
    });

    expect(result).toEqual({});
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("should keep inNodeModules when unresolvableAlias is undefined", () => {
    expect(
      validateFlagAsExternal({
        inNodeModules: true,
      })
    ).toEqual({
      inNodeModules: true,
    });
  });
});

describe("validateDebugFilterSelectors", () => {
  it("should return undefined when value is undefined", () => {
    expect(validateDebugFilterSelectors(undefined, "files")).toBeUndefined();
  });

  it("should return value when it is an array", () => {
    const filters = [{ type: "helpers" }];

    expect(validateDebugFilterSelectors(filters, "files")).toBe(filters);
  });

  it("should warn and return undefined for invalid values", () => {
    const warnSpy = getWarnSpy();

    expect(
      validateDebugFilterSelectors("invalid", "dependencies")
    ).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });
});

describe("validateDebugFilesFilter", () => {
  it("should return parsed file filters", () => {
    expect(validateDebugFilesFilter([{ type: "helpers" }])).toEqual([
      { type: "helpers" },
    ]);
  });
});

describe("validateDebugDependenciesFilter", () => {
  it("should return parsed dependency filters", () => {
    expect(
      validateDebugDependenciesFilter([{ to: [{ source: "./*" }] }])
    ).toEqual([{ to: [{ source: "./*" }] }]);
  });
});

describe("validateDebug", () => {
  const defaultDebug: DebugSettingNormalized = {
    enabled: false,
    filter: {
      files: undefined,
      dependencies: undefined,
    },
    messages: {
      files: true,
      dependencies: true,
      violations: true,
    },
  };

  it("should return default debug when setting is missing", () => {
    expect(validateDebug(undefined)).toEqual(defaultDebug);
  });

  it("should warn and return default debug when value is not an object", () => {
    const warnSpy = getWarnSpy();

    expect(validateDebug("debug")).toEqual(defaultDebug);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should warn for invalid enabled, messages and filter values", () => {
    const warnSpy = getWarnSpy();

    const result = validateDebug({
      enabled: "yes",
      messages: {
        files: "yes",
        dependencies: 1,
        violations: "no",
      },
      filter: "all",
    });

    expect(result).toEqual(defaultDebug);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should parse valid debug options", () => {
    expect(
      validateDebug({
        enabled: true,
        messages: {
          files: false,
          dependencies: false,
          violations: true,
        },
        filter: {
          files: [{ type: "helpers" }],
          dependencies: [{ to: [{ source: "./*" }] }],
        },
      })
    ).toEqual({
      enabled: true,
      filter: {
        files: [{ type: "helpers" }],
        dependencies: [{ to: [{ source: "./*" }] }],
      },
      messages: {
        files: false,
        dependencies: false,
        violations: true,
      },
    });
  });

  it("should warn when messages is not an object", () => {
    const warnSpy = getWarnSpy();

    const result = validateDebug({
      messages: "nope",
    });

    expect(result).toEqual(defaultDebug);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Please provide a valid object for 'messages'"),
      expect.any(String)
    );
  });

  it("should keep only valid filter keys", () => {
    const warnSpy = getWarnSpy();

    const result = validateDebug({
      filter: {
        files: [{ type: "helpers" }],
        dependencies: "invalid",
      },
    });

    expect(result.filter.files).toEqual([{ type: "helpers" }]);
    expect(result.filter.dependencies).toBeUndefined();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should keep dependencies filter when files is undefined", () => {
    const result = validateDebug({
      filter: {
        dependencies: [{ to: [{ source: "./*" }] }],
      },
    });

    expect(result.filter.files).toBeUndefined();
    expect(result.filter.dependencies).toEqual([{ to: [{ source: "./*" }] }]);
  });

  it("should keep default message flags when message fields are undefined", () => {
    const result = validateDebug({
      messages: {},
    });

    expect(result.messages).toEqual({
      files: true,
      dependencies: true,
      violations: true,
    });
  });
});

describe("validateSettings", () => {
  const createSettings = (
    settings: Rule.RuleContext["settings"]
  ): Rule.RuleContext["settings"] => settings;

  it("should validate and normalize all settings fields", () => {
    const warnSpy = getWarnSpy();

    const result = validateSettings(
      createSettings({
        "boundaries/types": ["legacy"],
        "boundaries/alias": {
          "@core": "./src/core",
        } as AliasSetting,
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
          },
          {
            type: 1,
            pattern: "src/helpers/*",
          },
        ],
        "boundaries/ignore": ["**/*.test.ts"],
        "boundaries/include": "src/**/*",
        "boundaries/root-path": ".",
        "boundaries/dependency-nodes": [DEPENDENCY_NODE_KEYS_MAP.IMPORT],
        "boundaries/legacy-templates": false,
        "boundaries/additional-dependency-nodes": [
          {
            selector: "ImportDeclaration > Literal",
            kind: "value",
            name: "custom-import",
          },
        ],
        "boundaries/cache": true,
        "boundaries/flag-as-external": {
          unresolvableAlias: false,
        },
        "boundaries/debug": {
          enabled: true,
        },
      })
    );

    expect(result["boundaries/elements"]).toEqual([
      {
        type: "helpers",
        pattern: "src/helpers/*",
      },
    ]);
    expect(result["boundaries/dependency-nodes"]).toEqual([
      DEPENDENCY_NODE_KEYS_MAP.IMPORT,
    ]);
    expect(result["boundaries/debug"]).toEqual(
      expect.objectContaining({
        enabled: true,
      })
    );
    expect(warnSpy).toHaveBeenCalled();
  });

  it("should ignore deprecated alias warning when alias value is invalid", () => {
    const warnSpy = getWarnSpy();

    validateSettings(
      createSettings({
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
          },
        ],
        "boundaries/alias": {
          "@core": 1,
        },
      })
    );

    expect(
      warnSpy.mock.calls.some((call) => call[0].includes("Defining aliases"))
    ).toBe(false);
  });

  it("should fallback to deprecated types setting when elements is missing", () => {
    const result = validateSettings(
      createSettings({
        "boundaries/types": ["helpers"],
      })
    );

    expect(result["boundaries/elements"]).toEqual(["helpers"]);
  });
});

describe("getSettings", () => {
  const createContext = (settings: Rule.RuleContext["settings"]) => {
    return {
      settings,
    } as Rule.RuleContext;
  };

  it("should cache normalized settings by context.settings reference", () => {
    const context = createContext({
      "boundaries/elements": [
        {
          type: "helpers",
          pattern: "src/helpers/*",
          mode: "folder",
        },
      ],
    });

    const first = getSettings(context);
    const second = getSettings(context);

    expect(first).toBe(second);
  });

  it("should use defaults and normalize ignore/include as arrays", () => {
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
        "boundaries/ignore": "**/*.test.ts",
        "boundaries/include": "src/**/*",
      })
    );

    expect(normalized.ignorePaths).toEqual(["**/*.test.ts"]);
    expect(normalized.includePaths).toEqual(["src/**/*"]);
    expect(normalized.cache).toBe(true);
    expect(normalized.legacyTemplates).toBe(true);
    expect(normalized.dependencyNodes.length).toBeGreaterThan(0);
  });

  it("should warn when transformed descriptors contain invalid entries", () => {
    const warnSpy = getWarnSpy();
    const settingsModule = jest.requireActual(
      "../../src/Settings/Settings"
    ) as {
      transformLegacyTypes: typeof transformLegacyTypes;
    };

    jest.spyOn(settingsModule, "transformLegacyTypes").mockReturnValue([
      {
        type: "helpers",
        pattern: "src/helpers/*",
      },
      {
        invalid: true,
      },
    ] as unknown as ReturnType<typeof settingsModule.transformLegacyTypes>);

    const normalized = getSettings(
      createContext({
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
          },
        ],
      })
    );

    expect(normalized.elementDescriptors).toEqual([
      {
        type: "helpers",
        pattern: "src/helpers/*",
      },
    ]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Some element descriptors are invalid"),
      expect.any(String)
    );
  });

  it("should include additional dependency nodes", () => {
    const customNode: DependencyNodeSelector = {
      selector: "CallExpression[callee.name=require] > Literal",
      kind: "value",
      name: "custom-require",
    };

    const normalized = getSettings(
      createContext({
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
          },
        ],
        "boundaries/additional-dependency-nodes": [customNode],
      })
    );

    expect(normalized.dependencyNodes).toEqual(
      expect.arrayContaining([customNode])
    );
  });

  it("should preserve explicit false debug flags", () => {
    const normalized = getSettings(
      createContext({
        "boundaries/elements": [
          {
            type: "helpers",
            pattern: "src/helpers/*",
          },
        ],
        "boundaries/debug": {
          enabled: false,
          messages: {
            files: false,
            dependencies: false,
            violations: false,
          },
        },
      })
    );

    expect(normalized.debug.enabled).toBe(false);
    expect(normalized.debug.messages).toEqual({
      files: false,
      dependencies: false,
      violations: false,
    });
  });
});
