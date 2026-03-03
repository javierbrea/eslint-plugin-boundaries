import type { Rule } from "eslint";
import type { Literal } from "estree";

/** Represents an ESLint literal node with a parent node */
export type EslintLiteralNode = Literal & {
  parent: Rule.Node;
};
