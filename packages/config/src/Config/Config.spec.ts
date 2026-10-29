import { normalizeConfig } from "./Config";

const DEPENDENCIES_RULE = "boundaries/dependencies";

/**
 * The configuration of the quick-start guide of the docs.
 */
const QUICK_START_CONFIG = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*/*" },
      { type: "module", pattern: "modules/*" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
  rules: {
    [DEPENDENCIES_RULE]: [
      2,
      {
        default: "disallow",
        policies: [
          {
            from: { element: { type: "component" } },
            allow: { to: { element: { type: "helper" } } },
          },
          {
            from: { element: { type: "module" } },
            allow: { to: { element: { types: ["component", "helper"] } } },
          },
          {
            disallow: { to: { file: { categories: "test" } } },
          },
        ],
      },
    ],
  },
};

const VALID_SETTINGS = QUICK_START_CONFIG.settings;

describe("Config", () => {
  describe("normalizeConfig", () => {
    it("normalizes the quick-start configuration without diagnostics", () => {
      const { diagnostics } = normalizeConfig(QUICK_START_CONFIG);

      expect(diagnostics).toEqual([]);
    });

    it("normalizes the settings and the rule options of the quick-start configuration", () => {
      const { value } = normalizeConfig(QUICK_START_CONFIG);

      expect(value.settings.elementDescriptors).toHaveLength(3);
      expect(value.settings.fileDescriptors).toHaveLength(2);
      expect(value.rules.dependencies?.severity).toBe("error");
      expect(value.rules.dependencies?.options).toEqual(
        expect.objectContaining({
          default: "disallow",
          checkAllOrigins: false,
        })
      );
      expect(value.rules.dependencies?.options.policies).toHaveLength(3);
    });

    it("reports a config that is not an object, and normalizes it as an empty one", () => {
      const { value, diagnostics } = normalizeConfig("config");

      expect(diagnostics[0]).toEqual({
        level: "error",
        title: "Expected an object.",
        paths: [[]],
      });
      expect(value.rules).toEqual({});
      expect(value.settings.elementDescriptors).toEqual([]);
    });

    it("reports settings that are not an object", () => {
      const { diagnostics } = normalizeConfig({ settings: [] });

      expect(diagnostics[0]).toEqual({
        level: "error",
        title: `Key "settings": Expected an object.`,
        paths: [["settings"]],
      });
    });

    it("reports rules that are not an object", () => {
      const { value, diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: "rules",
      });

      expect(diagnostics).toEqual([
        {
          level: "error",
          title: `Key "rules": Expected an object.`,
          paths: [["rules"]],
        },
      ]);
      expect(value.rules).toEqual({});
    });

    it("prefixes the paths of the settings diagnostics with 'settings'", () => {
      const { diagnostics } = normalizeConfig({
        settings: {
          ...VALID_SETTINGS,
          "boundaries/elements": [
            ...VALID_SETTINGS["boundaries/elements"],
            { pattern: "invalid/*" },
          ],
        },
      });

      expect(diagnostics).toEqual([
        expect.objectContaining({
          level: "warning",
          title: "Some element descriptors are invalid and will be ignored.",
          paths: [["settings", "boundaries/elements", 3]],
        }),
      ]);
    });

    it("gives a problem with the whole settings the path 'settings'", () => {
      const { diagnostics } = normalizeConfig({ settings: {} });

      expect(diagnostics).toEqual([
        expect.objectContaining({
          level: "warning",
          title:
            "Please provide element descriptors using the 'boundaries/elements' setting, or file descriptors using the 'boundaries/files' setting.",
          paths: [["settings"]],
        }),
      ]);
    });

    it("passes the root path to the settings normalization", () => {
      const { value } = normalizeConfig(
        { settings: VALID_SETTINGS },
        { rootPath: "/repo" }
      );

      expect(value.settings.rootPath).toBe("/repo");
    });

    it("ignores the rules of other plugins and the core rules", () => {
      const { value, diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: {
          "no-console": "error",
          "import/no-unresolved": [2, { foo: true }],
          "boundaries-legacy/dependencies": 2,
        },
      });

      expect(diagnostics).toEqual([]);
      expect(value.rules).toEqual({});
    });

    it("reports a rule that the plugin does not have", () => {
      const { diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/foo": 2 },
      });

      expect(diagnostics).toEqual([
        {
          level: "error",
          title: `Key "rules": Key "boundaries/foo": Could not find "foo" in plugin "boundaries".`,
          paths: [["rules", "boundaries/foo"]],
        },
      ]);
    });

    it.each([0, "off", ["off", {}]])(
      "ignores a rule that the plugin does not have when its severity is %p, as ESLint does",
      (entry) => {
        const { value, diagnostics } = normalizeConfig({
          settings: VALID_SETTINGS,
          rules: { "boundaries/foo": entry },
        });

        expect(diagnostics).toEqual([]);
        expect(value.rules).toStrictEqual({});
      }
    );

    it("reports the severity of a rule that the plugin does not have before the rule", () => {
      const { diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/foo": "bogus" },
      });

      expect(diagnostics).toEqual([
        {
          level: "error",
          title: `Key "rules": Key "boundaries/foo": Expected severity of "off", 0, "warn", 1, "error", or 2.`,
          paths: [["rules", "boundaries/foo"]],
        },
      ]);
    });

    it.each([
      [0, "off"],
      ["off", "off"],
      [1, "warn"],
      ["warn", "warn"],
      [2, "error"],
      ["error", "error"],
      [[2], "error"],
    ])("reads the severity %p as '%s'", (entry, severity) => {
      const { value } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/no-private": entry },
      });

      expect(value.rules["no-private"]).toEqual({
        severity,
        options: undefined,
      });
    });

    it.each([
      [
        "a severity that ESLint does not accept",
        3,
        ["rules", "boundaries/no-private"],
      ],
      [
        "a severity in another case",
        "Error",
        ["rules", "boundaries/no-private"],
      ],
      ["an empty array", [], ["rules", "boundaries/no-private", 0]],
      [
        "an array with an invalid severity",
        ["on", {}],
        ["rules", "boundaries/no-private", 0],
      ],
    ])("reports %s", (_description, entry, path) => {
      const { value, diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/no-private": entry },
      });

      expect(diagnostics).toEqual([
        {
          level: "error",
          title: `Key "rules": Key "boundaries/no-private": Expected severity of "off", 0, "warn", 1, "error", or 2.`,
          paths: [path],
        },
      ]);
      expect(value.rules).toStrictEqual({});
    });

    it("keeps the options of the rules without policies as written", () => {
      const options = { allowUncles: true, message: "Private" };

      const { value } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/no-private": ["warn", options] },
      });

      expect(value.rules["no-private"]).toEqual({
        severity: "warn",
        options,
      });
    });

    it("normalizes the options of the deprecated element-types rule", () => {
      const { value } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/element-types": [2, { default: "allow" }] },
      });

      expect(value.rules["element-types"]?.options).toEqual(
        expect.objectContaining({ default: "allow", policies: [] })
      );
    });

    it("reports options that fail the rule schema and leaves the entry out", () => {
      const { value, diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { [DEPENDENCIES_RULE]: [2, { default: "deny" }] },
      });

      expect(diagnostics).toEqual([
        {
          level: "error",
          title: `[${DEPENDENCIES_RULE}] Invalid rule options.`,
          detail:
            'Value "deny" should be equal to one of the allowed values.\nMore info: https://www.jsboundaries.dev/docs/rules/dependencies/',
          paths: [["rules", DEPENDENCIES_RULE, 1, "default"]],
        },
      ]);
      expect(value.rules).toStrictEqual({});
    });

    it("reports more options than the rule takes at the rule entry", () => {
      const { diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { "boundaries/no-private": [2, {}, {}] },
      });

      expect(diagnostics[0].paths).toEqual([
        ["rules", "boundaries/no-private"],
      ]);
    });

    it("reports the deprecated syntax of the policies, with paths from the root of the config", () => {
      const { value, diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: {
          [DEPENDENCIES_RULE]: [
            2,
            {
              policies: [
                {
                  from: { element: { type: "component" } },
                  allow: { to: { element: { type: "helper" } } },
                },
                {
                  from: "module",
                  allow: { to: { element: { type: "helper" } } },
                },
              ],
            },
          ],
        },
      });

      expect(diagnostics).toEqual([
        expect.objectContaining({
          level: "deprecation",
          title: `[${DEPENDENCIES_RULE}] Detected legacy string element selectors in 1 policy at indices: 1.`,
          paths: [["rules", DEPENDENCIES_RULE, 1, "policies", 1]],
        }),
      ]);
      expect(value.rules.dependencies?.options.policies).toHaveLength(2);
    });

    it("does not report the deprecated syntax when the legacy-warnings setting is false", () => {
      const { diagnostics } = normalizeConfig({
        settings: { ...VALID_SETTINGS, "boundaries/legacy-warnings": false },
        rules: {
          [DEPENDENCIES_RULE]: [
            2,
            {
              policies: [
                {
                  from: "module",
                  allow: { to: { element: { type: "helper" } } },
                },
              ],
            },
          ],
        },
      });

      expect(diagnostics).toEqual([]);
    });

    it("lists a rule that is off without validating its options, as ESLint does", () => {
      const { value, diagnostics } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: {
          [DEPENDENCIES_RULE]: ["off", { default: "deny" }],
          "boundaries/no-private": [0, { allowUncles: "yes" }],
        },
      });

      expect(diagnostics).toEqual([]);
      expect(value.rules.dependencies).toEqual({
        severity: "off",
        options: expect.objectContaining({ default: "disallow" }),
      });
      expect(value.rules["no-private"]).toEqual({
        severity: "off",
        options: undefined,
      });
    });

    it("normalizes the valid options of a rule that is off", () => {
      const { value } = normalizeConfig({
        settings: VALID_SETTINGS,
        rules: { [DEPENDENCIES_RULE]: ["off", { default: "allow" }] },
      });

      expect(value.rules.dependencies?.options.default).toBe("allow");
    });

    it("reads the rules of the plugin with another name", () => {
      const { value, diagnostics } = normalizeConfig(
        {
          settings: VALID_SETTINGS,
          rules: {
            "custom/dependencies": [2, { default: "allow" }],
            "custom/foo": 2,
            [DEPENDENCIES_RULE]: 2,
          },
        },
        { pluginName: "custom" }
      );

      expect(value.rules.dependencies?.options.default).toBe("allow");
      expect(diagnostics).toEqual([
        expect.objectContaining({
          title: `Key "rules": Key "custom/foo": Could not find "foo" in plugin "custom".`,
        }),
      ]);
    });

    it("does not mutate its input", () => {
      const config = structuredClone(QUICK_START_CONFIG);

      normalizeConfig(config);

      expect(config).toEqual(QUICK_START_CONFIG);
    });
  });
});
