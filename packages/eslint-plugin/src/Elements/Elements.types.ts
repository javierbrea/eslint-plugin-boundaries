import type { Rule } from "eslint";
import type { Expression, Literal, TemplateLiteral } from "estree";

/** Types of the TypeScript nodes that assert the type of an expression without changing its value */
export type TypeScriptAssertionType =
  | "TSAsExpression"
  | "TSSatisfiesExpression"
  | "TSTypeAssertion"
  | "TSNonNullExpression";

/** TypeScript assertion around an expression, such as `"source" as string`. The plugin does not depend on `@typescript-eslint/types`, so it is typed by its shape */
export type TypeScriptAssertion = {
  type: TypeScriptAssertionType;
  expression: Expression | TypeScriptAssertion;
};

/** Represents the ESLint node matched by a dependency node selector, where the dependency source is defined, with a parent node */
export type EslintDependencyNode = (
  | Literal
  | TemplateLiteral
  | TypeScriptAssertion
) & {
  parent: Rule.Node;
};
