// cspell:ignore dissallow -- a deliberate typo, the mistake of the config that the tests normalize
import {
  normalizeConfig,
  normalizeDependenciesRuleOptions,
  validateRuleOptions,
} from "@boundaries/config";

import { normalizeConfigSafely } from "./NormalizeConfigSafely";

// The real normalization and validation, which the tests only count, except where a test makes them throw what the library does not
jest.mock<{
  normalizeConfig: typeof normalizeConfig;
  normalizeDependenciesRuleOptions: typeof normalizeDependenciesRuleOptions;
  validateRuleOptions: typeof validateRuleOptions;
}>("@boundaries/config", () => {
  const actual = jest.requireActual<{
    normalizeConfig: typeof normalizeConfig;
    normalizeDependenciesRuleOptions: typeof normalizeDependenciesRuleOptions;
    validateRuleOptions: typeof validateRuleOptions;
  }>("@boundaries/config");
  return {
    ...actual,
    normalizeConfig: jest.fn(actual.normalizeConfig),
    normalizeDependenciesRuleOptions: jest.fn(
      actual.normalizeDependenciesRuleOptions
    ),
    validateRuleOptions: jest.fn(actual.validateRuleOptions),
  };
});

/** The real normalization and validation, which each test starts with */
const {
  normalizeConfig: actualNormalizeConfig,
  validateRuleOptions: actualValidateRuleOptions,
} = jest.requireActual<{
  normalizeConfig: typeof normalizeConfig;
  validateRuleOptions: typeof validateRuleOptions;
}>("@boundaries/config");

const SETTINGS = {
  "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
};

const VALID_POLICY = {
  from: { element: { type: "helper" } },
  allow: { to: { element: { type: "helper" } } },
};

/** Policies whose selectors `@boundaries/elements` cannot normalize, which the schema of the rule accepts */
const THROWING_POLICIES = [
  ["an empty disallow", { disallow: {} }],
  ["an empty allow", { allow: {} }],
  ["an allow with an empty target", { allow: { to: {} } }],
  [
    "an allow with an empty element selector",
    { allow: { to: { element: {} } } },
  ],
  [
    "an empty from",
    { from: {}, allow: { to: { element: { type: "helper" } } } },
  ],
] as const;

const ERROR_DETAIL =
  "ESLint stops with this error at the first dependency that the rule checks.";

/**
 * Creates a config with the rules that are given.
 * @param rules The entries of `rules`.
 * @param settings The settings.
 * @returns The config object, as written.
 */
function createConfig(
  rules: Record<string, unknown>,
  settings: unknown = SETTINGS
) {
  return { settings, rules };
}

/**
 * Makes `normalizeConfig` throw a new error for every config with rules, and `validateRuleOptions` for every validation against the schema, which the real ones do only where the validator of the rule options cannot compile its schema, such as where code generation from strings is forbidden: `normalizeConfig` for a rule of the plugin with a valid severity. It keeps the real `normalizeConfig` for a config without rules, and the real `validateRuleOptions` when the schema is not validated.
 * @returns The errors that they throw, in the order of the calls, so that a test tells the one of the first call from the others.
 */
function failSchemaCompilation(): Error[] {
  const errors: Error[] = [];
  const fail = (): never => {
    const error = new Error("Error compiling schema");
    errors.push(error);
    throw error;
  };
  jest.mocked(normalizeConfig).mockImplementation((config, options) => {
    const { rules } = config as { rules: Record<string, unknown> };
    if (Object.keys(rules).length > 0) {
      return fail();
    }
    return actualNormalizeConfig(config, options);
  });
  jest
    .mocked(validateRuleOptions)
    .mockImplementation((ruleName, options, validation) => {
      if (validation.schema !== false) {
        return fail();
      }
      return actualValidateRuleOptions(ruleName, options, validation);
    });
  return errors;
}

/**
 * Normalizes a config safely and catches what it throws.
 * @param config The config object, as written.
 * @returns What it throws.
 * @throws When it throws nothing, so that a test that expects a throw fails.
 */
function getThrown(config: ReturnType<typeof createConfig>): unknown {
  try {
    normalizeConfigSafely(config);
  } catch (error) {
    return error;
  }
  throw new Error("normalizeConfigSafely threw nothing");
}

describe("NormalizeConfigSafely", () => {
  beforeEach(() => {
    // A test may make normalizeConfig and validateRuleOptions throw, which would last for the tests after it
    jest.mocked(normalizeConfig).mockImplementation(actualNormalizeConfig);
    jest
      .mocked(validateRuleOptions)
      .mockImplementation(actualValidateRuleOptions);
  });

  describe("normalizeConfigSafely", () => {
    describe("when nothing throws", () => {
      it("should return what normalizeConfig returns, normalizing the config once", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [VALID_POLICY] }],
          "boundaries/element-types": ["error", { default: "dissallow" }],
        });

        // Act
        const result = normalizeConfigSafely(config);

        // Assert
        expect(normalizeConfig).toHaveBeenCalledTimes(1);
        expect(result).toEqual(normalizeConfig(config));
        expect(result.diagnostics).toHaveLength(1);
      });

      it("should pass the options to normalizeConfig", () => {
        // Arrange
        const config = createConfig({});

        // Act
        const { value } = normalizeConfigSafely(config, {
          rootPath: "packages/app",
        });

        // Assert
        expect(value.settings.rootPath).toBe("packages/app");
      });
    });

    describe("when a policy has a selector that cannot be normalized", () => {
      it.each(THROWING_POLICIES)(
        "should return an error at the policy for %s",
        (_title, policy) => {
          // Arrange
          const config = createConfig({
            "boundaries/dependencies": [
              2,
              { policies: [VALID_POLICY, policy] },
            ],
          });

          // Act
          const { diagnostics } = normalizeConfigSafely(config);

          // Assert
          expect(diagnostics).toEqual([
            expect.objectContaining({
              level: "warning",
              paths: [["rules", "boundaries/dependencies", 1, "policies", 1]],
            }),
            {
              level: "error",
              title: "Invalid entity selector.",
              detail: ERROR_DETAIL,
              paths: [["rules", "boundaries/dependencies", 1, "policies", 1]],
            },
          ]);
        }
      );

      it("should say with the warning of the rule options which shape is not recognized", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
        });

        // Act
        const { diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(diagnostics[0]).toEqual({
          level: "warning",
          title:
            "[boundaries/dependencies] Detected an unrecognized selector shape in 1 policy at indices: 0.",
          detail: expect.stringContaining("Check the 'disallow' property."),
          paths: [["rules", "boundaries/dependencies", 1, "policies", 0]],
        });
      });

      it("should leave out the entry that throws and normalize the settings", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
        });

        // Act
        const { value } = normalizeConfigSafely(config);

        // Assert
        expect(value.rules).toEqual({});
        expect(value.settings).toEqual(
          normalizeConfig(createConfig({})).value.settings
        );
      });

      it("should pass the options to normalizeConfig for the rest of the config", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
        });

        // Act
        const { value } = normalizeConfigSafely(config, {
          rootPath: "packages/app",
        });

        // Assert
        expect(value.settings.rootPath).toBe("packages/app");
      });

      it("should return an error for each policy that throws, and none for the others", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [
            2,
            {
              policies: [{ disallow: {} }, VALID_POLICY, { allow: { to: {} } }],
            },
          ],
        });

        // Act
        const { diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(diagnostics.map(({ level, paths }) => [level, paths])).toEqual([
          [
            "warning",
            [
              ["rules", "boundaries/dependencies", 1, "policies", 0],
              ["rules", "boundaries/dependencies", 1, "policies", 2],
            ],
          ],
          ["error", [["rules", "boundaries/dependencies", 1, "policies", 0]]],
          ["error", [["rules", "boundaries/dependencies", 1, "policies", 2]]],
        ]);
      });

      it("should place the problems of the entry that throws after those of the rest of the config", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
          "boundaries/element-types": ["error", { default: "dissallow" }],
        });

        // Act
        const { diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(diagnostics.map(({ level, title }) => [level, title])).toEqual([
          ["error", "[boundaries/element-types] Invalid rule options."],
          [
            "warning",
            "[boundaries/dependencies] Detected an unrecognized selector shape in 1 policy at indices: 0.",
          ],
          ["error", "Invalid entity selector."],
        ]);
      });

      it("should keep the rest of the rules when only one entry throws", () => {
        // Arrange
        const config = createConfig({
          "no-console": ["error", { allow: ["warn"] }],
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
          "boundaries/element-types": ["error", { policies: [VALID_POLICY] }],
          "boundaries/no-private": "error",
          "boundaries/entry-point": ["error", { default: "allow" }],
        });

        // Act
        const { value, diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(Object.keys(value.rules)).toEqual([
          "element-types",
          "no-private",
          "entry-point",
        ]);
        expect(diagnostics.map(({ level }) => level)).toEqual([
          "warning",
          "error",
        ]);
      });

      it("should return the errors of every entry that throws, in the order of the rules", () => {
        // Arrange
        const config = createConfig({
          "boundaries/element-types": ["error", { policies: [{ allow: {} }] }],
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
        });

        // Act
        const { value, diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(value.rules).toEqual({});
        expect(
          diagnostics
            .filter(({ level }) => level === "error")
            .map(({ paths }) => paths)
        ).toEqual([
          [["rules", "boundaries/element-types", 1, "policies", 0]],
          [["rules", "boundaries/dependencies", 1, "policies", 0]],
        ]);
      });
    });

    describe("when the legacy rules option has a selector that cannot be normalized", () => {
      it("should place the warning, the error and the deprecation at the legacy key", () => {
        // Arrange
        const config = createConfig({
          "boundaries/element-types": [
            2,
            { rules: [VALID_POLICY, { allow: {} }] },
          ],
        });

        // Act
        const { diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(
          diagnostics.map(({ level, title, paths }) => [level, title, paths])
        ).toEqual([
          [
            "warning",
            "[boundaries/element-types] Detected an unrecognized selector shape in 1 policy at indices: 1.",
            [["rules", "boundaries/element-types", 1, "rules", 1]],
          ],
          [
            "deprecation",
            "[boundaries/element-types] The 'rules' option is deprecated.",
            [["rules", "boundaries/element-types", 1, "rules"]],
          ],
          [
            "error",
            "Invalid entity selector.",
            [["rules", "boundaries/element-types", 1, "rules", 1]],
          ],
        ]);
      });

      it("should leave out the deprecation when the settings turn the legacy warnings off", () => {
        // Arrange
        const config = createConfig(
          { "boundaries/element-types": [2, { rules: [{ allow: {} }] }] },
          { ...SETTINGS, "boundaries/legacy-warnings": false }
        );

        // Act
        const { diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(diagnostics.map(({ level }) => level)).toEqual([
          "warning",
          "error",
        ]);
      });
    });

    describe("when the rule is off", () => {
      it.each([["off"], [0]])(
        "should leave out the entry and report nothing for severity %p",
        (severity) => {
          // Arrange
          const config = createConfig({
            "boundaries/dependencies": [
              severity,
              { policies: [{ disallow: {} }] },
            ],
          });

          // Act
          const { value, diagnostics } = normalizeConfigSafely(config);

          // Assert
          expect(value.rules).toEqual({});
          expect(diagnostics).toEqual([]);
        }
      );
    });

    describe("when normalizeConfig throws for a reason that no policy explains", () => {
      it("should throw the error of normalizeConfig, the same object, when no policy of the entry throws", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [VALID_POLICY] }],
        });
        const errors = failSchemaCompilation();

        // Act
        const thrown = getThrown(config);

        // Assert
        expect(thrown).toBe(errors[0]);
      });

      it.each([
        ["an entry without options", "boundaries/dependencies", [2]],
        [
          "options without a list of policies",
          "boundaries/dependencies",
          [2, {}],
        ],
        [
          "a legacy rules option that is not a list",
          "boundaries/element-types",
          [2, { rules: {} }],
        ],
      ])(
        "should throw the error of normalizeConfig, and not one of its own, for %s",
        (_title, ruleId, entry) => {
          // Arrange
          const config = createConfig({ [ruleId]: entry });
          const errors = failSchemaCompilation();

          // Act
          const thrown = getThrown(config);

          // Assert
          expect(thrown).toBe(errors[0]);
        }
      );

      it("should throw the error of normalizeConfig for a rule whose options normalizeConfig keeps as written, even when a policy in them throws", () => {
        // Arrange
        const config = createConfig({
          "boundaries/no-private": [2, { policies: [{ disallow: {} }] }],
        });
        const errors = failSchemaCompilation();

        // Act
        const thrown = getThrown(config);

        // Assert
        expect(thrown).toBe(errors[0]);
      });

      it("should throw the error of normalizeConfig when another entry is explained by a policy that throws", () => {
        // Arrange
        const config = createConfig({
          "boundaries/element-types": [2, { policies: [{ disallow: {} }] }],
          "boundaries/dependencies": [2, { policies: [VALID_POLICY] }],
        });
        const errors = failSchemaCompilation();

        // Act
        const thrown = getThrown(config);

        // Assert
        expect(thrown).toBe(errors[0]);
      });

      it.each([["off"], [0]])(
        "should leave out the entry and report nothing for severity %p",
        (severity) => {
          // Arrange
          const config = createConfig({
            "boundaries/dependencies": [severity, { policies: [VALID_POLICY] }],
          });
          failSchemaCompilation();

          // Act
          const { value, diagnostics } = normalizeConfigSafely(config);

          // Assert
          expect(value.rules).toEqual({});
          expect(diagnostics).toEqual([]);
        }
      );

      it.each([["off"], [0]])(
        "should leave out an entry that is the severity %p alone and report nothing",
        (severity) => {
          // Arrange
          const config = createConfig({ "boundaries/dependencies": severity });
          failSchemaCompilation();

          // Act
          const { value, diagnostics } = normalizeConfigSafely(config);

          // Assert
          expect(value.rules).toEqual({});
          expect(diagnostics).toEqual([]);
        }
      );

      it("should throw the error of normalizeConfig, the same object, for an entry that is a severity alone and on", () => {
        // Arrange
        const config = createConfig({ "boundaries/dependencies": "error" });
        const errors = failSchemaCompilation();

        // Act
        const thrown = getThrown(config);

        // Assert
        expect(thrown).toBe(errors[0]);
      });
    });

    describe("when the schema of the rule cannot be compiled and a policy throws alone", () => {
      it("should return the error at the policy that throws alone, without validating the options against the schema again", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
        });
        failSchemaCompilation();

        // Act
        const { value, diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(value.rules).toEqual({});
        expect(
          diagnostics.map(({ level, title, paths }) => [level, title, paths])
        ).toEqual([
          [
            "warning",
            "[boundaries/dependencies] Detected an unrecognized selector shape in 1 policy at indices: 0.",
            [["rules", "boundaries/dependencies", 1, "policies", 0]],
          ],
          [
            "error",
            "Invalid entity selector.",
            [["rules", "boundaries/dependencies", 1, "policies", 0]],
          ],
        ]);
      });
    });

    describe("when what is thrown is not an error", () => {
      it("should use it, with a period, as the title of the error", () => {
        // Arrange
        const config = createConfig({
          "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
        });
        jest
          .mocked(normalizeDependenciesRuleOptions)
          .mockImplementationOnce(() => {
            throw "The selector broke";
          });

        // Act
        const { diagnostics } = normalizeConfigSafely(config);

        // Assert
        expect(diagnostics[1]).toEqual(
          expect.objectContaining({
            level: "error",
            title: "The selector broke.",
          })
        );
      });
    });
  });
});
