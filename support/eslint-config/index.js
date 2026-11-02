import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
// eslint-disable-next-line import/no-unresolved
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
// eslint-disable-next-line import/no-unresolved
import typescriptParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import pluginJest from "eslint-plugin-jest";
// eslint-disable-next-line import/no-unresolved
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

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
    "jest/prefer-lowercase-title": [2, { ignoreTopLevelDescribe: true }],
  },
};

export const ignores = {
  ignores: [
    "**/node_modules/**",
    ".husky/**",
    "pnpm-lock.yaml",
    "**/dist/**",
    "build/**",
    "reports/**",
    ".stryker-tmp/**",
  ],
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
    ...importPlugin.flatConfigs["typescript"].rules,
    ...js.configs.recommended.rules,
    ...eslintConfigPrettier.rules,
    ...eslintPluginPrettierRecommended.rules,
    camelcase: [2, { properties: "never" }],
    "no-redeclare": [2],
    "no-console": [2, { allow: ["warn", "error"] }],
    "no-shadow": [2, { builtinGlobals: true, hoist: "all" }],
    "no-undef": [2],
    "no-unused-vars": [
      2,
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: false,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "import/no-named-as-default-member": [2],
    "import/no-named-as-default": [2],
    "import/no-namespace": [
      "error",
      {
        allowComputed: false,
      },
    ],
    "import/no-unresolved": [2],
    "import/order": [
      2,
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: {
          order:
            "asc" /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */,
          caseInsensitive: true /* ignore case. Options: [true, false] */,
        },
      },
    ],
    "import/extensions": [2, "never"],
    "prettier/prettier": [
      2,
      {
        trailingComma: "es5",
      },
    ],
  },
};

export const jsdocConfig = {
  files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.jsx", "**/*.ts", "**/*.tsx"],
  plugins: {
    jsdoc,
  },
  rules: {
    "jsdoc/check-param-names": [2],
    "jsdoc/require-param": [2],
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
  files: ["**/*.ts", "**/*.tsx"],
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
    "no-redeclare": 0,
    "@typescript-eslint/no-redeclare": 2,
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": [
      2,
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: false,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-unused-expressions": [
      1,
      { allowShortCircuit: true, allowTernary: true },
    ],
    "@typescript-eslint/consistent-type-imports": [
      2,
      {
        prefer: "type-imports",
        disallowTypeAnnotations: true,
        fixStyle: "separate-type-imports",
      },
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

export const disableExtensionsInEslintConfig = {
  files: ["eslint.config.js", "eslint.config.cjs", "eslint.config.mjs"],
  rules: {
    "import/extensions": [0],
  },
};

export const reactConfig = {
  files: ["**/*.{jsx,mjsx,ts,tsx,mtsx}"],
  ...reactPlugin.configs.flat.recommended,
  languageOptions: {
    ...reactPlugin.configs.flat.recommended.languageOptions,
    globals: {
      ...globals.browser,
    },
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    ...reactPlugin.configs.flat.recommended.rules,
    "react/react-in-jsx-scope": [0],
  },
};

export const reactHooksConfig = {
  files: ["**/*.{jsx,mjsx,ts,tsx,mtsx}"],
  ...reactHooksPlugin.configs.flat.recommended,
};

const NODE_GLOBALS = [
  "process",
  "require",
  "Buffer",
  "global",
  "__dirname",
  "__filename",
  "clearImmediate",
  "exports",
  "module",
  "setImmediate",
];

/**
 * Returns the config of the sources of a package that runs in browsers, which forbids the Node.js globals because browsers do not define them.
 * @param {string} hint What to do instead of reading the global, appended to the error message.
 * @returns {object} The config.
 */
export function createBrowserConfig(hint) {
  return {
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.spec.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...NODE_GLOBALS.map((name) => ({
          name,
          message: `It is not defined in browsers. ${hint}`,
        })),
      ],
    },
  };
}

// Rules of the sonarjs recommended config that the "Sonar way comprehensive" profile of the SonarCloud projects does not run
const SONARJS_RULES_NOT_IN_SONARCLOUD = [
  "argument-type",
  "array-callback-without-return",
  "avoid-mutating-nested-properties-of-shallow-clones",
  "different-types-comparison",
  "function-return-type",
  "future-reserved-words",
  "in-operator-type-error",
  "inconsistent-function-call",
  "no-extra-arguments",
  "no-implicit-global",
  "no-trivial-assertions",
  "no-unused-vars",
  "null-dereference",
  "prefer-native-axios-alternative",
  "prefer-native-jquery-alternative",
  "prefer-single-boolean-return",
  "super-linear-regex",
  "table-header-reference",
  "updated-const-var",
];

// Rules whose findings are intentional here and are accepted in SonarCloud instead: the packages read their own deprecated APIs to support legacy configurations, keep deprecated type aliases public, and mark pending work with TODO comments
const SONARJS_RULES_ACCEPTED_IN_SONARCLOUD = [
  "deprecation",
  "redundant-type-aliases",
  "todo-tag",
];

/**
 * The rules of SonarCloud that eslint-plugin-sonarjs implements, so that lint reports their issues before the analysis does.
 */
export const sonarjsConfig = {
  files: ["**/*.js", "**/*.cjs", "**/*.mjs", "**/*.jsx", "**/*.ts", "**/*.tsx"],
  ...sonarjs.configs.recommended,
  rules: {
    ...sonarjs.configs.recommended.rules,
    ...Object.fromEntries(
      [
        ...SONARJS_RULES_NOT_IN_SONARCLOUD,
        ...SONARJS_RULES_ACCEPTED_IN_SONARCLOUD,
      ].map((rule) => [`sonarjs/${rule}`, 0])
    ),
  },
};

export const defaultConfigWithoutTypescript = [
  ignores,
  jsonConfig,
  jsoncConfig,
  markdownConfig,
  jsBaseConfig,
  jsdocConfig,
  commonJsConfig,
  disableExtensionsInEslintConfig,
  sonarjsConfig,
];

export default [...defaultConfigWithoutTypescript, typescriptConfig];
