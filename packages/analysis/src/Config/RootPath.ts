import { SETTINGS } from "@boundaries/config";

/** A path that starts at the root of a file system: `/`, `\`, or a drive letter on Windows */
const ABSOLUTE_PATH = /^(?:[/\\]|[A-Za-z]:[/\\])/;

/** The root of the project, which `@boundaries/elements` takes as no root path: the paths of the project are already relative to it */
const PROJECT_ROOT = "";

/**
 * Resolves the `boundaries/root-path` setting against the root of the project, as the plugin resolves it against the working directory of ESLint, where `eslint.config.js` is. The paths of the project are relative to its root, so the root path is too.
 * @param settings The settings, as written.
 * @returns The root path, relative to the root of the project, for the `rootPath` option of `normalizeConfig`. It is an empty string for the root of the project, which `@boundaries/elements` takes as no root path. That is the root path when the setting is not a string, as the plugin takes the working directory then, and when it is absolute or above the root of the project, such as `..`, because the project has nothing above its root: the project is the one at that path. With a root path above the working directory, the plugin describes every file as inside it, and its paths start with the folders in between, which the project has no names for.
 */
export function resolveRootPath(settings: unknown): string {
  const setting =
    typeof settings === "object" && settings !== null
      ? (settings as Record<string, unknown>)[SETTINGS.ROOT_PATH]
      : undefined;

  if (typeof setting !== "string" || ABSOLUTE_PATH.test(setting)) {
    return PROJECT_ROOT;
  }

  const segments: string[] = [];
  for (const segment of setting.split(/[/\\]/)) {
    if (segment === "..") {
      if (segments.length === 0) {
        return PROJECT_ROOT;
      }
      segments.pop();
    } else if (segment !== "" && segment !== ".") {
      segments.push(segment);
    }
  }
  return segments.join("/");
}
