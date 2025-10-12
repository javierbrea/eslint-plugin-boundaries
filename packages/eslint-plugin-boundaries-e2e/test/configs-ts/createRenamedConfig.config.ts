import { createConfig, recommended } from "eslint-plugin-boundaries/config";

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
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "module",
              allow: ["component"],
            },
          ],
        },
      ],
    },
  },
  "customBoundaries",
);

export default [boundariesConfig];
