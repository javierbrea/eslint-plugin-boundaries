import type { Linter } from "eslint";

import { PLUGIN_NAME } from "../constants/plugin";
import plugin from "../index";

import type { PluginBoundaries, Config, Rules } from "./Config.types";
import recommendedConfig from "./recommended";
import strictConfig from "./strict";

type PluginFullConfig<PluginName extends string = typeof PLUGIN_NAME> = {
  plugins: Record<PluginName, PluginBoundaries>;
  files: Linter.Config["files"];
} & Omit<Config<PluginName>, "plugins">;

function renamePluginRules<PluginName extends string = typeof PLUGIN_NAME>(
  rules: Config["rules"],
  pluginName: PluginName,
): Rules<PluginName> {
  if (!rules) {
    return {};
  }
  // Return the same rules objects, but converting plugin default rule keys with provided plugin name
  return Object.entries(rules).reduce((acc, [key, value]) => {
    if (key.startsWith(`${PLUGIN_NAME}/`)) {
      const newKey =
        `${pluginName}/${key.slice(`${PLUGIN_NAME}/`.length)}` as keyof Rules<PluginName>;
      acc[newKey] = value as Rules<PluginName>[typeof newKey];
    }
    return acc;
  }, {} as Rules<PluginName>);
}

export function createConfig<PluginName extends string = typeof PLUGIN_NAME>(
  config: Config<PluginName> | Config,
  name: PluginName = PLUGIN_NAME as PluginName,
): PluginFullConfig<PluginName> {
  const pluginsRegistration = {
    [name]: plugin as PluginBoundaries,
  } as Record<PluginName, PluginBoundaries>;
  return {
    files: [
      "**/*.js",
      "**/*.jsx",
      "**/*.ts",
      "**/*.tsx",
      "**/*.mjs",
      "**/*.cjs",
    ],
    ...config,
    plugins: pluginsRegistration,
    rules: renamePluginRules(config.rules ?? {}, name),
  };
}

export const recommended = recommendedConfig;
export const strict = strictConfig;
