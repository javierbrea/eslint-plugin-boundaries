import { SETTINGS } from "@boundaries/config";

/** A path that starts at the root of a file system: `/`, `\`, or a drive letter on Windows */
const ABSOLUTE_PATH = /^(?:[/\\]|[A-Za-z]:[/\\])/;

/** A root path above the root of the sketch. No path of the sketch starts with it, because a path of the sketch has no `..` segment, so every file is outside it */
const ABOVE_THE_SKETCH = "..";

/**
 * Resolves the `boundaries/root-path` setting against the root of the sketch, as the plugin resolves it against the working directory of ESLint, where `eslint.config.js` is. The paths of the sketch are relative to its root, so the root path is too.
 * @param settings The settings, as written.
 * @returns The root path, relative to the root of the sketch, for the `rootPath` option of `normalizeConfig`. It is an empty string for the root of the sketch, which `@boundaries/elements` takes as no root path: the paths are already relative to it. That is the root path when the setting is not a string, as the plugin takes the working directory then, and when it is absolute, because the sketch has nothing above its root: the sketch is the project at that path.
 */
export function resolveRootPath(settings: unknown): string {
  const setting =
    typeof settings === "object" && settings !== null
      ? (settings as Record<string, unknown>)[SETTINGS.ROOT_PATH]
      : undefined;

  if (typeof setting !== "string" || ABSOLUTE_PATH.test(setting)) {
    return "";
  }

  const segments: string[] = [];
  for (const segment of setting.split(/[/\\]/)) {
    if (segment === "..") {
      if (segments.length === 0) {
        return ABOVE_THE_SKETCH;
      }
      segments.pop();
    } else if (segment !== "" && segment !== ".") {
      segments.push(segment);
    }
  }
  return segments.join("/");
}
