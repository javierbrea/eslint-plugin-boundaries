import { createConfig, recommended } from "@boundaries/eslint-plugin/config";

const boundariesConfig = createConfig(
  {
    settings: {
      ...recommended.settings,
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
    rules: {
      ...recommended.rules,
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: {
                type: "module",
              },
              allow: [
                {
                  to: { type: "component" },
                },
              ],
            },
          ],
        },
      ],
    },
  },
  "customBoundaries"
);

export default [boundariesConfig];
