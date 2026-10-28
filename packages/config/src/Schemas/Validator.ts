import Ajv from "ajv";
import draft04MetaSchema from "ajv/lib/refs/json-schema-draft-04.json";

import type { DiagnosticPath } from "../Diagnostics";
import { getRuleDocsPath, moreInfoLink } from "../Docs";
import { isArray, isObject, isString } from "../Shared";
import type { RuleName } from "../Shared";

import { getRuleOptionsSchema } from "./Schemas";
import type { JsonSchema } from "./Schemas.types";
import type { RuleOptionsSchemaError } from "./Validator.types";

/**
 * The validator of the rule options, created on first use, so hosts that never validate a schema never compile one.
 */
let ajvInstance: Ajv.Ajv | undefined;

/**
 * Compiled validators by rule name. A validator depends only on the rule name, so it is compiled once.
 */
const validatorsByRuleName = new Map<RuleName, Ajv.ValidateFunction>();

/**
 * Returns the `ajv` instance, configured as ESLint configures the one that validates the rule `meta.schema`, plus JSON pointers in the error paths.
 * @returns The `ajv` instance.
 */
function getAjv(): Ajv.Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({
      // Stryker disable next-line BooleanLiteral: true only adds the draft-07 meta schema, which no rule schema uses
      meta: false,
      // Stryker disable next-line BooleanLiteral: no rule schema uses the default keyword (checked in Schemas.spec.ts), so there is no default to apply
      useDefaults: true,
      // Stryker disable next-line BooleanLiteral: every rule schema is a valid draft-04 schema, so validating it does not change the result
      validateSchema: false,
      // Stryker disable next-line StringLiteral: no rule schema has a $ref, so there is no missing reference to ignore
      missingRefs: "ignore",
      verbose: true,
      schemaId: "auto",
      jsonPointers: true,
    });
    ajvInstance.addMetaSchema(draft04MetaSchema);
    // ESLint sets the draft-04 meta schema as the default one through this private property
    (
      ajvInstance as unknown as { _opts: { defaultMeta: string } }
    )._opts.defaultMeta = draft04MetaSchema.id;
  }
  return ajvInstance;
}

/**
 * Converts the schema of a rule into the schema of its options list, as ESLint does with an array `meta.schema`.
 * @param schema The schema of the rule options.
 * @returns The schema of the options list.
 */
function getOptionsListSchema(schema: JsonSchema[]): JsonSchema {
  // Surviving Stryker mutant: replacing the condition with true survives because, without schemas, the list schema gets `items: []`, which has the same effect as the one of the else branch
  if (schema.length) {
    return {
      // Stryker disable next-line StringLiteral: the options list is always an array, so removing its type check changes nothing
      type: "array",
      items: schema,
      minItems: 0,
      maxItems: schema.length,
    };
  }
  // Stryker disable next-line StringLiteral: the options list is always an array, so removing its type check changes nothing
  return { type: "array", minItems: 0, maxItems: 0 };
}

/**
 * Returns the compiled validator of the options list of a rule.
 * @param ruleName The name of the rule.
 * @returns The compiled validator.
 */
function getValidator(ruleName: RuleName): Ajv.ValidateFunction {
  const cachedValidator = validatorsByRuleName.get(ruleName);
  if (cachedValidator) {
    return cachedValidator;
  }
  const validator = getAjv().compile(
    getOptionsListSchema(getRuleOptionsSchema(ruleName))
  );
  validatorsByRuleName.set(ruleName, validator);
  return validator;
}

/**
 * Formats an `ajv` error as ESLint prints it when rule options fail their schema.
 * @param error The `ajv` error.
 * @returns The lines describing the error.
 */
function formatError(error: Ajv.ErrorObject): string {
  // ESLint runs ajv without `jsonPointers`, which names a missing property as a property access, such as '.allow'
  const message =
    error.keyword === "required"
      ? `should have required property '.${(error.params as Ajv.RequiredParams).missingProperty}'`
      : error.message;
  const valueLine = `Value ${JSON.stringify(error.data)} ${message}.`;
  // The `verbose` option sets the parent schema of every error
  const parentProperties = (error.parentSchema as JsonSchema).properties;
  // Surviving Stryker mutants: replacing the condition or any of its operands with true, or an `&&` with `||`, survive because every `additionalProperties` error of the rule schemas meets all the operands and no other error has an `additionalProperty` string. They are the checks that ESLint makes
  if (
    error.keyword === "additionalProperties" &&
    error.schema === false &&
    isObject(parentProperties) &&
    isString(
      (error.params as Ajv.AdditionalPropertiesParams).additionalProperty
    )
  ) {
    const expectedProperties = Object.keys(parentProperties).map(
      (property) => `"${property}"`
    );
    return `${valueLine}\nUnexpected property "${(error.params as Ajv.AdditionalPropertiesParams).additionalProperty}". Expected properties: ${expectedProperties.join(", ")}.`;
  }
  return valueLine;
}

/**
 * Converts the JSON pointer of an `ajv` error into a diagnostic path, reading the data to tell array indexes from object keys.
 * @param dataPath The JSON pointer of the error, from the root of the options list.
 * @param data The options list.
 * @returns The path of the error, from the root of the options list.
 */
function toDiagnosticPath(dataPath: string, data: unknown): DiagnosticPath {
  const path: DiagnosticPath = [];
  let current: unknown = data;
  for (const encodedSegment of dataPath.split("/").slice(1)) {
    // Surviving Stryker mutants: replacing the unescaped "/" or "~" with an empty string survives because the paths of the rule schemas have only fixed property names and list indexes, which have no escaped characters
    const segment = encodedSegment.replaceAll("~1", "/").replaceAll("~0", "~");
    const pathSegment = isArray(current) ? Number(segment) : segment;
    path.push(pathSegment);
    // Every segment but the last one points to an object or an array
    current = (current as Record<string | number, unknown>)[pathSegment];
  }
  return path;
}

/**
 * Validates the options list of a rule entry against the rule schema, as ESLint validates it.
 * @param ruleName The name of the rule.
 * @param optionsList The options of the rule entry, without its severity.
 * @returns The error, with one path per value that fails, or null when the options are valid.
 */
export function validateRuleOptionsList(
  ruleName: RuleName,
  optionsList: unknown[]
): RuleOptionsSchemaError | null {
  const validator = getValidator(ruleName);
  if (validator(optionsList)) {
    return null;
  }
  const errors = validator.errors as Ajv.ErrorObject[];
  return {
    title: `[${ruleName}] Invalid rule options.`,
    detail: `${errors.map(formatError).join("\n")}\n${moreInfoLink(getRuleDocsPath(ruleName))}`,
    // Several errors of a schema with alternatives point to the same value
    paths: [...new Set(errors.map((error) => error.dataPath))].map((dataPath) =>
      toDiagnosticPath(dataPath, optionsList)
    ),
  };
}
