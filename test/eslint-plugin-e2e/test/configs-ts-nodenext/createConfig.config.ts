// NOTE: This config is not executed in any test. It checks that the `nodenext` workaround of the TypeScript Support guide type-checks: with `nodenext`, the default imports of the plugin and its configs are typed as `{ default: ... }`, so the guide imports them from `/config`
import {
  createConfig,
  recommended,
  strict,
} from "@boundaries/eslint-plugin/config";
import type { Config, Rules } from "@boundaries/eslint-plugin/config";
import type { Linter } from "eslint";

const rules: Rules = {
  ...strict.rules,
};

const config: Config = {
  files: ["**/*.ts"],
  settings: {
    ...recommended.settings,
    "boundaries/elements": [{ type: "module", pattern: "src/modules/*" }],
  },
  rules: {
    ...recommended.rules,
  },
};

const configs: Linter.Config[] = [
  createConfig(config),
  createConfig({ ...config, rules }),
];

export default configs;
