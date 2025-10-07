import json from "@eslint/json";
import markdown from "@eslint/markdown";
import prettier from "eslint-plugin-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier";
import js from "@eslint/js";
import globals from "globals";
// eslint-disable-next-line import/no-unresolved
import typescriptParser from "@typescript-eslint/parser";
// eslint-disable-next-line import/no-unresolved
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import pluginJest from "eslint-plugin-jest";
import importPlugin from "eslint-plugin-import";

export const jestConfig = {
  files: ["**/*.spec.js", "**/*.test.js", "**/*.spec.ts", "**/*.test.ts"],
  plugins: {
    jest: pluginJest,
  },
  ...pluginJest.configs["flat/recommended"],
  languageOptions: {
    globals: pluginJest.environments.globals.globals,
  },
  rules: {
    ...pluginJest.configs["flat/all"].rules,
    "jest/no-disabled-tests": "error",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "error",
    "jest/valid-expect": "error",
    "jest/prefer-strict-equal": [0],
    "jest/prefer-importing-jest-globals": [0],
    "jest/prefer-expect-assertions": [0],
    "jest/no-hooks": [0],
    "jest/prefer-called-with": [0],
    "jest/require-to-throw-message": [0],
    "jest/unbound-method": [0],
  },
};

export const ignores = {
  ignores: ["node_modules/**", ".husky/**", "pnpm-lock.yaml", "dist/**"],
};

export const jsonConfig = {
  files: ["**/*.json"],
  ignores: ["nx.json", "**/project.json"],
  language: "json/json",
  plugins: {
    json,
  },
  rules: {
    "json/no-duplicate-keys": "error",
    "json/no-empty-keys": "error",
  },
};

export const jsoncConfig = {
  files: ["**/*.jsonc", "nx.json", "**/project.json"],
  language: "json/jsonc",
  plugins: {
    json,
  },
  rules: {
    "json/no-duplicate-keys": "error",
    "json/no-empty-keys": "error",
  },
};

export const markdownConfig = {
  files: ["**/*.md"],
  plugins: {
    markdown,
  },
  language: "markdown/commonmark",
  rules: {
    "markdown/no-html": [0],
  },
};

export const jsBaseConfig = {
  files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.jsx", "**/*.ts", "**/*.tsx"],
  plugins: {
    prettier,
    import: importPlugin,
  },
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      ...globals.node,
    },
  },
  rules: {
    ...importPlugin.flatConfigs.recommended.rules,
    ...js.configs.recommended.rules,
    ...eslintConfigPrettier.rules,
    ...eslintPluginPrettierRecommended.rules,
    camelcase: [2, { properties: "never" }],
    "no-console": [2, { allow: ["warn", "error"] }],
    "no-shadow": [2, { builtinGlobals: true, hoist: "all" }],
    "no-undef": [2],
    "no-unused-vars": [
      2,
      { vars: "all", args: "after-used", ignoreRestSiblings: false },
    ],
  },
};

export const commonJsConfig = {
  files: ["**/*.cjs"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "commonjs",
  },
};

export const typescriptConfig = {
  files: ["**/*.ts"],
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      projectService: true,
    },
  },
  plugins: {
    "@typescript-eslint": typescriptEslintPlugin,
  },
  rules: {
    ...typescriptEslintPlugin.configs?.recommended?.rules,
    "@typescript-eslint/no-unused-expressions": [
      1,
      { allowShortCircuit: true, allowTernary: true },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {
        extensions: [".ts", ".tsx"],
        alwaysTryTypes: true,
      },
      node: true,
    },
  },
};

export const defaultConfigWithoutTypescript = [
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  commonJsConfig,
];

export default [...defaultConfigWithoutTypescript, typescriptConfig];
