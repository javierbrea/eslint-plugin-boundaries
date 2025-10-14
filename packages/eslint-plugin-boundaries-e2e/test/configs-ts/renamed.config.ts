import type { Config, Rules, Settings } from "eslint-plugin-boundaries";
import boundaries from "eslint-plugin-boundaries";
// import recommendedBoundariesConfig from "eslint-plugin-boundaries/recommended";

export const invalidRule: Rules<"customBoundaries"> = {
  // @ts-expect-error Testing that the rule is not valid for the plugin because it has been renamed
  "boundaries/element-types": 0,
};

export const invalidSetting: Settings = {
  // @ts-expect-error Testing that the setting is not valid for the plugin because it has been renamed
  "foo/elements": [],
};

const boundariesConfig: Config<"customBoundaries"> = {
  plugins: {
    customBoundaries: boundaries,
    // ts-expect-error Testing that the setting is not valid for the plugin because it has been renamed
    boundaries: boundaries,
  },
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
  rules: {
    "customBoundaries/element-types": [
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
};

export default [boundariesConfig];
