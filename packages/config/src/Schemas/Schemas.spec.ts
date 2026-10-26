import { RULE_NAMES, RULE_NAMES_MAP } from "../Shared";

import {
  getRuleOptionsSchema,
  legacyPoliciesSchema,
  rulesMainKey,
  rulesOptionsSchema,
} from "./Schemas";

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
  describe("legacyPoliciesSchema", () => {
    it("uses the default extra options schema when none is provided", () => {
      const schema = legacyPoliciesSchema();

      expect(schema.anyOf[1]).toEqual({
        type: "array",
        items: [{ type: "string" }, { type: "object" }],
      });
    });

    it("embeds custom matcher options when provided", () => {
      const customOptions = { type: "object", properties: { foo: {} } };

      const schema = legacyPoliciesSchema(customOptions);

      expect(schema.anyOf[1]).toEqual({
        type: "array",
        items: [{ type: "string" }, customOptions],
      });
    });
  });

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

    it("also exposes the same entries schema under 'policies' (the current option name)", () => {
      const [schema] = rulesOptionsSchema();
      const properties = schema.properties as unknown as Record<
        string,
        unknown
      >;

      expect(properties.policies).toEqual(properties.rules);
    });

    it("returns a legacy schema keyed by the provided mainKey", () => {
      const [schema] = rulesOptionsSchema({
        rulesMainKey: "target",
        isLegacy: true,
      });
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: Record<string, unknown>; anyOf: unknown[] };
        }
      ).items;

      expect(ruleItem.properties).toHaveProperty("target");
      expect(ruleItem.properties).toHaveProperty("allow");
      expect(ruleItem.properties).toHaveProperty("disallow");
      expect(ruleItem.properties).not.toHaveProperty("from");
      expect(ruleItem.anyOf).toEqual([
        { required: ["target", "allow"] },
        { required: ["target", "disallow"] },
      ]);
    });

    it("falls back to 'from' as legacy main key when rulesMainKey is not provided", () => {
      const [schema] = rulesOptionsSchema({ isLegacy: true });
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: Record<string, unknown> };
        }
      ).items;

      expect(ruleItem.properties).toHaveProperty("from");
    });

    it("forwards extraOptionsSchema into the top-level properties", () => {
      const [schema] = rulesOptionsSchema({
        extraOptionsSchema: {
          checkAllOrigins: { type: "boolean" },
        },
      });

      expect(schema.properties).toHaveProperty("checkAllOrigins", {
        type: "boolean",
      });
    });

    it("uses the legacy policies schema with custom target matcher options when legacy", () => {
      const customMatcherOptions = { type: "object", properties: { x: {} } };

      const [schema] = rulesOptionsSchema({
        isLegacy: true,
        targetMatcherOptions: customMatcherOptions,
      });
      const ruleItem = (
        (schema.properties as unknown as Record<string, unknown>).rules as {
          items: { properties: { allow: { anyOf: unknown[] } } };
        }
      ).items;

      expect(ruleItem.properties.allow.anyOf[1]).toEqual({
        type: "array",
        items: [{ type: "string" }, customMatcherOptions],
      });
    });
  });

  describe("rulesMainKey", () => {
    it("returns 'from' when no key is provided", () => {
      expect(rulesMainKey()).toBe("from");
    });

    it("returns the provided key when given", () => {
      expect(rulesMainKey("target")).toBe("target");
    });
  });

  describe("getRuleOptionsSchema", () => {
    it.each(RULE_NAMES)(
      "returns an array of option schemas for rule '%s'",
      (ruleName) => {
        expect(Array.isArray(getRuleOptionsSchema(ruleName))).toBe(true);
      }
    );

    it.each(RULE_NAMES)(
      "does not use the 'default' keyword in the schema of rule '%s'",
      (ruleName) => {
        expect(hasDefaultKeyword(getRuleOptionsSchema(ruleName))).toBe(false);
      }
    );

    it("returns the same schema for the dependencies rule and its deprecated element-types name", () => {
      expect(getRuleOptionsSchema(RULE_NAMES_MAP.ELEMENT_TYPES)).toBe(
        getRuleOptionsSchema(RULE_NAMES_MAP.DEPENDENCIES)
      );
    });

    it("declares the check options of the dependencies rule", () => {
      const [schema] = getRuleOptionsSchema(RULE_NAMES_MAP.DEPENDENCIES);

      expect(Object.keys(schema.properties as object)).toEqual([
        "message",
        "default",
        "policies",
        "rules",
        "checkAllOrigins",
        "checkUnknownLocals",
        "checkInternals",
      ]);
    });

    it.each([
      RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES,
      RULE_NAMES_MAP.NO_IGNORED,
      RULE_NAMES_MAP.NO_UNKNOWN_FILES,
    ])("returns no option schema for rule '%s'", (ruleName) => {
      expect(getRuleOptionsSchema(ruleName)).toEqual([]);
    });

    it("returns the schema of the no-private options", () => {
      expect(getRuleOptionsSchema(RULE_NAMES_MAP.NO_PRIVATE)).toEqual([
        {
          type: "object",
          properties: {
            allowUncles: { type: "boolean" },
            message: { type: "string" },
          },
          additionalProperties: false,
        },
      ]);
    });

    it("returns the same schema for the no-unknown-dependencies rule and its deprecated no-unknown name", () => {
      const [schema] = getRuleOptionsSchema(
        RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES
      );

      expect(getRuleOptionsSchema(RULE_NAMES_MAP.NO_UNKNOWN)).toEqual([schema]);
      expect(
        (schema.properties as Record<string, Record<string, unknown>>).require
          .enum
      ).toEqual(["all", "element", "file", "any"]);
    });
  });
});
