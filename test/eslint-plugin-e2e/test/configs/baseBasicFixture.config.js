/** @type {import('eslint').Linter.Config} */
export default {
  files: ["**/*.js", "**/*.ts"],
  settings: {
    "boundaries/elements": [
      {
        type: "module",
        pattern: "src/modules/*",
        capture: ["module"],
      },
      {
        type: "component",
        pattern: "src/components/*",
        capture: ["component"],
      },
    ],
    "boundaries/ignore": ["**/ignored/**/*.js"],
  },
  /** @type {import('@boundaries/eslint-plugin').Rules} */
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        policies: [
          {
            from: {
              element: {
                type: "module",
              },
            },
            allow: [
              {
                to: { element: { type: "component" } },
              },
            ],
          },
        ],
      },
    ],
  },
};
