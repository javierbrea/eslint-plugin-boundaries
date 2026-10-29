import { DIAGNOSTIC_LEVELS_MAP } from "./Diagnostics.types";
import type {
  Diagnostic,
  DiagnosticLevel,
  DiagnosticPath,
} from "./Diagnostics.types";

/**
 * Determines whether two diagnostic paths are equal.
 * @param pathA The first path.
 * @param pathB The second path.
 * @returns True if both paths have the same segments, false otherwise.
 */
function isSamePath(pathA: DiagnosticPath, pathB: DiagnosticPath): boolean {
  return (
    pathA.length === pathB.length &&
    pathA.every((segment, index) => segment === pathB[index])
  );
}

/**
 * Collects diagnostics in order, keeping each one once: a diagnostic with the title and the detail of a previous one only adds its paths to it, as the ESLint plugin prints each warning once.
 */
export class DiagnosticsBuilder {
  private readonly _diagnostics: Diagnostic[] = [];
  private readonly _diagnosticsByKey = new Map<string, Diagnostic>();

  /**
   * Adds a diagnostic, or adds its paths to a previous one with the same title and detail. Each path is kept once.
   * @param level The level of the diagnostic.
   * @param title The title of the diagnostic.
   * @param detail The detail of the diagnostic.
   * @param paths The paths of the affected entries. Without them, the diagnostic concerns the whole input, whose path is `[]`.
   */
  public add(
    level: DiagnosticLevel,
    title: string,
    detail?: string,
    paths: DiagnosticPath[] = [[]]
  ): void {
    const key = `${title}-${detail}`;
    let diagnostic = this._diagnosticsByKey.get(key);
    if (!diagnostic) {
      diagnostic = {
        level,
        title,
        ...(detail === undefined ? {} : { detail }),
        paths: [],
      };
      this._diagnosticsByKey.set(key, diagnostic);
      this._diagnostics.push(diagnostic);
    }
    for (const path of paths) {
      if (
        !diagnostic.paths.some((existingPath) => isSamePath(existingPath, path))
      ) {
        diagnostic.paths.push(path);
      }
    }
  }

  /**
   * Adds an error diagnostic.
   * @param title The title of the diagnostic.
   * @param detail The detail of the diagnostic.
   * @param paths The paths of the affected entries.
   */
  public error(title: string, detail?: string, paths?: DiagnosticPath[]): void {
    this.add(DIAGNOSTIC_LEVELS_MAP.ERROR, title, detail, paths);
  }

  /**
   * Adds a warning diagnostic.
   * @param title The title of the diagnostic.
   * @param detail The detail of the diagnostic.
   * @param paths The paths of the affected entries.
   */
  public warning(
    title: string,
    detail?: string,
    paths?: DiagnosticPath[]
  ): void {
    this.add(DIAGNOSTIC_LEVELS_MAP.WARNING, title, detail, paths);
  }

  /**
   * Adds a deprecation diagnostic.
   * @param title The title of the diagnostic.
   * @param detail The detail of the diagnostic.
   * @param paths The paths of the affected entries.
   */
  public deprecation(
    title: string,
    detail?: string,
    paths?: DiagnosticPath[]
  ): void {
    this.add(DIAGNOSTIC_LEVELS_MAP.DEPRECATION, title, detail, paths);
  }

  /**
   * Adds diagnostics found in a part of the input, prefixing their paths with the path of that part.
   * @param diagnostics The diagnostics to add.
   * @param prefix The path of the part of the input, from the root of this builder's input.
   */
  public addAll(diagnostics: Diagnostic[], prefix: DiagnosticPath = []): void {
    for (const diagnostic of diagnostics) {
      this.add(
        diagnostic.level,
        diagnostic.title,
        diagnostic.detail,
        diagnostic.paths.map((path) => [...prefix, ...path])
      );
    }
  }

  /**
   * Returns the diagnostics added so far, in order.
   * @returns The diagnostics.
   */
  public build(): Diagnostic[] {
    return this._diagnostics.map((diagnostic) => ({
      ...diagnostic,
      paths: [...diagnostic.paths],
    }));
  }
}
