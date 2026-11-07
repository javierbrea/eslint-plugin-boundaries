import { TEXT_LINE_BREAK } from "./sketch.constants";

/**
 * Counts the lines that two lists of lines have equal at their end, once the lines equal at their start are counted. The lines at the start come first, and together they are at most the number of lines of the shorter text, so that no line is both: when several lines are equal in a row, the earlier ones are the ones that stay.
 * @param before The lines of the text before an edit.
 * @param after The lines of the text after it.
 * @returns How many lines are equal at the end, not counting the ones that are equal at the start.
 */
function countEqualSuffix(
  before: readonly string[],
  after: readonly string[]
): number {
  const shorter = Math.min(before.length, after.length);
  let prefix = 0;
  let suffix = 0;

  while (prefix < shorter && before[prefix] === after[prefix]) {
    prefix += 1;
  }
  while (
    suffix < shorter - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return suffix;
}

/**
 * Finds a line of the text before an edit in the text after it, so that something that points at a line of text mode follows the line through the edit, whatever the user did with the rest of the text. The two texts are compared as one edit: the lines that are equal at the start and at the end stay or move with their side, and what is between them is the changed block.
 * - A line among the first equal lines stays where it is.
 * - A line among the last equal lines moves by the difference of the number of lines of the texts.
 * - A line inside the changed block keeps its place in the block when the new block has a line there, which is an edit in place or the first part of a line that was split, and is gone otherwise: the line was deleted, or joined into the line before it.
 *
 * Two equal lines in a row cannot be told apart when one of them is deleted: the earlier one is the one that stays.
 * @param before The text before the edit.
 * @param after The text after it.
 * @param line Number of a line of the text before, from 1.
 * @returns Number of the line in the text after, from 1, or `undefined` when the line is gone, or is not a line of the text before.
 */
export function moveTextLine(
  before: string,
  after: string,
  line: number
): number | undefined {
  const beforeLines = before.split(TEXT_LINE_BREAK);
  const afterLines = after.split(TEXT_LINE_BREAK);

  if (line < 1 || line > beforeLines.length) {
    return undefined;
  }

  const suffix = countEqualSuffix(beforeLines, afterLines);

  // A line among the last equal lines moves by the difference of the number of lines
  if (line > beforeLines.length - suffix) {
    return line + afterLines.length - beforeLines.length;
  }
  // A line among the first equal lines stays where it is, and so does a line inside the changed block when the new block reaches it
  return line <= afterLines.length - suffix ? line : undefined;
}
