module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
  },
  extends: ["prettier"],
  plugins: ["prettier", "eslint-plugin-local-rules"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        printWidth: 99,
        parser: "flow",
      },
    ],
    "no-shadow": [2, { builtinGlobals: true, hoist: "all" }],
    "no-undef": "error",
    "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: false }],
  },
  overrides: [
    {
      files: ["src/**/*.js"],
      settings: {
        "boundaries/dependency-nodes": ["require", "import", "dynamic-import", "export"],
        "boundaries/elements": [
          {
            type: "config",
            mode: "file",
            pattern: ["src/configs/*.js", "(package.json)"],
            capture: ["name"],
          },
          {
            type: "constants",
            mode: "file",
            pattern: "src/constants/*.js",
            capture: ["name"],
          },
          {
            type: "core",
            mode: "file",
            pattern: "src/core/*.js",
            capture: ["name"],
          },
          {
            type: "helper",
            mode: "file",
            pattern: "src/helpers/*.js",
            capture: ["name"],
          },
          {
            type: "rule",
            mode: "file",
            pattern: "src/rules/*.js",
            capture: ["name"],
          },
          {
            type: "rule-factory",
            mode: "file",
            pattern: "src/rules-factories/*.js",
            capture: ["name"],
          },
          {
            type: "plugin",
            mode: "full",
            pattern: ["src/index.js"],
          },
        ],
      },
      rules: {
        "prettier/prettier": [
          "error",
          {
            printWidth: 99,
            parser: "flow",
          },
        ],
        "no-shadow": [2, { builtinGlobals: true, hoist: "all" }],
        "no-undef": "error",
        "no-unused-vars": [
          "error",
          { vars: "all", args: "after-used", ignoreRestSiblings: false },
        ],
        "local-rules/boundaries/element-types": [
          2,
          {
            default: "disallow",
            rules: [
              {
                from: "plugin",
                allow: ["constants", "config", "rule"],
              },
              {
                from: "config",
                allow: ["constants", "config"],
              },
              {
                from: "constants",
                allow: ["constants"],
              },
              {
                from: "core",
                allow: ["constants", "helper", "core"],
              },
              {
                from: "helper",
                allow: ["constants", "helper"],
              },
              {
                from: "rule",
                allow: ["constants", "helper", "core", "rule-factory"],
              },
              {
                from: "rule-factory",
                allow: ["constants", "helper", "core"],
              },
            ],
          },
        ],
        "local-rules/boundaries/no-unknown": [2],
        "local-rules/boundaries/no-unknown-files": [2],
      },
    },
  ],
};
