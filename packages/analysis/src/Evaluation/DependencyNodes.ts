import { SETTINGS } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";

/**
 * Finds the node kinds that the analysis reads from the dependency nodes of the settings.
 * @param settings The normalized settings, whose `dependencyNodes` hold the selectors of `boundaries/dependency-nodes` followed by the valid ones of `boundaries/additional-dependency-nodes`.
 * @returns The names of the node kinds, such as `require`, of which the nodes hold at least one built-in selector, with the same `selector` and the same `name`. The plugin visits every selector and passes the `name` of its node as the node kind, and the analysis cannot run a selector: it reads a syntax only through the built-in selectors, so a selector of an additional node that is not one of them, whatever its name is, reads nothing.
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
