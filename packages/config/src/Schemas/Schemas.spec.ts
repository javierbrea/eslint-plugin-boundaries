import {
  NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP,
  RULE_NAMES,
  RULE_NAMES_MAP,
} from "../Shared";
import type { RuleName } from "../Shared";

import { getRuleOptionsSchema, rulesOptionsSchema } from "./Schemas";
import { validateRuleOptionsList } from "./Validator";

const DEPENDENCIES_DOCS_LINK =
  "More info: https://www.jsboundaries.dev/docs/rules/dependencies/";

/**
 * Values to place in the options of a rule, by description.
 */
type Values = Record<string, unknown>;

/**
 * Returns the descriptions of the values that make the options of a rule fail its schema.
 * @param ruleName - The name of the rule.
 * @param buildOptions - Builds the options of the rule entry with a value in the place under test.
 * @param values - The values to try, by description.
 * @returns The descriptions of the rejected values.
 */
function findRejected(
  ruleName: RuleName,
  buildOptions: (value: unknown) => unknown,
  values: Values
): string[] {
  return Object.entries(values)
    .filter(
      ([, value]) =>
        validateRuleOptionsList(ruleName, [buildOptions(value)]) !== null
    )
    .map(([description]) => description);
}

/**
 * Returns the descriptions of the values that make the options of a rule pass its schema.
 * @param ruleName - The name of the rule.
 * @param buildOptions - Builds the options of the rule entry with a value in the place under test.
 * @param values - The values to try, by description.
 * @returns The descriptions of the accepted values.
 */
function findAccepted(
  ruleName: RuleName,
  buildOptions: (value: unknown) => unknown,
  values: Values
): string[] {
  return Object.keys(values).filter(
    (description) =>
      validateRuleOptionsList(ruleName, [buildOptions(values[description])]) ===
      null
  );
}

/**
 * Determines whether a JSON schema uses the `default` keyword anywhere, which would make `ajv` change the validated data.
 * @param value - The schema, or a part of it.
 * @param isPropertiesMap - Whether the value is a `properties` map, whose keys are property names instead of keywords.
 * @returns True if the keyword is used.
 */
function hasDefaultKeyword(value: unknown, isPropertiesMap = false): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasDefaultKeyword(item));
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return Object.entries(value).some(
    ([key, child]) =>
      (!isPropertiesMap && key === "default") ||
      hasDefaultKeyword(child, key === "properties")
  );
}

describe("Schemas", () => {
  describe("rulesOptionsSchema", () => {
    it("returns a non-legacy schema with 'from'/'to'/'dependency' properties by default", () => {
      const [schema] = rulesOptionsSchema();
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: Record<string, unknown>; anyOf: unknown[] };
        }
      ).items;

      expect(Object.keys(ruleItem.properties)).toEqual(
        expect.arrayContaining([
          "from",
          "to",
          "dependency",
          "allow",
          "disallow",
        ])
      );
      expect(ruleItem.anyOf).toEqual(
        expect.arrayContaining([
          { required: ["allow"] },
          { required: ["disallow"] },
          { required: ["from", "allow"] },
          { required: ["dependency", "disallow"] },
        ])
      );
    });
  });

  describe("getRuleOptionsSchema", () => {
    it.each(RULE_NAMES)(
      "does not use the 'default' keyword in the schema of rule '%s'",
      (ruleName) => {
        expect(hasDefaultKeyword(getRuleOptionsSchema(ruleName))).toBe(false);
      }
    );

    it.each(["checkAllOrigins", "checkUnknownLocals", "checkInternals"])(
      "describes the check option '%s' of the dependencies rule for the tools that read the schema",
      (option) => {
        const [schema] = getRuleOptionsSchema(RULE_NAMES_MAP.DEPENDENCIES);
        const properties = schema.properties as Record<
          string,
          Record<string, unknown>
        >;

        expect(properties[option].description).toMatch(/\S/);
      }
    );

    it("describes the option 'require' of the no-unknown-dependencies rule with a sentence for each value", () => {
      const [schema] = getRuleOptionsSchema(
        RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES
      );
      const properties = schema.properties as Record<
        string,
        Record<string, string>
      >;
      const values = Object.values(NO_UNKNOWN_DEPENDENCIES_REQUIRE_MAP);

      const [generalSentence, ...valueSentences] =
        properties.require.description.split(/(?<=\.) /);

      expect(generalSentence).not.toContain('"');
      expect(valueSentences).toHaveLength(values.length);
      expect(valueSentences).toEqual(
        expect.arrayContaining(
          values.map((value) => expect.stringMatching(`^"${value}"`))
        )
      );
    });

    describe("options of the dependencies rule", () => {
      const rule = RULE_NAMES_MAP.DEPENDENCIES;
      const withMessage = (value: unknown): unknown => ({ message: value });

      it("accepts options without any property", () => {
        const result = validateRuleOptionsList(rule, [{}]);

        expect(result).toBeNull();
      });

      it("accepts every option of the rule together", () => {
        const policy = { from: "a", to: "b", dependency: "c", allow: "d" };

        const result = validateRuleOptionsList(rule, [
          {
            message: "Not allowed",
            default: "allow",
            policies: [policy],
            rules: [policy],
            checkAllOrigins: true,
            checkUnknownLocals: false,
            checkInternals: true,
          },
        ]);

        expect(result).toBeNull();
      });

      it("accepts the same options for the deprecated element-types name", () => {
        const result = validateRuleOptionsList(RULE_NAMES_MAP.ELEMENT_TYPES, [
          { default: "disallow", checkInternals: true, rules: [] },
        ]);

        expect(result).toBeNull();
      });

      it("accepts only a string as the default message", () => {
        const values = {
          "a string": "Not allowed",
          "a number": 1,
          "a boolean": true,
          null: null,
          "an object": {},
        };

        const rejected = findRejected(rule, withMessage, values);

        expect(rejected).toEqual([
          "a number",
          "a boolean",
          "null",
          "an object",
        ]);
      });

      it("accepts only an object as options", () => {
        const values = {
          "an object": {},
          "a string": "allow",
          "a list": [],
          "a boolean": true,
          null: null,
        };

        const rejected = findRejected(rule, (value) => value, values);

        expect(rejected).toEqual(["a string", "a list", "a boolean", "null"]);
      });

      it("reports a default effect that is not a string as a type error", () => {
        const result = validateRuleOptionsList(rule, [{ default: 1 }]);

        expect(result?.detail).toBe(
          `Value 1 should be string.\n${DEPENDENCIES_DOCS_LINK}`
        );
      });

      it("accepts only allow or disallow as the default effect", () => {
        const values = {
          allow: "allow",
          disallow: "disallow",
          "another string": "deny",
          "an empty string": "",
          "a number": 1,
          "a list": ["allow"],
        };

        const rejected = findRejected(
          rule,
          (value) => ({ default: value }),
          values
        );

        expect(rejected).toEqual([
          "another string",
          "an empty string",
          "a number",
          "a list",
        ]);
      });

      it.each(["checkAllOrigins", "checkUnknownLocals", "checkInternals"])(
        "accepts only a boolean in the check option '%s'",
        (option) => {
          const values = {
            true: true,
            false: false,
            "a string": "yes",
            "a number": 1,
            null: null,
          };

          const rejected = findRejected(
            rule,
            (value) => ({ [option]: value }),
            values
          );

          expect(rejected).toEqual(["a string", "a number", "null"]);
        }
      );

      it.each(["policies", "rules"])(
        "accepts only a list of policies in the option '%s'",
        (option) => {
          const values = {
            "an empty list": [],
            "a list of policies": [{ allow: "a" }, { disallow: "b" }],
            "an object": { allow: "a" },
            "a string": "a",
            "a list of strings": ["a"],
            "a list of lists": [[{ allow: "a" }]],
            "a list with a policy that is not valid": [
              { allow: "a" },
              { allow: "a", unknown: true },
            ],
          };

          const rejected = findRejected(
            rule,
            (value) => ({ [option]: value }),
            values
          );

          expect(rejected).toEqual([
            "an object",
            "a string",
            "a list of strings",
            "a list of lists",
            "a list with a policy that is not valid",
          ]);
        }
      );

      it.each(["from", "to", "dependency", "allow", "disallow"])(
        "accepts a string, an object or a list in the property '%s' of a policy",
        (property) => {
          const values = {
            "a string": "a",
            "an object": { element: { type: "a" } },
            "a list": [{ element: { type: "a" } }],
            "an empty object": {},
            "an empty list": [],
            "a number": 1,
            "a boolean": true,
            null: null,
          };
          const buildOptions = (value: unknown): unknown => ({
            policies: [{ allow: "a", [property]: value }],
          });

          const rejected = findRejected(rule, buildOptions, values);

          expect(rejected).toEqual(["a number", "a boolean", "null"]);
        }
      );

      it("accepts a string or a list of strings as the import kind of a policy", () => {
        const values = {
          "a string": "type",
          "a list of strings": ["type", "value"],
          "an empty list": [],
          "a number": 1,
          "a list with a number": ["type", 1],
          "an object": { kind: "type" },
        };

        const rejected = findRejected(
          rule,
          (value) => ({ policies: [{ allow: "a", importKind: value }] }),
          values
        );

        expect(rejected).toEqual([
          "a number",
          "a list with a number",
          "an object",
        ]);
      });

      it("accepts only a string as the message of a policy", () => {
        const values = {
          "a string": "Not allowed",
          "a number": 1,
          null: null,
        };

        const rejected = findRejected(
          rule,
          (value) => ({ policies: [{ allow: "a", message: value }] }),
          values
        );

        expect(rejected).toEqual(["a number", "null"]);
      });

      it("rejects properties of a policy that the rule does not support", () => {
        const options = { policies: [{ allow: "a", target: "b" }] };

        const result = validateRuleOptionsList(rule, [options]);

        expect(result?.detail).toContain(
          'Unexpected property "target". Expected properties: "from", "to", "dependency", "allow", "disallow", "importKind", "message".'
        );
      });

      it.each([
        ["allow", { allow: "a" }],
        ["disallow", { disallow: "a" }],
        ["from and allow", { from: "a", allow: "b" }],
        ["from and disallow", { from: "a", disallow: "b" }],
        ["to and allow", { to: "a", allow: "b" }],
        ["to and disallow", { to: "a", disallow: "b" }],
        ["dependency and allow", { dependency: "a", allow: "b" }],
        ["dependency and disallow", { dependency: "a", disallow: "b" }],
        [
          "every selector and allow",
          { from: "a", to: "b", dependency: "c", allow: "d" },
        ],
      ])("accepts a policy with %s", (_description, policy) => {
        const result = validateRuleOptionsList(rule, [{ policies: [policy] }]);

        expect(result).toBeNull();
      });

      it.each([
        ["an empty policy", {}],
        ["only from", { from: "a" }],
        ["only to", { to: "a" }],
        ["only dependency", { dependency: "a" }],
        ["from, to and dependency", { from: "a", to: "b", dependency: "c" }],
        ["only a message", { message: "Not allowed" }],
        ["only an import kind", { importKind: "type" }],
      ])(
        "rejects a policy with %s and without allow or disallow",
        (_d, policy) => {
          const result = validateRuleOptionsList(rule, [
            { policies: [policy] },
          ]);

          expect(result?.paths).toEqual([[0, "policies", 0]]);
        }
      );

      it("names the missing property in each way of completing a policy with every selector", () => {
        const policy = { from: "a", to: "b", dependency: "c" };

        const result = validateRuleOptionsList(rule, [{ policies: [policy] }]);

        expect(result?.detail.split("\n").slice(0, -1)).toEqual(
          [
            "allow",
            "disallow",
            "allow",
            "disallow",
            "allow",
            "disallow",
            "allow",
            "disallow",
          ]
            .map(
              (property) =>
                `Value ${JSON.stringify(policy)} should have required property '.${property}'.`
            )
            .concat(
              `Value ${JSON.stringify(policy)} should match some schema in anyOf.`
            )
        );
      });

      it("names the missing selector in each way of completing a policy with only a message", () => {
        const policy = { message: "Not allowed" };

        const result = validateRuleOptionsList(rule, [{ policies: [policy] }]);

        expect(result?.detail.split("\n").slice(0, -1)).toEqual(
          [
            "allow",
            "disallow",
            "from",
            "from",
            "to",
            "to",
            "dependency",
            "dependency",
          ]
            .map(
              (property) =>
                `Value ${JSON.stringify(policy)} should have required property '.${property}'.`
            )
            .concat(
              `Value ${JSON.stringify(policy)} should match some schema in anyOf.`
            )
        );
      });
    });

    describe("policies of the legacy rules", () => {
      const MATCHERS = {
        "a matcher": "helpers",
        "a matcher with captured values": ["helpers", { family: "ui" }],
        "several matchers": ["helpers", "components"],
        "several matchers, one with captured values": [
          "helpers",
          ["components", { family: "ui" }],
        ],
        "several matchers with captured values": [
          ["helpers", { family: "ui" }],
          ["components", { family: "ui" }],
        ],
        "an empty list of matchers": [],
        "a number": 1,
        "an object": { type: "helpers" },
        null: null,
        "a matcher with a number as captured values": ["helpers", 1],
        "a list with a number": [1, "components"],
        "several matchers, one with a number as captured values": [
          ["helpers", 1],
        ],
        "several matchers, one with a number as matcher": [
          [1, { family: "ui" }],
        ],
        "several matchers followed by captured values": [
          "helpers",
          "components",
          { family: "ui" },
        ],
        "a list with an object": [{ type: "helpers" }],
      };
      const REJECTED_MATCHERS = [
        "a number",
        "an object",
        "null",
        "a matcher with a number as captured values",
        "a list with a number",
        "several matchers, one with a number as captured values",
        "several matchers, one with a number as matcher",
        "several matchers followed by captured values",
        "a list with an object",
      ];

      describe("entry-point", () => {
        const rule = RULE_NAMES_MAP.ENTRY_POINT;

        it.each(["policies", "rules"])(
          "accepts a policy with a target and allow or disallow in the option '%s'",
          (option) => {
            const result = validateRuleOptionsList(rule, [
              {
                default: "disallow",
                message: "Not allowed",
                [option]: [
                  { target: "helpers", allow: "components" },
                  { target: "helpers", disallow: ["components"] },
                  {
                    target: "helpers",
                    allow: "components",
                    importKind: "type",
                  },
                  { target: "helpers", allow: "components", message: "No" },
                ],
              },
            ]);

            expect(result).toBeNull();
          }
        );

        it.each(["policies", "rules"])(
          "accepts only a list of policies in the option '%s'",
          (option) => {
            const values = {
              "a list": [{ target: "helpers", allow: "components" }],
              "an object": { target: "helpers", allow: "components" },
              "a string": "helpers",
              "a list with a string": ["helpers"],
            };

            const rejected = findRejected(
              rule,
              (value) => ({ [option]: value }),
              values
            );

            expect(rejected).toEqual([
              "an object",
              "a string",
              "a list with a string",
            ]);
          }
        );

        it.each([
          ["without a target", { allow: "components" }],
          ["without allow or disallow", { target: "helpers" }],
          ["with from instead of target", { from: "helpers", allow: "a" }],
          ["with a modern selector", { target: "a", to: "b", allow: "c" }],
          ["with a modern selector only", { dependency: "a", allow: "c" }],
          ["without properties", {}],
          ["with an unknown property", { target: "a", allow: "b", other: 1 }],
        ])("rejects a policy %s", (_description, policy) => {
          const result = validateRuleOptionsList(rule, [
            { policies: [policy] },
          ]);

          expect(result?.paths).toContainEqual([0, "policies", 0]);
        });

        it("names the missing property in each way of completing a policy", () => {
          const policy = { message: "Not allowed" };

          const result = validateRuleOptionsList(rule, [
            { policies: [policy] },
          ]);

          expect(result?.detail.split("\n").slice(0, -1)).toEqual(
            ["target", "target"]
              .map(
                (property) =>
                  `Value ${JSON.stringify(policy)} should have required property '.${property}'.`
              )
              .concat(
                `Value ${JSON.stringify(policy)} should match some schema in anyOf.`
              )
          );
        });

        it.each(["allow", "disallow"])(
          "accepts only matchers in the property '%s' of a policy",
          (property) => {
            const rejected = findRejected(
              rule,
              (value) => ({
                policies: [{ target: "helpers", [property]: value }],
              }),
              MATCHERS
            );

            expect(rejected).toEqual(REJECTED_MATCHERS);
          }
        );

        it("accepts only an object as options", () => {
          const values = {
            "an object": {},
            "a string": "helpers",
            "a list": [],
          };

          const rejected = findRejected(rule, (value) => value, values);

          expect(rejected).toEqual(["a string", "a list"]);
        });

        it("accepts any object as the captured values of a matcher", () => {
          const values = {
            "an empty object": {},
            "an object": { family: "ui", names: ["a", "b"] },
            "a list": ["family"],
            "a string": "family",
          };

          const rejected = findRejected(
            rule,
            (value) => ({
              policies: [{ target: "helpers", allow: [["components", value]] }],
            }),
            values
          );

          expect(rejected).toEqual(["a list", "a string"]);
        });
      });

      describe("external", () => {
        const rule = RULE_NAMES_MAP.EXTERNAL;
        const OPTIONS = {
          "an empty object": {},
          specifiers: { specifiers: ["a", "b"] },
          "a path": { path: "src/**" },
          "a list of paths": { path: ["src/**", "lib/**"] },
          "specifiers and a path": { specifiers: ["a"], path: "src/**" },
          "specifiers that are not a list": { specifiers: "a" },
          "specifiers that are not strings": { specifiers: ["a", 1] },
          "a path that is not a string": { path: 1 },
          "a path list that has not strings": { path: ["src/**", 1] },
          "an unknown property": { other: "a" },
          "a number": 1,
          null: null,
        };
        const REJECTED_OPTIONS = [
          "specifiers that are not a list",
          "specifiers that are not strings",
          "a path that is not a string",
          "a path list that has not strings",
          "an unknown property",
          "a number",
          "null",
        ];

        it("accepts a policy with from and allow or disallow", () => {
          const result = validateRuleOptionsList(rule, [
            {
              policies: [
                { from: "helpers", allow: "components" },
                { from: "helpers", disallow: ["components"] },
                {
                  from: "helpers",
                  allow: [["lodash", { specifiers: ["map"] }]],
                },
              ],
            },
          ]);

          expect(result).toBeNull();
        });

        it.each([
          ["with target instead of from", { target: "helpers", allow: "a" }],
          ["without from", { allow: "components" }],
          ["without allow or disallow", { from: "helpers" }],
          ["with a modern selector", { from: "a", to: "b", allow: "c" }],
        ])("rejects a policy %s", (_description, policy) => {
          const result = validateRuleOptionsList(rule, [
            { policies: [policy] },
          ]);

          expect(result?.paths).toContainEqual([0, "policies", 0]);
        });

        it.each([
          ["an object", { type: "b" }],
          ["a list of objects", [{ type: "b" }]],
        ])("rejects %s as the matchers of a policy", (_description, allow) => {
          const result = validateRuleOptionsList(rule, [
            { policies: [{ from: "a", allow }] },
          ]);

          expect(result?.paths).toContainEqual([0, "policies", 0, "allow"]);
        });

        it.each(["allow", "disallow"])(
          "accepts only the options of a matcher in the property '%s' of a policy",
          (property) => {
            const rejected = findRejected(
              rule,
              (value) => ({
                policies: [{ from: "helpers", [property]: ["lodash", value] }],
              }),
              OPTIONS
            );

            expect(rejected).toEqual(REJECTED_OPTIONS);
          }
        );

        it.each(["allow", "disallow"])(
          "accepts only the options of a matcher of a list in the property '%s' of a policy",
          (property) => {
            const rejected = findRejected(
              rule,
              (value) => ({
                policies: [
                  {
                    from: "helpers",
                    [property]: ["axios", ["lodash", value]],
                  },
                ],
              }),
              OPTIONS
            );

            expect(rejected).toEqual(REJECTED_OPTIONS);
          }
        );
      });
    });

    describe("selectors of the legacy rules", () => {
      const rule = RULE_NAMES_MAP.ENTRY_POINT;
      type Place = [description: string, build: (value: unknown) => unknown];

      /**
       * Builds the options of the entry-point rule with a selector as the target of its policy.
       * @param target - The selector.
       * @returns The options.
       */
      const withTarget = (target: unknown): unknown => ({
        policies: [{ target, allow: "*" }],
      });
      const findRejectedInTarget = (
        build: (value: unknown) => unknown,
        values: Values
      ): string[] =>
        findRejected(rule, (value) => withTarget(build(value)), values);
      const findAcceptedInTarget = (
        build: (value: unknown) => unknown,
        values: Values
      ): string[] =>
        findAccepted(rule, (value) => withTarget(build(value)), values);

      /**
       * Builds the places of a selector where a property can be placed.
       * @param description - Describes the selector that has the property.
       * @param properties - The names of the properties.
       * @param wrap - Places a selector in the target.
       * @returns The places, one per property.
       */
      const placesOf = (
        description: string,
        properties: string[],
        wrap: (selector: unknown) => unknown
      ): Place[] =>
        properties.map((property) => [
          `the '${property}' of ${description}`,
          (value) => wrap({ [property]: value }),
        ]);

      /**
       * Builds the places of a property in the selectors that accept it, in a single selector and in a list.
       * @param descriptions - Describes the selector and the list of selectors.
       * @param descriptions."0"
       * @param descriptions."1"
       * @param properties - The names of the properties.
       * @param wrap - Places a selector in the target.
       * @returns The places, one per property.
       */
      const placesIn = (
        [single, list]: [string, string],
        properties: string[],
        wrap: (selector: unknown) => unknown
      ): Place[] => [
        ...placesOf(single, properties, wrap),
        ...placesOf(list, properties, (selector) => wrap([selector])),
      ];

      const ELEMENT_PATTERN_PROPERTIES = [
        "path",
        "elementPath",
        "internalPath",
        "elementInternalPath",
        "fileInternalPath",
        "type",
        "category",
        "origin",
      ];
      const PATTERN_PLACES: Place[] = [
        ...placesOf(
          "an element selector",
          ELEMENT_PATTERN_PROPERTIES,
          (s) => s
        ),
        ...placesOf(
          "a list of element selectors",
          ELEMENT_PATTERN_PROPERTIES,
          (s) => [s]
        ),
        ...placesIn(
          ["a parent selector", "a list of parent selectors"],
          ["type", "category", "path", "elementPath"],
          (selector) => ({ parent: selector })
        ),
        ...placesIn(
          ["the element of an entity", "the elements of an entity"],
          ["type"],
          (selector) => ({ element: selector })
        ),
        ...placesIn(
          ["the file of an entity", "the files of an entity"],
          ["path"],
          (selector) => ({ file: selector })
        ),
        ...placesIn(
          ["the module of an entity", "the modules of an entity"],
          ["origin", "source", "internalPath"],
          (selector) => ({ module: selector })
        ),
        ...placesIn(
          ["the origin of an entity", "the origins of an entity"],
          ["module", "kind"],
          (selector) => ({ origin: selector })
        ),
      ];
      const VALID_PATTERNS = {
        "a pattern": "ui/*",
        null: null,
        "a list of patterns and null": ["ui/*", null],
        "an empty list": [],
      };
      const INVALID_PATTERNS = {
        "a number": 1,
        "a boolean": true,
        "a list with a number": ["ui/*", 1],
        "a list with an object": [{ type: "ui" }],
        "an object": { anyOf: ["ui/*"] },
      };

      it.each(PATTERN_PLACES)(
        "accepts only a pattern, null or a list of them in %s",
        (_description, build) => {
          const rejectedValidValues = findRejectedInTarget(
            build,
            VALID_PATTERNS
          );
          const acceptedInvalidValues = findAcceptedInTarget(
            build,
            INVALID_PATTERNS
          );

          expect(rejectedValidValues).toEqual([]);
          expect(acceptedInvalidValues).toEqual([]);
        }
      );

      const CAPTURED_PLACES: Place[] = [
        ...placesOf("an element selector", ["captured"], (s) => s),
        ...placesIn(
          ["a parent selector", "a list of parent selectors"],
          ["captured"],
          (selector) => ({ parent: selector })
        ),
        ...placesIn(
          ["the file of an entity", "the files of an entity"],
          ["captured"],
          (selector) => ({ file: selector })
        ),
      ];
      const VALID_CAPTURED_VALUES = {
        null: null,
        "an object": { family: "ui", names: ["a", "b"] },
        "an empty object": {},
        "a list of objects": [{ family: "ui" }, { family: "core" }],
        "an empty list": [],
      };
      const INVALID_CAPTURED_VALUES = {
        "a string": "ui",
        "a number": 1,
        "a list with a string": [{ family: "ui" }, "core"],
        "a list of lists": [[{ family: "ui" }]],
      };

      it.each(CAPTURED_PLACES)(
        "accepts only null, an object or a list of objects in %s",
        (_description, build) => {
          const rejectedValidValues = findRejectedInTarget(
            build,
            VALID_CAPTURED_VALUES
          );
          const acceptedInvalidValues = findAcceptedInTarget(
            build,
            INVALID_CAPTURED_VALUES
          );

          expect(rejectedValidValues).toEqual([]);
          expect(acceptedInvalidValues).toEqual([]);
        }
      );

      const BOOLEAN_PLACES: Place[] = [
        ...placesOf(
          "an element selector",
          ["isIgnored", "isUnknown"],
          (s) => s
        ),
        ...placesIn(
          ["the file of an entity", "the files of an entity"],
          ["isIgnored", "isUnknown"],
          (selector) => ({ file: selector })
        ),
      ];

      it.each(BOOLEAN_PLACES)("accepts only a boolean in %s", (_d, build) => {
        const values = { true: true, false: false };
        const invalidValues = {
          "a string": "yes",
          "a number": 1,
          null: null,
        };

        const rejectedValidValues = findRejectedInTarget(build, values);
        const acceptedInvalidValues = findAcceptedInTarget(
          build,
          invalidValues
        );

        expect(rejectedValidValues).toEqual([]);
        expect(acceptedInvalidValues).toEqual([]);
      });

      const VALID_ARRAY_QUERIES = {
        "an anyOf query": { anyOf: ["ui", "core"] },
        "an anyOf query with an expand item": {
          anyOf: [{ expand: "{{ from.captured.name }}" }, "core"],
        },
        "an allOf query": { allOf: ["ui", { expand: "x" }] },
        "a noneOf query": { noneOf: ["ui", { expand: "x" }] },
        "an equalsTo query": { equalsTo: ["ui", { expand: "x" }] },
        "an atIndex query with a pattern": {
          atIndex: { index: 0, matches: "ui" },
        },
        "an atIndex query with a list of patterns": {
          atIndex: { index: 1, matches: ["ui", "core"] },
        },
        "a hasLength query": { hasLength: 2 },
        "a query with several operators": {
          anyOf: ["ui"],
          noneOf: ["core"],
          hasLength: 1,
        },
        "an empty query": {},
        ...VALID_PATTERNS,
      };
      const INVALID_ARRAY_QUERIES = {
        "an unknown operator": { contains: ["ui"] },
        "an anyOf query that is not a list": { anyOf: "ui" },
        "an allOf query that is not a list": { allOf: "ui" },
        "a noneOf query that is not a list": { noneOf: "ui" },
        "an equalsTo query that is not a list": { equalsTo: "ui" },
        "an anyOf query with a number": { anyOf: [1] },
        "an allOf query with a number": { allOf: [1] },
        "a noneOf query with a number": { noneOf: [1] },
        "an equalsTo query with a number": { equalsTo: [1] },
        "an expand item without expand": { anyOf: [{}] },
        "an expand item with a number": { anyOf: [{ expand: 1 }] },
        "an expand item with another property": {
          anyOf: [{ expand: "x", other: "y" }],
        },
        "an atIndex query without index": { atIndex: { matches: "ui" } },
        "an atIndex query without matches": { atIndex: { index: 0 } },
        "an atIndex query with a string as index": {
          atIndex: { index: "0", matches: "ui" },
        },
        "an atIndex query with a number as matches": {
          atIndex: { index: 0, matches: 1 },
        },
        "an atIndex query with a list of numbers as matches": {
          atIndex: { index: 0, matches: [1] },
        },
        "an atIndex query with another property": {
          atIndex: { index: 0, matches: "ui", other: 1 },
        },
        "an atIndex query that is not an object": { atIndex: 0 },
        "a hasLength query with a string": { hasLength: "2" },
        "a number": 1,
        "a list with a number": [1],
      };
      const ARRAY_QUERY_PLACES: Place[] = [
        ...placesOf("an element selector", ["types"], (s) => s),
        ...placesIn(
          ["the file of an entity", "the files of an entity"],
          ["categories"],
          (selector) => ({ file: selector })
        ),
      ];

      it.each(ARRAY_QUERY_PLACES)(
        "accepts only a pattern, null or a query of strings in %s",
        (_description, build) => {
          const rejectedValidValues = findRejectedInTarget(
            build,
            VALID_ARRAY_QUERIES
          );
          const acceptedInvalidValues = findAcceptedInTarget(
            build,
            INVALID_ARRAY_QUERIES
          );

          expect(rejectedValidValues).toEqual([]);
          expect(acceptedInvalidValues).toEqual([]);
        }
      );

      it.each(["types"])(
        "accepts only a pattern, null or an object in the '%s' of a parent selector",
        (property) => {
          const build = (value: unknown): unknown => ({
            parent: { [property]: value },
          });
          const validValues = {
            ...VALID_PATTERNS,
            "an object": { anyOf: ["ui"] },
            "an empty object": {},
          };
          const invalidValues = {
            "a number": 1,
            "a boolean": true,
            "a list with a number": ["ui", 1],
            "a list with an object": [{ anyOf: ["ui"] }],
          };

          const rejectedValidValues = findRejectedInTarget(build, validValues);
          const acceptedInvalidValues = findAcceptedInTarget(
            build,
            invalidValues
          );

          expect(rejectedValidValues).toEqual([]);
          expect(acceptedInvalidValues).toEqual([]);
        }
      );

      it("accepts only a query of parent objects in the 'parents' of an element selector", () => {
        const build = (value: unknown): unknown => ({ parents: value });
        const validValues = {
          "an anyOf query": { anyOf: [{ type: "ui" }, {}] },
          "an allOf query": { allOf: [{ type: "ui" }] },
          "a noneOf query": { noneOf: [{ type: "ui" }] },
          "an equalsTo query": { equalsTo: [{ type: "ui" }] },
          "an atIndex query with an object": {
            atIndex: { index: 0, matches: { type: "ui" } },
          },
          "an atIndex query with a list of objects": {
            atIndex: { index: 0, matches: [{ type: "ui" }] },
          },
          "a hasLength query": { hasLength: 2 },
          "an empty query": {},
        };
        const invalidValues = {
          "an unknown operator": { contains: [{}] },
          "an anyOf query that is not a list": { anyOf: {} },
          "an allOf query that is not a list": { allOf: {} },
          "a noneOf query that is not a list": { noneOf: {} },
          "an equalsTo query that is not a list": { equalsTo: {} },
          "an anyOf query with a string": { anyOf: ["ui"] },
          "an allOf query with a string": { allOf: ["ui"] },
          "a noneOf query with a string": { noneOf: ["ui"] },
          "an equalsTo query with a string": { equalsTo: ["ui"] },
          "an atIndex query without index": { atIndex: { matches: {} } },
          "an atIndex query without matches": { atIndex: { index: 0 } },
          "an atIndex query with a string as index": {
            atIndex: { index: "0", matches: {} },
          },
          "an atIndex query with a string as matches": {
            atIndex: { index: 0, matches: "ui" },
          },
          "an atIndex query with a list of strings as matches": {
            atIndex: { index: 0, matches: ["ui"] },
          },
          "an atIndex query with another property": {
            atIndex: { index: 0, matches: {}, other: 1 },
          },
          "an atIndex query that is not an object": { atIndex: 0 },
          "a hasLength query with a string": { hasLength: "2" },
          "a pattern": "ui",
          null: null,
          "a list of objects": [{}],
        };

        const rejectedValidValues = findRejectedInTarget(build, validValues);
        const acceptedInvalidValues = findAcceptedInTarget(
          build,
          invalidValues
        );

        expect(rejectedValidValues).toEqual([]);
        expect(acceptedInvalidValues).toEqual([]);
      });

      /**
       * Builds the shapes in which a selector can be written where a single selector or a list of them is accepted.
       * @param selector - A valid selector.
       * @returns The shapes, by description.
       */
      const shapesOf = (selector: unknown): Values => ({
        "a selector": selector,
        "a list of selectors": [selector, selector],
        "an empty list": [],
        "a string": "ui",
        "a number": 1,
        null: null,
        "a list with a string": [selector, "ui"],
        "a list of lists": [[selector]],
      });
      const REJECTED_SHAPES = [
        "a string",
        "a number",
        "null",
        "a list with a string",
        "a list of lists",
      ];

      it.each([
        [
          "the element of an entity",
          (v: unknown) => ({ element: v }),
          { type: "ui" },
          REJECTED_SHAPES,
        ],
        [
          "the file of an entity",
          (v: unknown) => ({ file: v }),
          { path: "src/**" },
          REJECTED_SHAPES,
        ],
        [
          "the module of an entity",
          (v: unknown) => ({ module: v }),
          { source: "lodash" },
          REJECTED_SHAPES,
        ],
        [
          // A pattern or null is a valid origin of an element selector
          "the origin of an entity",
          (v: unknown) => ({ origin: v }),
          { module: "lodash" },
          ["a number", "a list with a string", "a list of lists"],
        ],
      ])(
        "accepts only a selector or a list of selectors in %s",
        (_description, build, selector, rejectedShapes) => {
          const rejected = findRejectedInTarget(build, shapesOf(selector));

          expect(rejected).toEqual(rejectedShapes);
        }
      );

      it("accepts a selector, null or a list of selectors in the 'parent' of an element selector", () => {
        const rejected = findRejectedInTarget(
          (value) => ({ parent: value }),
          shapesOf({ type: "ui" })
        );

        expect(rejected).toEqual(
          REJECTED_SHAPES.filter((description) => description !== "null")
        );
      });

      it("rejects an unknown property in any selector", () => {
        const selectors = {
          "an element selector": { type: "ui", other: 1 },
          "a parent selector": { parent: { type: "ui", other: 1 } },
          "a parent selector in a list": { parent: [{ type: "ui", other: 1 }] },
          "a query of parents": { parents: { anyOf: [], other: 1 } },
          "an atIndex query of parents": {
            parents: { atIndex: { index: 0, matches: {}, other: 1 } },
          },
          "an entity": { element: { type: "ui" }, other: 1 },
          "the element of an entity": { element: { type: "ui", other: 1 } },
          "the file of an entity": { file: { path: "ui", other: 1 } },
          "the module of an entity": { module: { source: "ui", other: 1 } },
          "the origin of an entity": { origin: { module: "ui", other: 1 } },
          "the element in a list of entities": [
            { element: { type: "ui", other: 1 } },
          ],
        };

        const accepted = findAcceptedInTarget((value) => value, selectors);

        expect(accepted).toEqual([]);
      });

      it("accepts a selector in any of the syntaxes of the rules", () => {
        const values = {
          "a legacy matcher": "helpers",
          "a legacy matcher with captured values": [
            "helpers",
            { family: "ui" },
          ],
          "several legacy matchers": ["helpers", "components"],
          "several legacy matchers with captured values": [
            ["helpers", { family: "ui" }],
            "components",
          ],
          "an element selector": { type: "ui" },
          "a list of element selectors": [{ type: "ui" }, { path: "src/**" }],
          "an entity selector": { element: { type: "ui" } },
          "a list of entity selectors": [
            { element: { type: "ui" } },
            { file: { path: "src/**" } },
          ],
          "a list of selectors of every syntax": [
            { type: "ui" },
            { element: { type: "ui" } },
            "helpers",
            ["components", { family: "ui" }],
          ],
          "an empty object": {},
          "an empty list": [],
        };

        const rejected = findRejectedInTarget((value) => value, values);

        expect(rejected).toEqual([]);
      });

      it("reports the failure of every syntax when a selector is not valid in any of them", () => {
        const result = validateRuleOptionsList(rule, [withTarget(5)]);

        expect(result?.detail.split("\n").slice(0, -1)).toEqual([
          "Value 5 should be object.",
          "Value 5 should be array.",
          "Value 5 should match exactly one schema in oneOf.",
          "Value 5 should be object.",
          "Value 5 should be object.",
          "Value 5 should be string.",
          "Value 5 should be array.",
          "Value 5 should match some schema in anyOf.",
          "Value 5 should be array.",
          "Value 5 should match some schema in anyOf.",
          "Value 5 should match some schema in anyOf.",
          "Value 5 should be array.",
          "Value 5 should match some schema in anyOf.",
        ]);
      });

      it("rejects a selector that is not valid in any syntax", () => {
        const values = {
          "a number": 1,
          "a boolean": true,
          null: null,
          "a legacy matcher with a number as captured values": ["helpers", 1],
          "a list with a number": [{ type: "ui" }, 1],
          "an object with an unknown property": { other: 1 },
          "a list with an unknown property": [{ type: "ui" }, { other: 1 }],
          "properties of an element and of an entity": {
            element: { type: "ui" },
            type: "ui",
          },
        };

        const accepted = findAcceptedInTarget((value) => value, values);

        expect(accepted).toEqual([]);
      });
    });

    describe("options of the no-private rule", () => {
      const rule = RULE_NAMES_MAP.NO_PRIVATE;

      it("accepts no options and options with every property", () => {
        const withoutOptions = validateRuleOptionsList(rule, []);
        const withOptions = validateRuleOptionsList(rule, [
          { allowUncles: false, message: "Private" },
        ]);

        expect(withoutOptions).toBeNull();
        expect(withOptions).toBeNull();
      });

      it("accepts only a boolean in the option 'allowUncles'", () => {
        const values = {
          true: true,
          false: false,
          "a string": "yes",
          null: null,
        };

        const rejected = findRejected(
          rule,
          (value) => ({ allowUncles: value }),
          values
        );

        expect(rejected).toEqual(["a string", "null"]);
      });

      it("accepts only a string in the option 'message'", () => {
        const values = { "a string": "Private", "a number": 1, null: null };

        const rejected = findRejected(
          rule,
          (value) => ({ message: value }),
          values
        );

        expect(rejected).toEqual(["a number", "null"]);
      });

      it("accepts only an object as options", () => {
        const values = {
          "an object": {},
          "a string": "allowUncles",
          "a list": [],
          "a boolean": true,
        };

        const rejected = findRejected(rule, (value) => value, values);

        expect(rejected).toEqual(["a string", "a list", "a boolean"]);
      });

      it("rejects an unknown option", () => {
        const result = validateRuleOptionsList(rule, [{ allowCousins: true }]);

        expect(result?.detail).toContain(
          'Unexpected property "allowCousins". Expected properties: "allowUncles", "message".'
        );
      });
    });

    describe.each([
      RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES,
      RULE_NAMES_MAP.NO_UNKNOWN,
    ])("options of the rule '%s'", (rule) => {
      it("accepts no options and options without properties", () => {
        const withoutOptions = validateRuleOptionsList(rule, []);
        const withEmptyOptions = validateRuleOptionsList(rule, [{}]);

        expect(withoutOptions).toBeNull();
        expect(withEmptyOptions).toBeNull();
      });

      it("accepts only the values of the option 'require'", () => {
        const values = {
          all: "all",
          element: "element",
          file: "file",
          any: "any",
          "another string": "none",
          "an empty string": "",
          "a number": 1,
          "a list": ["all"],
          null: null,
        };

        const rejected = findRejected(
          rule,
          (value) => ({ require: value }),
          values
        );

        expect(rejected).toEqual([
          "another string",
          "an empty string",
          "a number",
          "a list",
          "null",
        ]);
      });

      it("reports a value of 'require' that is not a string as a type error", () => {
        const result = validateRuleOptionsList(rule, [{ require: 1 }]);

        expect(result?.detail.split("\n")[0]).toBe("Value 1 should be string.");
      });

      it("accepts only an object as options", () => {
        const values = { "an object": {}, "a string": "all", "a list": [] };

        const rejected = findRejected(rule, (value) => value, values);

        expect(rejected).toEqual(["a string", "a list"]);
      });

      it("rejects an unknown option", () => {
        const result = validateRuleOptionsList(rule, [{ requires: "all" }]);

        expect(result?.detail).toContain(
          'Unexpected property "requires". Expected properties: "require".'
        );
      });
    });

    describe("options of every rule", () => {
      it.each(RULE_NAMES)(
        "accepts a rule entry without options in the rule '%s'",
        (ruleName) => {
          const result = validateRuleOptionsList(ruleName, []);

          expect(result).toBeNull();
        }
      );

      it.each([
        RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES,
        RULE_NAMES_MAP.NO_IGNORED,
        RULE_NAMES_MAP.NO_UNKNOWN_FILES,
      ])(
        "rejects any option in the rule '%s', which takes none",
        (ruleName) => {
          const result = validateRuleOptionsList(ruleName, [{}]);

          expect(result?.paths).toEqual([[]]);
        }
      );
    });
  });
});
