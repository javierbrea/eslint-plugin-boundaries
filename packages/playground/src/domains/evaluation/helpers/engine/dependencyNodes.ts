import { SETTINGS, normalizeSettings } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";

import { SETTINGS_KEY } from "./engine.constants";
import type { ConfigProblem } from "./engine.types";
import { getRangeOf } from "./locations";
import type { ConfigRead } from "./parseConfig.types";
import { readSettings } from "./writtenConfig";

/**
 * Finds the node kinds that the playground reads from the dependency nodes of the settings.
 * @param settings The normalized settings, whose `dependencyNodes` hold the selectors of `boundaries/dependency-nodes` followed by the valid ones of `boundaries/additional-dependency-nodes`.
 * @returns The names of the node kinds, such as `require`, of which the nodes hold at least one built-in selector, with the same `selector` and the same `name`. The plugin visits every selector and passes the `name` of its node as the node kind, and the playground cannot run a selector: it reads a syntax only through the built-in selectors, so a selector of an additional node that is not one of them, whatever its name is, reads nothing.
 */
export function getReadNodeKinds(
  settings: SettingsNormalized
): ReadonlySet<string> {
  return new Set(
    Object.entries(SETTINGS.DEFAULT_DEPENDENCY_NODES)
      .filter(([, builtIn]) =>
        builtIn.some((builtInNode) =>
          settings.dependencyNodes.some(
            ({ selector, name: nodeName }) =>
              selector === builtInNode.selector && nodeName === builtInNode.name
          )
        )
      )
      .map(([kind]) => kind)
  );
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
    [SETTINGS.DEPENDENCY_NODES]:
      readSettings(config)[SETTINGS.DEPENDENCY_NODES],
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
