import type { Rule } from "eslint";
import type { Literal } from "estree";

export type EslintLiteralNode = Literal & {
  parent: Rule.Node;
};
