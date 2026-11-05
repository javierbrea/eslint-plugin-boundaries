/**
 * Writes a count with its noun.
 * @param count The number.
 * @param singular The noun for one.
 * @param plural The noun for any other number.
 * @returns The count and its noun, such as `1 file` or `3 files`.
 */
export function formatCount(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
