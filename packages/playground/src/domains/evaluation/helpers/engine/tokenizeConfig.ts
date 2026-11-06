import { tokenize } from "@humanwhocodes/momoa";
import type { Token, TokenType } from "@humanwhocodes/momoa";

import type { ConfigToken, ConfigTokenKind } from "./engine.types";

/** What each token of momoa is, before a colon tells the keys from the other strings and identifiers. An identifier is only valid as a key, so one that no colon follows is plain text */
const TOKEN_KINDS: Readonly<Record<TokenType, ConfigTokenKind>> = {
  Number: "number",
  NaN: "number",
  Infinity: "number",
  String: "string",
  Identifier: "plain",
  Boolean: "literal",
  Null: "literal",
  LineComment: "comment",
  BlockComment: "comment",
  Colon: "punctuation",
  Comma: "punctuation",
  LBrace: "punctuation",
  RBrace: "punctuation",
  LBracket: "punctuation",
  RBracket: "punctuation",
};

/** The tokens that can be the key of a member */
const KEY_TYPES: ReadonlySet<TokenType> = new Set(["String", "Identifier"]);

/** The tokens that say nothing about the structure, so that a comment between a key and its colon does not hide the key */
const COMMENT_TYPES: ReadonlySet<TokenType> = new Set([
  "LineComment",
  "BlockComment",
]);

/**
 * Tells the kind of each token. A string or an identifier that a colon follows is a key, even when a comment comes between them.
 * @param tokens The tokens that momoa read, in order.
 * @returns The kind of each token, in the same order.
 */
function getKinds(tokens: readonly Token[]): ConfigTokenKind[] {
  const kinds = tokens.map(({ type }) => TOKEN_KINDS[type]);
  // The last token that is not a comment: what a colon is the colon of
  let previous: number | undefined;

  tokens.forEach(({ type }, index) => {
    if (
      type === "Colon" &&
      previous !== undefined &&
      KEY_TYPES.has(tokens[previous].type)
    ) {
      kinds[previous] = "key";
    }
    if (!COMMENT_TYPES.has(type)) {
      previous = index;
    }
  });
  return kinds;
}

/**
 * Splits a JSON5 text into the pieces that a code area colors: keys, strings, numbers, literals, comments and punctuation, with the white space between them as plain text. It reads the text as lexical tokens, as momoa tokenizes it with comments, and not as a tree, so it colors the text of a policy or of the default as written, even though it is not a whole config. It never throws.
 * @param text The text to split, such as a policy as the config writes it.
 * @returns The pieces, in order, which joined are the text. A text that momoa cannot tokenize, such as one with a character that JSON5 does not have or a string that never ends, is one plain piece; an empty text has none.
 */
export function tokenizeConfig(text: string): readonly ConfigToken[] {
  let tokens: Token[];

  try {
    tokens = tokenize(text, { mode: "json5" });
  } catch {
    return [{ kind: "plain", text }];
  }

  const kinds = getKinds(tokens);
  const pieces: ConfigToken[] = [];
  let cursor = 0;

  tokens.forEach(({ loc }, index) => {
    const { start, end } = loc;

    // Momoa skips the white space, so what lies between two tokens is the white space
    if (start.offset > cursor) {
      pieces.push({ kind: "plain", text: text.slice(cursor, start.offset) });
    }
    pieces.push({
      kind: kinds[index],
      text: text.slice(start.offset, end.offset),
    });
    cursor = end.offset;
  });
  if (cursor < text.length) {
    pieces.push({ kind: "plain", text: text.slice(cursor) });
  }
  return pieces;
}
