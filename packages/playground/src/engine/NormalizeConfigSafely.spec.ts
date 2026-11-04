// cspell:ignore dissallow -- a deliberate typo, the mistake of the config that the tests normalize
import {
  normalizeConfig,
  normalizeDependenciesRuleOptions,
} from "@boundaries/config";

import { normalizeConfigSafely } from "./NormalizeConfigSafely";

// The real normalization, which the tests only count, except where a test makes it throw what the library does not
jest.mock<{
  normalizeConfig: typeof normalizeConfig;
  normalizeDependenciesRuleOptions: typeof normalizeDependenciesRuleOptions;
}>("@boundaries/config", () => {
  const actual = jest.requireActual<{
    normalizeConfig: typeof normalizeConfig;
    normalizeDependenciesRuleOptions: typeof normalizeDependenciesRuleOptions;
  }>("@boundaries/config");
  return {
    ...actual,
    normalizeConfig: jest.fn(actual.normalizeConfig),
    normalizeDependenciesRuleOptions: jest.fn(
      actual.normalizeDependenciesRuleOptions
    ),
  };
});

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
 * @returns The config object, as the parsed text writes it.
 */
function createConfig(
  rules: Record<string, unknown>,
  settings: unknown = SETTINGS
) {
  return { settings, rules };
}

describe("NormalizeConfigSafely", () => {
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
              title: "Invalid entity selector",
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
          ["error", "Invalid entity selector"],
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
            "Invalid entity selector",
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

    describe("when what is thrown is not an error", () => {
      it("should use it as the title of the error", () => {
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
            title: "The selector broke",
          })
        );
      });
    });
  });
});
