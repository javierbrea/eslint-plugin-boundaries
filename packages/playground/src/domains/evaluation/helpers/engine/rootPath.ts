import { SETTINGS } from "@boundaries/config";

/** A path that starts at the root of a file system: `/`, `\`, or a drive letter on Windows */
const ABSOLUTE_PATH = /^(?:[/\\]|[A-Za-z]:[/\\])/;

/** The root of the sketch, which `@boundaries/elements` takes as no root path: the paths of the sketch are already relative to it */
const SKETCH_ROOT = "";

/**
 * Resolves the `boundaries/root-path` setting against the root of the sketch, as the plugin resolves it against the working directory of ESLint, where `eslint.config.js` is. The paths of the sketch are relative to its root, so the root path is too.
 * @param settings The settings, as written.
 * @returns The root path, relative to the root of the sketch, for the `rootPath` option of `normalizeConfig`. It is an empty string for the root of the sketch, which `@boundaries/elements` takes as no root path. That is the root path when the setting is not a string, as the plugin takes the working directory then, and when it is absolute or above the root of the sketch, such as `..`, because the sketch has nothing above its root: the sketch is the project at that path. With a root path above the working directory, the plugin describes every file as inside it, and its paths start with the folders in between, which the sketch has no names for.
 */
export function resolveRootPath(settings: unknown): string {
  const setting =
    typeof settings === "object" && settings !== null
      ? (settings as Record<string, unknown>)[SETTINGS.ROOT_PATH]
      : undefined;

  if (typeof setting !== "string" || ABSOLUTE_PATH.test(setting)) {
    return SKETCH_ROOT;
  }

  const segments: string[] = [];
  for (const segment of setting.split(/[/\\]/)) {
    if (segment === "..") {
      if (segments.length === 0) {
        return SKETCH_ROOT;
      }
      segments.pop();
    } else if (segment !== "" && segment !== ".") {
      segments.push(segment);
    }
  }
  return segments.join("/");
}
