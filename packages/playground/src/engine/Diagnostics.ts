import type { Diagnostic, DiagnosticPath } from "@boundaries/config";
import type { DocumentNode } from "@humanwhocodes/momoa";

import type { ConfigProblem } from "./Engine.types";
import { getRangeOf } from "./Locations";

/**
 * Matches a URL of a detail with the whitespace before it and the `More info:` label that `@boundaries/config` writes in front of its docs links, which come after the text of the detail or on a line of their own. The URL is the only group.
 */
const LINK_IN_DETAIL = /\s*(?:More info:\s*)?(https?:\/\/\S+)/g;

/**
 * Splits the detail of a diagnostic into its text and the links it points to.
 * @param detail The detail as `@boundaries/config` writes it.
 * @returns The URLs in the order they were written, and the detail without them, with the label and the whitespace that introduced each one, and trimmed. The text is `undefined` when nothing but links was there, or there was no detail.
 */
function splitDetail(detail: string | undefined): {
  readonly text: string | undefined;
  readonly links: readonly string[];
} {
  if (detail === undefined) {
    return { text: undefined, links: [] };
  }
  const text = detail.replace(LINK_IN_DETAIL, "").trim();
  return {
    text: text === "" ? undefined : text,
    links: Array.from(detail.matchAll(LINK_IN_DETAIL), ([, url]) => url),
  };
}

/**
 * Tells whether a path starts with another one.
 * @param path The path to check.
 * @param prefix The path it should start with.
 * @returns `true` when every segment of the prefix is at its place in the path.
 */
function startsWith(
  path: DiagnosticPath,
  prefix: readonly (string | number)[]
): boolean {
  return prefix.every((segment, index) => path[index] === segment);
}

/**
 * Maps the diagnostics of `normalizeConfig` to problems placed in the config text.
 * @param diagnostics The diagnostics, with paths from the config object.
 * @param ast The tree of the config text.
 * @returns One problem for each path of each diagnostic, in the order of the diagnostics. The `title` and `level` are the ones that the ESLint plugin prints, and so is the `detail`, with the links it points to apart in `links`.
 */
export function toConfigProblems(
  diagnostics: readonly Diagnostic[],
  ast: DocumentNode
): ConfigProblem[] {
  return diagnostics.flatMap(({ level, title, detail, paths }) => {
    const { text, links } = splitDetail(detail);

    return paths.map(
      (path): ConfigProblem => ({
        level,
        title,
        detail: text,
        links,
        path,
        range: getRangeOf(ast, path),
        source: "config",
      })
    );
  });
}

/**
 * Tells whether a diagnostic is about exactly one entry of the config, and not about an option inside it. For an entry of a list of descriptors, it is the diagnostic that says that the entry is invalid and ignored.
 * @param diagnostics The diagnostics, with paths from the config object.
 * @param path The path of the entry.
 * @returns `true` when a diagnostic has the path as one of its own.
 */
export function pointsTo(
  diagnostics: readonly Diagnostic[],
  path: readonly (string | number)[]
): boolean {
  return diagnostics.some(({ paths }) =>
    paths.some(
      (diagnosticPath) =>
        diagnosticPath.length === path.length &&
        startsWith(diagnosticPath, path)
    )
  );
}

/**
 * Tells whether an error is about an entry of the config or about anything inside it.
 * @param diagnostics The diagnostics, with paths from the config object.
 * @param path The path of the entry.
 * @returns `true` when a diagnostic with the `error` level has a path that starts with the given one.
 */
export function hasErrorUnder(
  diagnostics: readonly Diagnostic[],
  path: readonly (string | number)[]
): boolean {
  return diagnostics.some(
    ({ level, paths }) =>
      level === "error" &&
      paths.some((diagnosticPath) => startsWith(diagnosticPath, path))
  );
}

/**
 * Tells whether the rules of the plugin can run.
 * @param diagnostics The diagnostics, with paths from the config object.
 * @returns `false` when an error is about the `rules`, such as an entry whose options fail the schema: ESLint rejects the config, so no dependency is evaluated.
 */
export function areRulesValid(diagnostics: readonly Diagnostic[]): boolean {
  return !hasErrorUnder(diagnostics, ["rules"]);
}
