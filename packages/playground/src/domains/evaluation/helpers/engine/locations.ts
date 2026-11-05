import type {
  DocumentNode,
  LocationRange,
  MemberNode,
  ValueNode,
} from "@humanwhocodes/momoa";

import type { TextRange } from "./engine.types";

/**
 * Reads the range that a node of the momoa tree takes in the text.
 * @param node A node with its location.
 * @param node.loc Where the node starts and ends.
 * @returns The range of the node.
 */
export function toTextRange({ loc }: { loc: LocationRange }): TextRange {
  return {
    from: loc.start.offset,
    to: loc.end.offset,
    line: loc.start.line,
    column: loc.start.column,
  };
}

/**
 * Reads the key of a member of an object, whether it is written as an identifier or as a string.
 * @param member The member of the object.
 * @param member.name The node of its key.
 * @returns The key as the evaluated object has it.
 */
function getKey({ name: key }: MemberNode): string {
  return key.type === "Identifier" ? key.name : key.value;
}

/**
 * Steps from a value to the value at a key, or at an index when the value is an array.
 * @param node The value to step from.
 * @param key The key of an object, or the index of an array.
 * @returns The value found, or `undefined` when there is none at the key.
 */
function getChild(
  node: ValueNode,
  key: string | number
): ValueNode | undefined {
  if (node.type === "Object") {
    // A key written twice keeps the last value, as it does in the evaluated object
    return node.members
      .filter((member) => getKey(member) === String(key))
      .at(-1)?.value;
  }
  if (node.type === "Array" && typeof key === "number") {
    return node.elements[key]?.value;
  }
  return undefined;
}

/**
 * Finds where an entry of the config is in its text, by walking its path down the tree that momoa parsed.
 * @param ast The tree of the config text.
 * @param path The path of the entry, as the diagnostics of `@boundaries/config` have it: object keys and array indexes from the config object. `[]` is the whole config.
 * @returns The range of the value at the path. When the path stops matching, such as a setting that is not written, the range of the deepest value it reached.
 */
export function getRangeOf(
  ast: DocumentNode,
  path: readonly (string | number)[]
): TextRange {
  let node = ast.body;
  for (const key of path) {
    const child = getChild(node, key);
    if (child === undefined) {
      break;
    }
    node = child;
  }
  return toTextRange(node);
}
