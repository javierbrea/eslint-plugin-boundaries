import type { Linter } from "eslint";
import plugin from "../index";
import { isRuleShortName, isSettingsKey } from "../Settings";
import type { Config, Rules } from "../Shared";
import { PLUGIN_NAME } from "../Shared";

import recommendedConfig from "./Recommended";
import strictConfig from "./Strict";

export * from "../Public";

/**
 * The full ESLint config object returned by createConfig, including the plugins field with the boundaries plugin registered.
 * Configuration object returned by createConfig.
 * We use a public alias to keep the exported type nameable and portable.
 * This helps prevent TS2742 errors caused by inferred types leaking internal ESLint type paths.
 */
export type ConfigObject = Linter.Config;

/**
 * Rewrites rule keys to the effective plugin namespace used by `createConfig`.
 *
 * It accepts rules prefixed either with the default plugin name (`boundaries`)
 * or with the custom plugin name passed to `createConfig`.
 *
 * @param pluginName - Plugin namespace to enforce in output rule keys.
 * @param rules - Input rule entries from the user config.
 * @returns Rules object normalized to the requested plugin namespace.
 */
function renamePluginRules<PluginName extends string = typeof PLUGIN_NAME>(
  pluginName: string,
  rules?: Config["rules"]
): Rules<PluginName> {
  if (!rules) {
    return {};
  }
  const allowedPrefixes = new Set([PLUGIN_NAME, pluginName]);
  // Return the same rules objects, but converting plugin default rule keys with provided plugin name
  return Object.entries(rules).reduce((acc, [key, value]) => {
    if (!key.includes("/")) {
      throw new Error(
        `Invalid rule key "${key}". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "${PLUGIN_NAME}/", or with the provided plugin name "${pluginName}/".`
      );
    }
    const splittedRuleKey = key.split("/");
    const rulePrefix = splittedRuleKey[0];
    const ruleName = splittedRuleKey[1];
    if (!allowedPrefixes.has(rulePrefix)) {
      throw new Error(
        `Invalid rule key "${key}". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "${PLUGIN_NAME}/", or with the provided plugin name "${pluginName}/".`
      );
    }
    if (!isRuleShortName(ruleName)) {
      throw new Error(
        `Invalid rule name "${ruleName}". When using createConfig, all rules must belong to eslint-plugin-boundaries.`
      );
    }
    let newKey: keyof Rules<PluginName>;
    if (rulePrefix === PLUGIN_NAME) {
      const suffix = key.slice(PLUGIN_NAME.length + 1);
      newKey = `${pluginName}/${suffix}` as keyof Rules<PluginName>;
    } else {
      newKey = key as keyof Rules<PluginName>;
    }
    acc[newKey] = value as Rules<PluginName>[typeof newKey];
    return acc;
  }, {} as Rules<PluginName>);
}

/**
 * Returns an ESLint config object with the boundaries plugin registered, providing default JS and TS file patterns
 * and enforcing valid types for settings and rules. Supports renaming the plugin. Rules can be prefixed with either
 * the original plugin name or the provided plugin name.
 *
 * @param config - ESLint config object without the plugins field.
 * @param name - The name of the plugin to register. Defaults to "boundaries".
 * @returns {ConfigObject} The ESLint config object with the boundaries plugin registered and the provided config merged in.
 * @throws {Error} If settings or rules are not from eslint-plugin-boundaries.
 *
 * @example
 * ```ts
 * import { createConfig, recommended } from "eslint-plugin-boundaries/config";
 *
 * const config = createConfig({
 *   settings: {
 *     ...recommended.settings,
 *     "boundaries/elements": [],
 *     "boundaries/ignore": ["ignored/*.js"],
 *   },
 *   rules: {
 *     ...recommended.rules,
 *     "boundaries/dependencies": ["error", { default: "disallow" }],
 *   }
 * });
 *
 * export default [config];
 * ```
 */
export function createConfig<PluginName extends string = typeof PLUGIN_NAME>(
  config: Omit<Config<PluginName> | Config, "plugins">,
  name: PluginName = PLUGIN_NAME as PluginName
): ConfigObject {
  // Annotate plugins as Record<string, object> to prevent TypeScript from inferring
  // the internal plugin type, which would expose ESLint internal generic types
  const pluginsRegistration: Record<string, object> = {
    [name]: plugin,
  };

  if (Object.hasOwn(config, "plugins")) {
    throw new Error(
      "The 'plugins' field is managed by createConfig and should not be provided in the config argument."
    );
  }

  if (Object.hasOwn(config, "settings")) {
    const settings = (config as Config).settings;
    if (settings) {
      for (const key of Object.keys(settings)) {
        if (!isSettingsKey(key)) {
          throw new Error(
            `Invalid settings key "${key}". When using createConfig, all settings keys must belong to eslint-plugin-boundaries.`
          );
        }
      }
    }
  }

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
    rules: renamePluginRules(name, config.rules),
  };
}

export const recommended = recommendedConfig;
export const strict = strictConfig;
