/**
 * A primitive value in a JSON schema.
 */
type JsonSchemaPrimitive = string | number | boolean | null;

/**
 * Any value in a JSON schema.
 */
type JsonSchemaValue = JsonSchemaPrimitive | JsonSchema | JsonSchemaValue[];

/**
 * A JSON schema object, such as the schema of a rule option.
 */
export type JsonSchema = {
  [key: string]: JsonSchemaValue;
};
