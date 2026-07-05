/**
 * Normalizes a file path by replacing backslashes with forward slashes.
 * @param filePath The file path to normalize.
 * @returns The normalized file path.
 */
export function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}
