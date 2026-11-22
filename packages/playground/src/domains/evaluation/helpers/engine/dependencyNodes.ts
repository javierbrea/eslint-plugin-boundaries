import { SETTINGS, normalizeSettings } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";

import { SETTINGS_KEY } from "./engine.constants";
import type { ConfigProblem } from "./engine.types";
import { getRangeOf } from "./locations";
import type { ConfigRead } from "./parseConfig.types";

/**
 * Reads the `boundaries/dependency-nodes` setting as written.
 * @param config The config as written.
 * @returns The value of the setting, or `undefined` when the settings are not an object.
 */
function readDependencyNodes(config: ConfigRead): unknown {
  const settings = config.value[SETTINGS_KEY];
  return typeof settings === "object" &&
    settings !== null &&
    !Array.isArray(settings)
    ? (settings as Record<string, unknown>)[SETTINGS.DEPENDENCY_NODES]
    : undefined;
}

/**
 * Warns about the additional dependency nodes, whose selectors the playground does not run.
 * @param config The config as written.
 * @param settings The normalized settings, which hold the valid additional nodes after the nodes of `boundaries/dependency-nodes`.
 * @returns A warning at the `boundaries/additional-dependency-nodes` setting when it keeps at least one valid node, and none otherwise: an invalid node has the diagnostic of `@boundaries/config`. A statement that only an additional selector reads is not checked as ESLint checks it, and the playground cannot say which statements those are without parsing the code.
 */
export function getAdditionalNodesProblems(
  config: ConfigRead,
  settings: SettingsNormalized
): ConfigProblem[] {
  // The nodes of `boundaries/dependency-nodes` alone, to count what the additional setting adds to them
  const { dependencyNodes } = normalizeSettings({
    [SETTINGS.DEPENDENCY_NODES]: readDependencyNodes(config),
  }).value;
  if (settings.dependencyNodes.length === dependencyNodes.length) {
    return [];
  }

  const path = [SETTINGS_KEY, SETTINGS.ADDITIONAL_DEPENDENCY_NODES];
  return [
    {
      level: "warning",
      title: `The playground does not run the selectors of "${SETTINGS.ADDITIONAL_DEPENDENCY_NODES}".`,
      detail: `A statement that only one of them reads is not checked as ESLint checks it: the playground reads a statement only through the built-in selectors of "${SETTINGS.DEPENDENCY_NODES}".`,
      links: [],
      path,
      range: getRangeOf(config.ast, path),
      source: "config",
    },
  ];
}
