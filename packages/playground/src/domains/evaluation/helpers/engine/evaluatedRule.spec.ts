import { areRulesValid } from "./diagnostics";
import type { TextRange } from "./engine.types";
import { selectRule } from "./evaluatedRule";
import type { RuleSelection } from "./evaluatedRule.types";
import { normalizeConfigSafely } from "./normalizeConfigSafely";
import { parseConfig } from "./parseConfig";
import type { ConfigRead } from "./parseConfig.types";

/**
 * Reads a config text as one JSON5 object.
 * @param text The config text.
 * @returns The config as written.
 */
function read(text: string): ConfigRead {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  return config;
}

/**
 * Selects the rule of a config text as the engine does.
 * @param text The config text.
 * @returns The rule, or why there is none.
 */
function select(text: string): RuleSelection {
  const config = read(text);
  const { value, diagnostics } = normalizeConfigSafely({
    settings: config.value.settings,
    rules: config.value.rules,
  });
  return selectRule({
    config,
    rules: value.rules,
    rulesValid: areRulesValid(diagnostics),
  });
}

/**
 * Reads the text a range covers.
 * @param text The config text.
 * @param range A range of the text.
 * @param range.from
 * @param range.to
 * @returns The text in the range.
 */
function slice(text: string, { from, to }: TextRange): string {
  return text.slice(from, to);
}

const POLICIES_CONFIG = `{
  rules: {
    "boundaries/dependencies": ["warn", {
      default: "allow",
      policies: [
        { from: "a", allow: "b" },
        { disallow: { to: { file: { categories: "test" } } } },
      ],
    }],
  },
}`;

describe("EvaluatedRule", () => {
  describe("selectRule", () => {
    it.each([
      [
        "the options of a rule fail its schema",
        '{ rules: { "boundaries/dependencies": [2, { default: "maybe" }] } }',
      ],
      [
        "a rule of the plugin does not exist, even when the dependencies rule is valid",
        '{ rules: { "boundaries/dependencies": [2, {}], "boundaries/typo": 2 } }',
      ],
      [
        "a policy cannot be normalized",
        '{ rules: { "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }] } }',
      ],
    ])("should say that the rules are invalid when %s", (_title, text) => {
      // Act
      const selection = select(text);

      // Assert
      expect(selection).toEqual({
        ruleName: "boundaries/dependencies",
        notEvaluated: "rules-invalid",
      });
    });

    it("should say that the rules are invalid before it looks for the rule", () => {
      // Act
      const selection = select('{ rules: { "boundaries/no-private": "on" } }');

      // Assert
      expect(selection).toEqual({
        ruleName: undefined,
        notEvaluated: "rules-invalid",
      });
    });

    it.each([
      ["no rules", "{}"],
      [
        "only other rules of the plugin",
        '{ rules: { "boundaries/no-private": 2 } }',
      ],
      [
        "only the rules of another plugin",
        '{ rules: { "import/no-cycle": 2 } }',
      ],
    ])(
      "should say that there is no rule when the config has %s",
      (_title, text) => {
        // Act
        const selection = select(text);

        // Assert
        expect(selection).toEqual({
          ruleName: undefined,
          notEvaluated: "no-rule",
        });
      }
    );

    it.each([
      ["off", '"off"'],
      ["0", "0"],
      ["off with options", '["off", { policies: [] }]'],
      [
        "off with options that fail the schema, as ESLint does not validate them",
        '["off", { default: "maybe" }]',
      ],
      [
        "off with a policy that cannot be normalized, which the normalized rules leave out",
        '["off", { policies: [{ disallow: {} }] }]',
      ],
    ])(
      "should say that the rule is off when its severity is %s",
      (_title, entry) => {
        // Act
        const selection = select(
          `{ rules: { "boundaries/dependencies": ${entry} } }`
        );

        // Assert
        expect(selection).toEqual({
          ruleName: "boundaries/dependencies",
          notEvaluated: "rule-off",
        });
      }
    );

    it("should say that the rule is off when the deprecated rule is the one written", () => {
      // Act
      const selection = select('{ rules: { "boundaries/element-types": 0 } }');

      // Assert
      expect(selection).toEqual({
        ruleName: "boundaries/element-types",
        notEvaluated: "rule-off",
      });
    });

    it.each([
      ["a severity alone", "2"],
      ["a name for the severity", '"error"'],
      ["a list with only the severity", "[1]"],
    ])(
      "should say that the rule has no options when its entry is %s",
      (_title, entry) => {
        // Act
        const selection = select(
          `{ rules: { "boundaries/dependencies": ${entry} } }`
        );

        // Assert
        expect(selection).toEqual({
          ruleName: "boundaries/dependencies",
          notEvaluated: "no-options",
        });
      }
    );

    it("should select the rule when its options are an empty object", () => {
      // Act
      const selection = select(
        '{ rules: { "boundaries/dependencies": [2, {}] } }'
      );

      // Assert
      expect(selection.notEvaluated).toBeUndefined();
      expect(selection.rule?.policies).toEqual([]);
    });

    it.each([
      ["2", "error"],
      ['"error"', "error"],
      ["1", "warning"],
      ['"warn"', "warning"],
    ])(
      "should map the severity %s to the level %s of a dependency that the rule disallows",
      (severity, level) => {
        // Act
        const selection = select(
          `{ rules: { "boundaries/dependencies": [${severity}, {}] } }`
        );

        // Assert
        expect(selection.rule?.level).toBe(level);
      }
    );

    it("should select the options of the config normalized, with a reference for each policy and the default", () => {
      // Act
      const { rule } = select(POLICIES_CONFIG);

      // Assert
      expect(rule?.level).toBe("warning");
      expect(rule?.options).toMatchObject({
        default: "allow",
        policies: [
          { from: [{ element: [{ type: "a" }] }] },
          { disallow: [{ to: [{ file: [{ categories: "test" }] }] }] },
        ],
      });
      expect(rule?.policies.map(({ index }) => index)).toEqual([0, 1]);
      expect(rule?.defaultPolicy.index).toBeNull();
    });

    it("should place each policy at its text", () => {
      // Act
      const { rule } = select(POLICIES_CONFIG);

      // Assert
      expect(
        rule?.policies.map(({ range }) => slice(POLICIES_CONFIG, range))
      ).toEqual([
        '{ from: "a", allow: "b" }',
        '{ disallow: { to: { file: { categories: "test" } } } }',
      ]);
      expect(rule?.policies.map(({ range }) => range.line)).toEqual([6, 7]);
    });

    it("should place the default at its value", () => {
      // Act
      const { rule } = select(POLICIES_CONFIG);

      // Assert
      expect(slice(POLICIES_CONFIG, rule!.defaultPolicy.range)).toBe('"allow"');
      expect(rule?.defaultPolicy.range).toMatchObject({ line: 4, column: 16 });
    });

    it("should place the default at the options when it is not written", () => {
      // Arrange
      const text =
        '{ rules: { "boundaries/dependencies": [2, { policies: [] }] } }';

      // Act
      const { rule } = select(text);

      // Assert
      expect(slice(text, rule!.defaultPolicy.range)).toBe("{ policies: [] }");
    });

    it("should place the default at the options when they are an empty object", () => {
      // Arrange
      const text = '{ rules: { "boundaries/dependencies": [2, {}] } }';

      // Act
      const { rule } = select(text);

      // Assert
      expect(slice(text, rule!.defaultPolicy.range)).toBe("{}");
    });

    it("should place the policies of the deprecated rules key", () => {
      // Arrange
      const text = `{
  rules: {
    "boundaries/element-types": [2, { default: "disallow", rules: [{ from: "a", allow: "b" }] }],
  },
}`;

      // Act
      const { rule } = select(text);

      // Assert
      expect(rule?.policies).toHaveLength(1);
      expect(slice(text, rule!.policies[0].range)).toBe(
        '{ from: "a", allow: "b" }'
      );
    });

    it("should place the policies at policies when both keys are written", () => {
      // Arrange
      const text =
        '{ rules: { "boundaries/dependencies": [2, { rules: [{ from: "x", allow: "y" }], policies: [{ from: "a", allow: "b" }] }] } }';

      // Act
      const { rule } = select(text);

      // Assert
      expect(slice(text, rule!.policies[0].range)).toBe(
        '{ from: "a", allow: "b" }'
      );
    });

    it("should select the deprecated rule when it is the only one written", () => {
      // Act
      const { rule } = select(
        '{ rules: { "boundaries/element-types": ["warn", { default: "allow" }] } }'
      );

      // Assert
      expect(rule?.level).toBe("warning");
      expect(rule?.options.default).toBe("allow");
    });

    it("should select the dependencies rule when both are written", () => {
      // Act
      const { rule } = select(`{
  rules: {
    "boundaries/element-types": [2, { default: "allow" }],
    "boundaries/dependencies": [2, { default: "disallow" }],
  },
}`);

      // Assert
      expect(rule?.options.default).toBe("disallow");
    });

    describe("the rule it chooses", () => {
      const ELEMENT_TYPES_ENTRY =
        '[2, { default: "disallow", rules: [{ from: "a", allow: "b" }] }]';

      it.each([
        [
          "only the dependencies rule",
          '{ rules: { "boundaries/dependencies": 2 } }',
          "boundaries/dependencies",
        ],
        [
          "only the deprecated rule",
          '{ rules: { "boundaries/element-types": 2 } }',
          "boundaries/element-types",
        ],
        [
          "both, written in the order of the deprecated one first",
          '{ rules: { "boundaries/element-types": 2, "boundaries/dependencies": 0 } }',
          "boundaries/dependencies",
        ],
        [
          "the dependencies rule with options that fail its schema, which the normalized config leaves out",
          '{ rules: { "boundaries/element-types": 2, "boundaries/dependencies": [2, { default: "maybe" }] } }',
          "boundaries/dependencies",
        ],
      ])(
        "should choose the dependencies rule when it is written and no rule runs: %s",
        (_title, text, expected) => {
          // Act
          const { ruleName } = select(text);

          // Assert
          expect(ruleName).toBe(expected);
        }
      );

      it.each([
        ["no rules", "{}"],
        [
          "rules that are not an object",
          '{ rules: ["boundaries/dependencies"] }',
        ],
        [
          "rules of the plugin that are not those",
          '{ rules: { "boundaries/no-private": 2, "boundaries/external": 2 } }',
        ],
        [
          "the rules of another plugin",
          '{ rules: { "other/dependencies": 2, "import/no-cycle": 2 } }',
        ],
      ])("should choose none for %s", (_title, text) => {
        // Act
        const { ruleName } = select(text);

        // Assert
        expect(ruleName).toBeUndefined();
      });

      it("should choose the dependencies rule when both run", () => {
        // Act
        const { ruleName } = select(`{
  rules: {
    "boundaries/element-types": ${ELEMENT_TYPES_ENTRY},
    "boundaries/dependencies": [2, { default: "allow" }],
  },
}`);

        // Assert
        expect(ruleName).toBe("boundaries/dependencies");
      });

      it.each([
        ["off", '"off"'],
        ["off by its number", "0"],
        ["off with options", '["off", { default: "allow" }]'],
        [
          "off with options that fail the schema, as ESLint does not validate them",
          '["off", { default: "maybe" }]',
        ],
        [
          "off with a policy that cannot be normalized, which the normalized rules leave out",
          '["off", { policies: [{ disallow: {} }] }]',
        ],
        ["a severity alone", "2"],
        ["a list with only the severity", "[1]"],
      ])(
        "should choose the deprecated rule, and place its policies, when the dependencies rule is %s",
        (_title, entry) => {
          // Arrange
          const text = `{
  rules: {
    "boundaries/dependencies": ${entry},
    "boundaries/element-types": ${ELEMENT_TYPES_ENTRY},
  },
}`;

          // Act
          const { ruleName, rule, notEvaluated } = select(text);

          // Assert
          expect(ruleName).toBe("boundaries/element-types");
          expect(notEvaluated).toBeUndefined();
          expect(rule?.options.default).toBe("disallow");
          expect(slice(text, rule!.policies[0].range)).toBe(
            '{ from: "a", allow: "b" }'
          );
        }
      );

      it("should choose the deprecated rule when it is written before the dependencies rule, which is off", () => {
        // Act
        const { ruleName, rule } = select(
          `{ rules: { "boundaries/element-types": ${ELEMENT_TYPES_ENTRY}, "boundaries/dependencies": 0 } }`
        );

        // Assert
        expect(ruleName).toBe("boundaries/element-types");
        expect(rule?.level).toBe("error");
      });

      it("should keep the dependencies rule, and the reason it is not evaluated, when the deprecated rule is off or has no options", () => {
        // Arrange
        const texts = [
          '{ rules: { "boundaries/dependencies": 0, "boundaries/element-types": "off" } }',
          '{ rules: { "boundaries/dependencies": 0, "boundaries/element-types": 2 } }',
          '{ rules: { "boundaries/dependencies": 2, "boundaries/element-types": "off" } }',
          '{ rules: { "boundaries/element-types": [1], "boundaries/dependencies": "error" } }',
        ];

        // Act
        const selections = texts.map(select);

        // Assert
        expect(selections).toEqual([
          { ruleName: "boundaries/dependencies", notEvaluated: "rule-off" },
          { ruleName: "boundaries/dependencies", notEvaluated: "rule-off" },
          { ruleName: "boundaries/dependencies", notEvaluated: "no-options" },
          { ruleName: "boundaries/dependencies", notEvaluated: "no-options" },
        ]);
      });

      it("should keep the dependencies rule when the rules are invalid, because ESLint runs none of them", () => {
        // Act
        const selection = select(
          `{ rules: { "boundaries/dependencies": [2, { default: "maybe" }], "boundaries/element-types": ${ELEMENT_TYPES_ENTRY} } }`
        );

        // Assert
        expect(selection).toEqual({
          ruleName: "boundaries/dependencies",
          notEvaluated: "rules-invalid",
        });
      });

      it("should keep the deprecated rule when the rules are invalid and it is the only one written", () => {
        // Act
        const selection = select(
          '{ rules: { "boundaries/element-types": [2, { default: "maybe" }] } }'
        );

        // Assert
        expect(selection).toEqual({
          ruleName: "boundaries/element-types",
          notEvaluated: "rules-invalid",
        });
      });
    });
  });
});
