import {
  defaultConfigWithoutTypescript,
  typescriptConfig,
  jestConfig,
} from "../../support/eslint-config/index.js";

export default [
  ...defaultConfigWithoutTypescript,
  jestConfig,
  {
    ...typescriptConfig,
    languageOptions: {
      ...typescriptConfig.languageOptions,
      parserOptions: {
        project: "./tsconfig.eslint.json",
      },
    },
  },
  {
    // The browser build runs where Node.js globals are not defined
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.spec.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
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
        ].map((name) => ({
          name,
          message:
            "It is not defined in browsers. Read it from globalThis, like the helpers in src/Shared/Platform.ts do.",
        })),
      ],
    },
  },
];
