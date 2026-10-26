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
      meta: false,
      useDefaults: true,
      validateSchema: false,
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
  if (schema.length) {
    return {
      type: "array",
      items: schema,
      minItems: 0,
      maxItems: schema.length,
    };
  }
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
  const valueLine = `Value ${JSON.stringify(error.data)} ${error.message}.`;
  // The `verbose` option sets the parent schema of every error
  const parentProperties = (error.parentSchema as JsonSchema).properties;
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
