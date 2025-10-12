import { createConfig } from "eslint-plugin-boundaries/config";
import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

const boundariesConfig = createConfig(
  {
    settings: {
      ...recommendedBoundariesConfig.settings,
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
      ...recommendedBoundariesConfig.rules,
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
  "newName",
);

export default [boundariesConfig];
