import { evaluate, parse } from "@humanwhocodes/momoa";
import type { DocumentNode, ValueNode } from "@humanwhocodes/momoa";

import type { ConfigProblem, TextRange } from "./engine.types";
import { getRangeOf, toTextRange } from "./locations";
import type { ParsedConfig } from "./parseConfig.types";

/** What the config accepts. momoa's messages name tokens, such as `Unexpected token Identifier found.`, which say little to someone who pasted a whole `eslint.config.js` */
const CONFIG_ACCEPTS =
  "The config must be one JSON5 object with settings and rules.";

/** The only keys of the config object that are read */
const CONFIG_KEYS: readonly string[] = ["settings", "rules"];

/** The keys that are read, as the detail of a warning lists them */
const CONFIG_KEYS_LIST = CONFIG_KEYS.map((key) => `"${key}"`).join(" and ");

/** How the detail names the root value when it is not an object */
const VALUE_NAMES: Record<Exclude<ValueNode["type"], "Object">, string> = {
  Array: "an array",
  Boolean: "a boolean",
  Infinity: "a number",
  NaN: "a number",
  Null: "null",
  Number: "a number",
  String: "a string",
};

/** An error of momoa with the position where it found the problem */
type LocatedError = Error & {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
};

/**
 * Tells whether an error is one of momoa that carries a position.
 * @param error What the parser threw.
 * @returns `true` when the error has the line, column and offset where the parser stopped.
 */
function isLocatedError(error: unknown): error is LocatedError {
  if (!(error instanceof Error)) {
    return false;
  }
  const { line, column, offset } = error as Partial<LocatedError>;
  return (
    typeof line === "number" &&
    typeof column === "number" &&
    typeof offset === "number"
  );
}

/**
 * Places a syntax error in the text.
 * @param error What the parser threw.
 * @param text The config text.
 * @returns A character at the position of the error, or the whole text when the parser gives none.
 */
function getSyntaxErrorRange(error: unknown, text: string): TextRange {
  if (isLocatedError(error)) {
    return {
      from: error.offset,
      // At the end of the text there is no character to take
      to: Math.min(error.offset + 1, text.length),
      line: error.line,
      column: error.column,
    };
  }
  return { from: 0, to: text.length, line: 1, column: 1 };
}

/**
 * Builds the problem of a text that is not one JSON5 object.
 * @param detail What is wrong, as the parser or this module says it.
 * @param range Where it is wrong.
 * @returns The problem, which is about the whole config.
 */
function createParseProblem(detail: string, range: TextRange): ConfigProblem {
  return {
    level: "error",
    title: CONFIG_ACCEPTS,
    detail,
    links: [],
    path: [],
    range,
    source: "parse",
  };
}

/**
 * Warns about the keys of the config object that are not read.
 * @param ast The tree of the config text.
 * @param value The object the text writes.
 * @returns A warning for each key other than `settings` and `rules`, placed at its value.
 */
function getIgnoredKeysProblems(
  ast: DocumentNode,
  value: Readonly<Record<string, unknown>>
): ConfigProblem[] {
  return Object.keys(value)
    .filter((key) => !CONFIG_KEYS.includes(key))
    .map(
      (key): ConfigProblem => ({
        level: "warning",
        title: `The key "${key}" is not part of the config and is ignored.`,
        detail: `The config takes only the keys ${CONFIG_KEYS_LIST}.`,
        links: [],
        path: [key],
        range: getRangeOf(ast, [key]),
        source: "config",
      })
    );
}

/**
 * Reads the text of a config with momoa in JSON5 mode, the grammar that the config node accepts: one object, with comments, unquoted keys and trailing commas, and nothing else, such as a spread or a variable.
 * @param text The config text.
 * @returns The object the text writes and its tree to locate each entry, or a single `parse` problem when the text is not one JSON5 object, or when momoa cannot read it, such as a text that nests deeper than the stack goes. The problem is at the position momoa gives, at the whole value when it is not an object, or at the whole text when momoa gives no position.
 */
export function parseConfig(text: string): ParsedConfig {
  let ast: DocumentNode;
  let value: unknown;
  try {
    ast = parse(text, { mode: "json5" });
    // `evaluate` recurses as deep as the text nests, as `parse` does, and runs out of stack first on some texts that `parse` reads
    value = evaluate(ast.body);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      parsed: false,
      problems: [createParseProblem(detail, getSyntaxErrorRange(error, text))],
    };
  }

  const root = ast.body;
  if (root.type !== "Object") {
    return {
      parsed: false,
      problems: [
        createParseProblem(
          `The text is ${VALUE_NAMES[root.type]}.`,
          toTextRange(root)
        ),
      ],
    };
  }

  const object = value as Record<string, unknown>;
  return {
    parsed: true,
    ast,
    value: object,
    problems: getIgnoredKeysProblems(ast, object),
  };
}
