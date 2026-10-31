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

/** Source of a dependency, read from the node matched by a dependency node selector */
export type DependencySource =
  | {
      /** The source, known without running the code */
      source: string;
    }
  | {
      /** No source is known without running the code */
      source: null;
      /** True when the node is a template literal or a TypeScript assertion, whose source is only known at runtime, such as `` import(`./${name}.js`) ``; false when the node does not define a source, such as an identifier */
      runtime: boolean;
    };
