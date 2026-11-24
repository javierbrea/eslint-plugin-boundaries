import type { ConfigAnalysis } from "@boundaries/analysis";
import { SETTINGS } from "@boundaries/config";

import { SETTINGS_KEY } from "./engine.constants";
import type { ConfigProblem } from "./engine.types";
import { getRangeOf } from "./locations";
import type { ConfigRead } from "./parseConfig.types";

/**
 * Warns that the playground may not read statements as ESLint does, when the analysis says so of the dependency nodes of the config.
 * @param config The config as written.
 * @param analysis The analysis of the config, whose `dependencyNodesReadAsESLint` says whether the analysis reads statements through the dependency nodes of the settings as ESLint does: false when a node has a selector that is not built-in, which the analysis does not run, or when the built-in selectors of a syntax and import kind do not all have the same node, while it reads every statement of them through one node.
 * @returns A warning at the `boundaries/additional-dependency-nodes` setting when the analysis does not read the dependency nodes as ESLint does, and none otherwise. Only that setting causes it, because `boundaries/dependency-nodes` adds every built-in selector of a syntax with the same `name` and `kind`, and the playground cannot say which statements are read differently without parsing the code.
 */
export function getAdditionalNodesProblems(
  config: ConfigRead,
  analysis: Pick<ConfigAnalysis, "dependencyNodesReadAsESLint">
): ConfigProblem[] {
  if (analysis.dependencyNodesReadAsESLint) {
    return [];
  }

  const path = [SETTINGS_KEY, SETTINGS.ADDITIONAL_DEPENDENCY_NODES];
  return [
    {
      level: "warning",
      title: `The playground may not read statements as ESLint does with "${SETTINGS.ADDITIONAL_DEPENDENCY_NODES}".`,
      detail:
        "It runs only the built-in selectors, and reads every statement of a syntax and import kind through one node, so a statement that another selector reads, or that the built-in selectors of its syntax and import kind read through different nodes or leave out, is not checked as ESLint checks it.",
      links: [],
      path,
      range: getRangeOf(config.ast, path),
      source: "config",
    },
  ];
}
